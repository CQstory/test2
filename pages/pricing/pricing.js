const plansData = require('../../data/plans.js')

Page({
  data: {
    plans: plansData,
    currentPlan: 'pro'
  },

  onBuy(e) {
    const plan = e.currentTarget.dataset.plan
    wx.showModal({
      title: '购买确认',
      content: `确定购买「${plan.name}」套餐？\n\n金额：¥${plan.price}/${plan.unit}`,
      confirmColor: '#4ecdc4',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '购买成功', icon: 'success' })
        }
      }
    })
  }
})
