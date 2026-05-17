import { useState, useEffect } from 'react'
import { 
  Users, LayoutGrid, Package, TrendingUp, ShieldCheck, FileText, 
  ShoppingCart, Tractor, Factory, MessageSquare, Plus, Trash2, 
  CheckCircle, Loader2, Phone, MapPin, Building2 
} from 'lucide-react'
import { 
  authAPI, bookingAPI, orderAPI, schemeAPI, 
  factoryAPI, complaintAPI 
} from '../../api'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    orders: 0,
    schemes: 0,
    factories: 0,
    complaints: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [ordersData, setOrdersData] = useState([])
  const [bookingsData, setBookingsData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [factoriesData, setFactoriesData] = useState([])
  const [complaintsData, setComplaintsData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const fetchStats = async () => {
    try {
      const [u, b, o, s, f, c] = await Promise.all([
        authAPI.getAllUsers(), 
        bookingAPI.getAllBookings(),
        orderAPI.getAllOrders(),
        schemeAPI.getAll(),
        factoryAPI.getAll(),
        complaintAPI.getAll()
      ])
      
      const uData = u.data || []
      const bData = b.data || []
      const oData = o.data || []
      const fData = f.data || []
      const cData = c.data || []

      setStats({
        users: uData.length,
        bookings: bData.length,
        orders: oData.length,
        schemes: s.data?.length || 0,
        factories: fData.length,
        complaints: cData.length,
        totalRevenue: oData.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0)
      })
      
      setUsersData(uData)
      setOrdersData(oData)
      setBookingsData(bData)
      setFactoriesData(fData)
      setComplaintsData(cData)
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
    { label: 'Sugar Mills', value: stats.factories, icon: <Building2 />, color: 'bg-emerald-600' },
    { label: 'Complaints', value: stats.complaints, icon: <MessageSquare />, color: 'bg-red-600' },
    { label: 'Total Sales', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <TrendingUp />, color: 'bg-purple-600' },
  ]

  const getRoleBadge = (role) => {
    const map = {
      'farmer':          { bg: 'bg-emerald-100 text-emerald-700', label: 'शेतकरी', icon: '🧑‍🌾' },
      'equipment_owner': { bg: 'bg-blue-100 text-blue-700',       label: 'अवजारे मालक', icon: '🚜' },
      'owner':           { bg: 'bg-blue-100 text-blue-700',       label: 'अवजारे मालक', icon: '🚜' },
      'mart_owner':      { bg: 'bg-orange-100 text-orange-700',   label: 'मार्ट मालक', icon: '🛒' },
      'factory_owner':   { bg: 'bg-purple-100 text-purple-700',   label: 'साखर कारखाना', icon: '🏭' },
      'admin':           { bg: 'bg-slate-900 text-white',         label: 'प्रशासक', icon: '🛡️' }
    }
    const data = map[role] || { bg: 'bg-slate-100 text-slate-700', label: role, icon: '👤' }
    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${data.bg} border border-current/10 shadow-sm`}>
        <span>{data.icon}</span>
        {data.label}
      </span>
    )
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
              { id: 'users', label: '👥 USERS', icon: <Users size={16} /> },
              { id: 'factories', label: '🏭 FACTORIES', icon: <Building2 size={16} /> },
              { id: 'complaints', label: '📢 COMPLAINTS', icon: <MessageSquare size={16} /> },
              { id: 'schemes', label: '🏛️ SCHEMES', icon: <FileText size={16} /> }
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
                           {Array(15).fill(0).map((_, i) => (
                             <div key={i} className="flex-1 bg-primary-200 rounded-t-lg transition-all hover:bg-primary-500 cursor-pointer" 
                               style={{ height: `${20 + (Math.random() * 80)}%` }} />
                           ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                           <span>Last 15 Days</span>
                           <span>Today</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl">
                   <h3 className="text-xl font-black mb-8 italic flex items-center gap-3">
                      <TrendingUp size={20} className="text-emerald-400" /> Recent Activity
                   </h3>
                   <div className="space-y-6">
                      {complaintsData.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">📢</div>
                           <div>
                              <p className="font-black text-xs">{c.farmerName}</p>
                              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{c.subject}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* ─── FACTORIES TAB ─── */}
            {activeTab === 'factories' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black text-slate-900 italic">Sugar Mill Management</h3>
                   <button className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20">
                      <Plus size={16} /> Add New Factory
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {factoriesData.map(f => (
                     <div key={f._id} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between mb-6">
                           <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">🏭</div>
                           <button 
                             onClick={async () => {
                               if(window.confirm('Delete this factory?')) {
                                 await factoryAPI.delete(f._id)
                                 toast.success('Deleted')
                                 fetchStats()
                               }
                             }}
                             className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                             <Trash2 size={20} />
                           </button>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase mb-4">{f.name}</h4>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <MapPin size={14} className="text-emerald-500" /> {f.location}
                           </div>
                           <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <Phone size={14} className="text-emerald-500" /> {f.contact}
                           </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${f.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {f.status}
                           </span>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{f.capacity}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* ─── COMPLAINTS TAB ─── */}
            {activeTab === 'complaints' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 italic mb-10">User Complaint Center</h3>
                <div className="space-y-6">
                   {complaintsData.map(c => (
                     <div key={c._id} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                           <MessageSquare size={24} />
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-lg font-black text-slate-900 uppercase">{c.subject}</h4>
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${c.status === 'pending' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                 {c.status}
                              </span>
                           </div>
                           <p className="text-slate-500 font-bold text-sm leading-relaxed">{c.message}</p>
                           <div className="flex gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>By: {c.farmerName}</span>
                              <span>To: {c.factoryName || 'Platform'}</span>
                              <span>Date: {new Date(c.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                        {c.status === 'pending' && (
                          <button 
                            onClick={async () => {
                              try {
                                await complaintAPI.updateStatus(c._id, 'resolved')
                                toast.success('Complaint Resolved!')
                                fetchStats()
                              } catch(e) {}
                            }}
                            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <CheckCircle size={16} /> Resolve
                          </button>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* ─── USERS TAB ─── */}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96 group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                      <LayoutGrid size={20} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search users by name or email..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[28px] outline-none focus:border-primary-600 focus:bg-white focus:shadow-2xl focus:shadow-primary-500/10 transition-all font-black text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    Found {usersData.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).length} Users
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[40px] border border-slate-100 bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        <th className="p-8">User Identity</th>
                        <th className="p-8">Role / Access</th>
                        <th className="p-8">Region</th>
                        <th className="p-8 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700">
                      {usersData
                        .filter(u => 
                          u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((u) => (
                        <tr 
                          key={u._id} 
                          onClick={() => setSelectedUser(u)}
                          className="border-t border-slate-50 hover:bg-primary-50/30 transition-all cursor-pointer group"
                        >
                          <td className="p-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-primary-600 group-hover:text-white transition-all">
                                   {u.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                   <p className="font-black text-slate-900 text-lg group-hover:text-primary-600 transition-colors">{u.name}</p>
                                   <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-8">{getRoleBadge(u.role)}</td>
                          <td className="p-8">
                             <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-wide">
                                <MapPin size={14} className="text-slate-300" /> {u.location || 'Maharashtra'}
                             </div>
                          </td>
                          <td className="p-8 text-right">
                             <button className="bg-slate-50 text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary-600 group-hover:text-white transition-all">
                               VIEW PROFILE
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersData.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div className="py-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest opacity-40">
                       No users found matching your search
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── SCHEMES TAB ─── */}
            {activeTab === 'schemes' && (
              <div className="text-center py-32 bg-slate-50 rounded-[64px] border-4 border-dashed border-slate-100 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl">🏛️</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 italic">Scheme Management Portal</h3>
                <p className="mb-10 font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Manage government subsidies and benefits</p>
                <button onClick={() => window.location.href='/admin/schemes'} className="bg-primary-600 text-white px-12 py-6 rounded-[32px] font-black text-lg shadow-2xl shadow-primary-500/40 hover:scale-105 transition-all uppercase tracking-widest">
                  Manage Schemes Now →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── USER PROFILE MODAL ─── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary-400 via-purple-500 to-indigo-600" />
              
              <div className="p-12 pb-8 flex justify-between items-start">
                 <div className="flex items-center gap-8">
                    <div className="w-32 h-32 bg-slate-100 rounded-[40px] flex items-center justify-center text-5xl font-black text-slate-300 shadow-inner border-4 border-white">
                       {selectedUser.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                       <div className="flex items-center gap-4 mb-2">
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedUser.name}</h2>
                          {getRoleBadge(selectedUser.role)}
                       </div>
                       <p className="text-slate-400 text-lg font-bold">{selectedUser.email}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedUser(null)}
                   className="w-14 h-14 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-[22px] flex items-center justify-center transition-all group border border-slate-100"
                 >
                    <Plus size={28} className="rotate-45 group-hover:rotate-[135deg] transition-transform duration-500" />
                 </button>
              </div>

              <div className="p-12 pt-0 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</p>
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm"><Phone size={18} /></div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Phone Number</p>
                             <p className="font-black text-slate-800">{selectedUser.phone || 'Not Provided'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm"><MapPin size={18} /></div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Primary Location</p>
                             <p className="font-black text-slate-800">{selectedUser.location || 'Maharashtra, India'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl -mr-10 -mt-10" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Account Status</p>
                    <div className="space-y-6 relative z-10">
                       <div className="flex justify-between items-center border-b border-white/10 pb-4">
                          <span className="text-xs font-bold text-white/60">Registered On</span>
                          <span className="text-sm font-black">{new Date(selectedUser.createdAt || Date.now()).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/10 pb-4">
                          <span className="text-xs font-bold text-white/60">Profile Status</span>
                          <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Verified</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white/60">System ID</span>
                          <span className="text-[9px] font-black tracking-widest text-white/40">#{selectedUser._id.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-12 pt-0 flex gap-4">
                 {selectedUser.role !== 'admin' ? (
                   <button 
                     onClick={async () => {
                       if(window.confirm(`Make ${selectedUser.name} an Admin?`)) {
                         try {
                           await authAPI.updateUserRole(selectedUser._id, 'admin')
                           toast.success('Promoted to Admin!')
                           setSelectedUser(null)
                           fetchStats()
                         } catch(e) { toast.error('Failed to update role') }
                       }
                     }}
                     className="flex-1 bg-primary-600 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-primary-700 transition-all active:scale-95"
                   >
                      MAKE ADMIN
                   </button>
                 ) : (
                   <button 
                     onClick={async () => {
                       if(window.confirm(`Remove Admin rights from ${selectedUser.name}?`)) {
                         try {
                           await authAPI.updateUserRole(selectedUser._id, 'farmer') // Default back to farmer
                           toast.success('Admin rights removed')
                           setSelectedUser(null)
                           fetchStats()
                         } catch(e) { toast.error('Failed to update role') }
                       }
                     }}
                     className="flex-1 bg-amber-500 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-amber-600 transition-all active:scale-95"
                   >
                      REMOVE ADMIN
                   </button>
                 )}
                 <button 
                   onClick={async () => {
                     if(window.confirm(`PERMANENTLY DELETE ${selectedUser.name}? This cannot be undone.`)) {
                       try {
                         await authAPI.deleteUser(selectedUser._id)
                         toast.success('User Deleted Permanently')
                         setSelectedUser(null)
                         fetchStats()
                       } catch(e) { toast.error('Delete failed') }
                     }
                   }}
                   className="flex-1 bg-red-50 text-red-600 border-2 border-red-100 py-6 rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                 >
                    DEACTIVATE USER
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
