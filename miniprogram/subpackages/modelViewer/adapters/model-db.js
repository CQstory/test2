/**
 * 模型数据库 —— 从 data/ 目录加载模型信息，提供查询能力
 */
const models = require('../data/models')
const merchants = require('../data/merchants')

// 构建商户索引
const merchantMap = {}
if (Array.isArray(merchants)) {
  merchants.forEach(function (m) {
    merchantMap[m.id] = m
  })
}

/**
 * 获取所有模型列表
 */
function getAllModels() {
  return models.map(function (m) {
    return Object.assign({}, m, {
      merchant: merchantMap[m.merchantId] || null,
    })
  })
}

/**
 * 根据 ID 获取单个模型
 */
function getModelById(id) {
  var model = models.find(function (m) { return m.id === id })
  if (!model) return null
  return Object.assign({}, model, {
    merchant: merchantMap[model.merchantId] || null,
  })
}

/**
 * 根据分类筛选模型
 */
function getModelsByCategory(category) {
  return getAllModels().filter(function (m) { return m.category === category })
}

module.exports = {
  getAllModels: getAllModels,
  getModelById: getModelById,
  getModelsByCategory: getModelsByCategory,
  models: models,
  merchants: merchants,
}
