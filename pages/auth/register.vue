<template>
  <view class="register-container">
    <view class="header">
      <text class="title">注册账号</text>
      <text class="subtitle">创建您的数字家账户</text>
    </view>
    
    <view class="form">
      <view class="form-item">
        <text class="label">手机号</text>
        <input 
          class="input" 
          type="number" 
          v-model="phone" 
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>
      
      <view class="form-item">
        <text class="label">姓名</text>
        <input 
          class="input" 
          type="text" 
          v-model="username" 
          placeholder="请输入姓名"
          maxlength="20"
          confirm-type="next"
        />
      </view>
      
      <view class="form-item">
        <text class="label">密码</text>
        <input 
          class="input" 
          type="password" 
          v-model="password" 
          placeholder="请输入密码（至少6位）"
          maxlength="20"
        />
      </view>
      
      <view class="form-item">
        <text class="label">确认密码</text>
        <input 
          class="input" 
          type="password" 
          v-model="confirmPassword" 
          placeholder="请再次输入密码"
          maxlength="20"
        />
      </view>
      
      <button 
        class="btn-register" 
        :disabled="loading" 
        @click="handleRegister"
      >
        {{ loading ? '注册中...' : '注册' }}
      </button>
      
      <view class="footer">
        <text class="footer-text">已有账号？</text>
        <text class="link" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../src/stores/user'
import authApi from '../../src/api/auth'
import { generateRSAKeyPair, encryptPrivateKey } from '../../src/utils/crypto'

const userStore = useUserStore()

const phone = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const validateForm = () => {
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return false
  }
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return false
  }
  if (!username.value) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return false
  }
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  if (password.value.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return false
  }
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return false
  }
  return true
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    uni.showLoading({ title: '生成密钥中...' })
    
    const { publicKey, privateKey } = generateRSAKeyPair()
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password.value)
    
    uni.hideLoading()
    uni.showLoading({ title: '注册中...' })
    
    await authApi.register({
      phone: phone.value,
      username: username.value,
      password: password.value,
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey
    })
    
    uni.hideLoading()
    uni.showToast({ title: '注册成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/auth/login'
      })
    }, 1500)
    
  } catch (error) {
    uni.hideLoading()
    const message = error.message || error.detail || '注册失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/auth/login'
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
  padding-top: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 16rpx;
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

.btn-register {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
  margin-top: 20rpx;
}

.btn-register:disabled {
  opacity: 0.6;
}

.footer {
  text-align: center;
  margin-top: 40rpx;
}

.footer-text {
  font-size: 28rpx;
  color: #999999;
}

.link {
  font-size: 28rpx;
  color: #667eea;
  margin-left: 10rpx;
}
</style>
