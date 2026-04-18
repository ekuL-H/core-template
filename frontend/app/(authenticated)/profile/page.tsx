'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BrokerConnection } from '@/lib/types'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Wifi, WifiOff } from 'lucide-react'

type Tab = 'account' | 'brokers' | 'preferences'

const TABS: { key: Tab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'brokers', label: 'Brokers' },
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
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [connections, setConnections] = useState<BrokerConnection[]>([])
  const [loadingBrokers, setLoadingBrokers] = useState(false)
  const [showAddBroker, setShowAddBroker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(BROKER_PRESETS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [serverName, setServerName] = useState('')

  useEffect(() => {
    if (activeTab === 'brokers') fetchConnections()
  }, [activeTab])

  const fetchConnections = async () => {
    setLoadingBrokers(true)
    try {
      const data = await api.getBrokerConnections()
      setConnections(data)
    } catch (err) {
      console.error('Failed to fetch broker connections', err)
    } finally {
      setLoadingBrokers(false)
    }
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
    try {
      await api.deleteBrokerConnection(id)
      fetchConnections()
    } catch (err) { console.error('Failed to delete broker', err) }
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-lg font-semibold text-foreground mb-4">Profile</h1>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                  activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Account tab */}
        {activeTab === 'account' && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <p className="text-sm text-foreground mt-1">
                  {typeof window !== 'undefined' ? localStorage.getItem('userId') || '—' : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Account ID</label>
                <p className="text-sm text-foreground mt-1 font-mono text-[11px]">
                  {typeof window !== 'undefined' ? localStorage.getItem('userId') || '—' : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Brokers tab */}
        {activeTab === 'brokers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                Connect your trading accounts to stream live data
              </p>
              <button
                onClick={() => setShowAddBroker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Broker
              </button>
            </div>

            {loadingBrokers && (
              <p className="text-xs text-muted-foreground">Loading...</p>
            )}

            {!loadingBrokers && connections.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <WifiOff className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No brokers connected</p>
                <button
                  onClick={() => setShowAddBroker(true)}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Connect your first broker
                </button>
              </div>
            )}

            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${
                      conn.status === 'connected' ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      {conn.status === 'connected' ? (
                        <Wifi className="w-4 h-4 text-success" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-muted-foreground" />
                      )}
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
                      conn.status === 'connected'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {conn.status}
                    </span>
                    <button
                      onClick={() => handleDeleteBroker(conn.id)}
                      className="p-1 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Broker Modal */}
            {showAddBroker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
                  <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Broker Connection</h2>

                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Broker</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BROKER_PRESETS.map((preset) => (
                        <button
                          key={preset.source}
                          onClick={() => setSelectedPreset(preset)}
                          className={`px-3 py-1.5 text-[11px] rounded-md transition-colors ${
                            selectedPreset.source === preset.source
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-input text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 12345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Server Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ICMarketsSC-Demo"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setShowAddBroker(false); setAccountNumber(''); setServerName('') }}
                      className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBroker}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Connect
                    </button>
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