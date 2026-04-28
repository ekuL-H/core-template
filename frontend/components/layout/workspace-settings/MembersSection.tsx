'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'
import { Users, Copy, Plus, Trash2, Check, Loader2, ChevronDown } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Member {
  id: string
  userId: string
  role: string
  name: string
  email: string
  joinedAt: string
}

interface Invite {
  id: string
  code: string
  role: string
  maxUses: number
  uses: number
  expiresAt: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export default function MembersSection() {
  const { workspace } = useWorkspace()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteMaxUses, setInviteMaxUses] = useState(1)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [roleMenu, setRoleMenu] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null)

  useEffect(() => {
    if (workspace) fetchData()
  }, [workspace])

  const fetchData = async () => {
    if (!workspace) return
    try {
      const [m, i] = await Promise.all([
        coreApi.getMembers(workspace.id),
        coreApi.getInvites(workspace.id).catch(() => []),
      ])
      setMembers(m)
      setInvites(i)
    } catch (err) {
      console.error('Failed to fetch members', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async () => {
    if (!workspace) return
    setCreating(true)
    try {
      await coreApi.createInvite(workspace.id, { role: inviteRole, maxUses: inviteMaxUses })
      await fetchData()
      setShowInvite(false)
    } catch (err) {
      console.error('Failed to create invite', err)
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!workspace) return
    try {
      await coreApi.deleteInvite(workspace.id, inviteId)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch (err) {
      console.error('Failed to delete invite', err)
    }
  }

  const handleChangeRole = async (memberId: string, role: string) => {
    if (!workspace) return
    try {
      await coreApi.updateMemberRole(workspace.id, memberId, role)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
      setRoleMenu(null)
    } catch (err) {
      console.error('Failed to change role', err)
    }
  }

  const handleRemoveMember = async () => {
    if (!workspace || !confirmRemove) return
    try {
      await coreApi.removeMember(workspace.id, confirmRemove.id)
      setMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
      setConfirmRemove(null)
    } catch (err) {
      console.error('Failed to remove member', err)
    }
  }

  const currentUserMember = members.find(m => m.userId === workspace?.id)
  const isOwnerOrAdmin = members.some(m => m.email && ['owner', 'admin'].includes(m.role))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Invite
        </button>
      </div>

      {/* Create invite */}
      {showInvite && (
        <div className="p-4 rounded-lg border border-border bg-card mb-4">
          <p className="text-xs font-medium text-foreground mb-3">Create Invite Link</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground mb-1 block">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Max uses</label>
              <select
                value={inviteMaxUses}
                onChange={(e) => setInviteMaxUses(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value={1}>1 use</option>
                <option value={5}>5 uses</option>
                <option value={10}>10 uses</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
            <button
              onClick={handleCreateInvite}
              disabled={creating}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Active invites */}
      {invites.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground mb-2">Active Invites</p>
          <div className="space-y-2">
            {invites.map(invite => {
              const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date()
              const maxed = invite.maxUses > 0 && invite.uses >= invite.maxUses
              const inactive = expired || maxed
              return (
                <div key={invite.id} className={`flex items-center justify-between p-3 rounded-md border border-border ${inactive ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-[11px] font-mono text-muted-foreground truncate max-w-[180px]">{invite.code}</code>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-foreground">{ROLE_LABELS[invite.role]}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {invite.uses}/{invite.maxUses === 0 ? '∞' : invite.maxUses} used
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode(invite.code)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Copy code"
                    >
                      {copied === invite.code ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete invite"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Member list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        <div className="space-y-1">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-md border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground">
                    {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-foreground">{member.name || member.email}</p>
                  <p className="text-[11px] text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'owner' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-accent text-foreground font-medium">Owner</span>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setRoleMenu(roleMenu === member.id ? null : member.id)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {ROLE_LABELS[member.role]}
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {roleMenu === member.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setRoleMenu(null)} />
                        <div className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[100px]">
                          {['admin', 'member', 'viewer'].map(r => (
                            <button
                              key={r}
                              onClick={() => handleChangeRole(member.id, r)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                                member.role === r ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}
                            >
                              {ROLE_LABELS[r]}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {member.role !== 'owner' && (
                  <button
                    onClick={() => setConfirmRemove(member)}
                    className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${confirmRemove.name || confirmRemove.email} from this workspace? They will lose access to all workspace data.`}
          confirmLabel="Remove"
          confirmDestructive={true}
          onConfirm={handleRemoveMember}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}