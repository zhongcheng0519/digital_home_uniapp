import request from '../utils/request'

export default {
  createNote(data) {
    return request.post('/note/', data)
  },
  
  getNotes(params) {
    return request.get('/note/', params)
  },
  
  updateNote(noteId, data) {
    return request.put(`/note/${noteId}`, data)
  },
  
  deleteNote(noteId) {
    return request.delete(`/note/${noteId}`)
  }
}
