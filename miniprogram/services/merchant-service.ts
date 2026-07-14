import { Merchant } from '../types/model'
import { merchantsData } from '../data/merchants'

export interface IMerchantService {
  getMerchantById(id: string): Promise<Merchant | null>
  getAllMerchants(): Promise<Merchant[]>
}

const createMerchantService = (): IMerchantService => ({
  async getMerchantById(id: string) {
    return merchantsData.find(m => m.id === id) || null
  },
  async getAllMerchants() {
    return merchantsData
  },
})

export const merchantService = createMerchantService()
