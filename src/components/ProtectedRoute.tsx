import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UpgradeGate from './UpgradeGate'

interface Props {
  children: React.ReactNode
  requireAdmin?: boolean
  requirePaid?: boolean
  feature?: string
}

export default function ProtectedRoute({ children, requireAdmin = false, requirePaid = false, feature }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/home" replace />

  // Full-member gate: admins always pass; trial/inactive users see the upgrade prompt.
  if (requirePaid && user.role !== 'admin' && user.subscription_status !== 'active') {
    return <UpgradeGate feature={feature} />
  }

  return <>{children}</>
}
