<script setup>
import { useUserStore } from '@/src/stores/user'
import { useFamilyStore } from '@/src/stores/family'

const userStore = useUserStore()
const familyStore = useFamilyStore()

onLaunch(() => {
  userStore.loadFromStorage()
  familyStore.loadFromStorage()
})

onShow(() => {
  checkAuth()
})

const checkAuth = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage ? currentPage.route : ''
  
  if (!userStore.isLoggedIn && currentRoute !== 'pages/auth/register' && currentRoute !== 'pages/auth/login') {
    uni.reLaunch({
      url: '/pages/auth/login'
    })
  }
}
</script>

<style>
page {
  background-color: #f5f5f5;
}

.container {
  padding: 20rpx;
}

.btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  text-align: center;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.input {
  width: 100%;
  height: 88rpx;
  padding: 0 30rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 44rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}

.input:focus {
  border-color: #667eea;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx 30rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.textarea:focus {
  border-color: #667eea;
}
</style>
