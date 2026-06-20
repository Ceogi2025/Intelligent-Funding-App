import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { getPool } from '../db/database.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

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

  const pool = getPool()
  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  if (existing.length > 0) {
    res.status(409).json({ error: 'Account already exists with this email' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(`
    INSERT INTO users (email, password_hash, role, subscription_status)
    VALUES ($1, $2, 'customer', 'inactive')
    RETURNING id
  `, [email.toLowerCase(), hash])

  const user = { id: rows[0].id as number, email: email.toLowerCase(), role: 'customer' }
  const token = signToken(user)
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }

  const pool = getPool()
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
  const user = rows[0] as {
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
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, subscription_status: user.subscription_status } })
})

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { rows } = await pool.query(
    'SELECT id, email, role, subscription_status, subscription_end_date FROM users WHERE id = $1',
    [req.user!.id]
  )
  if (!rows[0]) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(rows[0])
})

export default router
