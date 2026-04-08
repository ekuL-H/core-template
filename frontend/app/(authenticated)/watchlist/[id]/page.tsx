'use client'

import { useEffect, useState } from 'react'
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

export default function WatchlistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const watchlistId = params.id as string

  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [allSymbols, setAllSymbols] = useState<Symbol[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('symbols')

  // Action bar state
  const [filterText, setFilterText] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [showAddSymbol, setShowAddSymbol] = useState(false)
  const [symbolSearch, setSymbolSearch] = useState('')

  // Chart panel
  const [chartSymbol, setChartSymbol] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [watchlists, symbols] = await Promise.all([
        api.getWatchlists(),
        api.getSymbols()
      ])
      const found = watchlists.find((wl: Watchlist) => wl.id === watchlistId)
      if (!found) {
        router.push('/watchlist')
        return
      }
      setWatchlist(found)
      setAllSymbols(symbols)
    } catch (err) {
      console.error('Failed to fetch watchlist', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSymbol = async (symbolId: string) => {
    try {
      await api.addSymbol(watchlistId, symbolId)
      setShowAddSymbol(false)
      setSymbolSearch('')
      fetchData()
    } catch (err) {
      console.error('Failed to add symbol', err)
    }
  }

  const handleRemoveSymbol = async (symbolId: string) => {
    try {
      await api.removeSymbol(watchlistId, symbolId)
      if (chartSymbol === symbolId) setChartSymbol(null)
      fetchData()
    } catch (err) {
      console.error('Failed to remove symbol', err)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Loading watchlist...
        </div>
      </AppShell>
    )
  }

  if (!watchlist) return null

  // Filter and sort items
  const existingSymbolIds = new Set(watchlist.items.map((item) => item.symbolId))

  const filteredItems = watchlist.items
    .filter((item) =>
      item.symbol.name.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc
        ? a.symbol.name.localeCompare(b.symbol.name)
        : b.symbol.name.localeCompare(a.symbol.name)
    )

  const availableSymbols = allSymbols
    .filter((s) => !existingSymbolIds.has(s.id))
    .filter((s) =>
      s.name.toLowerCase().includes(symbolSearch.toLowerCase())
    )

  const breadcrumbs = [
    { label: 'Watchlists', href: '/watchlist' },
    { label: watchlist.name },
  ]

  return (
    <AppShell breadcrumbOverrides={breadcrumbs}>
      {/* Info bar */}
      <div
        className="rounded-md px-4 py-2 mb-0 flex items-center justify-between"
        style={{ backgroundColor: watchlist.color + '18' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: watchlist.color }} />
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {watchlist.name}
          </h1>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {watchlist.items.length} {watchlist.items.length === 1 ? 'symbol' : 'symbols'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-black/10 dark:border-white/10 mt-2">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
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
          <div className="flex items-center gap-2 py-2 border-b border-black/10 dark:border-white/10">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter symbols..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortAsc ? 'A-Z' : 'Z-A'}
            </button>
            <button
              onClick={() => setShowAddSymbol(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
              <div className="flex items-center h-[25px] border-b border-black/10 dark:border-white/10 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <div className="flex-1 px-3">Symbol</div>
                <div className="w-24 px-3">Class</div>
                <div className="w-20 px-3 text-right">Actions</div>
              </div>

              {/* Symbol rows */}
              <div className="overflow-y-auto overflow-x-auto">
                {filteredItems.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    {watchlist.items.length === 0
                      ? 'No symbols yet — click Add Symbol to get started'
                      : 'No symbols match your filter'}
                  </div>
                )}
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center h-[25px] border-b border-black/5 dark:border-white/5 text-xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                      chartSymbol === item.symbolId ? 'bg-black/5 dark:bg-white/5' : ''
                    }`}
                    onClick={() =>
                      setChartSymbol(chartSymbol === item.symbolId ? null : item.symbolId)
                    }
                  >
                    <div className="flex-1 px-3 font-medium text-zinc-900 dark:text-white">
                      {item.symbol.name}
                    </div>
                    <div className="w-24 px-3 text-zinc-500 dark:text-zinc-400">
                      {item.symbol.assetClass}
                    </div>
                    <div className="w-20 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveSymbol(item.symbolId)
                        }}
                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart panel */}
            {chartSymbol && (
              <div className="w-1/2 border-l border-black/10 dark:border-white/10 h-full">
                <CandlestickChart
                  symbol={watchlist.items.find((i) => i.symbolId === chartSymbol)?.symbol.name || ''}
                  color={watchlist.color}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other tabs - placeholder */}
      {activeTab !== 'symbols' && (
        <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {TABS.find((t) => t.key === activeTab)?.label} — coming soon
        </div>
      )}

      {/* Add Symbol Modal */}
      {showAddSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Add Symbol
            </h2>
            <input
              type="text"
              placeholder="Search symbols..."
              value={symbolSearch}
              onChange={(e) => setSymbolSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 mb-3"
            />
            <div className="max-h-48 overflow-y-auto">
              {availableSymbols.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                  {symbolSearch ? 'No symbols match' : 'All symbols already added'}
                </p>
              )}
              {availableSymbols.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => handleAddSymbol(symbol.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-zinc-900 dark:text-white">{symbol.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{symbol.assetClass}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setShowAddSymbol(false); setSymbolSearch('') }}
                className="px-3 py-1.5 text-sm rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
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