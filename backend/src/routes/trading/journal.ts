import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import prisma from '../../lib/prisma'

const router = Router()

const DEFAULT_COLUMNS = [
  { id: 'date', label: 'Date', type: 'date', width: 120 },
  { id: 'symbol', label: 'Symbol', type: 'text', width: 100 },
  { id: 'direction', label: 'Direction', type: 'select', options: ['Long', 'Short'], width: 80 },
  { id: 'entry', label: 'Entry', type: 'number', width: 100 },
  { id: 'exit', label: 'Exit', type: 'number', width: 100 },
  { id: 'lots', label: 'Lots', type: 'number', width: 70 },
  { id: 'pnl', label: 'P&L', type: 'number', width: 80 },
  { id: 'notes', label: 'Notes', type: 'text', width: 200 },
  { id: 'screenshots', label: 'Screenshots', type: 'screenshots', width: 150 },
]

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { userId: req.userId!, workspaceId: req.workspaceId! },
      include: { _count: { select: { entries: true } } },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(journals)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journals' })
  }
})

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const journal = await prisma.journal.findFirst({
      where: { id: req.params.id as string, userId: req.userId!, workspaceId: req.workspaceId! },
      include: { entries: { orderBy: { rowOrder: 'asc' } } }
    })
    if (!journal) { res.status(404).json({ error: 'Journal not found' }); return }
    res.json(journal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal' })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color } = req.body
    if (!name) { res.status(400).json({ error: 'Name is required' }); return }
    const journal = await prisma.journal.create({
      data: {
        userId: req.userId!, workspaceId: req.workspaceId!,
        name, description: description || null, color: color || '#3b82f6', columns: DEFAULT_COLUMNS
      }
    })
    res.json(journal)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create journal' })
  }
})

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, columns } = req.body
    await prisma.journal.updateMany({
      where: { id: req.params.id as string, userId: req.userId!, workspaceId: req.workspaceId! },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(color && { color }), ...(columns && { columns }) }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update journal' })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.journal.deleteMany({ where: { id: req.params.id as string, userId: req.userId!, workspaceId: req.workspaceId! } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete journal' })
  }
})

router.post('/:id/entries', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const journalId = req.params.id as string
    const { data } = req.body
    const journal = await prisma.journal.findFirst({ where: { id: journalId, userId: req.userId!, workspaceId: req.workspaceId! } })
    if (!journal) { res.status(404).json({ error: 'Journal not found' }); return }
    const lastEntry = await prisma.journalEntry.findFirst({ where: { journalId }, orderBy: { rowOrder: 'desc' } })
    const entry = await prisma.journalEntry.create({ data: { journalId, rowOrder: (lastEntry?.rowOrder ?? -1) + 1, data: data || {} } })
    await prisma.journal.update({ where: { id: journalId }, data: { updatedAt: new Date() } })
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add entry' })
  }
})

router.put('/:id/entries/:entryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data, rowOrder } = req.body
    const entry = await prisma.journalEntry.update({
      where: { id: req.params.entryId as string },
      data: { ...(data !== undefined && { data }), ...(rowOrder !== undefined && { rowOrder }), updatedAt: new Date() }
    })
    await prisma.journal.update({ where: { id: req.params.id as string }, data: { updatedAt: new Date() } })
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' })
  }
})

router.delete('/:id/entries/:entryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.journalEntry.delete({ where: { id: req.params.entryId as string } })
    await prisma.journal.update({ where: { id: req.params.id as string }, data: { updatedAt: new Date() } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' })
  }
})

router.post('/:id/columns', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { label, type, options, width } = req.body
    if (!label || !type) { res.status(400).json({ error: 'Label and type are required' }); return }
    const journal = await prisma.journal.findFirst({ where: { id: req.params.id as string, userId: req.userId!, workspaceId: req.workspaceId! } })
    if (!journal) { res.status(404).json({ error: 'Journal not found' }); return }
    const columns = journal.columns as any[]
    const newCol = { id: `col_${Date.now()}`, label, type, ...(options && { options }), width: width || 120 }
    columns.push(newCol)
    await prisma.journal.update({ where: { id: journal.id }, data: { columns } })
    res.json(newCol)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add column' })
  }
})

router.delete('/:id/columns/:colId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const journal = await prisma.journal.findFirst({ where: { id: req.params.id as string, userId: req.userId!, workspaceId: req.workspaceId! } })
    if (!journal) { res.status(404).json({ error: 'Journal not found' }); return }
    const columns = (journal.columns as any[]).filter(c => c.id !== req.params.colId)
    await prisma.journal.update({ where: { id: journal.id }, data: { columns } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove column' })
  }
})

export default router