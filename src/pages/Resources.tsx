import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Phone, Shield, FileText, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import { BureauMapArt } from '../components/BrandArt'
import SideMenu from '../components/SideMenu'

type Bureau = {
  name: string
  color: string
  bg: string
  phoneLabel: string
  phone: string
  freezeUrl: string
  disputeUrl: string
  reportUrl: string
}

const bureaus: Bureau[] = [
  {
    name: 'Experian',
    color: '#1d4ed8',
    bg: '#eff6ff',
    phoneLabel: 'Freeze Center',
    phone: '888-397-3742',
    freezeUrl: 'https://www.experian.com/freeze/center.html',
    disputeUrl: 'https://www.experian.com/disputes/main.html',
    reportUrl: 'https://www.experian.com/help/',
  },
  {
    name: 'Equifax',
    color: '#15803d',
    bg: '#f0fdf4',
    phoneLabel: 'Security Freeze',
    phone: '888-298-0045',
    freezeUrl: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/',
    disputeUrl: 'https://www.equifax.com/personal/disputes/',
    reportUrl: 'https://www.equifax.com/personal/',
  },
  {
    name: 'TransUnion',
    color: '#7e22ce',
    bg: '#faf5ff',
    phoneLabel: 'Service Center',
    phone: '800-916-8800',
    freezeUrl: 'https://www.transunion.com/credit-freeze',
    disputeUrl: 'https://www.transunion.com/credit-disputes/dispute-your-credit',
    reportUrl: 'https://www.transunion.com/credit-help',
  },
]

const govResources = [
  {
    icon: FileText,
    name: 'AnnualCreditReport.com',
    desc: 'The only federally authorized source for your free credit reports from all three bureaus. You are entitled to free reports, never pay for them here.',
    phone: '877-322-8228',
    url: 'https://www.annualcreditreport.com',
    cta: 'Get Free Reports',
  },
  {
    icon: Shield,
    name: 'CFPB, Consumer Financial Protection Bureau',
    desc: 'Federal agency that handles complaints against lenders, banks, and credit bureaus. If a dispute is ignored or you are treated unfairly, file here. They get results.',
    phone: '855-411-2372',
    url: 'https://www.consumerfinance.gov/complaint/',
    cta: 'File a Complaint',
  },
  {
    icon: AlertTriangle,
    name: 'FTC, IdentityTheft.gov',
    desc: 'The official government resource for reporting identity theft and getting a personal recovery plan. Start here if accounts are opened in your name.',
    phone: '877-438-4338',
    url: 'https://www.identitytheft.gov',
    cta: 'Report & Recover',
  },
]

export default function Resources() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 10px' }}><BureauMapArt width={250} /></div>
        <h1 className="guide__title">Resources</h1>
        <p className="guide__subtitle">
          The official numbers, links, and tools you need to monitor, dispute, and protect your credit.
          Every link goes to the source, no middlemen.
        </p>

        {/* Free reports + government */}
        <div className="guide__section">
          <h2 className="guide__section-title">Monitor & Protect</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {govResources.map(r => {
              const Icon = r.icon
              return (
                <div
                  key={r.name}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 20,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'var(--badge-teal-bg)',
                      color: 'var(--teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{r.name}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
                      {r.desc}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn--teal btn--sm">
                        {r.cta} <ExternalLink size={12} />
                      </a>
                      <a
                        href={`tel:${r.phone.replace(/-/g, '')}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 600, fontSize: '0.9rem' }}
                      >
                        <Phone size={14} /> {r.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* The three bureaus */}
        <div className="guide__section">
          <h2 className="guide__section-title">The Three Credit Bureaus</h2>
          <div className="guide__body" style={{ marginBottom: 16 }}>
            <p>
              Freeze your credit when you are not actively applying, it blocks new accounts and stops fraud cold.
              Unfreeze in minutes when you are ready to stack. Disputes are free and a federal right.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {bureaus.map(b => (
              <div
                key={b.name}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ background: b.bg, padding: '14px 18px', borderBottom: `2px solid ${b.color}` }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: b.color }}>{b.name}</div>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {b.phoneLabel}
                    </div>
                    <a
                      href={`tel:${b.phone.replace(/-/g, '')}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 700, fontSize: '1rem' }}
                    >
                      <Phone size={15} /> {b.phone}
                    </a>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <a href={b.freezeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: b.color, fontWeight: 600, fontSize: '0.88rem' }}>
                      <Shield size={14} /> Freeze / Unfreeze <ExternalLink size={11} />
                    </a>
                    <a href={b.disputeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: b.color, fontWeight: 600, fontSize: '0.88rem' }}>
                      <FileText size={14} /> File a Dispute <ExternalLink size={11} />
                    </a>
                    <a href={b.reportUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: b.color, fontWeight: 600, fontSize: '0.88rem' }}>
                      <ExternalLink size={14} /> Help Center
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why it matters for stacking */}
        <div className="guide__section">
          <h2 className="guide__section-title">How This Connects to Your Stack</h2>
          <div className="guide__body">
            <p>
              Knowing which bureau each institution pulls is only half the strategy. The other half is controlling
              what those bureaus show. Pull your free reports first. Dispute errors before you apply, a single
              inaccurate late payment can drop you below an approval threshold.
            </p>
            <p>
              Freeze the bureaus you are not targeting so no surprise pull lands where you do not want it. When you
              are ready to stack on your strongest bureau, unfreeze it, apply in sequence, and re-freeze when you are done.
            </p>
          </div>
        </div>

        <div className="guide__cta">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/home')}>
            Back to Your Pathway →
          </button>
        </div>

        <div className="guide__disclaimer">
          Phone numbers and links verified against official bureau and government sources. Always confirm contact
          details on the institution's own website before sharing personal information. Intelligent Funding is an
          educational platform and does not provide personalized financial or legal advice.
        </div>
      </div>
    </div>
  )
}
