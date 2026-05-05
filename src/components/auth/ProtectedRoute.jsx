import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export const RoleRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return null
  }

  // If we have a user but no profile yet, wait for the profile
  // This handles the gap between user being set and profile being fetched
  if (user && !profile) {
    return null
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    const dashboardMap = {
      candidate: '/dashboard/candidate',
      employer: '/dashboard/employer',
      admin: '/dashboard/admin',
    }
    
    // Redirect to their respective home if they try to access wrong dashboard
    const target = profile ? (dashboardMap[profile.role] || '/') : '/'
    
    // Safety check: if they are already at the target, don't redirect (prevent loops)
    if (window.location.pathname === target) {
      return children
    }

    return <Navigate to={target} replace />
  }

  return children
}

export const GuestRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return null
  }

  if (user) {
    // Wait for profile if user exists but profile is still null
    if (!profile) {
      return null
    }

    const dashboardMap = {
      candidate: '/dashboard/candidate',
      employer: '/dashboard/employer',
      admin: '/dashboard/admin',
    }
    return <Navigate to={dashboardMap[profile.role] || '/'} replace />
  }

  return children
}
