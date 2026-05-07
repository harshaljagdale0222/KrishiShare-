import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, Star, Clock, CheckCircle, XCircle, ArrowLeft, Calendar } from 'lucide-react'
import useLanguageStore from '../../store/languageStore'
import useBookingStore from '../../store/bookingStore'
import { bookingAPI } from '../../api'
import toast from 'react-hot-toast'
import OrderTrackingMap from '../../components/OrderTrackingMap'

export default function MyBookings() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const { t, language }          = useLanguageStore()
  const { bookings, fetchMyBookings, cancelBooking, handleRealPayment, reportOwner } = useBookingStore()
  const navigate                 = useNavigate()
  const [showRateModal, setShowRateModal] = useState(false)
  const [rateData,      setRateData]      = useState(null)
  const [rating,        setRating]        = useState(5)
  const [feedback,      setFeedback]      = useState('')

  useEffect(() => {
    fetchMyBookings()
  }, [])

  const openRating = (b) => {
    setRateData(b)
    setRating(b.rating || 5)
    setFeedback(b.feedback || '')
    setShowRateModal(true)
  }

  const submitRating = async () => {
    if (!rateData) return
    try {
      // Backend expects rating (number) and feedback (string)
      await bookingAPI.rate(rateData._id, { 
        rating: Number(rating), 
        feedback: feedback.trim() 
      })
      toast.success(language === 'mr' ? 'प्रतिसाद नोंदवला गेला! धन्यवाद.' : 'Review submitted! Thank you.')
      setShowRateModal(false)
      fetchMyBookings() // Refresh the list to show updated rating
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error submitting review'
      toast.error(msg)
    }
  }

  const statusConfig = {
    completed: { label: t('completed'), color: 'text-green-600 bg-green-50 border-green-200', dot: 'bg-green-500' },
    confirmed: { label: language === 'mr' ? 'काम चालू आहे' : 'In Progress', color: 'text-blue-600  bg-blue-50  border-blue-200',  dot: 'bg-blue-500'  },
    accepted:  { label: language === 'mr' ? 'अॅडव्हान्सची प्रतीक्षा' : 'Wait for Advance', color: 'text-indigo-600  bg-indigo-50  border-indigo-200',  dot: 'bg-indigo-500 animate-bounce'  },
    pending:   { label: t('pending'),   color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    cancelled: { label: t('cancelled'), color: 'text-red-500   bg-red-50   border-red-200',   dot: 'bg-red-500'   },
    rejected:  { label: 'Rejected',     color: 'text-red-500   bg-red-50   border-red-200',   dot: 'bg-red-500'   },
  }
  // Fallback for any unknown status
  const getStatus = (s) => statusConfig[s] || { label: s, color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' }

  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

  const filtered = bookings.filter(b => activeFilter === 'all' || b.status === activeFilter)

  const handleCancel = (id) => {
    cancelBooking(id)
    toast.success(t('bookingCancelled'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/book-equipment')}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:shadow-md transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">📋 {t('myBookingsTitle')}</h1>
            <p className="text-sm text-gray-400">{bookings.length} bookings</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: t('ekun'),      value: bookings.length,                                        color: 'bg-gray-800'  },
            { label: t('pending'),   value: bookings.filter(b => b.status === 'pending').length,    color: 'bg-amber-500' },
            { label: t('confirmed'), value: bookings.filter(b => b.status === 'confirmed').length,  color: 'bg-blue-500'  },
            { label: t('completed'), value: bookings.filter(b => b.status === 'completed').length,  color: 'bg-green-600' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} text-white rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                ${activeFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}>
              {f === 'all' ? t('allBookings') : t(f)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 font-medium text-lg">{t('noBookingsYet')}</p>
              <button onClick={() => navigate('/book-equipment')}
                className="mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-primary-700 transition text-sm">
                🚜 {t('bookEquipmentNow')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500">{t('nothingFound')}</p>
            </div>
          ) : (
            filtered.map((booking) => {
              const status     = getStatus(booking.status)
              const isExpanded = expandedId === booking._id

              return (
                <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : booking._id)}>
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                        {booking.icon || (booking.category === 'tractor' ? '🚜' : '🌾')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-gray-800 text-sm leading-tight">{booking.equipmentName}</h3>
                          <div className="flex flex-col items-end gap-1">
                            {booking.isDisputed && (
                              <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-tighter">
                                {language === 'mr' ? '🚨 तक्रार प्रलंबित' : '🚨 REPORTED'}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(booking.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {booking.timeSlot}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {booking.location} 
                            {booking.landmark && <span className="text-amber-600 font-bold italic"> (🏠 {booking.landmark})</span>}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            ⏱️ {booking.hours} {t('hours')} • 👤 {booking.owner}
                          </span>
                          <span className="font-bold text-gray-900">₹{booking.amount}</span>
                        </div>
                      </div>
                    </div>
                    {booking.isDisputed && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <p className="text-[11px] font-bold text-red-700 uppercase leading-none">
                            {language === 'mr' ? 'मालकाने तुमच्याबद्दल तक्रार केली आहे' : 'OWNER HAS REPORTED THIS BOOKING'}
                          </p>
                          <p className="text-[10px] text-red-500 mt-1 leading-tight font-medium">
                            {language === 'mr' 
                              ? 'मालकाचे म्हणणे आहे की व्यवहार पूर्ण झाला नाही. कृपया चर्चा करून मिटवा.' 
                              : 'The owner claims there was a payment or behavior issue. Please contact owner to resolve.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && (booking.status === 'confirmed' || booking.status === 'accepted') && (
                    <div className="px-5 pb-4 bg-gray-50 space-y-2">
                      <p className="font-bold text-gray-700 text-xs flex items-center gap-2">🚜 यंत्र कुठे आहे? (Live Tracking)</p>
                      <OrderTrackingMap status="out_for_delivery" orderId={booking._id} orderData={booking} />
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        {[
                          [t('bookingId'), booking._id],
                          [t('owner'),     booking.owner],
                          [t('hours'),     `${booking.hours} ${t('hours')}`],
                          [t('timeSlot'),  booking.timeSlot],
                          [t('total2'),    `₹${booking.amount}`],
                          [t('location'),  booking.location],
                        ].map(([key, val]) => (
                          <div key={key}>
                            <p className="text-gray-400 text-xs">{key}</p>
                            <p className="font-semibold text-gray-800">{val}</p>
                          </div>
                        ))}
                      </div>

                      {booking.note && (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 text-sm text-gray-600">
                          📝 {booking.note}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <a href={`tel:${booking.ownerPhone}`}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                          <Phone size={14} /> {t('callOwner')}
                        </a>
                        {/* WhatsApp to owner */}
                        {booking.ownerPhone && (
                          <a
                            href={`https://wa.me/${booking.ownerPhone?.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`नमस्ते! मी ${booking.equipmentName} साठी बुकिंग केली आहे. तारीख: ${new Date(booking.date).toLocaleDateString()}, वेळ: ${booking.timeSlot}. - KrishiShare \uD83D\uDE9C`)}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md shadow-green-300/30 active:scale-95">
                            \uD83D\uDCF1 WhatsApp
                          </a>
                        )}
                        {booking.status === 'completed' && (
                          <button onClick={() => openRating(booking)}
                            className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition ${booking.rating ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            <Star size={14} fill={booking.rating ? "currentColor" : "none"} /> {booking.rating ? `${booking.rating} Star Review` : t('writeReview')}
                          </button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button onClick={() => handleCancel(booking._id)}
                            className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                            <XCircle size={14} /> {t('cancelBooking')}
                          </button>
                        )}
                        {booking.status === 'accepted' && (
                          <button onClick={() => handleRealPayment(booking, 'advance')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all mt-2 mb-2">
                            💰 {language === 'mr' 
                              ? `अॅडव्हान्स भरा - ₹${booking.advanceAmount || Math.round(booking.amount * 0.05)}` 
                              : `Pay Advance - ₹${booking.advanceAmount || Math.round(booking.amount * 0.05)}`}
                          </button>
                        )}
                        {(booking.status === 'confirmed' || booking.status === 'completed') && booking.paymentStatus !== 'paid' && (
                          <button onClick={() => handleRealPayment(booking, 'full')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all mt-2 mb-2">
                            💵 {language === 'mr' 
                              ? `उर्वरित पूर्ण पैसे भरा - ₹${booking.amount - (booking.advanceAmount || 0)}` 
                              : `Pay Balance - ₹${booking.amount - (booking.advanceAmount || 0)}`}
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => window.confirm(language === 'mr' ? 'मालकाबद्दल फसवणुकीची तक्रार करायची आहे का? (Strike System)' : 'Report this owner for fraud?') && reportOwner(booking._id)}
                            className="mt-3 w-full text-[9px] font-black text-red-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 py-2 border border-dashed border-red-100 rounded-xl">
                            ⚠️ {language === 'mr' ? 'मालकाने अवजारे पाठवले नाहीत? (तक्रार करा)' : 'Owner didn\'t send machinery? (Report)'}
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button onClick={() => navigate('/book-equipment')}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                            🔄 {t('rebooking')}
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

        {bookings.length > 0 && (
          <div className="mt-8 text-center">
            <button onClick={() => navigate('/book-equipment')}
              className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition">
              🚜 {t('newBooking')}
            </button>
          </div>
        )}

        {/* ─── Rating Modal ─── */}
        {showRateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🌟</div>
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('writeReview')}</h3>
                <p className="text-sm opacity-80 mt-1">{rateData?.equipmentName}</p>
              </div>
              <div className="p-8">
                <div className="flex justify-center gap-2 mb-8">
                  {[1,2,3,4,5].map(nu => (
                    <button key={nu} onClick={() => setRating(nu)} className="transition transform active:scale-90">
                      <Star size={36} fill={nu <= rating ? "#f59e0b" : "none"} className={nu <= rating ? "text-amber-500" : "text-gray-200"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder={language === 'mr' ? "तुमचा अनुभव लिहा..." : "Share your experience..."}
                  className="w-full bg-gray-50 border-2 border-gray-100 focus:border-amber-400 rounded-2xl p-4 text-sm font-medium outline-none h-24 transition"
                />
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowRateModal(false)} className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-bold uppercase text-xs">Cancel</button>
                  <button onClick={submitRating} className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg shadow-amber-200">Submit Review</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}