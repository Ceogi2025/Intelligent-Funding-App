import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/database.js'
import { signToken, requireAuth, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) {
    res.status(409).json({ error: 'Account already exists with this email' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare(`
    INSERT INTO users (email, password_hash, role, subscription_status)
    VALUES (?, ?, 'customer', 'inactive')
  `).run(email.toLowerCase(), hash)

  const user = { id: result.lastInsertRowid as number, email: email.toLowerCase(), role: 'customer' }
  const token = signToken(user)
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as {
    id: number; email: string; password_hash: string; role: string
    subscription_status: string; subscription_end_date: string | null
  } | undefined

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      subscription_status: user.subscription_status,
    },
  })
})

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb()
  const user = db.prepare('SELECT id, email, role, subscription_status, subscription_end_date FROM users WHERE id = ?').get(req.user!.id) as {
    id: number; email: string; role: string; subscription_status: string; subscription_end_date: string | null
  } | undefined

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(user)
})

export default router
