'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useWorkspace } from '@/lib/workspace'
import { Sun, Moon, Monitor, Trash2, Database, Loader2, Check } from 'lucide-react'

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

type ThemeMode = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const { workspace } = useWorkspace()
  const isTrading = workspace?.type === 'trading'

  const [theme, setTheme] = useState<ThemeMode>('system')
  const [defaultTimezone, setDefaultTimezone] = useState('Europe/London')
  const [defaultTimeframe, setDefaultTimeframe] = useState('30min')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingTabs, setClearingTabs] = useState(false)

  // Load saved settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }

    const savedTz = localStorage.getItem('default_timezone')
    if (savedTz) setDefaultTimezone(savedTz)

    const savedTf = localStorage.getItem('default_timeframe')
    if (savedTf) setDefaultTimeframe(savedTf)
  }, [])

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode)
    if (mode === 'system') {
      localStorage.removeItem('theme')
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', isDark)
    } else {
      localStorage.setItem('theme', mode)
      document.documentElement.classList.toggle('dark', mode === 'dark')
    }
  }

  const handleSaveDefaults = () => {
    setSaveStatus('saving')
    localStorage.setItem('default_timezone', defaultTimezone)
    localStorage.setItem('default_timeframe', defaultTimeframe)
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 300)
  }

  const handleClearCache = () => {
    setClearingCache(true)
    // Clear candle cache from localStorage and notify user to clear DB via backend
    Object.keys(localStorage)
      .filter(k => k.startsWith('dashboard_widgets') || k.startsWith('chart_'))
      .forEach(k => localStorage.removeItem(k))
    setTimeout(() => setClearingCache(false), 1000)
  }

  const handleClearTabs = () => {
    setClearingTabs(true)
    Object.keys(localStorage)
      .filter(k => k.startsWith('browser_tabs'))
      .forEach(k => localStorage.removeItem(k))
    setTimeout(() => {
      setClearingTabs(false)
      window.location.href = '/dashboard'
    }, 500)
  }

  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-foreground mb-6">Settings</h1>

      <div className="space-y-8 max-w-xl">
        {/* Appearance */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Appearance</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-foreground mb-2 block">Theme</label>
              <div className="flex gap-2">
                {[
                  { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
                  { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                  { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => handleThemeChange(mode)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs rounded-md border transition-colors ${
                      theme === mode
                        ? 'border-primary bg-primary/5 text-foreground font-medium'
                        : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trading defaults */}
        {isTrading && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Trading Defaults</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Default Timezone</label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.key} value={tz.key}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-foreground mb-1.5 block">Default Timeframe</label>
                <select
                  value={defaultTimeframe}
                  onChange={(e) => setDefaultTimeframe(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {TIMEFRAMES.map(tf => (
                    <option key={tf.key} value={tf.key}>{tf.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveDefaults}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                  saveStatus === 'saved' ? <Check className="w-3 h-3" /> : null}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Defaults'}
              </button>
            </div>
          </section>
        )}

        {/* Data Management */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Data</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <p className="text-sm text-foreground">Clear Chart Cache</p>
                <p className="text-[11px] text-muted-foreground">Remove cached chart data and widget layouts</p>
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {clearingCache ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {clearingCache ? 'Clearing...' : 'Clear'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <p className="text-sm text-foreground">Reset Browser Tabs</p>
                <p className="text-[11px] text-muted-foreground">Clear all tab history and reset to Dashboard</p>
              </div>
              <button
                onClick={handleClearTabs}
                disabled={clearingTabs}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {clearingTabs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                {clearingTabs ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-medium text-destructive uppercase tracking-wider mb-3">Danger Zone</h2>
          <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Delete Account</p>
                <p className="text-[11px] text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}