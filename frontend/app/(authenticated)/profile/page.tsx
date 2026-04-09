'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BrokerConnection } from '@/lib/types'
import { logout } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Wifi, WifiOff, LogOut } from 'lucide-react'

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

  // Add broker modal
  const [showAddBroker, setShowAddBroker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(BROKER_PRESETS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [serverName, setServerName] = useState('')

  useEffect(() => {
    if (activeTab === 'brokers') {
      fetchConnections()
    }
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
        config: {
          source: selectedPreset.source,
          server: serverName.trim() || undefined,
        }
      })
      setShowAddBroker(false)
      setAccountNumber('')
      setServerName('')
      fetchConnections()
    } catch (err) {
      console.error('Failed to add broker', err)
    }
  }

  const handleDeleteBroker = async (id: string) => {
    try {
      await api.deleteBrokerConnection(id)
      fetchConnections()
    } catch (err) {
      console.error('Failed to delete broker', err)
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Profile</h1>

        {/* Tabs */}
        <div className="border-b border-black/10 dark:border-white/10 mb-6">
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
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
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
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Email</label>
                <p className="text-sm text-zinc-900 dark:text-white mt-1">
                  {typeof window !== 'undefined' ? localStorage.getItem('userId') || '—' : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Account ID</label>
                <p className="text-sm text-zinc-900 dark:text-white mt-1 font-mono text-[11px]">
                  {typeof window !== 'undefined' ? localStorage.getItem('userId') || '—' : '—'}
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        )}

        {/* Brokers tab */}
        {activeTab === 'brokers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Connect your trading accounts to stream live data
              </p>
              <button
                onClick={() => setShowAddBroker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Broker
              </button>
            </div>

            {loadingBrokers && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
            )}

            {!loadingBrokers && connections.length === 0 && (
              <div className="text-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-lg">
                <WifiOff className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">No brokers connected</p>
                <button
                  onClick={() => setShowAddBroker(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Connect your first broker
                </button>
              </div>
            )}

            {/* Broker list */}
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${
                      conn.status === 'connected'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}>
                      {conn.status === 'connected' ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {conn.brokerName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {conn.accountNumber || 'No account number'}
                        {(conn.config as any)?.server && (
                          <span> · {(conn.config as any).server}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      conn.status === 'connected'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {conn.status}
                    </span>
                    <button
                      onClick={() => handleDeleteBroker(conn.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Broker Modal */}
            {showAddBroker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 p-6 w-full max-w-sm mx-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Add Broker Connection
                  </h2>

                  {/* Broker preset */}
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Broker</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BROKER_PRESETS.map((preset) => (
                        <button
                          key={preset.source}
                          onClick={() => setSelectedPreset(preset)}
                          className={`px-3 py-1.5 text-[11px] rounded-md transition-colors ${
                            selectedPreset.source === preset.source
                              ? 'bg-blue-600 text-white'
                              : 'border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account number */}
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 12345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Server name */}
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Server Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ICMarketsSC-Demo"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddBroker(false)
                        setAccountNumber('')
                        setServerName('')
                      }}
                      className="px-3 py-1.5 text-sm rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBroker}
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Preferences coming soon — default timezone, timeframe, theme, etc.
          </div>
        )}
      </div>
    </AppShell>
  )
}