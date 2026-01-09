<template>
  <view class="note-container">
    <view class="category-filter">
      <view 
        class="category-item" 
        :class="{ active: selectedCategory === '' }"
        @click="selectCategory('')"
      >
        <text class="category-text">全部</text>
      </view>
      <view 
        class="category-item" 
        :class="{ active: selectedCategory === '地址信息' }"
        @click="selectCategory('地址信息')"
      >
        <text class="category-text">地址信息</text>
      </view>
      <view 
        class="category-item" 
        :class="{ active: selectedCategory === '药方' }"
        @click="selectCategory('药方')"
      >
        <text class="category-text">药方</text>
      </view>
    </view>
    
    <view class="fab" @click="showAddModal = true">
      <text class="fab-icon">+</text>
    </view>
    
    <view class="note-list" v-if="notes.length > 0">
      <view 
        class="note-card" 
        :class="'note-' + note.category"
        v-for="note in notes" 
        :key="note.id"
        @click="handleViewNote(note)"
      >
        <view class="note-header">
          <view class="note-title">{{ note.decryptedTitle || '解密中...' }}</view>
          <view class="note-actions" @click.stop>
            <view class="note-action-btn copy" @click="handleCopy(note)">
              <image class="action-icon-image" src="/static/copy.png" mode="aspectFit" />
            </view>
            <view class="note-action-btn edit" @click="handleEdit(note)">
              <text class="action-icon">✏️</text>
            </view>
            <view class="note-action-btn delete" @click="handleDelete(note)">
              <text class="action-icon">🗑️</text>
            </view>
          </view>
        </view>
        <view class="note-content">{{ note.decryptedContent }}</view>
        <view class="note-meta">
          <text class="note-creator">创建者: {{ note.creatorName }}</text>
          <text class="note-date">{{ formatTime(note.created_at) }}</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else-if="!loading">
      <text class="empty-text">暂无便利贴</text>
      <text class="empty-hint">点击"+ 新建"按钮添加便利贴</text>
    </view>
    
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
    
    <view class="modal" v-if="showAddModal" @click="showAddModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新建便利贴</text>
          <text class="modal-close" @click="showAddModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">标题 *</text>
            <input 
              class="form-input" 
              v-model="newNote.title" 
              placeholder="请输入便利贴标题"
            />
          </view>
          <view class="form-item">
            <text class="form-label">内容 *</text>
            <textarea 
              class="form-textarea" 
              v-model="newNote.content" 
              placeholder="请输入便利贴内容"
              :maxlength="1000"
            />
          </view>
          <view class="form-item">
            <text class="form-label">分类</text>
            <view class="category-selector">
              <view 
                class="category-option" 
                :class="{ selected: newNote.category === '地址信息' }"
                @click="newNote.category = '地址信息'"
              >
                <text class="category-option-text">地址信息</text>
              </view>
              <view 
                class="category-option" 
                :class="{ selected: newNote.category === '药方' }"
                @click="newNote.category = '药方'"
              >
                <text class="category-option-text">药方</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <text class="modal-btn cancel" @click="showAddModal = false">取消</text>
          <text class="modal-btn confirm" @click="handleAddNote">确定</text>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showEditModalFlag" @click="showEditModalFlag = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">编辑便利贴</text>
          <text class="modal-close" @click="showEditModalFlag = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">标题 *</text>
            <input 
              class="form-input" 
              v-model="editingNote.title" 
              placeholder="请输入便利贴标题"
            />
          </view>
          <view class="form-item">
            <text class="form-label">内容 *</text>
            <textarea 
              class="form-textarea" 
              v-model="editingNote.content" 
              placeholder="请输入便利贴内容"
              :maxlength="1000"
            />
          </view>
          <view class="form-item">
            <text class="form-label">分类</text>
            <view class="category-selector">
              <view 
                class="category-option" 
                :class="{ selected: editingNote.category === '地址信息' }"
                @click="editingNote.category = '地址信息'"
              >
                <text class="category-option-text">地址信息</text>
              </view>
              <view 
                class="category-option" 
                :class="{ selected: editingNote.category === '药方' }"
                @click="editingNote.category = '药方'"
              >
                <text class="category-option-text">药方</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <text class="modal-btn cancel" @click="showEditModalFlag = false">取消</text>
          <text class="modal-btn confirm" @click="handleEditNote">确定</text>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showViewModal" @click="showViewModal = false">
      <view class="modal-content view-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ viewingNote.title }}</text>
          <text class="modal-close" @click="showViewModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="view-category-tag" :class="'tag-' + viewingNote.category">
            <text class="category-tag-text">{{ viewingNote.category }}</text>
          </view>
          <view class="view-content" v-html="renderMarkdown(viewingNote.content)"></view>
          <view class="view-meta">
            <text class="view-creator">创建者: {{ viewingNote.creatorName }}</text>
            <text class="view-date">{{ formatTime(viewingNote.created_at) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../src/stores/user'
import { useFamilyStore } from '../../src/stores/family'
import noteApi from '../../src/api/note'
import authApi from '../../src/api/auth'
import { encryptData, decryptData } from '../../src/utils/crypto'
import dayjs from '../../src/utils/dayjs'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const notes = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const showEditModalFlag = ref(false)
const showViewModal = ref(false)
const selectedCategory = ref('')
const newNote = ref({
  title: '',
  content: '',
  category: '地址信息'
})
const editingNote = ref({
  id: null,
  title: '',
  content: '',
  category: '地址信息'
})
const viewingNote = ref({
  title: '',
  content: '',
  category: '',
  creatorName: '',
  created_at: ''
})

const selectCategory = async (category) => {
  selectedCategory.value = category
  await loadNotes()
}

const formatTime = (timeStr) => {
  return dayjs.utc(timeStr).utcOffset(8).format('MM-DD HH:mm')
}

const renderMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
  
    html = html.replace(/&/g, '&amp;')
    html = html.replace(/</g, '&lt;')
    html = html.replace(/>/g, '&gt;')
  
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>')
  
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
  
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>')
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
  
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>')
  
    html = html.replace(/\n/g, '<br>')
  
  return html
}

const loadNotes = async () => {
  if (!familyStore.hasCurrentFamily) {
    return
  }
  
  loading.value = true
  
  try {
    const params = {
      family_id: familyStore.familyId
    }
    
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    
    const data = await noteApi.getNotes(params)
    
    notes.value = data
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(item => ({
        ...item,
        decryptedTitle: '',
        decryptedContent: '',
        creatorName: ''
      }))
    
    await decryptNotes()
    await loadCreatorNames()
    
  } catch (error) {
    console.error('加载便利贴失败:', error)
    uni.showToast({ title: '加载便利贴失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadCreatorNames = async () => {
  const creatorIds = [...new Set(notes.value.map(note => note.creator_id))]
  
  for (const creatorId of creatorIds) {
    try {
      const result = await authApi.getUsername(creatorId)
      const username = result.username
      
      notes.value.forEach(note => {
        if (note.creator_id === creatorId) {
          note.creatorName = username
        }
      })
    } catch (error) {
      console.error('获取创建者名称失败:', error)
      notes.value.forEach(note => {
        if (note.creator_id === creatorId) {
          note.creatorName = '未知用户'
        }
      })
    }
  }
}

const decryptNotes = async () => {
  const familyKey = familyStore.currentFamilyKey
  
  if (!familyKey) {
    return
  }
  
  for (const note of notes.value) {
    try {
      note.decryptedTitle = decryptData(
        note.title_ciphertext,
        familyKey
      )
      
      note.decryptedContent = decryptData(
        note.content_ciphertext,
        familyKey
      )
    } catch (error) {
      console.error('解密失败:', error)
      note.decryptedTitle = '无法解密'
      note.decryptedContent = '无法解密'
    }
  }
}

const handleAddNote = async () => {
  if (!newNote.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  
  if (!newNote.value.content.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '请先创建或选择家庭', icon: 'none' })
    return
  }
  
  try {
    const familyKey = familyStore.currentFamilyKey
    
    const titleCiphertext = encryptData(newNote.value.title, familyKey)
    const contentCiphertext = encryptData(newNote.value.content, familyKey)
    
    await noteApi.createNote({
      family_id: familyStore.familyId,
      title_ciphertext: titleCiphertext,
      content_ciphertext: contentCiphertext,
      category: newNote.value.category
    })
    
    uni.showToast({ title: '创建成功', icon: 'success' })
    showAddModal.value = false
    newNote.value = {
      title: '',
      content: '',
      category: '地址信息'
    }
    
    await loadNotes()
    
  } catch (error) {
    console.error('创建便利贴失败:', error)
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

const handleEdit = (note) => {
  showEditModal(note)
}

const handleViewNote = (note) => {
  viewingNote.value = {
    title: note.decryptedTitle,
    content: note.decryptedContent,
    category: note.category || '地址信息',
    creatorName: note.creatorName,
    created_at: note.created_at
  }
  showViewModal.value = true
}

const handleCopy = (note) => {
  const content = note.decryptedContent
  if (!content) {
    uni.showToast({
      title: '内容为空',
      icon: 'none'
    })
    return
  }
  
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

const handleDelete = (note) => {
  deleteNote(note)
}

const showEditModal = (note) => {
  editingNote.value = {
    id: note.id,
    title: note.decryptedTitle,
    content: note.decryptedContent,
    category: note.category || '地址信息'
  }
  showEditModalFlag.value = true
}

const handleEditNote = async () => {
  if (!editingNote.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  
  if (!editingNote.value.content.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  
  try {
    const familyKey = familyStore.currentFamilyKey
    
    const titleCiphertext = encryptData(editingNote.value.title, familyKey)
    const contentCiphertext = encryptData(editingNote.value.content, familyKey)
    
    await noteApi.updateNote(editingNote.value.id, {
      title_ciphertext: titleCiphertext,
      content_ciphertext: contentCiphertext,
      category: editingNote.value.category
    })
    
    uni.showToast({ title: '修改成功', icon: 'success' })
    showEditModalFlag.value = false
    
    await loadNotes()
    
  } catch (error) {
    console.error('修改便利贴失败:', error)
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

const deleteNote = (note) => {
  uni.showModal({
    title: '删除便利贴',
    content: '确定要删除这个便利贴吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await noteApi.deleteNote(note.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          await loadNotes()
        } catch (error) {
          console.error('删除便利贴失败:', error)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
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
  
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '请先创建或选择家庭', icon: 'none' })
    return
  }
  
  await loadNotes()
})

onShow(async () => {
  if (userStore.isLoggedIn && familyStore.hasCurrentFamily) {
    await loadNotes()
  }
})
</script>

<style scoped>
.note-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.category-filter {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx 20rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.category-item {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  transition: all 0.3s;
}

.category-item.active {
  background: rgba(255, 255, 255, 0.3);
}

.category-text {
  font-size: 28rpx;
  color: #ffffff;
}

.note-list {
  padding: 20rpx;
}

.note-card {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.note-地址信息 {
  background: #FFF9C4;
}

.note-药方 {
  background: #C8E6C9;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.note-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
  padding-right: 20rpx;
}

.note-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.note-action-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-left: 12rpx;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60rpx;
  height: 56rpx;
}

.action-icon {
  font-size: 28rpx;
  line-height: 1;
}

.action-icon-image {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.note-action-btn.copy {
  background: #E3F2FD;
  color: #1976D2;
}

.note-action-btn.edit {
  background: #FFF3E0;
  color: #F57C00;
}

.note-action-btn.delete {
  background: #f44336;
  color: #ffffff;
}

.note-content {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16rpx;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: #999999;
}

.note-creator {
  flex: 1;
}

.note-date {
  flex-shrink: 0;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.4);
  z-index: 1000;
}

.fab-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: bold;
}

.empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  padding: 200rpx 40rpx;
  font-size: 28rpx;
  color: #999999;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: #ffffff;
  border-radius: 16rpx;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 48rpx;
  color: #999999;
  padding: 0 10rpx;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #dddddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #dddddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  min-height: 200rpx;
  box-sizing: border-box;
}

.category-selector {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.category-option {
  padding: 16rpx 32rpx;
  border: 1rpx solid #dddddd;
  border-radius: 20rpx;
  background: #ffffff;
}

.category-option.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.category-option-text {
  font-size: 28rpx;
  color: #333333;
}

.category-option.selected .category-option-text {
  color: #ffffff;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
  border-top: 1rpx solid #eeeeee;
}

.modal-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin: 0 10rpx;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666666;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.view-modal {
  max-height: 85vh;
}

.view-category-tag {
  display: inline-block;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.tag-地址信息 {
  background: #FFF9C4;
}

.tag-药方 {
  background: #C8E6C9;
}

.category-tag-text {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.view-content {
  font-size: 30rpx;
  line-height: 1.8;
  color: #333333;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.view-content h1 {
  font-size: 40rpx;
  font-weight: bold;
  margin: 30rpx 0 20rpx 0;
  color: #333333;
}

.view-content h2 {
  font-size: 36rpx;
  font-weight: bold;
  margin: 24rpx 0 16rpx 0;
  color: #333333;
}

.view-content h3 {
  font-size: 32rpx;
  font-weight: bold;
  margin: 20rpx 0 12rpx 0;
  color: #333333;
}

.view-content strong {
  font-weight: bold;
  color: #333333;
}

.view-content em {
  font-style: italic;
  color: #666666;
}

.view-content code {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #e0e0e0;
  border-radius: 6rpx;
  font-family: monospace;
  font-size: 26rpx;
  color: #d63384;
}

.view-content a {
  color: #667eea;
  text-decoration: underline;
}

.view-content li {
  margin: 12rpx 0;
  padding-left: 30rpx;
  position: relative;
}

.view-content li::before {
  content: '•';
  position: absolute;
  left: 10rpx;
  color: #667eea;
  font-weight: bold;
}

.view-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: #999999;
  padding-top: 20rpx;
  border-top: 1rpx solid #eeeeee;
}

.view-creator {
  flex: 1;
}

.view-date {
  flex-shrink: 0;
}
</style>
