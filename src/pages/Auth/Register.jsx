import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import { maharashtraData } from '../../utils/locationData'
import toast from 'react-hot-toast'

const roles = [
  { value: 'farmer', emoji: '🧑‍🌾', labelKey: 'farmerRole', descKey: 'farmerDesc' },
  { value: 'equipment_owner', emoji: '🚜', labelKey: 'ownerRole', descKey: 'ownerDesc' },
  { value: 'mart_owner', emoji: '🛒', labelKey: 'martOwnerRole', descKey: 'martOwnerDesc' },
  { value: 'factory_owner', emoji: '🏭', labelKey: 'factoryOwnerRole', descKey: 'factoryOwnerDesc' },
]

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    district: '', taluka: '', village: '',
    password: '', confirmPassword: '', terms: false,
    businessName: '',
    hasDeliveryService: false,
    pincode: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [roleDropOpen, setRoleDropOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [distOpen, setDistOpen] = useState(false)
  const [talOpen, setTalOpen] = useState(false)
  const [distSearch, setDistSearch] = useState('')
  const [talSearch, setTalSearch] = useState('')
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isOtherVillage, setIsOtherVillage] = useState(false)
  const [isFetchingPin, setIsFetchingPin] = useState(false)

  const { register, loading, isAuthenticated, user: authUser, getDashboardRoute } = useAuthStore()
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardRoute(), { replace: true })
    }
  }, [isAuthenticated, navigate, getDashboardRoute])

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
    if (key === 'district') {
      setForm(prev => ({ ...prev, district: value, taluka: '', village: '' }))
      setDistOpen(false)
      setDistSearch('')
    }
    if (key === 'taluka') {
      setTalOpen(false)
      setTalSearch('')
    }
  }

  const handlePincodeChange = async (val) => {
    const cleanVal = val.replace(/\D/g, '')
    if (cleanVal.length <= 6) {
      update('pincode', cleanVal)
      if (cleanVal.length === 6) {
        setIsFetchingPin(true)
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`)
          const data = await res.json()
          if (data && data[0] && data[0].Status === 'Success') {
            const offices = data[0].PostOffice
            const sample = offices[0]

            const dist = sample.District
            const foundDist = Object.keys(maharashtraData).find(d =>
              dist.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(dist.toLowerCase())
            )

            if (foundDist) {
              const block = sample.Block
              const foundTaluka = maharashtraData[foundDist].talukas.find(t =>
                block.toLowerCase().includes(t.en.toLowerCase()) || t.en.toLowerCase().includes(block.toLowerCase())
              )

              setForm(prev => ({
                ...prev,
                pincode: cleanVal,
                district: foundDist,
                taluka: foundTaluka ? foundTaluka.en : prev.taluka,
                village: prev.village || ''
              }))
              setVillageSuggestions(offices.map(o => o.Name))
              toast.success(language === 'mr' ? 'पिनकोडनुसार माहिती मिळवली!' : 'Location loaded!')
            }
          } else {
            toast.error(language === 'mr' ? 'चुकीचा पिनकोड!' : 'Invalid Pincode!')
          }
        } catch {
          toast.error(language === 'mr' ? 'नेटवर्क एरर!' : 'Network error!')
        } finally {
          setIsFetchingPin(false)
        }
      }
    }
  }

  const validate = () => {
    const e = {}
    const isMR = language === 'mr'

    // EVERY field is now mandatory
    if (!form.fullName.trim()) e.fullName = isMR ? 'संपूर्ण नाव आवश्यक आहे' : 'Full Name is required'
    if (!form.phone.trim()) e.phone = isMR ? 'फोन नंबर आवश्यक आहे' : 'Phone number is required'
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = isMR ? 'योग्य नंबर टाका' : 'Enter valid phone'
    if (!form.email.trim()) e.email = isMR ? 'ईमेल आवश्यक आहे' : 'Email is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = isMR ? 'योग्य ईमेल टाका' : 'Enter valid email'

    if (!selectedRole) e.role = isMR ? 'भूमिका निवडा' : 'Role is required'

    if (selectedRole && selectedRole !== 'farmer' && !form.businessName.trim()) {
      e.businessName = isMR ? 'नाव आवश्यक आहे' : 'Business Name is required'
    }

    if (selectedRole === 'mart_owner' && !form.hasDeliveryService) {
      e.delivery = isMR ? 'डिलिव्हरी सेवा असणे आवश्यक आहे!' : 'Mandatory: Delivery service required!'
    }

    if (!form.district) e.district = isMR ? 'जिल्हा निवडा' : 'District is required'
    if (!form.taluka) e.taluka = isMR ? 'तालुका निवडा' : 'Taluka is required'
    if (!form.village.trim()) e.village = isMR ? 'गाव आवश्यक आहे' : 'Village is required'
    if (!form.pincode.trim()) e.pincode = isMR ? 'पिनकोड आवश्यक आहे' : 'Pincode is required'
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = isMR ? 'योग्य ६ अंकी पिनकोड टाका' : 'Enter valid 6-digit pincode'

    if (form.password.length < 6) e.password = isMR ? 'किमान ६ अक्षरे' : 'Min 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = isMR ? 'पासवर्ड जुळत नाही' : 'Passwords do not match'
    if (!form.terms) e.terms = isMR ? 'अटी मान्य करा' : 'Please accept terms'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const d = maharashtraData[form.district]
    const tData = d.talukas.find(x => x.en === form.taluka)
    const loc = `${form.village}, ${tData?.en || ''}, ${d.en}, Maharashtra`

    const res = await register({
      name: form.fullName, email: form.email, phone: form.phone,
      password: form.password, role: selectedRole, location: loc,
      pincode: form.pincode,
      businessName: form.businessName, hasDeliveryService: form.hasDeliveryService
    })

    if (res.success) {
      const userRole = res.role || res.user?.role
      if (['equipment_owner', 'mart_owner', 'factory_owner'].includes(userRole)) {
        navigate('/store-dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }

  const isMR = language === 'mr'
  const selectedRoleData = roles.find(r => r.value === selectedRole)
  const districtKeys = Object.keys(maharashtraData).filter(k => {
    const dName = maharashtraData[k][language] || maharashtraData[k].mr || maharashtraData[k].en
    return dName.toLowerCase().includes(distSearch.toLowerCase()) ||
      maharashtraData[k].en.toLowerCase().includes(distSearch.toLowerCase())
  }).sort()

  const talukaList = form.district ? maharashtraData[form.district].talukas.filter(t => {
    const tName = t[language] || t.mr || t.en
    return tName.toLowerCase().includes(talSearch.toLowerCase()) ||
      t.en.toLowerCase().includes(talSearch.toLowerCase())
  }).sort((a, b) => {
    const aName = a[language] || a.mr || a.en
    const bName = b[language] || b.mr || b.en
    return aName.localeCompare(bName)
  }) : []

  const label = (txt, errKey) => (
    <div className="flex justify-between items-center ml-1">
      <label className="text-[13px] font-bold text-emerald-900">{txt}</label>
      {errors[errKey] && <span className="text-[10px] font-bold text-red-500 uppercase">{errors[errKey]}</span>}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 bg-emerald-900" /> {/* Fallback color */}
      <img src="/assets/full_auth_bg.png" alt="Farm" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px]" />

      <div className="w-full max-w-[580px] relative z-10 animate-in fade-in zoom-in duration-500 py-10">
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-emerald-100">

          <div className="pt-12 pb-8 px-10 text-center bg-emerald-50/30 border-b border-emerald-100">
            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-xl shadow-emerald-500/30">🌾</div>
            <h1 className="text-4xl font-bold text-emerald-900 tracking-tight">KrishiShare</h1>
            <p className="text-emerald-600/60 font-black text-[11px] uppercase tracking-[0.25em] mt-2">{isMR ? 'आजच मोफत खाते तयार करा!' : 'Create Free Account Today!'}</p>
          </div>

          <div className="p-10 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* STAGE 1: IDENTITY */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <p className="text-[13px] font-black text-emerald-600 uppercase tracking-widest">01 — Identity</p>
                </div>

                <div className="space-y-2">
                  {label(isMR ? 'तुम्ही कोण आहात? *' : 'Who are you? *', 'role')}
                  <div className="relative">
                    <button type="button" onClick={() => setRoleDropOpen(!roleDropOpen)}
                      className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex items-center justify-between font-bold text-sm transition-all
                        ${errors.role ? 'border-red-500 bg-red-50' : selectedRole ? 'border-emerald-600 bg-emerald-50/50' : 'border-emerald-100 bg-slate-50'}`}>
                      {selectedRoleData ? <span className="flex items-center gap-3"><span>{selectedRoleData.emoji}</span> {t(selectedRoleData.labelKey)}</span> : 'Select Role...'}
                      <ChevronDown size={20} className={`text-emerald-300 transition-transform ${roleDropOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                    </button>
                    {roleDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-emerald-200 rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-emerald-50 animate-in slide-in-from-top-2">
                        {roles.map(r => (
                          <button key={r.value} type="button" onClick={() => {
                            setSelectedRole(r.value);
                            setRoleDropOpen(false);
                            if (r.value === 'mart_owner') update('hasDeliveryService', true);
                            else update('hasDeliveryService', false);
                          }}
                            className="w-full flex items-center gap-4 px-7 py-5 text-left hover:bg-emerald-50 transition-colors">
                            <span className="text-3xl">{r.emoji}</span>
                            <div>
                              <p className="font-bold text-base text-emerald-950">{t(r.labelKey)}</p>
                              <p className="text-[11px] text-emerald-600/60 font-bold uppercase tracking-wider">{t(r.descKey)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedRole && selectedRole !== 'farmer' && (
                  <div className="space-y-6 animate-in slide-in-from-top-4">
                    <div className="space-y-2">
                      {label(
                        selectedRole === 'mart_owner' ? (isMR ? 'दुकानाचे नाव *' : 'Store Name *') :
                          selectedRole === 'equipment_owner' ? (isMR ? 'एजन्सी / केंद्राचे नाव *' : 'Agency Name *') :
                            selectedRole === 'factory_owner' ? (isMR ? 'फॅक्टरी / उद्योगाचे नाव *' : 'Factory Name *') :
                              (isMR ? 'नाव *' : 'Business Name *'),
                        'businessName'
                      )}
                      <input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)}
                        placeholder={selectedRole === 'equipment_owner' ? (isMR ? "उदा. जय मल्हार ॲग्रो" : "e.g. Jai Malhar Agro") : ""}
                        className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold text-sm
                          ${errors.businessName ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                    </div>

                    {selectedRole === 'mart_owner' && (
                      <div className={`p-6 rounded-3xl border-2 transition-all ${form.hasDeliveryService ? 'border-emerald-600 bg-emerald-50/50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black text-emerald-950">{isMR ? 'डिलिव्हरी सेवा (अनिवार्य)' : 'Delivery Service (Mandatory)'}</p>
                            <p className="text-[11px] text-emerald-600/60 font-black uppercase">{isMR ? 'विक्रेत्यासाठी डिलिव्हरी सेवा असणे आवश्यक आहे' : 'Required for mart owners to process orders'}</p>
                          </div>
                          <button type="button" onClick={() => update('hasDeliveryService', !form.hasDeliveryService)}
                            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${form.hasDeliveryService ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${form.hasDeliveryService ? 'left-8' : 'left-1'}`} />
                          </button>
                        </div>
                        {errors.delivery && <p className="text-red-600 text-[10px] font-black mt-3 uppercase tracking-wider">{errors.delivery}</p>}
                        {!form.hasDeliveryService && selectedRole === 'mart_owner' && (
                          <div className="mt-3 p-3 bg-red-100 rounded-xl border border-red-200">
                            <p className="text-[10px] text-red-700 font-bold leading-tight">
                              {isMR ? 'डिलिव्हरी सेवेशिवाय तुम्ही मार्ट चालवू शकणार नाही. कारण ऑर्डर्स पोहोचवण्यासाठी याची गरज आहे.' : 'You cannot operate a Mart without delivery service as it is needed to fulfill orders.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STAGE 2: DETAILS */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <p className="text-[13px] font-black text-emerald-600 uppercase tracking-widest">02 — Details</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    {label(
                      ['equipment_owner', 'mart_owner', 'factory_owner'].includes(selectedRole)
                        ? (isMR ? 'मालकाचे संपूर्ण नाव *' : 'Owner Full Name *')
                        : (isMR ? 'संपूर्ण नाव *' : 'Full Name *'),
                      'fullName'
                    )}
                    <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                      placeholder={isMR ? "तुमचे नाव..." : "Your name..."}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm
                        ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                  </div>
                  <div className="space-y-2">
                    {label(isMR ? 'फोन नंबर *' : 'Phone *', 'phone')}
                    <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm
                        ${errors.phone ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  {label(isMR ? 'ईमेल *' : 'Email *', 'email')}
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm
                      ${errors.email ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                </div>
              </div>

              {/* STAGE 3: LOCATION */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <p className="text-[13px] font-black text-emerald-600 uppercase tracking-widest">03 — Location</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2 relative">
                    {label(isMR ? 'पिनकोड *' : 'Pincode *', 'pincode')}
                    <input type="text" value={form.pincode} onChange={e => handlePincodeChange(e.target.value)} maxLength={6}
                      className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all
                        ${errors.pincode ? 'border-red-500 bg-red-50' : isFetchingPin ? 'border-amber-400 bg-amber-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                    {isFetchingPin && (
                      <div className="absolute right-4 top-11">
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2 relative">
                      {label(isMR ? 'जिल्हा *' : 'District *', 'district')}
                      <button type="button" onClick={() => { setDistOpen(!distOpen); setTalOpen(false) }}
                        className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex justify-between items-center font-bold text-sm transition-all
                          ${errors.district ? 'border-red-500 bg-red-50' : form.district ? 'border-emerald-600 bg-emerald-50/50' : 'border-emerald-100 bg-slate-50'}`}>
                        <span className="truncate">{form.district ? (maharashtraData[form.district][language] || maharashtraData[form.district].mr) : 'Select'}</span>
                        <ChevronDown size={18} className="text-emerald-300" />
                      </button>
                      {distOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-emerald-200 rounded-3xl shadow-2xl z-[70] overflow-hidden max-h-56 flex flex-col w-[130%]">
                          <input autoFocus type="text" placeholder="Search District..." value={distSearch} onChange={e => setDistSearch(e.target.value)}
                            className="p-5 text-sm border-b border-emerald-100 outline-none font-bold placeholder:text-emerald-200" />
                          <div className="overflow-y-auto flex-1">
                            {districtKeys.map(k => <button key={k} type="button" onClick={() => update('district', k)} className="w-full text-left px-7 py-4 text-sm font-bold hover:bg-emerald-50 text-emerald-950 transition-colors border-b border-emerald-50 last:border-0">{maharashtraData[k][language] || maharashtraData[k].mr}</button>)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 relative">
                      {label(isMR ? 'तालुका *' : 'Taluka *', 'taluka')}
                      <button type="button" disabled={!form.district} onClick={() => { setTalOpen(!talOpen); setDistOpen(false) }}
                        className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex justify-between items-center font-bold text-sm transition-all disabled:opacity-40
                          ${errors.taluka ? 'border-red-500 bg-red-50' : form.taluka ? 'border-emerald-600 bg-emerald-50/50' : 'border-emerald-100 bg-slate-50'}`}>
                        <span className="truncate">{form.taluka ? (maharashtraData[form.district].talukas.find(t => t.en === form.taluka)?.[language] || maharashtraData[form.district].talukas.find(t => t.en === form.taluka)?.mr) : 'Select'}</span>
                        <ChevronDown size={18} className="text-emerald-300" />
                      </button>
                      {talOpen && (
                        <div className="absolute bottom-full right-0 mb-3 bg-white border border-emerald-200 rounded-3xl shadow-2xl z-[70] overflow-hidden max-h-56 flex flex-col w-[130%]">
                          <input autoFocus type="text" placeholder="Search Taluka..." value={talSearch} onChange={e => setTalSearch(e.target.value)}
                            className="p-5 text-sm border-b border-emerald-100 outline-none font-bold placeholder:text-emerald-200" />
                          <div className="overflow-y-auto flex-1">
                            {talukaList.map(t => <button key={t.en} type="button" onClick={() => update('taluka', t.en)} className="w-full text-left px-7 py-4 text-sm font-bold hover:bg-emerald-50 text-emerald-950 transition-colors border-b border-emerald-50 last:border-0">{t[language] || t.mr}</button>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {label(isMR ? 'गाव *' : 'Village *', 'village')}
                    <div className="relative">
                      {villageSuggestions.length > 0 ? (
                        <select value={isOtherVillage ? 'other' : (villageSuggestions.includes(form.village) ? form.village : '')}
                          onChange={e => {
                            if (e.target.value === 'other') {
                              setIsOtherVillage(true);
                              update('village', '');
                            } else {
                              setIsOtherVillage(false);
                              update('village', e.target.value);
                            }
                          }}
                          className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm appearance-none
                            ${errors.village ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`}>
                          <option value="">{isMR ? 'गाव निवडा...' : 'Select Village...'}</option>
                          {villageSuggestions.map(v => <option key={v} value={v}>{v}</option>)}
                          <option value="other">{isMR ? '-- दुसरे गाव --' : '-- Other --'}</option>
                        </select>
                      ) : (
                        <input type="text" value={form.village} onChange={e => { setIsOtherVillage(false); update('village', e.target.value); }}
                          className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm
                            ${errors.village ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                      )}
                      {villageSuggestions.length > 0 && <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
                    </div>
                    {(isOtherVillage || (form.village && !villageSuggestions.includes(form.village) && villageSuggestions.length > 0)) && (
                      <input type="text" autoFocus placeholder={isMR ? "गावाचे नाव टाका..." : "Enter village name..."}
                        value={form.village}
                        onChange={e => update('village', e.target.value)}
                        className="w-full px-6 py-3 rounded-xl border border-emerald-100 bg-white font-bold text-xs mt-2 outline-none focus:border-emerald-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* STAGE 4: SECURITY */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <p className="text-[13px] font-black text-emerald-600 uppercase tracking-widest">04 — Security</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    {label(isMR ? 'पासवर्ड *' : 'Password *', 'password')}
                    <div className="relative group">
                      <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                        className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm pr-14
                          ${errors.password ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600 focus:bg-white'}`} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {label(isMR ? 'पासवर्डची पुष्टी करा *' : 'Confirm Password *', 'confirmPassword')}
                    <div className="relative group">
                      <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                        className={`w-full px-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm pr-14
                          ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600 focus:bg-white'}`} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border-2 transition-all ${errors.terms ? 'border-red-500 bg-red-50' : 'border-emerald-50 bg-emerald-50/20'}`}>
                  <label htmlFor="terms" className="flex items-start gap-4 cursor-pointer">
                    <input type="checkbox" id="terms" checked={form.terms} onChange={e => update('terms', e.target.checked)}
                      className="mt-1 w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer" />
                    <span className="text-[11px] text-emerald-950 font-bold leading-relaxed">{t('terms')}</span>
                  </label>
                  {errors.terms && <p className="text-red-600 text-[10px] font-black mt-2 uppercase tracking-wide">{errors.terms}</p>}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-6 rounded-[24px] font-black text-base uppercase tracking-widest transition-all shadow-2xl shadow-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-4">
                {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : (
                  <>
                    <span>{isMR ? 'खाते तयार करा' : 'Create My Account'}</span>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center -rotate-90">
                      <ChevronDown size={14} />
                    </div>
                  </>
                )}
              </button>
            </form>

            <p className="mt-12 text-center text-emerald-800/60 font-bold text-sm">
              {t('alreadyAccount')}{' '}
              <Link to="/login" className="text-emerald-600 hover:underline font-black">{t('loginHere')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}