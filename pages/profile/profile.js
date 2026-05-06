Page({
  data: {
    menus: [
      { key: 'merchant', label: '商家入驻', icon: '🏪', desc: '成为商家，租赁展示位' },
      { key: 'history', label: '浏览记录', icon: '🕐', desc: '最近查看的模型' },
      { key: 'favorites', label: '我的收藏', icon: '⭐', desc: '收藏的模型' },
      { key: 'about', label: '关于平台', icon: 'ℹ️', desc: '了解3D模型展示平台' },
      { key: 'settings', label: '设置', icon: '⚙️', desc: '应用设置' }
    ]
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'merchant') {
      wx.switchTab({ url: '/pages/merchant-center/merchant-center' })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  }
})
