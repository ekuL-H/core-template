import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import prisma from '../../lib/prisma'

const router = Router()

// Get all broker connections for the logged in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const connections = await prisma.brokerConnection.findMany({
      where: { userId: req.userId }
    })
    res.json(connections)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Create a new broker connection
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { brokerName, accountNumber, config } = req.body

    const connection = await prisma.brokerConnection.create({
      data: {
        userId: req.userId as string,
        brokerName,
        accountNumber: accountNumber || null,
        status: 'disconnected',
        config: config || {}
      }
    })
    res.status(201).json(connection)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Update a broker connection
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { brokerName, accountNumber, status, config } = req.body

    const connection = await prisma.brokerConnection.findFirst({
      where: { id, userId: req.userId as string }
    })
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' })
      return
    }

    const updated = await prisma.brokerConnection.update({
      where: { id },
      data: {
        ...(brokerName && { brokerName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(status && { status }),
        ...(config && { config })
      }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete a broker connection
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    const connection = await prisma.brokerConnection.findFirst({
      where: { id, userId: req.userId as string }
    })
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' })
      return
    }

    await prisma.brokerConnection.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get symbol mappings for a broker source
router.get('/symbols/:source', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const source = req.params.source as string

    const mappings = await prisma.symbolMapping.findMany({
      where: { source },
      include: { symbol: true }
    })
    res.json(mappings)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router