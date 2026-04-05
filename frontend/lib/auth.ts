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
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  window.location.href = '/auth'
}