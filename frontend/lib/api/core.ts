import { axios, BASE_URL, getHeaders } from './client'

export const coreApi = {
  // Auth is handled in lib/auth.ts

  getMe: async () => {
    const res = await axios.get(`${BASE_URL}/api/auth/me`, { headers: getHeaders() })
    return res.data
  },

  updateMe: async (data: { name?: string; email?: string }) => {
    const res = await axios.put(`${BASE_URL}/api/auth/me`, data, { headers: getHeaders() })
    return res.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await axios.put(`${BASE_URL}/api/auth/me/password`, { currentPassword, newPassword }, { headers: getHeaders() })
    return res.data
  },

  deleteAccount: async () => {
    const res = await axios.delete(`${BASE_URL}/api/auth/me`, { headers: getHeaders() })
    return res.data
  },

  logoutAllDevices: async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/me/logout-all`, {}, { headers: getHeaders() })
    return res.data
  },

  // Workspaces
  getWorkspaces: async () => {
    const res = await axios.get(`${BASE_URL}/api/workspace`, { headers: getHeaders() })
    return res.data
  },

  getWorkspaceTemplates: async () => {
    const res = await axios.get(`${BASE_URL}/api/workspace/templates`, { headers: getHeaders() })
    return res.data
  },

  createWorkspace: async (data: { name: string; type: string }) => {
    const res = await axios.post(`${BASE_URL}/api/workspace`, data, { headers: getHeaders() })
    return res.data
  },

  updateWorkspace: async (id: string, data: { name?: string }) => {
    const res = await axios.put(`${BASE_URL}/api/workspace/${id}`, data, { headers: getHeaders() })
    return res.data
  },

  deleteWorkspace: async (id: string) => {
    const res = await axios.delete(`${BASE_URL}/api/workspace/${id}`, { headers: getHeaders() })
    return res.data
  },

  archiveWorkspace: async (id: string) => {
    const res = await axios.post(`${BASE_URL}/api/workspace/${id}/archive`, {}, { headers: getHeaders() })
    return res.data
  },

  restoreWorkspace: async (id: string) => {
    const res = await axios.post(`${BASE_URL}/api/workspace/${id}/restore`, {}, { headers: getHeaders() })
    return res.data
  },
  
}