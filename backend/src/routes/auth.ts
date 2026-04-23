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

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(400).json({ error: 'Email already in use' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashed }
    })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, userId: user.id })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
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

    res.json({ token, userId: user.id })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router