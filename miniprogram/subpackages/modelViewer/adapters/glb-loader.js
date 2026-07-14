/**
 * GLB / glTF 模型加载器（自包含，无需 npm GLTFLoader）
 *
 * 在微信小程序中下载并解析 GLB 二进制模型文件。
 * 直接将 glTF 2.0 数据转换为 three.js 对象，无需外部依赖。
 *
 * 支持的 glTF 特性：
 *  - 三角形网格 (positions, normals, uvs, indices)
 *  - PBR Metallic/Roughness 材质（含纹理贴图）
 *  - 节点变换层级 (translation, rotation, scale, matrix)
 *  - 场景图 (scene graph)
 *  - 纹理图片（内嵌 bufferView 及外部 URI）
 *  - 采样器 (wrap/filter modes)
 */

var adapter = require('./weapp-adapter')
var downloadBinary = adapter.downloadBinary
var createImage = adapter.createImage

// ============================================================
//  工具函数
// ============================================================

/**
 * 将 ArrayBuffer 转为 base64 字符串（使用微信原生 API，回退到手动实现）
 */
function arrayBufferToBase64(buffer) {
  try {
    if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
      return wx.arrayBufferToBase64(buffer)
    }
  } catch (e) {
    console.warn('[glb-loader] wx.arrayBufferToBase64 failed, using manual base64:', e)
  }
  // 手动回退
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  // 分块处理，避免大数组导致栈溢出
  var chunkSize = 0x8000 // 32KB chunks
  for (var offset = 0; offset < len; offset += chunkSize) {
    var chunk = Math.min(chunkSize, len - offset)
    var s = ''
    for (var i = 0; i < chunk; i++) {
      s += String.fromCharCode(bytes[offset + i])
    }
    binary += s
  }
  return btoa(binary)
}

/**
 * 解析 URL（将相对路径拼接为绝对路径）
 */
function resolveUrl(relativeUrl, baseUrl) {
  // data: URL 直接返回
  if (/^(data:|https?:\/\/|wxfile:\/\/)/i.test(relativeUrl)) {
    return relativeUrl
  }
  // 去掉 baseUrl 最后的路径段
  var base = baseUrl.replace(/\/[^\/?#]*$/, '/')
  // 处理 ../ 和 ./
  while (/^\.\.\//.test(relativeUrl)) {
    relativeUrl = relativeUrl.substring(3)
    base = base.replace(/\/[^\/]+\/$/, '/').replace(/\/[^\/]+$/, '/')
  }
  if (/^\.\//.test(relativeUrl)) {
    relativeUrl = relativeUrl.substring(2)
  }
  return base + relativeUrl
}

// ============================================================
//  GLB 容器解析
// ============================================================

function parseGLBContainer(buffer) {
  if (buffer.byteLength < 12) throw new Error('GLB file too small')
  var header = new DataView(buffer)
  if (header.getUint32(0, true) !== 0x46546C67) throw new Error('Invalid GLB magic number')
  var version = header.getUint32(4, true)

  var offset = 12, json = null, bin = null
  while (offset < buffer.byteLength) {
    var chunkLength = header.getUint32(offset, true)
    var chunkType = header.getUint32(offset + 4, true)
    if (chunkType === 0x4E4F534A) {
      var jsonBytes = new Uint8Array(buffer, offset + 8, chunkLength)
      json = JSON.parse(new TextDecoder('utf-8').decode(jsonBytes))
    } else if (chunkType === 0x004E4942) {
      bin = buffer.slice(offset + 8, offset + 8 + chunkLength)
    }
    offset += 8 + chunkLength
  }
  return { json: json, bin: bin, version: version }
}

function downloadGLB(url) {
  return downloadBinary(url).then(parseGLBContainer)
}

// ============================================================
//  glTF → three.js 转换器（异步 — 支持纹理加载）
// ============================================================

function convertGLTF(THREE, glbData, baseUrl, canvas) {
  var json = glbData.json
  var bin = glbData.bin

  // ---- Accessor reader ----
  function readAccessor(accessorIndex) {
    var accessor = json.accessors[accessorIndex]
    var bufferView = json.bufferViews[accessor.bufferView]
    var byteOffset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0)
    var count = accessor.count
    var type = accessor.type
    var componentType = accessor.componentType

    var compCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type] || 1
    var compSize = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[componentType] || 4
    var stride = bufferView.byteStride || (compCount * compSize)
    var view = new DataView(bin)
    var result = []

    for (var i = 0; i < count; i++) {
      var element = []
      for (var c = 0; c < compCount; c++) {
        var off = byteOffset + i * stride + c * compSize
        var val
        if (componentType === 5126) val = view.getFloat32(off, true)         // FLOAT
        else if (componentType === 5125) val = view.getUint32(off, true)      // UINT32
        else if (componentType === 5123) val = view.getUint16(off, true)      // UINT16
        else if (componentType === 5122) val = view.getInt16(off, true)       // INT16
        else if (componentType === 5121) val = view.getUint8(off)             // UINT8
        else if (componentType === 5120) val = view.getInt8(off)              // INT8
        else val = view.getFloat32(off, true)
        element.push(val)
      }
      result.push(element)
    }
    if (type === 'SCALAR') return result.map(function (r) { return r[0] })
    return result
  }

  // ---- 图片加载（异步）----
  function loadImageAtIndex(imageIdx) {
    return new Promise(function (resolve, reject) {
      var imageDef = json.images[imageIdx]

      // 使用适配器的 createImage，传入 WebGL canvas（关键！canvas.createImage() 是真机纹理加载的核心 API）
      var img = createImage(canvas)

      img.onload = function () {
        console.log('[glb-loader] Image[' + imageIdx + '] onload fired')
        resolve(img)
      }
      img.onerror = function (err) {
        // 全面捕获错误信息
        var detail = 'unknown'
        try {
          if (err && typeof err === 'object') {
            detail = JSON.stringify(err)
          } else if (err && err.errMsg) {
            detail = err.errMsg
          } else if (typeof err === 'string') {
            detail = err
          }
        } catch (e) { detail = 'unserializable error' }
        console.error('[glb-loader] Image[' + imageIdx + '] load failed:', detail, 'mimeType:', imageDef.mimeType, 'hasBufferView:', imageDef.bufferView !== undefined)
        reject(new Error('Image[' + imageIdx + '] load failed: ' + detail))
      }

      console.log('[glb-loader] Image[' + imageIdx + '] src will be set, bufferView:', imageDef.bufferView, 'uri:', imageDef.uri)
      if (imageDef.bufferView !== undefined) {
        // ---- 内嵌纹理（GLB 二进制 chunk 中的 bufferView）----
        var bufferView = json.bufferViews[imageDef.bufferView]
        var byteOffset = bufferView.byteOffset || 0
        var byteLength = bufferView.byteLength
        var imageData = bin.slice(byteOffset, byteOffset + byteLength)
        var base64 = arrayBufferToBase64(imageData)
        var mimeType = imageDef.mimeType || 'image/png'
        img.src = 'data:' + mimeType + ';base64,' + base64
      } else if (imageDef.uri) {
        // ---- 外部纹理（URI）----
        if (/^data:/.test(imageDef.uri)) {
          // data URI
          img.src = imageDef.uri
        } else {
          // 相对路径，解析为完整 URL
          img.src = resolveUrl(imageDef.uri, baseUrl)
        }
      } else {
        reject(new Error('Image[' + imageIdx + '] has no bufferView or uri'))
      }
    })
  }

  // ---- 加载所有图片（逐个加载，失败不阻塞）----
  console.log('[glb-loader] Starting to load', (json.images && json.images.length) || 0, 'images...')
  var imageLoadPromises = []
  var loadedImages = []  // 按 images 数组索引
  var failedImageCount = 0

  if (json.images && json.images.length > 0) {
    for (var imgIdx = 0; imgIdx < json.images.length; imgIdx++) {
      ;(function (idx) {
        console.log('[glb-loader] Queueing image[' + idx + ']')
        imageLoadPromises.push(
          loadImageAtIndex(idx).then(
            function (img) {
              console.log('[glb-loader] Image[' + idx + '] loaded successfully')
              loadedImages[idx] = img
              return true
            },
            function (err) {
              // 纹理加载失败不阻止模型渲染，降级为纯色
              failedImageCount++
              console.warn('[glb-loader] Image[' + idx + '] skipped, will use solid color. Error:', (err && err.message) || err)
              loadedImages[idx] = null
              return false
            }
          )
        )
      })(imgIdx)
    }
  }

  console.log('[glb-loader] Waiting for', imageLoadPromises.length, 'image load promises...')

  // 等所有图片加载完毕（不管成功失败）后继续
  return Promise.all(imageLoadPromises).then(function () {
    console.log('[glb-loader] All image promises resolved (' + failedImageCount + ' failed)')
    if (failedImageCount > 0) {
      console.warn('[glb-loader] ' + failedImageCount + ' texture(s) failed to load, using solid colors as fallback')
    }

    // ---- 纹理对象创建 ----
    var textures = []  // 按 json.textures[] 索引

    if (json.textures && json.textures.length > 0) {
      json.textures.forEach(function (texDef, texIdx) {
        var image = loadedImages[texDef.source]
        if (!image) {
          textures[texIdx] = null
          return
        }

        var samplerDef = null
        if (texDef.sampler !== undefined && json.samplers) {
          samplerDef = json.samplers[texDef.sampler]
        }

        var texture = new THREE.Texture(image)

        // ---- 采样器 → THREE.js 映射 ----
        // glTF 2.0 采样器默认值（与 THREE.js 默认值不同！）
        // glTF: wrapS=REPEAT(10497), wrapT=REPEAT(10497), magFilter=LINEAR(9729), minFilter=LINEAR_MIPMAP_LINEAR(9987)
        // THREE: wrapS=ClampToEdgeWrapping, wrapT=ClampToEdgeWrapping, magFilter=LinearFilter, minFilter=LinearMipmapLinearFilter
        // 因此必须始终以 glTF 默认值覆盖，除非采样器显式指定了其他值

        var wrapMap = {}
        wrapMap[10497] = THREE.RepeatWrapping
        wrapMap[33071] = THREE.ClampToEdgeWrapping
        wrapMap[33648] = THREE.MirroredRepeatWrapping

        var magMap = {}
        magMap[9728] = THREE.NearestFilter
        magMap[9729] = THREE.LinearFilter

        var minMap = {}
        minMap[9728] = THREE.NearestFilter
        minMap[9729] = THREE.LinearFilter
        minMap[9984] = THREE.NearestMipmapNearestFilter
        minMap[9985] = THREE.LinearMipmapNearestFilter
        minMap[9986] = THREE.NearestMipmapLinearFilter
        minMap[9987] = THREE.LinearMipmapLinearFilter

        // 使用 glTF 默认值（REPEAT, LINEAR, LINEAR_MIPMAP_LINEAR）
        texture.wrapS = (samplerDef && samplerDef.wrapS !== undefined)
          ? (wrapMap[samplerDef.wrapS] || THREE.RepeatWrapping)
          : THREE.RepeatWrapping  // glTF 默认
        texture.wrapT = (samplerDef && samplerDef.wrapT !== undefined)
          ? (wrapMap[samplerDef.wrapT] || THREE.RepeatWrapping)
          : THREE.RepeatWrapping  // glTF 默认
        texture.magFilter = (samplerDef && samplerDef.magFilter !== undefined)
          ? (magMap[samplerDef.magFilter] || THREE.LinearFilter)
          : THREE.LinearFilter   // glTF 默认
        texture.minFilter = (samplerDef && samplerDef.minFilter !== undefined)
          ? (minMap[samplerDef.minFilter] || THREE.LinearMipmapLinearFilter)
          : THREE.LinearMipmapLinearFilter  // glTF 默认

        // 默认生成 mipmap（若采样器需要）
        texture.generateMipmaps = true
        texture.flipY = false  // glTF 纹理坐标：左上为原点
        texture.needsUpdate = true

        textures[texIdx] = texture
      })
    }

    // ---- 辅助：根据纹理引用获取纹理和 texCoord ----
    function getTextureInfo(textureRef) {
      if (textureRef === undefined || textureRef === null) return null
      var idx = textureRef.index !== undefined ? textureRef.index : textureRef
      var tex = textures[idx] || null
      if (!tex) return null
      return {
        texture: tex,
        texCoord: textureRef.texCoord || 0,
        hasImage: true  // 纹理图像已成功加载
      }
    }

    function setTextureEncoding(tex, isColor) {
      if (!tex) return
      // three.js r152 使用 .encoding（>= r152 同时支持 .colorSpace）
      tex.encoding = isColor ? THREE.sRGBEncoding : THREE.LinearEncoding
    }

    // ---- Materials ----
    var materials = []
    if (json.materials) {
      json.materials.forEach(function (matDef) {
        var opts = {}

        // --- 检查是否为 Unlit 材质 ---
        var isUnlit = !!(matDef.extensions && matDef.extensions.KHR_materials_unlit)

        // --- PBR Metallic/Roughness ---
        if (matDef.pbrMetallicRoughness) {
          var pbr = matDef.pbrMetallicRoughness

          // baseColorFactor（glTF 默认 [1,1,1,1]）
          if (pbr.baseColorFactor) {
            opts.color = new THREE.Color(
              pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2]
            )
            // 透明度
            if (pbr.baseColorFactor[3] !== undefined && pbr.baseColorFactor[3] < 1) {
              opts.opacity = pbr.baseColorFactor[3]
            }
          }

          // baseColorTexture
          var baseColorInfo = getTextureInfo(pbr.baseColorTexture)
          if (baseColorInfo) {
            setTextureEncoding(baseColorInfo.texture, true)  // sRGB
            opts.map = baseColorInfo.texture
          }

          // metallicFactor / roughnessFactor（glTF 默认均为 1.0）
          // 当纹理缺失时，使用对无纹理材质更友好的回退值
          var hasMRTex = pbr.metallicRoughnessTexture !== undefined
          var mrInfo = getTextureInfo(pbr.metallicRoughnessTexture)
          opts.metalness = pbr.metallicFactor !== undefined
            ? pbr.metallicFactor
            : (hasMRTex && !mrInfo ? 0.0 : 1.0)  // 纹理缺失 → 非金属回退
          opts.roughness = pbr.roughnessFactor !== undefined
            ? pbr.roughnessFactor
            : (hasMRTex && !mrInfo ? 0.5 : 1.0)  // 纹理缺失 → 中等粗糙回退

          // metallicRoughnessTexture
          if (mrInfo) {
            setTextureEncoding(mrInfo.texture, false)  // Linear
            opts.metalnessMap = mrInfo.texture
            opts.roughnessMap = mrInfo.texture
          }
        }

        // --- Normal Texture（glTF 默认 scale=1）---
        var normalInfo = getTextureInfo(matDef.normalTexture)
        if (normalInfo) {
          setTextureEncoding(normalInfo.texture, false)  // Linear
          opts.normalMap = normalInfo.texture
          var ns = (matDef.normalTexture && matDef.normalTexture.scale !== undefined)
            ? matDef.normalTexture.scale : 1
          opts.normalScale = new THREE.Vector2(ns, ns)
        }

        // --- Emissive（glTF 默认 [0,0,0] = 黑色）---
        var emissiveInfo = getTextureInfo(matDef.emissiveTexture)
        if (matDef.emissiveFactor && matDef.emissiveFactor.some(function(v) { return v > 0 })) {
          // 只有 emissiveFactor 非零才设置发光色；若纹理缺失则不发光
          if (emissiveInfo || !matDef.emissiveTexture) {
            opts.emissive = new THREE.Color(
              matDef.emissiveFactor[0], matDef.emissiveFactor[1], matDef.emissiveFactor[2]
            )
          }
        }
        if (emissiveInfo) {
          setTextureEncoding(emissiveInfo.texture, true)  // sRGB
          opts.emissiveMap = emissiveInfo.texture
        }

        // --- Occlusion Texture（glTF 默认 strength=1）---
        var aoInfo = getTextureInfo(matDef.occlusionTexture)
        if (aoInfo) {
          setTextureEncoding(aoInfo.texture, false)  // Linear
          opts.aoMap = aoInfo.texture
          opts.aoMapIntensity = (matDef.occlusionTexture && matDef.occlusionTexture.strength !== undefined)
            ? matDef.occlusionTexture.strength : 1
        }

        // --- Alpha mode ---
        if (matDef.doubleSided) opts.side = THREE.DoubleSide
        if (matDef.alphaMode === 'BLEND') { opts.transparent = true; opts.depthWrite = false }
        if (matDef.alphaMode === 'MASK') { opts.alphaTest = matDef.alphaCutoff || 0.5 }

        // --- 创建材质（Unlit → MeshBasicMaterial，否则 MeshStandardMaterial）---
        if (isUnlit) {
          var unlitOpts = { color: opts.color || 0xffffff }
          if (opts.map) unlitOpts.map = opts.map
          if (opts.opacity !== undefined) unlitOpts.opacity = opts.opacity
          if (opts.side) unlitOpts.side = opts.side
          if (opts.alphaTest !== undefined) unlitOpts.alphaTest = opts.alphaTest
          if (opts.transparent) { unlitOpts.transparent = true; unlitOpts.depthWrite = false }
          materials.push(new THREE.MeshBasicMaterial(unlitOpts))
        } else {
          materials.push(new THREE.MeshStandardMaterial(opts))
        }
      })
    }

    // 无材质时的默认材质
    if (materials.length === 0) {
      materials.push(new THREE.MeshStandardMaterial({
        color: 0x888888, roughness: 0.5, metalness: 0.1
      }))
    }

    // ---- Meshes ----
    var meshList = []
    if (json.meshes) {
      json.meshes.forEach(function (meshDef) {
        meshDef.primitives.forEach(function (prim) {
          var geo = new THREE.BufferGeometry()
          var d, flat

          if (prim.attributes && prim.attributes.POSITION !== undefined) {
            d = readAccessor(prim.attributes.POSITION)
            flat = []; d.forEach(function (v) { flat.push(v[0], v[1], v[2]) })
            geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3))
          }
          if (prim.attributes && prim.attributes.NORMAL !== undefined) {
            d = readAccessor(prim.attributes.NORMAL)
            flat = []; d.forEach(function (v) { flat.push(v[0], v[1], v[2]) })
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(flat, 3))
          }
          if (prim.attributes && prim.attributes.TEXCOORD_0 !== undefined) {
            d = readAccessor(prim.attributes.TEXCOORD_0)
            flat = []; d.forEach(function (v) { flat.push(v[0], v[1]) })
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(flat, 2))
          }
          // TEXCOORD_1（用于 occlusion 等第二 UV 通道）
          if (prim.attributes && prim.attributes.TEXCOORD_1 !== undefined) {
            d = readAccessor(prim.attributes.TEXCOORD_1)
            flat = []; d.forEach(function (v) { flat.push(v[0], v[1]) })
            geo.setAttribute('uv2', new THREE.Float32BufferAttribute(flat, 2))
          }
          // TANGENT（法线贴图需要）
          if (prim.attributes && prim.attributes.TANGENT !== undefined) {
            d = readAccessor(prim.attributes.TANGENT)
            flat = []; d.forEach(function (v) { flat.push(v[0], v[1], v[2], v[3] || 1) })
            geo.setAttribute('tangent', new THREE.Float32BufferAttribute(flat, 4))
          }

          if (prim.indices !== undefined) {
            geo.setIndex(readAccessor(prim.indices))
          }

          var matIdx = prim.material !== undefined ? prim.material : 0
          var mesh = new THREE.Mesh(geo, materials[matIdx] || materials[0])
          meshList.push(mesh)
        })
      })
    }

    // ---- Nodes ----
    var nodeObjects = {}
    if (json.nodes) {
      json.nodes.forEach(function (nodeDef, idx) {
        var obj = new THREE.Group()
        obj.name = nodeDef.name || ('node_' + idx)

        if (nodeDef.matrix) {
          var m = nodeDef.matrix
          obj.matrix.set(
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15]
          )
          obj.matrix.decompose(obj.position, obj.quaternion, obj.scale)
        } else {
          if (nodeDef.translation) obj.position.set(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2])
          if (nodeDef.rotation) obj.quaternion.set(nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3])
          if (nodeDef.scale) obj.scale.set(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2])
        }

        if (nodeDef.mesh !== undefined && meshList[nodeDef.mesh]) {
          obj.add(meshList[nodeDef.mesh])
        }

        nodeObjects[idx] = obj
      })

      // 建立父子关系
      json.nodes.forEach(function (nodeDef, idx) {
        if (nodeDef.children) {
          nodeDef.children.forEach(function (childIdx) {
            if (nodeObjects[idx] && nodeObjects[childIdx]) {
              nodeObjects[idx].add(nodeObjects[childIdx])
            }
          })
        }
      })
    }

    // ---- Scene ----
    var rootGroup = new THREE.Group()
    rootGroup.name = 'glTF_root'

    if (json.scenes && json.scene !== undefined) {
      var scene = json.scenes[json.scene]
      if (scene.nodes) {
        scene.nodes.forEach(function (idx) {
          if (nodeObjects[idx]) rootGroup.add(nodeObjects[idx])
        })
      }
    }
    // 回退：添加所有无父节点的顶层节点
    if (rootGroup.children.length === 0) {
      ;(json.nodes || []).forEach(function (_d, idx) {
        var obj = nodeObjects[idx]
        if (obj && !obj.parent) rootGroup.add(obj)
      })
    }
    // 再回退：直接添加所有 mesh
    if (rootGroup.children.length === 0) {
      meshList.forEach(function (m) { rootGroup.add(m) })
    }

    return rootGroup
  })
}

// ============================================================
//  公开 API
// ============================================================

function loadGLBModel(url, THREE, canvas) {
  console.log('[glb-loader] Loading:', url)
  return downloadGLB(url).then(function (glbData) {
    console.log('[glb-loader] Parsing glTF', glbData.version)
    if (glbData.json.images) {
      console.log('[glb-loader] Found', glbData.json.images.length, 'image(s) to load')
    }
    return convertGLTF(THREE, glbData, url, canvas)
  })
}

module.exports = {
  parseGLBContainer: parseGLBContainer,
  downloadGLB: downloadGLB,
  loadGLBModel: loadGLBModel,
}
