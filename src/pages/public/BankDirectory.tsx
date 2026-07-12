import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

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

const bureauColor: Record<string, string> = {
  Experian: '#1e40af',
  Equifax: '#0891b2',
  TransUnion: '#6366f1',
  'All 3': '#475569',
  None: '#94a3b8',
}

export default function BankDirectory() {
  const navigate = useNavigate()
  const [institutions, setInstitutions] = useState<PublicInstitution[]>([])
  const [filter, setFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Which Credit Bureau Does Each Bank Pull?, Free Directory | Intelligent Funding'
    fetch('/api/public/institutions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInstitutions(data) })
      .finally(() => setLoading(false))
  }, [])

  const filters = ['All', 'Experian', 'Equifax', 'TransUnion']
  const shown = filter === 'All' ? institutions : institutions.filter(i => i.bureaus.includes(filter))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1 }}>
        <h1 style={{ marginBottom: 8 }}>Which bureau does each bank pull?</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 620, lineHeight: 1.6, marginBottom: 8 }}>
          Every lender pulls your credit from Experian, Equifax, or TransUnion, usually just one, and it's knowable.
          This free directory shows the verified pull for {institutions.length || '80+'} institutions.
          The full strategy layer, inquiry-reuse windows, soft-pull preapproval paths, every product mapped, lives inside the app.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          <ShieldCheck size={14} style={{ color: 'var(--teal)' }} />
          Verified against official sources · unpublished policies flagged honestly, never guessed
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: '0.82rem', cursor: 'pointer',
                border: `1px solid ${filter === f ? 'var(--navy)' : 'var(--border)'}`,
                background: filter === f ? 'var(--navy)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                fontWeight: filter === f ? 700 : 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <div className="loading-page"><div className="spinner" /><span>Loading directory…</span></div>}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 32 }}>
            {shown.map(inst => (
              <Link
                key={inst.id}
                to={`/banks/${inst.slug}`}
                style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, display: 'block', background: '#fff' }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{inst.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {inst.bureaus.map(b => (
                    <span key={b} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: '#fff', background: bureauColor[b] || '#475569' }}>
                      {b}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {inst.type} · {inst.product_count} product{inst.product_count !== 1 ? 's' : ''} mapped
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ background: '#0f1f4d', borderRadius: 'var(--radius-lg)', padding: '26px 24px', textAlign: 'center', color: '#fff', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>The bureau is step one. The strategy is the product.</div>
          <div style={{ color: '#c7d2e8', fontSize: '0.9rem', marginBottom: 16, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Inquiry-reuse windows, soft-pull preapproval paths, credit-builder graduation timelines, and every product mapped, that's what turns one hard pull into a stack.
          </div>
          <button className="btn btn--teal" onClick={() => navigate('/signup')}>
            Unlock the Full Strategy, $1 for 7 Days <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
