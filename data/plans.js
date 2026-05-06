module.exports = [
  {
    id: 'basic',
    name: '基础版',
    price: 99,
    unit: '月',
    slots: 3,
    features: [
      '3个模型展示位',
      '360°旋转/缩放查看',
      '基础模型信息展示',
      '商家联系方式展示',
      '标准展示优先级'
    ],
    highlight: false
  },
  {
    id: 'pro',
    name: '专业版',
    price: 299,
    unit: '月',
    slots: 10,
    features: [
      '10个模型展示位',
      '全部基础版功能',
      '首页精选推荐位',
      '优先搜索排序',
      '模型浏览量统计',
      '专属商家店铺页'
    ],
    highlight: true
  },
  {
    id: 'flagship',
    name: '旗舰版',
    price: 599,
    unit: '月',
    slots: -1,
    features: [
      '不限模型展示位',
      '全部专业版功能',
      '首页轮播Banner推荐',
      '搜索置顶展示',
      '详细数据分析面板',
      '专属客服1对1',
      '新功能优先体验'
    ],
    highlight: false
  }
]
