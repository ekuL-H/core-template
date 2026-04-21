import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import prisma from '../../lib/prisma'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const connections = await prisma.brokerConnection.findMany({
      where: { userId: req.userId, workspaceId: req.workspaceId }
    })
    res.json(connections)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { brokerName, accountNumber, config } = req.body
    const connection = await prisma.brokerConnection.create({
      data: {
        userId: req.userId as string, workspaceId: req.workspaceId as string,
        brokerName, accountNumber: accountNumber || null, status: 'disconnected', config: config || {}
      }
    })
    res.status(201).json(connection)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { brokerName, accountNumber, status, config } = req.body
    const connection = await prisma.brokerConnection.findFirst({
      where: { id, userId: req.userId as string, workspaceId: req.workspaceId }
    })
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return }
    const updated = await prisma.brokerConnection.update({
      where: { id },
      data: { ...(brokerName && { brokerName }), ...(accountNumber !== undefined && { accountNumber }), ...(status && { status }), ...(config && { config }) }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const connection = await prisma.brokerConnection.findFirst({
      where: { id, userId: req.userId as string, workspaceId: req.workspaceId }
    })
    if (!connection) { res.status(404).json({ error: 'Connection not found' }); return }
    await prisma.brokerConnection.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/symbols/:source', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const mappings = await prisma.symbolMapping.findMany({
      where: { source: req.params.source as string },
      include: { symbol: true }
    })
    res.json(mappings)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router