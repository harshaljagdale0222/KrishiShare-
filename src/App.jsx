import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import NotificationListener from './components/NotificationListener'
import ComplaintBot from './components/common/ComplaintBot'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import CompleteProfile from './pages/Auth/CompleteProfile'
import ForgotPassword from './pages/Auth/ForgotPassword'
import FarmerDashboard from './pages/Dashboard/FarmerDashboard'
import StoreOwnerDashboard from './pages/Dashboard/StoreOwnerDashboard'
import Shop from './pages/Mart/Shop'
import Cart from './pages/Mart/Cart'
import Orders from './pages/Mart/Orders'
import BookEquipment from './pages/Booking/BookEquipment'
import MyBookings from './pages/Booking/MyBookings'
import SugarFactory from './pages/SugarFactory/SugarFactory'
import PaymentsPage from './pages/Payments/PaymentsPage'
import WeatherPage from './pages/Weather/WeatherPage'
import GovernmentSchemes from './pages/Schemes/GovernmentSchemes'
import AdminSchemes from './pages/Admin/AdminSchemes'
import AdminDashboard from './pages/Admin/AdminDashboard'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import useAuthStore from './store/authStore'

function DashboardRedirect() {
  const { isAuthenticated, user, getDashboardRoute } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={getDashboardRoute()} replace />
}

function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname)
  const showNav = isAuthenticated && !isAuthPage

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${showNav ? 'md:flex-row' : ''}`}>
      <NotificationListener />
      <ComplaintBot />
      {showNav && <Navbar />}
      <main className={`flex-1 transition-all duration-300 ${showNav ? 'md:ml-64' : ''}`}>
        <Routes>
          <Route path="/"         element={<DashboardRedirect />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/go-dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard" element={<FarmerDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['farmer', 'admin']} />}>
            <Route path="/shop"           element={<Shop />} />
            <Route path="/cart"           element={<Cart />} />
            <Route path="/orders"         element={<Orders />} />
            <Route path="/book-equipment" element={<BookEquipment />} />
            <Route path="/my-bookings"    element={<MyBookings />} />
            <Route path="/sugar-factory"  element={<SugarFactory />} />
            <Route path="/payments"       element={<PaymentsPage />} />
            <Route path="/weather"        element={<WeatherPage />} />
            <Route path="/schemes"        element={<GovernmentSchemes />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin"          element={<AdminDashboard />} />
            <Route path="/admin/schemes"  element={<AdminSchemes />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['owner', 'equipment_owner', 'mart_owner', 'factory_owner']} />}>
            <Route path="/store-dashboard" element={<StoreOwnerDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App