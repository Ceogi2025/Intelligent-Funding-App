import type { Product, Institution } from '../types'

// Auto-derived Highlights & Watch-outs.
// Every line here is derived from OUR verified structured fields — never copied
// from any third-party editorial. Fact in, plain-English fact out. Because these
// derive at render time, they update themselves whenever the data updates.

export interface Insights {
  highlights: string[]
  watchouts: string[]
}

const feeIsNone = (fee: string) => !fee || /^(none|\$?0)/i.test(fee.trim())

export function productInsights(p: Product, inst?: Institution): Insights {
  const highlights: string[] = []
  const watchouts: string[] = []
  const notes = (p.strategy_notes || '').toLowerCase()

  // ── Highlights ──
  if (feeIsNone(p.annual_fee)) highlights.push('No annual fee')
  else watchouts.push(`Annual fee: ${p.annual_fee}`)

  if (notes.includes('0% intro')) highlights.push('0% intro APR offer')
  if (notes.includes('cash back')) highlights.push('Earns cash back')
  if (notes.includes('no foreign transaction')) highlights.push('No foreign transaction fees')
  if (notes.includes('non-variable') || notes.includes('fixed rate') || notes.includes('fixed —') || notes.includes('% fixed')) highlights.push('Fixed (non-variable) APR')

  if (p.inquiry_reuse_eligible === 'Yes') highlights.push('Inquiry reuse — one pull can open multiple accounts here')
  if (p.preapproval_available === 'Yes') highlights.push('Soft-pull preapproval — check your odds first')

  if (p.bureau_pulled === 'None') highlights.push('No hard credit check')
  if (p.minimum_credit_score === null && (p.type === 'Secured Card' || p.type === 'Credit Builder Loan' || p.type === 'Alternative Tradeline')) {
    highlights.push('No minimum score published — built for thin/rebuilding files')
  }
  if (p.graduation_potential === 'Yes') highlights.push(`Graduates to unsecured${p.graduation_timeline && p.graduation_timeline !== 'N/A' && p.graduation_timeline !== 'Not Found' ? ` (${p.graduation_timeline})` : ''}`)
  if (p.reports_to === 'All 3') highlights.push('Reports to all 3 bureaus')

  // ── Watch-outs ──
  if (p.preapproval_available === 'Yes') watchouts.push('Preapproval is a soft check — final approval still triggers a hard pull')
  if (p.existing_customer_required === 'Yes') watchouts.push('Requires an existing account with this institution first')
  if (p.type === 'Secured Card' && p.deposit_amount && p.deposit_amount !== 'N/A') watchouts.push(`Security deposit: ${p.deposit_amount}`)
  if (p.bureau_pulled === 'Not Verified') watchouts.push('Bureau pull not yet verified — confirm with the institution before applying')
  if (p.minimum_credit_score !== null && p.minimum_credit_score >= 700) watchouts.push('Built for established credit profiles')

  // Application-velocity rules (5/24, 3/12, Citi speed limits, …) — the sequencing data
  const velocity = (p.strategy_notes || '').match(/VELOCITY RULES? \(([^)]+)\)/)
  if (velocity) watchouts.push(`${velocity[1]} — sequencing rule, see strategy notes`)

  const geo = inst?.geographic_restrictions || ''
  if (geo && !/nationwide/i.test(geo)) watchouts.push(`Regional: ${geo}`)

  return { highlights, watchouts }
}
