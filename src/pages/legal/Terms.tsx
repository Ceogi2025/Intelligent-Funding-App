import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function Terms() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="guide" style={{ flex: 1 }}>
        <h1 className="guide__title">Terms of Service</h1>
        <p className="guide__subtitle">Last updated: July 2, 2026 · Intelligent Funding is operated by Vault Capital Group LLC.</p>

        <div className="guide__section">
          <h2 className="guide__section-title">1. What Intelligent Funding Is and Is Not</h2>
          <div className="guide__body">
            <p>Intelligent Funding is an <strong>educational platform and information directory</strong>. We publish research about financial institutions, including which credit bureau they are reported to pull, inquiry-reuse policies, and preapproval options, along with educational guides about credit strategy.</p>
            <p><strong>We are NOT:</strong> a lender, a broker, a financial advisor, or a credit repair organization. We do not provide personalized financial advice. We do not repair, fix, or improve your credit, and we make no representations about improving your credit record, credit history, or credit rating. We never contact credit bureaus on your behalf.</p>
            <p>All credit decisions are made solely by the financial institutions you apply to. We have no influence over any lending decision.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">2. Accuracy of Information</h2>
          <div className="guide__body">
            <p>We verify our data against official institution websites and multi-source community reports, and we label anything unverified. However, institutions change their policies without notice. Bureau pulls can vary by state, product, and applicant profile.</p>
            <p><strong>Always confirm details directly with the institution before applying.</strong> You are responsible for your own application decisions, including any hard inquiries that result from them.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">3. Subscriptions and Billing</h2>
          <div className="guide__body">
            <p><strong>Trial:</strong> The introductory offer is $1 for 7 days of full access. <strong>Unless you cancel before the 7 days end, your subscription automatically continues at $29 per month.</strong></p>
            <p><strong>Monthly plan:</strong> $29/month, renews automatically each month until cancelled.</p>
            <p><strong>Annual plan:</strong> $278/year, renews automatically each year until cancelled.</p>
            <p><strong>Cancelling:</strong> Cancel anytime from your Account page ("Manage Subscription"), which takes you to our payment processor's self-service portal, no phone call, no email required. Cancelling stops future charges; see our <a href="/refunds" style={{ color: 'var(--teal)', fontWeight: 600 }}>Refund Policy</a> for details. Payments are processed by Stripe; we never see or store your card number.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">4. Community Submissions</h2>
          <div className="guide__body">
            <p>Users may submit datapoints about their experiences with institutions. By submitting, you confirm the information reflects your genuine experience and grant us the right to review, verify, publish, edit, or reject it. Submissions go through a verification process before any use, and are never published as verified fact without meeting our sourcing standard.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">5. The Community Room (Member Chat)</h2>
          <div className="guide__body">
            <p>Paid members may post in the live Community Room. You are solely responsible for what you post. Member messages are <strong>opinions and personal experiences, not financial advice</strong>, and are not endorsed, verified, or adopted by us.</p>
            <p>By posting you agree to our <a href="/community-guidelines" style={{ color: 'var(--teal)', fontWeight: 600 }}>Community Guidelines</a>. In short: share knowledge freely, but <strong>no selling, promoting, soliciting, referral or affiliate links, or directing members off-platform</strong>; no illegal tactics (including CPNs, synthetic identities, or fraudulent applications); no harassment. We use automated filtering plus human review, and we may hold, remove, edit, or delete any message and suspend or ban any member at our discretion, with or without notice.</p>
            <p>We are not responsible or liable for statements made by other members. Any reliance on member posts is at your own risk, always verify independently before acting.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">6. Acceptable Use</h2>
          <div className="guide__body">
            <p>You agree not to: share your account access, scrape or bulk-copy the directory, submit false datapoints, use the platform for any unlawful purpose, or misrepresent our educational content as professional advice when sharing it.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">7. Limitation of Liability</h2>
          <div className="guide__body">
            <p>The platform is provided "as is." To the maximum extent permitted by law, Vault Capital Group LLC is not liable for any losses arising from your use of the information provided, including denied applications, hard inquiries, credit score changes, or financial decisions you make. Our total liability is limited to the amount you paid us in the twelve months before the claim.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">8. General</h2>
          <div className="guide__body">
            <p>These terms are governed by the laws of the Commonwealth of Massachusetts. We may update these terms; continued use after changes means acceptance. If any provision is unenforceable, the rest remain in effect. Questions: support@intelligentfunding.org.</p>
          </div>
        </div>

        <div className="guide__disclaimer">
          This content is for educational purposes only. Intelligent Funding does not provide financial advice. Always review the terms and conditions of any financial product before applying. Credit decisions are made solely by the financial institution.
        </div>
      </div>
      <Footer />
    </div>
  )
}
