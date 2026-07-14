interface AuthResult {
  success: boolean
  msg: string
}

interface StoredUser {
  username: string
  password: string
}

const USERS_KEY = 'mini_users'

const getUsers = (): StoredUser[] => {
  try {
    const data = wx.getStorageSync(USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveUsers = (users: StoredUser[]): void => {
  wx.setStorageSync(USERS_KEY, JSON.stringify(users))
}

const findUser = (username: string): StoredUser | undefined =>
  getUsers().find(u => u.username === username)

export const userService = {
  getCurrentUser(): { username: string } | null {
    const username = wx.getStorageSync('current_user')
    return username ? { username } : null
  },

  async login(username: string, password: string): Promise<AuthResult> {
    await simulateNetwork()
    const user = findUser(username)
    if (!user) {
      return { success: false, msg: '用户不存在' }
    }
    if (user.password !== password) {
      return { success: false, msg: '密码错误' }
    }
    wx.setStorageSync('current_user', username)
    return { success: true, msg: '登录成功' }
  },

  async register(username: string, password: string): Promise<AuthResult> {
    await simulateNetwork()
    if (findUser(username)) {
      return { success: false, msg: '用户名已存在' }
    }
    const users = getUsers()
    users.push({ username, password })
    saveUsers(users)
    wx.setStorageSync('current_user', username)
    return { success: true, msg: '注册成功' }
  },

  async resetPassword(username: string): Promise<AuthResult> {
    await simulateNetwork()
    if (!findUser(username)) {
      return { success: false, msg: '该用户不存在' }
    }
    return { success: true, msg: '重置链接已发送，请查看邮箱（演示环境未实际发送）' }
  },
}

function simulateNetwork(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300))
}
