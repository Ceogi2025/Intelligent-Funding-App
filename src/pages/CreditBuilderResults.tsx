import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import InstitutionCard from '../components/InstitutionCard'
import { useFilters } from '../context/FilterContext'
import { useInstitutions } from '../hooks/useInstitutions'
import type { Institution } from '../types'

type SortOption = 'alpha' | 'graduates' | 'no-deposit'

function sortInstitutions(list: Institution[], sort: SortOption): Institution[] {
  const copy = [...list]
  if (sort === 'graduates') {
    return copy.sort((a, b) => {
      const aGrad = a.products.some(p => p.graduation_potential === 'Yes') ? 0 : 1
      const bGrad = b.products.some(p => p.graduation_potential === 'Yes') ? 0 : 1
      if (aGrad !== bGrad) return aGrad - bGrad
      return a.name.localeCompare(b.name)
    })
  }
  if (sort === 'no-deposit') {
    return copy.sort((a, b) => {
      const aNoDep = a.products.some(p => (p.deposit_amount || '').toLowerCase().includes('no upfront')) ? 0 : 1
      const bNoDep = b.products.some(p => (p.deposit_amount || '').toLowerCase().includes('no upfront')) ? 0 : 1
      if (aNoDep !== bNoDep) return aNoDep - bNoDep
      return a.name.localeCompare(b.name)
    })
  }
  return copy.sort((a, b) => a.name.localeCompare(b.name))
}

export default function CreditBuilderResults() {
  const navigate = useNavigate()
  const { filters, resetFilters } = useFilters()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sort, setSort] = useState<SortOption>('alpha')
  const { institutions, loading, error } = useInstitutions(filters)

  const sorted = useMemo(() => sortInstitutions(institutions, sort), [institutions, sort])

  const typeLabel = filters.productType === 'card' ? 'Secured Credit Cards' : filters.productType === 'other' ? 'Alternative Tradelines' : 'Credit Builder Loans'

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

        {!loading && !error && institutions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Sort:</span>
            {(['alpha', 'graduates', 'no-deposit'] as SortOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${sort === opt ? 'var(--navy)' : 'var(--border)'}`,
                  background: sort === opt ? 'var(--navy)' : 'transparent',
                  color: sort === opt ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: sort === opt ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt === 'alpha' ? 'A–Z' : opt === 'graduates' ? 'Graduates First' : 'No Deposit First'}
              </button>
            ))}
          </div>
        )}

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
            {sorted.map(inst => (
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
