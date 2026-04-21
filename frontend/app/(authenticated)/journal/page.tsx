'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, Pencil, BookOpen } from 'lucide-react'

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#06b6d4', '#eab308', '#64748b',
]

interface Journal {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
  _count: { entries: number }
}

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  useEffect(() => { fetchJournals() }, [])

  const fetchJournals = async () => {
    setLoading(true)
    try {
      const data = await api.getJournals()
      setJournals(data)
    } catch (err) {
      console.error('Failed to fetch journals', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const journal = await api.createJournal({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        color: newColor
      })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      setNewColor(PRESET_COLORS[0])
      router.push(`/journal/${journal.id}`)
    } catch (err) {
      console.error('Failed to create journal', err)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.deleteJournal(id)
      fetchJournals()
    } catch (err) {
      console.error('Failed to delete journal', err)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Journal</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Journal
        </button>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading journals...</p>}

      {!loading && journals.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4 text-sm">No journals yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Create your first journal
          </button>
        </div>
      )}

      {/* Journal list */}
      <div className="space-y-1">
        {journals.map(journal => (
          <div
            key={journal.id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push(`/journal/${journal.id}`)}
          >
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: journal.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{journal.name}</p>
              {journal.description && (
                <p className="text-[11px] text-muted-foreground truncate">{journal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {journal._count.entries} {journal._count.entries === 1 ? 'trade' : 'trades'}
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                {formatDate(journal.updatedAt)}
              </span>
              <button
                onClick={(e) => handleDelete(journal.id, e)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">New Journal</h2>
            <input
              type="text"
              placeholder="Journal name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? 'white' : 'transparent',
                      boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}
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
    </AppShell>
  )
}