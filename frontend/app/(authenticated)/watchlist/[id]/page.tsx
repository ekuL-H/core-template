'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Watchlist, Symbol } from '@/lib/types'
import AppShell from '@/components/layout/AppShell'
import { Search, ArrowUpDown, Plus, X } from 'lucide-react'
import CandlestickChart from '@/components/charts/CandlestickChart'

type Tab = 'symbols' | 'automation' | 'analytics' | 'activity' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'symbols', label: 'Symbols' },
  { key: 'automation', label: 'Automation' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'activity', label: 'Activity' },
  { key: 'settings', label: 'Settings' },
]

interface LivePrice {
  bid: number
  ask: number
  digits: number
  spread: number
  timestamp: string
}

export default function WatchlistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const watchlistId = params.id as string

  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [allSymbols, setAllSymbols] = useState<Symbol[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('symbols')
  const [filterText, setFilterText] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [showAddSymbol, setShowAddSymbol] = useState(false)
  const [symbolSearch, setSymbolSearch] = useState('')
  const [chartSymbol, setChartSymbol] = useState<string | null>(null)
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [symbolMappings, setSymbolMappings] = useState<Record<string, string>>({})
  const [priceSource, setPriceSource] = useState<'mt5' | 'none'>('none')

  useEffect(() => {
    fetchData()
    fetchMappings()
  }, [])

  const fetchData = async () => {
    try {
      const [watchlists, symbols] = await Promise.all([
        api.getWatchlists(),
        api.getSymbols()
      ])
      const found = watchlists.find((wl: Watchlist) => wl.id === watchlistId)
      if (!found) { router.push('/watchlist'); return }
      setWatchlist(found)
      setAllSymbols(symbols)
    } catch (err) {
      console.error('Failed to fetch watchlist', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMappings = async () => {
    try {
      const data = await api.getBrokerSymbols('icmarkets-mt5')
      const map: Record<string, string> = {}
      data.forEach((m: any) => { map[m.symbolId] = m.sourceSymbol })
      setSymbolMappings(map)
    } catch (err) {
      console.error('Failed to fetch symbol mappings', err)
    }
  }

  const fetchLivePrices = useCallback(async () => {
    try {
      const data = await api.getBridgePrices()
      if (data.prices && data.prices.length > 0) {
        const priceMap: Record<string, LivePrice> = {}
        data.prices.forEach((p: any) => {
          priceMap[p.symbol] = { bid: p.bid, ask: p.ask, digits: p.digits, spread: p.spread, timestamp: p.timestamp }
        })
        setLivePrices(priceMap)
        setPriceSource('mt5')
      }
    } catch (err) {
      setPriceSource('none')
    }
  }, [])

  useEffect(() => {
    fetchLivePrices()
    const timer = setInterval(fetchLivePrices, 2000)
    return () => clearInterval(timer)
  }, [fetchLivePrices])

  const handleAddSymbol = async (symbolId: string) => {
    try {
      await api.addSymbol(watchlistId, symbolId)
      setShowAddSymbol(false)
      setSymbolSearch('')
      fetchData()
    } catch (err) { console.error('Failed to add symbol', err) }
  }

  const handleRemoveSymbol = async (symbolId: string) => {
    try {
      await api.removeSymbol(watchlistId, symbolId)
      if (chartSymbol === symbolId) setChartSymbol(null)
      fetchData()
    } catch (err) { console.error('Failed to remove symbol', err) }
  }

  const getPriceForItem = (item: { symbolId: string; symbol: { name: string } }): LivePrice | null => {
    const brokerSymbol = symbolMappings[item.symbolId]
    if (!brokerSymbol) return null
    return livePrices[brokerSymbol] || null
  }

  if (loading) {
    return (
      <AppShell>
        <div className="py-8 text-center text-xs text-muted-foreground">Loading watchlist...</div>
      </AppShell>
    )
  }

  if (!watchlist) return null

  const existingSymbolIds = new Set(watchlist.items.map((item) => item.symbolId))

  const filteredItems = watchlist.items
    .filter((item) => item.symbol.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => sortAsc
      ? a.symbol.name.localeCompare(b.symbol.name)
      : b.symbol.name.localeCompare(a.symbol.name)
    )

  const availableSymbols = allSymbols
    .filter((s) => !existingSymbolIds.has(s.id))
    .filter((s) => s.name.toLowerCase().includes(symbolSearch.toLowerCase()))

  const breadcrumbs = [
    { label: 'Watchlists', href: '/watchlist' },
    { label: watchlist.name },
  ]

  const formatPrice = (price: number, digits: number) => price.toFixed(digits)

  return (
    <AppShell breadcrumbOverrides={breadcrumbs}>
      {/* Info bar */}
      <div
        className="rounded-md px-4 py-2 mb-0 flex items-center justify-between"
        style={{ backgroundColor: watchlist.color + '18' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: watchlist.color }} />
          <h1 className="text-sm font-semibold text-foreground">{watchlist.name}</h1>
          <span className="text-xs text-muted-foreground">
            {watchlist.items.length} {watchlist.items.length === 1 ? 'symbol' : 'symbols'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${priceSource === 'mt5' ? 'bg-success' : 'bg-muted-foreground/40'}`} />
          <span className="text-[10px] text-muted-foreground">
            {priceSource === 'mt5' ? 'MT5 Live' : 'No feed'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mt-2">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: watchlist.color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Symbols tab content */}
      {activeTab === 'symbols' && (
        <div className="mt-0">
          {/* Action bar */}
          <div className="flex items-center gap-2 py-2 border-b border-border">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter symbols..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortAsc ? 'A-Z' : 'Z-A'}
            </button>
            <button
              onClick={() => setShowAddSymbol(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3 h-3" />
              Add Symbol
            </button>
          </div>

          {/* Content area with optional chart panel */}
          <div className="flex" style={{ height: 'calc(100vh - 250px)' }}>
            {/* Symbol table */}
            <div className={`${chartSymbol ? 'w-1/2' : 'w-full'} h-full flex flex-col`}>
              {/* Column headers */}
              <div className="flex items-center h-[25px] border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wide min-w-0">
                <div className="flex-shrink-0 w-24 px-2">Symbol</div>
                <div className="flex-shrink-0 w-16 px-2">Class</div>
                <div className="flex-1 px-2 text-right min-w-0">Bid</div>
                <div className="flex-1 px-2 text-right min-w-0">Ask</div>
                <div className="flex-shrink-0 w-16 px-2 text-right">Spread</div>
                <div className="flex-shrink-0 w-8 px-1"></div>
              </div>

              {/* Symbol rows */}
              <div className="overflow-y-auto overflow-x-auto flex-1">
                {filteredItems.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {watchlist.items.length === 0
                      ? 'No symbols yet — click Add Symbol to get started'
                      : 'No symbols match your filter'}
                  </div>
                )}
                {filteredItems.map((item) => {
                  const price = getPriceForItem(item)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center h-[25px] border-b border-border/50 text-xs hover:bg-accent cursor-pointer transition-colors ${
                        chartSymbol === item.symbolId ? 'bg-accent' : ''
                      }`}
                      onClick={() => setChartSymbol(chartSymbol === item.symbolId ? null : item.symbolId)}
                    >
                      <div className="flex-shrink-0 w-24 px-2 font-medium text-foreground truncate">
                        {item.symbol.name}
                      </div>
                      <div className="flex-shrink-0 w-16 px-2 text-muted-foreground truncate">
                        {item.symbol.assetClass}
                      </div>
                      <div className="flex-1 px-2 text-right font-mono text-foreground min-w-0">
                        {price ? formatPrice(price.bid, price.digits) : <span className="text-muted-foreground/40">···</span>}
                      </div>
                      <div className="flex-1 px-2 text-right font-mono text-foreground min-w-0">
                        {price ? formatPrice(price.ask, price.digits) : <span className="text-muted-foreground/40">···</span>}
                      </div>
                      <div className="flex-shrink-0 w-16 px-2 text-right font-mono text-muted-foreground">
                        {price ? formatPrice(price.spread, price.digits) : <span className="text-muted-foreground/40">···</span>}
                      </div>
                      <div className="flex-shrink-0 w-8 px-1 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(item.symbolId) }}
                          className="p-0.5 rounded hover:bg-destructive/10"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chart panel */}
            {chartSymbol && (
              <div className="w-1/2 border-l border-border h-full">
                <CandlestickChart
                  symbol={watchlist.items.find((i) => i.symbolId === chartSymbol)?.symbol.name || ''}
                  color={watchlist.color}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other tabs */}
      {activeTab !== 'symbols' && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {TABS.find((t) => t.key === activeTab)?.label} — coming soon
        </div>
      )}

      {/* Add Symbol Modal */}
      {showAddSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Symbol</h2>
            <input
              type="text"
              placeholder="Search symbols..."
              value={symbolSearch}
              onChange={(e) => setSymbolSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <div className="max-h-48 overflow-y-auto">
              {availableSymbols.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {symbolSearch ? 'No symbols match' : 'All symbols already added'}
                </p>
              )}
              {availableSymbols.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => handleAddSymbol(symbol.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  <span className="font-medium text-foreground">{symbol.name}</span>
                  <span className="text-xs text-muted-foreground">{symbol.assetClass}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setShowAddSymbol(false); setSymbolSearch('') }}
                className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}