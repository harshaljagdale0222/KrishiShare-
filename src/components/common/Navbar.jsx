import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Tractor, LayoutDashboard, LogOut, Menu, X, Store, Bell, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useLanguageStore from '../../store/languageStore'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationDropdown from './NotificationDropdown'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { isAuthenticated, user, logout, getDashboardRoute } = useAuthStore()
  const { getTotalItems } = useCartStore()
  const { t, language }  = useLanguageStore()
  const navigate          = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isOwner  = ['owner', 'mart_owner', 'equipment_owner', 'factory_owner'].includes(user?.role)
  const isFarmer = ['farmer', 'admin'].includes(user?.role)

  const handleLogout = () => {
    logout()
    toast.success(t('logoutSuccess') || 'Logout successful!')
    navigate('/login')
    setMenuOpen(false)
  }

  const handleDashboard = () => {
    navigate(getDashboardRoute())
    setMenuOpen(false)
  }

  return (
    <>
      {/* ─── Mobile Top Bar ───────────────────────────────────────── */}
      <nav className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="text-xl font-bold text-primary-600">
            Krishi<span className="text-secondary-500">Share</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthenticated && <NotificationDropdown />}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 hover:text-gray-800 transition">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ─── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex-col z-50 shadow-sm transition-all duration-300">
        {/* LOGO AREA */}
        <div className="p-6 border-b border-gray-50 mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-primary-600/20">🌾</div>
            <div>
              <p className="text-lg font-black text-gray-800 leading-none">Krishi<span className="text-secondary-500">Share</span></p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Smart Farming</p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 py-2">
          <LanguageSwitcher />
          <div className="my-4 h-px bg-gray-50 mx-2" />

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <div className="mb-6 space-y-1">
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin Tools</p>
                  <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Admin Dashboard" />
                  <SidebarLink to="/admin/schemes" icon="🏛️" label="Manage Schemes" />
                </div>
              )}

              {isFarmer && user?.role !== 'admin' && (
                <>
                  <SidebarLink to="/shop" icon="🛒" label={t('krishiMart')} />
                  <SidebarLink to="/book-equipment" icon={<Tractor size={18} />} label={t('equipment')} />
                  <SidebarLink to="/sugar-factory" icon="🏭" label={t('sugarFactory')} />
                  <SidebarLink to="/weather" icon="🌦️" label={t('weather')} />
                  <SidebarLink to="/schemes" icon="🏛️" label={t('schemes')} />
                  <SidebarLink to="/orders" icon="📦" label={t('myOrders')} />
                  <SidebarLink to="/cart" icon={<ShoppingCart size={18} />} label={t('cartTitle')} badge={getTotalItems()} />
                </>
              )}

              {isOwner && (
                <>
                  <SidebarLink to="/store-dashboard" icon={<Store size={18} />} label={t('storeDashboard')} />
                  <SidebarLink to="/store-dashboard?tab=complaints" icon={<AlertCircle size={18} />} label={language === 'mr' ? 'तक्रार निवारण' : 'Complaints'} />
                  {user?.role === 'equipment_owner' && (
                    <SidebarLink to="/store-dashboard?tab=bookings" icon={<Tractor size={18} />} label={language === 'mr' ? 'अवजार बुकिंग' : 'Equipment Bookings'} />
                  )}
                </>
              )}
              
              {/* 🔔 Independent Notification Row */}
              <SidebarLink to="/notifications" icon={<Bell size={18} />} label="Alerts" />

              <SidebarLink to="/profile" icon="👤" label={t('profile')} />
            </>
          ) : (
            <>
              <SidebarLink to="/login" icon="🔑" label={t('login')} />
              <SidebarLink to="/register" icon="🌱" label={t('register')} />
            </>
          )}
        </div>

        {/* USER PROFILE CARD / ACTIONS */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
          {isAuthenticated ? (
            <div className="space-y-3">
              <Link to="/profile" className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all group">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 font-bold rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate group-hover:text-primary-600">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </Link>
              
              <div className="flex items-center gap-2">
                 <button onClick={handleLogout} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition flex items-center justify-center gap-2 font-bold text-xs shadow-sm shadow-red-500/10">
                   <LogOut size={16} /> {t('logout')}
                 </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400 font-medium italic">Pehle login kara!</p>
          )}
        </div>
      </aside>

      {/* ─── Mobile Sidebar Menu (Drawer) ─────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-4/5 bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
               <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-1">
                 <span className="text-2xl">🌾</span>
                 <span className="text-xl font-bold text-primary-600">KrishiShare</span>
               </Link>
               <button onClick={() => setMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-1">
               {isAuthenticated && (
                 <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 bg-primary-50 rounded-[28px] mb-6 border border-primary-100 active:scale-95 transition-all">
                   <div className="w-14 h-14 bg-white text-primary-600 font-black text-xl rounded-2xl flex items-center justify-center shadow-sm">
                     {user?.name?.[0]?.toUpperCase()}
                   </div>
                   <div>
                     <p className="text-lg font-black text-gray-800 leading-none">{user?.name}</p>
                     <p className="text-[10px] font-black text-primary-600 mt-1 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                   </div>
                 </Link>
               )}
               {isAuthenticated ? (
                 <>
                   <MobileLink to="/" icon="🏠" label={t('home')} close={() => setMenuOpen(false)} />
                   {isFarmer && (
                     <>
                        <MobileLink to="/shop"           icon="🛒" label={t('krishiMart')}   close={() => setMenuOpen(false)} />
                        <MobileLink to="/book-equipment" icon="🚜" label={t('equipment')}    close={() => setMenuOpen(false)} />
                        <MobileLink to="/sugar-factory"  icon="🏭" label={t('sugarFactory')} close={() => setMenuOpen(false)} />
                        <MobileLink to="/weather"        icon="🌦️" label={t('weather')}       close={() => setMenuOpen(false)} />
                        <MobileLink to="/schemes"        icon="🏛️" label={t('schemes')}       close={() => setMenuOpen(false)} />
                        {user?.role === 'admin' && (
                          <>
                            <MobileLink to="/admin"          icon="📊" label={language === 'mr' ? 'ऍडमिन कंट्रोल' : 'Admin Control'} close={() => setMenuOpen(false)} />
                            <MobileLink to="/admin/schemes"  icon="🛠️" label={language === 'mr' ? 'ऍडमिन योजना' : 'Admin Schemes'} close={() => setMenuOpen(false)} />
                          </>
                        )}
                        <MobileLink to="/orders"         icon="📦" label={t('myOrders')}     close={() => setMenuOpen(false)} />
                        <MobileLink to="/cart"           icon="🛒" label={`${t('cartTitle')} (${getTotalItems()})`} close={() => setMenuOpen(false)} />
                     </>
                   )}
                   {isOwner && (
                     <>
                       <MobileLink to="/store-dashboard" icon="🏪" label={t('storeDashboard')} close={() => setMenuOpen(false)} />
                       {user?.role === 'equipment_owner' && (
                         <MobileLink to="/store-dashboard?tab=bookings" icon="🚜" label={language === 'mr' ? 'अवजार बुकिंग' : 'Equipment Bookings'} close={() => setMenuOpen(false)} />
                       )}
                     </>
                   )}
                   <MobileLink to="/profile" icon="👤" label={t('profile')} close={() => setMenuOpen(false)} />
                   
                   <div className="pt-4 mt-4 border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 font-bold text-sm bg-red-50 rounded-xl">
                        <LogOut size={18} /> {t('logout')}
                      </button>
                   </div>
                 </>
               ) : (
                 <>
                   <MobileLink to="/login"    icon="🔑" label={t('login')}    close={() => setMenuOpen(false)} />
                   <MobileLink to="/register" icon="🌱" label={t('register')} close={() => setMenuOpen(false)} />
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SidebarLink({ to, icon, label, badge }) {
  const navigate = useNavigate()
  const isActive = window.location.pathname === to

  return (
    <Link to={to} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
      ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
      <div className="flex items-center gap-3">
        <span className={`text-lg transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
          {icon}
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </Link>
  )
}

function MobileLink({ to, icon, label, close }) {
  return (
    <Link to={to} onClick={close} className="flex items-center gap-4 p-4 text-gray-700 hover:bg-gray-50 rounded-2xl transition font-bold text-sm">
      <span className="text-xl">{icon}</span>
      {label}
    </Link>
  )
}