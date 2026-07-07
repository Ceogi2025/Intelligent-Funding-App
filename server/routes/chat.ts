import { Router } from 'express'
import type { Response } from 'express'
import { getPool } from '../db/database.js'
import { requireAuth, requirePaid, isPaidMember } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()

const MAX_LEN = 800
const RATE_LIMIT = 8          // messages allowed per user...
const RATE_WINDOW_SEC = 60    // ...per this many seconds
const REPORT_THRESHOLD = 3    // auto-hold a message once this many members flag it

// The moderation filter — the automated front line behind the paywall.
// A match doesn't reject the post; it holds it for a human ('held' status) so a
// false positive is recoverable. Covers illegal tactics AND the "no selling" rule:
// knowledge-sharing is welcome, using the room as a sales floor is not.
const BLOCKLIST: string[] = [
  // illegal / fraud
  'cpn', 'credit privacy number', 'synthetic identity', 'synthetic profile',
  'tradeline for sale', 'sell tradelines', 'buy tradelines', 'authorized user for sale',
  'novelty ssn', 'fake ssn', 'ein method to hide',
  // solicitation / moving off-platform / selling
  'cash app', 'cashapp', 'venmo me', 'zelle me', 'hit my cashapp',
  'dm me', 'inbox me', 'pm me', 'hit my line', 'text me at', 'whatsapp me', 'telegram me',
  'my telegram', 'join my', 'guaranteed approval', 'guaranteed funding',
  'i can fix your credit', 'credit repair service', 'pay me', 'my cash app', 'my venmo',
]

function moderate(body: string): 'visible' | 'held' {
  const lower = body.toLowerCase()
  return BLOCKLIST.some(term => lower.includes(term)) ? 'held' : 'visible'
}

function handleFor(user: { id: number; email: string }): string {
  // Privacy-safe stable handle. A member-chosen display name is a later refinement.
  return `Member ${user.id}`
}

// ── READ ────────────────────────────────────────────────────────────────────
// Paid members + admin get real messages. Trial/inactive users get a server-side
// blurred teaser: bubble shapes only, never the text — so it can't be un-blurred
// from the network tab.
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool()
    const paid = await isPaidMember(req.user)

    if (!paid) {
      const { rows } = await pool.query(
        `SELECT length(body) as len FROM messages WHERE status = 'visible' ORDER BY id DESC LIMIT 14`
      )
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int as count FROM messages WHERE status = 'visible'`
      )
      res.json({
        locked: true,
        activeCount: Number(countRows[0]?.count || 0),
        bubbles: rows.map(r => ({ len: Number(r.len) || 20 })).reverse(),
      })
      return
    }

    const since = parseInt(String(req.query.since || '0')) || 0
    const { rows } = await pool.query(
      `SELECT id, display_name, body, created_at
       FROM messages
       WHERE status = 'visible' AND id > $1
       ORDER BY id ASC
       LIMIT 300`,
      [since]
    )
    res.json({ locked: false, messages: rows })
  } catch (err) {
    console.error('Chat read error:', err)
    res.status(500).json({ error: 'Failed to load the room' })
  }
})

// ── POST ────────────────────────────────────────────────────────────────────
// Paid-only. Rate-limited. Keyword-filtered (held, not dropped).
router.post('/', requirePaid, async (req: AuthRequest, res: Response) => {
  const user = req.user
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const body = String(req.body?.body || '').trim()
  if (body.length < 1) { res.status(400).json({ error: 'Say something first.' }); return }
  if (body.length > MAX_LEN) { res.status(400).json({ error: `Keep it under ${MAX_LEN} characters.` }); return }

  try {
    const pool = getPool()

    // Rate limit — count this user's recent messages.
    const { rows: recent } = await pool.query(
      `SELECT COUNT(*)::int as count FROM messages
       WHERE user_id = $1 AND created_at > $2`,
      [user.id, new Date(Date.now() - RATE_WINDOW_SEC * 1000).toISOString()]
    )
    if (Number(recent[0]?.count || 0) >= RATE_LIMIT) {
      res.status(429).json({ error: 'Slow down a moment before posting again.' })
      return
    }

    const status = moderate(body)
    const { rows } = await pool.query(
      `INSERT INTO messages (user_id, display_name, body, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, handleFor(user), body, status]
    )

    if (status === 'held') {
      res.json({ ok: true, held: true, message: 'Your post is being reviewed by a moderator before it goes live.' })
      return
    }
    res.json({ ok: true, held: false, id: rows[0]?.id })
  } catch (err) {
    console.error('Chat post error:', err)
    res.status(500).json({ error: 'Message failed to send — try again.' })
  }
})

// ── REPORT ──────────────────────────────────────────────────────────────────
// Any member can flag. Enough flags auto-holds the message for admin review.
router.post('/:id/report', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) { res.status(400).json({ error: 'Bad message id' }); return }
  try {
    const pool = getPool()
    await pool.query('UPDATE messages SET flagged_count = flagged_count + 1 WHERE id = $1', [id])
    await pool.query(
      `UPDATE messages SET status = 'held' WHERE id = $1 AND flagged_count >= $2 AND status = 'visible'`,
      [id, REPORT_THRESHOLD]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('Chat report error:', err)
    res.status(500).json({ error: 'Report failed — try again.' })
  }
})

export default router
