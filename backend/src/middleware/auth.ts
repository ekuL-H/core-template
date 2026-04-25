import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
  workspaceId?: string
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorised' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; tokenVersion?: number }
    
    // Check token version hasn't been invalidated
    if (decoded.tokenVersion !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tokenVersion: true } })
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        res.status(401).json({ error: 'Token expired' })
        return
      }
    }
    
    req.userId = decoded.userId
    req.workspaceId = req.headers['x-workspace-id'] as string | undefined
    
    // If workspaceId provided, verify user belongs to it
    if (req.workspaceId) {
      const membership = await prisma.workspaceUser.findFirst({
        where: { userId: decoded.userId, workspaceId: req.workspaceId }
      })
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this workspace' })
        return
      }
    }
    
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}