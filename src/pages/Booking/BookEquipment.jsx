import { useState, useEffect } from 'react'
import { MapPin, Star, Phone, ChevronRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useLanguageStore from '../../store/languageStore'
import useBookingStore from '../../store/bookingStore'
import useAuthStore from '../../store/authStore'
import { maharashtraData } from '../../utils/locationData'
import { equipmentAPI, bookingAPI } from '../../api'
import { sendWhatsAppMessage, WA_TEMPLATES } from '../../utils/whatsapp'
import toast from 'react-hot-toast'

// ─────────────────────────── Equipment Detail Modal ───────────────────────────
function EquipmentDetailModal({ equipment, onClose, onOpenBooking }) {
  const { t, language } = useLanguageStore()
  if (!equipment) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="relative h-64 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-8xl shrink-0">
          {equipment.icon}
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition">×</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-primary-100 text-primary-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">{equipment.category}</span>
              <h2 className="text-2xl font-black text-gray-800 mt-2">{equipment.name}</h2>
              <p className="text-gray-500 font-medium flex items-center gap-1 mt-1 text-sm"><MapPin size={14} /> {equipment.location}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary-600">₹{equipment.price || equipment.pricePerHour || 0}</span>
              <p className="text-xs text-gray-400">{equipment.priceUnit === 'acre' ? (language === 'mr' ? 'एकर' : 'Acre') : (language === 'mr' ? 'तास' : 'Hour')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{language === 'mr' ? 'मालक' : 'Owner'}</p>
              <p className="font-bold text-gray-800 text-base">{equipment.ownerName || 'Verified Partner'}</p>
              <p className="text-sm font-black text-primary-700 mt-0.5">{equipment.shopName || equipment.ownerName}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{language === 'mr' ? 'वेरिफाईड पार्टनर' : 'Verified Partner'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Rating</p>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                {equipment.reviews > 0 ? (
                  <>
                    <p className="font-bold text-gray-800">{equipment.rating}</p>
                    <p className="text-xs text-gray-400">{equipment.reviews} reviews</p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'mr' ? 'नवीन' : 'New Equipment'}</p>
                )}
              </div>
            </div>
          </div>

          {equipment.features?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-widest">Premium Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {equipment.features.map(f => (
                  <div key={f} className="flex items-center gap-2 bg-green-50 text-green-700 p-2 rounded-xl text-xs font-bold border border-green-100">
                    <Check size={14} /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {equipment.description && (
            <div>
              <h3 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-widest">Description</h3>
              <p className="text-gray-600 text-sm italic">"{equipment.description}"</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <a href={`tel:${equipment.ownerPhone || ''}`} className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition shrink-0">
            <Phone size={20} />
          </a>
          <button
            onClick={() => { onOpenBooking(equipment); onClose() }}
            disabled={!equipment.available || equipment.isUnderMaintenance}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {equipment.isUnderMaintenance ? (language === 'mr' ? 'दुरुस्तीमध्ये आहे 🛠️' : 'Under Maintenance 🛠️') : (t('bookNow') + ' ')}
            {!equipment.isUnderMaintenance && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────── Booking Modal with Slot Calendar ────────────────
function BookingModal({ equipment, onClose, onConfirm }) {
  const [bookingMode, setBookingMode] = useState('shift') // 'shift' or 'hourly'
  const [bookingMap, setBookingMap] = useState({}) // shift: { date: [slots] }, hourly: { date: hours }
  const [activeDate, setActiveDate] = useState('')
  const [note, setNote] = useState('')
  const [landmark, setLandmark] = useState('')
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [village, setVillage] = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [acres, setAcres] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const { t, language } = useLanguageStore()
  const isMR = language === 'mr'
  const isHI = language === 'hi'

  const SLOT_HOURS = {
    morning:   6,
    afternoon: 6,
    evening:   6,
    night:     6
  }

  // Calculate Total Hours & Price
  const isAcre = equipment.priceUnit === 'acre'
  const equipPrice = equipment.price || equipment.pricePerHour || 0

  const totalHours = Object.values(bookingMap).reduce((acc, current) => {
    if (!Array.isArray(current)) return acc
    if (bookingMode === 'shift') {
      return acc + current.reduce((sum, slotId) => sum + (SLOT_HOURS[slotId] || 0), 0)
    }
    return acc + current.length // Each hourly slot is 1 hr
  }, 0)

  const totalPrice = isAcre ? (equipPrice * acres) : (equipPrice * totalHours)
  const discountAmt = (isAcre ? acres >= 5 : totalHours >= 8) ? Math.floor(totalPrice * 0.1) : 0
  const finalPrice = totalPrice - discountAmt

  const districts = Object.keys(maharashtraData).sort()
  const talukas = district ? maharashtraData[district].talukas : []

  useEffect(() => {
    const fetchAvail = async () => {
      setIsLoading(true)
      try {
        const res = await bookingAPI.getAvailability(equipment._id)
        setBookedSlots(res.data || [])
      } catch {
        setBookedSlots([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAvail()
  }, [equipment._id])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const allDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  useEffect(() => {
    if (allDays.length > 0 && !activeDate) {
      setActiveDate(getDateStr(allDays[0]))
    }
  }, [activeDate, allDays])

  const HOURLY_INTERVALS = [
    { id: 'h00', label: '12:00 AM', end: '01:00 AM', hrs: 1 },
    { id: 'h01', label: '01:00 AM', end: '02:00 AM', hrs: 1 },
    { id: 'h02', label: '02:00 AM', end: '03:00 AM', hrs: 1 },
    { id: 'h03', label: '03:00 AM', end: '04:00 AM', hrs: 1 },
    { id: 'h04', label: '04:00 AM', end: '05:00 AM', hrs: 1 },
    { id: 'h05', label: '05:00 AM', end: '06:00 AM', hrs: 1 },
    { id: 'h06', label: '06:00 AM', end: '07:00 AM', hrs: 1 },
    { id: 'h07', label: '07:00 AM', end: '08:00 AM', hrs: 1 },
    { id: 'h08', label: '08:00 AM', end: '09:00 AM', hrs: 1 },
    { id: 'h09', label: '09:00 AM', end: '10:00 AM', hrs: 1 },
    { id: 'h10', label: '10:00 AM', end: '11:00 AM', hrs: 1 },
    { id: 'h11', label: '11:00 AM', end: '12:00 PM', hrs: 1 },
    { id: 'h12', label: '12:00 PM', end: '01:00 PM', hrs: 1 },
    { id: 'h13', label: '01:00 PM', end: '02:00 PM', hrs: 1 },
    { id: 'h14', label: '02:00 PM', end: '03:00 PM', hrs: 1 },
    { id: 'h15', label: '03:00 PM', end: '04:00 PM', hrs: 1 },
    { id: 'h16', label: '04:00 PM', end: '05:00 PM', hrs: 1 },
    { id: 'h17', label: '05:00 PM', end: '06:00 PM', hrs: 1 },
    { id: 'h18', label: '06:00 PM', end: '07:00 PM', hrs: 1 },
    { id: 'h19', label: '07:00 PM', end: '08:00 PM', hrs: 1 },
    { id: 'h20', label: '08:00 PM', end: '09:00 PM', hrs: 1 },
    { id: 'h21', label: '09:00 PM', end: '10:00 PM', hrs: 1 },
    { id: 'h22', label: '10:00 PM', end: '11:00 PM', hrs: 1 },
    { id: 'h23', label: '11:00 PM', end: '12:00 AM', hrs: 1 },
  ]

  const SLOTS = [
    { id: 'morning', label: isMR ? 'सकाळ' : isHI ? 'सुबह' : 'Morning', time: '6AM–12PM', icon: '🌅', hrs: 6 },
    { id: 'afternoon', label: isMR ? 'दुपार' : isHI ? 'दोपहर' : 'Afternoon', time: '12PM–6PM', icon: '☀️', hrs: 6 },
    { id: 'evening', label: isMR ? 'संध्याकाळ' : isHI ? 'शाम' : 'Evening', time: '6PM–12AM', icon: '🌙', hrs: 6 },
    { id: 'night', label: isMR ? 'रात्र' : isHI ? 'रात' : 'Night', time: '12AM–6AM', icon: '🌌', hrs: 6 },
  ]

  const DAY_LABELS = isMR
    ? ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const MONTH_LABELS = isMR
    ? ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टे', 'ऑक्टो', 'नोव्हे', 'डिसे']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  function getDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const toggleSlot = (date, slotId) => {
    setBookingMap(prev => {
      const current = Array.isArray(prev[date]) ? prev[date] : []
      const updated = current.includes(slotId)
        ? current.filter(s => s !== slotId)
        : [...current, slotId]
      
      const next = { ...prev }
      if (updated.length === 0) delete next[date]
      else next[date] = updated
      return next
    })
  }

  const [pincode, setPincode] = useState('')
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isFetchingPin, setIsFetchingPin] = useState(false)

  const handlePincodeChange = async (val) => {
    setPincode(val)
    if (val.length === 6) {
      setIsFetchingPin(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`)
        const data = await res.json()
        if (data && data[0] && data[0].Status === 'Success') {
          const offices = data[0].PostOffice
          const sample = offices[0]
          
          const dist = sample.District
          const foundDist = Object.keys(maharashtraData).find(d => dist.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(dist.toLowerCase()))
          
          if (foundDist) {
            setDistrict(foundDist)
            const block = sample.Block
            const foundTaluka = maharashtraData[foundDist].talukas.find(t => block.toLowerCase().includes(t.en.toLowerCase()) || t.en.toLowerCase().includes(block.toLowerCase()))
            if (foundTaluka) setTaluka(foundTaluka.en)
          }

          setVillageSuggestions(offices.map(o => o.Name))
          toast.success(isMR ? 'पिनकोडनुसार माहिती मिळवली!' : 'Location loaded from Pincode!')
        } else {
          toast.error(isMR ? 'चुकीचा पिनकोड!' : 'Invalid Pincode!')
        }
      } catch {
        toast.error(isMR ? 'सर्व्हर एरर!' : 'Service error!')
      } finally {
        setIsFetchingPin(false)
      }
    }
  }

  const isDateHasSelection = (date) => !!bookingMap[date]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-gray-50 rounded-3xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-primary-600 to-green-800 p-5 flex-shrink-0 text-white">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full">{equipment.category?.toUpperCase()}</span>
              <h2 className="font-bold text-xl mt-2 flex items-center gap-2">{equipment.icon} {equipment.name}</h2>
              <p className="text-green-100 text-sm mt-0.5">{equipment.ownerName || 'Verified Partner'} • ₹{equipment.price || equipment.pricePerHour || 0}/{equipment.priceUnit === 'acre' ? (language === 'mr' ? 'एकर' : 'Acre') : (language === 'mr' ? 'तास' : 'Hour')}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-lg font-bold">×</button>
          </div>
        </div>

        {/* ── Mode Toggle (Hide if Acre) ── */}
        {!isAcre && (
          <div className="px-5 pt-5 flex-shrink-0">
            <div className="bg-gray-200 p-1 rounded-2xl flex gap-1">
              <button 
                onClick={() => { setBookingMode('shift'); setBookingMap({}) }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${bookingMode === 'shift' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {isMR ? '📆 शिफ्टनुसार' : isHI ? '📆 शिफ्ट के अनुसार' : '📆 SHIFT BOOKING'}
              </button>
              <button 
                onClick={() => { setBookingMode('hourly'); setBookingMap({}) }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${bookingMode === 'hourly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {isMR ? '⏱️ तासानुसार' : isHI ? '⏱️ घंटों के अनुसार' : '⏱️ HOURLY BOOKING'}
              </button>
            </div>
          </div>
        )}

        {isAcre && (
          <div className="px-5 pt-5">
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">{isMR ? 'किती एकर शेत आहे?' : 'How many acres?'}</label>
                <div className="flex items-center gap-4">
                   <input 
                     type="number" 
                     value={acres} 
                     onChange={(e) => setAcres(Math.max(1, Number(e.target.value)))}
                     className="bg-white px-4 py-2 rounded-xl border border-emerald-200 font-black text-lg w-24 outline-none focus:border-emerald-500"
                   />
                   <span className="font-black text-emerald-800">{isMR ? 'एकर' : 'Acres'}</span>
                </div>
             </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 space-y-6">

          {/* ── STEP 1: DATE SELECTION ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">1</div>
              <h3 className="font-bold text-gray-800">
                {isMR ? 'तारीख निवडा' : 'Select Date'}
                <span className="text-red-500 ml-1">*</span>
              </h3>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">{isMR ? 'उपलब्धता तपासत आहे...' : 'Checking availability...'}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                  {allDays.map((day, i) => {
                    const ds = getDateStr(day)
                    const isToday = day.toDateString() === new Date().toDateString()
                    const isActive = ds === activeDate
                    const hasSel = isDateHasSelection(ds)
                    const dayName = DAY_LABELS[day.getDay()]
                    
                    return (
                      <button key={i} onClick={() => setActiveDate(ds)}
                        className={`flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all
                          ${isActive ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : hasSel ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : isToday ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-100'}`}>
                        <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-white/80' : hasSel ? 'text-emerald-500' : 'text-gray-400'}`}>{dayName}</span>
                        <span className={`text-xl font-black mt-0.5 ${isActive ? 'text-white' : hasSel ? 'text-emerald-700' : isToday ? 'text-primary-600' : 'text-gray-800'}`}>{day.getDate()}</span>
                        {hasSel && !isActive && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1 animate-pulse" />}
                      </button>
                    )
                  })}
                </div>

                {/* ── Active Date Controls ── */}
                {activeDate && (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                      {new Date(activeDate + 'T00:00:00').toLocaleDateString(isMR ? 'mr-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>

                    {bookingMode === 'shift' ? (
                      <div className="space-y-3">
                         {SLOTS.map(slot => {
                            const booked = bookedSlots.some(b => {
                              const bDate = new Date(b.date).toISOString().split('T')[0]
                              const aDate = new Date(activeDate).toISOString().split('T')[0]
                              if (bDate !== aDate) return false
                              if (['cancelled', 'rejected'].includes(b.status)) return false
                              const ts = b.timeSlot?.toLowerCase() || ''
                              const sid = slot.id.toLowerCase()
                             const slab = slot.label.toLowerCase()
                             if (ts.includes(sid) || ts.includes(slab) || 
                                 ts.includes('morning') || ts.includes('sakal') || ts.includes('सकाळ') || ts.includes('सुबह') || 
                                 ts.includes('afternoon') || ts.includes('dupar') || ts.includes('दुपार') || ts.includes('दोपहर') ||
                                 ts.includes('evening') || ts.includes('sandhyakal') || ts.includes('संध्याकाळ') || ts.includes('शाम') ||
                                 ts.includes('night') || ts.includes('ratra') || ts.includes('रात्र') || ts.includes('रात')) {
                                   if (ts.includes(sid) || ts.includes(slab) || 
                                       (sid === 'morning' && (ts.includes('सकाळ') || ts.includes('morning') || ts.includes('सुबह'))) || 
                                       (sid === 'afternoon' && (ts.includes('दुपार') || ts.includes('afternoon') || ts.includes('दोपहर'))) ||
                                       (sid === 'evening' && (ts.includes('संध्याकाळ') || ts.includes('evening') || ts.includes('शाम'))) ||
                                       (sid === 'night' && (ts.includes('रात्र') || ts.includes('night') || ts.includes('रात')))) return true
                             }
                             const hrBooked = HOURLY_INTERVALS
                               .filter(h => {
                                 const hrNum = parseInt(h.id.replace('h',''))
                                 if (sid === 'morning') return hrNum >= 6 && hrNum < 12
                                 if (sid === 'afternoon') return hrNum >= 12 && hrNum < 18
                                 if (sid === 'evening') return hrNum >= 18 && hrNum < 24
                                 if (sid === 'night') return hrNum >= 0 && hrNum < 6
                                 return false
                               })
                               .some(h => ts.includes(h.label.toLowerCase()) || ts.includes(h.id.toLowerCase()))
                             return hrBooked
                           })
                           const selected = (bookingMap[activeDate] || []).includes(slot.id)
                          return (
                            <button key={slot.id} onClick={() => !booked && toggleSlot(activeDate, slot.id)} disabled={booked}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${booked ? 'bg-red-50 border-red-100 opacity-70 cursor-not-allowed' : selected ? 'bg-primary-600 border-primary-600 shadow-lg text-white' : 'bg-white border-gray-100 hover:border-primary-300'}`}>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${booked ? 'bg-red-100' : selected ? 'bg-white/20' : 'bg-gray-100'}`}>{slot.icon}</div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">{slot.label}</p>
                                <p className="text-[11px] opacity-70">{slot.time}</p>
                              </div>
                              {booked ? <span className="text-[10px] bg-red-100 text-red-500 px-2 py-1 rounded-lg font-bold">{isMR ? 'बुक आहे' : isHI ? 'बुक है' : 'Booked'}</span> : selected && <Check size={18} />}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-sm">
                        <p className="font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center">{isMR ? 'तास निवडा (१ तास प्रति स्लॉट)' : isHI ? 'घंटे चुनें (१ घंटा प्रति स्लॉट)' : 'SELECT SLOTS (1 HR PER SLOT)'}</p>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {HOURLY_INTERVALS.map(slot => {
                            const isBooked = bookedSlots.some(b => {
                              const bDate = new Date(b.date).toISOString().split('T')[0]
                              const aDate = new Date(activeDate).toISOString().split('T')[0]
                              if (bDate !== aDate) return false
                              if (['cancelled', 'rejected'].includes(b.status)) return false
                              const ts = b.timeSlot || ''
                              const sid = slot.id.toLowerCase()
                              const slab = slot.label.toLowerCase()
                              if (ts.toLowerCase().includes(sid) || ts.toLowerCase().includes(slab)) return true
                              const hrValue = parseInt(sid.replace('h',''))
                              if ((ts.includes('morning') || ts.includes('सकाळ') || ts.includes('सुबह') || ts.toLowerCase().includes('shift_1')) && hrValue >= 6 && hrValue < 12) return true
                              if ((ts.includes('afternoon') || ts.includes('दुपार') || ts.includes('दोपहर') || ts.toLowerCase().includes('shift_2')) && hrValue >= 12 && hrValue < 18) return true
                              if ((ts.includes('evening') || ts.includes('संध्याकाळ') || ts.includes('शाम') || ts.toLowerCase().includes('shift_3')) && hrValue >= 18 && hrValue < 24) return true
                              if ((ts.includes('night') || ts.includes('रात्र') || ts.includes('रात') || ts.toLowerCase().includes('shift_4')) && hrValue >= 0 && hrValue < 6) return true
                              return false
                            })
                            const isSelected = (bookingMap[activeDate] || []).includes(slot.id)
                            return (
                              <button key={slot.id} disabled={isBooked} onClick={() => toggleSlot(activeDate, slot.id)}
                                className={`py-3 px-2 rounded-xl font-bold text-[11px] transition-all border-2 text-center flex flex-col items-center justify-center ${isBooked ? 'bg-red-50 border-red-100 text-red-400 cursor-not-allowed shadow-inner' : isSelected ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-primary-300'}`}>
                                <span>{slot.label}</span>
                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{slot.end}</span>
                                {isBooked && <span className="text-[7px] text-red-500 font-black mt-0.5 uppercase tracking-tighter">{isMR ? 'बुक' : isHI ? 'बुक' : 'BOOKED'}</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Selection Summary ── */}
          {totalHours > 0 && (
            <section className="bg-primary-50 rounded-3xl p-5 border border-primary-100">
               <h3 className="font-black text-primary-800 text-[10px] uppercase tracking-widest mb-4">{isMR ? 'तुमची निवड' : 'YOUR SELECTION'}</h3>
               <div className="space-y-3">
                 {Object.entries(bookingMap).map(([date, val]) => (
                   <div key={date} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-primary-200/50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(date).toLocaleDateString(isMR ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {bookingMode === 'shift' 
                            ? val.map(s => <span key={s} className="bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-[10px] font-black">{SLOTS.find(x => x.id === s)?.label}</span>) 
                            : val.map(s => <span key={s} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">{HOURLY_INTERVALS.find(x => x.id === s)?.label}</span>)
                           }
                        </div>
                      </div>
                      <button onClick={() => setBookingMap(prev => { const n = {...prev}; delete n[date]; return n })} className="text-gray-300 hover:text-red-400 p-2 text-xl">&times;</button>
                   </div>
                 ))}
               </div>
               <div className="mt-4 pt-4 border-t border-primary-200/30 flex justify-between items-center">
                  <span className="text-xs font-black text-primary-800 uppercase tracking-widest">{isAcre ? (isMR ? 'एकूण क्षेत्र' : 'TOTAL AREA') : (isMR ? 'एकूण वेळ' : 'TOTAL TIME')}</span>
                  <span className="text-lg font-black text-primary-600">{isAcre ? `${acres} ${isMR ? 'एकर' : 'Acres'}` : `${totalHours} ${isMR ? 'तास' : 'HRS'}`}</span>
               </div>
            </section>
          )}

          {/* ── Location & Note ── */}
          <section className="space-y-4">
             <div className="bg-white rounded-3xl border-2 border-primary-100 p-5 space-y-4 shadow-sm">
               <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">📍 {isMR ? 'पत्ता' : 'Location'} <span className="text-red-500">*</span></h3>
               
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{isMR ? 'पिनकोड (Pincode)' : 'PINCODE'}</label>
                 <div className="relative">
                   <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (val.length <= 6) handlePincodeChange(val)
                    }}
                    placeholder={isMR ? '६ अंकी पिनकोड टाका...' : 'Enter 6-digit pin...'} 
                    className="w-full bg-gray-50 p-4 rounded-xl border-2 border-gray-100 text-sm font-black focus:border-primary-500 outline-none transition-all "
                   />
                   {isFetchingPin && <div className="absolute right-4 top-4 w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{isMR ? 'जिल्हा' : 'District'}</label>
                   <select value={district} onChange={e => { setDistrict(e.target.value); setTaluka(''); setVillage('') }} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm font-bold focus:border-primary-500 outline-none">
                     <option value="">{isMR ? 'निवडा' : 'Select'}</option>
                     {districts.map(d => <option key={d} value={d}>{maharashtraData[d][language] || d}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{isMR ? 'तालुका' : 'Taluka'}</label>
                   <select value={taluka} onChange={e => setTaluka(e.target.value)} disabled={!district} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40 focus:border-primary-500 outline-none">
                     <option value="">{isMR ? 'निवडा' : 'Select'}</option>
                     {talukas.map(tk => <option key={tk.en} value={tk.en}>{tk[language] || tk.en}</option>)}
                   </select>
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{isMR ? 'गाव' : 'Village'}</label>
                 {villageSuggestions.length > 0 ? (
                   <select 
                    value={villageSuggestions.includes(village) ? village : ''}
                    onChange={e => setVillage(e.target.value)}
                    className="w-full bg-gray-100 p-3 rounded-xl border-2 border-primary-200 text-sm font-black focus:border-primary-500 outline-none"
                   >
                     <option value="">{isMR ? 'गाव निवडा' : 'Select Village'}</option>
                     {villageSuggestions.map(v => <option key={v} value={v}>{v}</option>)}
                     <option value="other">{isMR ? '-- दुसरे नाव टाका --' : '-- Type other --'}</option>
                   </select>
                 ) : null}

                 {(villageSuggestions.length === 0 || village === 'other' || (village && !villageSuggestions.includes(village))) && (
                   <input 
                    type="text" 
                    value={village === 'other' ? '' : village}
                    placeholder={isMR ? 'गावाचे नाव सांगा...' : 'Enter village name...'} 
                    onChange={e => setVillage(e.target.value)} 
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm font-bold focus:border-primary-500 outline-none mt-2" 
                   />
                 )}
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                   📍 {isMR ? 'लँडमार्क / जवळचे ठिकाण' : 'Landmark / Nearby'} <span className="text-red-500">*</span>
                 </label>
                 <input
                   type="text"
                   value={landmark}
                   onChange={(e) => setLandmark(e.target.value)}
                   placeholder={isMR ? "उदा. पाझर तलावा जवळ, जुन्या विहिरी शेजारी..." : "e.g. Near pond, next to old well..."}
                   className="w-full bg-gray-50 p-4 rounded-xl border-2 border-gray-100 text-sm font-black focus:border-primary-500 outline-none transition-all"
                 />
               </div>
             </div>
             <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={isMR ? 'काही सूचना? (उदा. पत्ता, फोन...)' : 'Any notes?'} rows={2} className="w-full bg-white p-4 rounded-3xl border border-gray-100 text-sm font-medium resize-none" />
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="bg-white border-t border-gray-100 p-6">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-gray-500">
               <span className="text-xs font-bold uppercase tracking-wider">{isMR ? 'एकूण रक्कम' : 'TOTAL PRICE'}</span>
               <div className="flex items-center gap-2">
                 {discountAmt > 0 && <span className="text-sm line-through opacity-50 font-bold">₹{totalPrice}</span>}
                 <span className="text-xl font-bold text-gray-800">₹{finalPrice}</span>
               </div>
            </div>

            <div className="flex justify-between items-center text-emerald-600 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
               <span className="text-xs font-black uppercase tracking-wider">💰 {isMR ? '५% ॲडव्हान्स (Advance)' : '5% ADVANCE'}</span>
               <span className="text-xl font-black">₹{Math.round(finalPrice * 0.05)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-400 border-t border-dashed border-gray-100 pt-3">
               <span className="text-[10px] font-bold uppercase tracking-widest">{isMR ? 'उर्वरित रक्कम (देय)' : 'REMAINING BALANCE'}</span>
               <span className="text-lg font-bold">₹{finalPrice - Math.round(finalPrice * 0.05)}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-4">
             <p className="text-[9px] font-bold text-amber-700 leading-tight">
               ⚠️ {isMR ? 'सूचना: ५% आगाऊ रक्कम मालकाला वैयक्तिकपणे देणे अनिवार्य आहे.' : 'Notice: 5% advance to owner is mandatory.'}
             </p>
          </div>
          <button onClick={() => {
              if (totalHours === 0 && !acres) return toast.error(isMR ? 'वेळ किंवा क्षेत्र निवडा!' : 'Select time or area!')
              if (!district || !taluka || !village || !landmark) return toast.error(isMR ? 'पत्ता आणि लँडमार्क भरा!' : 'Fill address & Landmark!')
              
              const selectedSlotNames = Object.values(bookingMap).flat().map(id => {
                const s = [...SLOTS, ...HOURLY_INTERVALS].find(x => x.id === id)
                return s ? (s.label || s.id) : id
              }).join(', ')

              onConfirm({
                equipment,
                address: `${village}, ${taluka}, ${district}`,
                date: activeDate,
                multiDates: bookingMap, 
                bookingMode,
                quantity: isAcre ? acres : totalHours,
                unit: isAcre ? 'acre' : 'hour',
                timeSlot: selectedSlotNames || (bookingMode === 'shift' ? 'Shifts' : 'Hourly'),
                landmark,
                note,
                totalPrice: finalPrice,
                advanceAmount: Math.round(finalPrice * 0.05)
              })
            }}
            className="w-full bg-gradient-to-r from-primary-600 to-green-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
            {isMR ? 'बुकिंग करा' : 'Confirm'} <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────── Main Page ───────────────────────────────────────
export default function BookEquipment() {
  const [equipments, setEquipments] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [detailEquipment, setDetailEquipment] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const { language } = useLanguageStore()
  const { user } = useAuthStore()
  const isMR = language === 'mr'
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const res = await equipmentAPI.getAll({ category: activeCategory !== 'all' ? activeCategory : undefined, search: search || undefined })
        setEquipments(res.data || [])
      } catch {
        toast.error(isMR ? 'डेटा लोड झाला नाही' : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [activeCategory, search, isMR])

  const categories = [
    { id: 'all', icon: '🌾', label: isMR ? 'सर्व' : 'All' },
    { id: 'tractor', icon: '🚜', label: isMR ? 'ट्रॅक्टर' : 'Tractor' },
    { id: 'harvester', icon: '🌾', label: isMR ? 'हार्वेस्टर' : 'Harvester' },
    { id: 'rotavator', icon: '⚙️', label: isMR ? 'रोटावेटर' : 'Rotavator' },
    { id: 'thresher', icon: '🌀', label: isMR ? 'थ्रेशर' : 'Thresher' },
    { id: 'drone', icon: '🚁', label: isMR ? 'ड्रोन' : 'Drone' },
  ]

  const handleConfirm = async (bookingData) => {
    try {
      const payload = {
        equipmentId:   bookingData.equipment._id,
        equipmentName: bookingData.equipment.name,
        category:      bookingData.equipment.category,
        owner:         bookingData.equipment.ownerName || bookingData.equipment.owner?.name || bookingData.equipment.owner,
        ownerId:       bookingData.equipment.owner?._id || bookingData.equipment.ownerId || bookingData.equipment.owner,
        ownerPhone:    bookingData.equipment.ownerPhone || '',
        location:      bookingData.address || bookingData.equipment.location,
        date:          bookingData.date,
        quantity:      Number(bookingData.quantity) || 0,
        unit:          bookingData.unit || 'hour',
        timeSlot:      bookingData.timeSlot,
        price:         Number(bookingData.equipment.price || bookingData.equipment.pricePerHour) || 0,
        amount:        Number(bookingData.totalPrice) || 0,
        advanceAmount: Number(bookingData.advanceAmount) || 0,
        landmark:      bookingData.landmark || '',
        note:          bookingData.note || '',
        multiDates:    bookingData.multiDates
      }

      const res = await bookingAPI.create(payload)
      toast.success(isMR ? 'बुकिंग यशस्वी झाले!' : 'Booking Successful!')

      try {
        const message = WA_TEMPLATES.NEW_BOOKING(
          user?.name || 'Farmer', 
          bookingData.equipment.name, 
          new Date(bookingData.date).toLocaleDateString(), 
          bookingData.address
        );
        sendWhatsAppMessage(bookingData.equipment.ownerPhone, message);
      } catch (waErr) {
        console.error('WhatsApp Notification Failed:', waErr.message);
      }

      setSelectedEquipment(null)
      navigate('/my-bookings')

    } catch (err) {
      console.error('Booking Error:', err)
      toast.error(isMR ? 'बुकिंग करताना त्रुटी आली!' : 'Error creating booking!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 md:top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">🚜 {isMR ? 'शेत-यंत्र बुकिंग' : 'Book Equipment'}</h1>
              <p className="text-xs text-gray-400">{equipments.length} {isMR ? 'उपलब्ध' : 'available'}</p>
            </div>
            <button onClick={() => navigate('/my-bookings')} className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
              {isMR ? 'माझ्या बुकिंग्ज' : 'My Bookings'} <ChevronRight size={14} />
            </button>
          </div>

          <div className="relative mb-3">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={isMR ? 'यंत्र शोधा...' : 'Search equipment...'} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                  ${activeCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 font-bold animate-pulse">{isMR ? 'लोड होत आहे...' : 'Loading...'}</p>
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">{isMR ? 'काहीही सापडले नाही' : 'Nothing found'}</p>
          </div>
        ) : (
          equipments.map(equipment => (
            <div key={equipment._id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden cursor-pointer"
              onClick={() => setDetailEquipment(equipment)}
            >
              <div className="p-5">
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0">
                    {equipment.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-800">{equipment.name}</h3>
                      {equipment.tag && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0
                          ${equipment.tag === 'Top Rated' ? 'bg-amber-100 text-amber-700' :
                            equipment.tag === 'New' ? 'bg-blue-100 text-blue-700' :
                              equipment.tag === 'Budget' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {equipment.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12} /> {equipment.location}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="mt-1.5">
                        <p className="text-sm text-gray-600 font-bold flex items-center gap-1">👤 {equipment.ownerName || 'Verified Owner'}</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest ml-5">{equipment.shopName || 'Krishi Mart'}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {equipment.reviews > 0 ? (
                          <>
                            <span className="font-medium text-gray-700">{equipment.rating}</span>
                            <span className="text-gray-400">({equipment.reviews})</span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{language === 'mr' ? 'नवीन' : 'New'}</span>
                        )}
                      </span>
                    </div>
                    {equipment.features?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {equipment.features.slice(0, 3).map(f => (
                          <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">✓ {f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-xl font-bold text-gray-900">₹{equipment.price || equipment.pricePerHour || 0}</span>
                    <span className="text-gray-400 text-sm">/{equipment.priceUnit === 'acre' ? (language === 'mr' ? 'एकर' : 'Acre') : (language === 'mr' ? 'तास' : 'Hour')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${equipment.ownerPhone || ''}`} onClick={e => e.stopPropagation()}
                      className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                      <Phone size={16} className="text-gray-600" />
                    </a>
                    {equipment.isUnderMaintenance ? (
                      <span className="bg-amber-50 text-amber-600 px-5 py-2.5 rounded-xl font-black text-xs border border-amber-200 uppercase tracking-widest flex items-center gap-2">
                        🛠️ {isMR ? 'दुरुस्ती सुरू' : 'In Servicing'}
                      </span>
                    ) : equipment.available ? (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedEquipment(equipment) }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-1 active:scale-95"
                      >
                        {isMR ? 'बुक करा' : 'Book Now'} <ChevronRight size={16} />
                      </button>
                    ) : (
                      <span className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm border border-red-200">
                        {isMR ? 'अनुपलब्ध' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEquipment && (
        <BookingModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onConfirm={handleConfirm}
        />
      )}

      <EquipmentDetailModal
        equipment={detailEquipment}
        onClose={() => setDetailEquipment(null)}
        onOpenBooking={e => setSelectedEquipment(e)}
      />
    </div>
  )
}