const modelsData = require('../../data/models.js')
const merchantsData = require('../../data/merchants.js')

Page({
  data: {
    model: null,
    merchant: null,
    relatedModels: []
  },

  onLoad(options) {
    const id = options.id
    const model = modelsData.find(m => m.id === id)
    if (!model) {
      wx.showToast({ title: '模型未找到', icon: 'none' })
      wx.navigateBack()
      return
    }

    const merchant = merchantsData.find(m => m.id === model.merchantId) || null
    const relatedModels = modelsData
      .filter(m => m.id !== model.id && m.merchantId === model.merchantId)
      .slice(0, 3)

    this.setData({ model, merchant, relatedModels })
  },

  onView3D() {
    const model = this.data.model
    wx.navigateTo({
      url: `/subpackages/modelViewer/pages/viewer/viewer?modelUrl=${encodeURIComponent(model.modelUrl)}&modelName=${encodeURIComponent(model.name)}`
    })
  },

  onGoStore() {
    const model = this.data.model
    wx.navigateTo({
      url: `/pages/store-front/store-front?id=${model.merchantId}`
    })
  },

  onContactMerchant() {
    const merchant = this.data.merchant
    if (!merchant) return
    const contact = merchant.contact
    wx.showActionSheet({
      itemList: [`微信: ${contact.wechat}`, `电话: ${contact.phone}`, `邮箱: ${contact.email}`],
      success(res) {
        if (res.tapIndex === 1) {
          wx.makePhoneCall({ phoneNumber: contact.phone.replace(/-/g, '') })
        }
      }
    })
  },

  onRelatedTap(e) {
    const model = e.detail.model
    wx.redirectTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  }
})
