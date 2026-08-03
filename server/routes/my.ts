import { Router } from 'express'
import type { Response } from 'express'
import { getPool } from '../db/database.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

// My Funding Map: the member's personal application/account ledger.
// Powers Total Access Unlocked, the 0% Runway, the Velocity Clock, and the
// CLI Calendar. Members only ever see and touch their OWN rows.

const router = Router()

const PTYPES = new Set(['card', 'line', 'loan'])
const OUTCOMES = new Set(['approved', 'denied', 'pending'])

function cleanRow(body: Record<string, unknown>) {
  const institution = String(body.institution || '').trim().slice(0, 120)
  const product = String(body.product || '').trim().slice(0, 120)
  const ptype = PTYPES.has(String(body.ptype)) ? String(body.ptype) : 'card'
  const bureau = String(body.bureau || '').trim().slice(0, 40)
  const applied_date = String(body.applied_date || '').trim().slice(0, 10)
  const outcome = OUTCOMES.has(String(body.outcome)) ? String(body.outcome) : 'approved'
  const limit_amount = Number.isFinite(Number(body.limit_amount)) ? Math.max(0, Math.round(Number(body.limit_amount))) : 0
  const promo_end = String(body.promo_end || '').trim().slice(0, 10)
  const notes = String(body.notes || '').trim().slice(0, 500)
  return { institution, product, ptype, bureau, applied_date, outcome, limit_amount, promo_end, notes }
}

router.get('/accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT * FROM member_accounts WHERE user_id = $1 ORDER BY applied_date DESC, id DESC',
      [req.user!.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('My accounts load error:', err)
    res.status(500).json({ error: 'Failed to load your accounts' })
  }
})

router.post('/accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  const r = cleanRow(req.body || {})
  if (!r.institution) { res.status(400).json({ error: 'Institution is required' }); return }
  try {
    const pool = getPool()
    const { rows } = await pool.query(`
      INSERT INTO member_accounts (user_id, institution, product, ptype, bureau, applied_date, outcome, limit_amount, promo_end, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
    `, [req.user!.id, r.institution, r.product, r.ptype, r.bureau, r.applied_date, r.outcome, r.limit_amount, r.promo_end, r.notes])
    res.json({ id: rows[0].id })
  } catch (err) {
    console.error('My accounts create error:', err)
    res.status(500).json({ error: 'Failed to save' })
  }
})

router.patch('/accounts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) { res.status(400).json({ error: 'Bad id' }); return }
  const r = cleanRow(req.body || {})
  if (!r.institution) { res.status(400).json({ error: 'Institution is required' }); return }
  try {
    const pool = getPool()
    await pool.query(`
      UPDATE member_accounts SET institution=$1, product=$2, ptype=$3, bureau=$4, applied_date=$5,
        outcome=$6, limit_amount=$7, promo_end=$8, notes=$9
      WHERE id=$10 AND user_id=$11
    `, [r.institution, r.product, r.ptype, r.bureau, r.applied_date, r.outcome, r.limit_amount, r.promo_end, r.notes, id, req.user!.id])
    res.json({ success: true })
  } catch (err) {
    console.error('My accounts update error:', err)
    res.status(500).json({ error: 'Failed to update' })
  }
})

router.delete('/accounts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) { res.status(400).json({ error: 'Bad id' }); return }
  try {
    const pool = getPool()
    await pool.query('DELETE FROM member_accounts WHERE id = $1 AND user_id = $2', [id, req.user!.id])
    res.json({ success: true })
  } catch (err) {
    console.error('My accounts delete error:', err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

export default router
