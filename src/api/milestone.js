import request from '../utils/request'

export default {
  createMilestone(data) {
    return request.post('/milestone/', data)
  },
  
  getMilestones(params) {
    return request.get('/milestone/', params)
  },
  
  updateMilestone(id, data) {
    return request.put(`/milestone/${id}`, data)
  }
}
