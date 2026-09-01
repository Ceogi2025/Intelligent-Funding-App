import { X, Building2, Target, Map, ClipboardList, BookOpen, LifeBuoy, Users, UserCircle, LogOut, MessagesSquare, Trophy, Landmark } from 'lucide-react'
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

        {/* FIVE primary doors. Everything else still exists, just demoted out of
            the main flow so the plan is never competing for attention. */}
        <div className="sidemenu__nav">
          <button className={active('/blueprint')} onClick={() => go('/blueprint')}>
            <ClipboardList size={16} /> My Blueprint
          </button>
          <button className={active('/map')} onClick={() => go('/map')}>
            <Map size={16} /> My Funding Map
          </button>
          <button className={active('/community')} onClick={() => go('/community')}>
            <MessagesSquare size={16} /> The Community Room
          </button>
          <button className={active('/resources')} onClick={() => go('/resources')}>
            <LifeBuoy size={16} /> Resources
          </button>
          <button className={active('/account')} onClick={() => go('/account')}>
            <UserCircle size={16} /> Account & Billing
          </button>

          <div className="sidemenu__divider" />
          <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '4px 14px 6px' }}>
            More
          </div>

          <button className={active('/strategy')} onClick={() => go('/strategy')}>
            <Target size={16} /> Run the Strategy Engine
          </button>
          <button className={active('/browse')} onClick={() => go('/browse')}>
            <Building2 size={16} /> Browse All Institutions
          </button>
          <button className={active('/business')} onClick={() => go('/business')}>
            <Landmark size={16} /> Business Funding
          </button>
          <button className={active('/wins')} onClick={() => go('/wins')}>
            <Trophy size={16} /> The Wins Wall
          </button>
          <button className={active('/share')} onClick={() => go('/share')}>
            <Users size={16} /> Share a Datapoint
          </button>
          <button className={active('/education/profile-positioning')} onClick={() => go('/education/profile-positioning')}>
            <BookOpen size={16} /> Strategy Guides
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
