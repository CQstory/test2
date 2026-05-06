const modelsData = require('../../data/models.js')

Page({
  data: {
    featuredModels: [],
    categories: [
      { key: 'character', label: '人物', icon: '🧑' },
      { key: 'scene', label: '场景', icon: '🏰' },
      { key: 'prop', label: '道具', icon: '🛠️' },
      { key: 'vehicle', label: '载具', icon: '🚗' }
    ]
  },

  onLoad() {
    this.setData({
      featuredModels: modelsData.slice(0, 4)
    })
  },

  onCardTap(e) {
    const model = e.detail.model
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.category
    wx.switchTab({ url: '/pages/model-list/model-list' })
    wx.setStorageSync('activeCategory', cat)
  },

  onGoBrowse() {
    wx.switchTab({ url: '/pages/model-list/model-list' })
  },

  onGoMerchant() {
    wx.switchTab({ url: '/pages/merchant-center/merchant-center' })
  }
})
