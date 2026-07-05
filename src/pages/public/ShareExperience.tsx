import { useEffect, useState } from 'react'
import { Users, CheckCircle2 } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const bureauOptions = ['Experian', 'Equifax', 'TransUnion', 'All 3', 'Not sure']
const scoreBands = ['Under 580', '580–619', '620–659', '660–699', '700–739', '740+']

export default function ShareExperience() {
  const [form, setForm] = useState({
    institution_name: '',
    product_name: '',
    bureau_pulled: '',
    approved: '',
    credit_score_band: '',
    credit_limit: '',
    state: '',
    inquiry_reuse_observed: '',
    notes: '',
    email: '',
  })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Share Your Approval Datapoint | Intelligent Funding'
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Try again'); return }
      setDone(true)
    } catch {
      setError('Connection error — try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1, maxWidth: 620 }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <CheckCircle2 size={44} style={{ color: '#16a34a', marginBottom: 14 }} />
            <h1 style={{ marginBottom: 10 }}>Datapoint received. Respect.</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>
              Every report like yours makes the map more accurate for the next person.
              Your datapoint goes through verification before anything is published — that's the standard
              that keeps this data trustworthy.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--badge-teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <h1>Share your datapoint</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 22 }}>
              Applied somewhere recently? Which bureau they pulled, whether they reused your inquiry —
              your two minutes makes the map real for the whole community. Everything is reviewed and
              verified before publication. No names, no account numbers — never share those.
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Institution (required)</label>
                <input className="form-input" required placeholder="e.g., Navy Federal Credit Union" value={form.institution_name} onChange={e => set('institution_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Product (optional)</label>
                <input className="form-input" placeholder="e.g., cashRewards card" value={form.product_name} onChange={e => set('product_name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Bureau they pulled</label>
                  <select className="form-input" value={form.bureau_pulled} onChange={e => set('bureau_pulled', e.target.value)}>
                    <option value="">Select…</option>
                    {bureauOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Approved?</label>
                  <select className="form-input" value={form.approved} onChange={e => set('approved', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Score range (optional)</label>
                  <select className="form-input" value={form.credit_score_band} onChange={e => set('credit_score_band', e.target.value)}>
                    <option value="">Select…</option>
                    {scoreBands.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Limit given (optional)</label>
                  <input className="form-input" placeholder="e.g., $5,000" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your state (optional)</label>
                  <input className="form-input" placeholder="e.g., MA" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Did they reuse an inquiry?</label>
                  <select className="form-input" value={form.inquiry_reuse_observed} onChange={e => set('inquiry_reuse_observed', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes — 2nd product, no new pull</option>
                    <option value="No">No — new hard pull</option>
                    <option value="N/A">Didn't try</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Anything else worth knowing? (optional)</label>
                <textarea className="form-input" rows={3} placeholder="Timing, phone rep info, membership path used…" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your email (optional — only if we can follow up)</label>
                <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? 'Sending…' : 'Submit Datapoint'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 10, textAlign: 'center' }}>
                Never include full account numbers, SSNs, or documents. Datapoints only.
              </p>
            </form>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
