import request from '../utils/request'

export default {
  register(data) {
    return request.post('/auth/register', data)
  },
  
  login(data) {
    return request.post('/auth/login', data)
  }
}
