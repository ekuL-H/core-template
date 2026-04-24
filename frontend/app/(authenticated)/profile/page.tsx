'use client'

import { useEffect, useState } from 'react'
import { tradingApi as api } from '@/lib/api/trading'
import { coreApi } from '@/lib/api/core'
import { BrokerConnection } from '@/lib/types/trading'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Wifi, WifiOff, Check, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'

type Tab = 'account' | 'brokers' | 'preferences'

const ALL_TABS: { key: Tab; label: string; modules?: string[] }[] = [
  { key: 'account', label: 'Account' },
  { key: 'brokers', label: 'Brokers', modules: ['trading'] },
  { key: 'preferences', label: 'Preferences' },
]

const BROKER_PRESETS = [
  { name: 'IC Markets MT5', source: 'icmarkets-mt5' },
  { name: 'IC Markets MT4', source: 'icmarkets-mt4' },
  { name: 'Pepperstone MT5', source: 'pepperstone-mt5' },
  { name: 'OANDA MT5', source: 'oanda-mt5' },
  { name: 'Other MT5', source: 'other-mt5' },
]

export default function ProfilePage() {
  const { workspace } = useWorkspace()
  const tabs = ALL_TABS.filter(t => !t.modules || t.modules.includes(workspace?.type || ''))

  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Edit state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Broker state
  const [connections, setConnections] = useState<BrokerConnection[]>([])
  const [loadingBrokers, setLoadingBrokers] = useState(false)
  const [showAddBroker, setShowAddBroker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(BROKER_PRESETS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [serverName, setServerName] = useState('')

  useEffect(() => { fetchUser() }, [])

  useEffect(() => {
    if (activeTab === 'brokers') fetchConnections()
  }, [activeTab])

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
    } catch (err) {
      console.error('Failed to save profile', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
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
    } finally {
      setChangingPassword(false)
    }
  }

  const fetchConnections = async () => {
    setLoadingBrokers(true)
    try { setConnections(await api.getBrokerConnections()) }
    catch (err) { console.error('Failed to fetch broker connections', err) }
    finally { setLoadingBrokers(false) }
  }

  const handleAddBroker = async () => {
    if (!accountNumber.trim()) return
    try {
      await api.createBrokerConnection({
        brokerName: selectedPreset.name,
        accountNumber: accountNumber.trim(),
        config: { source: selectedPreset.source, server: serverName.trim() || undefined }
      })
      setShowAddBroker(false)
      setAccountNumber('')
      setServerName('')
      fetchConnections()
    } catch (err) { console.error('Failed to add broker', err) }
  }

  const handleDeleteBroker = async (id: string) => {
    try { await api.deleteBrokerConnection(id); fetchConnections() }
    catch (err) { console.error('Failed to delete broker', err) }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <AppShell>
      <div>
        <h1 className="text-lg font-semibold text-foreground mb-4">Profile</h1>

        <div className="border-b border-border mb-6">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                  activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Account tab */}
        {activeTab === 'account' && (
          <div>
            {loadingUser ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : (
              <>
                {/* Avatar + info */}
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

                {/* Edit profile */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile Information</h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <Check className="w-3 h-3" /> : null}
                    {saving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
                  </button>
                </div>

                {/* Change password */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Change Password</h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
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
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md border border-input text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>

                {/* Account ID */}
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-[10px] text-muted-foreground/50">Account ID: {user?.id}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Brokers tab */}
        {activeTab === 'brokers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">Connect your trading accounts to stream live data</p>
              <button
                onClick={() => setShowAddBroker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Broker
              </button>
            </div>

            {loadingBrokers && <p className="text-xs text-muted-foreground">Loading...</p>}

            {!loadingBrokers && connections.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <WifiOff className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No brokers connected</p>
                <button onClick={() => setShowAddBroker(true)} className="text-xs text-primary hover:text-primary/80 font-medium">
                  Connect your first broker
                </button>
              </div>
            )}

            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${conn.status === 'connected' ? 'bg-success/10' : 'bg-muted'}`}>
                      {conn.status === 'connected' ? <Wifi className="w-4 h-4 text-success" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{conn.brokerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {conn.accountNumber || 'No account number'}
                        {(conn.config as any)?.server && <span> · {(conn.config as any).server}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      conn.status === 'connected' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>{conn.status}</span>
                    <button onClick={() => handleDeleteBroker(conn.id)} className="p-1 rounded hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddBroker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
                  <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Broker Connection</h2>
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Broker</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BROKER_PRESETS.map(preset => (
                        <button key={preset.source} onClick={() => setSelectedPreset(preset)}
                          className={`px-3 py-1.5 text-[11px] rounded-md transition-colors ${
                            selectedPreset.source === preset.source ? 'bg-primary text-primary-foreground' : 'border border-input text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}>{preset.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
                    <input type="text" placeholder="e.g. 12345678" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Server Name</label>
                    <input type="text" placeholder="e.g. ICMarketsSC-Demo" value={serverName} onChange={(e) => setServerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowAddBroker(false); setAccountNumber(''); setServerName('') }}
                      className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Cancel</button>
                    <button onClick={handleAddBroker}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Connect</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preferences tab */}
        {activeTab === 'preferences' && (
          <div className="text-sm text-muted-foreground">
            Preferences coming soon — default timezone, timeframe, theme, etc.
          </div>
        )}
      </div>
    </AppShell>
  )
}