<template>
  <view class="login-container">
    <view class="header">
      <text class="title">欢迎回来</text>
      <text class="subtitle">登录您的数字家账户</text>
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
        <text class="label">密码</text>
        <input 
          class="input" 
          type="password" 
          v-model="password" 
          placeholder="请输入密码"
          maxlength="20"
        />
      </view>
      
      <button 
        class="btn-login" 
        :disabled="loading" 
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <view class="footer">
        <text class="footer-text">还没有账号？</text>
        <text class="link" @click="goToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../src/stores/user'
import { useFamilyStore } from '../../src/stores/family'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const phone = ref('')
const password = ref('')
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
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  return true
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    await userStore.login(phone.value, password.value)
    
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
    
  } catch (error) {
    const message = error.message || error.detail || '登录失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/auth/register'
  })
}
</script>

<style scoped>
.login-container {
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

.btn-login {
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

.btn-login:disabled {
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
