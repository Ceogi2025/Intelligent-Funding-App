import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { CardStackArt } from '../components/BrandArt'
import { useLiveCounts } from '../hooks/useLiveCounts'
import { track } from '../lib/track'

const planInfo: Record<string, { badge: string; benefits: string[] }> = {
  trial: {
    badge: '$1 for 7 Days',
    benefits: [
      'Every verified institution, {COUNT} and growing',
      'The Wins Wall, real member approvals',
      '2 starter strategy guides + Resources',
      'Preview of the live Community Room · Cancel anytime',
    ],
  },
  monthly: {
    badge: '$29 / month',
    benefits: [
      'Everything in the trial, unlocked in full',
      'The live Community Room',
      'All 4 strategy playbooks + post your wins',
      'Cancel anytime',
    ],
  },
  annual: {
    badge: '$278 / year',
    benefits: [
      'Everything in Monthly',
      'Save $70 vs paying monthly',
      'Priority support',
      'Cancel anytime',
    ],
  },
}

export default function SignUp() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'trial'
  const { instFloor } = useLiveCounts()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Sign Up | Intelligent Funding'
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    track('signup_submit')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      login(data.token, data.user)

      // If Stripe is configured, start checkout. Otherwise go home.
      if (plan !== 'none') {
        try {
          const checkoutRes = await fetch('/api/payments/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ plan }),
          })
          const checkoutData = await checkoutRes.json()
          if (checkoutData.url) {
            track('checkout_start')
            window.location.href = checkoutData.url
            return
          }
        } catch {
          // Stripe not configured, proceed to home
        }
      }

      navigate('/home')
    } catch {
      setError('Connection error. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const info = planInfo[plan] || planInfo.trial

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="auth-split">
        {/* Sell side */}
        <aside className="auth-aside">
          <div className="auth-aside__inner">
            <div className="auth-aside__eyebrow">You're one step away</div>
            <div className="auth-aside__badge">{info.badge}</div>
            <h2 className="auth-aside__title">Unlock the full funding map.</h2>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--bright, #22d3ee)', margin: '2px 0 10px' }}>
              Access is leverage. Leverage is opportunity.
            </div>
            <ul className="auth-aside__list">
              {info.benefits.map(b => (
                <li key={b}>
                  <CheckCircle2 size={18} className="auth-aside__check" /> {b.replace('{COUNT}', instFloor)}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 6px' }}><CardStackArt width={230} /></div>
            <div className="auth-aside__trust">
              {instFloor} verified institutions · 3 bureaus · Every pull confirmed against the official source.
              Secure checkout. Cancel anytime.
            </div>
          </div>
        </aside>

        {/* Form side */}
        <div className="auth-main">
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__sub">Start stacking by bureau in the next 60 seconds.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Creating account...' : `Continue, ${info.badge}`}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            {plan === 'trial'
              ? '$1 today for a 7-day trial (directory, Wins Wall, and starter guides; the live Community Room and advanced playbooks unlock with full membership). Unless you cancel before the trial ends, your subscription continues at $29/month automatically. Cancel anytime in 2 clicks from your Account page.'
              : plan === 'annual'
              ? '$278 billed today, renews yearly until cancelled. Full refund within 14 days. Cancel anytime from your Account page.'
              : '$29 billed monthly until cancelled. Cancel anytime in 2 clicks from your Account page.'}
            {' '}By continuing you agree to the <Link to="/terms" style={{ color: 'var(--teal)', fontWeight: 600 }}>Terms</Link>, <Link to="/privacy" style={{ color: 'var(--teal)', fontWeight: 600 }}>Privacy Policy</Link>, and <Link to="/refunds" style={{ color: 'var(--teal)', fontWeight: 600 }}>Refund Policy</Link>. Educational platform, not financial advice.
          </p>

          <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
