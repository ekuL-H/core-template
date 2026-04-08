'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Watchlist } from '@/lib/types'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Pencil } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
]

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [loading, setLoading] = useState(true)

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  useEffect(() => { 
      fetchWatchlists()
  }, [])

  const fetchWatchlists = async () => {
    try {
      const data = await api.getWatchlists()
      setWatchlists(data)
    } catch (err) {
      console.error('Failed to fetch watchlists', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await api.createWatchlist(newName.trim(), newColor)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowCreate(false)
      fetchWatchlists()
    } catch (err) {
      console.error('Failed to create watchlist', err)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return
    try {
      await api.updateWatchlist(editingId, { name: editName.trim(), color: editColor })
      setEditingId(null)
      fetchWatchlists()
    } catch (err) {
      console.error('Failed to update watchlist', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWatchlist(id)
      fetchWatchlists()
    } catch (err) {
      console.error('Failed to delete watchlist', err)
    }
  }

  const openEdit = (wl: Watchlist) => {
    setEditingId(wl.id)
    setEditName(wl.name)
    setEditColor(wl.color)
  }


  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Watchlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Watchlist
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading watchlists...</p>
      )}

      {/* Empty state */}
      {!loading && watchlists.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">No watchlists yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first watchlist
          </button>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlists.map((wl) => (
          <div
            key={wl.id}
            className="group relative rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-colors"
            onClick={() => router.push(`/watchlist/${wl.id}`)}
          >
            {/* Color bar */}
            <div className="h-2" style={{ backgroundColor: wl.color }} />

            <div className="p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {wl.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {wl.items.length} {wl.items.length === 1 ? 'symbol' : 'symbols'}
              </p>
            </div>

            {/* Hover actions */}
            <div className="absolute top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(wl)
                }}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <Pencil className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(wl.id)
                }}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              New Watchlist
            </h2>
            <input
              type="text"
              placeholder="Watchlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 mb-4"
            />
            <div className="mb-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? 'white' : 'transparent',
                      boxShadow: newColor === color ? `0 0 0 2px ${color}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewColor(PRESET_COLORS[0]) }}
                className="px-3 py-1.5 text-sm rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Edit Watchlist
            </h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 mb-4"
            />
            <div className="mb-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: editColor === color ? 'white' : 'transparent',
                      boxShadow: editColor === color ? `0 0 0 2px ${color}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 text-sm rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}