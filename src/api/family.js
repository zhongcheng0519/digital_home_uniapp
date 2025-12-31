import request from '../utils/request'

export default {
  createFamily(data) {
    return request.post('/family/', data)
  },
  
  addMember(data) {
    return request.post('/family/member', data)
  },
  
  getMyFamilies() {
    return request.get('/family/my')
  },
  
  getUserPublicKey(phone) {
    return request.get(`/auth/public-key?phone=${phone}`)
  }
}
