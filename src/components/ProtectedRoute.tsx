import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
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

  return <>{children}</>
}
