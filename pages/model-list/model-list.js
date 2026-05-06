const modelsData = require('../../data/models.js')

Page({
  data: {
    models: [],
    filteredModels: [],
    categories: [
      { key: 'all', label: '全部' },
      { key: 'character', label: '人物' },
      { key: 'scene', label: '场景' },
      { key: 'prop', label: '道具' },
      { key: 'vehicle', label: '载具' }
    ],
    activeCategory: 'all',
    searchValue: ''
  },

  onLoad() {
    this.setData({ models: modelsData, filteredModels: modelsData })
    const savedCat = wx.getStorageSync('activeCategory')
    if (savedCat && savedCat !== 'all') {
      this.setData({ activeCategory: savedCat })
      this.filterByCategory(savedCat)
      wx.removeStorageSync('activeCategory')
    }
  },

  onSearchInput(e) {
    const value = e.detail.value
    this.setData({ searchValue: value })
    this.filterModels()
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.category
    this.setData({ activeCategory: cat })
    this.filterByCategory(cat)
  },

  filterByCategory(cat) {
    if (cat === 'all') {
      this.setData({ filteredModels: this.data.models })
    } else {
      this.setData({
        filteredModels: this.data.models.filter(m => m.category === cat)
      })
    }
  },

  filterModels() {
    const { searchValue, activeCategory } = this.data
    let list = this.data.models
    if (activeCategory !== 'all') {
      list = list.filter(m => m.category === activeCategory)
    }
    if (searchValue.trim()) {
      const kw = searchValue.trim().toLowerCase()
      list = list.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        m.description.toLowerCase().includes(kw) ||
        (m.tags && m.tags.some(t => t.toLowerCase().includes(kw)))
      )
    }
    this.setData({ filteredModels: list })
  },

  onCardTap(e) {
    const model = e.detail.model
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  }
})
