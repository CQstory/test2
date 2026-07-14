import { userService } from '../../services/user-service'

interface UserInfo {
  username: string
}

Component({
  data: {
    userInfo: null as UserInfo | null,
  },
  lifetimes: {
    attached() {
      this.setData({ userInfo: userService.getCurrentUser() as UserInfo | null })
    },
  },
  pageLifetimes: {
    show() {
      this.setData({ userInfo: userService.getCurrentUser() as UserInfo | null })
    },
  },
  methods: {
    onGoLogin() { wx.navigateTo({ url: '/pages/login/login' }) },
    onGoRegister() { wx.navigateTo({ url: '/pages/register/register' }) },
    onGoFavorites() { wx.navigateTo({ url: '/pages/favorites/favorites' }) },
    onGoPricing() { wx.navigateTo({ url: '/pages/pricing/pricing' }) },
    onGoShopSettings() { wx.navigateTo({ url: '/pages/shop-settings/shop-settings' }) },
  },
})
