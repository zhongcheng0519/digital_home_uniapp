const BASE_URL = 'http://127.0.0.1:8000/api/v1'

function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const error = {
            statusCode: res.statusCode,
            message: res.data?.detail || '请求失败'
          }
          if (res.statusCode === 401) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.navigateTo({
              url: '/pages/auth/login'
            })
          }
          reject(error)
        }
      },
      fail: (err) => {
        reject({
          statusCode: -1,
          message: err.errMsg || '网络请求失败'
        })
      }
    })
  })
}

export default {
  get(url, data) {
    return request({
      url,
      method: 'GET',
      data
    })
  },
  
  post(url, data) {
    return request({
      url,
      method: 'POST',
      data
    })
  },
  
  put(url, data) {
    return request({
      url,
      method: 'PUT',
      data
    })
  },
  
  delete(url, data) {
    return request({
      url,
      method: 'DELETE',
      data
    })
  }
}
