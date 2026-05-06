const modelsData = require('../../data/models.js')

Page({
  data: {
    models: [
      { id: 'm1', name: 'Damaged Helmet', thumbnail: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/screenshot/screenshot.png', status: 'published', faces: 14200, updatedAt: '2026-04-28' },
      { id: 'm2', name: 'Flight Helmet', thumbnail: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/FlightHelmet/screenshot/screenshot.png', status: 'published', faces: 11200, updatedAt: '2026-04-25' },
      { id: 'm3', name: 'Lantern', thumbnail: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Lantern/screenshot/screenshot.png', status: 'pending', faces: 7600, updatedAt: '2026-05-02' },
      { id: 'm4', name: 'Sci-Fi Rifle', thumbnail: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/screenshot/large.png', status: 'offline', faces: 22800, updatedAt: '2026-03-15' }
    ],
    statusMap: {
      published: { label: '已上架', cls: 'published' },
      pending: { label: '审核中', cls: 'pending' },
      offline: { label: '已下架', cls: 'offline' }
    }
  },

  onAddModel() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '编辑功能开发中', icon: 'none' })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该模型吗？',
      confirmColor: '#ff4d4f',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onToggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
    if (status === 'published') {
      wx.showToast({ title: '已下架', icon: 'success' })
    } else {
      wx.showToast({ title: '已上架', icon: 'success' })
    }
  }
})
