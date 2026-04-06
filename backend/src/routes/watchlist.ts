import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()

// Get all watchlists for the logged in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: req.userId },
      include: {
        items: {
          include: {
            symbol: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    })
    res.json(watchlists)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Create a new watchlist
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body
    const watchlist = await prisma.watchlist.create({
      data: { name, color, userId: req.userId as string }
    })
    res.status(201).json(watchlist)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Add a symbol to a watchlist
router.post('/:watchlistId/symbols', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const watchlistId = req.params.watchlistId as string
    const { symbolId } = req.body

    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId: req.userId as string }
    })

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' })
      return
    }

    const lastItem = await prisma.watchlistItem.findFirst({
      where: { watchlistId },
      orderBy: { displayOrder: 'desc' }
    })

    const displayOrder = lastItem ? lastItem.displayOrder + 1 : 0

    const item = await prisma.watchlistItem.create({
      data: { watchlistId, symbolId, displayOrder },
      include: { symbol: true }
    })

    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Remove a symbol from a watchlist
router.delete('/:watchlistId/symbols/:symbolId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const watchlistId = req.params.watchlistId as string
    const symbolId = req.params.symbolId as string

    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId: req.userId as string }
    })

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' })
      return
    }

    await prisma.watchlistItem.deleteMany({
      where: { watchlistId, symbolId }
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Update a watchlist (name, color)
router.put('/:watchlistId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const watchlistId = req.params.watchlistId as string
    const { name, color } = req.body

    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId: req.userId as string }
    })
    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' })
      return
    }

    const updated = await prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        ...(name && { name }),
        ...(color && { color })
      }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete a watchlist
router.delete('/:watchlistId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const watchlistId = req.params.watchlistId as string

    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId: req.userId as string }
    })
    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' })
      return
    }

    await prisma.watchlistItem.deleteMany({ where: { watchlistId } })
    await prisma.watchlist.delete({ where: { id: watchlistId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all available symbols
router.get('/symbols', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const symbols = await prisma.symbol.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(symbols)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router