import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const api = {
  // Symbols
  getSymbols: async () => {
    const res = await axios.get(`${BASE_URL}/api/watchlist/symbols`, { headers: getHeaders() })
    return res.data
  },

  // Watchlists
  getWatchlists: async () => {
    const res = await axios.get(`${BASE_URL}/api/watchlist`, { headers: getHeaders() })
    return res.data
  },

  createWatchlist: async (name: string, color?: string) => {
    const res = await axios.post(`${BASE_URL}/api/watchlist`, { name, color }, { headers: getHeaders() })
    return res.data
  },

  updateWatchlist: async (watchlistId: string, data: { name?: string; color?: string }) => {
    const res = await axios.put(`${BASE_URL}/api/watchlist/${watchlistId}`, data, { headers: getHeaders() })
    return res.data
  },

  deleteWatchlist: async (watchlistId: string) => {
    const res = await axios.delete(`${BASE_URL}/api/watchlist/${watchlistId}`, { headers: getHeaders() })
    return res.data
  },

  addSymbol: async (watchlistId: string, symbolId: string) => {
    const res = await axios.post(`${BASE_URL}/api/watchlist/${watchlistId}/symbols`, { symbolId }, { headers: getHeaders() })
    return res.data
  },

  removeSymbol: async (watchlistId: string, symbolId: string) => {
    const res = await axios.delete(`${BASE_URL}/api/watchlist/${watchlistId}/symbols/${symbolId}`, { headers: getHeaders() })
    return res.data
  }
}