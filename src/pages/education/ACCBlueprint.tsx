import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import SideMenu from '../../components/SideMenu'

const steps = [
  {
    num: '1',
    title: 'Understand the membership lock',
    text: `Most credit unions in this database require membership before you can apply for their products. Membership is usually tied to where you live, where you work, or who you served with, the military, a specific employer, or a geographic region.

That requirement locks most people out of the strongest bureau-specific credit unions in the country. A credit union in Virginia that pulls Equifax does you no good if you live in Texas and have no connection to it.

The membership path is how you unlock those institutions anyway, legally, and through the door the credit union itself leaves open.`,
  },
  {
    num: '2',
    title: 'Join the qualifying association',
    text: `Federal credit unions are allowed to extend membership through "associational common bonds." Instead of requiring you to live or work somewhere, they accept membership in a partner nonprofit or consumer association as your eligibility path.

The American Consumer Council (ACC) is the most widely accepted of these. Many credit unions list ACC membership as a qualifying path right on their own membership page. Joining is typically a small one-time step, sometimes free through a promotion, sometimes a nominal fee.

Once you are an ACC member, you satisfy the membership requirement for every credit union that accepts ACC, without military service, without a specific employer, regardless of your state.`,
  },
  {
    num: '3',
    title: 'Open the credit union account',
    text: `With your association membership in hand, you join the credit union itself, usually by opening a basic savings account with a small minimum deposit (often $5 to $25). That deposit is your share in the credit union and stays yours.

Cost note: association membership is often low-cost, and some partner credit unions cover it entirely during their application flow, check the institution's membership page before paying separately.

You are now a member in full standing. Every credit product the institution offers is available to you: the cards, the lines of credit, the loans, and critically, the specific bureau they pull.`,
  },
  {
    num: '4',
    title: 'Build the relationship before you ask',
    text: `This is the step most people skip, and it is where approvals are actually won. Do not apply for credit the day you join. Credit unions are relationship lenders: they weigh account behavior and internal history, not just your score.

Fund the account. Set up a small recurring deposit. Let the relationship show activity and age. A pledge loan (a small loan secured by your own deposit) can add installment history inside the institution while the relationship matures.

Access gets you in the door. Positioning gets you approved.`,
  },
  {
    num: '5',
    title: 'Stack by bureau, nationwide',
    text: `This is where the membership path becomes a strategy. Once you can join credit unions nationwide, you are no longer limited to whatever your local banks happen to pull. You choose institutions by bureau.

Need to stack on Equifax? Join the credit unions that pull Equifax and reuse inquiries. Targeting TransUnion? Do the same on that bureau. The membership path turns a national map of credit unions into a menu you can order from by bureau, and it sets up repeat funding cycles: access, relationship, funding, then back again as your profile grows.`,
  },
]

const missteps = [
  'Applying immediately after gaining access, the relationship has no history yet, and you burn an inquiry at the weakest possible moment.',
  'Expanding access without a plan, joining ten credit unions means nothing if you have not mapped which bureaus they pull.',
  'Ignoring utilization and inquiry activity while positioning, the profile still decides the approval.',
  'Treating access as the strategy instead of one part of it, access opens the door; profile, positioning, and sequencing walk you through it.',
]

export default function ACCBlueprint() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <h1 className="guide__title">The ACC Blueprint</h1>
        <p className="guide__subtitle">
          How to unlock nationwide credit union access through associational membership, and stack by bureau
          no matter where you live or work.
        </p>

        {/* Intro */}
        <div className="guide__section">
          <div className="guide__body">
            <p>The best bureau-specific credit unions in the country are not your local ones. They are scattered across the map, a flagship Equifax puller in one state, a TransUnion reuse institution in another.</p>
            <p>Most people never reach them because of one word: membership. Credit unions require it, and the obvious paths, military service, a specific employer, a home address in the right county, exclude almost everyone from almost every institution.</p>
            <p>There is a legitimate path through that wall, written into how federal credit unions are allowed to operate. This guide walks it step by step.</p>
          </div>
        </div>

        {/* Why it matters callout */}
        <div className="guide__section">
          <div
            style={{
              background: 'var(--badge-teal-bg)',
              border: '1px solid var(--teal)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>Why this is the keystone</div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Several institutions in this database, including NASA Federal, State Department Federal, and Andrews
              Federal Credit Unions, accept associational membership as your eligibility path. Without it, those
              bureau-specific lenders stay locked. With it, they open nationwide.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="guide__section">
          <h2 className="guide__section-title">The Five-Step Path</h2>
          {steps.map(s => (
            <div key={s.num} className="guide__metric-card">
              <div className="guide__metric-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--navy)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {s.num}
                  </div>
                  <div className="guide__metric-name">{s.title}</div>
                </div>
              </div>
              <div className="guide__metric-text">
                {s.text.split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: 10 }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Common missteps */}
        <div className="guide__section">
          <h2 className="guide__section-title">Common Missteps</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missteps.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--unverified-color)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 16px',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: 'var(--unverified-color)', fontWeight: 800, flexShrink: 0 }}>✕</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verify before you act */}
        <div className="guide__section">
          <h2 className="guide__section-title">Verify Before You Join</h2>
          <div className="guide__body">
            <p>Eligibility paths change. A credit union that accepts a given association today may adjust its requirements tomorrow, and association fees and promotions shift over time.</p>
            <p>Before you join anything, confirm two things on the credit union's own membership page: that they currently accept the association you plan to use, and what the current deposit and eligibility terms are. Never rely on a third-party list, including this one, as your final word. The institution's official site is the source of truth.</p>
          </div>
        </div>

        {/* Closing */}
        <div className="guide__section">
          <h2 className="guide__section-title">One Membership. A National Map.</h2>
          <div className="guide__body">
            <p>The membership path is not a loophole. It is the door credit unions intentionally leave open, and most people simply never learn it exists.</p>
            <p>Learn it once, and the entire national landscape of bureau-specific credit unions becomes accessible to you. That is the difference between hoping your local bank pulls the right bureau and choosing your lenders by bureau on purpose.</p>
            <p><strong>Unlock the map. Choose by bureau. Stack with intention.</strong></p>
          </div>
        </div>

        <div className="guide__cta">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/home')}>
            Find Bureau-Specific Lenders →
          </button>
        </div>

        <div className="guide__disclaimer">
          This content is for educational purposes. Intelligent Funding does not provide personalized financial or
          legal advice, and is not affiliated with the American Consumer Council or any credit union. Membership
          requirements, fees, and eligibility paths are set by each institution and change over time, always verify
          current terms on the official institution website before acting.
        </div>
      </div>
    </div>
  )
}
