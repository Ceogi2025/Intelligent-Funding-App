import { Router } from 'express'
import type { Request, Response } from 'express'
import { getPool } from '../db/database.js'
import { requireSubscription } from '../middleware/auth.js'

const router = Router()

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Free layer ONLY. The strategy data (inquiry reuse, windows, preapproval,
// product details, strategy notes) never leaves this endpoint — that's the paid product.
type PublicInstitution = {
  id: number
  slug: string
  name: string
  type: string
  path: string
  geographic_restrictions: string
  last_verified_date: string
  bureaus: string[]
  product_count: number
}

async function loadPublicInstitutions(): Promise<PublicInstitution[]> {
  const pool = getPool()
  const { rows: institutions } = await pool.query(
    'SELECT id, name, type, path, geographic_restrictions, last_verified_date FROM institutions ORDER BY name'
  )
  const { rows: products } = await pool.query(
    'SELECT institution_id, bureau_pulled FROM products'
  )
  return institutions.map(i => {
    const mine = products.filter(p => p.institution_id === i.id)
    const bureaus = [...new Set(mine.map(p => String(p.bureau_pulled)).filter(b => b && b !== 'Not Verified'))]
    return {
      id: Number(i.id),
      slug: slugify(String(i.name)),
      name: String(i.name),
      type: String(i.type),
      path: String(i.path),
      geographic_restrictions: String(i.geographic_restrictions),
      last_verified_date: String(i.last_verified_date),
      bureaus,
      product_count: mine.length,
    }
  })
}

router.get('/public/institutions', async (_req: Request, res: Response) => {
  try {
    res.json(await loadPublicInstitutions())
  } catch (err) {
    console.error('Public institutions error:', err)
    res.status(500).json({ error: 'Failed to load institutions' })
  }
})

router.get('/public/institutions/:slug', async (req: Request, res: Response) => {
  try {
    const all = await loadPublicInstitutions()
    const inst = all.find(i => i.slug === req.params.slug)
    if (!inst) { res.status(404).json({ error: 'Institution not found' }); return }
    res.json(inst)
  } catch (err) {
    console.error('Public institution error:', err)
    res.status(500).json({ error: 'Failed to load institution' })
  }
})

// Combined live stats (consumer + business) for the public marketing surfaces.
// Counts only, no strategy data leaks here.
router.get('/public/stats', async (_req: Request, res: Response) => {
  try {
    const pool = getPool()
    const [ci, cp, bi, bp] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as c FROM institutions'),
      pool.query('SELECT COUNT(*)::int as c FROM products'),
      pool.query('SELECT COUNT(*)::int as c FROM business_institutions'),
      pool.query('SELECT COUNT(*)::int as c FROM business_products'),
    ])
    res.json({
      inst: Number(ci.rows[0].c) + Number(bi.rows[0].c),
      prod: Number(cp.rows[0].c) + Number(bp.rows[0].c),
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

// Lead capture (cheat sheet email gate). Duplicate emails succeed silently.
router.post('/public/leads', async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const source = String(req.body?.source || 'cheat-sheet').slice(0, 50)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email' })
    return
  }
  try {
    const pool = getPool()
    const { rows } = await pool.query('SELECT id FROM leads WHERE email = $1', [email])
    if (rows.length === 0) {
      await pool.query('INSERT INTO leads (email, source) VALUES ($1, $2)', [email, source])
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Lead capture error:', err)
    res.status(500).json({ error: 'Something went wrong — try again' })
  }
})

// Community datapoint submissions → pending queue. NEVER touches live data directly.
router.post('/public/submissions', async (req: Request, res: Response) => {
  const b = req.body || {}
  const institution = String(b.institution_name || '').trim().slice(0, 120)
  if (institution.length < 2) {
    res.status(400).json({ error: 'Institution name is required' })
    return
  }
  const clean = (v: unknown, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null)
  try {
    const pool = getPool()
    await pool.query(`
      INSERT INTO submissions (institution_name, product_name, bureau_pulled, approved,
        credit_score_band, credit_limit, state, inquiry_reuse_observed, notes, email)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [
      institution,
      clean(b.product_name),
      clean(b.bureau_pulled, 30),
      clean(b.approved, 10),
      clean(b.credit_score_band, 20),
      clean(b.credit_limit, 30),
      clean(b.state, 30),
      clean(b.inquiry_reuse_observed, 10),
      clean(b.notes, 1000),
      clean(b.email),
    ])
    res.json({ ok: true })
  } catch (err) {
    console.error('Submission error:', err)
    res.status(500).json({ error: 'Something went wrong — try again' })
  }
})

// The Wins Wall — approved community approval reports, PII stripped (never returns email).
// Public + trial visible: this is the community-proof surface that converts trial → paid.
router.get('/wins', async (_req: Request, res: Response) => {
  try {
    const pool = getPool()
    const { rows } = await pool.query(`
      SELECT id, institution_name, product_name, bureau_pulled, credit_score_band,
        credit_limit, state, inquiry_reuse_observed, notes, created_at
      FROM submissions
      WHERE status = 'approved'
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `)
    res.json(rows)
  } catch (err) {
    console.error('Wins load error:', err)
    res.status(500).json({ error: 'Failed to load wins' })
  }
})

// Business funding lenders (the third path). Verified, load-all: TIB and PG are
// filter fields the front end sorts on, never exclusions.
router.get('/business-lenders', requireSubscription, async (_req: Request, res: Response) => {
  try {
    const pool = getPool()
    const { rows: institutions } = await pool.query('SELECT * FROM business_institutions ORDER BY name')
    const { rows: products } = await pool.query('SELECT * FROM business_products ORDER BY institution_id, id')
    res.json(institutions.map(i => ({
      ...i,
      products: products.filter(p => p.institution_id === i.id),
    })))
  } catch (err) {
    console.error('Business lenders load error:', err)
    res.status(500).json({ error: 'Failed to load business lenders' })
  }
})

// Apply-click redirect: logs the click, then forwards to the institution's site.
// When affiliate links land, swapping application_url per institution is the ONLY change needed.
router.get('/go/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) { res.status(400).send('Bad link'); return }
  try {
    const pool = getPool()
    const { rows } = await pool.query('SELECT application_url FROM institutions WHERE id = $1', [id])
    const url = rows[0]?.application_url as string | undefined
    if (!url) { res.status(404).send('Institution not found'); return }
    pool.query('INSERT INTO click_events (institution_id, event_type) VALUES ($1, $2)', [id, 'apply_click'])
      .catch(err => console.error('Click log error:', err))
    res.redirect(302, url)
  } catch (err) {
    console.error('Redirect error:', err)
    res.status(500).send('Something went wrong')
  }
})

export default router
