import { useState, useEffect } from 'react'
import { Users, LayoutGrid, Package, TrendingUp, ShieldCheck, FileText, ShoppingCart, Tractor, Factory, MoreHorizontal, UserCheck } from 'lucide-react'
import { authAPI, bookingAPI, orderAPI, schemeAPI, productAPI, equipmentAPI } from '../../api'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    orders: 0,
    schemes: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [ordersData, setOrdersData] = useState([])
  const [bookingsData, setBookingsData] = useState([])
  const [usersData, setUsersData] = useState([])

  const fetchStats = async () => {
    try {
      const [u, b, o, s] = await Promise.all([
        authAPI.getAllUsers(), 
        bookingAPI.getAllBookings(),
        orderAPI.getAllOrders(),
        schemeAPI.getAll()
      ])
      
      const uData = u.data || []
      const bData = b.data || []
      const oData = o.data || []

      setStats({
        users: uData.length,
        bookings: bData.length,
        orders: oData.length,
        schemes: s.data?.length || 0,
        totalRevenue: oData.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0)
      })
      
      setUsersData(uData)
      setOrdersData(oData)
      setBookingsData(bData)
    } catch (err) {
      console.error("Stats failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    { label: 'Total Users', value: stats.users, icon: <Users />, color: 'bg-blue-600' },
    { label: 'System Bookings', value: stats.bookings, icon: <Tractor />, color: 'bg-green-600' },
    { label: 'System Orders', value: stats.orders, icon: <ShoppingCart />, color: 'bg-orange-600' },
    { label: 'Total Sales', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <TrendingUp />, color: 'bg-purple-600' },
  ]

  const getRoleBadge = (role) => {
    const map = {
      'farmer': { bg: 'bg-blue-100 text-blue-700', label: 'शेतकरी' },
      'equipment_owner': { bg: 'bg-green-100 text-green-700', label: 'मालक' },
      'mart_owner': { bg: 'bg-orange-100 text-orange-700', label: 'दुकानदार' },
      'factory_owner': { bg: 'bg-purple-100 text-purple-700', label: 'कारखाना' },
      'admin': { bg: 'bg-slate-900 text-white', label: 'ऍडमिन' }
    }
    const data = map[role] || { bg: 'bg-slate-100 text-slate-700', label: role }
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${data.bg}`}>{data.label}</span>
  }

  const getUserActivity = (userId, role) => {
    if (role === 'farmer') {
      const uBookings = bookingsData.filter(b => b.farmerId === userId).length
      const uOrders = ordersData.filter(o => o.farmerId === userId).length
      return `${uBookings} बुकिंग्स | ${uOrders} ऑर्डर्स`
    }
    if (role === 'equipment_owner') {
      const uBookings = bookingsData.filter(b => b.ownerId === userId).length
      return `${uBookings} कामाच्या विनंत्या`
    }
    if (role === 'mart_owner') {
      const uOrders = ordersData.filter(o => o.ownerId === userId).length
      return `${uOrders} विक्री ऑर्डर्स`
    }
    return '-'
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-outfit">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">MASTER CONTROL</h1>
            </div>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase opacity-70 ml-1">Platform Monitoring & System Analytics</p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={fetchStats} className="bg-white px-6 py-3 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">REFRESH DATA</button>
             <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Status: Active</span>
             </div>
          </div>
        </div>

        {/* Top Stats Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card) => (
            <div key={card.label} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
              <div className={`w-16 h-16 ${card.color} rounded-[24px] flex items-center justify-center text-white mb-6 shadow-xl shadow-current/20 group-hover:rotate-12 transition-transform duration-500`}>
                {card.icon}
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">{card.label}</p>
              <h2 className="text-4xl font-black text-slate-900">{card.value}</h2>
              {/* Abstract decoration */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
            </div>
          ))}
        </div>

        {/* Central Interface */}
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden min-h-[700px]">
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 p-2">
            {[
              { id: 'overview', label: '📊 SUMMARY', icon: <LayoutGrid size={16} /> },
              { id: 'users', label: '👥 USER DIRECTORY', icon: <Users size={16} /> },
              { id: 'orders', label: '📦 ALL ORDERS', icon: <ShoppingCart size={16} /> },
              { id: 'bookings', label: '🚜 ALL BOOKINGS', icon: <Tractor size={16} /> },
              { id: 'schemes', label: '🏛️ GOVT SCHEMES', icon: <FileText size={16} /> }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-[32px] mx-1
                  ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-lg shadow-primary-500/10' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-10">
            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                   <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-100 relative overflow-hidden group">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black text-slate-800 mb-2 italic">Platform Growth</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Real-time engagement tracking</p>
                        
                        <div className="flex items-end gap-1 h-40">
                           {usersData.slice(0, 15).map((_, i) => (
                             <div key={i} className="flex-1 bg-primary-200 rounded-t-lg transition-all hover:bg-primary-500 cursor-pointer group-hover:scale-110" 
                               style={{ height: `${20 + (Math.random() * 80)}%` }} />
                           ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                           <span>Last 15 Days</span>
                           <span>Today</span>
                        </div>
                      </div>
                      <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-100 rounded-full blur-[100px] opacity-30" />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Top Region</p>
                         <h4 className="text-2xl font-black text-emerald-900">Pune District</h4>
                         <p className="text-xs font-bold text-emerald-600/60 mt-1">42% of total users</p>
                      </div>
                      <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100">
                         <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Active Equipment</p>
                         <h4 className="text-2xl font-black text-amber-900">Tractors</h4>
                         <p className="text-xs font-bold text-amber-600/60 mt-1">Highest demand this week</p>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                   <div className="relative z-10 h-full flex flex-col">
                      <h3 className="text-xl font-black mb-8 italic flex items-center gap-3">
                         <UserCheck size={20} className="text-emerald-400" /> Recent Registrations
                      </h3>
                      <div className="space-y-6 flex-1">
                         {usersData.slice(0, 5).map((u, i) => (
                           <div key={i} className="flex items-center gap-4 group">
                              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">👤</div>
                              <div>
                                 <p className="font-black text-sm">{u.name}</p>
                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{u.role}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                      <button onClick={() => setActiveTab('users')} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all mt-8">View All Users →</button>
                   </div>
                   <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-primary-600/20 rounded-full blur-[80px]" />
                </div>
              </div>
            )}

            {/* ─── USERS DIRECTORY TAB ─── */}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800">Complete User Directory</h3>
                   <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Total: {usersData.length} Users
                   </div>
                </div>
                <div className="overflow-x-auto rounded-3xl border border-slate-50">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <th className="p-6">User / Business</th>
                        <th className="p-6">Role</th>
                        <th className="p-6">Location</th>
                        <th className="p-6">Platform Activity</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700">
                      {usersData.map((u) => (
                        <tr key={u._id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <td className="p-6">
                             <div>
                               <p className="font-black text-slate-900">{u.name}</p>
                               <p className="text-xs text-slate-400">{u.businessName || u.email}</p>
                             </div>
                          </td>
                          <td className="p-6">{getRoleBadge(u.role)}</td>
                          <td className="p-6">
                             <div className="flex items-center gap-2 text-slate-500">
                               <span className="text-xs italic truncate max-w-[150px]">{u.location}</span>
                             </div>
                          </td>
                          <td className="p-6">
                             <span className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary-600 uppercase tracking-tighter">
                                {getUserActivity(u._id, u.role)}
                             </span>
                          </td>
                          <td className="p-6 text-right">
                             {u.role !== 'admin' ? (
                               <button 
                                 onClick={async () => {
                                   if (window.confirm(`Kharch ${u.name} la Admin banvayche aahe?`)) {
                                     try {
                                       await authAPI.updateUserRole(u._id, 'admin')
                                       toast.success(`${u.name} aata Admin aahe!`)
                                       fetchStats()
                                     } catch (err) { toast.error('Error!') }
                                   }
                                 }}
                                 className="text-[10px] font-black uppercase text-primary-600 hover:underline tracking-widest">
                                 Make Admin
                               </button>
                             ) : (
                               u.email !== 'harshaljagdale40@gmail.com' && (
                                 <button 
                                   onClick={async () => {
                                     if (window.confirm(`Kharch ${u.name} kadun Admin role kadhun ghyaycha aahe?`)) {
                                       try {
                                         await authAPI.updateUserRole(u._id, 'farmer')
                                         toast.success('Admin Role Hataola!')
                                         fetchStats()
                                       } catch (err) { toast.error('Error!') }
                                     }
                                   }}
                                   className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 hover:underline tracking-widest">
                                   Revoke Admin
                                 </button>
                               )
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── ORDERS TAB ─── */}
            {activeTab === 'orders' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="pb-8">Order ID</th>
                      <th className="pb-8">Farmer Name</th>
                      <th className="pb-8">Final Amount</th>
                      <th className="pb-8">Current Status</th>
                      <th className="pb-8">Order Date</th>
                      <th className="pb-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-600">
                    {ordersData.map((o) => (
                      <tr key={o._id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="py-6 font-mono text-[10px] text-slate-400">{o._id.slice(-8).toUpperCase()}</td>
                        <td className="py-6">{o.farmerName}</td>
                        <td className="py-6 text-primary-600 font-black">₹{o.finalAmount}</td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${o.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                              o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-6 text-slate-400 text-xs font-black">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="py-6 text-right">
                          {o.status !== 'rejected' && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Kharch hi order cancel karaychi aahe?')) {
                                  try {
                                    await orderAPI.cancelOrder(o._id)
                                    toast.success('Order Cancelled!')
                                    fetchStats()
                                  } catch (err) { toast.error('Error!') }
                                }
                              }}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                              Cancel Order
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── BOOKINGS TAB ─── */}
            {activeTab === 'bookings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="pb-8">Reference</th>
                      <th className="pb-8">Farmer</th>
                      <th className="pb-8">Equipment</th>
                      <th className="pb-8">Amount</th>
                      <th className="pb-8">Status</th>
                      <th className="pb-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-600">
                    {bookingsData.map((b) => (
                      <tr key={b._id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="py-6 text-xs font-mono text-slate-400">{b._id.slice(-8).toUpperCase()}</td>
                        <td className="py-6">{b.farmerName}</td>
                        <td className="py-6 font-black">{b.equipmentName}</td>
                        <td className="py-6 text-primary-600 font-black">₹{b.totalAmount}</td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                              b.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-6 text-right">
                          {b.status !== 'cancelled' && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Kharch hi booking cancel karaychi aahe?')) {
                                  try {
                                    await bookingAPI.cancelBooking(b._id)
                                    toast.success('Booking Cancelled!')
                                    fetchStats()
                                  } catch (err) { toast.error('Error!') }
                                }
                              }}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                              Cancel Booking
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── SCHEMES TAB ─── */}
            {activeTab === 'schemes' && (
              <div className="text-center py-32 bg-slate-50 rounded-[64px] border-4 border-dashed border-slate-100 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl">🏛️</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 italic">Scheme Management Portal</h3>
                <p className="mb-10 font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Add, edit or remove government schemes</p>
                <button onClick={() => window.location.href='/admin/schemes'} 
                  className="bg-primary-600 text-white px-12 py-6 rounded-[32px] font-black text-lg shadow-2xl shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                  Manage Schemes Now →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
