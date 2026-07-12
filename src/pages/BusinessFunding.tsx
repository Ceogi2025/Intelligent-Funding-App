import { useEffect, useMemo, useState } from 'react'
import { Briefcase, ExternalLink, ShieldCheck } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useAuth } from '../context/AuthContext'

type BizProduct = {
  id: number
  name: string
  product_type: string | null
  docs_required: string
  personal_guarantee: string
  time_in_business: string
  min_fico: string
  credit_pull: string
  reports_to: string
  funding_amount: string | null
  revenue_required: string
  notes: string | null
}

type BizInstitution = {
  id: number
  name: string
  type: string | null
  access: string
  geographic_restrictions: string
  application_url: string | null
  strategy_notes: string | null
  verified_date: string | null
  products: BizProduct[]
}

// Auto-derived Highlights & Watch-outs PER PRODUCT, same philosophy as the
// consumer side: derived from verified fields at render time, never hand-written.
function productInsights(p: BizProduct): { highlights: string[]; watchouts: string[] } {
  const highlights: string[] = []
  const watchouts: string[] = []
  const fico = (p.min_fico || '').toLowerCase()
  const pull = (p.credit_pull || '').toLowerCase()
  const pg = (p.personal_guarantee || '').toLowerCase()
  const docs = (p.docs_required || '').toLowerCase()
  const tib = (p.time_in_business || '').toLowerCase()
  const notes = (p.notes || '').toLowerCase()
  const rev = p.revenue_required || ''

  if (fico.includes('none') || fico.includes('no minimum') || fico.includes('no set minimum')) highlights.push('No FICO minimum')
  if (pull.includes('soft') || pull.includes('no hard')) highlights.push('Soft pull, no score damage to apply')
  if (pg.includes('no personal guarantee') || pg.includes('ein-only')) highlights.push('No personal guarantee (EIN-only)')
  if (docs.includes('no-doc') || docs.includes('low-doc') || docs.includes('low/no-doc') || docs.includes('no/low-doc') || docs.includes('no income doc')) highlights.push('No tax returns required')
  if (tib.includes('3+ months') || tib.includes('startup') || tib.includes('pre-revenue')) highlights.push('New-LLC / startup friendly')
  if (notes.includes('0% intro')) highlights.push('0% intro APR offer')
  if ((p.product_type || '') === 'Credit Builder' || (notes.includes('builder') && notes.includes('credit'))) highlights.push('Builds business credit')
  if (notes.includes('no annual fee')) highlights.push('No annual fee')

  if (pg.includes('pg required')) watchouts.push('Personal guarantee required')
  if (/(^|\s)(1|2)\+? ?year/.test(tib) || tib.includes('12+ months') || tib.includes('2 years')) watchouts.push(`Time in business: ${p.time_in_business}`)
  if (/\$\d/.test(rev)) watchouts.push(`Revenue requirement: ${rev}`)
  if ((p.product_type || '').includes('Merchant Cash Advance') || (p.product_type || '').includes('Cash Advance')) watchouts.push('Advance product, know the cost of capital')
  if (docs.includes('full-doc')) watchouts.push('Full-doc: tax returns required')
  if ((p.min_fico || '').match(/\d{3}/) && !fico.includes('none')) watchouts.push(`FICO floor: ${p.min_fico}`)
  if (notes.includes('not published, confirm') || notes.includes('length not published')) watchouts.push('Confirm current offer terms before applying')
  if (notes.includes('ucc')) watchouts.push('Files a UCC lien')

  return { highlights, watchouts }
}

function institutionWatchouts(i: BizInstitution): string[] {
  const out: string[] = []
  const access = (i.access || '').toLowerCase()
  const geo = (i.geographic_restrictions || '').toLowerCase()
  if (access.includes('membership') || access.includes('existing') || access.includes('quickbooks') || access.includes('customers')) out.push('Requires an existing account or membership first')
  if (!geo.includes('nationwide') && !/^us\b/.test(geo.trim())) out.push(`Regional: ${i.geographic_restrictions}`)
  return out
}

const FILTERS = [
  { key: 'nodoc', label: 'No tax returns' },
  { key: 'newllc', label: 'New LLC / startup OK' },
  { key: 'nopg', label: 'No personal guarantee' },
  { key: 'nofico', label: 'No FICO minimum' },
  { key: 'softpull', label: 'Soft pull only' },
  { key: 'zero', label: '0% intro APR' },
] as const
type FilterKey = typeof FILTERS[number]['key']

function productMatches(p: BizProduct, key: FilterKey): boolean {
  const { highlights } = productInsights(p)
  switch (key) {
    case 'nodoc': return highlights.includes('No tax returns required')
    case 'newllc': return highlights.includes('New-LLC / startup friendly')
    case 'nopg': return highlights.includes('No personal guarantee (EIN-only)')
    case 'nofico': return highlights.includes('No FICO minimum')
    case 'softpull': return highlights.some(h => h.startsWith('Soft pull'))
    case 'zero': return highlights.includes('0% intro APR offer')
  }
}

function ProductCard({ product }: { product: BizProduct }) {
  const { highlights, watchouts } = productInsights(product)
  const show = (v: string | null | undefined) => v && v !== 'Not published'
  return (
    <div className="product-card">
      <div className="product-card__name">{product.name}</div>
      <div className="product-card__type">{product.product_type}</div>

      {highlights.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {highlights.map(h => (
            <span key={h} style={{ fontSize: '0.76rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>✓ {h}</span>
          ))}
        </div>
      )}
      {watchouts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {watchouts.map(w => (
            <span key={w} style={{ fontSize: '0.76rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>⚠ {w}</span>
          ))}
        </div>
      )}

      <div className="detail-grid" style={{ marginTop: 12 }}>
        <div><div className="detail-label">Amount</div><div className="detail-value">{product.funding_amount || 'Not published'}</div></div>
        <div><div className="detail-label">Docs</div><div className="detail-value">{product.docs_required}</div></div>
        <div><div className="detail-label">Credit Pull</div><div className="detail-value">{product.credit_pull}</div></div>
        <div><div className="detail-label">Time in Business</div><div className="detail-value">{product.time_in_business}</div></div>
        <div><div className="detail-label">Min FICO</div><div className="detail-value">{product.min_fico}</div></div>
        {show(product.revenue_required) && (
          <div><div className="detail-label">Revenue Required</div><div className="detail-value">{product.revenue_required}</div></div>
        )}
        {show(product.reports_to) && (
          <div><div className="detail-label">Reports To</div><div className="detail-value">{product.reports_to}</div></div>
        )}
      </div>

      {product.notes && (
        <div style={{ marginTop: 10 }}>
          <div className="detail-label">Strategy Notes</div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{product.notes}</div>
        </div>
      )}
    </div>
  )
}

export default function BusinessFunding() {
  const { token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [institutions, setInstitutions] = useState<BizInstitution[] | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState<Set<FilterKey>>(new Set())

  useEffect(() => {
    document.title = 'Business Funding | Intelligent Funding'
    fetch('/api/business-lenders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('load'); return r.json() })
      .then(d => setInstitutions(Array.isArray(d) ? d : []))
      .catch(() => setError('Could not load business lenders. Refresh to try again.'))
  }, [token])

  // A filter narrows to institutions with at least one matching product, and
  // within each institution shows only the products that match every active filter.
  const shown = useMemo(() => {
    if (!institutions) return []
    if (active.size === 0) return institutions
    return institutions
      .map(i => ({ ...i, products: i.products.filter(p => [...active].every(k => productMatches(p, k))) }))
      .filter(i => i.products.length > 0)
  }, [institutions, active])

  function toggle(k: FilterKey) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const totalProducts = institutions ? institutions.reduce((s, i) => s + i.products.length, 0) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="page" style={{ flex: 1, maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--badge-navy-bg, #eef2ff)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={20} />
          </div>
          <h1>Business Funding</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, maxWidth: 660 }}>
          There are levels to funding. {institutions ? `${institutions.length} institutions and ${totalProducts} products, ` : ''}
          every one verified against the official site. The filters match you to your level, from brand-new LLC
          to established business. A personal guarantee or a time-in-business requirement is a label, not a wall.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                border: active.has(f.key) ? '1.5px solid var(--navy)' : '1px solid var(--border, #e5e7eb)',
                background: active.has(f.key) ? 'var(--badge-navy-bg, #eef2ff)' : 'var(--card, #fff)',
                color: active.has(f.key) ? 'var(--navy)' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
        {!institutions && !error && <p style={{ color: 'var(--text-secondary)' }}>Loading lenders…</p>}
        {institutions && shown.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No product matches every filter you picked. Try removing one.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {shown.map(inst => (
            <div key={inst.id} className="card" style={{ padding: '20px 22px' }}>
              {/* Institution header, mirrors the personal side */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{inst.name}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    <span className="badge badge--gray">{inst.type}</span>
                    {institutionWatchouts(inst).map(w => (
                      <span key={w} style={{ fontSize: '0.74rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>⚠ {w}</span>
                    ))}
                  </div>
                </div>
                {inst.application_url && (
                  <a href={inst.application_url} target="_blank" rel="noopener noreferrer" className="btn btn--teal btn--sm">
                    Apply <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="detail-grid" style={{ marginTop: 12 }}>
                <div><div className="detail-label">Access</div><div className="detail-value">{inst.access}</div></div>
                <div><div className="detail-label">Geographic</div><div className="detail-value">{inst.geographic_restrictions}</div></div>
                <div>
                  <div className="detail-label">Verification</div>
                  <div className="detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} style={{ color: 'var(--teal)' }} /> {inst.verified_date} · Official website
                  </div>
                </div>
              </div>

              {inst.strategy_notes && (
                <div style={{ marginTop: 10, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {inst.strategy_notes}
                </div>
              )}

              {/* Products, each with its own insights */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy)', marginBottom: 10 }}>
                  Products ({inst.products.length})
                </div>
                {inst.products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, background: 'var(--badge-gray-bg, #f8fafc)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 12, padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Educational only, not financial advice. "Not published" means the lender does not state it publicly;
          we flag that honestly instead of guessing. Terms change, confirm on the lender's site before applying.
        </div>
      </div>
    </div>
  )
}
