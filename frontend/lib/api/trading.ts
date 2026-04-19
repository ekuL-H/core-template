import { axios, BASE_URL, getHeaders } from './client'

export const tradingApi = {
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
  },

  // Candles (Twelve Data fallback)
  getCandles: async (symbol: string, interval: string = '30min', outputsize: number = 300) => {
    const res = await axios.get(`${BASE_URL}/api/market/candles`, {
      params: { symbol, interval, outputsize },
      headers: getHeaders()
    })
    return res.data
  },

  getQuote: async (symbol: string) => {
    const res = await axios.get(`${BASE_URL}/api/market/quote`, {
      params: { symbol },
      headers: getHeaders()
    })
    return res.data
  },

  // Broker connections
  getBrokerConnections: async () => {
    const res = await axios.get(`${BASE_URL}/api/broker`, { headers: getHeaders() })
    return res.data
  },

  createBrokerConnection: async (data: { brokerName: string; accountNumber?: string; config?: any }) => {
    const res = await axios.post(`${BASE_URL}/api/broker`, data, { headers: getHeaders() })
    return res.data
  },

  updateBrokerConnection: async (id: string, data: { brokerName?: string; accountNumber?: string; status?: string; config?: any }) => {
    const res = await axios.put(`${BASE_URL}/api/broker/${id}`, data, { headers: getHeaders() })
    return res.data
  },

  deleteBrokerConnection: async (id: string) => {
    const res = await axios.delete(`${BASE_URL}/api/broker/${id}`, { headers: getHeaders() })
    return res.data
  },

  getBrokerSymbols: async (source: string) => {
    const res = await axios.get(`${BASE_URL}/api/broker/symbols/${source}`, { headers: getHeaders() })
    return res.data
  },

  // Bridge (MT5 live data)
  getBridgePrices: async () => {
    const res = await axios.get(`${BASE_URL}/api/bridge/prices`, { headers: getHeaders() })
    return res.data
  },

  getBridgePrice: async (symbol: string) => {
    const res = await axios.get(`${BASE_URL}/api/bridge/price/${symbol}`, { headers: getHeaders() })
    return res.data
  },

  getBridgeAccount: async () => {
    const res = await axios.get(`${BASE_URL}/api/bridge/account`, { headers: getHeaders() })
    return res.data
  },

  // MT5 Candles
  getMT5Candles: async (symbol: string, interval: string = '30min', outputsize: number = 500) => {
    const res = await axios.get(`${BASE_URL}/api/market/mt5/candles`, {
      params: { symbol, interval, bars: outputsize },
      headers: getHeaders()
    })
    return res.data
  },

  getMT5CandlesFresh: async (symbol: string, interval: string = '30min', outputsize: number = 5) => {
    const res = await axios.get(`${BASE_URL}/api/market/mt5/candles`, {
      params: { symbol, interval, bars: outputsize, fresh: 'true' },
      headers: getHeaders()
    })
    return res.data
  },

  // AI Labs
  getModels: async () => {
    const res = await axios.get(`${BASE_URL}/api/ai/models`, { headers: getHeaders() })
    return res.data
  },

  aiChat: async (model: string, messages: { role: string; content: string }[]) => {
    const res = await axios.post(`${BASE_URL}/api/ai/chat`, { model, messages }, {
      headers: getHeaders(),
      timeout: 300000
    })
    return res.data
  },

  aiVision: async (model: string, prompt: string, images: string[]) => {
    const res = await axios.post(`${BASE_URL}/api/ai/vision`, { model, prompt, images }, {
      headers: getHeaders(),
      timeout: 300000
    })
    return res.data
  },

  pullModel: async (name: string) => {
    const res = await axios.post(`${BASE_URL}/api/ai/models/pull`, { name }, {
      headers: getHeaders(),
      timeout: 600000
    })
    return res.data
  },

  deleteModel: async (name: string) => {
    const res = await axios.delete(`${BASE_URL}/api/ai/models/${name}`, { headers: getHeaders() })
    return res.data
  },
}