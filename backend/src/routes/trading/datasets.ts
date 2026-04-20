import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import prisma from '../../lib/prisma'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// Setup file uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'datasets')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const datasetId = req.params.id as string
    const dir = path.join(UPLOAD_DIR, datasetId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  }
})

// Get all datasets for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const datasets = await prisma.dataset.findMany({
      where: { userId: req.userId! },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(datasets)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch datasets' })
  }
})

// Get single dataset with items
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const dataset = await prisma.dataset.findFirst({
      where: { id: req.params.id as string, userId: req.userId! },
      include: {
        items: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' })
      return
    }
    res.json(dataset)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset' })
  }
})

// Create dataset
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type, color } = req.body
    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    const dataset = await prisma.dataset.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        type: type || 'images',
        color: color || '#06b6d4'
      }
    })
    res.json(dataset)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create dataset' })
  }
})

// Update dataset
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type, color } = req.body
    const dataset = await prisma.dataset.updateMany({
      where: { id: req.params.id as string, userId: req.userId! },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(color && { color })
      }
    })
    res.json(dataset)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dataset' })
  }
})

// Delete dataset and all items
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    // Delete files from disk
    const dir = path.join(UPLOAD_DIR, id)
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true })
    }

    await prisma.dataset.deleteMany({
      where: { id, userId: req.userId! }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete dataset' })
  }
})

// Upload items to dataset
router.post('/:id/items', authenticate, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    const datasetId = req.params.id as string
    const files = req.files as Express.Multer.File[]
    const { label, tags } = req.body

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' })
      return
    }

    // Verify dataset belongs to user
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: req.userId! }
    })
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' })
      return
    }

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []

    const items = await Promise.all(files.map(file =>
      prisma.datasetItem.create({
        data: {
          datasetId,
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          label: label || null,
          tags: parsedTags
        }
      })
    ))

    // Update dataset timestamp
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { updatedAt: new Date() }
    })

    res.json(items)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

// Update item (label, tags, notes)
router.put('/:id/items/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { label, tags, notes } = req.body
    const item = await prisma.datasetItem.update({
      where: { id: req.params.itemId as string },
      data: {
        ...(label !== undefined && { label }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes })
      }
    })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// Delete item
router.delete('/:id/items/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.datasetItem.findUnique({
      where: { id: req.params.itemId as string }
    })

    if (item && fs.existsSync(item.filePath)) {
      fs.unlinkSync(item.filePath)
    }

    await prisma.datasetItem.delete({
      where: { id: req.params.itemId as string }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// Serve uploaded files
router.get('/:id/items/:itemId/file', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.datasetItem.findUnique({
      where: { id: req.params.itemId as string }
    })

    if (!item || !fs.existsSync(item.filePath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    res.sendFile(item.filePath)
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve file' })
  }
})

export default router