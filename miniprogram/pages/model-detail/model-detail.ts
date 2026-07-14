import { Model } from '../../types/model'
import { modelService } from '../../services/model-service'

Component({
  data: {
    model: {} as Model,
    facesText: '',
  },
  methods: {
    async onLoad(options: { id?: string }) {
      const id = options.id || ''
      const model = await modelService.getModelById(id)
      if (model) {
        this.setData({
          model,
          facesText: model.faces
            ? (model.faces / 1000).toFixed(1) + 'K面'
            : '',
        })
      }
    },
    onView3D() {
      const m = this.data.model
      wx.navigateTo({
        url:
          '/subpackages/modelViewer/pages/viewer/viewer?id=' +
          m.id +
          '&name=' +
          encodeURIComponent(m.name),
      })
    },
  },
})
