import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { logActivity } from '../lib/audit'

const router = Router()

const WORKSPACE_TEMPLATES = [
  { type: 'trading', name: 'Trading Platform', description: 'Watchlists, charts, journal, AI analysis' },
  { type: 'property', name: 'Property Manager', description: 'Property management, tenants, maintenance' },
  { type: 'business', name: 'Business Manager', description: 'Clients, jobs, invoicing, team scheduling' },
]

// Get all workspaces for user (excludes deleted, includes archived)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workspaceUsers = await prisma.workspaceUser.findMany({
      where: { userId: req.userId! },
      include: {
        workspace: {
          include: { _count: { select: { users: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    const workspaces = workspaceUsers
      .filter(wu => wu.workspace.status !== 'deleted')
      .map(wu => ({
        ...wu.workspace,
        role: wu.role,
        isFavourite: wu.isFavourite,
        memberCount: wu.workspace._count.users
      }))
    res.json(workspaces)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspaces' })
  }
})

// Get workspace templates
router.get('/templates', authenticate, async (req: AuthRequest, res: Response) => {
  res.json(WORKSPACE_TEMPLATES)
})

// Create workspace
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type } = req.body
    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' })
      return
    }
    const workspace = await prisma.workspace.create({
      data: {
        name,
        type,
        users: {
          create: { userId: req.userId!, role: 'owner' }
        }
      }
    })
    await logActivity(req.userId!, 'workspace.create', `Created workspace: ${workspace.name}`, workspace.id)
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace' })
  }
})

// Update workspace
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: req.params.id as string, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    const workspace = await prisma.workspace.update({
      where: { id: req.params.id as string },
      data: { ...(name && { name }) }
    })
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workspace' })
  }
})

// Archive workspace (soft delete — recoverable for 30 days)
router.post('/:id/archive', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: 'owner' }
    })
    if (!membership) { res.status(403).json({ error: 'Only owner can archive workspace' }); return }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date() }
    })
    await logActivity(req.userId!, 'workspace.archive', 'Archived workspace', id)
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive workspace' })
  }
})

// Restore archived workspace
router.post('/:id/restore', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: 'owner' }
    })
    if (!membership) { res.status(403).json({ error: 'Only owner can restore workspace' }); return }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { status: 'active', archivedAt: null }
    })
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore workspace' })
  }
})

// Permanently delete workspace and all data
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: 'owner' }
    })
    if (!membership) { res.status(403).json({ error: 'Only owner can delete workspace' }); return }

    await logActivity(req.userId!, 'workspace.delete', 'Permanently deleted workspace', id)

    // Delete all workspace-scoped data
    await prisma.journalEntry.deleteMany({
      where: { journal: { workspaceId: id } }
    })
    await prisma.journal.deleteMany({ where: { workspaceId: id } })

    await prisma.datasetItem.deleteMany({
      where: { dataset: { workspaceId: id } }
    })
    await prisma.dataset.deleteMany({ where: { workspaceId: id } })

    await prisma.watchlistItem.deleteMany({
      where: { watchlist: { workspaceId: id } }
    })
    await prisma.watchlist.deleteMany({ where: { workspaceId: id } })

    await prisma.brokerConnection.deleteMany({ where: { workspaceId: id } })
    await prisma.aiModel.deleteMany({ where: { workspaceId: id } })
    await prisma.workspaceUser.deleteMany({ where: { workspaceId: id } })
    await prisma.workspace.delete({ where: { id } })

    res.json({ success: true })
  } catch (err) {
    console.error('Workspace delete error:', err)
    res.status(500).json({ error: 'Failed to delete workspace' })
  }
})

// Toggle favourite
router.post('/:id/favourite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId! }
    })
    if (!membership) { res.status(404).json({ error: 'Workspace not found' }); return }

    const updated = await prisma.workspaceUser.update({
      where: { id: membership.id },
      data: { isFavourite: !membership.isFavourite }
    })
    res.json({ isFavourite: updated.isFavourite })
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favourite' })
  }
})

// Track workspace open
router.post('/:id/open', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId! }
    })
    if (!membership) { res.status(404).json({ error: 'Workspace not found' }); return }

    await prisma.workspace.update({
      where: { id },
      data: { lastOpenedAt: new Date() }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to track open' })
  }
})

// Get workspace members
router.get('/:id/members', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId! }
    })
    if (!membership) { res.status(404).json({ error: 'Workspace not found' }); return }

    const members = await prisma.workspaceUser.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'asc' }
    })
    res.json(members.map(m => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.createdAt,
    })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// Update member role
router.put('/:id/members/:memberId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string }
    const { role } = req.body
    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' }); return
    }

    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    const target = await prisma.workspaceUser.findFirst({
      where: { id: memberId, workspaceId: id }
    })
    if (!target) { res.status(404).json({ error: 'Member not found' }); return }
    if (target.role === 'owner') { res.status(403).json({ error: 'Cannot change owner role' }); return }

    const updated = await prisma.workspaceUser.update({
      where: { id: memberId },
      data: { role }
    })
    res.json({ id: updated.id, role: updated.role })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// Remove member
router.delete('/:id/members/:memberId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string }

    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    const target = await prisma.workspaceUser.findFirst({
      where: { id: memberId, workspaceId: id }
    })
    if (!target) { res.status(404).json({ error: 'Member not found' }); return }
    if (target.role === 'owner') { res.status(403).json({ error: 'Cannot remove owner' }); return }

    await prisma.workspaceUser.delete({ where: { id: memberId } })
    await logActivity(req.userId!, 'workspace.member.remove', `Removed member from workspace`, id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' })
  }
})

// Create invite
router.post('/:id/invites', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { role = 'member', maxUses = 1, expiresInDays = 7 } = req.body

    if (!['admin', 'member', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' }); return
    }

    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    const { randomBytes } = await import('crypto')
    const code = randomBytes(16).toString('hex')

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        code,
        role,
        maxUses,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        createdBy: req.userId!,
      }
    })
    await logActivity(req.userId!, 'workspace.invite.create', `Created invite (${role})`, id)
    res.json(invite)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invite' })
  }
})

// List invites
router.get('/:id/invites', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(invites)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invites' })
  }
})

// Delete invite
router.delete('/:id/invites/:inviteId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, inviteId } = req.params as { id: string; inviteId: string }

    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: id, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) { res.status(403).json({ error: 'Not authorized' }); return }

    await prisma.workspaceInvite.delete({ where: { id: inviteId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invite' })
  }
})

// Join workspace via invite code
router.post('/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body
    if (!code) { res.status(400).json({ error: 'Invite code is required' }); return }

    const invite = await prisma.workspaceInvite.findUnique({ where: { code } })
    if (!invite) { res.status(404).json({ error: 'Invalid invite code' }); return }
    if (invite.expiresAt && invite.expiresAt < new Date()) { res.status(410).json({ error: 'Invite has expired' }); return }
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) { res.status(410).json({ error: 'Invite has reached max uses' }); return }

    const existing = await prisma.workspaceUser.findFirst({
      where: { workspaceId: invite.workspaceId, userId: req.userId! }
    })
    if (existing) { res.status(409).json({ error: 'Already a member of this workspace' }); return }

    await prisma.workspaceUser.create({
      data: { workspaceId: invite.workspaceId, userId: req.userId!, role: invite.role }
    })
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } }
    })

    const workspace = await prisma.workspace.findUnique({ where: { id: invite.workspaceId } })
    await logActivity(req.userId!, 'workspace.join', `Joined workspace via invite`, invite.workspaceId)
    res.json({ workspace })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join workspace' })
  }
})

export default router