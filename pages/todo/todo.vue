<template>
  <view class="todo-container">
    <view class="header">
      <text class="title">待办事项</text>
      <text class="add-btn" @click="showAddModal = true">+ 新建</text>
    </view>
    
    <view class="todo-list" v-if="todos.length > 0">
      <view 
        class="todo-card" 
        v-for="todo in todos" 
        :key="todo.id"
      >
        <view class="todo-main">
          <view class="todo-title">{{ todo.decryptedTitle || '解密中...' }}</view>
          <view class="todo-description" v-if="todo.decryptedDescription">
            {{ todo.decryptedDescription }}
          </view>
          <view class="todo-meta">
            <text class="todo-creator">创建者: {{ todo.creatorName }}</text>
            <text class="todo-date">{{ formatTime(todo.created_at) }}</text>
          </view>
        </view>
        <view class="todo-actions">
          <view 
            class="complete-btn" 
            :class="{ completed: todo.is_completed, completing: todo.isCompleting }"
            @click="toggleComplete(todo)"
          >
            <text v-if="todo.is_completed || todo.isCompleting">✓</text>
            <view v-else class="circle-icon"></view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else-if="!loading">
      <text class="empty-text">暂无待办事项</text>
      <text class="empty-hint">点击"+ 新建"按钮添加待办事项</text>
    </view>
    
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
    
    <view class="modal" v-if="showAddModal" @click="showAddModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新建待办事项</text>
          <text class="modal-close" @click="showAddModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">标题 *</text>
            <input 
              class="form-input" 
              v-model="newTodo.title" 
              placeholder="请输入待办事项标题"
            />
          </view>
          <view class="form-item">
            <text class="form-label">描述</text>
            <textarea 
              class="form-textarea" 
              v-model="newTodo.description" 
              placeholder="请输入详细描述（可选）"
              :maxlength="500"
            />
          </view>
        </view>
        <view class="modal-footer">
          <text class="modal-btn cancel" @click="showAddModal = false">取消</text>
          <text class="modal-btn confirm" @click="handleAddTodo">确定</text>
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
import todoApi from '../../src/api/todo'
import authApi from '../../src/api/auth'
import { encryptData, decryptData } from '../../src/utils/crypto'
import dayjs from '../../src/utils/dayjs'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const todos = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const newTodo = ref({
  title: '',
  description: ''
})

const formatTime = (timeStr) => {
  return dayjs.utc(timeStr).utcOffset(8).format('MM-DD HH:mm')
}

const loadTodos = async () => {
  if (!familyStore.hasCurrentFamily) {
    return
  }
  
  loading.value = true
  
  try {
    const data = await todoApi.getTodos({
      family_id: familyStore.familyId
    })
    
    todos.value = data
      .filter(item => !item.is_completed)
      .map(item => ({
        ...item,
        decryptedTitle: '',
        decryptedDescription: '',
        creatorName: '',
        isCompleting: false
      }))
    
    await decryptTodos()
    await loadCreatorNames()
    
  } catch (error) {
    console.error('加载待办事项失败:', error)
    uni.showToast({ title: '加载待办事项失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadCreatorNames = async () => {
  const creatorIds = [...new Set(todos.value.map(todo => todo.creator_id))]
  
  for (const creatorId of creatorIds) {
    try {
      const result = await authApi.getUsername(creatorId)
      const username = result.username
      
      todos.value.forEach(todo => {
        if (todo.creator_id === creatorId) {
          todo.creatorName = username
        }
      })
    } catch (error) {
      console.error('获取创建者名称失败:', error)
      todos.value.forEach(todo => {
        if (todo.creator_id === creatorId) {
          todo.creatorName = '未知用户'
        }
      })
    }
  }
}

const decryptTodos = async () => {
  const familyKey = familyStore.currentFamilyKey
  
  if (!familyKey) {
    return
  }
  
  for (const todo of todos.value) {
    try {
      todo.decryptedTitle = decryptData(
        todo.title_ciphertext,
        familyKey
      )
      
      if (todo.description_ciphertext) {
        todo.decryptedDescription = decryptData(
          todo.description_ciphertext,
          familyKey
        )
      }
    } catch (error) {
      console.error('解密失败:', error)
      todo.decryptedTitle = '无法解密'
    }
  }
}

const handleAddTodo = async () => {
  if (!newTodo.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '请先创建或选择家庭', icon: 'none' })
    return
  }
  
  try {
    const familyKey = familyStore.currentFamilyKey
    
    const titleCiphertext = encryptData(newTodo.value.title, familyKey)
    const descriptionCiphertext = newTodo.value.description 
      ? encryptData(newTodo.value.description, familyKey)
      : ''
    
    await todoApi.createTodo({
      family_id: familyStore.familyId,
      title_ciphertext: titleCiphertext,
      description_ciphertext: descriptionCiphertext
    })
    
    uni.showToast({ title: '创建成功', icon: 'success' })
    showAddModal.value = false
    newTodo.value = {
      title: '',
      description: ''
    }
    
    await loadTodos()
    
  } catch (error) {
    console.error('创建待办事项失败:', error)
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

const toggleComplete = async (todo) => {
  try {
    todo.isCompleting = true
    
    setTimeout(async () => {
      const familyKey = familyStore.currentFamilyKey
      
      const titleCiphertext = encryptData(todo.decryptedTitle, familyKey)
      const descriptionCiphertext = todo.decryptedDescription
        ? encryptData(todo.decryptedDescription, familyKey)
        : ''
      
      await todoApi.updateTodo(todo.id, {
        title_ciphertext: titleCiphertext,
        description_ciphertext: descriptionCiphertext,
        is_completed: true
      })
      
      uni.showToast({ title: '已存档', icon: 'success' })
      
      await loadTodos()
      
    }, 2000)
    
  } catch (error) {
    console.error('更新待办事项失败:', error)
    uni.showToast({ title: '更新失败', icon: 'none' })
    todo.isCompleting = false
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
  
  if (!familyStore.hasCurrentFamily) {
    uni.showToast({ title: '请先创建或选择家庭', icon: 'none' })
    return
  }
  
  await loadTodos()
})

onShow(async () => {
  if (userStore.isLoggedIn && familyStore.hasCurrentFamily) {
    await loadTodos()
  }
})
</script>

<style scoped>
.todo-container {
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

.add-btn {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.todo-list {
  padding: 20rpx;
}

.todo-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.todo-main {
  flex: 1;
  margin-right: 20rpx;
}

.todo-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 12rpx;
  line-height: 1.5;
}

.todo-description {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 16rpx;
  line-height: 1.6;
}

.todo-meta {
  display: flex;
  gap: 20rpx;
  font-size: 22rpx;
  color: #999999;
}

.todo-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.complete-btn {
  width: 60rpx;
  height: 60rpx;
  border: 2rpx solid #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #667eea;
  transition: all 0.3s;
  background: #ffffff;
}

.complete-btn.completed {
  background: #667eea;
  color: #ffffff;
}

.complete-btn.completing {
  background: #667eea;
  color: #ffffff;
  animation: pulse 0.3s ease-in-out;
}

.circle-icon {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid #667eea;
  border-radius: 50%;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
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

.modal {
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
  border-radius: 16rpx;
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
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
  line-height: 1.6;
}

.modal-footer {
  padding: 30rpx;
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.modal-btn {
  padding: 16rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666666;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}
</style>
