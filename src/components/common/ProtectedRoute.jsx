import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  // Login nahi kel tar → Login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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