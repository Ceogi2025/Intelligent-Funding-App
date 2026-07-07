import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import SideMenu from '../../components/SideMenu'

const metrics = [
  {
    name: 'METRIC 1, PAYMENT HISTORY',
    target: '100%',
    impact: 'High',
    impactColor: '#ef4444',
    text: `This is the single most important factor on your credit report. Lenders want to see that you pay every obligation on time, every time. One missed payment can stay on your report for seven years and signal risk to every lender who sees it.

What lenders want to see: No late payments. No collections. No charge-offs. A clean record going back as far as your report shows.

How to fix it if you are not there: Set autopay for every account, minimum payment at minimum, full balance if possible. If you have a late payment, the impact fades over time but the record stays. The best thing you can do is stack clean payments on top of it starting today.`,
  },
  {
    name: 'METRIC 2, CREDIT CARD UTILIZATION',
    target: '6% or lower',
    impact: 'High',
    impactColor: '#ef4444',
    text: `Utilization is the ratio of your current credit card balances to your total credit card limits. It is calculated both across all your cards combined and on each individual card.

What lenders want to see: Single-digit utilization. A borrower carrying 6% or less across all cards signals that they have access to credit and are not dependent on it.

How to fix it: Pay down balances. If you cannot pay them down immediately, request a credit limit increase on existing accounts to lower your ratio. Pay before your statement closes, not just before the due date, so the lower balance is what gets reported to the bureaus.`,
  },
  {
    name: 'METRIC 3, DEROGATORY MARKS',
    target: 'Zero',
    impact: 'High',
    impactColor: '#ef4444',
    text: `Derogatory marks include late payments, collections, charge-offs, bankruptcies, foreclosures, repossessions, and tax liens. Any of these on your report signals significant risk to lenders.

What lenders want to see: A completely clean record. No derogatory items at any point in your report history.

How to fix it: For collections, review whether the debt is within the statute of limitations for your state before paying. Negotiating pay-for-delete with the creditor removes the mark entirely, which is always preferable to a paid collection remaining on your report.`,
  },
  {
    name: 'METRIC 4, AGE OF CREDIT HISTORY',
    target: '5 years 9 months avg',
    impact: 'Medium',
    impactColor: '#f59e0b',
    text: `The age of your credit history includes the age of your oldest account, your newest account, and the average age across all accounts. Opening multiple new accounts lowers your average age.

What lenders want to see: A profile that has been managed responsibly over years, not months. An average age approaching or exceeding five years signals stability.

How to fix it: Time is the only cure for account age, but you can accelerate the impact by becoming an authorized user on an established account with 5+ years of history, high credit limit, low utilization, and perfect payment history.`,
  },
  {
    name: 'METRIC 5, TOTAL ACCOUNTS',
    target: '17 accounts',
    impact: 'Low',
    impactColor: '#6B7280',
    text: `Profile depth, the number of active accounts on your report, signals to lenders that multiple institutions have extended credit to you and you have managed all of them responsibly.

What lenders want to see: A deep file with a mix of revolving accounts (credit cards, lines of credit) and installment accounts (loans). Diversity across account types and institutions matters.

How to fix it: Build toward 17 accounts deliberately and strategically. Start with secured products if you are early in your profile building. Use the Credit Builder path in Intelligent Funding to identify the right starting institutions.`,
  },
  {
    name: 'METRIC 6, HARD INQUIRIES',
    target: '2 or fewer per bureau',
    impact: 'Low',
    impactColor: '#6B7280',
    text: `A hard inquiry occurs every time you apply for credit and a lender pulls your credit report. Hard inquiries temporarily lower your score and signal to other lenders that you are actively seeking credit.

What lenders want to see: Minimal recent inquiries. A clean inquiry count on a bureau signals that you are not urgently seeking capital, which is exactly what you want lenders to believe even when you are actively building your stack.

How to fix it: Stop applying for credit randomly. Every application costs you an inquiry. The stacking strategy in Intelligent Funding is specifically designed to maximize what you access per inquiry.`,
  },
]

export default function ProfilePositioning() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <h1 className="guide__title">Profile Positioning</h1>
        <p className="guide__subtitle">
          What a funded credit profile actually looks like, and how to build one.
        </p>

        {/* Intro */}
        <div className="guide__section">
          <div className="guide__body">
            <p>Most people focus on their credit score. Lenders evaluate something more important: your credit profile.</p>
            <p>A score is a number. A profile is a structure. You can have a 720 score with a thin file and get denied for a $5,000 credit card. You can have a 680 score with a deep, positioned profile and get approved for $50,000 in unsecured credit lines.</p>
            <p>The difference is not luck. It is architecture.</p>
            <p>This guide defines exactly what a positioned credit profile looks like, the six metrics that matter, what lenders want to see in each one, and how to close any gaps before you execute a stacking strategy.</p>
          </div>
        </div>

        {/* Summary table */}
        <div className="guide__section">
          <h2 className="guide__section-title">The Funded Profile at a Glance</h2>
          <table className="guide__table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Target Standard</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Payment History</td><td>100% on-time</td><td style={{ color: '#ef4444', fontWeight: 700 }}>High</td></tr>
              <tr><td>Credit Card Utilization</td><td>6% or lower</td><td style={{ color: '#ef4444', fontWeight: 700 }}>High</td></tr>
              <tr><td>Derogatory Marks</td><td>Zero</td><td style={{ color: '#ef4444', fontWeight: 700 }}>High</td></tr>
              <tr><td>Age of Credit History</td><td>5 years 9 months avg</td><td style={{ color: '#f59e0b', fontWeight: 700 }}>Medium</td></tr>
              <tr><td>Total Accounts</td><td>17</td><td style={{ color: '#6B7280', fontWeight: 600 }}>Low</td></tr>
              <tr><td>Hard Inquiries</td><td>2 or fewer per bureau</td><td style={{ color: '#6B7280', fontWeight: 600 }}>Low</td></tr>
            </tbody>
          </table>
        </div>

        {/* Individual metrics */}
        <div className="guide__section">
          <h2 className="guide__section-title">The Six Profile Metrics</h2>
          {metrics.map(m => (
            <div key={m.name} className="guide__metric-card">
              <div className="guide__metric-header">
                <div>
                  <div className="guide__metric-name">{m.name}</div>
                  <div className="guide__metric-target">{m.target}</div>
                </div>
                <div className="guide__metric-impact" style={{ color: m.impactColor }}>
                  {m.impact} Impact
                </div>
              </div>
              <div className="guide__metric-text">
                {m.text.split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: 10 }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div className="guide__section">
          <h2 className="guide__section-title">Position First. Stack Second.</h2>
          <div className="guide__body">
            <p>A funded credit profile is not built in a day. But every decision you make from today forward either moves you toward this standard or away from it.</p>
            <p>Check your profile against these six metrics. Close the gaps methodically. When your profile meets the positioning standard, the stacking strategy becomes a system for accessing capital at will, not a gamble with an uncertain outcome.</p>
            <p><strong>Know your numbers. Build with intention. Execute when ready.</strong></p>
          </div>
        </div>

        <div className="guide__cta">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/home')}>
            Start with Capital Access →
          </button>
        </div>

        <div className="guide__disclaimer">
          This content is for educational purposes. Intelligent Funding does not provide personalized financial or legal advice. Credit outcomes vary based on individual profiles, lender decisions, and market conditions.
        </div>
      </div>
    </div>
  )
}
