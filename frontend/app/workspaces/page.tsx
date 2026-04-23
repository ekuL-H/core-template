'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { coreApi } from '@/lib/api/core'
import { Plus, ArrowRight, Trash2, LayoutDashboard, Home, Archive, Clock, Settings, LogOut, RotateCcw } from 'lucide-react'
import { logout } from '@/lib/auth'

const TYPE_ICONS: Record<string, any> = {
  trading: LayoutDashboard,
  housing: Home,
}

const TYPE_COLORS: Record<string, string> = {
  trading: '#6366f1',
  housing: '#22c55e',
}

interface Workspace {
  id: string
  name: string
  type: string
  status: string
  role: string
  memberCount: number
  createdAt: string
  archivedAt: string | null
}

interface Template {
  type: string
  name: string
  description: string
}

type Filter = 'all' | 'recent' | 'archived'

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth'); return }
    setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  // Apply saved theme
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const fetchData = async () => {
    try {
      const [ws, tmpl] = await Promise.all([
        coreApi.getWorkspaces(),
        coreApi.getWorkspaceTemplates()
      ])
      setWorkspaces(ws)
      setTemplates(tmpl)
    } catch (err) {
      console.error('Failed to fetch workspaces', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !selectedType) return
    try {
      const ws = await coreApi.createWorkspace({ name: newName.trim(), type: selectedType })
      setShowCreate(false)
      setNewName('')
      setSelectedType('')
      handleOpen(ws)
    } catch (err) {
      console.error('Failed to create workspace', err)
    }
  }

  const handleOpen = (ws: { id: string; type: string; name?: string }) => {
    localStorage.setItem('activeWorkspace', JSON.stringify({ id: ws.id, type: ws.type, name: ws.name }))
    try {
      const saved = localStorage.getItem(`browser_tabs_${ws.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        const activeTab = parsed.tabs?.find((t: any) => t.id === parsed.activeTabId)
        if (activeTab?.route) { window.location.href = activeTab.route; return }
      }
    } catch {}
    window.location.href = '/dashboard'
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await coreApi.archiveWorkspace(id); fetchData() }
    catch (err) { console.error('Failed to archive workspace', err) }
  }

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await coreApi.restoreWorkspace(id); fetchData() }
    catch (err) { console.error('Failed to restore workspace', err) }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await coreApi.deleteWorkspace(id); fetchData() }
    catch (err) { console.error('Failed to delete workspace', err) }
  }

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  const activeWorkspaces = workspaces.filter(ws => ws.status === 'active')
  const archivedWorkspaces = workspaces.filter(ws => ws.status === 'archived')

  const filteredWorkspaces = filter === 'archived'
    ? archivedWorkspaces
    : filter === 'recent'
      ? activeWorkspaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      : activeWorkspaces

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!authed) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const SIDEBAR_ITEMS: { key: Filter; label: string; icon: any; count?: number }[] = [
    { key: 'all', label: 'All Workspaces', icon: LayoutDashboard, count: activeWorkspaces.length },
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'archived', label: 'Archived', icon: Archive, count: archivedWorkspaces.length },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-[9px] font-bold text-background tracking-tight">Oasis</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Oasis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            onClick={handleLogout} title="Logout">
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-52 border-r border-border p-4 flex flex-col flex-shrink-0">
          <nav className="flex flex-col gap-0.5 flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors ${
                  filter === item.key
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-border pt-3 mt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {filter === 'all' ? 'Your Workspaces' : filter === 'recent' ? 'Recent' : 'Archived'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filter === 'archived'
                    ? 'Archived workspaces are deleted after 30 days'
                    : `${activeWorkspaces.length} workspace${activeWorkspaces.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              {filter !== 'archived' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Workspace
                </button>
              )}
            </div>

            {/* Empty state */}
            {filteredWorkspaces.length === 0 && filter !== 'archived' && !showCreate && (
              <div className="text-center py-20">
                <LayoutDashboard className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No workspaces yet</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Create your first workspace
                </button>
              </div>
            )}

            {filteredWorkspaces.length === 0 && filter === 'archived' && (
              <div className="text-center py-20">
                <Archive className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No archived workspaces</p>
              </div>
            )}

            {/* Workspace cards */}
            {filter !== 'archived' && filteredWorkspaces.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {filteredWorkspaces.map(ws => {
                  const Icon = TYPE_ICONS[ws.type] || LayoutDashboard
                  const color = TYPE_COLORS[ws.type] || '#6366f1'
                  return (
                    <div
                      key={ws.id}
                      onClick={() => handleOpen(ws)}
                      className="group relative rounded-lg border border-border bg-card cursor-pointer hover:border-border/80 hover:shadow-sm transition-all overflow-hidden"
                    >
                      <div className="h-1.5" style={{ backgroundColor: color }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                            <Icon className="w-4.5 h-4.5" style={{ color }} />
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                        </div>
                        <h3 className="text-sm font-medium text-card-foreground mb-0.5">{ws.name}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {ws.type.charAt(0).toUpperCase() + ws.type.slice(1)} · {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-2">
                          Created {formatDate(ws.createdAt)}
                        </p>
                      </div>
                      {ws.role === 'owner' && (
                        <button
                          onClick={(e) => handleArchive(ws.id, e)}
                          className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                        >
                          <Archive className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Archived list */}
            {filter === 'archived' && archivedWorkspaces.length > 0 && (
              <div className="space-y-2">
                {archivedWorkspaces.map(ws => {
                  const Icon = TYPE_ICONS[ws.type] || LayoutDashboard
                  const color = TYPE_COLORS[ws.type] || '#6366f1'
                  const archivedDate = ws.archivedAt ? new Date(ws.archivedAt) : new Date()
                  const deleteDate = new Date(archivedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                  const daysLeft = Math.max(0, Math.ceil((deleteDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))

                  return (
                    <div key={ws.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 opacity-50" style={{ backgroundColor: color + '15' }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground/70">{ws.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Archived {formatDate(ws.archivedAt || ws.createdAt)} · deletes in {daysLeft} days
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => handleRestore(ws.id, e)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-md text-foreground hover:bg-accent border border-border transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                        <button
                          onClick={(e) => handleDelete(ws.id, e)}
                          className="px-2.5 py-1.5 text-[11px] rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Create workspace inline */}
            {showCreate && (
              <div className="mt-6 p-5 rounded-lg border border-border bg-card">
                <h3 className="text-sm font-medium text-foreground mb-4">Create Workspace</h3>
                <input
                  type="text"
                  placeholder="Workspace name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 mb-4"
                />
                <p className="text-xs text-muted-foreground mb-2">Type</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {templates.map(tmpl => {
                    const Icon = TYPE_ICONS[tmpl.type] || LayoutDashboard
                    const color = TYPE_COLORS[tmpl.type] || '#6366f1'
                    return (
                      <button
                        key={tmpl.type}
                        onClick={() => setSelectedType(tmpl.type)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          selectedType === tmpl.type
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{tmpl.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tmpl.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowCreate(false); setNewName(''); setSelectedType('') }}
                    className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Cancel</button>
                  <button onClick={handleCreate}
                    disabled={!newName.trim() || !selectedType}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Create</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}