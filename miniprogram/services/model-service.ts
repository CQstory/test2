import { Model, CATEGORY_MAP, CategoryType } from '../types/model'
import { modelsData } from '../data/models'

export interface IModelService {
  getHotModels(limit?: number): Promise<Model[]>
  getFeaturedModels(limit?: number): Promise<Model[]>
  getModelById(id: string): Promise<Model | null>
  getModelsByCategory(cat: CategoryType): Promise<Model[]>
  getModelsByMerchant(merchantId: string): Promise<Model[]>
  searchModels(keyword: string): Promise<Model[]>
  getAllCategories(): { key: CategoryType; label: string }[]
}

const createModelService = (): IModelService => ({
  async getHotModels(limit?: number) {
    const sorted = [...modelsData]
      .map(m => ({
        ...m,
        hotScore: m.views * 0.4 + m.favorites * 0.6 * 10,
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
    return sorted.slice(0, limit != null ? limit : sorted.length)
  },

  async getFeaturedModels(limit?: number) {
    return modelsData.slice(0, limit != null ? limit : 4)
  },

  async getModelById(id: string) {
    return modelsData.find(m => m.id === id) || null
  },

  async getModelsByCategory(cat: CategoryType) {
    return modelsData.filter(m => m.category === cat)
  },

  async getModelsByMerchant(merchantId: string) {
    return modelsData.filter(m => m.merchantId === merchantId)
  },

  async searchModels(keyword: string) {
    const kw = keyword.toLowerCase()
    return modelsData.filter(
      m =>
        m.name.toLowerCase().includes(kw) ||
        m.tags.some(t => t.includes(kw)) ||
        m.description.toLowerCase().includes(kw)
    )
  },

  getAllCategories() {
    return Object.entries(CATEGORY_MAP).map(([key, label]) => ({
      key: key as CategoryType,
      label,
    }))
  },
})

export const modelService = createModelService()
