'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { tradingApi as api } from '@/lib/api/trading'
import { Wallet, TrendingUp, TrendingDown, Activity, Bot, ArrowRight, Newspaper, Clock, List, Zap } from 'lucide-react'

// ─── Account Overview Widget ───
export function AccountWidget() {
  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getBridgeAccount()
        setAccount(data)
      } catch {}
    }
    fetch()
    const timer = setInterval(fetch, 5000)
    return () => clearInterval(timer)
  }, [])

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Wallet className="w-6 h-6 mb-2 opacity-30" />
        <p className="text-xs">MT5 not connected</p>
      </div>
    )
  }

  const profit = account.equity - account.balance

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center gap-1.5 mb-3">
        <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Account</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground">Balance</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">${account.balance.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Equity</p>
            <p className="text-sm font-medium text-foreground tabular-nums">${account.equity.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">P&L</p>
            <p className={`text-sm font-medium tabular-nums ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Margin</p>
            <p className="text-xs text-foreground tabular-nums">${account.margin.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Free</p>
            <p className="text-xs text-foreground tabular-nums">${account.free_margin.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-[9px] text-muted-foreground">{account.server} · {account.account}</span>
      </div>
    </div>
  )
}

// ─── Open Positions Widget ───
export function PositionsWidget() {
  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Open Positions</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No open positions</p>
          <p className="text-[10px] opacity-60 mt-1">Position data coming soon</p>
        </div>
      </div>
    </div>
  )
}

// ─── Economic Calendar Widget ───
export function CalendarWidget() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Placeholder — in future this would fetch from Forex Factory or similar
    setEvents([
      { time: '08:30', currency: 'USD', impact: 'high', event: 'Non-Farm Payrolls', forecast: '180K', previous: '175K' },
      { time: '10:00', currency: 'USD', impact: 'medium', event: 'ISM Manufacturing PMI', forecast: '50.2', previous: '49.8' },
      { time: '13:30', currency: 'EUR', impact: 'high', event: 'ECB Interest Rate Decision', forecast: '3.75%', previous: '3.75%' },
      { time: '15:00', currency: 'GBP', impact: 'medium', event: 'BOE Gov Bailey Speaks', forecast: '', previous: '' },
      { time: '21:00', currency: 'NZD', impact: 'low', event: 'ANZ Business Confidence', forecast: '', previous: '22.9' },
    ])
    setLoading(false)
  }, [])

  const impactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-destructive'
      case 'medium': return 'bg-warning'
      case 'low': return 'bg-success'
      default: return 'bg-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Economic Calendar</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
            <span className="text-[11px] text-muted-foreground tabular-nums w-10 flex-shrink-0">{event.time}</span>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${impactColor(event.impact)}`} />
            <span className="text-[11px] font-medium text-foreground w-8 flex-shrink-0">{event.currency}</span>
            <span className="text-[11px] text-foreground flex-1 truncate">{event.event}</span>
            <div className="flex gap-2 flex-shrink-0">
              {event.forecast && <span className="text-[10px] text-muted-foreground">F: {event.forecast}</span>}
              {event.previous && <span className="text-[10px] text-muted-foreground/60">P: {event.previous}</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground/40 mt-1">Sample data — live feed coming soon</p>
    </div>
  )
}

// ─── Watchlist Quick View Widget ───
export function WatchlistWidget() {
  const router = useRouter()
  const [prices, setPrices] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getBridgePrices()
        if (data.prices) setPrices(data.prices.slice(0, 8))
      } catch {}
    }
    fetch()
    const timer = setInterval(fetch, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Live Prices</span>
        </div>
        <button
          onClick={() => router.push('/trading/watchlist')}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {prices.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-xs">MT5 not connected</p>
          </div>
        )}
        {prices.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
            <span className="text-[11px] font-medium text-foreground">{p.symbol}</span>
            <div className="flex gap-3">
              <span className="text-[11px] tabular-nums text-foreground">{p.bid.toFixed(p.digits)}</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">{p.spread.toFixed(p.digits)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Status Widget ───
export function AIStatusWidget() {
  const router = useRouter()
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getModels()
        setModels(data.models || [])
      } catch {}
    }
    fetch()
  }, [])

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center gap-1.5 mb-3">
        <Bot className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Status</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground">Models Installed</p>
          <p className="text-lg font-semibold text-foreground">{models.length}</p>
        </div>
        <div className="space-y-1">
          {models.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[11px] text-foreground">{m.name}</span>
              <span className="text-[9px] text-muted-foreground">{m.details?.parameter_size}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => router.push('/trading/ai-labs')}
        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 mt-1"
      >
        Open AI Labs <ArrowRight className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}

// ─── Quick Actions Widget ───
export function QuickActionsWidget() {
  const router = useRouter()

  const actions = [
    { label: 'New Watchlist', href: '/trading/watchlist', icon: List },
    { label: 'AI Chat', href: '/trading/ai-labs', icon: Bot },
    { label: 'Journal Entry', href: '/trading/journal', icon: Zap },
  ]

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => router.push(action.href)}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-xs text-foreground hover:bg-accent transition-colors w-full text-left"
          >
            <action.icon className="w-3.5 h-3.5 text-muted-foreground" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}