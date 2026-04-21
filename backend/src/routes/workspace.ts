import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()

const WORKSPACE_TEMPLATES = [
  { type: 'trading', name: 'Trading Platform', description: 'Watchlists, charts, journal, AI analysis' },
  { type: 'housing', name: 'Housing Manager', description: 'Property management, tenants, maintenance' },
]

// Get all workspaces for user
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
    const workspaces = workspaceUsers.map(wu => ({
      ...wu.workspace,
      role: wu.role,
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
          create: {
            userId: req.userId!,
            role: 'owner'
          }
        }
      }
    })

    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace' })
  }
})

// Update workspace
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body

    // Verify user is owner/admin
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: req.params.id as string, userId: req.userId!, role: { in: ['owner', 'admin'] } }
    })
    if (!membership) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const workspace = await prisma.workspace.update({
      where: { id: req.params.id as string },
      data: { ...(name && { name }) }
    })
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workspace' })
  }
})

// Delete workspace
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const membership = await prisma.workspaceUser.findFirst({
      where: { workspaceId: req.params.id as string, userId: req.userId!, role: 'owner' }
    })
    if (!membership) {
      res.status(403).json({ error: 'Only owner can delete workspace' })
      return
    }

    // Delete membership first, then workspace
    await prisma.workspaceUser.deleteMany({ where: { workspaceId: req.params.id as string } })
    await prisma.workspace.delete({ where: { id: req.params.id as string } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workspace' })
  }
})

export default router