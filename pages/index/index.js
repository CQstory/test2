// index.js
Page({
  data: {
    motto: '3D模型展示小程序'
  },

  goToViewer() {
    wx.navigateTo({
      url: '/subpackages/modelViewer/pages/viewer/viewer'
    })
  }
})
