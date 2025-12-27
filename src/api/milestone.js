import request from '../utils/request'

export default {
  createMilestone(data) {
    return request.post('/milestone/', data)
  },
  
  getMilestones(params) {
    return request.get('/milestone/', params)
  }
}
