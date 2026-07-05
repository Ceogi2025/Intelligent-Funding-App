import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Building2 } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useFilters } from '../context/FilterContext'

type CapitalStep = 'bureau' | 'inquiry' | 'preapproval'
type BuilderStep = 'product'
type ActiveModal = CapitalStep | BuilderStep | null

export default function Home() {
  const navigate = useNavigate()
  const { setFilters } = useFilters()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // Temp state as user moves through modals
  const [selectedBureau, setSelectedBureau] = useState<string | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null)

  function openCapitalAccess() {
    setActiveModal('bureau')
  }

  function openCreditBuilder() {
    setActiveModal('product')
  }

  function handleBureauSelect(bureau: string) {
    setSelectedBureau(bureau)
    setActiveModal('inquiry')
  }

  function handleInquirySelect(answer: 'yes' | 'no') {
    setSelectedInquiry(answer)
    setActiveModal('preapproval')
  }

  function handlePreapprovalSelect(answer: 'yes' | 'no') {
    setFilters({
      bureau: selectedBureau as 'Experian' | 'Equifax' | 'TransUnion',
      inquiryReuse: selectedInquiry as 'yes' | 'no',
      preapproval: answer,
      productType: null,
      path: 'capital-access',
    })
    setActiveModal(null)
    navigate('/results/capital-access')
  }

  function handleProductTypeSelect(type: 'card' | 'loan' | 'other') {
    setFilters({
      bureau: null,
      inquiryReuse: null,
      preapproval: null,
      productType: type,
      path: 'credit-builder',
    })
    setActiveModal(null)
    navigate('/results/credit-builder')
  }

  function closeModal() {
    setActiveModal(null)
    setSelectedBureau(null)
    setSelectedInquiry(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="home-page">
        <div className="home-page__hero">
          <h1 className="home-page__title">Your Pathway to Capital</h1>
          <p className="home-page__sub">
            Bureau-specific institution matching. Stack strategically. Get funded.
          </p>
        </div>

        <div className="path-tiles">
          <button className="path-tile" onClick={openCapitalAccess}>
            <div className="path-tile__icon">
              <CreditCard size={24} />
            </div>
            <span className="path-tile__label">Capital Access</span>
            <span className="path-tile__desc">Unsecured cards &amp; credit lines</span>
          </button>

          <button className="path-tile" onClick={openCreditBuilder}>
            <div className="path-tile__icon">
              <Building2 size={24} />
            </div>
            <span className="path-tile__label">Credit Builder Products</span>
            <span className="path-tile__desc">Secured cards &amp; builder loans</span>
          </button>
        </div>
      </main>

      {/* Capital Access Modal 1 — Bureau */}
      {activeModal === 'bureau' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">Which bureau do you want to target?</h2>
            <p className="modal__subtext">We'll match institutions that pull from this bureau.</p>
            <div className="modal__options">
              {(['Experian', 'Equifax', 'TransUnion'] as const).map(b => (
                <button key={b} className="modal__option-btn" onClick={() => handleBureauSelect(b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capital Access Modal 2 — Inquiry Reuse */}
      {activeModal === 'inquiry' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">Do you want inquiry reuse?</h2>
            <p className="modal__subtext">One hard pull, multiple products from the same institution.</p>
            <div className="modal__options modal__options--vertical">
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleInquirySelect('yes')}>
                ✓ Yes — Show inquiry reuse lenders only
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleInquirySelect('no')}>
                No — Show all lenders on this bureau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capital Access Modal 3 — Preapproval */}
      {activeModal === 'preapproval' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">Do you want soft pull preapproval?</h2>
            <p className="modal__subtext">Check your approval odds without a hard inquiry hit.</p>
            <div className="modal__options modal__options--vertical">
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handlePreapprovalSelect('yes')}>
                ✓ Yes — Show preapproval lenders only
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handlePreapprovalSelect('no')}>
                No — Show all available lenders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Builder Modal — Product Type */}
      {activeModal === 'product' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">What type of product are you looking for?</h2>
            <p className="modal__subtext">We'll show you all verified institutions for that product type.</p>
            <div className="modal__options modal__options--vertical">
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleProductTypeSelect('card')}>
                💳 Secured Credit Cards
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleProductTypeSelect('loan')}>
                🏦 Credit Builder Loans
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleProductTypeSelect('other')}>
                📈 Alternative Tradelines (rent reporting & more)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
