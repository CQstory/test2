Page({
  data: {
    form: {
      avatar: 'https://api.dicebear.com/8.x/shapes/svg?seed=galaxy',
      cover: '',
      name: '星河模型工坊',
      description: '专注科幻与军事题材3D建模，拥有5年行业经验。擅长硬表面建模与PBR材质表现。',
      wechat: 'galaxy_model',
      phone: '138-0000-1001',
      email: 'galaxy@model.com'
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
  },

  onSave() {
    wx.showToast({ title: '保存成功', icon: 'success' })
  }
})
