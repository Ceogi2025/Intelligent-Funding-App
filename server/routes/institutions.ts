import { Router, Response } from 'express'
import { getDb } from '../db/database.js'
import { requireSubscription, AuthRequest } from '../middleware/auth.js'

const router = Router()

// GET /api/institutions — filtered list for Capital Access or Credit Builder
router.get('/', requireSubscription, (req: AuthRequest, res: Response) => {
  const { bureau, path: pathFilter, inquiryReuse, preapproval, productType } = req.query as Record<string, string>
  const db = getDb()

  if (pathFilter === 'credit-builder') {
    // Credit Builder: filter by product type only, no bureau filter
    const allowedTypes = { card: 'Secured Card', loan: 'Credit Builder Loan' }
    const type = allowedTypes[productType as keyof typeof allowedTypes]
    if (!type) {
      res.status(400).json({ error: 'productType must be card or loan' })
      return
    }

    const rows = db.prepare(`
      SELECT DISTINCT
        i.id, i.name, i.type, i.inquiry_reuse, i.inquiry_reuse_window,
        i.preapproval_available, i.soft_pull_available, i.geographic_restrictions,
        i.application_url, i.path, i.last_verified_date,
        p.id as product_id, p.name as product_name, p.type as product_type,
        p.bureau_pulled, p.reports_to, p.inquiry_reuse_eligible,
        p.preapproval_available as product_preapproval, p.minimum_credit_score,
        p.deposit_amount, p.annual_fee, p.graduation_potential, p.graduation_timeline,
        p.last_verified_date as product_verified_date, p.strategy_notes
      FROM institutions i
      JOIN products p ON p.institution_id = i.id
      WHERE p.type = ?
        AND i.path IN ('Credit Builder', 'Both')
      ORDER BY i.name
    `).all(type)

    res.json(groupByInstitution(rows))
    return
  }

  // Capital Access: bureau is mandatory gate
  const bureauMap: Record<string, string> = {
    experian: 'Experian',
    equifax: 'Equifax',
    transunion: 'TransUnion',
  }
  const bureauVal = bureauMap[bureau?.toLowerCase()]
  if (!bureauVal) {
    res.status(400).json({ error: 'bureau must be experian, equifax, or transunion' })
    return
  }

  // Build filter query based on inquiry reuse + preapproval answers
  let extraWhere = ''
  if (inquiryReuse === 'yes' && preapproval === 'yes') {
    extraWhere = "AND p.inquiry_reuse_eligible = 'Yes' AND p.preapproval_available = 'Yes'"
  } else if (inquiryReuse === 'yes') {
    extraWhere = "AND p.inquiry_reuse_eligible = 'Yes'"
  } else if (preapproval === 'yes') {
    extraWhere = "AND p.preapproval_available = 'Yes'"
  }
  // no, no = no additional filter

  const rows = db.prepare(`
    SELECT DISTINCT
      i.id, i.name, i.type, i.inquiry_reuse, i.inquiry_reuse_window,
      i.preapproval_available, i.soft_pull_available, i.geographic_restrictions,
      i.application_url, i.path, i.last_verified_date,
      p.id as product_id, p.name as product_name, p.type as product_type,
      p.bureau_pulled, p.reports_to, p.inquiry_reuse_eligible,
      p.preapproval_available as product_preapproval, p.minimum_credit_score,
      p.deposit_amount, p.annual_fee, p.graduation_potential, p.graduation_timeline,
      p.last_verified_date as product_verified_date, p.strategy_notes
    FROM institutions i
    JOIN products p ON p.institution_id = i.id
    WHERE p.bureau_pulled = ?
      AND p.type IN ('Unsecured Card', 'Line of Credit', 'Personal Loan')
      AND i.path IN ('Capital Access', 'Both')
      ${extraWhere}
    ORDER BY i.name
  `).all(bureauVal)

  res.json(groupByInstitution(rows))
})

// GET /api/institutions/:id — full detail with all products
router.get('/:id', requireSubscription, (req: AuthRequest, res: Response) => {
  const db = getDb()
  const institution = db.prepare('SELECT * FROM institutions WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!institution) {
    res.status(404).json({ error: 'Institution not found' })
    return
  }
  const products = db.prepare('SELECT * FROM products WHERE institution_id = ? ORDER BY type, name').all(req.params.id)
  res.json({ ...institution, products })
})

function groupByInstitution(rows: Record<string, unknown>[]): unknown[] {
  const map = new Map<number, Record<string, unknown>>()
  for (const row of rows) {
    const id = row.id as number
    if (!map.has(id)) {
      map.set(id, {
        id: row.id,
        name: row.name,
        type: row.type,
        inquiry_reuse: row.inquiry_reuse,
        inquiry_reuse_window: row.inquiry_reuse_window,
        preapproval_available: row.preapproval_available,
        soft_pull_available: row.soft_pull_available,
        geographic_restrictions: row.geographic_restrictions,
        application_url: row.application_url,
        path: row.path,
        last_verified_date: row.last_verified_date,
        products: [],
      })
    }
    const inst = map.get(id)!
    ;(inst.products as unknown[]).push({
      id: row.product_id,
      name: row.product_name,
      type: row.product_type,
      bureau_pulled: row.bureau_pulled,
      reports_to: row.reports_to,
      inquiry_reuse_eligible: row.inquiry_reuse_eligible,
      preapproval_available: row.product_preapproval,
      minimum_credit_score: row.minimum_credit_score,
      deposit_amount: row.deposit_amount,
      annual_fee: row.annual_fee,
      graduation_potential: row.graduation_potential,
      graduation_timeline: row.graduation_timeline,
      last_verified_date: row.product_verified_date,
      strategy_notes: row.strategy_notes,
    })
  }
  return Array.from(map.values())
}

export default router
