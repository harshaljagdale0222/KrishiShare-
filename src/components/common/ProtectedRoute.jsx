import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  // 1. Login check
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. Profile completion check
  const isProfileComplete = !!(user?.phone && user?.location && user?.role)
  const isCompletingProfile = window.location.pathname === '/complete-profile'

  if (!isProfileComplete && !isCompletingProfile) {
    console.log('Redirecting to complete-profile: missing fields')
    return <Navigate to="/complete-profile" replace />
  }

  // Role check — specific roles sathi
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Wrong dashboard la gela tar correct var pathav
    const roleRoutes = {
      farmer:   '/dashboard',
      owner:    '/store-dashboard',
      delivery: '/dashboard',
      admin:    '/dashboard',
    }
    return <Navigate to={roleRoutes[user?.role] || '/dashboard'} replace />
  }

  return <Outlet />
}