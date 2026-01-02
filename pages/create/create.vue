<template>
  <view class="create-container">
    <view class="header">
      <text class="title">{{ isEdit ? '编辑大事记' : '发布大事记' }}</text>
      <text class="back-btn" @click="goBack">取消</text>
    </view>
    
    <view class="form">
      <view class="form-item">
        <text class="label">日期</text>
        <picker 
          mode="date" 
          :value="eventDate" 
          @change="onDateChange"
        >
          <view class="picker-input">
            <text class="picker-text">{{ eventDate || '请选择日期' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">内容</text>
        <textarea 
          class="textarea" 
          v-model="content" 
          placeholder="记录这一刻的美好..."
          maxlength="1000"
          :show-confirm-bar="false"
        />
        <text class="char-count">{{ content.length }}/1000</text>
      </view>
      
      <button 
        class="btn-submit" 
        :disabled="loading || !canSubmit" 
        @click="handleSubmit"
      >
        {{ loading ? (isEdit ? '保存中...' : '发布中...') : (isEdit ? '保存' : '发布') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFamilyStore } from '../../src/stores/family'
import milestoneApi from '../../src/api/milestone'
import { encryptData } from '../../src/utils/crypto'
import dayjs from '../../src/utils/dayjs'

const familyStore = useFamilyStore()

const eventDate = ref(dayjs().utcOffset(8).format('YYYY-MM-DD'))
const content = ref('')
const loading = ref(false)
const milestoneId = ref(null)

const isEdit = computed(() => {
  return milestoneId.value !== null
})

const canSubmit = computed(() => {
  return eventDate.value && content.value && content.value.trim().length > 0
})

onLoad((options) => {
  if (options.id) {
    milestoneId.value = parseInt(options.id)
  }
  if (options.date) {
    eventDate.value = options.date
  }
  if (options.content) {
    try {
      content.value = decodeURIComponent(options.content)
    } catch (e) {
      content.value = options.content || ''
    }
  }
})

const onDateChange = (e) => {
  eventDate.value = e.detail.value
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '家庭信息异常', icon: 'none' })
    return
  }
  
  loading.value = true
  
  try {
    const contentCiphertext = encryptData(content.value, familyStore.currentFamilyKey)
    
    if (isEdit.value) {
      await milestoneApi.updateMilestone(milestoneId.value, {
        event_date: eventDate.value,
        content_ciphertext: contentCiphertext
      })
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await milestoneApi.createMilestone({
        family_id: familyStore.familyId,
        event_date: eventDate.value,
        content_ciphertext: contentCiphertext
      })
      uni.showToast({ title: '发布成功', icon: 'success' })
    }
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    console.error(isEdit.value ? '保存失败:' : '发布失败:', error)
    const message = error.message || error.detail || (isEdit.value ? '保存失败' : '发布失败')
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (content.value.trim() && !isEdit.value) {
    uni.showModal({
      title: '提示',
      content: '确定要放弃编辑吗？',
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
.create-container {
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

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #333333;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999999;
}

.textarea {
  width: 100%;
  min-height: 300rpx;
  padding: 24rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: none;
  box-sizing: border-box;
  line-height: 1.6;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999999;
  margin-top: 10rpx;
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
</style>
