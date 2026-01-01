import request from '../utils/request'

export default {
  register(data) {
    return request.post('/auth/register', data)
  },
  
  login(data) {
    return request.post('/auth/login', data)
  },
  
  getUserPublicKey(phone) {
    return request.get(`/auth/public-key?phone=${phone}`)
  },
  
  getUsername(userId) {
    return request.get(`/auth/username?user_id=${userId}`)
  }
}
