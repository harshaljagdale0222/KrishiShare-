import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquare, Send, X, AlertCircle, ChevronRight, Mic, MicOff, Factory, Tractor, ShoppingCart, HelpCircle } from 'lucide-react'
import { complaintAPI, factoryAPI, authAPI, bookingAPI, harvestAPI, orderAPI } from '../../api'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import toast from 'react-hot-toast'

export default function ComplaintBot() {
  const [isOpen, setIsOpen] = useState(false)
  const botRef = useRef(null)
  
  // Close on Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (botRef.current && !botRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])
  const [entities, setEntities] = useState([]) // generic list of factories/owners/marts
  const [step, setStep] = useState(1) 
  const [formData, setFormData] = useState({
    targetId: '',
    targetName: '',
    driverName: '', // New Field
    subject: '',
    message: '',
    toliNumber: '',
    priority: 'medium',
    isOther: false,
    category: 'general' // sugar_factory, equipment, mart, general
  })
  const [isListening, setIsListening] = useState(false)
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')

  // ─── Detect Context ───────────────────────────────────────
  const getContext = () => {
    const path = location.pathname
    if (path.includes('sugar-factory')) return { category: 'sugar_factory', label: 'साखर कारखाना (Sugar Factory)', role: 'factory_owner', icon: <Factory size={20}/> }
    if (path.includes('book-equipment') || path.includes('my-bookings')) return { category: 'equipment', label: 'ट्रॅक्टर / अवजारे मालक (Equipment Owner)', role: 'equipment_owner', icon: <Tractor size={20}/> }
    if (path.includes('orders') || path.includes('shop') || path.includes('cart')) return { category: 'mart', label: 'कृषी मार्ट / डिलिव्हरी (Mart & Delivery)', role: 'mart_owner', icon: <ShoppingCart size={20}/> }
    return { category: 'general', label: 'मदत केंद्र (General Support)', role: null, icon: <HelpCircle size={20}/> }
  }

  const context = getContext()

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, category: context.category, targetId: '', targetName: '', step: 1 }))
      fetchEntities()
    }
  }, [isOpen, location.pathname])

  const fetchEntities = async () => {
    try {
      if (context.category === 'sugar_factory') {
        const [factoriesRes, requestsRes] = await Promise.all([
          factoryAPI.getAll(),
          harvestAPI.getMyRequests()
        ])
        
        const factories = Array.isArray(factoriesRes.data) ? factoriesRes.data : (factoriesRes.data?.value || [])
        const requests = Array.isArray(requestsRes.data) ? requestsRes.data : (requestsRes.data?.value || [])

        // 1. Factories from user's actual harvest requests
        const recentFactories = (requests || []).map(r => {
          const factory = r.factoryId || {}
          return {
             _id: factory._id || r.factoryId,
             name: factory.name || factory.factoryName || r.factoryName || "साखर कारखाना",
             isRecent: true
          }
        }).filter(f => f._id)

        // 2. All registered factories
        const allFactories = (factories || []).map(f => ({
          _id: f._id,
          name: f.name || f.factoryName || f.businessName || "Dedicated Factory",
          isRecent: false
        })).filter(f => f._id)

        // Deduplicate: recentFactories take precedence
        const unique = Array.from(new Map([...allFactories, ...recentFactories].filter(f => f._id && f.name).map(item => [item._id.toString(), item])).values())
        setEntities([...unique].sort((a,b) => (b.isRecent ? 1 : 0) - (a.isRecent ? 1 : 0)))

      } else if (context.category === 'mart') {
        const [ownersRes, ordersRes] = await Promise.all([
          authAPI.getByRole('mart_owner'),
          orderAPI.getMyOrders()
        ])
        
        const storesList = Array.isArray(ownersRes.data) ? ownersRes.data : (ownersRes.data?.value || [])
        const ordersList = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.value || [])

        // Stores from user's actual orders
        const recentStores = (ordersList || []).map(o => ({
          _id: o.storeOwnerId?._id || o.storeOwnerId,
          name: o.storeOwnerId?.businessName || o.storeOwnerId?.name || "कृषी मार्ट",
          isRecent: true
        })).filter(s => s._id)

        // All registered mart owners
        const allStores = (storesList || []).map(u => ({
          _id: u._id,
          name: u.businessName || u.name,
          isRecent: false
        })).filter(u => u._id)

        const unique = Array.from(new Map([...allStores, ...recentStores].filter(s => s._id && s.name).map(item => [item._id.toString(), item])).values())
        setEntities([...unique].sort((a,b) => (b.isRecent ? 1 : 0) - (a.isRecent ? 1 : 0)))

      } else if (context.category === 'equipment') {
        const [bookingsRes, ownersRes] = await Promise.all([
          bookingAPI.getMyBookings(),
          authAPI.getByRole('equipment_owner')
        ])
        
        const bookingOwners = (bookingsRes.data || []).map(b => {
          const owner = b.equipment?.ownerId || b.ownerId
          return {
             _id: owner?._id, 
             name: owner?.name || owner?.businessName || "Equipment Owner",
             isRecent: true
          }
        }).filter(o => o._id)

        const allOwners = (ownersRes.data || []).map(u => ({
          _id: u?._id,
          name: u?.name || "", 
          isRecent: false
        })).filter(o => o._id && o.name && 
          !o.name.toLowerCase().includes('services') && 
          !o.name.toLowerCase().includes('equipments') &&
          !o.name.toLowerCase().includes('agro')
        )

        const unique = Array.from(new Map([...allOwners, ...bookingOwners].filter(o => o._id && o.name).map(item => [item._id.toString(), item])).values())
        setEntities([...unique].sort((a,b) => (b.isRecent ? 1 : 0) - (a.isRecent ? 1 : 0)))
        
      } else if (context.role) {
        const res = await authAPI.getByRole(context.role)
        const mapped = res.data.map(u => ({ _id: u._id, name: u.name || u.businessName || u.factoryName }))
        setEntities(mapped)
      } else {
        setEntities([])
      }
    } catch (err) {
      console.error('Fetch entities failed', err)
    }
  }


  const subjects = {
    sugar_factory: [
      'टोळी वेळेवर आली नाही (Toli Delay)',
      'पेमेंट मध्ये अडचण (Payment Issue)',
      'वजन काट्यात फरक (Weight Issue)',
      'टोळीची वागणूक (Toli Behavior)',
      'इतर (Other)'
    ],
    equipment: [
      'ट्रॅक्टर वेळेवर आला नाही (Booking Delay)',
      'काम व्यवस्थित केले नाही (Quality Issue)',
      'जादा पैसे मागितले (Overcharging)',
      'वागणूक चांगली नाही (Owner Behavior)',
      'इतर (Other)'
    ],
    mart: [
      'डिलिव्हरी उशिरा झाली (Delivery Delay)',
      'चुकीचे प्रॉडक्ट आले (Wrong Product)',
      'पॅकेजिंग खराब आहे (Damaged Item)',
      'पैसे कट झाले पण ऑर्डर लागली नाही (Payment Fail)',
      'इतर (Other)'
    ],
    general: [
      'ॲप चालत नाहीये (App Bug)',
      'लॉगिन मध्ये अडचण (Login Issue)',
      'माहिती हवी आहे (Need Info)',
      'इतर (Other)'
    ]
  }

  const currentSubjects = subjects[context.category] || subjects.general

  const handleSubmit = async () => {
    if (!formData.targetId && !formData.targetName) {
      toast.error('कृपया मालक किंवा कारखान्याचे नाव निवडा!')
      setStep(3)
      return
    }
    if (!formData.message) {
      toast.error('कृपया संदेश टाईप करा!')
      return
    }
    try {
      const submission = {
        ...formData,
        factoryId: formData.targetId,
        factoryName: formData.targetName,
        category: context.category
      }
      await complaintAPI.create(submission)
      toast.success(`तक्रार यशस्वीपणे नोंदवली गेली! 🙏 ${formData.targetName} यांना कळवण्यात आले आहे.`)
      setIsOpen(false)
      setStep(1)
      setFormData({ targetId: '', targetName: '', driverName: '', subject: '', message: '', toliNumber: '', priority: 'medium', isOther: false, category: 'general' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'तक्रार नोंदवण्यात अडचण आली.')
    }
  }

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitRecognition;
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'mr-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData({ ...formData, message: formData.message + " " + transcript });
    };
    recognition.start();
  }

  if (user?.role !== 'farmer') return null

  return (
    <div ref={botRef} className="fixed bottom-6 right-6 z-[100] font-outfit">
      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 scale-in-center ${isOpen ? 'bg-red-500 rotate-90' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
        {isOpen ? <X className="text-white" size={28} /> : context.icon}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] bg-white rounded-[32px] shadow-2xl border border-emerald-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 p-6 text-white text-center">
            <h3 className="font-black text-lg flex items-center justify-center gap-2">
              <span className="text-2xl">🤖</span> {context.label}
            </h3>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">तक्रार निवारण कक्ष</p>
          </div>

          <div className="p-6 h-[400px] overflow-y-auto bg-gray-50/50">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-black text-gray-700 mb-4 font-outfit">क्षमस्व! 🙏 नेमकी काय अडचण आली?</p>
                {currentSubjects.map(s => (
                  <button key={s} onClick={() => { setFormData({ ...formData, subject: s }); setStep(2) }}
                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-emerald-500 hover:shadow-md transition text-left">
                    <span className="font-bold text-gray-800 text-sm">{s}</span>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <button onClick={() => setStep(1)} className="text-[10px] font-black text-emerald-600 uppercase mb-2 block hover:underline">← मागे जा</button>
                <p className="text-sm font-black text-gray-700 mb-2 font-outfit">
                  {context.category === 'sugar_factory' ? 'कारखान्याचे नाव:' : 
                   context.category === 'mart' ? 'मार्ट/डिलिव्हरी नाव:' : 'मालकाचे नाव:'}
                </p>
                
                <input 
                  type="text" 
                  placeholder={isMR ? "नाव शोधा..." : "Search name..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 shadow-sm"
                />

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 mt-2">
                  {entities.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                    <button key={e._id} onClick={() => { setFormData({ ...formData, targetId: e._id, targetName: e.name, isOther: false }); setStep(3) }}
                      className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-emerald-500 hover:shadow-md transition text-left group">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm group-hover:text-emerald-700">{e.name}</span>
                        {e.isRecent && (
                          <span className="text-[9px] font-black text-emerald-600 uppercase mt-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 w-fit">
                            {isMR ? 'नुकतेच वापरलेले' : 'Recently Used'}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                  <button onClick={() => { setFormData({ ...formData, isOther: true }); setStep(3) }}
                    className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl hover:bg-emerald-100 transition text-left">
                    <span className="font-bold text-emerald-900 uppercase text-[10px]">यादीत नाव नाही? (Manual)</span>
                    <ChevronRight size={18} className="text-emerald-500" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <button onClick={() => setStep(2)} className="text-[10px] font-black text-emerald-600 uppercase block hover:underline">← मालक बदला</button>
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                    <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest opacity-60">विषय</p>
                    <p className="text-[10px] font-bold text-emerald-900 leading-tight">{formData.subject}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
                    <p className="text-[8px] font-black text-blue-800 uppercase tracking-widest opacity-60">मालक</p>
                    <p className="text-[10px] font-bold text-blue-900 leading-tight truncate">{formData.targetName || 'Manual Entry'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(formData.targetId === 'manual' || formData.isOther) && (
                    <div>
                      <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest block mb-1">मालकाचे नाव <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.targetName} onChange={e => setFormData({ ...formData, targetName: e.target.value, targetId: 'manual' })}
                        placeholder="उदा. सुरेश काळे"
                        className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm text-gray-900" />
                    </div>
                  )}

                  {formData.subject.includes('इतर') && (
                    <div>
                      <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest block mb-1">तक्रारीचा विषय</label>
                      <input type="text" value={formData.subject === 'इतर (Other)' ? '' : formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="विषय लिहा..."
                        className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm text-gray-900" />
                    </div>
                  )}

                  {context.category === 'equipment' && (
                    <div>
                      <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest block mb-1 italic">ड्रायव्हरचे नाव (Optional)</label>
                      <input type="text" value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                        placeholder="उदा. राहुल किंवा अज्ञात"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm text-gray-900" />
                    </div>
                  )}

                  <div className="relative group">
                    <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest block mb-2">तक्रार किती महत्त्वाची आहे? (Priority)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'low', label: 'कमी', sub: 'Low', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600', active: 'bg-blue-600 text-white border-blue-600' },
                        { id: 'medium', label: 'मध्यम', sub: 'Med', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-600', active: 'bg-amber-600 text-white border-amber-600' },
                        { id: 'high', label: 'उच्च', sub: 'High', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600', active: 'bg-red-600 text-white border-red-600' }
                      ].map(p => (
                        <button key={p.id} onClick={() => setFormData({ ...formData, priority: p.id })}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${formData.priority === p.id ? p.active : p.color + ' hover:text-white'}`}>
                          <span className="text-xs font-black">{p.label}</span>
                          <span className="text-[8px] font-bold uppercase opacity-60">{p.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest block mb-1">तुमची तक्रार सविस्तर लिहा</label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                      rows={4} 
                      placeholder="येथे तुमची संपूर्ण अडचण लिहा..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm resize-none pr-12 text-gray-900 shadow-sm" />
                    <button onClick={startVoiceInput} type="button" className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>

          {step === 3 && (
            <div className="p-4 bg-white border-t border-gray-100">
              <button onClick={handleSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                <Send size={18} /> तक्रार पाठवा
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
