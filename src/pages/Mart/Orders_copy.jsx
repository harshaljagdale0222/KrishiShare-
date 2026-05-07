import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, RotateCcw, Star, Loader } from 'lucide-react'
import useOrderStore from '../../store/orderStore'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import toast from 'react-hot-toast'

function OrderTimeline({ status }) {
  if (status === 'cancelled' || status === 'rejected') return null
  const steps = [
    { label:'Milaali', icon:'📦' }, 
    { label:'Accepted', icon:'✅' }, 
    { label:'Packing', icon:'📫' }, 
    { label:'On the Way', icon:'🛵' }, 
    { label:'Delivered', icon:'🏠' }
  ]
  const stepMap = { pending:1, accepted:2, packing:3, out_for_delivery:4, delivered:5 }
  const currentStep = stepMap[status] || 1
  return (
    <div className="mt-4 px-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 z-0">
          <div className="h-full bg-primary-500 transition-all duration-700" style={{ width:`${((currentStep-1)/(steps.length-1))*100}%` }} />
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center z-10 w-fit">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors duration-500 ${i+1<=currentStep ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-300'}`}>
              {i+1<=currentStep ? '✓' : step.icon}
            </div>
            <p className={`text-[10px] sm:text-xs mt-1 font-bold whitespace-nowrap ${i+1<=currentStep ? 'text-primary-700' : 'text-gray-400'}`}>{step.label}</p>
          </div>
        ))}
      </div>
      {status === 'out_for_delivery' && (
        <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center gap-3 animate-pulse">
          <div className="text-2xl">🛵</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-primary-800">डिलिव्हरी बॉय निघाला आहे!</p>
            <p className="text-[10px] text-primary-600">अंदाजे १०-१५ मि�import OrderTrackingMap from '../../components/OrderTrackingMap'

export default function Orders() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)

  const { getFarmerOrders, fetchMyOrders, loading } = useOrderStore()
  const { user }   = useAuthStore()
  const { t }      = useLanguageStore()
  const navigate   = useNavigate()

  useEffect(() => { fetchMyOrders() }, [])

  const myOrders = getFarmerOrders()

  const statusConfig = {
    pending:   { label:'Pending',   color:'text-amber-600  bg-amber-50  border-amber-200',  dot:'bg-amber-500'  },
    accepted:  { label:'Accepted',  color:'text-blue-600   bg-blue-50   border-blue-200',   dot:'bg-blue-500'   },
    packing:   { label:'Packing',   color:'text-purple-600 bg-purple-50 border-purple-200', dot:'bg-purple-500' },
    out_for_delivery: { label:'Out for Delivery', color:'text-orange-600 bg-orange-50 border-orange-200', dot:'bg-orange-500' },
    delivered: { label:'Delivered', color:'text-green-600  bg-green-50  border-green-200',  dot:'bg-green-500'  },
    rejected:  { label:'Rejected',  color:'text-red-500    bg-red-50    border-red-200',    dot:'bg-red-500'    },
  }

  const filters      = ['all', 'pending', 'accepted', 'delivered', 'rejected']
  const filterLabels = { all:'Sab', pending:'Pending', accepted:'Accepted', delivered:'Delivered', rejected:'Rejected' }
  const filtered     = myOrders.filter(o => activeFilter === 'all' || o.status === activeFilter)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-400">Orders load hot aahet...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/shop')} className="p-2 rounded-xl bg-white border border-gray-200 hover:shadow-md transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">📦 {t('ordersTitle')}</h1>
            <p className="text-sm text-gray-400">{myOrders.length} orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label:'Ekun',      value:myOrders.length,                                     color:'bg-gray-800'  },
            { label:'Pending',   value:myOrders.filter(o=>o.status==='pending').length,    color:'bg-amber-500' },
            { label:'Accepted',  value:myOrders.filter(o=>o.status==='accepted').length,   color:'bg-blue-500'  },
            { label:'Delivered', value:myOrders.filter(o=>o.status==='delivered').length,  color:'bg-green-600' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} text-white rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${activeFilter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 font-medium">{t('noOrders')}</p>
              <button onClick={() => navigate('/shop')} className="mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-primary-700 transition text-sm">
                🛒 {t('shopMore')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10"><p className="text-gray-400">Ya filter madhe kahi nahi</p></div>
          ) : (
            filtered.map((order) => {
              const status     = statusConfig[order.status] || statusConfig.pending
              const isExpanded = expandedId === order._id
              return (
                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Order ID</p>
                        <p className="font-bold text-gray-800 text-sm">#{order._id.slice(-6)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 flex items-center gap-2"><span>{item.icon}</span>{item.name} × {item.qty}</span>
                          <span className="text-sm font-medium text-gray-800">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{order.payment?.toUpperCase()}</span>
                      <span className="font-bold text-gray-900">₹{order.finalAmount}</span>
                    </div>

                    <OrderTimeline status={order.status} />
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                      
                      {/* Live Map Tracking */}
                      <div className="space-y-2">
                        <p className="font-bold text-gray-700 text-sm flex items-center gap-2">🗺️ Live Tracking</p>
                        <OrderTrackingMap status={order.status} orderId={order._id} />
                      </div>

                      <div className="bg-white rounded-xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">💰 Price Details</p>
                        <div className="flex justify-between text-gray-600"><span>Items Total</span><span>₹{order.totalAmount}</span></div>
                        <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>
                        <div className="flex justify-between text-gray-600">
                          <span>Delivery ({order.distance} km)</span>
                          <span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>{order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 border-t pt-2"><span>Total</span><span>₹{order.finalAmount}</span></div>
                      </div>

                      <div className="bg-white rounded-xl p-4 text-sm space-y-2">
                        <p className="font-semibold text-gray-700">🚚 Delivery Info</p>
                        <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-gray-800 text-right max-w-[60%]">{order.address}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium text-gray-800">{order.payment?.toUpperCase()}</span></div>
                        {order.note && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2"><p className="text-amber-700 text-xs">📝 Note: {order.note}</p></div>}
                      </div>

                      {order.status === 'pending'   && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium text-center">⏳ Store owner tumcha order baghat aahe...</div>}
                      {order.status === 'accepted'  && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-medium text-center">✅ Order accepted! Store pack karat aahe...</div>}
                      {order.status === 'out_for_delivery' && <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 font-medium text-center">🛵 डिलिव्हरी बॉय निघाला आहे! मॅप वर बघा.</div>}
                      {order.status === 'delivered' && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium text-center">🎉 Order deliver zala!</div>}
div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium text-center">🎉 Order deliver zala!</div>}

                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'delivered' && (
                          <>
                            <button onClick={() => toast.success('Review submit kela! ⭐')} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition"><Star size={14} /> Review Likha</button>
                            <button onClick={() => navigate('/shop')} className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition"><RotateCcw size={14} /> Order Again</button>
                          </>
                        )}
                        {order.status === 'rejected' && (
                          <button onClick={() => navigate('/shop')} className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">🛒 Parat Order Kara</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {myOrders.length > 0 && (
          <div className="mt-8 text-center">
            <button onClick={() => navigate('/shop')} className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition">
              🛒 {t('shopMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}