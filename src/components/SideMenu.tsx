import { X, Home, Building2, Target, BookOpen, Briefcase, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isOpen) return null

  function go(path: string) {
    onClose()
    navigate(path)
  }

  function handleLogout() {
    onClose()
    logout()
    navigate('/')
  }

  const active = (path: string) => location.pathname === path ? 'sidemenu__item sidemenu__item--active' : 'sidemenu__item'

  return (
    <>
      <div className="sidemenu-overlay" onClick={onClose} />
      <nav className="sidemenu">
        <div className="sidemenu__header">
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-primary)' }}>INTELLIGENT</span>
            <span style={{ color: 'var(--navy)', marginLeft: 4 }}>FUNDING</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div className="sidemenu__nav">
          <button className={active('/home')} onClick={() => go('/home')}>
            <Home size={16} /> Home
          </button>

          <div className="sidemenu__divider" />

          <button className={active('/education/profile-positioning')} onClick={() => go('/education/profile-positioning')}>
            <Target size={16} /> Profile Positioning
          </button>
          <button className={active('/education/stacking-method')} onClick={() => go('/education/stacking-method')}>
            <BookOpen size={16} /> Credit Card Stacking Method
          </button>
          <button className={active('/education/wealthy-playbook')} onClick={() => go('/education/wealthy-playbook')}>
            <Briefcase size={16} /> The Wealthy Person's Playbook
          </button>

          <div className="sidemenu__divider" />

          {user?.role === 'admin' && (
            <button className="sidemenu__item" onClick={() => go('/admin')}>
              <Building2 size={16} /> Admin Panel
            </button>
          )}

          <button className="sidemenu__item sidemenu__item--danger" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>
    </>
  )
}
