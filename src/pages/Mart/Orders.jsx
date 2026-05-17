import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, RotateCcw, Star, Loader, Phone, MessageSquare, MapPin, ChevronRight, Navigation, ShieldCheck } from 'lucide-react'
import OrderTrackingMap from '../../components/OrderTrackingMap'
import useOrderStore from '../../store/orderStore'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import toast from 'react-hot-toast'
import { generateInvoice } from '../../utils/invoiceGenerator'
import { orderAPI, productAPI } from '../../api'
import { X, AlertCircle, RefreshCw } from 'lucide-react'

// ─── 🔄 RETURN/EXCHANGE MODAL ──────────────────────────
function ReturnModal({ isOpen, onClose, onSubmit, isMR }) {
  const [reason, setReason] = useState('')
  const reasons = isMR ? [
    'चुकीची वस्तू मिळाली (Wrong Product)',
    'वस्तू खराब आहे/तुटली आहे (Damaged Item)',
    'दुसऱ्या कंपनीची वस्तू आहे (Different Company)',
    'Expiry झाली आहे (Expired Product)',
    'अपेक्षित गुणवत्ता नाही (Low Quality)',
    'प्रमाण कमी आहे (Less Quantity)'
  ] : [
    'Wrong Product Received',
    'Damaged Item',
    'Different Company/Brand',
    'Expired Product',
    'Quality Not as Expected',
    'Quantity is Less'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[300] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-t-[40px] md:rounded-[48px] w-full max-w-lg animate-in slide-in-from-bottom duration-500 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-black text-xl text-gray-900 tracking-tight">{isMR ? 'परतावा / एक्सचेंज' : 'Return / Exchange'}</h3>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 italic">{isMR ? 'कृपया कारण निवडा' : 'Please select a reason'}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 transition-all"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-3">
          {reasons.map((r) => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full p-5 rounded-3xl text-left font-bold text-sm transition-all border-2 flex items-center justify-between group ${reason === r ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-50 text-gray-600 hover:border-red-100'}`}>
              {r}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${reason === r ? 'bg-red-500 border-red-500 text-white' : 'border-gray-100'}`}>
                {reason === r && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
          
          <button 
            disabled={!reason}
            onClick={() => onSubmit(reason)}
            className={`w-full py-5 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] mt-8 transition-all shadow-xl flex items-center justify-center gap-3 ${!reason ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white shadow-red-500/20 active:scale-95'}`}>
            <RefreshCw size={18} className={reason ? 'animate-spin-slow' : ''} /> {isMR ? 'विनंती पाठवा' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ⭐ PRODUCT RATING MODAL ──────────────────────────
function RatingModal({ isOpen, onClose, onSubmit, products, isMR }) {
  const [ratings, setRatings] = useState({})
  
  if (!isOpen || !products) return null

  const handleStarClick = (pId, star) => {
    setRatings(prev => ({
      ...prev,
      [pId]: { ...prev[pId], star, comment: prev[pId]?.comment || '' }
    }))
  }

  const handleCommentChange = (pId, comment) => {
    setRatings(prev => ({
      ...prev,
      [pId]: { ...prev[pId], star: prev[pId]?.star || 5, comment }
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[301] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
           <div>
              <h3 className="font-black text-xl text-gray-900">{isMR ? 'उत्पादनांना रेटिंग द्या' : 'Rate Products'}</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{isMR ? 'तुमचा अनुभव सांगा' : 'Share your experience'}</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 transition-all"><X size={18} /></button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
           {products.map((item) => (
             <div key={item.productId} className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100">{item.icon}</div>
                   <p className="font-black text-gray-800 text-sm">{item.name}</p>
                </div>
                
                <div className="flex gap-2">
                   {[1,2,3,4,5].map(s => (
                     <button key={s} onClick={() => handleStarClick(item.productId, s)}
                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (ratings[item.productId]?.star || 0) >= s ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20 scale-110' : 'bg-gray-50 text-gray-300' }`}>
                       <Star size={18} fill={ (ratings[item.productId]?.star || 0) >= s ? 'currentColor' : 'none' } />
                     </button>
                   ))}
                </div>

                <textarea 
                  placeholder={isMR ? "रिव्ह्यू लिहा (पर्यायी)..." : "Write a review (optional)..."}
                  value={ratings[item.productId]?.comment || ''}
                  onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-xs font-bold text-gray-700 transition-all min-h-[80px] resize-none"
                />
             </div>
           ))}
        </div>

        <div className="p-8 pt-0">
           <button 
             onClick={() => onSubmit(ratings)}
             className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
           >
             {isMR ? 'रेटिंग सबमिट करा' : 'Submit Ratings'}
           </button>
        </div>
      </div>
    </div>
  )
}

// ─── 🚀 SWIGGY/ZOMATO STYLE TRACKING OVERLAY ──────────────────────────
function SwiggyTracking({ order, onBack, t, language }) {
  const isMR = language === 'mr'
  const status = order.status
  
  // Calculate ETA (Mocked based on distance if not available)
  const distance = order.distance || 0
  const eta = Math.max(5, Math.round(distance * 2 + 5)) // 2 min per km + 5 min buffer

  const statusMessages = {
    pending:   isMR ? 'ऑर्डरची खात्री होत आहे...' : 'Confirming your order...',
    accepted:  isMR ? 'मालकाने तुमची ऑर्डर स्वीकारली आहे' : 'Store accepted your order',
    packing:   isMR ? 'तुमचा माल पॅक होत आहे' : 'Items are being packed',
    out_for_delivery: isMR ? 'डिलिव्हरी पार्टनर तुमच्याकडे येत आहे' : 'Delivery partner is on the way',
    delivered: isMR ? 'ऑर्डर पोहोचली! जेवणाचा आनंद घ्या' : 'Order delivered! Enjoy your products',
  }

  const steps = [
    { key: 'pending',   label: t('orderPlaced'), icon: '📦' },
    { key: 'accepted',  label: t('accepted'),    icon: '✅' },
    { key: 'packing',   label: 'Packing',        icon: '📫' },
    { key: 'out_for_delivery', label: 'On Way',  icon: '🛵' },
    { key: 'delivered', label: t('delivered'),   icon: '🏠' }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === status)
  
  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={24} /></button>
        <div>
          <h2 className="font-black text-gray-900 uppercase tracking-tighter italic">#{order._id.slice(-6).toUpperCase()}</h2>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">{statusMessages[status]}</p>
        </div>
      </div>

      {/* Map Section (Swiggy Style - Big) */}
      <div className="flex-1 relative bg-gray-100">
        <OrderTrackingMap status={status} orderId={order._id} orderData={order} height="h-full" />
        
        {/* Distance Indicator Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-[32px] shadow-2xl border border-white flex items-center gap-3 animate-bounce">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Navigation size={16} fill="currentColor" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Arriving in</p>
              <p className="text-xl font-black text-gray-900 leading-tight">{eta} {isMR ? 'मिभिट' : 'mins'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bottom Sheet */}
      <div className="bg-white rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.08)] px-6 pt-8 pb-10 relative z-10 -mt-10 max-h-[50vh] overflow-y-auto border-t border-gray-50">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
        
        {/* Progress Bar (Visual) */}
        <div className="flex items-center justify-between mb-10 relative px-4">
           {steps.map((step, i) => {
             const active = i <= currentStepIndex
             const isLastActive = i === currentStepIndex
             return (
               <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg border-2 transition-all duration-700 ${active ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white border-gray-100 text-gray-300'}`}>
                    {active ? '✓' : step.icon}
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-emerald-700' : 'text-gray-300'}`}>{step.label}</p>
                  {i < steps.length - 1 && (
                    <div className="absolute left-[calc(100%+10px)] top-5 w-[calc(100%+10px)] h-0.5 bg-gray-100" style={{ width: '40px' }}>
                      <div className={`h-full bg-emerald-500 transition-all duration-1000 ${active && i < currentStepIndex ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
               </div>
             )
           })}
        </div>

        {/* Action Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-5 p-5 bg-gray-50/50 rounded-[32px] border border-gray-100">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100">👤</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isMR ? 'डिलिव्हरी मुलगा (स्टोअर स्टाफ)' : 'Delivery Boy (Store Staff)'}</p>
              <h3 className="font-black text-lg text-gray-900 tracking-tight">{order.driverName || (isMR ? 'मार्ट डिलिव्हरी टीम' : 'Store Delivery Team')} <span className="text-emerald-500 text-sm ml-2">★ 5.0</span></h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><ShieldCheck size={12} /> {isMR ? 'अधिकृत स्टोअर कर्मचारी' : 'Verified Store Employee'}</p>
            </div>
            <div className="flex gap-2">
              <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-gray-100"><Phone size={20} fill="currentColor" /></button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border-2 border-dashed border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={20} className="text-emerald-500" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Delivering to</p>
                <p className="font-black text-gray-900 truncate max-w-[200px]">{order.address}</p>
              </div>
            </div>
            <button onClick={onBack} className="w-full bg-gray-900 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black transition-all">
              {isMR ? 'ऑर्डर माहिती पहा' : 'View Order Items'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function OrderTimeline({ status, t }) {
  if (status === 'cancelled' || status === 'rejected') return null
  const steps = [
    { label: t('orderPlaced'), icon:'📦' }, 
    { label: t('accepted'),    icon:'✅' }, 
    { label: t('packing') || 'Packing', icon:'📫' }, 
    { label: t('onTheWayStatus'), icon:'🛵' }, 
    { label: t('delivered'),   icon:'🏠' }
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
    </div>
  )
}



export default function Orders() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [returnOrderId, setReturnOrderId] = useState(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [ratingOrder, setRatingOrder] = useState(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  const { getFarmerOrders, fetchMyOrders, cancelOrder, payAdvance, payBalance, loading } = useOrderStore()
  const { user }   = useAuthStore()
  const { t, language } = useLanguageStore()
  const isMR       = language === 'mr'
  const navigate   = useNavigate()

  useEffect(() => { fetchMyOrders() }, [])

  const myOrders = getFarmerOrders()

  const statusConfig = {
    pending:   { label: t('pending'),   color:'text-amber-600  bg-amber-50  border-amber-200',  dot:'bg-amber-500'  },
    accepted:  { label: t('accepted'),  color:'text-blue-600   bg-blue-50   border-blue-200',   dot:'bg-blue-500'   },
    packing:   { label: t('packing') || 'Packing',   color:'text-purple-600 bg-purple-50 border-purple-200', dot:'bg-purple-500' },
    out_for_delivery: { label: t('onTheWayStatus'), color:'text-orange-600 bg-orange-50 border-orange-200', dot:'bg-orange-500' },
    delivered: { label: t('delivered'), color:'text-green-600  bg-green-50  border-green-200',  dot:'bg-green-500'  },
    rejected:  { label: t('cancelled'),  color:'text-red-500    bg-red-50    border-red-200',    dot:'bg-red-500'    },
  }

  const filters      = ['all', 'pending', 'accepted', 'delivered', 'rejected']
  const filterLabels = { all: t('filterAll') || 'All', pending: t('pending'), accepted: t('accepted'), delivered: t('delivered'), rejected: t('cancelled') }
  const filtered     = myOrders.filter(o => activeFilter === 'all' || o.status === activeFilter)

  const handleReturn = async (reason) => {
    try {
      await orderAPI.requestReturn(returnOrderId, { reason })
      toast.success(isMR ? 'विनंती पाठवली! मालक लवकरच संपर्क करेल. ✅' : 'Request sent! Owner will contact you soon. ✅')
      setIsReturnModalOpen(false)
      fetchMyOrders()
    } catch (err) {
      toast.error('Failed to request return.')
    }
  }

  const handleRateSubmit = async (ratingsMap) => {
    try {
      // Logic to submit multiple ratings
      const productIds = Object.keys(ratingsMap)
      for (const pId of productIds) {
        await productAPI.rate(pId, ratingsMap[pId])
      }
      
      toast.success(isMR ? 'तुमची रेटिंग सबमिट झाली! धन्यवाद. ⭐' : 'Ratings submitted! Thank you. ⭐')
      setIsRatingModalOpen(false)
      fetchMyOrders()
    } catch (err) {
      toast.error('Failed to submit ratings.')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-400">{isMR ? 'ऑर्डर लोड होत आहेत...' : 'Orders are loading...'}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🚀 Render Swiggy Tracking if active */}
      {trackingOrder && (
        <SwiggyTracking 
          order={myOrders.find(o => o._id === trackingOrder)} 
          onBack={() => setTrackingOrder(null)} 
          t={t} 
          language={language}
        />
      )}

       {/* 🚀 Render Return Modal */}
      <ReturnModal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        onSubmit={handleReturn}
        isMR={isMR}
      />

      <RatingModal 
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRateSubmit}
        products={ratingOrder?.items}
        isMR={isMR}
      />

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
            { label: t('allCategories') || 'All', value:myOrders.length,                                     color:'bg-gray-800'  },
            { label: t('pending'),   value:myOrders.filter(o=>o.status==='pending').length,    color:'bg-amber-500' },
            { label: t('accepted'),  value:myOrders.filter(o=>o.status==='accepted').length,   color:'bg-blue-500'  },
            { label: t('delivered'), value:myOrders.filter(o=>o.status==='delivered').length,  color:'bg-green-600' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} text-white rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] leading-tight opacity-80 mt-0.5">{stat.label}</p>
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
                        <p className="font-bold text-gray-800 text-sm">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}
                        </span>
                        {order.status === 'delivered' && !order.balancePaid && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-widest italic animate-pulse border border-amber-200">
                            {isMR ? 'पेमेंट बाकी' : 'Payment Pending'}
                          </span>
                        )}
                        {['accepted', 'packing', 'out_for_delivery'].includes(order.status) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTrackingOrder(order._id) }}
                            className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                          >
                            <Navigation size={10} fill="currentColor" /> {isMR ? 'ट्रॅकिंग' : 'Track'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><span>{item.icon}</span>{item.name} <span className="text-primary-600 font-black">× {item.qty}</span></p>
                          </div>
                          <span className="text-xs font-bold text-gray-400">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.payment?.toUpperCase()}</span>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest leading-none">
                          {isMR ? 'एकूण वस्तू' : 'Items Total'}: ₹{order.totalAmount}
                        </p>
                        {order.discount > 0 && (
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none">
                            {isMR ? 'सवलत (-)' : 'Discount (-)'}: ₹{order.discount}
                          </p>
                        )}
                        <p className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest leading-none">
                          {isMR ? 'डिलिव्हरी (+)' : 'Delivery (+)'}: ₹{order.deliveryCharge}
                        </p>
                        <div className="pt-1 mt-1 border-t border-gray-50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{isMR ? 'अंतिम बिल' : 'Final Bill'}</p>
                          <p className="font-black text-emerald-600 text-lg leading-none">₹{order.finalAmount}</p>
                        </div>
                      </div>
                    </div>

                    <OrderTimeline status={order.status} t={t} />
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                      
                      {/* Tracking CTA */}
                      {['accepted', 'packing', 'out_for_delivery'].includes(order.status) && (
                        <div 
                          onClick={() => setTrackingOrder(order._id)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[28px] p-5 text-white flex items-center justify-between cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🛵</div>
                            <div>
                               <p className="font-black text-xs uppercase tracking-widest opacity-80">{isMR ? 'रिअल-टाइम ट्रॅकिंग' : 'Live Tracking Enabled'}</p>
                               <h4 className="font-black text-lg leading-tight">{isMR ? 'ऑर्डर कुठपर्यंत आली ते पहा' : 'Track your order live'}</h4>
                            </div>
                          </div>
                          <ChevronRight size={24} />
                        </div>
                      )}

                      <div className="bg-white rounded-xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">💰 {t('priceDetails')}</p>
                        <div className="flex justify-between text-gray-600"><span>{t('itemsTotal')}</span><span>₹{order.totalAmount}</span></div>
                        <div className="flex justify-between text-green-600"><span>{t('discount')}</span><span>-₹{order.discount}</span></div>
                        <div className="flex justify-between text-gray-600">
                          <span>{t('delivery')} ({order.distance} km)</span>
                          <span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>{order.deliveryCharge === 0 ? t('freeDelivery') : `₹${order.deliveryCharge}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 border-t pt-2"><span>{t('total')}</span><span>₹{order.finalAmount}</span></div>
                      </div>

                      <div className="bg-white rounded-xl p-4 text-sm space-y-2">
                        <p className="font-semibold text-gray-700">🚚 Delivery Info</p>
                        <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-gray-800 text-right max-w-[60%]">{order.address}</span></div>
                        {order.landmark && <div className="flex justify-between font-bold"><span className="text-gray-500">Landmark</span><span className="text-amber-600">🏠 {order.landmark}</span></div>}
                      </div>

                      {order.status === 'pending'   && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium text-center">⏳ {isMR ? 'दुकानदार तुमची ऑर्डर बघत आहे...' : 'Store owner is reviewing your order...'}</div>}
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isMR ? 'पेमेंट माहिती' : 'Payment Progress'}</p>
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${order.advancePaid && order.balancePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {order.advancePaid && order.balancePaid ? (isMR ? 'पूर्ण भरले' : 'Fully Paid') : (isMR ? 'अंशत: भरले' : 'Partial')}
                           </span>
                        </div>
                        
                        <div className="p-5 space-y-6">
                          {/* Payment Stages */}
                          <div className="flex items-center justify-between relative px-2">
                             <div className="absolute left-8 right-8 top-4 h-0.5 bg-gray-100">
                                <div className={`h-full bg-emerald-500 transition-all duration-1000 ${order.advancePaid ? (order.balancePaid ? 'w-full' : 'w-1/2') : 'w-0'}`} />
                             </div>
                             
                             {/* Advance Stage */}
                             <div className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all ${order.advancePaid ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>
                                  {order.advancePaid ? '✓' : '1'}
                                </div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${order.advancePaid ? 'text-emerald-700' : 'text-gray-300'}`}>{isMR ? 'अ‍ॅडव्हान्स' : 'Advance'}</p>
                             </div>

                             {/* Balance Stage */}
                             <div className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all ${order.balancePaid ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>
                                  {order.balancePaid ? '✓' : '2'}
                                </div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${order.balancePaid ? 'text-emerald-700' : 'text-gray-300'}`}>{isMR ? 'उर्वरित' : 'Balance'}</p>
                             </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-3">
                            {order.status === 'accepted' && !order.advancePaid && (
                              <div className="animate-in zoom-in duration-300">
                                <p className="text-[11px] font-bold text-blue-600 mb-3 text-center italic">
                                  {isMR ? '✅ ऑर्डर स्वीकारली! पॅकिंग सुरू करण्यासाठी अ‍ॅडव्हान्स भरा.' : '✅ Order accepted! Pay advance to start packing.'}
                                </p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); payAdvance(order._id); }}
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                  💰 {isMR ? `₹${order.advanceAmount} अ‍ॅडव्हान्स भरा` : `Pay ₹${order.advanceAmount} Advance`}
                                </button>
                              </div>
                            )}

                            {order.advancePaid && !order.balancePaid && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                                  <CheckCircle size={14} /> {isMR ? 'अ‍ॅडव्हान्स यशस्वीरित्या भरला आहे' : 'Advance Payment Successful'}
                                </div>
                                
                                {['out_for_delivery', 'delivered'].includes(order.status) ? (
                                  <div className="animate-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">{isMR ? 'डिलिव्हरी पूर्ण झाल्यावर उर्वरित पैसे भरा' : 'Pay remaining amount upon delivery'}</p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); payBalance(order._id); }}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                      💰 {isMR ? `उर्वरित ₹${order.finalAmount - order.advanceAmount} भरा` : `Pay Balance ₹${order.finalAmount - order.advanceAmount}`}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                     <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse italic">
                                       ⏳ {isMR ? 'पॅकिंग आणि डिलिव्हरीची प्रतीक्षा करत आहे' : 'Waiting for packing & delivery'}
                                     </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {order.balancePaid && (
                              <div className="flex flex-col items-center gap-3 bg-emerald-50 p-6 rounded-3xl border-2 border-dashed border-emerald-200 animate-in zoom-in duration-500">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                                   <ShieldCheck size={24} fill="currentColor" className="opacity-20" />
                                   <CheckCircle size={16} className="absolute" />
                                </div>
                                <div className="text-center">
                                  <p className="font-black text-emerald-700 text-sm">{isMR ? 'पूर्ण पेमेंट यशस्वी!' : 'Full Payment Received!'}</p>
                                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{isMR ? 'व्यवहार पूर्ण झाला आहे' : 'Transaction completed successfully'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                         {order.status === 'delivered' && (
                          <>
                            <button onClick={() => { setRatingOrder(order); setIsRatingModalOpen(true); }} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition"><Star size={14} /> {isMR ? 'रेटिंग द्या' : 'Rate Items'}</button>
                            <button onClick={() => navigate('/shop')} className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition"><RotateCcw size={14} /> {t('orderAgain')}</button>
                            {!order.returnRequested && (
                              <button onClick={() => { setReturnOrderId(order._id); setIsReturnModalOpen(true); }} className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                                🔄 {isMR ? 'परतावा / एक्सचेंज' : 'Return / Exchange'}
                              </button>
                            )}
                          </>
                        )}
                        {order.billGenerated && order.balancePaid ? (
                          <button 
                            onClick={() => generateInvoice(order, null)} 
                            className="flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            📄 {isMR ? 'बिल डाऊनलोड करा' : 'Download Invoice'}
                          </button>
                        ) : order.billGenerated && !order.balancePaid ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-[10px] text-amber-700 font-bold italic">
                            ⚠️ {isMR ? 'पावतीसाठी उर्वरित पेमेंट पूर्ण करा' : 'Complete balance payment to get invoice'}
                          </div>
                        ) : order.status === 'delivered' && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-[10px] text-emerald-700 font-bold italic animate-pulse">
                            ⏳ {isMR ? "मालकाकडून बिल तयार होत आहे..." : "Owner is generating your bill..."}
                          </div>
                        )}
                        {order.returnRequested && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs font-bold italic animate-pulse flex items-center gap-2">
                             ⏳ {isMR ? "परतावा विनंती प्रक्रियेत आहे..." : "Return request in progress..."}
                             <span className="text-[10px] font-normal">({order.returnReason})</span>
                          </div>
                        )}
                        {['pending', 'accepted', 'packing'].includes(order.status) && (
                          <button onClick={() => window.confirm(isMR ? 'ऑर्डर रद्द करायची आहे का?' : 'Cancel this order?') && cancelOrder(order._id)} 
                            className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                            ❌ {t('cancelOrder') || 'Cancel Order'}
                          </button>
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