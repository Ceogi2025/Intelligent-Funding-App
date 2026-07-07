import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, CheckCircle2, MapPin, Repeat, ArrowRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

type Win = {
  id: number
  institution_name: string
  product_name: string | null
  bureau_pulled: string | null
  credit_score_band: string | null
  credit_limit: string | null
  state: string | null
  inquiry_reuse_observed: string | null
  notes: string | null
  created_at: string | null
}

function fmtDate(s: string | null): string {
  if (!s) return ''
  // Build a LOCAL date from the Y-M-D parts so a date-only value ('2026-07-04')
  // isn't shifted a day earlier by UTC-midnight parsing.
  const m = String(s).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WinsWall() {
  const [wins, setWins] = useState<Win[] | null>(null)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'The Wins Wall, Real Approvals | Intelligent Funding'
    fetch('/api/wins')
      .then(r => r.json())
      .then(d => setWins(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1, maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--badge-teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} />
          </div>
          <h1>The Wins Wall</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24, maxWidth: 620 }}>
          Real approvals from the community, which bureau got pulled, what limit came through, whether
          the inquiry got reused. This is the strategy working in the open. Every win is reviewed before
          it lands here.
        </p>

        {error && <div className="error-message">Couldn't load the wall, refresh to try again.</div>}

        {!wins && !error && (
          <p style={{ color: 'var(--text-secondary)' }}>Loading wins…</p>
        )}

        {wins && wins.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>
            The first wins are landing soon. Got one? <a href="/share">Share your approval →</a>
          </p>
        )}

        {wins && wins.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wins.map(w => (
              <div key={w.id} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <strong style={{ fontSize: '1.02rem' }}>{w.institution_name}</strong>
                  {w.product_name && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>· {w.product_name}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: w.notes ? 10 : 0 }}>
                  {w.bureau_pulled && (
                    <span className="chip" style={{ background: 'var(--badge-navy-bg, #eef2ff)', color: 'var(--navy, #1e40af)', padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                      {w.bureau_pulled} pull
                    </span>
                  )}
                  {w.credit_score_band && (
                    <span className="chip" style={{ background: 'var(--surface-2, #f1f5f9)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                      Score {w.credit_score_band}
                    </span>
                  )}
                  {w.credit_limit && (
                    <span className="chip" style={{ background: 'var(--badge-teal-bg)', color: 'var(--teal)', padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                      {w.credit_limit} limit
                    </span>
                  )}
                  {w.inquiry_reuse_observed === 'Yes' && (
                    <span className="chip" style={{ background: 'var(--badge-teal-bg)', color: 'var(--teal)', padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Repeat size={12} /> Inquiry reused
                    </span>
                  )}
                </div>

                {w.notes && (
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.94rem', margin: 0 }}>
                    "{w.notes}"
                  </p>
                )}
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <MapPin size={12} /> a member{w.state ? ` in ${w.state}` : ''}
                  {fmtDate(w.created_at) && <span>· Reported {fmtDate(w.created_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: 22, padding: '20px 22px', textAlign: 'center', background: 'var(--badge-navy-bg, #eef2ff)' }}>
          <h3 style={{ marginBottom: 8 }}>These are members using the map. Join them.</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            The full directory, the strategy layer, and the live member room are inside.
          </p>
          <button className="btn btn--primary" style={{ gap: 6 }} onClick={() => navigate('/signup')}>
            Start for $1 <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
