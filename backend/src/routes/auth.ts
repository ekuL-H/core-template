import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many attempts, please try again later' }
})

const router = Router()

// Register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return }
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { res.status(400).json({ error: 'Invalid email format' }); return }
    if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return }
    if (password.length > 128) { res.status(400).json({ error: 'Password too long' }); return }
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) {
      res.status(400).json({ error: 'Email already in use' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)

    const { name } = req.body
    const user = await prisma.user.create({
      data: { email: cleanEmail, password: hashed, name: name?.trim() || null }
    })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, userId: user.id, email: user.email, name: user.name })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return }
    const cleanEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(400).json({ error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.json({ token, userId: user.id, email: user.email, name: user.name })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorised' }); return }
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    
    res.json(user)
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Update profile
router.put('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorised' }); return }
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    
    const { name, email } = req.body
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email && { email }),
      },
      select: { id: true, email: true, name: true, createdAt: true }
    })
    
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Change password
router.put('/me/password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorised' }); return }
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' }); return
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' }); return
    }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return }
    
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } })
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// Delete account and all data
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorised' }); return }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    const userId = decoded.userId

    // Delete all workspace-scoped data for workspaces owned by user
    const ownedWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId, role: 'owner' },
      select: { workspaceId: true }
    })
    const ownedIds = ownedWorkspaces.map(w => w.workspaceId)

    for (const wsId of ownedIds) {
      await prisma.journalEntry.deleteMany({ where: { journal: { workspaceId: wsId } } })
      await prisma.journal.deleteMany({ where: { workspaceId: wsId } })
      await prisma.datasetItem.deleteMany({ where: { dataset: { workspaceId: wsId } } })
      await prisma.dataset.deleteMany({ where: { workspaceId: wsId } })
      await prisma.watchlistItem.deleteMany({ where: { watchlist: { workspaceId: wsId } } })
      await prisma.watchlist.deleteMany({ where: { workspaceId: wsId } })
      await prisma.brokerConnection.deleteMany({ where: { workspaceId: wsId } })
      await prisma.aiModel.deleteMany({ where: { workspaceId: wsId } })
      await prisma.workspaceUser.deleteMany({ where: { workspaceId: wsId } })
      await prisma.workspace.delete({ where: { id: wsId } })
    }

    // Remove from workspaces user doesn't own
    await prisma.workspaceUser.deleteMany({ where: { userId } })

    // Delete user-level data
    await prisma.activityLog.deleteMany({ where: { userId } })
    await prisma.setting.deleteMany({ where: { userId } })
    await prisma.profile.deleteMany({ where: { userId } })

    // Delete user
    await prisma.user.delete({ where: { id: userId } })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

export default router