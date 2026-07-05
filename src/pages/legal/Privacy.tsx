import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function Privacy() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="guide" style={{ flex: 1 }}>
        <h1 className="guide__title">Privacy Policy</h1>
        <p className="guide__subtitle">Last updated: July 2, 2026 · Plain English on purpose.</p>

        <div className="guide__section">
          <h2 className="guide__section-title">What We Collect</h2>
          <div className="guide__body">
            <p><strong>Account data:</strong> your email address and a scrambled (hashed) version of your password. We cannot see your actual password.</p>
            <p><strong>Payment data:</strong> handled entirely by Stripe, our payment processor. We never see or store your card number. We keep only your subscription status and a Stripe customer reference.</p>
            <p><strong>Usage data:</strong> which institutions get viewed and which "Apply" links get clicked. This helps us prioritize research and improve the directory.</p>
            <p><strong>Voluntary submissions:</strong> if you share a datapoint or download the cheat sheet, we keep what you gave us (the datapoint details, your email if provided).</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">What We Do NOT Collect</h2>
          <div className="guide__body">
            <p>We never collect or ask for: your Social Security number, your credit report, your credit score, your bank account credentials, or your card numbers. <strong>We never pull your credit — using this platform has zero effect on your credit report.</strong></p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">What We Do With It</h2>
          <div className="guide__body">
            <p>We use your information to run your account, deliver the product, send you service emails, and (if you opted in) educational content you can unsubscribe from with one click.</p>
            <p><strong>We do not sell your personal information. Period.</strong></p>
            <p><strong>Affiliate disclosure:</strong> some "Apply" links may become affiliate links, meaning an institution may pay us if you apply through them. This never changes our data or rankings — the same information is shown whether or not a link pays us. Affiliate partners receive no personal information from us beyond what the click itself carries.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Your Rights</h2>
          <div className="guide__body">
            <p>Email support@intelligentfunding.org to: get a copy of your data, correct it, or delete your account and data entirely. We honor deletion requests within 30 days. Residents of states with privacy laws (California and others) have these rights by statute; we extend them to everyone.</p>
          </div>
        </div>

        <div className="guide__section">
          <h2 className="guide__section-title">Housekeeping</h2>
          <div className="guide__body">
            <p>Data is stored with reputable cloud providers (Vercel, Neon, Stripe). We use industry-standard protections but no system is 100% secure. This service is not directed at children under 18. If we change this policy, we'll update the date at the top; material changes get an email.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
