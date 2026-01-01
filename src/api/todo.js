import request from '../utils/request'

export default {
  createTodo(data) {
    return request.post('/todo/', data)
  },
  
  getTodos(params) {
    return request.get('/todo/', params)
  },
  
  updateTodo(todoId, data) {
    return request.put(`/todo/${todoId}`, data)
  },
  
  deleteTodo(todoId) {
    return request.delete(`/todo/${todoId}`)
  }
}
