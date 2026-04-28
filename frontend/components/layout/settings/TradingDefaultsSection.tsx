'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'

const TIMEZONES = [
  { key: 'UTC', label: 'UTC' },
  { key: 'Europe/London', label: 'London (GMT/BST)' },
  { key: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { key: 'America/New_York', label: 'New York (EST/EDT)' },
  { key: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { key: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { key: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { key: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

const TIMEFRAMES = [
  { key: '1min', label: '1 Minute' },
  { key: '5min', label: '5 Minutes' },
  { key: '15min', label: '15 Minutes' },
  { key: '30min', label: '30 Minutes' },
  { key: '1h', label: '1 Hour' },
  { key: '4h', label: '4 Hours' },
  { key: '1day', label: 'Daily' },
]

export default function TradingDefaultsSection() {
  const [timezone, setTimezone] = useState('Europe/London')
  const [timeframe, setTimeframe] = useState('30min')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    const savedTz = localStorage.getItem('default_timezone')
    if (savedTz) setTimezone(savedTz)
    const savedTf = localStorage.getItem('default_timeframe')
    if (savedTf) setTimeframe(savedTf)
  }, [])

  const handleSave = () => {
    setStatus('saving')
    localStorage.setItem('default_timezone', timezone)
    localStorage.setItem('default_timeframe', timeframe)
    setTimeout(() => { setStatus('saved'); setTimeout(() => setStatus('idle'), 2000) }, 300)
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Trading Defaults</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-foreground mb-1.5 block">Default Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
            className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            {TIMEZONES.map(tz => <option key={tz.key} value={tz.key}>{tz.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-foreground mb-1.5 block">Default Timeframe</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}
            className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            {TIMEFRAMES.map(tf => <option key={tf.key} value={tf.key}>{tf.label}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={status === 'saving'}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {status === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'saved' ? <Check className="w-3 h-3" /> : null}
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save Defaults'}
        </button>
      </div>
    </div>
  )
}