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

export { axios }