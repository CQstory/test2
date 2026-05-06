Component({
  properties: {
    model: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { model: this.properties.model })
    }
  }
})
