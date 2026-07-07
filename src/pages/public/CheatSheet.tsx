import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useLiveCounts } from '../../hooks/useLiveCounts'

export default function CheatSheet() {
  const navigate = useNavigate()
  const { instFloor } = useLiveCounts()
  const [email, setEmail] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Free Credit Bureau Cheat Sheet | Intelligent Funding'
    if (localStorage.getItem('if_cheatsheet') === '1') setUnlocked(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'cheat-sheet' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Try again'); return }
      localStorage.setItem('if_cheatsheet', '1')
      setUnlocked(true)
    } catch {
      setError('Connection error, try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1, maxWidth: 680 }}>
        {!unlocked ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--badge-teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FileText size={26} />
            </div>
            <h1 style={{ marginBottom: 10 }}>The Bureau Cheat Sheet</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.65 }}>
              The 3 questions to ask before ANY credit application, the free tools to check all three of your reports,
              and the bureau phone numbers that matter. Free, drop your email and it's yours.
            </p>
            {error && <div className="error-message" style={{ maxWidth: 380, margin: '0 auto 14px' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                className="form-input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'One sec…' : 'Get the Cheat Sheet'}
              </button>
            </form>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 12 }}>
              No spam. Educational content only, unsubscribe anytime.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14 }}>
              <CheckCircle2 size={16} /> Unlocked, bookmark this page
            </div>
            <h1 style={{ marginBottom: 24 }}>The Bureau Cheat Sheet</h1>

            <div className="guide__section">
              <h2 className="guide__section-title">The one fact that changes everything</h2>
              <div className="guide__body">
                <p>You don't have one credit report, you have <strong>three</strong> (Experian, Equifax, TransUnion), and they are NOT identical. Most lenders pull just ONE of them. Which one is knowable. So every application is a choice: walk into the room where your file is strongest, or the room where it's weakest.</p>
              </div>
            </div>

            <div className="guide__section">
              <h2 className="guide__section-title">The 3 questions before ANY application</h2>
              <div className="guide__body">
                <p><strong>1. Which bureau does this institution pull?</strong> Apply where your strongest report lives. (Our free <a href="/banks" style={{ color: 'var(--teal)', fontWeight: 600 }}>directory</a> answers this for {instFloor} institutions (growing weekly).)</p>
                <p><strong>2. Do they allow inquiry reuse?</strong> Some institutions approve multiple products off a single hard pull inside a window, same day at some, 30 days at others. One inquiry, two or three accounts.</p>
                <p><strong>3. Is there a soft-pull preapproval?</strong> Check your approval odds with zero impact before committing the hard inquiry.</p>
                <p>If you can't answer all three, you're not ready to apply. That discipline is the whole game.</p>
              </div>
            </div>

            <div className="guide__section">
              <h2 className="guide__section-title">Check all 3 reports, free, the official way</h2>
              <div className="guide__body">
                <p><strong>AnnualCreditReport.com</strong>, the only federally authorized source. Free weekly reports from all three bureaus. Never pay for your own reports.</p>
                <p>Dispute every error BEFORE you apply anywhere, one wrong late payment can sit below an approval threshold. Disputes are free and a federal right.</p>
              </div>
            </div>

            <div className="guide__section">
              <h2 className="guide__section-title">The numbers that matter</h2>
              <div className="guide__body">
                <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} style={{ color: 'var(--teal)' }} /> Experian freeze/support: <strong>888-397-3742</strong></p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} style={{ color: 'var(--teal)' }} /> Equifax freeze: <strong>888-298-0045</strong></p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} style={{ color: 'var(--teal)' }} /> TransUnion: <strong>800-916-8800</strong></p>
                <p>Pro move: freeze the bureaus you're NOT applying on. Unfreeze in minutes when you're ready. Fraud can't touch a frozen file.</p>
              </div>
            </div>

            <div style={{ background: '#0f1f4d', borderRadius: 'var(--radius-lg)', padding: '24px 22px', textAlign: 'center', color: '#fff', margin: '8px 0 24px' }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Ready for the full map?</div>
              <div style={{ color: '#c7d2e8', fontSize: '0.88rem', marginBottom: 14 }}>
                {instFloor} verified institutions (new ones weekly) · which bureau each one pulls · inquiry-reuse windows · soft-pull paths
              </div>
              <button className="btn btn--teal" onClick={() => navigate('/signup')}>
                Start for $1 <ArrowRight size={14} />
              </button>
            </div>

            <div className="guide__disclaimer">
              Educational content only. Not financial advice. Confirm all policies directly with institutions before applying.
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
