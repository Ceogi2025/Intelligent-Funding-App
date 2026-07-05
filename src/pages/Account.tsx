import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, ExternalLink } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const statusLabels: Record<string, string> = {
  trial: '7-Day Trial — active',
  active: 'Active subscription',
  inactive: 'No active subscription',
}

export default function Account() {
  const { user, token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function openBillingPortal() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error === 'Payment not configured'
        ? 'Billing portal opens once payments go live. Need help now? Email support@intelligentfunding.org.'
        : data.error || 'Could not open the billing portal — email support@intelligentfunding.org and we will handle it.')
    } catch {
      setError('Connection error. Try again, or email support@intelligentfunding.org.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="page" style={{ flex: 1, maxWidth: 560 }}>
        <h1 style={{ marginBottom: 24 }}>Account</h1>

        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
          <div className="detail-label">Email</div>
          <div className="detail-value" style={{ marginBottom: 16 }}>{user?.email}</div>

          <div className="detail-label">Subscription</div>
          <div className="detail-value" style={{ marginBottom: 4 }}>
            {statusLabels[user?.subscription_status || 'inactive'] || user?.subscription_status}
          </div>
          {user?.subscription_end_date && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Current period ends: {new Date(user.subscription_end_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn btn--primary btn--full"
          onClick={openBillingPortal}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <CreditCard size={16} />
          {loading ? 'Opening…' : 'Manage Subscription'}
          <ExternalLink size={13} />
        </button>

        <p style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Update your card, switch plans, or <strong>cancel anytime</strong> — no phone calls, no hoops.
          Cancelling stops future charges; you keep access through the period you've paid for.
          Full details in the <Link to="/refunds" style={{ color: 'var(--teal)', fontWeight: 600 }}>Refund Policy</Link>.
        </p>
      </div>
      <Footer />
    </div>
  )
}
