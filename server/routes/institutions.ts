import { Router } from 'express'
import type { Response } from 'express'
import { getPool } from '../db/database.js'
import { requireSubscription } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireSubscription, async (req: AuthRequest, res: Response) => {
  const { bureau, path: pathFilter, inquiryReuse, preapproval, productType } = req.query as Record<string, string>
  const pool = getPool()

  if (pathFilter === 'credit-builder') {
    const allowedTypes: Record<string, string> = { card: 'Secured Card', loan: 'Credit Builder Loan' }
    const type = allowedTypes[productType]
    if (!type) {
      res.status(400).json({ error: 'productType must be card or loan' })
      return
    }

    const { rows } = await pool.query(`
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
      WHERE p.type = $1
        AND i.path IN ('Credit Builder', 'Both')
      ORDER BY i.name
    `, [type])

    res.json(groupByInstitution(rows))
    return
  }

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

  let extraWhere = ''
  if (inquiryReuse === 'yes' && preapproval === 'yes') {
    extraWhere = "AND p.inquiry_reuse_eligible = 'Yes' AND p.preapproval_available = 'Yes'"
  } else if (inquiryReuse === 'yes') {
    extraWhere = "AND p.inquiry_reuse_eligible = 'Yes'"
  } else if (preapproval === 'yes') {
    extraWhere = "AND p.preapproval_available = 'Yes'"
  }

  const { rows } = await pool.query(`
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
    WHERE p.bureau_pulled = $1
      AND p.type IN ('Unsecured Card', 'Line of Credit', 'Personal Loan')
      AND i.path IN ('Capital Access', 'Both')
      ${extraWhere}
    ORDER BY i.name
  `, [bureauVal])

  res.json(groupByInstitution(rows))
})

router.get('/:id', requireSubscription, async (req: AuthRequest, res: Response) => {
  const pool = getPool()
  const { rows: instRows } = await pool.query('SELECT * FROM institutions WHERE id = $1', [req.params.id])
  if (!instRows[0]) {
    res.status(404).json({ error: 'Institution not found' })
    return
  }
  const { rows: products } = await pool.query(
    'SELECT * FROM products WHERE institution_id = $1 ORDER BY type, name',
    [req.params.id]
  )
  res.json({ ...instRows[0], products })
})

function groupByInstitution(rows: Record<string, unknown>[]): unknown[] {
  const map = new Map<number, Record<string, unknown>>()
  for (const row of rows) {
    const id = row.id as number
    if (!map.has(id)) {
      map.set(id, {
        id: row.id, name: row.name, type: row.type,
        inquiry_reuse: row.inquiry_reuse, inquiry_reuse_window: row.inquiry_reuse_window,
        preapproval_available: row.preapproval_available, soft_pull_available: row.soft_pull_available,
        geographic_restrictions: row.geographic_restrictions, application_url: row.application_url,
        path: row.path, last_verified_date: row.last_verified_date, products: [],
      })
    }
    ;(map.get(id)!.products as unknown[]).push({
      id: row.product_id, name: row.product_name, type: row.product_type,
      bureau_pulled: row.bureau_pulled, reports_to: row.reports_to,
      inquiry_reuse_eligible: row.inquiry_reuse_eligible, preapproval_available: row.product_preapproval,
      minimum_credit_score: row.minimum_credit_score, deposit_amount: row.deposit_amount,
      annual_fee: row.annual_fee, graduation_potential: row.graduation_potential,
      graduation_timeline: row.graduation_timeline, last_verified_date: row.product_verified_date,
      strategy_notes: row.strategy_notes,
    })
  }
  return Array.from(map.values())
}

export default router
