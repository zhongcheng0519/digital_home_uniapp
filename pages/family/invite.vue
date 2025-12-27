<template>
  <view class="invite-container">
    <view class="header">
      <text class="title">我的家庭</text>
      <text class="back-btn" @click="goBack">返回</text>
    </view>
    
    <view class="family-list" v-if="families.length > 0">
      <view 
        class="family-item" 
        v-for="family in families" 
        :key="family.id"
        :class="{ active: currentFamilyId === family.id }"
        @click="selectFamily(family)"
      >
        <view class="family-info">
          <text class="family-name">{{ family.name }}</text>
          <text class="family-role">{{ family.role === 'owner' ? '拥有者' : '成员' }}</text>
        </view>
        <text class="check-icon" v-if="currentFamilyId === family.id">✓</text>
      </view>
    </view>
    
    <view class="empty" v-else>
      <text class="empty-text">暂无家庭</text>
    </view>
    
    <view class="actions">
      <button class="btn-create" @click="goToCreateFamily">创建新家庭</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFamilyStore } from '../../src/stores/family'
import { useUserStore } from '../../src/stores/user'
import familyApi from '../../src/api/family'

const familyStore = useFamilyStore()
const userStore = useUserStore()

const families = ref([])
const currentFamilyId = ref(null)

const selectFamily = async (family) => {
  if (currentFamilyId.value === family.id) {
    return
  }
  
  try {
    uni.showLoading({ title: '切换中...' })
    
    await familyStore.unlockFamily(family.encrypted_family_key, userStore.myPrivateKey)
    familyStore.setCurrentFamily(family)
    currentFamilyId.value = family.id
    
    uni.hideLoading()
    uni.showToast({ title: '切换成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    uni.hideLoading()
    console.error('切换家庭失败:', error)
    uni.showToast({ title: '切换失败，无法解密家庭数据', icon: 'none' })
  }
}

const loadFamilies = async () => {
  try {
    const data = await familyApi.getMyFamilies()
    families.value = data
    currentFamilyId.value = familyStore.currentFamily?.id
  } catch (error) {
    console.error('加载家庭列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const goToCreateFamily = () => {
  uni.navigateTo({
    url: '/pages/family/create'
  })
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  loadFamilies()
})
</script>

<style scoped>
.invite-container {
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

.family-list {
  padding: 20rpx;
}

.family-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2rpx solid transparent;
}

.family-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.family-info {
  flex: 1;
}

.family-name {
  display: block;
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 10rpx;
}

.family-role {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.check-icon {
  font-size: 40rpx;
  color: #667eea;
  font-weight: bold;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999999;
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #e5e5e5;
}

.btn-create {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}
</style>
