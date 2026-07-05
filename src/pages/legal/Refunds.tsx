import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function Refunds() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="guide" style={{ flex: 1 }}>
        <h1 className="guide__title">Refund & Cancellation Policy</h1>
        <p className="guide__subtitle">Last updated: July 2, 2026 · Short version: cancelling is always easy, and we don't play games.</p>

        <div className="guide__section">
          <h2 className="guide__section-title">How to Cancel (2 clicks, no phone calls)</h2>
          <div className="guide__body">
            <p>Log in → <strong>Account</strong> → <strong>Manage Subscription</strong>. That opens Stripe's self-service portal where you cancel instantly. No retention scripts, no "call us to cancel." You can also email support@intelligentfunding.org and we'll process it.</p>
            <p>Cancelling stops all future charges. You keep access until the end of the period you already paid for.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">The $1 Trial</h2>
          <div className="guide__body">
            <p>The $1 gets you 7 days of full access and is not refundable. <strong>If you don't cancel before the 7 days end, the subscription continues at $29/month automatically</strong> — we say this everywhere on purpose, because surprise charges are how other companies operate, not us. Cancel on day 6 and you pay exactly $1 total.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Monthly Plan ($29/month)</h2>
          <div className="guide__body">
            <p>Cancel anytime to stop the next renewal. We don't refund partial months — you keep access through the end of the paid month instead.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Annual Plan ($278/year)</h2>
          <div className="guide__body">
            <p>Full refund within the first 14 days of purchase, no questions asked. After 14 days, the year is non-refundable, but you keep access through the full paid year after cancelling the renewal.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Billing Mistakes</h2>
          <div className="guide__body">
            <p>Charged in error (duplicate charge, charged after cancelling)? Email support@intelligentfunding.org with the details — we refund genuine billing errors in full, fast.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
