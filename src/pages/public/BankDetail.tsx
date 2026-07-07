import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useLiveCounts } from '../../hooks/useLiveCounts'

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

const lockedItems = [
  'Inquiry reuse policy, can one hard pull open multiple accounts here?',
  'The reuse window, same day? 30 days?',
  'Soft-pull preapproval, check your odds with zero score impact?',
  'Every product mapped, cards, credit lines, loans, with per-product bureau',
  'Minimum scores, fees, graduation timelines',
  'Strategy notes, how this institution fits a stacking sequence',
]

export default function BankDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [inst, setInst] = useState<PublicInstitution | null>(null)
  const { instFloor } = useLiveCounts()
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/institutions/${slug}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        setInst(data)
        document.title = `Which Credit Bureau Does ${data.name} Pull? | Intelligent Funding`
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1, maxWidth: 720 }}>
        <Link to="/banks" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 20 }}>
          <ArrowLeft size={14} /> All institutions
        </Link>

        {loading && <div className="loading-page"><div className="spinner" /><span>Loading…</span></div>}
        {notFound && (
          <div className="results-empty">
            <h3>Institution not found</h3>
            <p><Link to="/banks" style={{ color: 'var(--teal)', fontWeight: 600 }}>Browse the full directory</Link></p>
          </div>
        )}

        {inst && (
          <>
            <h1 style={{ marginBottom: 12 }}>Which bureau does {inst.name} pull?</h1>

            {/* The free answer, the SEO payload */}
            <div style={{ background: 'var(--badge-teal-bg)', border: '1px solid var(--teal)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal)', marginBottom: 8 }}>
                Verified answer
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                {inst.name} pulls from{' '}
                <strong>{inst.bureaus.length > 0 ? inst.bureaus.join(' and ') : 'no bureau (soft-pull products)'}</strong>
                {inst.bureaus.length > 1 && ', the bureau can differ by product type'}.
                {inst.product_count > 0 && <> We've mapped <strong>{inst.product_count} credit product{inst.product_count !== 1 ? 's' : ''}</strong> at this institution.</>}
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>{inst.type}</span>
                <span>·</span>
                <span>{inst.geographic_restrictions}</span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} style={{ color: 'var(--teal)' }} /> Verified {inst.last_verified_date}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 24 }}>
              Why it matters: your three credit reports are three separate files. Applying where your strongest
              bureau gets pulled, and reusing inquiries where policies allow it, is the difference between
              building a stack and burning your profile. Policies change; always confirm with the institution before applying.
            </p>

            {/* The locked layer */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: '#0f1f4d', color: '#fff', padding: '14px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={15} style={{ color: '#22d3ee' }} /> The strategy layer for {inst.name}
              </div>
              <div style={{ padding: '8px 20px' }}>
                {lockedItems.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <Lock size={13} style={{ flexShrink: 0, marginTop: 3, color: 'var(--unverified-color)' }} />
                    {item}
                  </div>
                ))}
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <button className="btn btn--primary" onClick={() => navigate('/signup')}>
                    Unlock Full Access, $1 for 7 Days <ArrowRight size={14} />
                  </button>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    {instFloor} institutions · growing weekly · cancel anytime
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Educational content only. Not financial advice. Bureau pulls can vary by state, product, and applicant,
              confirm directly with {inst.name} before applying. Have a datapoint from your own application?{' '}
              <Link to="/share" style={{ color: 'var(--teal)', fontWeight: 600 }}>Share it</Link> and help the community map.
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
