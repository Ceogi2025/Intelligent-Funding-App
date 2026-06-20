import { Router, Response } from 'express'
import { getDb } from '../db/database.js'
import { requireAdmin, AuthRequest } from '../middleware/auth.js'

const router = Router()

// All admin routes require admin role
router.use(requireAdmin)

// GET /api/admin/institutions
router.get('/institutions', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const institutions = db.prepare(`
    SELECT i.*, COUNT(p.id) as product_count
    FROM institutions i
    LEFT JOIN products p ON p.institution_id = i.id
    GROUP BY i.id
    ORDER BY i.name
  `).all()
  res.json(institutions)
})

// GET /api/admin/institutions/:id
router.get('/institutions/:id', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const institution = db.prepare('SELECT * FROM institutions WHERE id = ?').get(req.params.id)
  if (!institution) { res.status(404).json({ error: 'Not found' }); return }
  const products = db.prepare('SELECT * FROM products WHERE institution_id = ? ORDER BY type, name').all(req.params.id)
  res.json({ ...institution as object, products })
})

// POST /api/admin/institutions
router.post('/institutions', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const {
    name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available,
    soft_pull_available, geographic_restrictions, application_url, path, last_verified_date
  } = req.body

  if (!name || !type || !path) {
    res.status(400).json({ error: 'name, type, and path are required' })
    return
  }

  const result = db.prepare(`
    INSERT INTO institutions (name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available,
      soft_pull_available, geographic_restrictions, application_url, path, last_verified_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, type,
    inquiry_reuse || 'Not Verified',
    inquiry_reuse_window || 'Not Found',
    preapproval_available || 'Not Verified',
    soft_pull_available || 'Not Verified',
    geographic_restrictions || 'Nationwide',
    application_url || null,
    path,
    last_verified_date || new Date().toISOString().split('T')[0]
  )

  res.status(201).json({ id: result.lastInsertRowid })
})

// PUT /api/admin/institutions/:id
router.put('/institutions/:id', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const fields = [
    'name', 'type', 'inquiry_reuse', 'inquiry_reuse_window', 'preapproval_available',
    'soft_pull_available', 'geographic_restrictions', 'application_url', 'path', 'last_verified_date'
  ]
  const updates = fields.filter(f => req.body[f] !== undefined)
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return }

  const sets = updates.map(f => `${f} = ?`).join(', ')
  const values = updates.map(f => req.body[f])
  db.prepare(`UPDATE institutions SET ${sets} WHERE id = ?`).run(...values, req.params.id)
  res.json({ success: true })
})

// DELETE /api/admin/institutions/:id
router.delete('/institutions/:id', (req: AuthRequest, res: Response) => {
  const db = getDb()
  db.prepare('DELETE FROM institutions WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/admin/institutions/:id/products
router.post('/institutions/:id/products', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const {
    name, type, bureau_pulled, reports_to, inquiry_reuse_eligible, preapproval_available,
    minimum_credit_score, deposit_amount, annual_fee, graduation_potential,
    graduation_timeline, existing_customer_required, last_verified_date, strategy_notes
  } = req.body

  if (!name || !type) {
    res.status(400).json({ error: 'name and type are required' })
    return
  }

  const result = db.prepare(`
    INSERT INTO products (institution_id, name, type, bureau_pulled, reports_to, inquiry_reuse_eligible,
      preapproval_available, minimum_credit_score, deposit_amount, annual_fee, graduation_potential,
      graduation_timeline, existing_customer_required, last_verified_date, strategy_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    strategy_notes || null
  )

  res.status(201).json({ id: result.lastInsertRowid })
})

// PUT /api/admin/products/:id
router.put('/products/:id', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const fields = [
    'name', 'type', 'bureau_pulled', 'reports_to', 'inquiry_reuse_eligible', 'preapproval_available',
    'minimum_credit_score', 'deposit_amount', 'annual_fee', 'graduation_potential',
    'graduation_timeline', 'existing_customer_required', 'last_verified_date', 'strategy_notes'
  ]
  const updates = fields.filter(f => req.body[f] !== undefined)
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return }

  const sets = updates.map(f => `${f} = ?`).join(', ')
  const values = updates.map(f => req.body[f])
  db.prepare(`UPDATE products SET ${sets} WHERE id = ?`).run(...values, req.params.id)
  res.json({ success: true })
})

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req: AuthRequest, res: Response) => {
  const db = getDb()
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// GET /api/admin/users
router.get('/users', (req: AuthRequest, res: Response) => {
  const db = getDb()
  const users = db.prepare(`
    SELECT id, email, role, subscription_status, subscription_end_date, created_at
    FROM users ORDER BY created_at DESC
  `).all()
  res.json(users)
})

export default router
