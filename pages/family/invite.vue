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
      <button class="btn-invite" @click="showInviteModal" v-if="canInvite">邀请成员</button>
      <button class="btn-create" @click="goToCreateFamily">创建新家庭</button>
    </view>
    
    <view class="modal-overlay" v-if="showInvite" @click="hideInviteModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">邀请家庭成员</text>
          <text class="modal-close" @click="hideInviteModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">手机号</text>
            <input 
              class="input" 
              v-model="invitePhone" 
              placeholder="请输入对方手机号"
              type="number"
              maxlength="11"
            />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="hideInviteModal">取消</button>
          <button 
            class="btn-confirm" 
            :disabled="loading || !canInviteSubmit" 
            @click="handleInvite"
          >
            {{ loading ? '邀请中...' : '邀请' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFamilyStore } from '../../src/stores/family'
import { useUserStore } from '../../src/stores/user'
import familyApi from '../../src/api/family'
import { encryptKeyWithRSA } from '../../src/utils/crypto'

const familyStore = useFamilyStore()
const userStore = useUserStore()

const families = ref([])
const currentFamilyId = ref(null)
const showInvite = ref(false)
const invitePhone = ref('')
const loading = ref(false)

const canInvite = computed(() => {
  const currentFamily = families.value.find(f => f.id === currentFamilyId.value)
  return currentFamily && currentFamily.role === 'owner'
})

const canInviteSubmit = computed(() => {
  return invitePhone.value && /^1[3-9]\d{9}$/.test(invitePhone.value)
})

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

const showInviteModal = () => {
  showInvite.value = true
  invitePhone.value = ''
}

const hideInviteModal = () => {
  showInvite.value = false
  invitePhone.value = ''
}

const handleInvite = async () => {
  if (!canInviteSubmit.value) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  if (!familyStore.currentFamilyKey) {
    uni.showToast({ title: '家庭密钥未加载', icon: 'none' })
    return
  }
  
  loading.value = true
  
  try {
    const publicKeyResponse = await familyApi.getUserPublicKey(invitePhone.value)
    const targetPublicKey = publicKeyResponse.public_key
    
    const encryptedKeyForTarget = encryptKeyWithRSA(
      familyStore.currentFamilyKey,
      targetPublicKey
    )
    
    await familyApi.addMember({
      family_id: familyStore.familyId,
      target_phone: invitePhone.value,
      encrypted_key_for_target: encryptedKeyForTarget
    })
    
    uni.showToast({ title: '邀请成功', icon: 'success' })
    
    setTimeout(() => {
      hideInviteModal()
    }, 1500)
    
  } catch (error) {
    console.error('邀请失败:', error)
    const message = error.message || error.detail || '邀请失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
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
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.btn-invite {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 20rpx;
  width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-item .label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 16rpx;
}

.form-item .input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.modal-footer {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  gap: 20rpx;
}

.btn-cancel {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  color: #666666;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.btn-confirm {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.btn-confirm:disabled {
  opacity: 0.5;
}
</style>
