import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export const RoleRoute = ({ children, allowedRoles }) => {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redirect to their respective home if they try to access wrong dashboard
    const dashboardMap = {
      candidate: '/dashboard/candidate',
      employer: '/dashboard/employer',
      admin: '/dashboard/admin/pending-jobs',
    }
    return <Navigate to={dashboardMap[profile?.role] || '/'} replace />
  }

  return children
}

export const GuestRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  if (user) {
    const dashboardMap = {
      candidate: '/dashboard/candidate',
      employer: '/dashboard/employer',
      admin: '/dashboard/admin/pending-jobs',
    }
    return <Navigate to={dashboardMap[profile?.role] || '/'} replace />
  }

  return children
}
