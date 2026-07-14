App<IAppOption>({
  globalData: {
    userInfo: null as any,
    systemInfo: null as WechatMiniprogram.SystemInfo | null,
  },
  onLaunch() {
    const info = wx.getSystemInfoSync()
    this.globalData.systemInfo = info
    const statusBarHeight = info.statusBarHeight || 44
    try {
      document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px')
    } catch (_) {
      // Skyline 模式下 document.documentElement 可能不可用，CSS 变量回退到默认值 44px
    }

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: res => { console.log('login code:', res.code) },
    })
  },
})
