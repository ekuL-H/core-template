'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import { Plus, Trash2, ChevronDown, ImageIcon, ExternalLink } from 'lucide-react'

type Tab = 'table' | 'analytics' | 'plan' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'table', label: 'Table' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'plan', label: 'Trading Plan' },
  { key: 'settings', label: 'Settings' },
]

interface Column {
  id: string
  label: string
  type: string
  options?: string[]
  width: number
}

interface Entry {
  id: string
  rowOrder: number
  data: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Journal {
  id: string
  name: string
  description: string | null
  color: string
  columns: Column[]
  entries: Entry[]
}

const COLUMN_TYPES = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
  { type: 'select', label: 'Select' },
  { type: 'screenshots', label: 'Screenshots' },
]

export default function JournalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const journalId = params.id as string

  const [journal, setJournal] = useState<Journal | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('table')
  const [editingCell, setEditingCell] = useState<{ entryId: string; colId: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColLabel, setNewColLabel] = useState('')
  const [newColType, setNewColType] = useState('text')
  const [newColOptions, setNewColOptions] = useState('')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  useEffect(() => { fetchJournal() }, [])

  const fetchJournal = async () => {
    try {
      const data = await api.getJournal(journalId)
      if (!data) { router.push('/journal'); return }
      setJournal(data)
    } catch (err) {
      console.error('Failed to fetch journal', err)
      router.push('/journal')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!journal) return
    try {
      await api.addJournalEntry(journalId)
      fetchJournal()
    } catch (err) { console.error('Failed to add entry', err) }
  }

  const handleCellClick = (entryId: string, colId: string, currentValue: any) => {
    setEditingCell({ entryId, colId })
    setEditValue(currentValue?.toString() || '')
  }

  const handleCellSave = async () => {
    if (!editingCell || !journal) return
    const entry = journal.entries.find(e => e.id === editingCell.entryId)
    if (!entry) return

    const newData = { ...entry.data, [editingCell.colId]: editValue }

    try {
      await api.updateJournalEntry(journalId, editingCell.entryId, newData)
      setEditingCell(null)
      fetchJournal()
    } catch (err) { console.error('Failed to save cell', err) }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await api.deleteJournalEntry(journalId, entryId)
      fetchJournal()
    } catch (err) { console.error('Failed to delete entry', err) }
  }

  const handleAddColumn = async () => {
    if (!newColLabel.trim()) return
    try {
      await api.addJournalColumn(journalId, {
        label: newColLabel.trim(),
        type: newColType,
        options: newColType === 'select' ? newColOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      })
      setShowAddColumn(false)
      setNewColLabel('')
      setNewColType('text')
      setNewColOptions('')
      fetchJournal()
    } catch (err) { console.error('Failed to add column', err) }
  }

  const handleDeleteColumn = async (colId: string) => {
    try {
      await api.deleteJournalColumn(journalId, colId)
      fetchJournal()
    } catch (err) { console.error('Failed to delete column', err) }
  }

  const formatCellValue = (value: any, col: Column) => {
    if (value === undefined || value === null || value === '') return null
    if (col.type === 'number') {
      const num = parseFloat(value)
      if (isNaN(num)) return value
      if (col.id === 'pnl') {
        return <span className={num >= 0 ? 'text-success' : 'text-destructive'}>{num >= 0 ? '+' : ''}{num.toFixed(2)}</span>
      }
      return num.toFixed(2)
    }
    if (col.type === 'screenshots') {
      const urls = value.toString().split(',').map((s: string) => s.trim()).filter(Boolean)
      return (
        <div className="flex gap-1">
          {urls.map((url: string, i: number) => {
            const isImage = url.match(/\.(png|jpg|jpeg|gif|webp)$/i) || url.startsWith('data:')
            if (isImage) {
              return (
                <button key={i} onClick={(e) => { e.stopPropagation(); setExpandedImage(url) }}
                  className="w-8 h-8 rounded border border-border overflow-hidden hover:ring-1 hover:ring-primary">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                </button>
              )
            }
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80">
                <ExternalLink className="w-3 h-3" /> Link
              </a>
            )
          })}
        </div>
      )
    }
    return value
  }

  if (loading) {
    return <AppShell><div className="py-8 text-center text-xs text-muted-foreground">Loading journal...</div></AppShell>
  }

  if (!journal) return null

  const breadcrumbs = [
    { label: 'Journal', href: '/journal' },
    { label: journal.name },
  ]

  return (
    <AppShell breadcrumbOverrides={breadcrumbs}>
      {/* Info bar */}
      <div className="rounded-md px-4 py-2 mb-0 flex items-center justify-between"
        style={{ backgroundColor: journal.color + '18' }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: journal.color }} />
          <h1 className="text-sm font-semibold text-foreground">{journal.name}</h1>
          <span className="text-xs text-muted-foreground">
            {journal.entries.length} {journal.entries.length === 1 ? 'trade' : 'trades'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mt-2">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: journal.color }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table tab */}
      {activeTab === 'table' && (
        <div className="mt-0">
          <div className="overflow-x-auto" style={{ height: 'calc(100vh - 250px)' }}>
            <table className="w-full border-collapse">
              {/* Header */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-card">
                  <th className="w-8 px-1 py-1.5 border-b border-border" />
                  {journal.columns.map(col => (
                    <th key={col.id}
                      className="px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide border-b border-border group"
                      style={{ minWidth: col.width }}>
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-destructive" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Add column button */}
                  <th className="w-10 px-1 py-1.5 border-b border-border">
                    <button
                      onClick={() => setShowAddColumn(true)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent transition-all"
                      title="Add column"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {journal.entries.map((entry, rowIndex) => (
                  <tr key={entry.id} className="group hover:bg-accent/50 transition-colors">
                    {/* Row number + delete */}
                    <td className="w-8 px-1 py-0 text-center border-b border-border/50">
                      <div className="flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/40 group-hover:hidden">{rowIndex + 1}</span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="hidden group-hover:block p-0.5 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </td>

                    {journal.columns.map(col => {
                      const isEditing = editingCell?.entryId === entry.id && editingCell?.colId === col.id
                      const value = entry.data[col.id]

                      return (
                        <td key={col.id}
                          className="px-2 py-0 border-b border-border/50 cursor-text"
                          style={{ minWidth: col.width }}
                          onClick={() => !isEditing && handleCellClick(entry.id, col.id, value)}
                        >
                          {isEditing ? (
                            col.type === 'select' ? (
                              <select
                                value={editValue}
                                onChange={(e) => { setEditValue(e.target.value) }}
                                onBlur={handleCellSave}
                                autoFocus
                                className="w-full py-1 text-xs bg-transparent text-foreground focus:outline-none"
                              >
                                <option value="">—</option>
                                {col.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(); if (e.key === 'Escape') setEditingCell(null) }}
                                autoFocus
                                className="w-full py-1 text-xs bg-transparent text-foreground focus:outline-none"
                                step={col.type === 'number' ? 'any' : undefined}
                              />
                            )
                          ) : (
                            <div className="py-1 text-xs text-foreground min-h-[28px] flex items-center">
                              {formatCellValue(value, col) || <span className="text-muted-foreground/30">—</span>}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="w-10 border-b border-border/50" />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add row area - Notion style */}
            <div
              onClick={handleAddEntry}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-muted-foreground/30 hover:text-muted-foreground hover:bg-accent/50 transition-all border-b border-transparent hover:border-border/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs">New trade</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics tab */}
      {activeTab === 'analytics' && (
        <div className="py-12 text-center text-sm text-muted-foreground">Analytics — coming soon</div>
      )}

      {/* Trading Plan tab */}
      {activeTab === 'plan' && (
        <div className="py-12 text-center text-sm text-muted-foreground">Trading Plan — coming soon</div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="py-12 text-center text-sm text-muted-foreground">Settings — coming soon</div>
      )}

      {/* Add column modal */}
      {showAddColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Column</h2>
            <input
              type="text"
              placeholder="Column name"
              value={newColLabel}
              onChange={(e) => setNewColLabel(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {COLUMN_TYPES.map(ct => (
                  <button
                    key={ct.type}
                    onClick={() => setNewColType(ct.type)}
                    className={`px-3 py-1.5 text-[11px] rounded-md transition-colors ${
                      newColType === ct.type
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
            {newColType === 'select' && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Options (comma separated)</p>
                <input
                  type="text"
                  placeholder="e.g. Long, Short"
                  value={newColOptions}
                  onChange={(e) => setNewColOptions(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAddColumn(false); setNewColLabel(''); setNewColType('text') }}
                className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Cancel</button>
              <button onClick={handleAddColumn}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Image expand modal */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" alt="" />
        </div>
      )}
    </AppShell>
  )
}