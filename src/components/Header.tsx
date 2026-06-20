import { Menu, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  onMenuOpen?: () => void
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  function handleWordmarkClick() {
    navigate(user ? '/home' : '/')
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header__inner">
        <button className="header__wordmark" onClick={handleWordmarkClick}>
          <span className="word-intelligent">INTELLIGENT</span>
          <span className="word-funding">FUNDING</span>
        </button>

        <div className="header__actions">
          {!user ? (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/login')}>
                Log In
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              {!isLanding && onMenuOpen && (
                <button className="header__menu-btn" onClick={onMenuOpen} aria-label="Open menu">
                  <Menu size={20} />
                </button>
              )}
              <button className="btn btn--ghost btn--sm" style={{ gap: 6 }} onClick={handleLogout}>
                <LogOut size={14} />
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
