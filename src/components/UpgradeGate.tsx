import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'

// Shown when a trial user hits a full-member-only surface (advanced playbooks, etc.).
// The live Community Room does NOT use this, it has its own in-place blurred teaser.
export default function UpgradeGate({ feature = 'This' }: { feature?: string }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="page" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 460, textAlign: 'center', padding: '32px 28px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--navy, #1e40af)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} />
          </div>
          <h1 style={{ marginBottom: 10 }}>A full-member perk</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            {feature} unlocks with full membership, $29/month or $278/year. Your $1 trial still includes
            the full directory, the Wins Wall, and the starter strategy guides.
          </p>
          <button className="btn btn--primary" style={{ gap: 6 }} onClick={() => navigate('/account')}>
            Go full member <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
