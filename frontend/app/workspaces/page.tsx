'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { coreApi } from '@/lib/api/core'
import { Plus, ArrowRight, Trash2, LayoutDashboard, Home } from 'lucide-react'

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
  role: string
  memberCount: number
  createdAt: string
}

interface Template {
  type: string
  name: string
  description: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth')
      return
    }
    setAuthed(true)
  }, [])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    fetchData()
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await coreApi.deleteWorkspace(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete workspace', err)
    }
  }

  const handleOpen = (ws: Workspace | { id: string; type: string; name?: string }) => {
    localStorage.setItem('activeWorkspace', JSON.stringify({ id: ws.id, type: ws.type, name: (ws as any).name }))
    router.push('/dashboard')
  }

  if (!authed) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workspaces...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto pt-20 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-sm font-bold text-background tracking-tight">T-AI</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Choose a workspace to continue</p>
          </div>
        </div>

        {/* Workspace list */}
        {workspaces.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Your Workspaces</p>
            <div className="space-y-2">
              {workspaces.map(ws => {
                const Icon = TYPE_ICONS[ws.type] || LayoutDashboard
                const color = TYPE_COLORS[ws.type] || '#6366f1'
                return (
                  <div
                    key={ws.id}
                    onClick={() => handleOpen(ws)}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card cursor-pointer hover:border-border/80 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{ws.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ws.type} · {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'} · {ws.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ws.role === 'owner' && (
                        <button
                          onClick={(e) => handleDelete(ws.id, e)}
                          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Create new */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {workspaces.length > 0 ? 'Create New' : 'Get Started'}
          </p>
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border hover:border-border/80 hover:bg-accent/50 transition-all w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">New Workspace</p>
                <p className="text-[11px] text-muted-foreground">Create a workspace for trading, housing, or more</p>
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-lg border border-border bg-card">
              <input
                type="text"
                placeholder="Workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
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
                      className={`flex items-center gap-3 p-3 rounded-md border text-left transition-all ${
                        selectedType === tmpl.type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
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
  )
}