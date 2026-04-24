export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

export const getUserId = (): string | null => {
  return localStorage.getItem('userId')
}

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('token')
}

export const logout = (): void => {
  // Clear auth
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')

  // Clear workspace (but keep theme preference)
  localStorage.removeItem('activeWorkspace')


  window.location.href = '/auth'
}