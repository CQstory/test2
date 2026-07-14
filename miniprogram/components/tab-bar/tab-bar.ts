Component({
  properties: {
    active: { type: String, value: 'home' },
  },
  data: {
    tabs: [
      { key: 'home', label: '主页', icon: '🏠' },
      { key: 'browse', label: '模型库', icon: '📦' },
      { key: 'merchant', label: '消息', icon: '💬' },
      { key: 'profile', label: '我的', icon: '👤' },
    ],
  },
  methods: {
    onTabTap(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.key as string
      if (key === this.properties.active) return

      const routes: Record<string, string> = {
        home: '/pages/index/index',
        browse: '/pages/model-list/model-list',
        merchant: '/pages/merchant-center/merchant-center',
        profile: '/pages/profile/profile',
      }
      wx.switchTab({ url: routes[key] })
    },
  },
})
