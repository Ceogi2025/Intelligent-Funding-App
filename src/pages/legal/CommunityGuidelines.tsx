import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function CommunityGuidelines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="guide" style={{ flex: 1 }}>
        <h1 className="guide__title">Community Guidelines</h1>
        <p className="guide__subtitle">The rules of the Community Room · Last updated: July 2026</p>

        <div className="guide__section">
          <h2 className="guide__section-title">What this room is for</h2>
          <div className="guide__body">
            <p>The Community Room is where members share real knowledge about getting funded, approvals, denials, which bureau a lender pulled, stacking strategy, what worked and what didn't. It runs on people being open and helping the next person. Keep it that way and everyone wins.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Do this</h2>
          <div className="guide__body">
            <ul>
              <li>Share your real experiences, approvals, denials, bureau pulls, limits, timing.</li>
              <li>Ask questions. No question about credit or funding is too basic here.</li>
              <li>Give strategy and context. Explain <em>why</em> something worked, not just that it did.</li>
              <li>Keep people anonymous, yourself included. Never post account numbers, SSNs, or documents.</li>
              <li>Be straight with each other. Honest beats hype.</li>
            </ul>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Don't do this</h2>
          <div className="guide__body">
            <p><strong>The one rule that protects the room: share knowledge freely, but don't sell.</strong> This is a place to learn together, not a marketplace. Specifically, no:</p>
            <ul>
              <li><strong>Selling or promoting</strong> your own services, products, programs, or business.</li>
              <li><strong>Soliciting</strong>, "DM me," "hit my line," referral links, affiliate links, or trying to move members off-platform.</li>
              <li><strong>Recruiting</strong> into any program, group, or opportunity.</li>
              <li><strong>Illegal or fraudulent tactics</strong>, CPNs, synthetic identities, fake income, or advice to misrepresent yourself on an application. This one gets you removed immediately.</li>
              <li><strong>Harassment, hate, or spam</strong> of any kind.</li>
              <li>Presenting anything here as professional financial, legal, or credit-repair advice. We're members sharing experience, nothing more.</li>
            </ul>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">How moderation works</h2>
          <div className="guide__body">
            <p>Posts run through an automatic filter first, anything that looks like selling, soliciting, or illegal tactics is held for a human to review before it ever appears. Members can also flag a message; enough flags pull it for review automatically.</p>
            <p>We may hold, remove, edit, or delete any message, and suspend or ban any member, at our discretion. Repeat or serious violations end your access to the room. We'd rather keep it clean than keep everybody.</p>
          </div>
        </div>

        <div className="guide__disclaimer">
          The Community Room is member discussion for educational purposes only. Posts are the opinions and experiences of individual members, not financial advice, and not verified or endorsed by Intelligent Funding. Always confirm details directly with an institution before applying.
        </div>
      </div>
      <Footer />
    </div>
  )
}
