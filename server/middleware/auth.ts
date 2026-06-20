import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../db/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'if-dev-secret-change-in-production'

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  })
}

export function requireSubscription(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user) return
    // Admin always passes
    if (req.user.role === 'admin') { next(); return }

    const db = getDb()
    const user = db.prepare('SELECT subscription_status, subscription_end_date FROM users WHERE id = ?').get(req.user.id) as {
      subscription_status: string
      subscription_end_date: string | null
    } | undefined

    if (!user || user.subscription_status === 'inactive') {
      res.status(402).json({ error: 'Subscription required' })
      return
    }

    if (user.subscription_status === 'trial' && user.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date)
      if (new Date() > endDate) {
        res.status(402).json({ error: 'Trial expired' })
        return
      }
    }

    next()
  })
}

export function signToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}
