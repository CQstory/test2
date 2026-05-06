Component({
  properties: {
    active: {
      type: String,
      value: 'home'
    }
  },

  data: {
    tabs: [
      { key: 'home', label: '首页', icon: '🏠' },
      { key: 'browse', label: '模型库', icon: '📦' },
      { key: 'merchant', label: '商家中心', icon: '💼' },
      { key: 'profile', label: '我的', icon: '👤' }
    ]
  },

  methods: {
    onTabTap(e) {
      const key = e.currentTarget.dataset.key
      if (key === this.properties.active) return

      const routes = {
        home: '/pages/index/index',
        browse: '/pages/model-list/model-list',
        merchant: '/pages/merchant-center/merchant-center',
        profile: '/pages/profile/profile'
      }

      wx.switchTab({ url: routes[key] })
    }
  }
})
