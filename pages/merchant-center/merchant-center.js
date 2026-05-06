Page({
  data: {
    merchant: {
      name: '星河模型工坊',
      avatar: 'https://api.dicebear.com/8.x/shapes/svg?seed=galaxy',
      planName: '专业版',
      planExpire: '2026-06-15'
    },
    stats: {
      models: 8,
      views: 3680,
      daysLeft: 42
    },
    menus: [
      { key: 'models', label: '我的模型', icon: '📦', desc: '管理已上传模型' },
      { key: 'pricing', label: '套餐购买', icon: '💎', desc: '升级/续费套餐' },
      { key: 'settings', label: '店铺设置', icon: '⚙️', desc: '编辑店铺信息' },
      { key: 'analytics', label: '数据统计', icon: '📊', desc: '查看浏览数据' }
    ]
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    const routes = {
      models: '/pages/merchant-models/merchant-models',
      pricing: '/pages/pricing/pricing',
      settings: '/pages/shop-settings/shop-settings',
      analytics: ''
    }
    if (routes[key]) {
      wx.navigateTo({ url: routes[key] })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  onGoStore() {
    wx.navigateTo({
      url: '/pages/store-front/store-front?id=merchant-1'
    })
  }
})
