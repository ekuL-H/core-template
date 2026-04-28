'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, LineChart, BarChart3, BookOpen, Bot,
  Monitor, Radio, TrendingUp, Grid3X3, Workflow, Layers
} from 'lucide-react'

export default function TradingPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const handleGetStarted = () => {
    router.push(authed ? '/workspaces' : '/auth')
  }

  const features = [
    {
      icon: LineChart,
      title: 'Live Charts',
      description: 'TradingView Lightweight Charts with 500 candles per timeframe, configurable indicators (SMA, EMA), timezone selector, and timeframe favourites.',
    },
    {
      icon: Radio,
      title: 'MT5 Integration',
      description: 'Real-time bid/ask prices from MetaTrader 5 via file bridge. Account info, open positions, and live current candle updates every 2 seconds.',
    },
    {
      icon: Layers,
      title: 'Watchlists',
      description: 'Organise symbols into watchlists with live bid/ask/spread columns. Click any row to open a chart panel. Automation and analytics tabs per watchlist.',
    },
    {
      icon: BookOpen,
      title: 'Trade Journal',
      description: 'Spreadsheet-style trade log with flexible columns. Track date, symbol, direction, entry, exit, lots, P&L, notes, and screenshots. Add custom columns.',
    },
    {
      icon: Bot,
      title: 'AI Labs',
      description: 'Ollama-powered local AI. Chat, manage models (pull/delete), create datasets with file uploads. All processing stays on your machine — zero API costs.',
    },
    {
      icon: Grid3X3,
      title: 'Custom Dashboard',
      description: 'Draggable widget grid with account overview, open positions, economic calendar, watchlist quick view, AI status, and quick actions.',
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Journal analytics, performance tracking, and pattern recognition. Understand your trading behaviour over time.',
      coming: true,
    },
    {
      icon: Workflow,
      title: 'Automation',
      description: 'Trade copier, workflow-based automation, and rule-based alerts. Set up once, let it run.',
      coming: true,
    },
    {
      icon: BarChart3,
      title: 'Backtesting',
      description: 'Test strategies against historical data. Validate your edge before risking real capital.',
      coming: true,
    },
  ]

  const specs = [
    { label: 'Chart Library', value: 'TradingView Lightweight Charts v5' },
    { label: 'Broker', value: 'MT5 via file bridge (IC Markets)' },
    { label: 'Data Refresh', value: 'Every 2 seconds (live candle)' },
    { label: 'AI Engine', value: 'Ollama (local, private)' },
    { label: 'Candles Loaded', value: '500 per timeframe' },
    { label: 'Symbols', value: '27 seeded (expandable)' },
  ]

  if (authed === null) return null

  return (
    <>
      {/* Hero */}
      <div className="px-6 md:px-12 pt-24 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6366f115' }}>
            <LineChart className="w-4 h-4" style={{ color: '#6366f1' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: '#6366f1' }}>Oasis Trading</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/15 text-success">Live</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
          Your trading workspace
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mb-8">
          Charts, journal, watchlists, and AI — connected to your broker, running locally, with zero data leaving your machine.
        </p>
        <button
          onClick={handleGetStarted}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          {authed ? 'Open Trading Workspace' : 'Start Trading Free'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Features */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">Everything you need</h2>
          <p className="text-sm text-muted-foreground mb-10">Built for serious traders who want control over their tools and data.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-foreground" />
                  </div>
                  {feature.coming && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-card-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-8">Under the hood</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-[11px] text-muted-foreground mb-1">{spec.label}</div>
                <div className="text-sm font-medium text-foreground font-mono">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Start trading with Oasis</h2>
          <p className="text-sm text-muted-foreground mb-6">Create a trading workspace and connect your broker in minutes.</p>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors mx-auto"
          >
            {authed ? 'Go to Workspaces' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}