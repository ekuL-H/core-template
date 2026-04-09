export interface Symbol {
  id: string
  name: string
  assetClass: string
  description: string | null
  createdAt: string
}

export interface WatchlistItem {
  id: string
  watchlistId: string
  symbolId: string
  displayOrder: number
  createdAt: string
  symbol: Symbol
}

export interface Watchlist {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  items: WatchlistItem[]
}

export interface BrokerConnection {
  id: string
  userId: string
  brokerName: string
  accountNumber: string | null
  status: string
  config: any
  createdAt: string
  updatedAt: string
}