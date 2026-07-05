import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__tagline">Stack by Bureau. Get Funded by Design.</div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
        <Link to="/banks" style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '0.85rem' }}>Bank Directory</Link>
        <Link to="/cheat-sheet" style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '0.85rem' }}>Free Cheat Sheet</Link>
        <Link to="/share" style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '0.85rem' }}>Share a Datapoint</Link>
        <Link to="/terms" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Terms</Link>
        <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Privacy</Link>
        <Link to="/refunds" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Refunds</Link>
      </div>
      <div>Intelligent Funding is an educational platform. Not financial advice. Not a credit repair service.</div>
      <div>© {new Date().getFullYear()} Vault Capital Group LLC. All rights reserved.</div>
    </footer>
  )
}
