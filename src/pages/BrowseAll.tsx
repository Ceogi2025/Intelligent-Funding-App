import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ArrowRight, MapPin } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useAuth } from '../context/AuthContext'
import { productInsights } from '../utils/insights'
import type { Institution } from '../types'

// Browse All, the full lending catalog with strategy filters.
// The guided paths (Home) stay the hero flow; this view serves the user who
// already knows what they want: a specific bank, a product type, or "just
// show me everything with no annual fee."

const PRODUCT_TYPES = ['Any', 'Unsecured Card', 'Secured Card', 'Credit Builder Loan', 'Line of Credit', 'Personal Loan', 'Alternative Tradeline'] as const
const BUREAUS = ['Any', 'Experian', 'Equifax', 'TransUnion', 'All 3', 'None (no hard pull)', 'Not Verified'] as const
const INST_TYPES = ['Any', 'Bank', 'Credit Union', 'Fintech'] as const

export default function BrowseAll() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [bureau, setBureau] = useState<string>('Any')
  const [ptype, setPtype] = useState<string>('Any')
  const [itype, setItype] = useState<string>('Any')
  const [reuseOnly, setReuseOnly] = useState(false)
  const [softOnly, setSoftOnly] = useState(false)
  const [noFeeOnly, setNoFeeOnly] = useState(false)
  const [nationwideOnly, setNationwideOnly] = useState(false)

  useEffect(() => {
    document.title = 'Browse All Institutions | Intelligent Funding'
    fetch('/api/institutions?path=all', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 402) throw new Error('subscription_required')
        if (!res.ok) throw new Error('Failed to load institutions')
        return res.json()
      })
      .then(data => setInstitutions(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const feeIsNone = (fee: string) => !fee || /^(none|\$?0)/i.test(fee.trim())
  const bureauMatch = (b: string) => {
    if (bureau === 'Any') return true
    if (bureau === 'None (no hard pull)') return b === 'None'
    return b === bureau
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return institutions
      .map(inst => {
        if (itype !== 'Any' && inst.type !== itype) return null
        if (nationwideOnly && !/nationwide/i.test(inst.geographic_restrictions || '')) return null
        if (needle && !inst.name.toLowerCase().includes(needle) && !inst.products.some(p => p.name.toLowerCase().includes(needle))) return null
        const products = inst.products.filter(p =>
          bureauMatch(p.bureau_pulled) &&
          (ptype === 'Any' || p.type === ptype) &&
          (!reuseOnly || p.inquiry_reuse_eligible === 'Yes') &&
          (!softOnly || p.preapproval_available === 'Yes') &&
          (!noFeeOnly || feeIsNone(p.annual_fee))
        )
        if (products.length === 0) return null
        return { ...inst, products }
      })
      .filter((x): x is Institution => x !== null)
  }, [institutions, q, bureau, ptype, itype, reuseOnly, softOnly, noFeeOnly, nationwideOnly])

  const productCount = shown.reduce((n, i) => n + i.products.length, 0)

  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button
      onClick={() => set(!on)}
      style={{
        padding: '5px 13px', borderRadius: 999, fontSize: '0.8rem', cursor: 'pointer', fontWeight: on ? 700 : 500,
        border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
        background: on ? 'var(--badge-teal-bg, #ecfeff)' : 'transparent',
        color: on ? 'var(--teal)' : 'var(--text-secondary)',
      }}
    >
      {on ? '✓ ' : ''}{label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="page" style={{ flex: 1 }}>
        <h1 style={{ marginBottom: 6 }}>Browse all institutions</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 640, lineHeight: 1.6, marginBottom: 18 }}>
          The full catalog, every institution and product we've mapped, with the strategy data on each.
          Prefer a guided path? <a href="/home" style={{ color: 'var(--teal)', fontWeight: 600 }}>Start with bureau mapping</a>.
        </p>

        {/* Search + selects */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search banks or products…"
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.88rem' }}
            />
          </div>
          {[
            { val: bureau, set: setBureau, opts: BUREAUS, label: 'Bureau' },
            { val: ptype, set: setPtype, opts: PRODUCT_TYPES, label: 'Product' },
            { val: itype, set: setItype, opts: INST_TYPES, label: 'Institution' },
          ].map(({ val, set, opts, label }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {label}
              <select value={val} onChange={e => set(e.target.value)} style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>

        {/* Toggle chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {toggle(reuseOnly, setReuseOnly, 'Inquiry reuse')}
          {toggle(softOnly, setSoftOnly, 'Soft-pull preapproval')}
          {toggle(noFeeOnly, setNoFeeOnly, 'No annual fee')}
          {toggle(nationwideOnly, setNationwideOnly, 'Nationwide only')}
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          Showing <b>{shown.length}</b> institutions · <b>{productCount}</b> products
        </div>

        {loading && <div className="loading-page"><div className="spinner" /><span>Loading catalog…</span></div>}
        {error === 'subscription_required' && (
          <div className="results-empty"><h3>Subscription required</h3><p>The full catalog is part of the paid plan.</p></div>
        )}
        {error && error !== 'subscription_required' && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {shown.map(inst => {
              const bureaus = [...new Set(inst.products.map(p => p.bureau_pulled))]
              const verified = bureaus.filter(b => b !== 'Not Verified')
              const sample = productInsights(inst.products[0], inst)
              const regional = inst.geographic_restrictions && !/nationwide/i.test(inst.geographic_restrictions)
              return (
                <div key={inst.id} className="institution-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{inst.name}</span>
                    <span className="badge badge--gray" style={{ alignSelf: 'flex-start' }}>{inst.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {verified.map(b => <span key={b} className="badge badge--navy">{b}</span>)}
                    {bureaus.includes('Not Verified') && <span className="badge badge--gray">Bureau not verified</span>}
                    {inst.inquiry_reuse === 'Yes' && <span className="badge badge--green">✓ Inquiry Reuse</span>}
                    {inst.products.some(p => p.preapproval_available === 'Yes') && <span className="badge badge--teal">✓ Soft Pull</span>}
                  </div>
                  {regional && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <MapPin size={12} style={{ color: 'var(--teal)', flexShrink: 0 }} /> {inst.geographic_restrictions}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {inst.products.length} matching product{inst.products.length !== 1 ? 's' : ''}
                    {sample.highlights.length > 0 && <> · e.g. {sample.highlights.slice(0, 2).join(' · ')}</>}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={12} style={{ color: 'var(--teal)' }} /> Verified {inst.last_verified_date}
                    </span>
                    <button className="institution-card__link" onClick={() => navigate(`/institution/${inst.id}`)}>
                      View <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
            {shown.length === 0 && (
              <div className="results-empty" style={{ gridColumn: '1 / -1' }}>
                <h3>No matches</h3><p>Loosen a filter, or tell us what's missing via Share a Datapoint.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
