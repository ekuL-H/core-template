'use client'

import { useState, useEffect } from 'react'
import { X, User, Settings, ChevronDown, ChevronRight, Loader2, Check, Sun, Moon, Monitor, Database, Trash2 } from 'lucide-react'
import { coreApi } from '@/lib/api/core'
import { useWorkspace } from '@/lib/workspace'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type Section = 'account' | 'security' | 'appearance' | 'trading-defaults' | 'data' | 'danger'

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

interface SettingsModalProps {
  onClose: () => void
  initialSection?: Section
}

export default function SettingsModal({ onClose, initialSection = 'account' }: SettingsModalProps) {
  const { workspace } = useWorkspace()
  const isTrading = workspace?.type === 'trading'

  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const [profileOpen, setProfileOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Account state
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Appearance state
  const [theme, setTheme] = useState<ThemeMode>('system')

  // Trading defaults state
  const [defaultTimezone, setDefaultTimezone] = useState('Europe/London')
  const [defaultTimeframe, setDefaultTimeframe] = useState('30min')
  const [defaultsSaveStatus, setDefaultsSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Data state
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingTabs, setClearingTabs] = useState(false)

  // Danger state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Set correct accordion open based on initial section
  useEffect(() => {
    if (['account', 'security'].includes(initialSection)) {
      setProfileOpen(true)
      setSettingsOpen(false)
    } else {
      setProfileOpen(false)
      setSettingsOpen(true)
    }
  }, [initialSection])

  // Load user data
  useEffect(() => {
    fetchUser()
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system')
    const savedTz = localStorage.getItem('default_timezone')
    if (savedTz) setDefaultTimezone(savedTz)
    const savedTf = localStorage.getItem('default_timeframe')
    if (savedTf) setDefaultTimeframe(savedTf)
  }, [])

  const fetchUser = async () => {
    try {
      const data = await coreApi.getMe()
      setUser(data)
      setEditName(data.name || '')
      setEditEmail(data.email)
    } catch (err) {
      console.error('Failed to fetch user', err)
    } finally {
      setLoadingUser(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const updated = await coreApi.updateMe({ name: editName, email: editEmail })
      setUser(updated)
      localStorage.setItem('userEmail', updated.email)
      if (updated.name) localStorage.setItem('userName', updated.name)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) { console.error('Failed to save profile', err) }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    try {
      await coreApi.changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 2000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password')
    } finally { setChangingPassword(false) }
  }

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
    setDefaultsSaveStatus('saving')
    localStorage.setItem('default_timezone', defaultTimezone)
    localStorage.setItem('default_timeframe', defaultTimeframe)
    setTimeout(() => { setDefaultsSaveStatus('saved'); setTimeout(() => setDefaultsSaveStatus('idle'), 2000) }, 300)
  }

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

  const handleSelectSection = (section: Section) => {
    setActiveSection(section)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const profileSections = [
    { key: 'account' as Section, label: 'Account' },
    { key: 'security' as Section, label: 'Security' },
  ]

  const settingsSections = [
    { key: 'appearance' as Section, label: 'Appearance' },
    ...(isTrading ? [{ key: 'trading-defaults' as Section, label: 'Trading Defaults' }] : []),
    { key: 'data' as Section, label: 'Data' },
    { key: 'danger' as Section, label: 'Danger Zone' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Sidebar */}
        <div className="w-48 border-r border-border bg-sidebar p-3 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-foreground">Settings</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5">
            {/* Profile accordion */}
            <button
              onClick={() => { setProfileOpen(!profileOpen); if (!profileOpen) handleSelectSection('account') }}
              className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </div>
              {profileOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {profileOpen && (
              <div className="ml-4 flex flex-col gap-0.5">
                {profileSections.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleSelectSection(s.key)}
                    className={`px-2 py-1.5 rounded-md text-[12px] text-left transition-colors ${
                      activeSection === s.key ? 'bg-sidebar-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Settings accordion */}
            <button
              onClick={() => { setSettingsOpen(!settingsOpen); if (!settingsOpen) handleSelectSection('appearance') }}
              className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-sidebar-accent transition-colors mt-1"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </div>
              {settingsOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {settingsOpen && (
              <div className="ml-4 flex flex-col gap-0.5">
                {settingsSections.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleSelectSection(s.key)}
                    className={`px-2 py-1.5 rounded-md text-[12px] text-left transition-colors ${
                      activeSection === s.key
                        ? s.key === 'danger' ? 'bg-destructive/10 text-destructive font-medium' : 'bg-sidebar-accent text-foreground font-medium'
                        : s.key === 'danger' ? 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Account */}
          {activeSection === 'account' && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
              {loadingUser ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-primary">
                        {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user?.name || 'No name set'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name"
                        className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <button onClick={handleSaveProfile} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <Check className="w-3 h-3" /> : null}
                      {saving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground/50 mt-6">Account ID: {user?.id}</p>
                </>
              )}
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                {passwordError && (
                  <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 max-w-sm">
                    <p className="text-xs text-destructive">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="px-3 py-2 rounded-md bg-success/10 border border-success/20 max-w-sm">
                    <p className="text-xs text-success">Password changed successfully</p>
                  </div>
                )}
                <button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md border border-input text-foreground hover:bg-accent disabled:opacity-50 transition-colors">
                  {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Appearance</h2>
              <div>
                <label className="text-sm text-foreground mb-2 block">Theme</label>
                <div className="flex gap-2">
                  {[
                    { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
                    { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                    { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button key={mode} onClick={() => handleThemeChange(mode)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs rounded-md border transition-colors ${
                        theme === mode ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trading Defaults */}
          {activeSection === 'trading-defaults' && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Trading Defaults</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Default Timezone</label>
                  <select value={defaultTimezone} onChange={(e) => setDefaultTimezone(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    {TIMEZONES.map(tz => <option key={tz.key} value={tz.key}>{tz.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Default Timeframe</label>
                  <select value={defaultTimeframe} onChange={(e) => setDefaultTimeframe(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    {TIMEFRAMES.map(tf => <option key={tf.key} value={tf.key}>{tf.label}</option>)}
                  </select>
                </div>
                <button onClick={handleSaveDefaults} disabled={defaultsSaveStatus === 'saving'}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {defaultsSaveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : defaultsSaveStatus === 'saved' ? <Check className="w-3 h-3" /> : null}
                  {defaultsSaveStatus === 'saving' ? 'Saving...' : defaultsSaveStatus === 'saved' ? 'Saved' : 'Save Defaults'}
                </button>
              </div>
            </div>
          )}

          {/* Data */}
          {activeSection === 'data' && (
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
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <div>
              <h2 className="text-sm font-semibold text-destructive mb-4">Danger Zone</h2>
              <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Delete Account</p>
                    <p className="text-[11px] text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Account"
          message="This will permanently delete your account, all workspaces, and all data. This action cannot be undone."
          confirmLabel="Delete Everything"
          confirmDestructive={true}
          onConfirm={async () => {
            try {
              await coreApi.deleteAccount()
              localStorage.clear()
              window.location.href = '/auth'
            } catch (err) {
              console.error('Failed to delete account', err)
              setShowDeleteConfirm(false)
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}