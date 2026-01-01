<template>
  <view class="index-container">
    <view class="header">
      <text class="title">{{ familyStore.familyName || '数字家' }}</text>
      <view class="header-actions">
        <text class="action-btn" @click="switchFamily">切换家庭</text>
        <text class="action-btn" @click="goToCreate">发布</text>
      </view>
    </view>
    
    <view class="filter-bar">
      <picker 
        mode="date" 
        fields="year" 
        :value="selectedYear" 
        @change="onYearChange"
      >
        <view class="filter-item">
          <text class="filter-label">年份：</text>
          <text class="filter-value">{{ selectedYear || '全部' }}</text>
          <text class="filter-arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <view class="timeline" v-if="milestones.length > 0">
      <view 
        class="timeline-item" 
        v-for="milestone in milestones" 
        :key="milestone.id"
      >
        <view class="timeline-dot"></view>
        <view class="timeline-content">
          <view class="timeline-date">{{ formatDate(milestone.event_date) }}</view>
          <view class="timeline-text">{{ milestone.decryptedContent || '解密中...' }}</view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else-if="!loading">
      <text class="empty-text">暂无大事记</text>
      <text class="empty-hint">点击"发布"按钮记录美好时刻</text>
    </view>
    
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../src/stores/user'
import { useFamilyStore } from '../../src/stores/family'
import familyApi from '../../src/api/family'
import milestoneApi from '../../src/api/milestone'
import { decryptData } from '../../src/utils/crypto'
import dayjs from '../../src/utils/dayjs'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const milestones = ref([])
const selectedYear = ref('')
const loading = ref(false)

const formatDate = (dateStr) => {
  return dayjs.utc(dateStr).utcOffset(8).format('YYYY年MM月DD日')
}

const onYearChange = (e) => {
  selectedYear.value = e.detail.value
  loadMilestones()
}

const loadFamilies = async () => {
  try {
    const families = await familyApi.getMyFamilies()
    familyStore.setMyFamilies(families)
    
    if (families.length > 0) {
      const family = families[0]
      familyStore.setCurrentFamily(family)
      
      try {
        await familyStore.unlockFamily(family.encrypted_family_key, userStore.myPrivateKey)
      } catch (error) {
        console.error('解密家庭密钥失败:', error)
        uni.showToast({ title: '无法解密家庭数据', icon: 'none' })
      }
    } else {
      uni.showModal({
        title: '提示',
        content: '您还没有创建家庭，是否立即创建？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/family/create'
            })
          }
        }
      })
    }
  } catch (error) {
    console.error('加载家庭列表失败:', error)
    uni.showToast({ title: '加载家庭列表失败', icon: 'none' })
  }
}

const loadMilestones = async () => {
  if (!familyStore.hasCurrentFamily) {
    return
  }
  
  loading.value = true
  
  try {
    const params = {
      family_id: familyStore.familyId
    }
    
    if (selectedYear.value) {
      params.year = selectedYear.value
    }
    
    const data = await milestoneApi.getMilestones(params)
    
    milestones.value = data.map(item => ({
      ...item,
      decryptedContent: ''
    }))
    
    await decryptMilestones()
    
  } catch (error) {
    console.error('加载大事记失败:', error)
    uni.showToast({ title: '加载大事记失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const decryptMilestones = async () => {
  const familyKey = familyStore.currentFamilyKey
  
  if (!familyKey) {
    return
  }
  
  for (const milestone of milestones.value) {
    try {
      milestone.decryptedContent = decryptData(
        milestone.content_ciphertext,
        familyKey
      )
    } catch (error) {
      console.error('解密失败:', error)
      milestone.decryptedContent = '无法解密'
    }
  }
}

const goToCreate = () => {
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '请先创建或选择家庭', icon: 'none' })
    return
  }
  
  uni.navigateTo({
    url: '/pages/create/create'
  })
}

const switchFamily = () => {
  uni.navigateTo({
    url: '/pages/family/invite'
  })
}

onMounted(async () => {
  userStore.loadFromStorage()
  
  if (!userStore.isLoggedIn) {
    uni.reLaunch({
      url: '/pages/auth/login'
    })
    return
  }
  
  await loadFamilies()
  await loadMilestones()
})

onShow(async () => {
  if (userStore.isLoggedIn && familyStore.hasCurrentFamily) {
    await loadMilestones()
  }
})
</script>

<style scoped>
.index-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.header-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.filter-bar {
  background: #ffffff;
  padding: 24rpx 40rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.filter-label {
  font-size: 28rpx;
  color: #666666;
}

.filter-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.filter-arrow {
  font-size: 20rpx;
  color: #999999;
}

.timeline {
  padding: 40rpx;
}

.timeline-item {
  display: flex;
  margin-bottom: 60rpx;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 12rpx;
  top: 24rpx;
  bottom: -60rpx;
  width: 2rpx;
  background: #e5e5e5;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  margin-right: 30rpx;
  flex-shrink: 0;
  margin-top: 8rpx;
}

.timeline-content {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.timeline-date {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 12rpx;
}

.timeline-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
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
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: 28rpx;
  color: #cccccc;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx;
  font-size: 28rpx;
  color: #999999;
}
</style>
