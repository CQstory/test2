import { userService } from '../../services/user-service'

Component({
  data: { username: '', msg: '' },
  methods: {
    onUsernameInput(e: any) { this.setData({ username: e.detail.value }) },
    async onReset() {
      if (!this.data.username.trim()) {
        this.setData({ msg: '请输入用户名' })
        return
      }
      const result = await userService.resetPassword(this.data.username.trim())
      this.setData({ msg: result.msg })
    },
  },
})
