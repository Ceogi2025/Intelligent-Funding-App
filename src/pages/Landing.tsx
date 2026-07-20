import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Zap, Users, ArrowRight, Sparkles, FileText, Search, Trophy, MessagesSquare } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { CommunityArt, BureauMapArt } from '../components/BrandArt'
import { track } from '../lib/track'

// Bureau tile counts derive LIVE from the public directory (never hardcoded — stale
// numbers on the landing page undersell the catalog). Fallback text is evergreen.
const bureauTileDefs = [
  { name: 'Experian', color: '#1e40af' },
  { name: 'Equifax', color: '#0891b2' },
  { name: 'TransUnion', color: '#6366f1' },
]

const edges = [
  {
    icon: ShieldCheck,
    title: 'Verified by Bureau',
    text: 'Every pull is confirmed at the product level against the institution’s official website. Not guessed. Not scraped. When we don’t know, we say so.',
  },
  {
    icon: Zap,
    title: 'Built for Inquiry Reuse',
    text: 'We map which institutions let one hard pull open multiple accounts, and the window to do it. No other directory tracks this.',
  },
  {
    icon: Users,
    title: 'For the Underserved',
    text: 'Built for the communities the big comparison sites overlook. Real access, real strategy, real wealth-building, by design.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  // Live counts (consumer + business combined), the landing page can never go stale as the directory grows
  const [counts, setCounts] = useState<{ inst: number; prod: number } | null>(null)
  const [bureauCounts, setBureauCounts] = useState<Record<string, number> | null>(null)
  useEffect(() => { track('landing_view') }, [])
  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.json())
      .then(d => {
        if (d && typeof d.inst === 'number' && d.inst > 0) {
          setCounts({ inst: d.inst, prod: d.prod })
        }
      })
      .catch(() => {})
    // Live per-bureau counts from the free directory (bureaus array per institution)
    fetch('/api/public/institutions')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          const tally: Record<string, number> = {}
          d.forEach((i: { bureaus?: string[] }) => (i.bureaus || []).forEach(b => { tally[b] = (tally[b] || 0) + 1 }))
          setBureauCounts(tally)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero__inner fade-up">
          <div className="lp-hero__eyebrow">
            <Sparkles size={13} /> Powered by the Economic Algorithm
          </div>
          <h1 className="lp-hero__headline">
            Stack by Bureau.<br /><span className="accent">Get Funded by Design.</span>
          </h1>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.005em', color: 'var(--bright, #22d3ee)', margin: '2px 0 14px' }}>
            Access is leverage. Leverage is opportunity.
          </div>
          <p className="lp-hero__sub">
            The only bureau-stacking app with a community behind it. Map your strongest bureau, reuse
            inquiries, and apply with a plan, not a guess. Members trade real approvals and live strategy
            in a members-only room.
          </p>
          <div className="lp-hero__ctas">
            <button className="btn btn--teal btn--lg" onClick={() => { track('landing_cta'); navigate('/signup') }}>
              Get Started — $1 for 7 Days
            </button>
            <button className="btn btn--lg btn--hero-ghost" onClick={() => navigate('/demo')}>
              ▶ Watch It Work
            </button>
          </div>
          <div className="lp-hero__trust">
            <span><ShieldCheck size={13} /> {counts ? `${Math.floor(counts.inst / 10) * 10}+ verified institutions` : '90+ verified institutions'}</span>
            <span>·</span>
            <span>A live member community</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="lp-stats">
        <div className="lp-stat"><div className="lp-stat__num">{counts ? `${Math.floor(counts.inst / 10) * 10}+` : '90+'}</div><div className="lp-stat__label">Verified Institutions</div></div>
        <div className="lp-stat"><div className="lp-stat__num">{counts ? `${Math.floor(counts.prod / 10) * 10}+` : '220+'}</div><div className="lp-stat__label">Products Mapped</div></div>
        <div className="lp-stat"><div className="lp-stat__num">3</div><div className="lp-stat__label">Credit Bureaus</div></div>
        <div className="lp-stat"><div className="lp-stat__num">0</div><div className="lp-stat__label">Guesswork</div></div>
      </div>

      {/* Community, the core reframe: this is a room, not a directory */}
      <section className="lp-section" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 10 }}>
          <Users size={14} /> This isn't an app. It's a room.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 10px' }}><CommunityArt width={300} /></div>
        <h2 className="lp-section__title">You're not getting funded alone anymore</h2>
        <p className="lp-section__sub">
          Most funding sites hand you a list and wish you luck. We hand you a community, a live room where
          members post real approvals, real denials, and the strategy behind them, as it happens. You move
          faster because you're not guessing by yourself.
        </p>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 330px))', justifyContent: 'center', gap: 14 }}>
          <div className="lp-edge-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/wins')}>
            <div className="lp-edge-card__icon"><Trophy size={22} /></div>
            <div className="lp-edge-card__title">The Wins Wall</div>
            <div className="lp-edge-card__text">
              Real approvals from members, which bureau pulled, what limit came through, whether the inquiry
              got reused. Dated, so you always know how fresh it is. <span style={{ color: 'var(--teal)', fontWeight: 600 }}>See the wall →</span>
            </div>
          </div>
          <div className="lp-edge-card">
            <div className="lp-edge-card__icon"><MessagesSquare size={22} /></div>
            <div className="lp-edge-card__title">The Community Room</div>
            <div className="lp-edge-card__text">
              A live, members-only room where people trade strategy and wins in real time. No selling, no
              spam, just people getting funded, helping the next person do the same.
            </div>
          </div>
        </div>
      </section>

      {/* Bureau tiles */}
      <section className="lp-section">
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 8px' }}><BureauMapArt width={270} /></div>
        <h2 className="lp-section__title">Start With Your Bureau</h2>
        <p className="lp-section__sub">
          Pick the bureau where your credit is strongest. We’ll show you every institution that pulls it,
          and which ones let you stack on a single inquiry.
        </p>
        <div className="lp-bureau-grid">
          {bureauTileDefs.map(t => (
            <button
              key={t.name}
              className="lp-bureau-tile"
              style={{ borderTopColor: t.color }}
              onClick={() => navigate('/signup')}
            >
              <div className="lp-bureau-tile__name" style={{ color: t.color }}>{t.name}</div>
              <div className="lp-bureau-tile__count">{bureauCounts && bureauCounts[t.name] ? `${bureauCounts[t.name]} verified institutions` : 'Mapped & verified'}</div>
              <div className="lp-bureau-tile__arrow" style={{ color: t.color }}>
                Explore <ArrowRight size={14} />
              </div>
            </button>
          ))}
          <button className="lp-bureau-tile" style={{ borderTopColor: '#475569' }} onClick={() => navigate('/signup')}>
            <div className="lp-bureau-tile__name" style={{ color: '#475569' }}>Build Credit</div>
            <div className="lp-bureau-tile__count">No score? Start here</div>
            <div className="lp-bureau-tile__arrow" style={{ color: '#475569' }}>
              Explore <ArrowRight size={14} />
            </div>
          </button>
        </div>
      </section>

      {/* Why IF, differentiators */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <h2 className="lp-section__title">Why Intelligent Funding</h2>
        <p className="lp-section__sub">
          Other sites tell you which card has the best rewards. We tell you how to actually get approved, in sequence, by bureau.
        </p>
        <div className="lp-edge-grid">
          {edges.map(e => {
            const Icon = e.icon
            return (
              <div key={e.title} className="lp-edge-card">
                <div className="lp-edge-card__icon"><Icon size={22} /></div>
                <div className="lp-edge-card__title">{e.title}</div>
                <div className="lp-edge-card__text">{e.text}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Free tools strip */}
      <section style={{ background: '#f8faff', borderTop: '1px solid var(--border)', padding: '28px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <Link to="/banks" style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', background: '#fff' }}>
            <Search size={20} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              <strong>Free directory:</strong> which bureau does each bank pull?
            </span>
          </Link>
          <Link to="/cheat-sheet" style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', background: '#fff' }}>
            <FileText size={20} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              <strong>Free cheat sheet:</strong> the 3 questions before any application
            </span>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="how-it-works__title">How It Works</h2>
          <div className="how-it-works__steps">
            <div className="step">
              <div className="step__number">1</div>
              <div className="step__title">Choose Your Path</div>
              <p className="step__text">
                Building a stack of unsecured credit? Or starting from scratch with secured products?
                Select the path that matches where you are.
              </p>
            </div>
            <div className="step">
              <div className="step__number">2</div>
              <div className="step__title">Target Your Bureau</div>
              <p className="step__text">
                Select your strongest bureau, Experian, Equifax, or TransUnion.
                Filter by inquiry reuse and soft pull preapproval to protect your inquiry count.
              </p>
            </div>
            <div className="step">
              <div className="step__number">3</div>
              <div className="step__title">Apply With Strategy</div>
              <p className="step__text">
                Get matched to verified institutions. See every product, every requirement,
                and every bureau pull, before you apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <h2 className="pricing-section__title">Simple Pricing</h2>
          <p className="pricing-section__sub">Start for $1. Unlock the full community for $29, cancel anytime.</p>
          <div className="pricing__cards">
            {/* Trial */}
            <div className="pricing-card">
              <div className="pricing-card__plan">7-Day Access</div>
              <div className="pricing-card__price">
                $1 <span>/ 7 days</span>
              </div>
              <ul className="pricing-card__features" style={{ marginTop: 16 }}>
                <li>The full bureau directory (85+ institutions)</li>
                <li>The Wins Wall, real member approvals</li>
                <li>2 starter strategy guides</li>
                <li>A preview of the live Community Room</li>
              </ul>
              <button className="btn btn--primary btn--full" onClick={() => navigate('/signup?plan=trial')}>
                Get Started
              </button>
            </div>

            {/* Monthly */}
            <div className="pricing-card">
              <div className="pricing-card__plan">Monthly</div>
              <div className="pricing-card__price">
                $29 <span>/ month</span>
              </div>
              <ul className="pricing-card__features" style={{ marginTop: 16 }}>
                <li>Everything in the 7-day trial</li>
                <li>★ The live Community Room</li>
                <li>All 4 strategy playbooks + post your wins</li>
                <li>Cancel anytime</li>
              </ul>
              <button className="btn btn--primary btn--full" onClick={() => navigate('/signup?plan=monthly')}>
                Get Started
              </button>
            </div>

            {/* Annual */}
            <div className="pricing-card pricing-card--featured">
              <div className="pricing-card__best-value">BEST VALUE — SAVE 20%</div>
              <div className="pricing-card__plan" style={{ marginTop: 8 }}>Annual</div>
              <div className="pricing-card__price">
                $278 <span>/ year</span>
              </div>
              <ul className="pricing-card__features" style={{ marginTop: 16 }}>
                <li>Everything in Monthly</li>
                <li>Save $70 vs monthly</li>
                <li>Priority support</li>
                <li>Cancel anytime</li>
              </ul>
              <button className="btn btn--teal btn--full" onClick={() => navigate('/signup?plan=annual')}>
                Get Annual Access
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
