import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Building2, Search, BookOpen, LifeBuoy, ShieldCheck, ArrowRight, Briefcase, Target } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useFilters } from '../context/FilterContext'
import { useAuth } from '../context/AuthContext'
import type { Institution } from '../types'

type CapitalStep = 'bureau' | 'inquiry' | 'preapproval'
type BuilderStep = 'product'
type ActiveModal = CapitalStep | BuilderStep | null

const BUILDER_TYPES = ['Secured Card', 'Credit Builder Loan', 'Alternative Tradeline']

export default function Home() {
  const navigate = useNavigate()
  const { setFilters } = useFilters()
  const { token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // Live catalog stats, the home screen shows real depth, never claims.
  // `inst` is the COMBINED count (consumer + business) so the hub matches the
  // landing page and reflects all three paths on this screen. `reuse` and
  // `noCheck` are consumer capital-access metrics, verified floors only.
  const [stats, setStats] = useState<{ inst: number; builder: number; capital: number; noCheck: number; reuse: number } | null>(null)
  useEffect(() => {
    Promise.all([
      fetch('/api/institutions?path=all', { headers: { Authorization: `Bearer ${token}` } }).then(r => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/public/stats').then(r => (r.ok ? r.json() : { inst: 0 })).catch(() => ({ inst: 0 })),
    ])
      .then(([data, combined]: [Institution[], { inst: number }]) => {
        if (!Array.isArray(data)) return
        const products = data.flatMap(i => i.products)
        setStats({
          inst: combined.inst || data.length,
          builder: products.filter(p => BUILDER_TYPES.includes(p.type)).length,
          capital: products.filter(p => !BUILDER_TYPES.includes(p.type)).length,
          noCheck: products.filter(p => p.bureau_pulled === 'None').length,
          reuse: data.filter(i => i.inquiry_reuse === 'Yes').length,
        })
      })
      .catch(() => {})
  }, [token])

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
            Every stack starts where you are. Build the profile → access the capital → fund the vision.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 14, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={13} style={{ color: 'var(--teal)' }} />
              <b style={{ color: 'var(--text-primary)' }}>{stats ? stats.inst : '58'}</b>&nbsp;institutions mapped
            </span>
            <span><b style={{ color: 'var(--text-primary)' }}>{stats ? stats.reuse : '—'}</b> allow inquiry reuse</span>
            <span><b style={{ color: 'var(--text-primary)' }}>{stats ? stats.noCheck : '—'}</b> products with no credit check</span>
          </div>
        </div>

        {/* The Strategy Engine — the algorithm, front and center */}
        <button
          onClick={() => navigate('/strategy')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 920,
            margin: '0 auto 22px', padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(100deg, var(--navy) 0%, #1e3a8a 60%, #164e63 100%)',
            color: '#fff', textAlign: 'left', cursor: 'pointer', border: 'none',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 11, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>
              NEW · The Strategy Engine
            </div>
            <div style={{ fontSize: '0.83rem', opacity: 0.85, lineHeight: 1.45 }}>
              Answer 5 questions, get your exact sequence: which bureau lane, which institutions, in what order.
            </div>
          </div>
          <span style={{ flexShrink: 0, fontWeight: 700, fontSize: '0.85rem', color: '#67e8f9' }}>Run it →</span>
        </button>

        {/* The journey, in order: build → access → (business funding joins here) */}
        <div className="path-tiles" style={{ alignItems: 'stretch' }}>
          <button className="path-tile" onClick={openCreditBuilder} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: 12, left: 14, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--teal)' }}>STEP 1 · BUILD</span>
            <div className="path-tile__icon">
              <Building2 size={24} />
            </div>
            <span className="path-tile__label">Credit Builder</span>
            <span className="path-tile__desc">Building or rebuilding, start here. Secured cards, builder loans &amp; rent reporting{stats ? ` · ${stats.builder} products` : ''}</span>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              <span className="badge badge--teal">No-credit-check options</span>
              <span className="badge badge--gray">Graduation paths</span>
            </span>
          </button>

          <button className="path-tile" onClick={openCapitalAccess} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: 12, left: 14, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--teal)' }}>STEP 2 · STACK</span>
            <div className="path-tile__icon">
              <CreditCard size={24} />
            </div>
            <span className="path-tile__label">Capital Access</span>
            <span className="path-tile__desc">Profile established, stack by bureau. Unsecured cards &amp; credit lines{stats ? ` · ${stats.capital} products` : ''}</span>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              <span className="badge badge--navy">3 bureaus mapped</span>
              <span className="badge badge--green">Inquiry-reuse lenders</span>
            </span>
          </button>

          <button className="path-tile" onClick={() => navigate('/business')} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: 12, left: 14, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--teal)' }}>STEP 3 · SCALE</span>
            <div className="path-tile__icon">
              <Briefcase size={24} />
            </div>
            <span className="path-tile__label">Business Funding</span>
            <span className="path-tile__desc">Fund the business, not just the person. No-doc lines, 0% business cards &amp; builder products, filtered to your level</span>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              <span className="badge badge--navy">New-LLC options</span>
              <span className="badge badge--green">EIN-only lenders</span>
            </span>
          </button>

          <button className="path-tile" onClick={() => navigate('/browse')} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: 12, left: 14, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--teal)' }}>EXPLORE</span>
            <div className="path-tile__icon">
              <Search size={24} />
            </div>
            <span className="path-tile__label">Browse All Institutions</span>
            <span className="path-tile__desc">Know what you want? The full catalog, search any bank, filter by anything</span>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              <span className="badge badge--gray">Highlights &amp; watch-outs</span>
              <span className="badge badge--gray">Regional coverage</span>
            </span>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px auto 26px', maxWidth: 920 }}>
          This is the Economic Algorithm at work: build the profile, stack by bureau, fund the business, and the business unlocks the next round of access. It circles back. Access is leverage. Leverage is opportunity.
        </div>

        {/* The knowledge layer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, width: '100%', maxWidth: 920, margin: '0 auto' }}>
          <button onClick={() => navigate('/education/stacking-method')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <BookOpen size={17} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.83rem' }}><b>The Stacking Method</b><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>The strategy behind the tool</span></span>
            <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => navigate('/education/profile-positioning')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <BookOpen size={17} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.83rem' }}><b>Profile Positioning</b><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Get approval-ready first</span></span>
            <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => navigate('/resources')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <LifeBuoy size={17} style={{ color: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.83rem' }}><b>Bureau Resources</b><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Freeze, dispute &amp; contact lines</span></span>
            <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </main>

      {/* Capital Access Modal 1, Bureau */}
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

      {/* Capital Access Modal 2, Inquiry Reuse */}
      {activeModal === 'inquiry' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">Do you want inquiry reuse?</h2>
            <p className="modal__subtext">One hard pull, multiple products from the same institution.</p>
            <div className="modal__options modal__options--vertical">
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleInquirySelect('yes')}>
                ✓ Yes, Show inquiry reuse lenders only
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handleInquirySelect('no')}>
                No, Show all lenders on this bureau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capital Access Modal 3, Preapproval */}
      {activeModal === 'preapproval' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__heading">Do you want soft pull preapproval?</h2>
            <p className="modal__subtext">Check your approval odds without a hard inquiry hit.</p>
            <div className="modal__options modal__options--vertical">
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handlePreapprovalSelect('yes')}>
                ✓ Yes, Show preapproval lenders only
              </button>
              <button className="modal__option-btn modal__option-btn--full" onClick={() => handlePreapprovalSelect('no')}>
                No, Show all available lenders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Builder Modal, Product Type */}
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
