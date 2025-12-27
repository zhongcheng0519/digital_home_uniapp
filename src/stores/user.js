import { defineStore } from 'pinia'
import storage from '../utils/storage'
import { decryptPrivateKey } from '../utils/crypto'
import authApi from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    myPrivateKey: ''
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.myPrivateKey,
    userId: (state) => state.userInfo?.id,
    username: (state) => state.userInfo?.username,
    phone: (state) => state.userInfo?.phone,
    publicKey: (state) => state.userInfo?.public_key
  },
  
  actions: {
    async login(phone, password) {
      try {
        const response = await authApi.login({ phone, password })
        
        this.token = response.access_token
        this.userInfo = response.user_info
        
        uni.setStorageSync('token', this.token)
        storage.set('userInfo', this.userInfo)
        
        const encryptedPrivateKey = response.user_info.encrypted_private_key
        const decryptedPrivateKey = decryptPrivateKey(encryptedPrivateKey, password)
        
        this.myPrivateKey = decryptedPrivateKey
        
        return true
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = null
      this.myPrivateKey = ''
      
      uni.removeStorageSync('token')
      storage.remove('userInfo')
    },
    
    loadFromStorage() {
      this.token = uni.getStorageSync('token') || ''
      this.userInfo = storage.get('userInfo')
    },
    
    setPrivateKey(privateKey) {
      this.myPrivateKey = privateKey
    }
  }
})
