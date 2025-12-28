import { defineStore } from 'pinia'
import { decryptKeyWithRSA } from '../utils/crypto'

export const useFamilyStore = defineStore('family', {
  state: () => ({
    currentFamily: null,
    currentFamilyKey: '',
    myFamilies: []
  }),
  
  getters: {
    hasCurrentFamily: (state) => !!state.currentFamily && !!state.currentFamilyKey,
    familyId: (state) => state.currentFamily?.id,
    familyName: (state) => state.currentFamily?.name
  },
  
  actions: {
    setCurrentFamily(family) {
      this.currentFamily = family
    },
    
    async unlockFamily(encryptedFamilyKey, userPrivateKey) {
      try {
        const decryptedKey = decryptKeyWithRSA(encryptedFamilyKey, userPrivateKey)
        this.currentFamilyKey = decryptedKey
        return true
      } catch (error) {
        console.error('解密家庭密钥失败:', error)
        throw new Error('无法解密家庭密钥')
      }
    },
    
    setFamilyKey(key) {
      this.currentFamilyKey = key
    },
    
    clearCurrentFamily() {
      this.currentFamily = null
      this.currentFamilyKey = ''
    },
    
    setMyFamilies(families) {
      this.myFamilies = families
    },
    
    addFamily(family) {
      const exists = this.myFamilies.find(f => f.id === family.id)
      if (!exists) {
        this.myFamilies.push(family)
      }
    },
    
    loadFromStorage() {
      const families = uni.getStorageSync('myFamilies')
      if (families) {
        this.myFamilies = families
      }
    },
    
    clearAll() {
      this.currentFamily = null
      this.currentFamilyKey = ''
      this.myFamilies = []
    }
  }
})
