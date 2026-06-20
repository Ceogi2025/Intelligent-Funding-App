import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-hero__headline">
          Stack by Bureau.<br />Get Funded by Design.
        </h1>
        <p className="landing-hero__subheadline">
          The only bureau mapping tool built for strategic credit stacking.
          Find institutions that pull from your strongest bureau and apply with confidence.
        </p>
        <button className="btn btn--primary btn--lg" onClick={() => navigate('/signup')}>
          Get Started — $1 for 7 Days
        </button>
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
                Select your strongest bureau — Experian, Equifax, or TransUnion.
                Filter by inquiry reuse and soft pull preapproval to protect your inquiry count.
              </p>
            </div>
            <div className="step">
              <div className="step__number">3</div>
              <div className="step__title">Apply With Strategy</div>
              <p className="step__text">
                Get matched to verified institutions. See every product, every requirement,
                and every bureau pull — before you apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <h2 className="pricing-section__title">Simple Pricing</h2>
          <p className="pricing-section__sub">Get full access for $1. Cancel anytime.</p>
          <div className="pricing__cards">
            {/* Trial */}
            <div className="pricing-card">
              <div className="pricing-card__plan">7-Day Access</div>
              <div className="pricing-card__price">
                $1 <span>/ 7 days</span>
              </div>
              <ul className="pricing-card__features" style={{ marginTop: 16 }}>
                <li>Full access for 7 days</li>
                <li>All institution data</li>
                <li>All education guides</li>
                <li>Cancel anytime</li>
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
                <li>Full institution database</li>
                <li>All education guides</li>
                <li>All filtering tools</li>
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

      <footer className="footer">
        <div className="footer__tagline">Stack by Bureau. Get Funded by Design.</div>
        <div>Intelligent Funding is an educational platform. Not financial advice.</div>
        <div>© {new Date().getFullYear()} Vault Capital Group LLC. All rights reserved.</div>
      </footer>
    </div>
  )
}
