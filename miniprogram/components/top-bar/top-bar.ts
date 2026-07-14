Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
      wx.navigateBack({ delta: 1 })
    },
  },
})
