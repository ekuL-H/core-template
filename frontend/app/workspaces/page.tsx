'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { coreApi } from '@/lib/api/core'
import { Plus, ArrowRight, Trash2, LayoutDashboard, Home, Briefcase, Archive, Clock, Star, Settings as SettingsIcon, LogOut, RotateCcw, Search, Bell, Calendar, HelpCircle, User, Sun, Moon, MoreHorizontal, Pencil } from 'lucide-react'
import { logout } from '@/lib/auth'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SettingsModal from '@/components/layout/SettingsModal'
import LoadingScreen from '@/components/layout/LoadingScreen'


const TYPE_ICONS: Record<string, any> = {
  trading: LayoutDashboard,
  property: Home,
  business: Briefcase,
}

const TYPE_COLORS: Record<string, string> = {
  trading: '#5C899D',
  property: '#6C7D36',
  business: '#A0430A',
}

interface Workspace {
  id: string
  name: string
  type: string
  status: string
  role: string
  isFavourite: boolean
  memberCount: number
  createdAt: string
  archivedAt: string | null
  lastOpenedAt: string | null
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
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'delete'; id: string } | null>(null)
  const [cardMenu, setCardMenu] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth'); return }
    setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  // Refetch when page regains focus (e.g. browser back button)
  useEffect(() => {
    const handleFocus = () => {
      if (authed) fetchData()
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('popstate', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('popstate', handleFocus)
    }
  }, [authed])
  
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
    setSwitching(true)
    coreApi.openWorkspace(ws.id).catch(() => {})
    localStorage.setItem('activeWorkspace', JSON.stringify({ id: ws.id, type: ws.type, name: ws.name }))
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(`browser_tabs_${ws.id}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          const activeTab = parsed.tabs?.find((t: any) => t.id === parsed.activeTabId)
          if (activeTab?.route) { window.location.href = activeTab.route; return }
        }
      } catch {}
      window.location.href = '/dashboard'
    }, 100)
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmAction({ type: 'archive', id })
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmAction({ type: 'delete', id })
  }

  const executeAction = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.type === 'archive') {
        await coreApi.archiveWorkspace(confirmAction.id)
      } else {
        await coreApi.deleteWorkspace(confirmAction.id)
      }
      fetchData()
    } catch (err) {
      console.error('Action failed', err)
    } finally {
      setConfirmAction(null)
    }
  }

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try { await coreApi.restoreWorkspace(id); fetchData() }
    catch (err) { console.error('Failed to restore workspace', err) }
  }

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenaming(null); return }
    try {
      await coreApi.updateWorkspace(id, { name: renameValue.trim() })
      fetchData()
    } catch (err) {
      console.error('Failed to rename workspace', err)
    } finally {
      setRenaming(null)
      setRenameValue('')
    }
  }

  const handleToggleFavourite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (renaming) return
    try {
      const result = await coreApi.toggleFavourite(id)
      setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, isFavourite: result.isFavourite } : ws))
    } catch (err) {
      console.error('Failed to toggle favourite', err)
    }
  }

  const activeWorkspaces = workspaces.filter(ws => ws.status === 'active')
  const archivedWorkspaces = workspaces.filter(ws => ws.status === 'archived')
  const favouriteWorkspaces = activeWorkspaces.filter(ws => ws.isFavourite)
  const recentWorkspaces = activeWorkspaces
    .filter(ws => ws.lastOpenedAt)
    .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
    .slice(0, 8)

  // Group active workspaces by type
  const TYPE_ORDER = ['trading', 'property', 'business']
  const nonFavWorkspaces = activeWorkspaces.filter(ws => !ws.isFavourite)
  const groupedWorkspaces = TYPE_ORDER
    .filter(type => nonFavWorkspaces.some(ws => ws.type === type))
    .map(type => ({
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      color: TYPE_COLORS[type] || '#5C899D',
      workspaces: nonFavWorkspaces.filter(ws => ws.type === type),
    }))

  const renderCard = (ws: Workspace, keyPrefix: string = '') => {
    const Icon = TYPE_ICONS[ws.type] || LayoutDashboard
    const color = TYPE_COLORS[ws.type] || '#5C899D'
    return (
      <div
        key={keyPrefix + ws.id}
        onClick={() => handleOpen(ws)}
        className="group relative rounded-xl border border-border bg-card cursor-pointer hover:border-foreground/20 transition-all overflow-hidden"
      >
        <div className="h-1" style={{ backgroundColor: color }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => handleToggleFavourite(ws.id, e)}
                className={`p-1 rounded transition-all ${
                  ws.isFavourite
                    ? 'text-amber-500'
                    : 'text-muted-foreground/30 hover:text-muted-foreground'
                }`}
                title={ws.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star className="w-3.5 h-3.5" fill={ws.isFavourite ? 'currentColor' : 'none'} />
              </button>
              {ws.role === 'owner' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCardMenu(cardMenu === ws.id ? null : ws.id)
                    }}
                    className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-accent transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {cardMenu === ws.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setCardMenu(null) }} />
                      <div className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCardMenu(null)
                            setRenaming(ws.id)
                            setRenameValue(ws.name)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleArchive(ws.id, e)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Archive className="w-3 h-3" />
                          Archive
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {renaming === ws.id ? (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(ws.id)
                  if (e.key === 'Escape') { setRenaming(null); setRenameValue('') }
                }}
                onBlur={() => handleRename(ws.id)}
                autoFocus
                className="w-full px-2 py-1 text-sm font-medium rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-0.5"
              />
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-card-foreground mb-1">{ws.name}</h3>
          )}
          <p className="text-[11px] text-muted-foreground">
            {ws.type.charAt(0).toUpperCase() + ws.type.slice(1)} · {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>
    )
  }

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

  if (switching) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar - matches app header height */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-sidebar-border bg-sidebar flex-shrink-0">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-[7px] font-bold text-background tracking-tight">Oasis</span>
          </div>
          <span className="text-[13px] font-semibold text-foreground">Oasis</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Search">
            <Search className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Notifications">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Calendar">
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Help">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-56 border-r border-sidebar-border bg-sidebar p-4 flex flex-col flex-shrink-0">
          <nav className="flex flex-col gap-0.5 flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors ${
                  filter === item.key
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
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

          <div className="border-t border-sidebar-border pt-3 mt-3 flex flex-col gap-0.5">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full"
            >
              <User className="w-4 h-4" />
              <span>User Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main content */}

        {/* Main content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {filter === 'all' ? 'Your Workspaces' : filter === 'recent' ? 'Recent' : 'Archived'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filter === 'archived'
                    ? 'Archived workspaces are deleted after 30 days'
                    : filter === 'recent'
                      ? `${recentWorkspaces.length} recently opened`
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
            {activeWorkspaces.length === 0 && filter !== 'archived' && !showCreate && (
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

            {archivedWorkspaces.length === 0 && filter === 'archived' && (
              <div className="text-center py-20">
                <Archive className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No archived workspaces</p>
              </div>
            )}

            {/* All workspaces — grouped by type with favourites */}
            {filter === 'all' && activeWorkspaces.length > 0 && (
              <div className="space-y-8">
                {/* Favourites */}
                {favouriteWorkspaces.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-3.5 h-3.5 text-muted-foreground" />
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Favourites</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {favouriteWorkspaces.map(ws => renderCard(ws))}
                    </div>
                  </div>
                )}

                {/* Grouped by type */}
                {groupedWorkspaces.map(group => (
                  <div key={group.type}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</h2>
                      <span className="text-[10px] text-muted-foreground/50">{group.workspaces.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {group.workspaces.map(ws => renderCard(ws))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent workspaces */}
            {filter === 'recent' && (
              <div>
                {recentWorkspaces.length === 0 ? (
                  <div className="text-center py-20">
                    <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No recently opened workspaces</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {recentWorkspaces.map(ws => renderCard(ws))}
                  </div>
                )}
              </div>
            )}

            {/* Archived list */}
            {filter === 'archived' && archivedWorkspaces.length > 0 && (
              <div className="space-y-2">
                {archivedWorkspaces.map(ws => {
                  const Icon = TYPE_ICONS[ws.type] || LayoutDashboard
                  const color = TYPE_COLORS[ws.type] || '#5C899D'
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

            {/* Create workspace modal */}
            {showCreate && (
              <>
                <div className="fixed inset-0 z-40 bg-black/50" onClick={() => { setShowCreate(false); setNewName(''); setSelectedType('') }} />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                      <h3 className="text-base font-semibold text-foreground mb-1">Create Workspace</h3>
                      <p className="text-xs text-muted-foreground mb-5">Choose a type and give your workspace a name.</p>

                      <p className="text-xs font-medium text-foreground mb-2">Type</p>
                      <div className="grid grid-cols-1 gap-2 mb-5">
                        {templates.map(tmpl => {
                          const Icon = TYPE_ICONS[tmpl.type] || LayoutDashboard
                          const color = TYPE_COLORS[tmpl.type] || '#5C899D'
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
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{tmpl.name}</p>
                                <p className="text-[11px] text-muted-foreground">{tmpl.description}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <p className="text-xs font-medium text-foreground mb-2">Name</p>
                      <input
                        type="text"
                        placeholder="Workspace name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 mb-5"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setShowCreate(false); setNewName(''); setSelectedType('') }}
                          className="px-4 py-2 text-xs rounded-md text-muted-foreground hover:bg-accent transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreate}
                          disabled={!newName.trim() || !selectedType}
                          className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
        {confirmAction && (
          <ConfirmDialog
            title={confirmAction.type === 'archive' ? 'Archive Workspace' : 'Delete Workspace'}
            message={confirmAction.type === 'archive'
              ? 'This workspace will be archived and automatically deleted after 30 days. You can restore it anytime before then.'
              : 'This will permanently delete the workspace and all its data. This cannot be undone.'}
            confirmLabel={confirmAction.type === 'archive' ? 'Archive' : 'Delete Permanently'}
            confirmDestructive={true}
            onConfirm={executeAction}
            onCancel={() => setConfirmAction(null)}
          />
        )}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
          />
        )}
    </div>
  )
}