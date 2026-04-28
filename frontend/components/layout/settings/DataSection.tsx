'use client'

import { useState } from 'react'
import { Loader2, Database, Trash2 } from 'lucide-react'

export default function DataSection() {
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingTabs, setClearingTabs] = useState(false)

  const handleClearCache = () => {
    setClearingCache(true)
    Object.keys(localStorage).filter(k => k.startsWith('dashboard_widgets') || k.startsWith('chart_')).forEach(k => localStorage.removeItem(k))
    setTimeout(() => setClearingCache(false), 1000)
  }

  const handleClearTabs = () => {
    setClearingTabs(true)
    Object.keys(localStorage).filter(k => k.startsWith('browser_tabs')).forEach(k => localStorage.removeItem(k))
    setTimeout(() => { setClearingTabs(false); window.location.href = '/dashboard' }, 500)
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Data Management</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-md border border-border">
          <div>
            <p className="text-sm text-foreground">Clear Chart Cache</p>
            <p className="text-[11px] text-muted-foreground">Remove cached chart data and widget layouts</p>
          </div>
          <button onClick={handleClearCache} disabled={clearingCache}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors">
            {clearingCache ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            {clearingCache ? 'Clearing...' : 'Clear'}
          </button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-md border border-border">
          <div>
            <p className="text-sm text-foreground">Reset Browser Tabs</p>
            <p className="text-[11px] text-muted-foreground">Clear all tab history and reset to Dashboard</p>
          </div>
          <button onClick={handleClearTabs} disabled={clearingTabs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors">
            {clearingTabs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            {clearingTabs ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  )
}