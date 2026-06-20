import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import InstitutionCard from '../components/InstitutionCard'
import { useFilters } from '../context/FilterContext'
import { useInstitutions } from '../hooks/useInstitutions'

export default function CreditBuilderResults() {
  const navigate = useNavigate()
  const { filters, resetFilters } = useFilters()
  const [menuOpen, setMenuOpen] = useState(false)
  const { institutions, loading, error } = useInstitutions(filters)

  const typeLabel = filters.productType === 'card' ? 'Secured Credit Cards' : 'Credit Builder Loans'

  function handleNewSearch() {
    resetFilters()
    navigate('/home')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="results-page">
        <div className="results-top-bar">
          <div className="results-header">
            <span className="results-title">{typeLabel} — All Institutions</span>
            {!loading && !error && (
              <span className="results-count">{institutions.length} match{institutions.length !== 1 ? 'es' : ''}</span>
            )}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={handleNewSearch}>
            <ArrowLeft size={14} /> New Search
          </button>
        </div>

        {loading && (
          <div className="loading-page">
            <div className="spinner" />
            <span>Loading institutions...</span>
          </div>
        )}

        {error === 'subscription_required' && (
          <div className="results-empty">
            <h3>Subscription Required</h3>
            <p>Your trial has expired or your subscription is inactive.</p>
            <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
              View Plans
            </button>
          </div>
        )}

        {error && error !== 'subscription_required' && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && institutions.length === 0 && (
          <div className="results-empty">
            <h3>No institutions found</h3>
            <p>No institutions are currently verified for this product type.</p>
            <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={handleNewSearch}>
              New Search
            </button>
          </div>
        )}

        {!loading && !error && institutions.length > 0 && (
          <div className="results-list">
            {institutions.map(inst => (
              <InstitutionCard
                key={inst.id}
                institution={inst}
                path="credit-builder"
                onView={id => navigate(`/institution/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
