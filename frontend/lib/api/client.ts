import axios from 'axios'

export const BASE_URL = 'http://localhost:5000'

export const getHeaders = () => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
  
  const ws = localStorage.getItem('activeWorkspace')
  if (ws) {
    try {
      const parsed = JSON.parse(ws)
      if (parsed.id) headers['X-Workspace-Id'] = parsed.id
    } catch {}
  }
  
  return headers
}

// Auto-redirect to login on 401 (expired/invalid token)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/auth')) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

export { axios }