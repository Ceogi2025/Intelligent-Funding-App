import { ArrowRight } from 'lucide-react'
import type { Institution } from '../types'

interface Props {
  institution: Institution
  onView: (id: number) => void
  path: 'capital-access' | 'credit-builder'
}

export default function InstitutionCard({ institution, onView, path }: Props) {
  const minScore = institution.products.reduce((min, p) => {
    if (p.minimum_credit_score === null) return min
    return min === null ? p.minimum_credit_score : Math.min(min, p.minimum_credit_score)
  }, null as number | null)

  const hasGraduation = institution.products.some(p => p.graduation_potential === 'Yes')
  const noDeposit = institution.products.some(p => p.deposit_amount === 'N/A' || !p.deposit_amount)
  const bureaus = [...new Set(institution.products.map(p => p.bureau_pulled).filter(b => b !== 'Not Verified'))]

  return (
    <div className="institution-card">
      <div className="institution-card__top">
        <span className="institution-card__name">{institution.name}</span>
        {minScore !== null ? (
          <div className="institution-card__score-block">
            <span className="institution-card__score">{minScore}+</span>
            <span className="institution-card__score-label">MIN SCORE</span>
          </div>
        ) : (
          <div className="institution-card__score-block">
            <span className="institution-card__score" style={{ fontSize: '0.8rem' }}>No min</span>
            <span className="institution-card__score-label">MIN SCORE</span>
          </div>
        )}
      </div>

      <div className="institution-card__badges">
        {path === 'capital-access' && (
          <>
            {institution.inquiry_reuse === 'Yes' && (
              <span className="badge badge--green">✓ Inquiry Reuse</span>
            )}
            {institution.preapproval_available === 'Yes' && (
              <span className="badge badge--teal">✓ Soft Pull Preapproval</span>
            )}
            {bureaus.map(b => (
              <span key={b} className="badge badge--navy">{b}</span>
            ))}
          </>
        )}
        {path === 'credit-builder' && (
          <>
            {hasGraduation && (
              <span className="badge badge--green">Graduates ✓</span>
            )}
            {noDeposit && (
              <span className="badge badge--teal">No Deposit</span>
            )}
            {bureaus.length > 0 && (
              <span className="badge badge--gray">
                Reports to: {bureaus.join(', ')}
              </span>
            )}
          </>
        )}
        <span className="badge badge--gray">{institution.type}</span>
      </div>

      <div className="institution-card__footer">
        <button className="institution-card__link" onClick={() => onView(institution.id)}>
          View products <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
