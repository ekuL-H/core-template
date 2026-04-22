'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { tradingApi as api } from '@/lib/api/trading'
import { Watchlist } from '@/lib/types/trading'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Pencil } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b',
]

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  useEffect(() => { fetchWatchlists() }, [])

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
        <h1 className="text-lg font-semibold text-foreground">Watchlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Watchlist
        </button>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">Loading watchlists...</p>
      )}

      {!loading && watchlists.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4 text-sm">No watchlists yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Create your first watchlist
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {watchlists.map((wl) => (
          <div
            key={wl.id}
            className="group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-border/80 hover:shadow-sm transition-all"
            onClick={() => router.push(`/trading/watchlist/${wl.id}`)}
          >
            <div className="h-1.5" style={{ backgroundColor: wl.color }} />
            <div className="p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-1">{wl.name}</h3>
              <p className="text-xs text-muted-foreground">
                {wl.items.length} {wl.items.length === 1 ? 'symbol' : 'symbols'}
              </p>
            </div>
            <div className="absolute top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(wl) }}
                className="p-1 rounded hover:bg-accent"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(wl.id) }}
                className="p-1 rounded hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">New Watchlist</h2>
            <input
              type="text"
              placeholder="Watchlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-4"
            />
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
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
                className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
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
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">Edit Watchlist</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-4"
            />
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
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
                className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
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