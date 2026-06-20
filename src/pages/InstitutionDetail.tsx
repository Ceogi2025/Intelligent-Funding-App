import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useInstitution } from '../hooks/useInstitutions'
import type { Product } from '../types'

function UnverifiedValue({ value }: { value: string | null | undefined }) {
  if (!value || value === 'Not verified — contact institution to confirm') {
    return <span className="detail-value detail-value--unverified">Not verified — contact institution to confirm</span>
  }
  if (value === 'Not Found' || value === 'Not Verified') {
    return <span className="detail-value detail-value--muted">{value}</span>
  }
  return <span className="detail-value">{value}</span>
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <div className="product-card__name">{product.name}</div>
      <div className="product-card__type">{product.type}</div>
      <div className="product-card__grid">
        <div>
          <div className="detail-label">Min Score</div>
          <div className="detail-value">
            {product.minimum_credit_score != null ? `${product.minimum_credit_score}+` : 'None published'}
          </div>
        </div>
        <div>
          <div className="detail-label">Annual Fee</div>
          <div className="detail-value">{product.annual_fee || 'None'}</div>
        </div>
        <div>
          <div className="detail-label">Bureau Pulled</div>
          <UnverifiedValue value={product.bureau_pulled} />
        </div>
        {(product.type === 'Secured Card' || product.type === 'Credit Builder Loan') && (
          <div>
            <div className="detail-label">Reports To</div>
            <UnverifiedValue value={product.reports_to} />
          </div>
        )}
        {(product.type === 'Secured Card' || product.type === 'Credit Builder Loan') && (
          <>
            <div>
              <div className="detail-label">Deposit</div>
              <div className="detail-value">{product.deposit_amount || 'N/A'}</div>
            </div>
            <div>
              <div className="detail-label">Graduation</div>
              <div className="detail-value">{product.graduation_potential}</div>
            </div>
            {product.graduation_potential === 'Yes' && (
              <div>
                <div className="detail-label">Timeline</div>
                <div className="detail-value">{product.graduation_timeline}</div>
              </div>
            )}
          </>
        )}
        {product.existing_customer_required === 'Yes' && (
          <div>
            <div className="detail-label">Existing Customer</div>
            <div className="detail-value">Required</div>
          </div>
        )}
        {product.strategy_notes && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="detail-label">Strategy Notes</div>
            <div className="detail-value" style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {product.strategy_notes}
            </div>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="detail-label">Last Verified</div>
          <div className="detail-value">{product.last_verified_date}</div>
        </div>
      </div>
    </div>
  )
}

export default function InstitutionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { institution, loading, error } = useInstitution(id ? parseInt(id) : null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="page">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <button className="page__back" style={{ margin: 0 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back to results
          </button>
          <button className="page__back" style={{ margin: 0 }} onClick={() => navigate('/home')}>
            <ArrowLeft size={14} /> New Search
          </button>
        </div>

        {loading && (
          <div className="loading-page">
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!loading && !error && institution && (
          <>
            {/* Institution header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{institution.name}</h1>
                {institution.application_url && (
                  <a
                    href={institution.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--teal btn--sm"
                  >
                    Apply <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <span className="badge badge--gray">{institution.type}</span>
                {institution.inquiry_reuse === 'Yes' && <span className="badge badge--green">✓ Inquiry Reuse</span>}
                {institution.preapproval_available === 'Yes' && <span className="badge badge--teal">✓ Soft Pull Preapproval</span>}
                {institution.path !== 'Capital Access' && (
                  institution.products.some(p => p.graduation_potential === 'Yes') &&
                  <span className="badge badge--green">Graduates ✓</span>
                )}
              </div>

              {/* Detail grid */}
              <div className="detail-grid">
                <div>
                  <div className="detail-label">Institution Type</div>
                  <div className="detail-value">{institution.type}</div>
                </div>
                <div>
                  <div className="detail-label">Inquiry Reuse</div>
                  <div className="detail-value">
                    {institution.inquiry_reuse}
                    {institution.inquiry_reuse === 'Yes' && institution.inquiry_reuse_window !== 'Not Found' &&
                      ` (${institution.inquiry_reuse_window})`}
                  </div>
                </div>
                <div>
                  <div className="detail-label">Soft Pull Preapproval</div>
                  <UnverifiedValue value={institution.preapproval_available} />
                </div>
                <div>
                  <div className="detail-label">Geographic Restrictions</div>
                  <div className="detail-value">{institution.geographic_restrictions}</div>
                </div>
                <div>
                  <div className="detail-label">Last Verified</div>
                  <div className="detail-value">{institution.last_verified_date}</div>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Products */}
            <div style={{ marginTop: 28 }}>
              <h2 style={{ marginBottom: 16 }}>
                Products ({institution.products.length})
              </h2>
              {institution.products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
