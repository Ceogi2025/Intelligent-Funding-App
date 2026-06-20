import { useState } from 'react'
import Header from '../../components/Header'
import SideMenu from '../../components/SideMenu'

export default function WealthyPlaybook() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <h1 className="guide__title">The Wealthy Person's Playbook</h1>
        <p className="guide__subtitle">
          What smart money knows about credit that most people never learn.
        </p>

        <div className="guide__section">
          <div className="guide__body">
            <p>There is a reason wealthy people never seem to run out of money.</p>
            <p>It is not luck. It is not just income. It is architecture — the deliberate way they structure their access to capital so that no single event, no single expense, and no single business decision ever cuts them off from funding.</p>
            <p>Most people have one funding stream. When it runs dry — because of a bad month, a business expense, or a string of decisions that maxed out their credit — they are stuck. No access. No options. No moves.</p>
            <p>Wealthy people build two streams. Personal credit on one side. Business credit on the other. Completely separate. Each one protected from what happens on the other side.</p>
            <p><strong>This is the playbook.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 1 — The Fundamental Mistake Most People Make</h2>
          <div className="guide__body">
            <p>Most people treat their personal credit like a business account.</p>
            <p>They use personal credit cards for business expenses. They run high balances funding their operations. They max out personal lines of credit on inventory, equipment, or overhead. And when the business slows down — or when an opportunity comes up and they need capital — their personal credit is already exhausted.</p>
            <p>The score tanks. The utilization spikes. The lenders say no.</p>
            <p>Now they have no access on either side. Personal credit is damaged. Business credit was never built. They are completely exposed.</p>
            <p><strong>This is not a money problem. It is a structure problem.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 2 — Why You Never Use Personal Credit for Business</h2>
          <div className="guide__body">
            <p>When you use personal credit cards for business expenses, every dollar you spend shows up on your personal credit report as utilization. Every balance you carry raises your personal utilization ratio. Every maxed card damages your personal score. Every decline on a personal card means one less move available to you.</p>
            <p><strong>You are spending down the one asset that keeps you fundable.</strong></p>
            <p>Business expenses belong on business credit. Period. The moment you blur that line — even once, even for a quick expense you plan to pay back — you are eroding the wall that protects your personal profile.</p>
            <p>The separation is not just strategy. It is discipline. Wealthy people do not use personal credit for business because they understand what that wall is worth. Once it is down, rebuilding it costs time, money, and missed opportunities.</p>
            <p><strong>Protect the wall. Keep business on the business side. Always.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 3 — The Two Stream Strategy</h2>
          <div className="guide__body">
            <p>Wealthy people do not use one pool of credit. They build two completely separate streams.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0' }}>
            <div style={{ border: '2px solid var(--navy)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Stream One — Personal Credit</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Kept pristine. Low utilization. Perfect payment history. Zero derogatory marks. Multiple unsecured accounts with strong limits. This stream is protected at all costs. It is never exhausted by business activity.
              </p>
            </div>
            <div style={{ border: '2px solid var(--teal)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>Stream Two — Business Credit</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Built separately under the business entity. Reported to business credit bureaus — Dun & Bradstreet, Experian Business, Equifax Business. Does not appear on personal credit reports. Does not affect personal utilization.
              </p>
            </div>
          </div>
          <div className="guide__body">
            <p style={{ background: '#eff6ff', padding: 16, borderRadius: 8, margin: '16px 0' }}>
              <strong>Why this matters — and this is critical:</strong> Business credit utilization does not report to your personal credit bureaus. Ever. You can use every single dollar of your business credit and your personal credit score does not move. Read that again. One hundred percent business credit utilization. Zero impact on personal credit.
            </p>
            <p>That is the wall that separates the two streams. Business activity stays on the business side. Personal credit stays protected no matter what happens on the business side.</p>
            <p>And here is where it gets even more powerful. If your business credit is fully deployed and you need more capital, your clean personal profile allows you to personally guarantee additional business funding. Lenders look at your personal credit, see a pristine borrower, and extend another round of business credit under your company name.</p>
            <p><strong>Two streams. Unlimited rounds. One mission.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 4 — How Strong Personal Credit Unlocks Business Funding</h2>
          <div className="guide__body">
            <p>Business credit does not build itself. In the early stages, most business lenders require a personal guarantee — meaning they evaluate your personal credit profile before extending business credit to your company.</p>
            <p>This is where the stacking work pays off.</p>
            <p>When your personal credit profile is positioned — 680 or higher across all three bureaus, clean payment history, low utilization, strong account depth — lenders see a borrower they can trust. They extend business credit under your company name, backed by your personal guarantee.</p>
            <p>Over time, as your business credit builds its own history, the personal guarantee becomes less necessary. The business stands on its own. But in the beginning, your personal credit is the key that opens the business credit door.</p>
            <p><strong>Position personal credit first. Use it to unlock business credit. Then protect both.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 5 — How to Start Building Business Credit</h2>
          <div className="guide__body">
            <p>You do not need a large business to start. You need a structure.</p>
            <p><strong>Step one:</strong> Establish your business entity. Form an LLC or corporation, obtain your EIN from the IRS, and open a dedicated business bank account. These three steps separate you legally and financially from your business and signal legitimacy to lenders.</p>
            <p><strong>Step two:</strong> Establish business tradelines. Open net-30 vendor accounts — suppliers and service providers who extend credit and report your payment history to business credit bureaus. Pay them early, every time.</p>
            <p><strong>Step three:</strong> Build business credit accounts. Once your vendor history is established, apply for business credit cards and lines of credit under your company name. These products report to business bureaus only. Your personal credit is not touched.</p>
            <p>This process takes time. But every step builds the second stream — the one that lets you operate, spend, and grow without ever touching your personal profile.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 6 — The Quick Hit Play</h2>
          <div className="guide__body">
            <p>This is one of the most powerful tools in the playbook — and one of the least talked about.</p>
            <p>Wealthy people use personal credit for speed. Not for long-term business expenses. Not to fund operations. For fast, calculated opportunities that require capital now and return it quickly.</p>
            <p>An opportunity appears. A vehicle at auction. A discounted property. A bulk inventory deal. A flip. Something that requires capital immediately and will return significantly more than it costs.</p>
            <p>The business credit is deployed elsewhere. But the personal credit is clean, available, and accessible right now.</p>
            <p>You pull three thousand dollars from a personal credit line. You execute the opportunity. You return the capital within thirty to sixty days. You pay the card before the statement closes. The balance reports at zero. Your personal profile stays clean.</p>
            <p><strong>That is the quick hit play. Fast capital. Fast return. No lasting damage to your profile.</strong></p>
            <p>The key is discipline. This play only works if you execute it with a clear repayment timeline and never let the balance sit long enough to impact your profile.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Section 7 — Why Your Personal Profile Must Stay Untouchable</h2>
          <div className="guide__body">
            <p>Business credit utilization does not touch your personal credit score. Not one point. Not one percentage of utilization. What happens on the business side stays on the business side.</p>
            <p>That means you can deploy your business credit aggressively — fund operations, cover payroll, buy inventory, execute deals — and your personal profile never feels it.</p>
            <p>This is the protection that wealthy people build deliberately. And it only works if your personal credit stays clean.</p>
            <p>As long as your personal credit profile is pristine, you always have access to capital. <strong>Always.</strong></p>
            <p>The moment your personal credit is damaged, that safety net disappears. You are now dependent entirely on business credit, income, or outside investors. Your options shrink. Your leverage drops. Your ability to execute on fast opportunities evaporates.</p>
            <p>Protecting your personal credit is not conservative thinking. It is strategic thinking. It is how you stay in the game no matter what happens around you.</p>
            <p><strong>The goal is not just to get funded once. The goal is to always be fundable.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">The Architecture in Practice</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--navy)', fontSize: '0.875rem' }}>Personal Side</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>17+ unsecured accounts</li>
                <li>Strong limits</li>
                <li>Low utilization</li>
                <li>Perfect payment history</li>
                <li>Zero derogatory marks</li>
                <li>Clean inquiry count</li>
                <li>Always available</li>
              </ul>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--teal)', fontSize: '0.875rem' }}>Business Side</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>Entity established</li>
                <li>EIN obtained</li>
                <li>Business bank account open</li>
                <li>Net-30 vendor accounts</li>
                <li>Business credit cards/lines</li>
                <li>Reports to business bureaus only</li>
                <li>Never touches personal profile</li>
              </ul>
            </div>
          </div>
          <div className="guide__body" style={{ marginTop: 16 }}>
            <p>Two streams. Neither one dependent on the other. Both protected. Always fundable on both sides simultaneously.</p>
            <p>This is the structure wealthy people build. Not because they have more money — but because they understand how capital actually works.</p>
            <p><strong>Build the Architecture.</strong> Most people spend their lives reacting to money. Wealthy people build systems that keep capital available before they need it. You now understand the architecture. The work is building it — one positioned account, one business tradeline, one disciplined decision at a time.</p>
            <p>That is the wealthy person's playbook. And now it is yours.</p>
          </div>
        </div>

        <div className="guide__disclaimer">
          This content is for educational purposes. Intelligent Funding does not provide personalized financial or legal advice. Credit outcomes vary based on individual profiles, lender decisions, and market conditions.
        </div>
      </div>
    </div>
  )
}
