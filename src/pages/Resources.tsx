import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Phone, Shield, FileText, AlertTriangle, Building2, Hash, Landmark, Globe } from 'lucide-react'
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

// The Business Setup Toolkit. Every link is the OFFICIAL / free source.
// `monetizable: true` = a category where an affiliate/partner program may exist
// later (business banking, phone, domain, email). We ship official links now and
// swap in partner links only after Grams vets a program. EIN and DUNS are always
// free and stay pointed at the government / D&B direct source, never monetized.
const setupToolkit: {
  icon: typeof Building2
  step: string
  name: string
  desc: string
  url: string
  cta: string
  free?: boolean
  monetizable?: boolean
}[] = [
  {
    icon: Hash,
    step: 'Step 1',
    name: 'Get your EIN (Federal Tax ID)',
    desc: 'Your business Social Security number. Required for a business bank account and any EIN-only funding. It is 100% free directly from the IRS and takes about 10 minutes.',
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
    cta: 'Apply Free at IRS.gov',
    free: true,
  },
  {
    icon: Building2,
    step: 'Step 2',
    name: 'Form your LLC or corporation',
    desc: 'Register the entity with your state. Filing is done through your state\'s Secretary of State office. The SBA guide below routes you to the right one and walks the whole setup.',
    url: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business',
    cta: 'SBA Registration Guide',
    monetizable: true,
  },
  {
    icon: Hash,
    step: 'Step 3',
    name: 'Get your D-U-N-S Number',
    desc: 'Dun & Bradstreet\'s business identifier, the backbone of your business credit file. Lenders and net-30 vendors check it. Free directly from D&B (allow a few days for the free option).',
    url: 'https://www.dnb.com/duns-number/get-a-duns.html',
    cta: 'Get a D-U-N-S Free',
    free: true,
  },
  {
    icon: Landmark,
    step: 'Step 4',
    name: 'Open a business bank account',
    desc: 'Separate business banking is non-negotiable, it is the deposit history no-doc lenders read. Open it day one and feed it. Compare accounts by fees, minimums, and bonuses.',
    url: 'https://www.nerdwallet.com/best/small-business/business-checking-accounts',
    cta: 'Compare Business Accounts',
    monetizable: true,
  },
  {
    icon: Phone,
    step: 'Step 5',
    name: 'Get a business phone number',
    desc: 'A dedicated business line makes you look legitimate to lenders and keeps your personal number private. Google Voice is a free starting point; paid services add more.',
    url: 'https://voice.google.com/',
    cta: 'Start with Google Voice',
    monetizable: true,
  },
  {
    icon: Globe,
    step: 'Step 6',
    name: 'Register a domain + business email',
    desc: 'A matching website domain and a name@yourbusiness.com email signal a real operation. Many funding applications and vendor accounts expect a business email, not a Gmail.',
    url: 'https://www.namecheap.com/',
    cta: 'Get a Domain',
    monetizable: true,
  },
]

const fieldNotes = [
  {
    title: 'Feed the account before you need it',
    body: 'No-doc lenders read your deposit history, not your tax returns. Open the business checking day one and run consistent deposits through it (about $250/week for 12 weeks, daily is even better). You are manufacturing the record that gets read.',
  },
  {
    title: 'Split income and expenses',
    body: 'Keep one business checking for income only and one for expenses. Your 3-month statements then show a clean, rising average daily balance, which is exactly what funding applications reward.',
  },
  {
    title: 'Know the no-doc trade-off',
    body: 'Bank-statement underwriting funds you fast with no tax returns, but the cost of capital is usually higher. Know when speed is worth the rate and when it is not.',
  },
  {
    title: 'Build business credit before chasing EIN-only',
    body: 'If your personal credit is not strong yet, build the business profile through net-30 vendor tradelines that report to the business bureaus. No personal-guarantee funding only works once the business can stand on its own.',
  },
  {
    title: 'Mind the UCC-1 line',
    body: 'Larger approvals can trigger a UCC-1 lien that ties up your business assets and blocks the next lender. Sometimes taking the smaller offer keeps you lien-free to stack elsewhere.',
  },
  {
    title: 'CDFIs are the low-score door',
    body: 'When big banks say no, mission lenders (CDFIs) often say yes. They lend on your business plan and community impact, not just your score, and many run 0% or below-market programs. Come with a package: business plan, proof of income, projections, and a use-of-funds statement.',
  },
  {
    title: 'Do not let IRS debt kill the deal',
    body: 'Lenders pull your tax transcripts. If you owe, at minimum get on a repayment plan so it does not block funding. Haven’t filed yet? A filed extension plus a year-end P&L and balance sheet can stand in.',
  },
  {
    title: 'Skip the shelf corp',
    body: 'Buying an aged shell company or seasoned tradelines is money down the drain, lenders in 2026 do not care about them. That capital is far better spent building a real, cash-flowing business.',
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
          The Economic Algorithm, start to finish. Set up your business, monitor and protect your credit,
          then stack by bureau. Every link below goes straight to the official source. No middlemen.
        </p>

        {/* Business setup toolkit */}
        <div className="guide__section">
          <h2 className="guide__section-title">Business Setup Toolkit</h2>
          <div className="guide__body" style={{ marginBottom: 16 }}>
            <p>
              Everything you need to stand up a fundable business, in order. Do these before you apply for
              business funding, lenders check for them. The essentials are free; we point you to the official
              source every time.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {setupToolkit.map(t => {
              const Icon = t.icon
              return (
                <div
                  key={t.name}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, background: 'var(--badge-teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={19} />
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                      {t.step}
                    </div>
                    {t.free && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 800, color: 'var(--teal)', background: 'var(--badge-teal-bg)', padding: '3px 8px', borderRadius: 999 }}>FREE</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--navy)' }}>{t.name}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0, flex: 1 }}>{t.desc}</p>
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn btn--teal btn--sm" style={{ alignSelf: 'flex-start' }}>
                    {t.cta} <ExternalLink size={12} />
                  </a>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 12, fontStyle: 'italic' }}>
            Heads up: your EIN and D-U-N-S number are always free from the government and Dun &amp; Bradstreet directly.
            Never pay a third party for either one.
          </p>
        </div>

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

        {/* Funding field notes */}
        <div className="guide__section">
          <h2 className="guide__section-title">Funding Field Notes</h2>
          <div className="guide__body" style={{ marginBottom: 16 }}>
            <p>
              Hard-won strategy from the community and our research, the things that decide whether you get
              funded. These teach how the game works. They are educational, not personalized advice, and any
              specific lender term still gets verified on the official source before you act.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {fieldNotes.map(n => (
              <div
                key={n.title}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                  borderLeft: '3px solid var(--teal)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: 6, color: 'var(--navy)' }}>{n.title}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{n.body}</p>
              </div>
            ))}
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
