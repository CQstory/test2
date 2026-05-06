const merchantsData = require('../../data/merchants.js')
const modelsData = require('../../data/models.js')

Page({
  data: {
    merchant: null,
    models: []
  },

  onLoad(options) {
    const id = options.id
    const merchant = merchantsData.find(m => m.id === id)
    if (!merchant) {
      wx.showToast({ title: '店铺未找到', icon: 'none' })
      wx.navigateBack()
      return
    }
    const models = modelsData.filter(m => m.merchantId === id)
    this.setData({ merchant, models })
  },

  onCardTap(e) {
    const model = e.detail.model
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
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
  }
})
