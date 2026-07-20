import { Router } from 'express'
import type { Response } from 'express'
import { getPool } from '../db/database.js'
import { requireAdmin } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

router.get('/institutions', async (_req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { rows } = await pool.query(`
    SELECT i.*, COUNT(p.id)::int as product_count
    FROM institutions i
    LEFT JOIN products p ON p.institution_id = i.id
    GROUP BY i.id
    ORDER BY i.name
  `)
  res.json(rows)
})

router.get('/institutions/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { rows: instRows } = await pool.query('SELECT * FROM institutions WHERE id = $1', [req.params.id])
  if (!instRows[0]) { res.status(404).json({ error: 'Not found' }); return }
  const { rows: products } = await pool.query('SELECT * FROM products WHERE institution_id = $1 ORDER BY type, name', [req.params.id])
  res.json({ ...instRows[0], products })
})

router.post('/institutions', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available, soft_pull_available, geographic_restrictions, application_url, path, last_verified_date } = req.body
  if (!name || !type || !path) {
    res.status(400).json({ error: 'name, type, and path are required' })
    return
  }
  const { rows } = await pool.query(`
    INSERT INTO institutions (name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available,
      soft_pull_available, geographic_restrictions, application_url, path, last_verified_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id
  `, [
    name, type,
    inquiry_reuse || 'Not Verified',
    inquiry_reuse_window || 'Not Found',
    preapproval_available || 'Not Verified',
    soft_pull_available || 'Not Verified',
    geographic_restrictions || 'Nationwide',
    application_url || null,
    path,
    last_verified_date || new Date().toISOString().split('T')[0],
  ])
  res.status(201).json({ id: rows[0].id })
})

router.put('/institutions/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const fields = ['name', 'type', 'inquiry_reuse', 'inquiry_reuse_window', 'preapproval_available', 'soft_pull_available', 'geographic_restrictions', 'application_url', 'path', 'last_verified_date']
  const updates = fields.filter(f => req.body[f] !== undefined)
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return }
  const sets = updates.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const values = [...updates.map(f => req.body[f] as unknown), req.params.id]
  await pool.query(`UPDATE institutions SET ${sets} WHERE id = $${updates.length + 1}`, values)
  res.json({ success: true })
})

router.delete('/institutions/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  await pool.query('DELETE FROM institutions WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

router.post('/institutions/:id/products', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { name, type, bureau_pulled, reports_to, inquiry_reuse_eligible, preapproval_available, minimum_credit_score, deposit_amount, annual_fee, graduation_potential, graduation_timeline, existing_customer_required, last_verified_date, strategy_notes } = req.body
  if (!name || !type) { res.status(400).json({ error: 'name and type are required' }); return }
  const { rows } = await pool.query(`
    INSERT INTO products (institution_id, name, type, bureau_pulled, reports_to, inquiry_reuse_eligible,
      preapproval_available, minimum_credit_score, deposit_amount, annual_fee, graduation_potential,
      graduation_timeline, existing_customer_required, last_verified_date, strategy_notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING id
  `, [
    req.params.id, name, type,
    bureau_pulled || 'Not Verified',
    reports_to || 'Not verified — contact institution to confirm',
    inquiry_reuse_eligible || 'Not Verified',
    preapproval_available || 'Not Found',
    minimum_credit_score || null,
    deposit_amount || 'N/A',
    annual_fee || 'None',
    graduation_potential || 'N/A',
    graduation_timeline || 'N/A',
    existing_customer_required || 'No',
    last_verified_date || new Date().toISOString().split('T')[0],
    strategy_notes || null,
  ])
  res.status(201).json({ id: rows[0].id })
})

router.put('/products/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const fields = ['name', 'type', 'bureau_pulled', 'reports_to', 'inquiry_reuse_eligible', 'preapproval_available', 'minimum_credit_score', 'deposit_amount', 'annual_fee', 'graduation_potential', 'graduation_timeline', 'existing_customer_required', 'last_verified_date', 'strategy_notes']
  const updates = fields.filter(f => req.body[f] !== undefined)
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return }
  const sets = updates.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const values = [...updates.map(f => req.body[f] as unknown), req.params.id]
  await pool.query(`UPDATE products SET ${sets} WHERE id = $${updates.length + 1}`, values)
  res.json({ success: true })
})

router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

router.get('/users', async (_req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { rows } = await pool.query('SELECT id, email, role, subscription_status, subscription_end_date, created_at FROM users ORDER BY created_at DESC')
  res.json(rows)
})

// ── Wins Wall moderation ─────────────────────────────────────────────────────
// Datapoint submissions land as 'pending'. Nothing shows on the wall until an
// admin flips it to 'approved'. This is the pre-moderation gate — the whole reason
// the Wins Wall carries zero live-chat legal exposure.
router.get('/submissions', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const status = req.query.status ? String(req.query.status) : null
  const { rows } = status
    ? await pool.query('SELECT * FROM submissions WHERE status = $1 ORDER BY id DESC', [status])
    : await pool.query('SELECT * FROM submissions ORDER BY id DESC')
  res.json(rows)
})

router.put('/submissions/:id', async (req: AuthRequest, res: Response) => {
  const status = String(req.body.status || '')
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'status must be pending, approved, or rejected' })
    return
  }
  const pool = getPool()
  await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', [status, req.params.id])
  res.json({ success: true })
})

router.delete('/submissions/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  await pool.query('DELETE FROM submissions WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

// ── Community chat moderation ────────────────────────────────────────────────
// Held messages (auto-flagged by the filter or by member reports) land here for
// a human. Approve → visible; Remove → hidden but kept; Delete → gone.
router.get('/messages', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const status = req.query.status ? String(req.query.status) : null
  const { rows } = status
    ? await pool.query('SELECT * FROM messages WHERE status = $1 ORDER BY id DESC LIMIT 500', [status])
    : await pool.query('SELECT * FROM messages ORDER BY id DESC LIMIT 500')
  res.json(rows)
})

router.put('/messages/:id', async (req: AuthRequest, res: Response) => {
  const status = String(req.body.status || '')
  if (!['visible', 'held', 'removed'].includes(status)) {
    res.status(400).json({ error: 'status must be visible, held, or removed' })
    return
  }
  const pool = getPool()
  await pool.query('UPDATE messages SET status = $1 WHERE id = $2', [status, req.params.id])
  res.json({ success: true })
})

router.delete('/messages/:id', async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

// The instrument panel: funnel counts (last 30 days) + member totals.
router.get('/metrics', async (_req: AuthRequest, res: Response) => {
  try {
    const pool = getPool()
    const { rows: funnel } = await pool.query(`
      SELECT event_type, COUNT(*)::int AS count FROM click_events
      WHERE created_at >= ${process.env.DATABASE_URL || process.env.POSTGRES_URL ? "NOW() - INTERVAL '30 days'" : "datetime('now', '-30 days')"}
      GROUP BY event_type ORDER BY count DESC
    `)
    const { rows: members } = await pool.query(`
      SELECT subscription_status, COUNT(*)::int AS count FROM users GROUP BY subscription_status
    `)
    res.json({ funnel, members })
  } catch (err) {
    console.error('Metrics error:', err)
    res.status(500).json({ error: 'Failed to load metrics' })
  }
})

export default router
