import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import SideMenu from '../../components/SideMenu'

const priorities = [
  {
    number: 'PRIORITY 1',
    title: 'Preapproval + Inquiry Reuse (Best Case)',
    text: 'Institution offers preapproval via soft pull AND allows inquiry reuse (one hard pull, multiple products). This is your ideal target. Apply immediately.',
  },
  {
    number: 'PRIORITY 2',
    title: 'Inquiry Reuse Only',
    text: 'No preapproval available, but inquiry reuse is confirmed. Still a strong option. Apply.',
  },
  {
    number: 'PRIORITY 3',
    title: 'Preapproval Only',
    text: 'Inquiry reuse is not available, but the institution offers soft pull preapproval. Single product per application. Apply.',
  },
  {
    number: 'PRIORITY 4',
    title: 'Regular Unsecured Products',
    text: 'No preapproval and no inquiry reuse available. Standard unsecured cards — rewards cards, cash back cards, standard credit lines. Still worth applying if your profile is strong.',
  },
]

const executionSteps = [
  'Prepare your institution list. Use the Capital Access path in Intelligent Funding to identify nine institutions that meet your criteria: preapproval available (soft pull, no hard inquiry), OR inquiry reuse available (one hard pull, multiple products).',
  'Open three browser tabs. Do not submit anything yet.',
  'Fill out applications for three institutions without hitting submit. Option A: all three institutions pull from the same bureau. Option B: one pulls Experian, one pulls Equifax, one pulls TransUnion.',
  'Before you hit submit on any application, confirm all three are open and filled out completely.',
  'Hit submit on all three applications at the exact same time — within seconds of each other.',
  'Check your email for decisions. Approvals typically come within minutes to 24 hours.',
  'Repeat this same process two more times using different institutions on the same bureaus.',
]

export default function StackingMethod() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <h1 className="guide__title">Credit Card Stacking Method</h1>
        <p className="guide__subtitle">
          The step-by-step execution framework for maximizing unsecured credit access across all three bureaus.
        </p>

        {/* Intro */}
        <div className="guide__section">
          <div className="guide__body">
            <p>Credit card stacking is not a shortcut. It is a disciplined method for deploying your positioned credit profile strategically across multiple institutions in a precise sequence.</p>
            <p>You have already built a fundable profile. You have demonstrated payment discipline, managed utilization, and positioned your credit metrics to lender standards. Now stacking is how you convert that positioned profile into actual capital access.</p>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 1 — Prerequisites: Your Profile Must Be Positioned First</h2>
          <div className="guide__body">
            <p><strong>Before you execute a single application, confirm you meet the Profile Positioning standards.</strong></p>
            <p>Check the Profile Positioning guide. Your profile needs:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <li>100% payment history</li>
              <li>6% or lower credit card utilization</li>
              <li>Zero derogatory marks</li>
              <li>5+ years average account age</li>
              <li>Minimum 10 accounts (or on track to build toward 17)</li>
              <li>2 or fewer hard inquiries on your target bureau</li>
            </ul>
            <p>If your profile does not match these standards, do not proceed. Stacking from a weak profile wastes inquiries and damages your access. <strong>Position first. Stack second.</strong></p>
          </div>
        </div>

        {/* Execution */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 2 — The Execution Method: Three Institutions, Simultaneous Submission</h2>
          <div className="guide__body">
            <p><strong>The core principle: Everything happens at the same time.</strong></p>
            <p style={{ marginBottom: 16 }}>When you submit within the same window, lenders pulling your report see one inquiry count on that bureau — not three separate inquiries spread over days or weeks. This protects your inquiry count and maximizes approval odds.</p>
          </div>
          <ol className="guide__numbered-list">
            {executionSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <div className="guide__body" style={{ marginTop: 16 }}>
            <p><strong>Result:</strong> Three hard inquiries per bureau maximum. Nine to fifteen new unsecured products depending on inquiry reuse availability and approval outcomes.</p>
          </div>
        </div>

        {/* Priority Hierarchy */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 3 — The Priority Hierarchy</h2>
          <div className="guide__body" style={{ marginBottom: 20 }}>
            <p>When identifying institutions for each round, prioritize in this exact order. Each priority tier is only explored when the tier above it is exhausted.</p>
          </div>
          {priorities.map(p => (
            <div key={p.number} className="guide__priority-card">
              <div className="guide__priority-number">{p.number}</div>
              <div className="guide__priority-title">{p.title}</div>
              <div className="guide__priority-text">{p.text}</div>
            </div>
          ))}
        </div>

        {/* Product Selection */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 4 — Product Selection: Unsecured Only</h2>
          <div className="guide__body">
            <p>Every product you apply for during stacking must be unsecured — credit cards with actual credit lines, personal lines of credit, or unsecured personal loans.</p>
            <p><strong>No secured cards. No credit builder loans. No deposit-required products.</strong></p>
            <p>You have already passed the credit builder phase. Stacking is exclusively for unsecured product access.</p>
          </div>
        </div>

        {/* Account Age */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 5 — Account Age Management</h2>
          <div className="guide__body">
            <p>Opening nine to fifteen new accounts will lower your average account age. This is expected and temporary — but it needs to be managed.</p>
            <p><strong>The fix:</strong> Before you begin stacking or during the first round, become an authorized user on an established account with: 5+ years of account history, high credit limit, low or zero balance, and perfect payment history.</p>
            <p>That single aged account on your report counterbalances the age impact of your new accounts.</p>
            <p>Ask the primary cardholder which bureaus the account reports to. Not all card issuers report authorized user accounts to all three bureaus.</p>
          </div>
        </div>

        {/* Utilization */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 6 — Utilization During Stacking</h2>
          <div className="guide__body">
            <p>During the stacking rounds, keep all new accounts at zero or near-zero balance.</p>
            <p><strong>Do not use them yet. Do not run balances. Do not test the limits.</strong></p>
            <p>Your utilization is already positioned correctly before the stack begins. Adding balances to nine new accounts immediately spikes your overall utilization, which can trigger declines on later applications in the same stacking sequence.</p>
          </div>
        </div>

        {/* Post-stack */}
        <div className="guide__section">
          <h2 className="guide__section-title">Section 7 — Post-Stacking Execution: The Six-Month Window</h2>
          <div className="guide__body">
            <p>After your three rounds are complete, you now have nine to fifteen new unsecured accounts. The next six months determine whether this stack builds into lasting capital access or stagnates.</p>
            <p><strong>Months 1–6:</strong> Use all accounts, but keep balances low. Put small recurring charges on each card. Make every payment on time, <em>before the statement closing date</em> — not just before the due date.</p>
            <p style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <strong>Why statement closing date matters:</strong> Your card issuer reports your balance on your statement closing date. If you carry a $2,000 balance and pay it before the due date, it may still be reported as $2,000. Pay down balances before your statement closes. Your reported balance will be zero or minimal.
            </p>
            <p><strong>Month 6 — Credit Line Increase Requests:</strong> After six consecutive months of on-time payments, request a credit line increase on each account. Ask the issuer: "Will this require a hard pull or a soft pull?" If hard pull required — decline. If soft pull or internal — request it.</p>
          </div>
        </div>

        {/* Closing */}
        <div className="guide__section">
          <h2 className="guide__section-title">Execute With Precision</h2>
          <div className="guide__body">
            <p>Stacking works because it is systematic. You are not gambling on random applications. You are deploying a positioned profile strategically across verified institutions with clear criteria, in the right sequence, at the right time.</p>
            <p><strong>Position your profile. Execute the stacking method. Season your accounts. Build forward.</strong></p>
          </div>
        </div>

        <div className="guide__cta">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/education/profile-positioning')}>
            View Profile Positioning Guide →
          </button>
        </div>

        <div className="guide__disclaimer">
          This content is for educational purposes. Intelligent Funding does not provide personalized financial or legal advice. Credit outcomes vary based on individual profiles, lender decisions, and market conditions.
        </div>
      </div>
    </div>
  )
}
