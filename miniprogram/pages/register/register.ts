import { userService } from '../../services/user-service'

Component({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    errorMsg: '',
  },
  methods: {
    onUsernameInput(e: any) { this.setData({ username: e.detail.value }) },
    onPasswordInput(e: any) { this.setData({ password: e.detail.value }) },
    onConfirmPasswordInput(e: any) { this.setData({ confirmPassword: e.detail.value }) },
    async onRegister() {
      const { username, password, confirmPassword } = this.data
      if (!username.trim()) { this.setData({ errorMsg: '请输入用户名' }); return }
      if (username.trim().length < 3) { this.setData({ errorMsg: '用户名至少3个字符' }); return }
      if (!password) { this.setData({ errorMsg: '请输入密码' }); return }
      if (password !== confirmPassword) { this.setData({ errorMsg: '两次密码不一致' }); return }
      const result = await userService.register(username.trim(), password)
      if (result.success) {
        wx.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1000)
      } else {
        this.setData({ errorMsg: result.msg })
      }
    },
    onGoLogin() { wx.navigateBack({ delta: 1 }) },
  },
})
