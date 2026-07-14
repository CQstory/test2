import { userService } from '../../services/user-service'

Component({
  data: {
    username: '',
    password: '',
    errorMsg: '',
  },
  methods: {
    onUsernameInput(e: any) { this.setData({ username: e.detail.value }) },
    onPasswordInput(e: any) { this.setData({ password: e.detail.value }) },
    async onLogin() {
      const { username, password } = this.data
      if (!username.trim()) {
        this.setData({ errorMsg: '请输入用户名' })
        return
      }
      const result = await userService.login(username.trim(), password)
      if (result.success) {
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1000)
      } else {
        this.setData({ errorMsg: result.msg })
      }
    },
    onGoRegister() { wx.navigateTo({ url: '/pages/register/register' }) },
    onGoReset() { wx.navigateTo({ url: '/pages/reset-pwd/reset-pwd' }) },
  },
})
