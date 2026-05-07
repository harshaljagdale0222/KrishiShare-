import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Clock, LogOut, Star, Leaf, AlertCircle, Tractor, MapPin, Calendar, Hash, TrendingUp,
  Sprout, ChevronRight
} from 'lucide-react'
import { io } from 'socket.io-client'
import useAuthStore from '../../store/authStore'
import useOrderStore from '../../store/orderStore'
import useBookingStore from '../../store/bookingStore'
import useLanguageStore from '../../store/languageStore'
import axios from 'axios'
import { maharashtraData } from '../../utils/locationData'
import { productAPI, notificationAPI, equipmentAPI, complaintAPI, harvestAPI } from '../../api'
import { sendWhatsAppMessage, WA_TEMPLATES } from '../../utils/whatsapp'
import toast from 'react-hot-toast'
import useNotificationStore from '../../store/notificationStore'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { generateInvoice } from '../../utils/invoiceGenerator'

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function OrderMap({ items, role }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  
  // Static center for Maharashtra
  const center = [19.7515, 75.7139] 
  
  // Use real coordinates if available, otherwise fallback to artificial spread for demo
  const markers = items.map((x, i) => {
    const hasRealPos = x.currentLocation?.lat && x.currentLocation?.lng
    const pos = hasRealPos 
      ? [x.currentLocation.lat, x.currentLocation.lng]
      : [19.0 + (Math.random() * 2), 74.0 + (Math.random() * 4)]

    return {
       id: x._id,
       pos,
       name: x.farmerName || x.farmer || x.userName || 'Farmer',
       village: x.address || x.farmerVillage || x.village,
       amount: role === 'equipment_owner' ? (x.amount || 0) : (x.finalAmount || 0),
       status: x.status
    }
  })

  return (
    <div className="h-[600px] w-full bg-white rounded-[40px] overflow-hidden border-8 border-white shadow-2xl relative">
       <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 max-w-xs">
          <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">📍 {isMR ? 'ऑर्डर ट्रॅकिंग' : 'Live Tracking'}</h4>
          <p className="text-[10px] text-gray-500 font-bold mt-1">{items.length} {isMR ? 'ऍक्टिव्ह लोकेशन्स' : 'Active Locations'}</p>
       </div>
       
       <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map(m => (
            <Marker key={m.id} position={m.pos}>
              <Popup>
                <div className="p-2 font-outfit">
                  <p className="font-black text-gray-900 text-base mb-1">{m.name}</p>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{m.village}</p>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="text-sm font-bold text-gray-600">Amount: <span className="text-gray-900">₹{m.amount}</span></p>
                  <p className="text-[10px] font-black uppercase text-gray-400 mt-1">Status: {m.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
       </MapContainer>
    </div>
  )
}

const initialProducts = []

const statusConfig = {
  pending:   { label:'Pending',   color:'bg-amber-100  text-amber-700  border-amber-200',  dot:'bg-amber-500'  },
  accepted:  { label:'Accepted',  color:'bg-blue-100   text-blue-700   border-blue-200',   dot:'bg-blue-500'   },
  packing:   { label:'Packing',   color:'bg-purple-100 text-purple-700 border-purple-200', dot:'bg-purple-500' },
  out_for_delivery: { label:'Out for Delivery', color:'bg-orange-100 text-orange-700 border-orange-200', dot:'bg-orange-500' },
  delivered: { label:'Delivered', color:'bg-green-100  text-green-700  border-green-200',  dot:'bg-green-500'  },
  rejected:  { label:'Rejected',  color:'bg-red-100    text-red-600    border-red-200',    dot:'bg-red-500'    },
}

function FarmerProfileModal({ farmerName, orders, bookings, role, onClose }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'

  const history = [
    ...orders.filter(o => (o.userName || o.farmerName || o.farmer) === farmerName),
    ...bookings.filter(b => (b.farmerName || b.farmer || b.userName) === farmerName)
  ].sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))

  const totalSpent = history.reduce((s, x) => s + (x.finalAmount || x.amount || 0), 0)

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[48px] w-full max-w-xl animate-in zoom-in duration-500 overflow-hidden shadow-2xl">
        <div className="bg-emerald-600 p-10 text-white relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
          <div className="flex items-center gap-6">
             <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl backdrop-blur-sm shadow-inner">👨‍🌾</div>
             <div>
               <h2 className="text-3xl font-black tracking-tight">{farmerName}</h2>
               <p className="text-xs font-black uppercase tracking-widest opacity-70 mt-1">📍 {history[0]?.village || history[0]?.location || 'Maharashtra'}</p>
             </div>
          </div>
        </div>
        
        <div className="p-10">
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isMR ? 'एकूण भेटी' : 'Total Visits'}</p>
                <p className="text-2xl font-black text-gray-900">{history.length}</p>
             </div>
             <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isMR ? 'एकूण खरेदी' : 'Total Spent'}</p>
                <p className="text-2xl font-black text-emerald-600">₹{(totalSpent || 0).toLocaleString()}</p>
             </div>
          </div>

          <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">📜 {isMR ? 'खरेदीचा इतिहास' : 'History'}</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {history.map((x, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">{x.items ? '🛒' : '🚜'}</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm truncate max-w-[150px]">{x.items ? x.items[0].name : x.equipmentName}</p>
                    <p className="text-[10px] font-bold text-gray-400">{new Date(x.createdAt || x.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 leading-none">₹{(x.finalAmount || x.amount || 0).toLocaleString()}</p>
                  <p className={`text-[8px] font-black uppercase mt-1 ${x.status==='delivered'||x.status==='completed'?'text-emerald-500':'text-amber-500'}`}>{x.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose, onUpdateStatus, user, language }) {
  const isMR = language === 'mr'
  const status = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Order Details</p>
              <h2 className="text-2xl font-black italic tracking-tighter">#{order._id.slice(-6).toUpperCase()}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <span className={`w-2 h-2 rounded-full ${statusConfig[order.status]?.dot || 'bg-gray-400'} animate-pulse`} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{statusConfig[order.status]?.label || order.status}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-6 bg-gray-50/30">
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 italic text-gray-400 text-xs shadow-sm">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">📦</div>
             <p>{isMR ? 'या ऑर्डरमधील वस्तूंची यादी खालीलप्रमाणे आहे.' : 'List of items included in this order.'}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-sm">{item.icon}</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.qty} {item.unit || 'unit'}</p>
                  </div>
                </div>
                <p className="font-black text-gray-900" style={{ fontSize: '13px' }}>₹{( (item.price || 0) * (item.qty || item.quantity || 0) ).toLocaleString()}</p>
              </div>
            ))}
            <div className="bg-emerald-50/50 p-5 flex justify-between items-center">
              <p className="font-black text-gray-500 text-xs uppercase tracking-widest">{isMR ? 'एकूण रक्कम' : 'Total Amount'}</p>
              <p className="text-2xl font-black text-emerald-600">₹{(order.finalAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">📍 {isMR ? 'पत्ता' : 'Delivery Address'}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{order.address}</p>
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={() => generatePDFBill(order, user, language)} 
              className="flex-1 bg-white border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/5">
              <Download size={18} /> {isMR ? 'बिल डाऊनलोड' : 'Bill'}
            </button>
            {order.status === 'pending' && (
              <button onClick={() => { onUpdateStatus(order._id, 'accepted'); onClose(); }} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20">
                {isMR ? 'ऑर्डर स्वीकारा' : 'Accept Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ orders, products, bookings, role, onStatClick }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.finalAmount || 0), 0)
  const bookingEarnings = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length

  const successItems = (role === 'equipment_owner' ? bookings : orders)
    .filter(x => ['completed', 'accepted', 'delivered', 'confirmed', 'out_for_delivery'].includes(x.status))
  
  const avgOrderValue = successItems.length 
    ? Math.round((role === 'equipment_owner' ? bookingEarnings : totalRevenue) / successItems.length) 
    : 0

  const productSales = {}
  successItems.forEach(x => {
    if (role === 'equipment_owner') {
      productSales[x.equipmentName] = (productSales[x.equipmentName] || 0) + 1
    } else {
      x.items?.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.qty
      })
    }
  })
  const bestSeller = Object.entries(productSales).sort((a,b) => b[1] - a[1])[0] || ["None", 0]

  const stats = role === 'equipment_owner' ? [
    { id: 'completed', icon:'💰', label: isMR ? 'एकूण कमाई' : 'Earnings',    value:`₹${bookingEarnings.toLocaleString()}`, color:'from-emerald-600 to-teal-700' },
    { id: 'all',       icon:'🏆', label: isMR ? 'लोकप्रिय यंत्र' : 'Top Machine',   value: bestSeller[0], color:'from-orange-500 to-red-600', sub: `${bestSeller[1]} bookings` },
    { id: 'all',       icon:'📈', label: isMR ? 'सरासरी बुकिंग' : 'Avg Booking',  value: `₹${avgOrderValue.toLocaleString()}`, color:'from-blue-600 to-indigo-700' },
    { id: 'pending',   icon:'⏳', label: isMR ? 'प्रतीक्षेत' : 'Pending',           value: pendingBookings, color:'from-purple-600 to-violet-700' },
  ] : [
    { id: 'delivered', icon:'💰', label: isMR ? 'एकूण कमाई' : 'Net Earnings',    value:`₹${totalRevenue.toLocaleString()}`, color:'from-emerald-600 to-teal-700' },
    { id: 'all',       icon:'🏆', label: isMR ? 'सर्वात जास्त विक्री' : 'Best Seller',   value: bestSeller[0], color:'from-orange-500 to-red-600', sub: `${bestSeller[1]} units` },
    { id: 'all',       icon:'📈', label: isMR ? 'सरासरी ऑर्डर' : 'Avg Order',      value: `₹${avgOrderValue.toLocaleString()}`, color:'from-blue-600 to-indigo-700' },
    { id: 'pending',   icon:'⏳', label: isMR ? 'प्रतीक्षेत' : 'Pending',           value: pendingOrders, color:'from-purple-600 to-violet-700' },
  ]

  const chartData = successItems.reduce((acc, x) => {
    const month = new Date(x.createdAt || x.date).toLocaleDateString(isMR ? 'mr-IN' : 'en-US', { month: 'short' })
    const amt = x.finalAmount || x.amount || 0
    const existing = acc.find(i => i.month === month)
    if (existing) existing.total += amt
    else acc.push({ month, total: amt })
    return acc
  }, [])

  const distribution = (role === 'equipment_owner' ? bookings : orders).reduce((acc, x) => {
    const cat = role === 'equipment_owner' ? (x.category || 'Machinery') : (x.items?.[0]?.category || 'General')
    const existing = acc.find(i => i.name === cat)
    if (existing) existing.value += 1
    else acc.push({ name: cat, value: 1 })
    return acc
  }, [])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} onClick={() => onStatClick(role === 'equipment_owner' ? 'bookings' : 'orders', stat.id)}
            className={`bg-gradient-to-br ${stat.color} rounded-[32px] p-6 text-white shadow-xl cursor-pointer active:scale-95 transition-all group relative overflow-hidden`}>
            <div className="absolute -right-2 -bottom-2 opacity-10 text-6xl">{stat.icon}</div>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl mb-4 backdrop-blur-sm">{stat.icon}</div>
            <p className="text-xl font-black truncate">{stat.value}</p>
            <p className="text-[9px] uppercase font-black tracking-widest opacity-80 mt-1">{stat.label}</p>
            {stat.sub && <p className="text-[8px] font-bold opacity-60 mt-2 bg-black/20 px-2 py-0.5 rounded-md w-fit">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-gray-100 p-8 shadow-sm">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">💰 {isMR ? 'महिन्याची कमाई' : 'Monthly Revenue'}</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-gray-100 p-8 shadow-sm">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">🏆 {isMR ? 'श्रेणी' : 'Category Share'}</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {distribution.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-gray-100 p-6 shadow-sm">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">📊 {role === 'equipment_owner' ? (isMR ? 'बुकिंग स्टेटस' : 'Booking Status') : 'Order Status'}</h3>
          <div className="space-y-5">
            {(role === 'equipment_owner' ? ['pending','accepted','completed','rejected'] : ['delivered','accepted','packing','out_for_delivery','pending','rejected']).map((s) => {
              const count = role === 'equipment_owner' 
                ? bookings.filter(b => b.status === s).length
                : orders.filter(o => o.status === s).length
              const totalCount = role === 'equipment_owner' ? bookings.length : orders.length
              return (
                <div key={s}>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2">
                    <span className="text-gray-400 capitalize">{s}</span>
                    <span className="text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${s==='delivered' || s==='completed' ?'bg-emerald-500':s==='accepted'?'bg-blue-500':s==='packing'?'bg-purple-500':s==='out_for_delivery'?'bg-orange-500':s==='pending'?'bg-amber-500':'bg-red-500'}`}
                      style={{ width: totalCount ? `${(count/totalCount)*100}%` : '0%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-gray-100 p-6 shadow-sm">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">⚠️ Stock Alert</h3>
          {products.filter(p => p.stock <= 10).length === 0 ? (
            <div className="text-center py-10 text-gray-300"><div className="text-4xl mb-3 opacity-20">✅</div><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">All stock is healthy</p></div>
          ) : (
            <div className="space-y-3">
              {products.filter(p => p.stock <= 10).map((p) => (
                <div key={p._id} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="text-sm font-black text-gray-900">{p.name}</p>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-wide">{p.stock === 0 ? '❌ Out of Stock!' : `⚠️ Fakt ${p.stock} shillak`}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ orders, onUpdateStatus, initialFilter = 'all', onFarmerClick }) {
  const { language } = useLanguageStore()
  const { user } = useAuthStore()
  const isMR = language === 'mr'
  const [filter, setFilter] = useState(initialFilter)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Real Tracking States
  const [activeTrackingIds, setActiveTrackingIds] = useState([])
  const watchRef = useRef(null)
  const idsRef = useRef([])

  useEffect(() => {
    idsRef.current = activeTrackingIds
    
    if (activeTrackingIds.length > 0 && !watchRef.current) {
      if (!navigator.geolocation) {
        toast.error(isMR ? 'तुमच्या ब्राउझरमध्ये GPS सपोर्ट नाही!' : 'GPS not supported!')
        return
      }
      
      watchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          // Update all active orders
          for (const orderId of idsRef.current) {
            try {
              await orderAPI.updateLocation(orderId, { lat: latitude, lng: longitude })
            } catch (e) { console.error(`Failed to update ${orderId}`, e) }
          }
        },
        (err) => {
          console.error('GPS Error:', err)
          toast.error(isMR ? 'GPS सिग्नल मिळत नाही!' : 'GPS signal lost!')
        },
        { enableHighAccuracy: true }
      )
    } else if (activeTrackingIds.length === 0 && watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }, [activeTrackingIds, isMR])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const toggleTracking = (orderId) => {
    if (activeTrackingIds.includes(orderId)) {
      setActiveTrackingIds(prev => prev.filter(id => id !== orderId))
      toast.success(isMR ? 'या ऑर्डरचे GPS बंद केले.' : 'GPS Stopped for this order.')
    } else {
      setActiveTrackingIds(prev => [...prev, orderId])
      toast.success(isMR ? 'या ऑर्डरचे Live GPS सुरू झाले! 🛵' : 'Live GPS Started for this order! 🛵')
    }
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all','pending','accepted','packing','out_for_delivery','delivered','rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${filter === f ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200 hover:text-emerald-600'}`}>
            {f}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${filter === f ? 'bg-white/20' : 'bg-gray-50'}`}>{f === 'all' ? orders.length : orders.filter(o => o.status === f).length}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/50 border-2 border-dashed border-gray-100 rounded-[32px] opacity-60"><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No orders found</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending
            return (
              <div key={order._id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-500 p-6 animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div onClick={() => onFarmerClick?.(order.farmerName)} className="cursor-pointer group/name">
                    <p className="font-black text-gray-900 text-lg group-hover/name:text-emerald-600 transition-colors">{order.farmerName}<span className="text-gray-300 font-bold text-[10px] ml-3 tracking-widest group-hover/name:text-gray-300">#{order._id.slice(-6).toUpperCase()}</span></p>
                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      <span className="text-emerald-600 font-black group-hover/name:underline decoration-2">📱 {order.farmerPhone}</span>
                      <span>📍 {order.address}</span>
                      {order.landmark && <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded italic shadow-sm border border-amber-100 font-black">🏠 {isMR ? "जवळचे ठिकाण: " : "Landmark: "} {order.landmark}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex items-center gap-2 ${status.color}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${status.dot}`} />{status.label}
                  </span>
                  {order.advancePaid && (
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5 ml-auto md:ml-0">
                      💰 {isMR ? "अ‍ॅडव्हान्स मिळाला" : "Advance Received"}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 mb-5 border border-gray-100">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-2"><span>{item.icon}</span>{item.name} <span className="text-gray-400">× {item.qty}</span></span>
                      <span className="text-xs font-black text-gray-950">₹{( (item.price || 0) * (item.qty || item.quantity || 0) ).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                      <span>💳 {order.payment?.toUpperCase()}</span>
                      <span>🚚 {order.distance} KM</span>
                    </div>
                    <p className="font-black text-emerald-600 text-lg">₹{(order.finalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mb-3">
                    <button onClick={() => setSelectedOrder(order)}
                      className="flex-1 bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 py-4 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent hover:border-emerald-100">
                      <Eye size={16} /> {isMR ? 'सविस्तर पहा' : 'View Details'}
                    </button>
                   {(order.status === 'delivered' || order.status === 'out_for_delivery') && (
                    <button onClick={() => generateInvoice(order, user)} 
                      className="flex-1 bg-white border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 py-4 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Download size={16} /> {isMR ? 'बिल डाऊनलोड' : 'Bill'}
                    </button>
                  )}
                </div>
                <div className="w-full">
                  {order.status === 'pending' && (
                    <div className="flex gap-3">
                      <button onClick={() => onUpdateStatus(order._id, 'accepted')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">Accept Order</button>
                      <button onClick={() => onUpdateStatus(order._id, 'rejected')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95">{isMR ? 'रद्द करा' : 'Reject / Cancel'}</button>
                    </div>
                  )}
                  {order.status === 'accepted' && (
                    <div className="flex flex-col gap-2">
                       {!order.advancePaid && (
                         <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center animate-pulse">
                           ⚠️ {isMR ? "शेतकऱ्याने १०% अ‍ॅडव्हान्स भरल्यावरच पॅकिंग सुरू करता येईल" : "Packing can start after farmer pays 10% advance"}
                         </p>
                       )}
                       <button 
                        onClick={() => onUpdateStatus(order._id, 'packing')} 
                        disabled={!order.advancePaid}
                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${!order.advancePaid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20'}`}
                       >
                         {isMR ? "पॅकिंग सुरू करा" : "Start Packing"}
                       </button>
                    </div>
                  )}
                  {order.status === 'packing' && (
                    <button onClick={() => onUpdateStatus(order._id, 'out_for_delivery')} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-95">Send for Delivery</button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <div className="space-y-3">
                      <button 
                         onClick={() => toggleTracking(order._id)}
                         className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${activeTrackingIds.includes(order._id) ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                      >
                         {activeTrackingIds.includes(order._id) ? (isMR ? '⏹ GPS बंद करा' : '⏹ Stop GPS') : (isMR ? '📡 लाईव्ह ट्रॅकिंग सुरू करा' : '📡 Start Real GPS')}
                      </button>
                      <button onClick={() => onUpdateStatus(order._id, 'delivered')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">{isMR ? 'पोहोचली ✅' : 'Pohachli ✅'}</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={onUpdateStatus}
          user={user}
          language={language}
        />
      )}
    </div>
  )
}

function ProductsTab({ products, setProducts }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const categories = [
    { id: 'seeds',       icon: '🌱', label: isMR ? 'बियाणे' : 'Seeds' },
    { id: 'fertilizer',  icon: '📦', label: isMR ? 'खते' : 'Fertilizers' },
    { id: 'pesticide',   icon: '🧪', label: isMR ? 'कीटकनाशके' : 'Pesticides' },
    { id: 'tools',       icon: '🔧', label: isMR ? 'अवजारे' : 'Tools' },
    { id: 'other',       icon: '✨', label: isMR ? 'इतर' : 'Other' },
  ]

  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name:'', icon:'🌱', category:'seeds', price:'', mrp:'', stock:'', weight: '', unit: 'kg', customCategory: '' })
  const openAdd = () => { setForm({ name:'', icon:'🌱', category:'seeds', price:'', mrp:'', stock:'', weight: '', unit: 'kg', customCategory: '' }); setEditProduct(null); setShowModal(true) }
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p._id); setShowModal(true) }
  
  const filteredProducts = products.filter(p => filter === 'all' || p.category === filter)

  const handleSave = async () => {
    if (!form.name || !form.price || !form.mrp || !form.stock || !form.weight) { 
      toast.error(isMR ? 'कृपया सर्व माहिती भरा!' : 'Please fill all fields!')
      return 
    }
    if (form.category === 'other' && !form.customCategory) {
      toast.error(isMR ? 'कृपया प्रकाराचे नाव टाका!' : 'Please enter custom category name!')
      return
    }

    const payload = { 
      ...form, 
      category: form.category === 'other' ? form.customCategory : form.category,
      price: Number(form.price), 
      mrp: Number(form.mrp), 
      stock: Number(form.stock),
      weight: Number(form.weight)
    }
    if (editProduct) {
      try {
        const res = await productAPI.update(editProduct, payload)
        setProducts(prev => prev.map(p => p._id === editProduct ? res.data : p))
        toast.success(isMR ? 'उत्पादन अपडेट झाले! ✅' : 'Product updated! ✅')
      } catch (err) { toast.error(isMR ? 'अपडेट अयशस्वी!' : 'Update failed!') }
    } else {
      try {
        const res = await productAPI.create(payload)
        setProducts(prev => [res.data, ...prev])
        toast.success(isMR ? 'नवीन उत्पादन जोडले गेले! 🌱' : 'New product added! 🌱')
      } catch (err) { toast.error(isMR ? 'जोडणे अयशस्वी!' : 'Add failed!') }
    }
    setShowModal(false)
  }
  const handleRemove = async (id) => {
    if (!window.confirm(isMR ? 'तुम्हाला खात्री आहे की हे उत्पादन काढून टाकायचे आहे?' : 'Are you sure you want to remove this product?')) return
    try {
      await productAPI.remove(id)
      setProducts(prev => prev.filter(p => p._id !== id))
      toast.success(isMR ? 'उत्पादन काढून टाकले!' : 'Product removed!')
    } catch (err) { toast.error(isMR ? 'काढून टाकणे अयशस्वी!' : 'Remove failed!') }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="font-black text-gray-900 text-2xl tracking-tight">🌱 {isMR ? 'मालसाठा' : 'Inventory'}</h3>
           <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1">{products.filter(p=>p.active).length} {isMR ? 'सक्रीय वस्तू' : 'Active Items'}</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200'}`}>
            {isMR ? 'सर्व' : 'All'}
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${filter === c.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200'}`}>
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all hover:-translate-y-1">
          <Plus size={18} className="stroke-[3]" /> {isMR ? 'उत्पादन जोडा' : 'Add Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product._id} className={`bg-white rounded-[40px] border shadow-sm p-6 transition-all duration-500 ${!product.active ? 'opacity-50 grayscale border-gray-200' : 'border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 group'}`}>
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-[32px] flex items-center justify-center text-5xl flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">{product.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <p className="font-black text-gray-900 text-xl leading-tight line-clamp-2">{product.name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-1 opacity-70">
                        {categories.find(c => c.id === product.category)?.icon} {categories.find(c => c.id === product.category)?.label}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-lg opacity-70">{product.weight} {product.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(product)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all hover:scale-110"><Edit2 size={16} /></button>
                    <button onClick={() => handleRemove(product._id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all hover:scale-110"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-5">
                  <div>
                    <span className="font-black text-gray-900 text-xl">₹{product.price}</span>
                    <span className="text-gray-300 text-xs font-bold line-through ml-2">₹{product.mrp}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-100"></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl ${product.stock===0?'bg-red-50 text-red-600':product.stock<=10?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}>{isMR ? 'साठा' : 'Stock'}: {product.stock}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-24 text-center bg-gray-50/50 rounded-[64px] border-4 border-dashed border-gray-100">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-4xl opacity-20">📭</div>
           <p className="text-xl font-black text-gray-400 uppercase tracking-widest">{isMR ? 'या वर्गातील पदे रिक्त आहेत' : 'No items in this category'}</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-[56px] w-full max-w-lg animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
            
            <div className="bg-white p-10 pb-6 flex justify-between items-center">
              <h2 className="font-black text-3xl text-gray-900 tracking-tight italic">{isMR ? (editProduct ? 'बदल करा' : 'नवीन नोंदणी') : (editProduct ? 'Edit Item' : 'New Product')}</h2>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all group border border-gray-100">
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="px-10 pb-10 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'वर्ग निवड करा *' : 'Select Category *'}</label>
                   <select value={form.category} onChange={(e) => {
                     const cat = categories.find(c => c.id === e.target.value);
                     setForm({ ...form, category: e.target.value, icon: cat.icon })
                   }} className="w-full px-6 py-4 border-2 border-gray-50 hover:border-emerald-100 focus:border-emerald-600 bg-gray-50 rounded-[24px] outline-none transition-all font-black appearance-none">
                     {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                   </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'उत्पादनाचे ब्रँड/नाव *' : 'Product Brand/Name *'}</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isMR ? "उदा. महाबीज सोयाबीन" : "e.g. Mahabeej Soybean"} className="w-full px-6 py-4 border-2 border-gray-50 focus:border-emerald-600 bg-gray-50 rounded-[24px] outline-none transition-all font-black" />
                </div>
              </div>

              {form.category === 'other' && (
                <div className="animate-in zoom-in duration-300">
                  <label className="text-[11px] font-black text-amber-600 uppercase tracking-widest block mb-2 ml-1">हा कोणता नवीन विभाग आहे? (Category Group Name)</label>
                  <input type="text" value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} placeholder={isMR ? "उदा. हात अवजारे, ठिबक संच" : "e.g. Hand Tools, Drip Sets"} className="w-full px-6 py-4 border-2 border-amber-100 focus:border-amber-600 bg-amber-50 rounded-[24px] outline-none transition-all font-black" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'वजन / माप *' : 'Weight / Qty *'}</label>
                  <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="उदा. 5" className="w-full px-5 py-4 border-2 border-gray-100 focus:border-emerald-600 bg-gray-50 rounded-2xl outline-none transition font-bold" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'युनिट *' : 'Unit *'}</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-5 py-4 border-2 border-gray-100 focus:border-emerald-600 bg-gray-50 rounded-2xl outline-none transition font-bold">
                    <option value="kg">{isMR ? 'किलो (kg)' : 'kg'}</option>
                    <option value="liter">{isMR ? 'लिटर (Liter)' : 'Liter'}</option>
                    <option value="unit">{isMR ? 'नग (Unit)' : 'Unit'}</option>
                    <option value="gram">{isMR ? 'ग्रॅम (Gram)' : 'Gram'}</option>
                    <option value="ml">{isMR ? 'मिली (ml)' : 'ml'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'विक्री किंमत ₹ *' : 'Selling Price ₹ *'}</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-5 py-4 border-2 border-gray-100 focus:border-emerald-600 bg-gray-50 rounded-2xl outline-none transition font-bold" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'MRP ₹ *' : 'MRP ₹ *'}</label>
                  <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="w-full px-5 py-4 border-2 border-gray-100 focus:border-emerald-600 bg-gray-50 rounded-2xl outline-none transition font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{isMR ? 'शिल्लक माल (Stock) *' : 'Initial Stock *'}</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-5 py-4 border-2 border-gray-100 focus:border-emerald-600 bg-gray-50 rounded-2xl outline-none transition font-bold" />
              </div>

              <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-emerald-500/30 transition-all mt-4">
                {isMR ? (editProduct ? 'अपडेट करा' : 'माहिती सेव्ह करा') : (editProduct ? 'Update Product' : 'Save Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComplaintsTab({ complaints, onUpdateStatus }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  
  const filtered = complaints.filter(c => filter === 'all' || c.status === filter)
  const statusColors = {
    pending:   'bg-red-50    text-red-700    border-red-100',
    resolving: 'bg-amber-50  text-amber-700  border-amber-100',
    resolved:  'bg-green-50  text-green-700  border-green-100'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-white rounded-[24px] border border-gray-100 shadow-sm w-fit overflow-x-auto scrollbar-hide">
          {['all','pending','resolving','resolved'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${filter === f ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}>
              {f === 'all' ? (isMR ? 'सर्व' : 'All') : f}
              <span className="ml-2 opacity-50">{f === 'all' ? complaints.length : complaints.filter(c => c.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((c) => (
          <div key={c._id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-xl shadow-gray-500/5 hover:shadow-2xl hover:border-red-100 transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl opacity-10 ${c.status === 'pending' ? 'bg-red-500' : 'bg-emerald-500'}`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-[22px] flex items-center justify-center text-2xl shadow-inner border border-red-100/50 group-hover:scale-110 transition-transform">💡</div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
                    c.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                    c.priority === 'low' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {c.priority || 'medium'}
                  </span>
                </div>
              </div>
              
              <h4 className="font-black text-2xl text-gray-900 tracking-tight leading-tight mb-2">{c.subject}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                👤 {c.farmerName} • 🕒 {new Date(c.createdAt).toLocaleDateString()}
              </p>

              <div className="my-6 p-5 bg-gray-50/50 rounded-[28px] border border-gray-100 line-clamp-2 italic text-gray-600 text-sm">
                "{c.message}"
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelected(c)} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:-translate-y-1 transition-all active:scale-95">
                  {isMR ? 'माहिती पहा 🔍' : 'View Details 🔍'}
                </button>
                {c.status !== 'resolved' && (
                  <button onClick={() => onUpdateStatus(c._id, 'resolved')} className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                    <Check size={20} className="stroke-[3]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[64px] border-4 border-dashed border-gray-100">
            <div className="text-6xl mb-6 opacity-20">🛡️</div>
            <p className="text-2xl font-black text-gray-900">एकही तक्रार नाही</p>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-[0.3em]">Hassle-free business! 🚀</p>
          </div>
        )}
      </div>

      {/* DETAILED COMPLAINT MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[56px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden my-auto">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-amber-500 to-red-600" />
            
            <div className="p-10 pb-6 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Complaint Details</p>
                <h2 className="font-black text-3xl text-gray-900 tracking-tight leading-tight">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-14 h-14 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-[22px] flex items-center justify-center transition-all group">
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="p-10 pt-0 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Farmer (शेतकरी)</p>
                   <p className="font-black text-gray-900 text-lg">{selected.farmerName}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 text-right font-outfit">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</p>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                     selected.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                     selected.priority === 'low' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                     'bg-amber-50 text-amber-600 border-amber-100'
                   }`}>
                     {selected.priority || 'Medium'}
                   </span>
                </div>
              </div>

              <div className="space-y-4 bg-emerald-50/30 p-8 rounded-[40px] border border-emerald-100/50">
                <div className="flex justify-between items-center pb-4 border-b border-emerald-100/30">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Driver Info</p>
                  <p className="font-black text-gray-900">{selected.driverName || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-emerald-100/30">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Toli Number</p>
                  <p className="font-black text-gray-900 tracking-widest">#{selected.toliNumber || 'MANUAL'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Logged At</p>
                  <p className="font-black text-gray-900">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border-2 border-dashed border-gray-100 relative">
                <div className="absolute -top-3 left-8 px-4 bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</div>
                <p className="text-gray-700 font-medium italic leading-relaxed text-lg">"{selected.message}"</p>
              </div>

              <div className="flex gap-4 p-2 bg-gray-50 rounded-[28px] border border-gray-100">
                {selected.status !== 'resolved' ? (
                  <>
                    <button onClick={() => { onUpdateStatus(selected._id, 'resolving'); setSelected(null) }} 
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                      Take Action 🚀
                    </button>
                    <button onClick={() => { onUpdateStatus(selected._id, 'resolved'); setSelected(null) }} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                      Mark Resolved ✅
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-4 text-emerald-600 font-black uppercase text-xs tracking-widest">
                     <Check size={18} /> This case is resolved
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationsTab({ notifications, onReadAll, onReadOne }) {
  const unreadCount = notifications.filter(n => !n.isRead).length
  const typeConfig = { 
    order:   { icon:'📦', color:'bg-emerald-50  border-emerald-100 text-emerald-700', label:'Order' }, 
    stock:   { icon:'⚠️', color:'bg-red-50      border-red-100     text-red-700',     label:'Stock' }, 
    payment: { icon:'💰', color:'bg-blue-50     border-blue-100    text-blue-700',    label:'Payment' }, 
    harvest: { icon:'🌾', color:'bg-amber-50    border-amber-100   text-amber-700',   label:'Harvest' } 
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h3 className="font-black text-gray-900">🔔 Alerts</h3>{unreadCount > 0 && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{unreadCount} New items</p>}</div>
        {unreadCount > 0 && <button onClick={onReadAll} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline decoration-2">Mark All Read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-20 opacity-30"><Bell size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-sm font-bold uppercase tracking-widest">No notifications</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.order
            return (
              <div key={n._id} onClick={() => !n.isRead && onReadOne(n._id)} 
                className={`group border-2 rounded-[28px] p-5 cursor-pointer transition-all duration-300 ${!n.isRead ? `${cfg.color} border-current shadow-lg shadow-current/5` : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${!n.isRead ? 'bg-white/50' : 'bg-gray-50'}`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-400'}`}>{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/50">{cfg.label}</span>
                       <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 opacity-60"><Clock size={10} /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {!n.isRead && <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/20" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EquipmentTab({ equipments, setEquipments }) {
  const { language } = useLanguageStore()
  const [editId, setEditId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({ 
    name: '', category: 'tractor', icon: '🚜', 
    location: '', price: '', priceUnit: 'hour', experience: '', 
    pincode: ''
  })
  const [isFetchingPin, setIsFetchingPin] = useState(false)
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isOtherVillage, setIsOtherVillage]       = useState(false)



  useEffect(() => {
    if (!showModal) {
      setEditId(null)
      setForm({ name: '', category: 'tractor', icon: '🚜', location: '', price: '', priceUnit: 'hour', experience: '', features: '', description: '', district: '', taluka: '', village: '', pincode: '', customCategory: '' })
      setIsFetchingPin(false)
    }
  }, [showModal])

  const openAdd = () => {
    setEditId(null)
    setForm({ name: '', category: 'tractor', icon: '🚜', location: '', price: '', priceUnit: 'hour', experience: '', features: '', description: '', district: '', taluka: '', village: '', pincode: '' })
    setShowModal(true)
  }

  const openEdit = (e) => {
    setEditId(e._id)
    setForm({
      name: e.name, category: e.category, icon: e.icon,
      location: e.location, price: e.price || e.pricePerHour, priceUnit: e.priceUnit || 'hour', experience: e.experience,
      features: e.features, description: e.description,
      district: e.district, taluka: e.taluka, village: e.location?.split(',')[0]?.trim() || '',
      pincode: e.pincode || ''
    })
    setShowModal(true)
  }

  const toggleAvailability = async (id, current) => {
    try {
      const res = await equipmentAPI.update(id, { available: !current })
      setEquipments(prev => prev.map(e => e._id === id ? res.data : e))
      toast.success(language === 'mr' ? 'स्थिती अपडेट झाली!' : 'Status updated!')
    } catch (err) { toast.error('Error.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'mr' ? 'तुम्हाला खात्री आहे का की तुम्हाला हे अवजार काढून टाकायचे आहे?' : 'Are you sure you want to remove this equipment?')) return
    try {
      await equipmentAPI.delete(id)
      setEquipments(prev => prev.filter(e => e._id !== id))
      toast.success(language === 'mr' ? 'अवजार काढून टाकले!' : 'Equipment removed!')
    } catch (err) { toast.error('Error deleting.') }
  }


  const districts = Object.keys(maharashtraData)
  const availableTalukas = form.district ? maharashtraData[form.district]?.talukas || [] : []

  const [suggestions, setSuggestions] = useState([])
  const [loadingLoc, setLoadingLoc]  = useState(false)

  const handleVillageSearch = async (query) => {
    setForm({ ...form, village: query })
    if (query.length < 2) { setSuggestions([]); return }
    
    setLoadingLoc(true)
    try {
      // Filter by selected taluka and district for accuracy
      const filter = `${form.taluka ? form.taluka + ',' : ''} ${form.district ? form.district + ',' : ''} Maharashtra, India`
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, ${filter}&addressdetails=1&limit=5`)
      setSuggestions(res.data)
    } catch (e) {}
    setLoadingLoc(false)
  }

  const selectSuggestion = (s) => {
    const addr = s.address
    setForm(prev => ({
      ...prev,
      village: addr.village || addr.neighbourhood || addr.suburb || addr.town || addr.hamlet || s.display_name.split(',')[0],
      location: s.display_name
    }))
    setSuggestions([])
  }

  const handlePincodeChange = async (val) => {
    const cleanVal = val.replace(/\D/g, '')
    if (cleanVal.length <= 6) {
      setForm(prev => ({ ...prev, pincode: cleanVal }))
      if (cleanVal.length === 6) {
        setIsFetchingPin(true)
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`)
          const data = await res.json()
          if (data && data[0] && data[0].Status === 'Success') {
            const offices = data[0].PostOffice
            const sample = offices[0]
            const dist = sample.District
            
              // Match hardcoded district
              const matchedKey = districts.find(d => 
                dist.toLowerCase().includes(maharashtraData[d].en.toLowerCase()) || 
                maharashtraData[d].en.toLowerCase().includes(dist.toLowerCase()) ||
                dist.toLowerCase().includes(d.toLowerCase())
              )
              
              if (matchedKey) {
                const blk = sample.Block
                const talukas = maharashtraData[matchedKey].talukas
                const foundTaluka = talukas.find(t => 
                  blk.toLowerCase().includes(t.en.toLowerCase()) || 
                  t.en.toLowerCase().includes(blk.toLowerCase()) ||
                  blk.toLowerCase().includes(t.mr.toLowerCase())
                )
                
                setForm(prev => ({
                  ...prev,
                  pincode: cleanVal,
                  district: matchedKey,
                  taluka: foundTaluka?.en || '',
                  village: ''
                }))
              setVillageSuggestions(offices.map(o => o.Name))
              toast.success(language === 'mr' ? 'लोकेशन मिळाले! ✅' : 'Location ready!')
            }
          }
        } catch (err) { console.error('Pincode fetch error', err) }
        finally { setIsFetchingPin(false) }
      }
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Browser GPS support nahi.'); return }
    
    toast.loading(language === 'mr' ? 'तुमचे लोकेशन शोधत आहे...' : 'Detecting your location...')
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
        const addr = res.data.address
        const d = addr.state_district || addr.city || ''
        const t = addr.suburb || addr.town || addr.village || ''

        const matchedDistrict = districts.find(dist => dist.toLowerCase().includes(d.toLowerCase()))

        setForm(prev => ({
          ...prev,
          district: matchedDistrict || prev.district,
          taluka: t || prev.taluka,
          village: addr.village || addr.neighbourhood || addr.suburb || addr.town || '',
          location: res.data.display_name
        }))
        toast.dismiss()
        toast.success(language === 'mr' ? 'लोकेशन मिळाले! ✅' : 'Location detected! ✅')
      } catch (err) {
        toast.dismiss()
        toast.error(language === 'mr' ? 'लोकेशन मिळवण्यात अडचण आली.' : 'Error detecting location.')
      }
    }, () => {
      toast.dismiss()
      toast.error('Access denied.')
    })
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.district || !form.taluka || !form.village || !form.pincode) { 
      toast.error(language === 'mr' ? 'कृपया पिनकोडसह सर्व माहिती भरा! 🔸' : 'Please fill all fields including Pincode! 🔸')
      return 
    }
    if (form.category === 'other' && !form.customCategory) {
      toast.error(language === 'mr' ? 'कृपया प्रकाराचे नाव टाका!' : 'Please enter custom category name!')
      return
    }

    try {
      const payload = { 
        ...form, 
        category: form.category === 'other' ? form.customCategory : form.category,
        location: `${form.village}, ${form.taluka}, ${form.district} - ${form.pincode}`,
        price: Number(form.price),
        pricePerHour: Number(form.price) // For backward compatibility if needed
      }

      if (editId) {
        const res = await equipmentAPI.update(editId, payload)
        setEquipments(prev => prev.map(e => e._id === editId ? res.data : e))
        toast.success(language === 'mr' ? 'माहिती सुधारली गेली! ✅' : 'Details updated successfully! ✅')
      } else {
        const res = await equipmentAPI.create(payload)
        setEquipments(prev => [res.data, ...prev])
        toast.success(language === 'mr' ? 'अभिनंदन! तुमचे अवजार यशस्वीपणे नोंदवले गेले! 🚜' : 'Congratulations! Equipment registered successfully! 🚜')
      }
      setShowModal(false)
    } catch (err) { 
      const errMsg = err.response?.data?.message || err.message || (language === 'mr' ? 'प्रक्रिया करताना तांत्रिक अडचण आली.' : 'A technical error occurred.');
      toast.error(errMsg) 
    }
  }

  const categories = [
    { id: 'tractor',   icon: '🚜', label: language === 'mr' ? 'ट्रॅक्टर (Tractor)' : 'Tractor' },
    { id: 'harvester', icon: '🌾', label: language === 'mr' ? 'हार्वेस्टर (Harvester)' : 'Harvester' },
    { id: 'rotavator', icon: '⚙️', label: language === 'mr' ? 'रोटाव्हेटर (Rotavator)' : 'Rotavator' },
    { id: 'thresher', icon: '🌀', label: language === 'mr' ? 'थ्रेशर (Thresher)' : 'Thresher' },
    { id: 'drone',     icon: '🚁', label: language === 'mr' ? 'ड्रोन (Drone)' : 'Drone' },
    { id: 'other',     icon: '✨', label: language === 'mr' ? 'इतर (Other)' : 'Other' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-white to-emerald-50/30 p-8 rounded-[40px] border border-emerald-100 shadow-xl shadow-emerald-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-200/30 transition-all duration-700" />
        <div className="relative z-10">
          <h3 className="font-black text-3xl text-gray-900 tracking-tight flex items-center gap-3">🚜 माझी अवजारे</h3>
          <p className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.2em] mt-2 bg-emerald-100/50 px-3 py-1 rounded-lg w-fit">Equipment Inventory</p>
        </div>
        <button onClick={openAdd} 
          className="relative z-10 mt-6 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all hover:-translate-y-1">
          <Plus size={20} className="stroke-[3]" /> नवीन नोंदणी करा
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {equipments.map((e) => (
          <div key={e._id} className="bg-white rounded-[48px] border border-gray-100 shadow-sm p-8 hover:shadow-2xl hover:border-emerald-200 transition-all duration-700 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000 ease-out" />
            
            <div className="relative z-10 flex-1">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-emerald-500/10 border border-emerald-50 flex items-center justify-center text-5xl flex-shrink-0 group-hover:rotate-6 transition-all duration-500 group-hover:scale-110">{e.icon}</div>
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-gray-900 text-xl leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{e.name}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(e)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(e._id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100/50">{e.category}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between bg-gray-50/80 backdrop-blur-sm p-6 rounded-[32px] border border-gray-100">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate (दर)</p>
                  <p className="font-black text-gray-900 text-2xl tracking-tight">₹{e.price || e.pricePerHour}<span className="text-xs text-gray-400 font-bold ml-1">/{e.priceUnit === 'acre' ? (language === 'mr' ? 'एकर' : 'Acre') : (language === 'mr' ? 'तास' : 'Hour')}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <button onClick={() => toggleAvailability(e._id, e.available)}
                    className={`text-[10px] font-black px-4 py-2 rounded-2xl border flex items-center gap-1.5 transition-all ${e.available ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${e.available ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    {e.available ? (language === 'mr' ? 'उपलब्ध' : 'Available') : (language === 'mr' ? 'बंद' : 'Not Avail')}
                  </button>
                </div>
              </div>

                  <div className="flex items-center gap-2 text-gray-500 mt-4">
                    <MapPin size={14} className="text-emerald-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wide truncate">
                      {e.location}, {maharashtraData[e.district]?.[language] || e.district}
                    </p>
                  </div>
                  {e.experience && (
                    <div className="flex items-center gap-2 text-gray-500">
                       <Star size={14} className="text-amber-500" />
                       <p className="text-[11px] font-bold uppercase tracking-wide">{e.experience} {language === 'mr' ? 'अनुभव' : 'Experience'}</p>
                    </div>
                  )}
            </div>
          </div>
        ))}
        
        {equipments.length === 0 && (
          <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[64px] border-4 border-dashed border-gray-100">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10">
              <Tractor size={64} className="text-emerald-100" />
            </div>
            <p className="text-2xl font-black text-gray-900">अजून एकही अवजार नोंदवले नाही</p>
            <p className="text-sm font-bold text-gray-400 mt-3 uppercase tracking-[0.3em]">Start your machinery business today!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[64px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
            
            <div className="p-10 pb-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-black text-4xl text-gray-900 tracking-tight leading-none italic">{editId ? (language === 'mr' ? 'सुधार करा' : 'Edit') : (language === 'mr' ? 'नवीन' : 'Apply')} <span className="text-emerald-600">{editId ? '' : 'Now'}</span></h2>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-8 h-1 bg-emerald-500 rounded-full" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">{language === 'mr' ? 'माहिती भरा' : 'Fill Details'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-16 h-16 bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-[24px] flex items-center justify-center transition-all duration-300 group shadow-sm border border-gray-100">
                <X size={28} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
            
            <div className="p-10 pt-0 space-y-8 overflow-y-auto scrollbar-hide">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                      अवजाराचे नाव <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                      className="w-full px-7 py-5 bg-gray-50 border-2 border-transparent rounded-[28px] outline-none focus:border-emerald-600 focus:bg-white focus:shadow-2xl focus:shadow-emerald-500/10 transition-all font-black text-gray-800 placeholder:text-gray-300" placeholder="उदा. MAHINDRA ARJUN 555" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                      प्रकार निवडा <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select value={form.category} onChange={e => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setForm({...form, category: e.target.value, icon: cat.icon})
                      }} className="w-full px-7 py-5 bg-gray-50 border-2 border-transparent rounded-[28px] outline-none focus:border-emerald-600 focus:bg-white transition-all font-black text-gray-800 appearance-none">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                        <Tractor size={20} />
                      </div>
                    </div>
                    </div>
               </div>

               {form.category === 'other' && (
                 <div className="space-y-3 animate-in zoom-in duration-300">
                    <label className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] block ml-1">
                      या नवीन विभागाचे नाव द्या (Category Type)
                    </label>
                    <input type="text" value={form.customCategory} onChange={e => setForm({...form, customCategory: e.target.value})} 
                      className="w-full px-7 py-5 bg-amber-50 border-2 border-amber-200 rounded-[28px] outline-none focus:border-amber-600 focus:bg-white transition-all font-black text-gray-800" placeholder={language === 'mr' ? "उदा. रोटर, लेवलर इ." : "e.g. Rotor, Leveler etc."} />
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                      भाडे प्रति तास (₹) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} 
                        className="w-full px-14 py-5 bg-gray-50 border-2 border-transparent rounded-[28px] outline-none focus:border-emerald-600 focus:bg-white focus:shadow-2xl focus:shadow-emerald-500/10 transition-all font-black text-gray-800 placeholder:text-gray-300" placeholder="६००" />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1">भाड्याचा प्रकार (Unit)</label>
                    <div className="flex bg-gray-50 p-1 rounded-2xl">
                      <button onClick={(e) => { e.preventDefault(); setForm({...form, priceUnit: 'hour'}) }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.priceUnit === 'hour' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>{language === 'mr' ? 'प्रति तास' : 'Per Hour'}</button>
                      <button onClick={(e) => { e.preventDefault(); setForm({...form, priceUnit: 'acre'}) }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.priceUnit === 'acre' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>{language === 'mr' ? 'प्रति एकर' : 'Per Acre'}</button>
                    </div>
                  </div>
               </div>

                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">{language === 'mr' ? 'लोकेशन माहिती' : 'Location Info'}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                      पिनकोड (Pincode) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input type="text" maxLength={15} value={form.pincode} onChange={e => handlePincodeChange(e.target.value)} 
                        className={`w-full px-7 py-5 rounded-[28px] border-2 outline-none font-black text-gray-800 transition-all
                          ${isFetchingPin ? 'border-amber-400 bg-amber-50' : 'border-transparent bg-gray-50 focus:border-emerald-600 focus:bg-white'}`} placeholder="उदा. ४१४००१" />
                      {isFetchingPin ? (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                           <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300">
                          <Hash size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                        {language === 'mr' ? 'जिल्हा (District)' : 'District'} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                            <select value={form.district} onChange={e => setForm({...form, district: e.target.value, taluka: '', village: ''})} 
                              className="w-full px-7 py-5 bg-gray-50 border-2 border-transparent rounded-[28px] outline-none focus:border-emerald-600 focus:bg-white transition-all font-black text-gray-800 appearance-none">
                              <option value="">{language === 'mr' ? 'निवडा...' : 'Select...'}</option>
                              {districts.map(d => <option key={d} value={d}>{maharashtraData[d][language]}</option>)}
                            </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 opacity-30">
                            <MapPin size={18} />
                          </div>
                        </div>
                        <button onClick={detectLocation} type="button" className="w-[68px] h-[68px] bg-emerald-50 text-emerald-600 rounded-[28px] border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all transform hover:rotate-12 flex items-center justify-center shrink-0 shadow-sm" title="Detect Location">
                            <MapPin size={24} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                        {language === 'mr' ? 'तालुका (Taluka)' : 'Taluka'} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                          <select value={form.taluka} onChange={e => setForm({...form, taluka: e.target.value, village: ''})} 
                            disabled={!form.district}
                            className="w-full px-7 py-5 bg-gray-50 border-2 border-transparent rounded-[28px] outline-none focus:border-emerald-600 focus:bg-white transition-all font-black text-gray-800 appearance-none disabled:opacity-30">
                            <option value="">{language === 'mr' ? 'निवडा...' : 'Select...'}</option>
                            {availableTalukas.map(t => <option key={t.en} value={t.en}>{t[language]}</option>)}
                          </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 opacity-20">
                          <MapPin size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="relative space-y-3">
                  <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block ml-1 flex items-center gap-1.5">
                    {language === 'mr' ? 'गाव (Village)' : 'Village'} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative group">
                    {villageSuggestions.length > 0 ? (
                      <div className="relative">
                        <select value={isOtherVillage ? 'other' : (villageSuggestions.includes(form.village) ? form.village : '')} 
                          onChange={e => {
                            if (e.target.value === 'other') {
                              setIsOtherVillage(true);
                              setForm({...form, village: ''});
                            } else {
                              setIsOtherVillage(false);
                              setForm({...form, village: e.target.value});
                            }
                          }}
                          className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[32px] outline-none focus:border-emerald-600 focus:bg-white focus:shadow-2xl focus:shadow-emerald-500/15 transition-all font-black text-xl text-gray-800 appearance-none">
                          <option value="">{language === 'mr' ? 'गाव निवडा...' : 'Select Village...'}</option>
                          {villageSuggestions.map(v => <option key={v} value={v}>{v}</option>)}
                          <option value="other">{language === 'mr' ? '-- दुसरे गाव --' : '-- Other --'}</option>
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                          <ChevronDown size={24} />
                        </div>
                      </div>
                    ) : (
                      <input value={form.village} onChange={e => { setIsOtherVillage(false); handleVillageSearch(e.target.value); }} 
                        disabled={!form.taluka}
                        className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[32px] outline-none focus:border-emerald-600 focus:bg-white focus:shadow-2xl focus:shadow-emerald-500/15 transition-all font-black text-xl text-gray-800 placeholder:text-gray-300 disabled:opacity-20" 
                        placeholder={form.taluka ? (language === 'mr' ? "नाव टाईप करा..." : "Type village name...") : (language === 'mr' ? "पहिले तालुका निवडा..." : "Select Taluka first...")} />
                    )}
                    
                    {(isOtherVillage || (form.village && !villageSuggestions.includes(form.village) && villageSuggestions.length > 0)) && (
                      <input type="text" autoFocus 
                        placeholder={language === 'mr' ? "तुमच्या गावाचे नाव टाका..." : "Enter village name..."}
                        value={form.village}
                        onChange={e => setForm({...form, village: e.target.value})}
                        className="w-full px-8 py-5 border-2 border-emerald-100 bg-white rounded-[28px] outline-none focus:border-emerald-600 transition-all font-black text-lg mt-3" />
                    )}

                    {loadingLoc && <div className="absolute right-6 top-1/2 -translate-y-1/2"><div className="w-6 h-6 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>}
                  </div>
                  
                  {villageSuggestions.length === 0 && suggestions.length > 0 && (
                    <div className="absolute z-[200] w-full mt-4 bg-white/90 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 ring-1 ring-black/5">
                      {suggestions.map((s, idx) => (
                        <button key={idx} onClick={() => selectSuggestion(s)} 
                          className="w-full px-8 py-6 text-left hover:bg-emerald-600 transition-all border-b border-gray-50/50 last:border-0 group flex items-start gap-4">
                          <MapPin size={20} className="mt-1 text-emerald-600 group-hover:text-white transition-colors" />
                          <div>
                            <p className="font-black text-gray-900 text-lg group-hover:text-white transition-colors tracking-tight">{s.display_name.split(',')[0]}</p>
                            <p className="text-[11px] font-bold text-gray-400 mt-1 line-clamp-1 group-hover:text-emerald-100 transition-colors uppercase tracking-wide">{s.display_name.split(',').slice(1).join(',')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
            </div>

            <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex items-center gap-6 shrink-0">
               <div className="flex-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Estimated Earnings</p>
                 <p className="text-xl font-black text-emerald-700 tracking-tight">Expand your business! 🚀</p>
               </div>
               <button onClick={handleSave} className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 transition-all transform active:scale-95 hover:-translate-y-1">
                 {editId ? (language === 'mr' ? 'माहिती अपडेट करा ✅' : 'Update Info ✅') : (language === 'mr' ? 'अवजार सेव्ह करा ✅' : 'Save Equipment ✅')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarView({ bookings, user }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthNames = isMR 
    ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = isMR
    ? ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysCount = daysInMonth(month, year)
  const startDay = firstDayOfMonth(month, year)

  const days = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let i = 1; i <= daysCount; i++) days.push(i)

  const toLocalDateStr = (d, m, y) => {
    if (!d) return ''
    const date = new Date(y, m, d)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getBookingsByDay = (day) => {
    if (!day) return []
    const dStr = toLocalDateStr(day, month, year)
    return bookings.filter(b => b.date.startsWith(dStr))
  }

  const selectedDayBookings = bookings.filter(b => b.date.startsWith(selectedDate))

  return (
    <div className="animate-in fade-in duration-700">
      <div className="bg-white rounded-[48px] border border-gray-100 p-8 shadow-2xl shadow-gray-500/5 mb-8">
        <div className="flex items-center justify-between mb-8 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
          <h4 className="font-black text-2xl text-gray-900 tracking-tight">{monthNames[month]} <span className="text-emerald-600">{year}</span></h4>
          <div className="flex gap-3">
            <button onClick={prevMonth} className="w-12 h-12 bg-white hover:bg-emerald-600 text-gray-400 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
            </button>
            <button onClick={nextMonth} className="w-12 h-12 bg-white hover:bg-emerald-600 text-gray-400 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 group">
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] py-4">{d}</div>
          ))}
          {days.map((d, i) => {
            const bks = getBookingsByDay(d)
            const isToday = d && new Date().toDateString() === new Date(year, month, d).toDateString()
            const isSel = d && selectedDate === toLocalDateStr(d, month, year)
            
            return (
              <div key={i} 
                onClick={() => d && setSelectedDate(toLocalDateStr(d, month, year))}
                className={`min-h-[100px] rounded-[32px] border-2 transition-all duration-500 flex flex-col p-4 relative group
                  ${!d ? 'border-transparent opacity-0 pointer-events-none' : 
                    isSel ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/30 -translate-y-1 scale-105 z-10' :
                    isToday ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    'bg-white border-gray-50 hover:border-emerald-200 hover:bg-emerald-50/20'}
                `}>
                {d && (
                  <>
                    <span className={`text-base font-black ${isSel ? 'text-white' : 'text-gray-900'}`}>{d}</span>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {bks.slice(0, 4).map((b, idx) => (
                        <span key={idx} className={`w-2 h-2 rounded-full ${isSel ? 'bg-white' : b.status==='pending' ? 'bg-amber-400' : 'bg-emerald-500'} shadow-sm`} />
                      ))}
                      {bks.length > 4 && <span className={`text-[9px] font-black ${isSel ? 'text-white/50' : 'text-gray-300'}`}>+{bks.length-4}</span>}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-gray-100 p-10 shadow-xl shadow-gray-500/5 animate-in slide-in-from-bottom-4 duration-500">
         <div className="flex items-center justify-between mb-8">
            <div>
              <h5 className="font-black text-xl text-gray-900 tracking-tight">
                {isMR ? 'निवडलेल्या दिवसाचे बुकिंग' : 'Details for Day'}
              </h5>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                {new Date(selectedDate).toLocaleDateString(isMR ? 'mr-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl">{selectedDayBookings.length}</div>
         </div>

         {selectedDayBookings.length === 0 ? (
           <div className="py-20 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
             <div className="text-4xl mb-4 opacity-20">📭</div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isMR ? 'या दिवशी कोणतेही बुकिंग नाही' : 'No bookings for this day'}</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {selectedDayBookings.map(b => (
               <div key={b._id} className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 transition-all hover:shadow-xl hover:border-emerald-100 group">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {b.category === 'tractor' ? '🚜' : b.category === 'harvester' ? '🌾' : '⚙️'}
                     </div>
                     <div>
                        <p className="text-base font-black text-gray-900 leading-tight">{b.equipmentName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{b.farmerName} • <span className="text-emerald-600">{b.timeSlot}</span></p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-base">₹{b.amount}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border mt-1 inline-block ${b.status==='pending'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}>{b.status}</span>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  )
}

function BookingsTab({ bookings, onUpdateStatus, updatePaymentStatus, initialFilter = 'all', onFarmerClick }) {
  const { language } = useLanguageStore()
  const { user } = useAuthStore()
  const isMR = language === 'mr'
  const [filter, setFilter] = useState(initialFilter)

  // Real Tracking States for Machinery
  const [activeTrackingId, setActiveTrackingId] = useState(null)
  const watchRef = useRef(null)

  useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const startMachineryTracking = (bookingId) => {
    if (!navigator.geolocation) {
      toast.error(isMR ? 'तुमच्या ब्राउझरमध्ये GPS सपोर्ट नाही!' : 'GPS not supported on this device!')
      return
    }

    if (activeTrackingId === bookingId) {
      // Stop
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
      setActiveTrackingId(null)
      toast.success(isMR ? 'Live GPS बंद झाले.' : 'Live GPS Stopped.')
      return
    }

    // Start
    setActiveTrackingId(bookingId)
    toast.success(isMR ? 'यंत्राचे Live GPS सुरू झाले! 🚜' : 'Machinery GPS Tracking Started! 🚜')

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          await bookingAPI.updateLocation(bookingId, { lat: latitude, lng: longitude })
          console.log(`Updated machinery location for ${bookingId}:`, latitude, longitude)
        } catch (err) {
          console.error('Failed to update machinery location', err)
        }
      },
      (err) => {
        console.error('GPS Error:', err)
        toast.error(isMR ? 'GPS सिग्नल मिळत नाही!' : 'Could not get GPS signal!')
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    )
    watchRef.current = watchId
  }

  const [viewMode, setViewMode] = useState('list')

  const statusLabels = {
    pending:   { label: isMR ? 'प्रतीक्षेत' : 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-100' },
    accepted:  { label: isMR ? 'अ‍ॅडव्हान्सची प्रतीक्षा ⏳' : 'Awaiting Advance',  color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    confirmed: { label: isMR ? 'काम चालू आहे 🚜' : 'In Progress',  color: 'bg-blue-50 text-blue-700 border-blue-100' },
    rejected:  { label: isMR ? 'नाकारले'   : 'Rejected',  color: 'bg-red-50 text-red-700 border-red-100' },
    completed: { label: isMR ? 'पूर्ण'     : 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    cancelled: { label: isMR ? 'रद्द'      : 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-100' }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const makeWhatsAppMsg = (b) => {
    const msg = isMR
      ? `नमस्ते ${b.farmerName}! तुमची ${b.equipmentName} बुकिंग स्वीकारली गेली आहे. तारीख: ${new Date(b.date).toLocaleDateString()}, वेळ: ${b.timeSlot}. - KrishiShare 🚜`
      : `Hello ${b.farmerName}! Your booking for ${b.equipmentName} has been accepted. Date: ${new Date(b.date).toLocaleDateString()}, Slot: ${b.timeSlot}. - KrishiShare 🚜`
    return `https://wa.me/${b.farmerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-black text-gray-900 text-2xl tracking-tight">🚜 {isMR ? 'बुक केलेले अवजारे' : 'Equipment Bookings'}</h3>
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1 italic">Farm Machinery Requests</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>📋 {isMR ? 'यादी' : 'List'}</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'calendar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>📅 {isMR ? 'कॅलेंडर' : 'Calendar'}</button>
          </div>
          {viewMode === 'list' && ['all','pending','accepted','completed','rejected','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {f === 'completed' ? (isMR ? 'इतिहास' : 'History') : f}
              <span className="ml-1 opacity-70">{f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView bookings={bookings} user={user} />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((b) => (
            <div key={b._id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-xl shadow-gray-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-2 h-full ${b.status === 'pending' ? 'bg-amber-400' : b.status === 'accepted' ? 'bg-blue-500' : b.status === 'rejected' ? 'bg-red-500' : b.status === 'cancelled' ? 'bg-gray-300' : 'bg-emerald-500'}`} />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                    {b.category === 'tractor' ? '🚜' : b.category === 'harvester' ? '🌾' : b.category === 'drone' ? '🚁' : '⚙️'}
                  </div>
                  <div onClick={() => onFarmerClick?.(b.farmerName || b.farmer || b.userName)} className="cursor-pointer group/name">
                    <h4 className="font-black text-2xl text-gray-900 tracking-tight group-hover/name:text-emerald-600 transition-colors">{b.equipmentName}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 uppercase tracking-wide group-hover/name:underline decoration-2">
                          <User size={14} className="text-emerald-500" /> {b.farmerName || b.farmer || b.userName}
                        </span>
                        <span className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          <MapPin size={14} className="text-emerald-500" /> {b.location} 
                          {b.landmark && <span className="text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 ml-1">🏠 {b.landmark}</span>}
                        </span>
                        <span className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          <Clock size={14} className="text-emerald-500" /> {new Date(b.date).toLocaleDateString()} • {b.timeSlot}
                        </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs">👤</div>
                        <p className="text-xs font-black text-gray-700">{b.farmerName} <span className="text-gray-400 font-bold">• {b.farmerPhone}</span></p>
                      </div>
                      {b.note && (
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100">
                          <span className="text-[10px]">📝</span>
                          <p className="text-[10px] font-bold text-amber-700 italic">"{b.note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-3 min-w-[180px]">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">₹{b.amount}</p>
                    <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-wider">
                      {isMR ? '५% ॲडव्हान्स: ' : '5% Advance: '} ₹{b.advanceAmount || Math.round(b.amount * 0.05)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${statusLabels[b.status]?.color || 'bg-gray-100'}`}>
                    <span className={`w-2 h-2 rounded-full ${
                      b.status==='pending' ? 'bg-amber-500 animate-pulse' :
                      b.status==='accepted' ? 'bg-indigo-500 animate-bounce' :
                      b.status==='confirmed' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                      b.status==='rejected' ? 'bg-red-500' :
                      b.status==='cancelled' ? 'bg-gray-400' : 'bg-emerald-500'
                    }`} />
                    {b.status === 'completed' && b.paymentStatus !== 'paid' ? (isMR ? 'पैसे येणे बाकी ⏳' : 'Payment Pending ⏳') : (statusLabels[b.status]?.label || b.status)}
                  </span>
                  <div className="flex gap-2 w-full md:w-auto">
                    {b.farmerPhone && (
                      <>
                        <a href={`tel:${b.farmerPhone}`}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg">
                          <span>📞</span> {isMR ? 'कॉल' : 'Call'}
                        </a>
                        <a href={makeWhatsAppMsg(b)} target="_blank" rel="noreferrer"
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg">
                          <span>📱</span> WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons based on status */}
              {b.status === 'pending' && (
                <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4">
                  <button onClick={() => onUpdateStatus(b._id, 'accepted')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                    {isMR ? 'स्वीकारा ✅' : 'Accept Request ✅'}
                  </button>
                  <button onClick={() => onUpdateStatus(b._id, 'rejected')}
                    className="flex-1 bg-white hover:bg-red-50 text-red-500 border-2 border-red-50 py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all">
                    {isMR ? 'नाकारा ❌' : 'Reject ❌'}
                  </button>
                </div>
              )}

              {b.status === 'accepted' && (
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-center py-4 bg-indigo-50/30 rounded-[28px] border border-dashed border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] animate-pulse">
                    ⏳ {isMR ? 'शेतकरी अ‍ॅडव्हान्स भरण्याची प्रतीक्षा करत आहे' : 'Waiting for farmer to pay advance'}
                  </p>
                </div>
              )}

              {b.status === 'confirmed' && (
                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => startMachineryTracking(b._id)}
                      className={`flex-1 py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${activeTrackingId === b._id ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                    >
                       {activeTrackingId === b._id ? '⏹ STOP GPS' : '📡 START REAL GPS'}
                    </button>
                    <button onClick={() => {
                        onUpdateStatus(b._id, 'completed')
                        if (b.farmerPhone) {
                          sendWhatsAppMessage(b.farmerPhone, WA_TEMPLATES.WORK_COMPLETED(user?.name, b.equipmentName, b.farmer))
                        }
                      }}
                      className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-blue-500/20 px-8">
                      {isMR ? 'काम पूर्ण झाले ✅' : 'Work Done ✅'}
                    </button>
                  </div>
                  <button onClick={() => updatePaymentStatus(b._id, b.paymentStatus === 'paid' ? 'pending' : 'paid')}
                    className={`w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg px-6 border-2 ${
                      b.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10' 
                        : 'bg-white text-gray-400 border-gray-100 shadow-gray-500/5 hover:border-emerald-500 hover:text-emerald-500'
                    }`}>
                    {b.paymentStatus === 'paid' ? (isMR ? '💰 पैसे मिळाले' : '💰 Paid') : (isMR ? '💵 पैसे मिळाले?' : '💵 Mark Paid?')}
                  </button>
                </div>
              )}

              {b.status === 'confirmed' && b.paymentStatus === 'pending' && !b.isDisputed && (
                <button onClick={() => window.confirm(isMR ? 'या शेतकऱ्याबद्दल तक्रार करायची आहे का? (Strike System)' : 'Report this farmer for non-payment?') && reportFarmer(b._id)}
                  className="mt-3 w-full text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                  ⚠️ {isMR ? 'पैसे मिळाले नाहीत? (तक्रार करा)' : 'Haven\'t received payment? (Report)'}
                </button>
              )}

              {b.status === 'completed' && (
                <div className="mt-6 pt-6 border-t border-gray-50 flex gap-4">
                  <button onClick={() => generatePDFBill(b, user, language)} 
                    className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                    <FileText size={18} /> {isMR ? 'बिल डाऊनलोड करा' : 'Bill'}
                  </button>
                  <button onClick={() => updatePaymentStatus(b._id, b.paymentStatus === 'paid' ? 'pending' : 'paid')}
                    className={`py-4 px-10 rounded-[22px] font-black text-xs uppercase tracking-widest border-2 transition-all shadow-lg ${
                      b.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10' 
                        : 'bg-white text-gray-400 border-gray-100 shadow-gray-500/5 hover:border-emerald-500 hover:text-emerald-500 font-black'
                    }`}>
                    {b.paymentStatus === 'paid' ? (isMR ? '💰 पैसे मिळाले' : '💰 Paid') : (isMR ? '💵 पैसे मिळाले?' : '💵 Mark Paid?')}
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
              <div className="text-6xl mb-4 opacity-20">📭</div>
              <p className="text-xl font-black text-gray-900">{isMR ? 'अजून कोणतेही बुकिंग आले नाही' : 'No bookings found'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


function StoreOwnerDashboard() {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const [activeTab,     setActiveTab]     = useState('overview')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [orderFilter,   setOrderFilter]   = useState('all')
  const [products,      setProducts]      = useState([])
  const [equipments,    setEquipments]    = useState([])
  const [complaints,    setComplaints]    = useState([])
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [harvestRequests, setHarvestRequests] = useState([])
  const [showSlipModal,   setShowSlipModal]   = useState(null)
  
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } = useNotificationStore()
  const { user, logout } = useAuthStore()
  const liveOrders = useOrderStore(state => state.allOrders)
  const { fetchAllOrders, updateOrderStatus, updateLiveLocation, markBillGenerated } = useOrderStore()
  const { allBookings, fetchAllBookings, updateBookingStatus, updatePaymentStatus, reportFarmer } = useBookingStore()
  const navigate = useNavigate()
  const location                                               = useLocation()

  const fetchRealData = () => {
    // Fetch data based on any business role
    if (user?.role === 'admin' || user?.role === 'mart_owner' || user?.role === 'equipment_owner' || user?.role === 'factory_owner') {
      if (user?.role === 'mart_owner') {
        fetchAllOrders()
        fetchOwnerProducts()
        fetchComplaints()
      }
      if (user?.role === 'equipment_owner') {
        fetchAllBookings()
        fetchOwnerEquipments()
        fetchComplaints()
      }
      if (user?.role === 'factory_owner') {
        fetchHarvestRequests()
        fetchComplaints()
      }
    }
    fetchNotifications()
  }

  const fetchComplaints = async () => {
    try {
      // Fetch complaints targeted at THIS business owner
      const res = await complaintAPI.getFactoryComplaints() 
      setComplaints(res.data)
    } catch (e) { }
  }

  const fetchHarvestRequests = async () => {
    try {
      const res = await harvestAPI.getForFactory()
      setHarvestRequests(res.data || [])
    } catch (e) { }
  }

  const fetchOwnerProducts = async () => {
    try {
      const res = await productAPI.getForOwner()
      setProducts(res.data || [])
    } catch (e) { console.error('Product fetch failed', e) }
  }

  const fetchOwnerEquipments = async () => {
    try {
      const res = await equipmentAPI.getMy()
      setEquipments(res.data)
    } catch (e) { }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab && ALL_TABS.find(t => t.id === tab)) {
      setActiveTab(tab)
    }
    fetchRealData()
  }, [location.search])

  const handleReadAll = () => markAllRead()
  const handleReadOne = (id) => markAsRead(id)
  const totalEarnings  = liveOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.finalAmount || 0), 0) + allBookings.filter(o => o.status === 'completed').reduce((s, o) => s + (o.amount || 0), 0)

  const handleUpdateStatus = async (orderId, status) => { await updateOrderStatus(orderId, status) }
  const handleUpdateBooking = async (id, status) => { await updateBookingStatus(id, status) }
  const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false)
  const handleUpdateComplaint = async (id, status) => {
    if (isUpdatingComplaint) return
    let waitToast;
    try {
      setIsUpdatingComplaint(true)
      waitToast = toast.loading('स्टेटस अपडेट होत आहे...')
      await complaintAPI.updateStatus(id, status)
      await fetchComplaints()
      fetchRealData() 
      toast.success(status === 'resolved' ? 'तक्रार निवारण पूर्ण झाले! ✅' : 'तक्रारीवर कार्यवाही सुरू झाली! 🚀', { id: waitToast })
    } catch (e) { 
      toast.error('अपडेट अयशस्वी!', { id: waitToast })
    } finally {
      setIsUpdatingComplaint(false)
    }
  }
  const handleLogout = () => { logout(); toast.success('Logout successful!'); navigate('/login') }

  const pendingCount   = liveOrders.filter(o => o.status === 'pending').length

  const ALL_TABS = [
    { id:'overview',      icon:LayoutDashboard, label:'Dashboard', roles:['mart_owner', 'equipment_owner', 'factory_owner'] },
    { id:'orders',        icon:Package,         label:'Orders',    badge:pendingCount, roles:['mart_owner'] },
    { id:'products',      icon:ShoppingBag,     label:'Inventory', roles:['mart_owner'] },
    { id:'analytics',     icon:TrendingUp,      label:'Analytics', roles:['mart_owner', 'equipment_owner'] },
    { id:'bookings',      icon:Calendar,        label:'Bookings',  badge:allBookings.filter(b=>b.status==='pending').length, roles:['equipment_owner'] },
    { id:'equipments',    icon:Tractor,        label:'Equipments', roles:['equipment_owner'] },
    { id:'map',           icon:MapPin,         label: isMR ? 'नकाशा' : 'Map View', roles:['mart_owner', 'equipment_owner'] },
    { id:'harvest',       icon:Sprout,          label:'Harvest',   badge:harvestRequests.filter(r=>r.status==='pending').length, roles:['factory_owner'] },
    { id:'complaints',    icon:AlertCircle,     label:'Complaints', badge:complaints.filter(c=>c.status==='pending').length, roles:['factory_owner', 'mart_owner', 'equipment_owner'], hidden: true },
    { id:'notifications', icon:Bell,            label:'Alerts',    badge:unreadCount, roles:['mart_owner', 'equipment_owner', 'factory_owner'], hidden: true },
  ]

  const tabs = ALL_TABS.filter(t => t.roles.includes(user?.role) && !t.hidden)
  const roleInfo = {
    mart_owner:      { icon: '🛒', type: 'Krishi Mart' },
    equipment_owner: { icon: '🚜', type: 'Equipment Agency' },
    factory_owner:   { icon: '🏭', type: 'Sugar Factory' }
  }[user?.role] || { icon: '🏢', type: 'Business' }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit relative">
      <img src="/assets/full_auth_bg.png" alt="bg" className="absolute inset-0 w-full h-[400px] object-cover opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <Link to="/profile" className="flex items-center gap-6 group">
              <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center text-5xl border border-emerald-100 animate-in zoom-in duration-500 group-hover:scale-105 transition-transform">
                {roleInfo.icon}
              </div>
              <div className="animate-in slide-in-from-left-4 duration-500">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none group-hover:text-emerald-600 transition-colors uppercase">{user?.businessName || user?.name}</h1>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{roleInfo.type}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-emerald-400">📍 {user?.location || 'Maharashtra'}</span>
                </div>
              </div>
            </Link>
            
            <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white px-8 py-4 rounded-[28px] shadow-lg shadow-emerald-900/5 border border-emerald-50 text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isMR ? 'एकूण शिल्लक' : 'Net Balance'}</p>
                <p className="text-3xl font-black text-gray-900">₹{Math.floor(totalEarnings * 0.9).toLocaleString()}</p>
              </div>
              <button onClick={handleLogout} className="w-16 h-16 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-[28px] shadow-lg border border-gray-100 flex items-center justify-center transition-all duration-300 group">
                <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[32px] shadow-xl border border-white/50 flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 relative min-w-fit ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white shadow-lg animate-bounce">{tab.badge}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-30 min-h-[500px]">
        {activeTab === 'overview'      && <OverviewTab      orders={liveOrders} products={products} bookings={allBookings} role={user?.role} roleInfo={roleInfo} onStatClick={(tab, filter) => { setActiveTab(tab); if (tab === 'bookings') setBookingFilter(filter); if (tab === 'orders') setOrderFilter(filter); }} />}
        {activeTab === 'orders'        && <OrdersTab        orders={liveOrders} onUpdateStatus={handleUpdateStatus} initialFilter={orderFilter} onFarmerClick={setSelectedFarmer} />}
        {activeTab === 'products'      && <ProductsTab      products={products} setProducts={setProducts} />}
        {activeTab === 'bookings'      && <BookingsTab      bookings={allBookings} onUpdateStatus={handleUpdateBooking} updatePaymentStatus={updatePaymentStatus} initialFilter={bookingFilter} onFarmerClick={setSelectedFarmer} />}
        {activeTab === 'equipments'    && <EquipmentTab     equipments={equipments} setEquipments={setEquipments} />}
        {activeTab === 'map'           && <OrderMap         items={user?.role === 'equipment_owner' ? allBookings : liveOrders} role={user?.role} />}
        {activeTab === 'analytics'     && <AnalyticsTab     orders={liveOrders} products={products} equipments={equipments} role={user?.role} />}
        {activeTab === 'complaints'    && <ComplaintsTab    complaints={complaints} onUpdateStatus={handleUpdateComplaint} />}
        {activeTab === 'harvest'      && <HarvestTab       requests={harvestRequests} onUpdate={fetchHarvestRequests} onShowSlip={setShowSlipModal} />}
        {activeTab === 'notifications' && <NotificationsTab notifications={notifications} onReadAll={handleReadAll} onReadOne={handleReadOne} />}
      </div>

      {selectedFarmer && (
        <FarmerProfileModal 
          farmerName={selectedFarmer} 
          orders={liveOrders} 
          bookings={allBookings} 
          role={user?.role} 
          onClose={() => setSelectedFarmer(null)} 
        />
      )}

      {selectedOrder && (
        <OrderDetailModal 
          order={liveOrders.find(o => o._id === (selectedOrder._id || selectedOrder)) || selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={handleUpdateStatus} 
          user={user}
          language={language}
        />
      )}
    </div>
  )
}

function AnalyticsTab({ orders, products, equipments, role }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  
  // 📊 PROCESS DATA FOR MART
  const isMart = role === 'mart_owner'
  
  // 1. Sales Trend (Last 7 Days)
  const salesData = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    const dayOrders = orders.filter(o => 
      new Date(o.createdAt).toDateString() === d.toDateString() && o.status === 'delivered'
    )
    salesData.push({
      date: dateStr,
      revenue: dayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0),
      count: dayOrders.length
    })
  }

  // 2. Stock Distribution (By Category)
  const categoryData = []
  if (isMart) {
    const cats = [...new Set(products.map(p => p.category))]
    cats.forEach(c => {
      const pCount = products.filter(p => p.category === c).length
      categoryData.push({ name: c, value: pCount })
    })
  }

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']

  // 📥 CSV EXPORTER
  const downloadReport = () => {
    try {
      const headers = ["Order ID", "Date", "Customer", "Amount", "Status", "Items"]
      const rows = orders.map(o => [
        `#${o._id.slice(-6).toUpperCase()}`,
        new Date(o.createdAt).toLocaleDateString(),
        o.farmerName,
        o.finalAmount,
        o.status,
        o.items?.map(it => `${it.name}(${it.qty})`).join('; ')
      ])
      
      let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(r => r.join(",")).join("\n")

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Sales_Report_${new Date().toLocaleDateString()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Report downloaded! 📊')
    } catch (e) {
      toast.error('Export failed!')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Cards */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-emerald-900/5">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">{isMR ? 'विक्री विश्लेषण' : 'Sales Analytics'}</h2>
          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mt-1">
            {isMR ? 'तुमच्या व्यवसायाची प्रगती आलेखामध्ये पहा' : 'Visualize your business growth & stock health'}
          </p>
        </div>
        <button onClick={downloadReport} className="bg-gray-900 text-white px-8 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:-translate-y-1 transition-all active:scale-95">
          <Download size={18} /> {isMR ? 'Excel रिपोर्ट' : 'Export Excel'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 h-full flex flex-col">
             <div className="flex items-center justify-between mb-10">
               <h3 className="font-black text-gray-800 uppercase tracking-widest text-[13px] flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><TrendingUp size={20} /></div>
                 {isMR ? 'साप्ताहिक विक्री आलेख' : 'Revenue Trend (7D)'}
               </h3>
               <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Net Change</p>
                  <p className="text-lg font-black text-emerald-600">+१४%</p>
               </div>
             </div>
             
             <div className="h-64 mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={salesData}>
                   <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                     itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                   />
                   <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Stock/Categories Chart */}
        <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mt-32 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 h-full flex flex-col">
             <h3 className="font-black text-gray-800 uppercase tracking-widest text-[13px] flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><ShoppingBag size={20} /></div>
               {isMR ? 'माल उपलब्धता (वर्गानुसार)' : 'Inventory Analysis'}
             </h3>
             
             <div className="h-64 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={categoryData.length > 0 ? categoryData : [{name: 'Products', value: products.length}]}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               
               <div className="absolute flex flex-col items-center justify-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total</p>
                  <p className="text-2xl font-black text-gray-900 leading-tight">{products.length}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-8">
               {categoryData.slice(0, 4).map((c, i) => (
                 <div key={c.name} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight truncate">{c.name}</span>
                    <span className="ml-auto font-black text-gray-900 text-xs">{c.value}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Low Stock Watchlist */}
      {isMart && (
        <div className="bg-white rounded-[56px] border border-gray-100 shadow-xl p-10">
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-[13px] mb-8">{isMR ? 'कमी साठा असलेली उत्पादने (Low Stock)' : 'Low Stock Watchlist'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.filter(p => p.stock < 10).slice(0, 6).map(p => (
              <div key={p._id} className="p-6 bg-red-50/30 border border-red-100 rounded-[32px] flex items-center justify-between group hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-red-50">{p.icon}</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm leading-tight">{p.name}</p>
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mt-1">⚠️ {p.stock} {isMR ? 'शिल्लक' : 'left'}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit2 size={16} className="text-red-400" />
                </div>
              </div>
            ))}
            {products.filter(p => p.stock < 10).length === 0 && (
              <div className="col-span-full text-center py-10 opacity-30">
                 <p className="font-black uppercase tracking-[0.3em]">All Good! Stock is Full ✅</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HarvestTab({ requests, onUpdate, onShowSlip }) {
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const handleUpdateStatus = async (id, status, extra = {}) => {
    try {
      await harvestAPI.updateStatus(id, { status, ...extra })
      toast.success(isMR ? 'स्टेटस अपडेट झाले! ✅' : 'Status updated! ✅')
      onUpdate()
    } catch (e) { toast.error('Error.') }
  }

  const statusLabels = {
    pending:    { label: isMR ? 'प्रलंबित' : 'Pending',   color: 'bg-amber-50 text-amber-600 border-amber-100' },
    scheduled:  { label: isMR ? 'नियोजित' : 'Scheduled', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    harvesting: { label: isMR ? 'तोडणी सुरू' : 'In Transit', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    completed:  { label: isMR ? 'पूर्ण' : 'Completed',  color: 'bg-gray-50 text-gray-400 border-gray-100' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-black text-gray-900 text-2xl tracking-tight flex items-center gap-2"><Sprout className="text-emerald-500" /> {isMR ? 'तोडणी मॉनिटरिंग' : 'Harvest Monitoring'}</h3>
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1 italic">Manage farmer field requests</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'scheduled', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map(r => (
          <div key={r._id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-xl shadow-emerald-900/5 hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-2 h-full ${r.status === 'pending' ? 'bg-amber-400' : r.status === 'scheduled' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-inner">🌾</div>
                <div>
                  <h4 className="font-black text-2xl text-gray-900 tracking-tight">{r.farmerName}</h4>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest"><MapPin size={14} className="text-emerald-500" /> {r.village}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Calendar size={14} className="text-emerald-500" /> {new Date(r.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest"><ShoppingBag size={14} className="text-emerald-500" /> {r.acres} Acres</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3">
                <span className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${statusLabels[r.status]?.color || 'bg-gray-100'}`}>
                  {statusLabels[r.status]?.label || r.status}
                </span>
                <p className="text-xl font-black text-gray-900 tracking-tight">Est: {r.estimatedTons || r.acres * 40} Tons</p>
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-4">
              {r.status === 'pending' && (
                <>
                  <button onClick={() => {
                    const toli = window.prompt(isMR ? 'टोळीचे नाव टाका:' : 'Enter Toli Name:')
                    const date = window.prompt(isMR ? 'तारीख निवडा (YYYY-MM-DD):' : 'Select Date (YYYY-MM-DD):')
                    if (toli && date) handleUpdateStatus(r._id, 'scheduled', { toliName: toli, scheduledDate: date })
                  }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                    <Check size={16} /> {isMR ? 'नियोजित (Schedule)' : 'Schedule Extraction'}
                  </button>
                  <button onClick={() => handleUpdateStatus(r._id, 'rejected')} className="px-8 border-2 border-red-50 text-red-500 hover:bg-red-50 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all">
                    Reject
                  </button>
                </>
              )}

              {r.status === 'scheduled' && (
                <div className="w-full space-y-4">
                   <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600"><User size={20} /></div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Assigned Toli</p>
                          <p className="font-black text-gray-900">{r.toliName || 'Not Assigned'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Scheduled Date</p>
                        <p className="font-black text-gray-900">{new Date(r.scheduledDate).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                        const vNo = window.prompt(isMR ? 'वाहन नंबर टाका (उदा. MH 12 AB 1234):' : 'Enter Vehicle No:')
                        const gross = window.prompt(isMR ? 'Gross Weight (Tons):' : 'Gross Weight (Tons):')
                        const tare = window.prompt(isMR ? 'Tare Weight (Tons):' : 'Tare Weight (Tons):')
                        
                        if (vNo && gross && tare) {
                          harvestAPI.generateSlip(r._id, { vehicleNo: vNo, grossWeight: Number(gross), tareWeight: Number(tare) })
                            .then(() => { toast.success('Slip Generated! ✅'); onUpdate() })
                            .catch(() => toast.error('Error generating slip'))
                        }
                     }}
                     className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                     <FileText size={18} /> {isMR ? 'डिजिटल पावती (Generate Slip)' : 'Create Digital Slip'}
                   </button>
                </div>
              )}

              {r.status === 'completed' && (
                <div className="w-full bg-gray-50 p-6 rounded-[32px] flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><Check size={18} /></div>
                     <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{isMR ? 'ऊस तोडणी पूर्ण झाली' : 'Harvesting Completed'}</p>
                   </div>
                   <p className="text-lg font-black text-emerald-600 tracking-tight">{r.actualTons} Tons Net</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <Sprout size={64} className="mx-auto mb-4 text-emerald-200" />
            <p className="font-black text-gray-900 uppercase tracking-widest text-sm">No harvest requests found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StoreOwnerDashboard