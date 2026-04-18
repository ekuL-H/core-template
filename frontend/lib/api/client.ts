import axios from 'axios'

export const BASE_URL = 'http://localhost:5000'

export const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export { axios }