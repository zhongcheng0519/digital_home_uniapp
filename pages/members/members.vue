<template>
  <view class="members-container">
    <view class="header">
      <text class="title">家庭成员</text>
      <text class="family-name">{{ familyStore.familyName || '未选择家庭' }}</text>
    </view>
    
    <view class="members-list" v-if="members.length > 0">
      <view class="member-item" v-for="member in members" :key="member.user_id">
        <view class="member-avatar">
          <text class="avatar-text">{{ getAvatarText(member.username) }}</text>
        </view>
        <view class="member-info">
          <text class="member-name">{{ member.username }}</text>
          <text class="member-phone">{{ maskPhone(member.phone) }}</text>
          <text class="member-role" :class="member.role">{{ member.role }}</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else-if="!loading">
      <text class="empty-text">暂无成员</text>
    </view>
    
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
    
    <view class="invite-btn-container" v-if="isOwner && !loading">
      <button class="btn-invite" @click="showInviteModal">邀请成员</button>
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
          <view class="form-item">
            <text class="label">角色</text>
            <picker mode="selector" :range="roleOptions" @change="onRoleChange" :value="selectedRoleIndex">
              <view class="picker">
                <text :class="{ placeholder: !selectedRole }">{{ selectedRole || '请选择角色' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
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
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../src/stores/user'
import { useFamilyStore } from '../../src/stores/family'
import familyApi from '../../src/api/family'
import { encryptKeyWithRSA } from '../../src/utils/crypto'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const members = ref([])
const loading = ref(false)
const showInvite = ref(false)
const invitePhone = ref('')
const inviting = ref(false)
const selectedRole = ref('')
const selectedRoleIndex = ref(-1)
const roleOptions = ['儿子', '女儿', '爸爸', '妈妈', '岳父', '岳母']

const isOwner = computed(() => {
  const currentFamily = familyStore.myFamilies.find(f => f.id === familyStore.familyId)
  return currentFamily && ['男主人', '女主人'].includes(currentFamily.role)
})

const canInviteSubmit = computed(() => {
  return invitePhone.value && /^1[3-9]\d{9}$/.test(invitePhone.value) && selectedRole.value
})

const getAvatarText = (username) => {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const loadMembers = async () => {
  if (!familyStore.hasCurrentFamily) {
    uni.showModal({
      title: '提示',
      content: '您还没有选择家庭，是否立即创建？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/family/create'
          })
        }
      }
    })
    return
  }
  
  loading.value = true
  
  try {
    const data = await familyApi.getFamilyMembers(familyStore.familyId)
    members.value = data
  } catch (error) {
    console.error('加载成员列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const showInviteModal = () => {
  showInvite.value = true
  invitePhone.value = ''
  selectedRole.value = ''
  selectedRoleIndex.value = -1
}

const hideInviteModal = () => {
  showInvite.value = false
  invitePhone.value = ''
  selectedRole.value = ''
  selectedRoleIndex.value = -1
}

const onRoleChange = (e) => {
  const index = e.detail.value
  selectedRoleIndex.value = index
  selectedRole.value = roleOptions[index]
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
  
  inviting.value = true
  
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
      encrypted_key_for_target: encryptedKeyForTarget,
      role: selectedRole.value
    })
    
    uni.showToast({ title: '邀请成功', icon: 'success' })
    
    setTimeout(() => {
      hideInviteModal()
      loadMembers()
    }, 1500)
    
  } catch (error) {
    console.error('邀请失败:', error)
    const message = error.message || error.detail || '邀请失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    inviting.value = false
  }
}

onMounted(async () => {
  userStore.loadFromStorage()
  
  if (!userStore.isLoggedIn) {
    uni.reLaunch({
      url: '/pages/auth/login'
    })
    return
  }
  
  await loadMembers()
})

onShow(async () => {
  if (userStore.isLoggedIn && familyStore.hasCurrentFamily) {
    await loadMembers()
  }
})
</script>

<style scoped>
.members-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
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

.family-name {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.members-list {
  padding: 20rpx;
}

.member-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.member-phone {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.member-role {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 500;
}

.member-role.男主人,
.member-role.女主人 {
  color: #ff6b6b;
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

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx;
  font-size: 28rpx;
  color: #999999;
}

.invite-btn-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #e5e5e5;
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

.form-item .picker {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-item .picker .placeholder {
  color: #999999;
}

.form-item .picker .picker-arrow {
  color: #999999;
  font-size: 20rpx;
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