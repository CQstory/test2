import { createScopedThreejs } from 'threejs-miniprogram'

Page({
  data: {
    modelUrl: '',
    modelName: '默认示例模型',
    loading: false,
    showInput: false,
    autoRotate: true
  },

  canvas: null,
  THREE: null,
  scene: null,
  camera: null,
  renderer: null,
  mainModel: null,
  animationId: 0,
  clock: null,
  touchStart: { x: 0, y: 0 },
  touchStart1: { x: 0, y: 0 },
  touchMoved: false,
  touchMode: 'none',
  pinchStartDist: 0,
  pinchStartRadius: 0,
  tapCount: 0,
  tapTimer: null,
  spherical: { theta: Math.PI / 4, phi: Math.PI / 3, radius: 12 },
  targetSpherical: { theta: Math.PI / 4, phi: Math.PI / 3, radius: 12 },
  autoRotateSpeed: 0.3,
  isDragging: false,

  onReady() {
    this.init3D()
  },

  onUnload() {
    this.cleanup()
  },

  onHide() {
    if (this.animationId) {
      this.canvas && this.canvas.cancelAnimationFrame(this.animationId)
      this.animationId = 0
    }
  },

  onShow() {
    if (!this.animationId && this.canvas && this.renderer && this.scene && this.camera) {
      this.animate()
    }
  },

  init3D() {
    const query = wx.createSelectorQuery()
    query.select('#webglCanvas').node().exec((res) => {
      if (!res || !res[0]) {
        console.error('无法获取canvas节点')
        return
      }
      this.canvas = res[0].node
      this.THREE = createScopedThreejs(this.canvas)
      this.setupScene()
      this.setupLights()
      this.createDefaultModel()
      this.setupCamera()
      this.renderer = new this.THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      })
      this.renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio)
      this.renderer.setSize(this.canvas.width, this.canvas.height)
      this.renderer.shadowMap.enabled = true
      this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1.2
      this.clock = new this.THREE.Clock()
      this.animate()
    })
  },

  setupScene() {
    const THREE = this.THREE
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 60)
  },

  setupLights() {
    const THREE = this.THREE
    const ambientLight = new THREE.AmbientLight(0x404060, 1.5)
    this.scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(8, 12, 8)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    keyLight.shadow.camera.left = -15
    keyLight.shadow.camera.right = 15
    keyLight.shadow.camera.top = 15
    keyLight.shadow.camera.bottom = -15
    keyLight.shadow.bias = -0.0001
    this.scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.0)
    fillLight.position.set(-4, 3, -4)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xff8844, 1.2)
    rimLight.position.set(0, 2, -8)
    this.scene.add(rimLight)
  },

  setupCamera() {
    const THREE = this.THREE
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.width / this.canvas.height,
      0.1,
      100
    )
    this.updateCameraPosition()
  },

  updateCameraPosition() {
    const s = this.spherical
    const x = s.radius * Math.sin(s.phi) * Math.cos(s.theta)
    const y = s.radius * Math.cos(s.phi)
    const z = s.radius * Math.sin(s.phi) * Math.sin(s.theta)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  },

  createDefaultModel() {
    const THREE = this.THREE
    const group = new THREE.Group()
    group.name = 'mainModel'

    const mainGeo = new THREE.TorusKnotGeometry(1.5, 0.45, 200, 32)
    const mainMat = new THREE.MeshStandardMaterial({
      color: 0x4ecdc4,
      roughness: 0.25,
      metalness: 0.7
    })
    const mainMesh = new THREE.Mesh(mainGeo, mainMat)
    mainMesh.castShadow = true
    mainMesh.receiveShadow = true
    group.add(mainMesh)

    const wireGeo = new THREE.TorusKnotGeometry(1.65, 0.05, 128, 16)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
    const wireframe = new THREE.Mesh(wireGeo, wireMat)
    group.add(wireframe)

    this.mainModel = group
    this.scene.add(group)

    this.createGroundPlane()
    this.createParticles()
  },

  createGroundPlane() {
    const THREE = this.THREE
    const groundGeo = new THREE.PlaneGeometry(24, 24)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -4
    ground.receiveShadow = true
    ground.name = 'ground'
    this.scene.add(ground)

    const gridHelper = new THREE.GridHelper(20, 40, 0x444466, 0x2a2a3e)
    gridHelper.position.y = -3.99
    this.scene.add(gridHelper)
  },

  createParticles() {
    const THREE = this.THREE
    const particlesGeo = new THREE.BufferGeometry()
    const count = 300
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 18
      positions[i + 1] = (Math.random() - 0.5) * 12
      positions[i + 2] = (Math.random() - 0.5) * 18
    }
    particlesGeo.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.5
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    particles.name = 'particles'
    this.scene.add(particles)
  },

  animate() {
    this.animationId = this.canvas.requestAnimationFrame(this.animate.bind(this))
    const delta = this.clock.getDelta()

    if (this.mainModel) {
      if (this.data.autoRotate && !this.isDragging) {
        this.targetSpherical.theta += this.autoRotateSpeed * delta
      }
    }

    const lerpFactor = 0.08
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * lerpFactor
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * lerpFactor
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * lerpFactor
    this.updateCameraPosition()

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  },

  handleTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return
    const count = e.touches.length
    if (count === 1) {
      this.touchMode = 'orbit'
      this.isDragging = true
      this.touchMoved = false
      this.touchStart = { x: e.touches[0].x, y: e.touches[0].y }
    } else if (count >= 2) {
      this.touchMode = 'zoom'
      this.isDragging = true
      this.touchMoved = false
      this.touchStart = { x: e.touches[0].x, y: e.touches[0].y }
      this.touchStart1 = { x: e.touches[1].x, y: e.touches[1].y }
      const dx = this.touchStart1.x - this.touchStart.x
      const dy = this.touchStart1.y - this.touchStart.y
      this.pinchStartDist = Math.sqrt(dx * dx + dy * dy)
      this.pinchStartRadius = this.targetSpherical.radius
    }
  },

  handleTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return
    const count = e.touches.length

    if (count === 1 && this.touchMode === 'orbit') {
      this.touchMoved = true
      const dx = e.touches[0].x - this.touchStart.x
      const dy = e.touches[0].y - this.touchStart.y
      this.touchStart = { x: e.touches[0].x, y: e.touches[0].y }
      const sensitivity = 0.005
      this.targetSpherical.theta -= dx * sensitivity
      this.targetSpherical.phi -= dy * sensitivity
      this.targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.targetSpherical.phi))
    } else if (count >= 2 && this.touchMode === 'zoom') {
      this.touchMoved = true
      const dx = e.touches[1].x - e.touches[0].x
      const dy = e.touches[1].y - e.touches[0].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (this.pinchStartDist > 0) {
        const ratio = this.pinchStartDist / dist
        this.targetSpherical.radius = this.pinchStartRadius * ratio
        this.targetSpherical.radius = Math.max(2, Math.min(40, this.targetSpherical.radius))
      }
    }
  },

  handleTouchEnd(e) {
    this.isDragging = false
    if (!e.touches || e.touches.length === 0) {
      this.touchMode = 'none'
    } else if (e.touches.length === 1) {
      this.touchMode = 'orbit'
      this.touchStart = { x: e.touches[0].x, y: e.touches[0].y }
      this.pinchStartDist = 0
    }
  },

  handleCanvasTap(e) {
    if (this.touchMoved) return
    this.tapCount++
    if (this.tapCount === 1) {
      this.tapTimer = setTimeout(() => {
        this.tapCount = 0
      }, 300)
    } else if (this.tapCount === 2) {
      clearTimeout(this.tapTimer)
      this.tapCount = 0
      this.toggleAutoRotate()
    }
  },

  toggleAutoRotate() {
    this.setData({ autoRotate: !this.data.autoRotate })
    wx.showToast({
      title: this.data.autoRotate ? '自动旋转: 开' : '自动旋转: 关',
      icon: 'none',
      duration: 1000
    })
  },

  onToggleInput() {
    this.setData({ showInput: !this.data.showInput })
  },

  onModelUrlInput(e) {
    this.setData({ modelUrl: e.detail.value })
  },

  onLoadModel() {
    const url = this.data.modelUrl.trim()
    if (!url) {
      wx.showToast({ title: '请输入模型URL', icon: 'none' })
      return
    }
    this.loadModelFromUrl(url)
  },

  loadModelFromUrl(url) {
    this.setData({ loading: true })
    wx.showLoading({ title: '加载模型中...' })

    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          this.parseGLBModel(res.tempFilePath)
        } else {
          wx.hideLoading()
          wx.showToast({ title: '下载失败: ' + res.statusCode, icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '下载失败, 请检查URL', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  parseGLBModel(filePath) {
    const THREE = this.THREE
    const fs = wx.getFileSystemManager()
    try {
      const data = fs.readFileSync(filePath)
      const loader = this.createGLTFLoader()
      loader.parse(data, '', (gltf) => {
        wx.hideLoading()
        this.replaceModel(gltf.scene)
        this.setData({ loading: false, modelName: '已加载外部模型' })
        wx.showToast({ title: '加载成功', icon: 'success' })
      }, (error) => {
        wx.hideLoading()
        console.error('解析失败:', error)
        wx.showToast({ title: '模型解析失败', icon: 'none' })
        this.setData({ loading: false })
      })
    } catch (e) {
      wx.hideLoading()
      console.error('读取文件失败:', e)
      wx.showToast({ title: '文件读取失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  createGLTFLoader() {
    const THREE = this.THREE
    const loader = {
      parse(data, path, onLoad, onError) {
        if (data.byteLength >= 4) {
          const magic = new DataView(data.slice(0, 4)).getUint32(0, true)
          if (magic === 0x46546C67) {
            loader.parseGLB(data, path, onLoad, onError)
            return
          }
        }
        loader.parseGLTF(data, path, onLoad, onError)
      },

      parseGLB(data, path, onLoad, onError) {
        const headerView = new DataView(data.slice(0, 12))
        const version = headerView.getUint32(4, true)
        if (version !== 2) {
          onError(new Error('Unsupported GLB version'))
          return
        }
        const jsonChunkLength = new DataView(data.slice(12, 16)).getUint32(0, true)
        const jsonData = data.slice(20, 20 + jsonChunkLength)
        const decoder = new TextDecoder()
        const jsonStr = decoder.decode(jsonData)
        const gltf = JSON.parse(jsonStr)

        let binBuffer = null
        if (20 + jsonChunkLength < data.byteLength) {
          const binHeader = new DataView(data.slice(20 + jsonChunkLength, 20 + jsonChunkLength + 8))
          const binLength = binHeader.getUint32(0, true)
          binBuffer = data.slice(20 + jsonChunkLength + 8, 20 + jsonChunkLength + 8 + binLength)
        }

        buildScene(gltf, binBuffer, onLoad)
      },

      parseGLTF(data, path, onLoad, onError) {
        const decoder = new TextDecoder()
        const jsonStr = decoder.decode(data)
        const gltf = JSON.parse(jsonStr)
        buildScene(gltf, null, onLoad)
      }
    }

    function buildScene(gltf, binData, onLoad) {
      const group = new THREE.Group()
      group.name = 'mainModel'

        const accessors = gltf.accessors || []
        const bufferViews = gltf.bufferViews || []
        const meshes = gltf.meshes || []
        const nodes = gltf.nodes || []
        const materials = gltf.materials || []
        const images = gltf.images || []
        const textures = gltf.textures || []

        const materialCache = {}
        materials.forEach((matDef, idx) => {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(
              (matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.baseColorFactor)
                ? matDef.pbrMetallicRoughness.baseColorFactor[0]
                : 1,
              (matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.baseColorFactor)
                ? matDef.pbrMetallicRoughness.baseColorFactor[1]
                : 1,
              (matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.baseColorFactor)
                ? matDef.pbrMetallicRoughness.baseColorFactor[2]
                : 1
            ),
            roughness: (matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.roughnessFactor !== undefined)
              ? matDef.pbrMetallicRoughness.roughnessFactor : 0.5,
            metalness: (matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.metallicFactor !== undefined)
              ? matDef.pbrMetallicRoughness.metallicFactor : 0.5
          })
          materialCache[idx] = mat
        })

        function getBufferData(accessorIdx) {
          const accessor = accessors[accessorIdx]
          const bufferView = bufferViews[accessor.bufferView]
          if (!binData || !bufferView) return null
          const start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0)
          return binData.slice(start, start + bufferView.byteLength)
        }

        function getComponentCount(type) {
          const map = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }
          return map[type] || 3
        }

        function getGLTypeSize(componentType) {
          const map = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
          return map[componentType] || 4
        }

        function createGeoFromAccessor(posIdx, normalIdx, uvIdx, indicesIdx) {
          const posAccessor = accessors[posIdx]
          const geo = new THREE.BufferGeometry()
          const posData = getBufferData(posIdx)
          if (posData) {
            const typedArray = new Float32Array(posData.slice(0))
            geo.addAttribute('position', new THREE.BufferAttribute(typedArray, 3))
          }
          if (normalIdx !== undefined && normalIdx !== null) {
            const normData = getBufferData(normalIdx)
            if (normData) {
              const typedArray = new Float32Array(normData.slice(0))
              geo.addAttribute('normal', new THREE.BufferAttribute(typedArray, 3))
            }
          }
          if (uvIdx !== undefined && uvIdx !== null) {
            const uvData = getBufferData(uvIdx)
            if (uvData) {
              const count = accessors[uvIdx].count
              const type = accessors[uvIdx].type
              const compCount = getComponentCount(type)
              const glType = getGLTypeSize(accessors[uvIdx].componentType)
              if (glType === 4) {
                geo.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvData.slice(0, count * compCount * 4)), compCount))
              } else if (glType === 2) {
                const src = new Uint16Array(uvData.slice(0, count * compCount * 2))
                const dst = new Float32Array(src.length)
                for (let i = 0; i < src.length; i++) dst[i] = src[i]
                geo.addAttribute('uv', new THREE.BufferAttribute(dst, compCount))
              } else {
                const src = new Uint8Array(uvData.slice(0, count * compCount * 1))
                const dst = new Float32Array(src.length)
                for (let i = 0; i < src.length; i++) dst[i] = src[i]
                geo.addAttribute('uv', new THREE.BufferAttribute(dst, compCount))
              }
            }
          }
          if (indicesIdx !== undefined && indicesIdx !== null) {
            const idxData = getBufferData(indicesIdx)
            if (idxData) {
              const componentType = accessors[indicesIdx].componentType
              if (componentType === 5123) {
                geo.setIndex(Array.from(new Uint16Array(idxData.slice(0))))
              } else if (componentType === 5125) {
                geo.setIndex(Array.from(new Uint32Array(idxData.slice(0))))
              }
            }
          }
          return geo
        }

        const nodeMap = {}
        nodes.forEach((nodeDef, idx) => {
          let meshObj = null
          if (nodeDef.mesh !== undefined) {
            const meshDef = meshes[nodeDef.mesh]
            meshDef.primitives.forEach((prim) => {
              const geo = createGeoFromAccessor(
                prim.attributes.POSITION,
                prim.attributes.NORMAL,
                prim.attributes.TEXCOORD_0,
                prim.indices
              )
              const matIdx = prim.material !== undefined ? prim.material : 0
              const mat = materialCache[matIdx] || new THREE.MeshStandardMaterial({ color: 0xcccccc })
              const mesh = new THREE.Mesh(geo, mat)
              mesh.castShadow = true
              mesh.receiveShadow = true
              if (!meshObj) {
                meshObj = mesh
              } else {
                if (Array.isArray(meshObj)) {
                  meshObj.push(mesh)
                } else {
                  const group2 = new THREE.Group()
                  group2.add(meshObj)
                  group2.add(mesh)
                  meshObj = group2
                }
              }
            })
          }
          const node = meshObj || new THREE.Object3D()
          node.name = nodeDef.name || ('node_' + idx)
          if (nodeDef.translation) {
            node.position.set(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2])
          }
          if (nodeDef.rotation) {
            node.quaternion.set(nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3])
          }
          if (nodeDef.scale) {
            node.scale.set(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2])
          }
          nodeMap[idx] = node
        })

        nodes.forEach((nodeDef, idx) => {
          const node = nodeMap[idx]
          if (nodeDef.children) {
            nodeDef.children.forEach((childIdx) => {
              node.add(nodeMap[childIdx])
            })
          }
        })

        const rootNodes = gltf.scenes ? gltf.scenes[gltf.scene || 0] : null
        if (rootNodes && rootNodes.nodes) {
          rootNodes.nodes.forEach((nodeIdx) => {
            group.add(nodeMap[nodeIdx])
          })
        } else {
          nodes.forEach((nodeDef, idx) => {
            let isChild = false
            nodes.forEach((nd) => {
              if (nd.children && nd.children.indexOf(idx) !== -1) isChild = true
            })
            if (!isChild) group.add(nodeMap[idx])
          })
        }

        const box = new THREE.Box3().setFromObject(group)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = maxDim > 0 ? 5 / maxDim : 1
        group.scale.setScalar(scale)
        group.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

        onLoad({ scene: group })
    }

    return loader
  },

  replaceModel(newModel) {
    if (this.mainModel) {
      this.scene.remove(this.mainModel)
    }
    this.mainModel = newModel
    this.scene.add(newModel)
  },

  onResetModel() {
    if (this.mainModel) {
      this.scene.remove(this.mainModel)
      this.mainModel = null
    }
    this.createDefaultModel()
    this.setData({
      modelUrl: '',
      modelName: '默认示例模型',
      loading: false
    })
    wx.showToast({ title: '已重置', icon: 'success' })
  },

  onQuickLoadHelmet() {
    this.setData({
      modelUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
    })
    this.loadModelFromUrl(this.data.modelUrl)
  },

  onQuickLoadDuck() {
    this.setData({
      modelUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb'
    })
    this.loadModelFromUrl(this.data.modelUrl)
  },

  cleanup() {
    if (this.animationId) {
      this.canvas && this.canvas.cancelAnimationFrame(this.animationId)
    }
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
    this.scene = null
    this.renderer = null
    this.camera = null
    this.mainModel = null
  }
})
