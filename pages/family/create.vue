<template>
  <view class="create-family-container">
    <view class="header">
      <text class="title">创建家庭</text>
      <text class="back-btn" @click="goBack">取消</text>
    </view>
    
    <view class="form">
      <view class="form-item">
        <text class="label">家庭名称</text>
        <input 
          class="input" 
          type="text" 
          v-model="familyName" 
          placeholder="请输入家庭名称"
          maxlength="20"
        />
      </view>
      
      <button 
        class="btn-submit" 
        :disabled="loading || !canSubmit" 
        @click="handleSubmit"
      >
        {{ loading ? '创建中...' : '创建' }}
      </button>
      
      <view class="tips">
        <text class="tips-title">提示</text>
        <text class="tips-text">创建家庭后，您将成为家庭拥有者，可以邀请其他成员加入。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../../src/stores/user'
import { useFamilyStore } from '../../src/stores/family'
import familyApi from '../../src/api/family'
import { generateAESKey, encryptKeyWithRSA } from '../../src/utils/crypto'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const familyName = ref('')
const loading = ref(false)

const canSubmit = computed(() => {
  return familyName.value.trim().length > 0
})

const handleSubmit = async () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请输入家庭名称', icon: 'none' })
    return
  }
  
  loading.value = true
  
  try {
    uni.showLoading({ title: '生成密钥中...' })
    
    const familyKey = generateAESKey()
    const encryptedFamilyKey = encryptKeyWithRSA(familyKey, userStore.publicKey)
    
    uni.hideLoading()
    uni.showLoading({ title: '创建中...' })
    
    const family = await familyApi.createFamily({
      name: familyName.value,
      encrypted_family_key: encryptedFamilyKey
    })
    
    familyStore.setCurrentFamily(family)
    familyStore.setFamilyKey(familyKey)
    familyStore.addFamily({
      ...family,
      encrypted_family_key: encryptedFamilyKey,
      role: 'owner'
    })
    
    uni.hideLoading()
    uni.showToast({ title: '创建成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    uni.hideLoading()
    console.error('创建家庭失败:', error)
    const message = error.message || error.detail || '创建失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (familyName.value.trim()) {
    uni.showModal({
      title: '提示',
      content: '确定要放弃创建吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
  } else {
    uni.navigateBack()
  }
}
</script>

<style scoped>
.create-family-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #ffffff;
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #e5e5e5;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.back-btn {
  font-size: 28rpx;
  color: #667eea;
}

.form {
  padding: 40rpx;
}

.form-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: none;
  box-sizing: border-box;
}

.btn-submit {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}

.btn-submit:disabled {
  opacity: 0.6;
}

.tips {
  background: #fff8e6;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 40rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  color: #ff9800;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.tips-text {
  display: block;
  font-size: 24rpx;
  color: #666666;
  line-height: 1.6;
}
</style>
