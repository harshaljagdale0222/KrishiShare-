import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, Smartphone, User, Hash, Lock, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import { maharashtraData } from '../../utils/locationData'
import toast from 'react-hot-toast'

const roles = [
  { value: 'farmer', emoji: '🧑‍🌾', labelKey: 'farmerRole' },
  { value: 'equipment_owner', emoji: '🚜', labelKey: 'ownerRole' },
  { value: 'mart_owner', emoji: '🛒', labelKey: 'martOwnerRole' },
  { value: 'factory_owner', emoji: '🏭', labelKey: 'factoryOwnerRole' },
  { value: 'admin', emoji: '🛡️', labelKey: 'Admin' },
]

export default function CompleteProfile() {
  const { user, token, isAuthenticated, updateUser, logout } = useAuthStore()
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()
  const isMR = language === 'mr'
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    role: user?.role || '',
    district: '',
    taluka: '',
    village: '',
    businessName: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    hasDeliveryService: true
  })
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isOtherVillage, setIsOtherVillage] = useState(false)
  const [isFetchingPin, setIsFetchingPin] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [distOpen, setDistOpen] = useState(false)
  const [talOpen, setTalOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [distSearch, setDistSearch] = useState('')
  const [talSearch, setTalSearch] = useState('')

  useEffect(() => {
    // If we're definitely not authenticated, go to login
    if (!isAuthenticated && !token) {
      navigate('/login')
      return
    }

    // If profile is already complete, go to dashboard
    if (user?.role && user?.phone && user?.location) {
      navigate(user.role === 'farmer' ? '/dashboard' : '/store-dashboard')
    }
  }, [user, isAuthenticated, token])

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
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
                taluka: foundTaluka ? foundTaluka.en : '',
                village: ''
              }))
              setVillageSuggestions(offices.map(o => o.Name))
              toast.success(isMR ? 'पिनकोडनुसार माहिती मिळवली!' : 'Location loaded!')
            }
          } else {
            toast.error(isMR ? 'चुकीचा पिनकोड!' : 'Invalid Pincode!')
          }
        } catch {
          toast.error(isMR ? 'नेटवर्क एरर!' : 'Network error!')
        } finally {
          setIsFetchingPin(false)
        }
      }
    }
  }

  const villages = villageSuggestions.length > 0 ? villageSuggestions : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, phone, role, district, taluka, village, pincode, businessName, hasDeliveryService, password, confirmPassword } = form
    console.log('--- 📤 SUBMITTING PROFILE UPDATE ---');
    console.log('ROLE SELECTED:', role);
    console.log('NAME:', name);

    if (!name || !phone || !district || !taluka || !village || !pincode || !password) {
      return toast.error(isMR ? 'सर्व माहिती आणि पासवर्ड भरणे आवश्यक आहे' : 'All fields and password are mandatory')
    }

    if (password !== confirmPassword) {
      return toast.error(isMR ? 'पासवर्ड मॅच होत नाहीत!' : 'Passwords do not match!')
    }

    if (password.length < 6) {
      return toast.error(isMR ? 'पासवर्ड किमान ६ अंकी असावा' : 'Password must be at least 6 characters')
    }

    if (role === 'mart_owner' && !hasDeliveryService) {
      return toast.error(isMR ? 'डिलिव्हरी सुविधा असल्याशिवाय तुम्ही मार्ट ओनर म्हणून नोंदणी करू शकत नाही' : 'You must have delivery service to register as Mart Owner')
    }

    if (['equipment_owner', 'mart_owner', 'factory_owner'].includes(role) && !businessName) {
      return toast.error(isMR ? 'व्यवसायाचे नाव भरणे आवश्यक आहे' : 'Business name is required')
    }

    const d = maharashtraData[district]
    const tData = d.talukas.find(x => x.en === taluka)
    const loc = `${village}, ${tData?.en || ''}, ${d.en}, Maharashtra - ${pincode}`

    try {
      await updateUser({
        name,
        phone,
        role,
        location: loc,
        businessName: role !== 'farmer' ? businessName : undefined,
        hasDeliveryService: role === 'mart_owner' ? hasDeliveryService : undefined,
        password
      })
      toast.success(isMR ? 'प्रोफाईल यशस्वीपणे पूर्ण झाली! 🎉' : 'Profile completed successfully!')
      navigate(role === 'farmer' ? '/dashboard' : '/store-dashboard')
    } catch (err) {
      console.error('Update Profile Error:', err)
      toast.error(err.response?.data?.message || 'Failed to update profile')
    }
  }

  const districtKeys = Object.keys(maharashtraData).filter(k => {
    const dName = maharashtraData[k][language] || maharashtraData[k].mr || maharashtraData[k].en
    return dName.toLowerCase().includes(distSearch.toLowerCase()) ||
           maharashtraData[k].en.toLowerCase().includes(distSearch.toLowerCase())
  }).sort()
  
  const talukaList = form.district ? maharashtraData[form.district].talukas.filter(t => {
    const tName = t[language] || t.mr || t.en
    return tName.toLowerCase().includes(talSearch.toLowerCase()) ||
           t.en.toLowerCase().includes(talSearch.toLowerCase())
  }).sort((a,b) => {
    const aName = a[language] || a.mr || a.en
    const bName = b[language] || b.mr || b.en
    return aName.localeCompare(bName)
  }) : []

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      <img src="/assets/full_auth_bg.png" alt="Farm" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-[3px]" />

      <div className="w-full max-w-[500px] relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-emerald-100">

          <div className="p-8 text-center bg-emerald-50/50 border-b border-emerald-100">
            <h2 className="text-2xl font-black text-emerald-900">{isMR ? 'प्रोफाईल पूर्ण करा' : 'Complete Profile'}</h2>
            <p className="text-emerald-600 font-bold text-xs mt-1 uppercase tracking-widest">{isMR ? 'आम्हाला थोडी अधिक माहिती हवी आहे' : 'We need a little more info'}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'तुमची भूमिका' : 'Your Role'}</label>
              <div className="relative">
                <button type="button" onClick={() => setRoleOpen(!roleOpen)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex justify-between items-center font-bold text-sm transition-all
                    ${!form.role ? 'border-amber-400 bg-amber-50 shadow-md animate-pulse' : 'border-emerald-100 bg-slate-50'}`}>
                  <span className="flex items-center gap-3">
                    {form.role ? (
                      <>
                        <span>{roles.find(r => r.value === form.role)?.emoji}</span>
                        {t(roles.find(r => r.value === form.role)?.labelKey)}
                      </>
                    ) : (
                      <span className="text-amber-700">{isMR ? '⚠️ तुमची भूमिका निवडा...' : '⚠️ Select your role...'}</span>
                    )}
                  </span>
                  <ChevronDown size={18} className={`text-emerald-300 transition-transform ${roleOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                {roleOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-emerald-100 rounded-3xl shadow-xl z-50 overflow-hidden divide-y divide-emerald-50">
                    {roles
                      .filter(r => user?.email === 'harshaljagdale40@gmail.com' ? r.value === 'admin' : r.value !== 'admin')
                      .map(r => (
                        <button key={r.value} type="button" onClick={() => { 
                          update('role', r.value); 
                          setRoleOpen(false);
                          if (r.value === 'mart_owner') update('hasDeliveryService', true);
                        }} className="w-full text-left px-6 py-4 text-sm font-bold hover:bg-emerald-50 transition-colors flex items-center gap-3">
                          <span>{r.emoji}</span> {t(r.labelKey)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {['equipment_owner', 'mart_owner', 'factory_owner'].includes(form.role) && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'व्यवसायाचे नाव' : 'Business Name'} <span className="text-red-500">*</span></label>
                  <input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder={isMR ? "उदा. महालक्ष्मी कृषी केंद्र" : "e.g. Mahalakshmi Krishi Kendra"}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
                </div>

                {form.role === 'mart_owner' && (
                  <div className={`p-5 rounded-2xl border-2 transition-all ${form.hasDeliveryService ? 'border-emerald-100 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3">
                      {isMR ? 'डिव्हरी सेवा (अनिवार्य)' : 'Delivery Service (Mandatory)'} <span className="text-red-500">*</span>
                    </p>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => update('hasDeliveryService', true)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${form.hasDeliveryService ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                        {isMR ? 'हो' : 'Yes'}
                      </button>
                      <button type="button" onClick={() => update('hasDeliveryService', false)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!form.hasDeliveryService ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-emerald-100'}`}>
                        {isMR ? 'नाही' : 'No'}
                      </button>
                    </div>
                    {!form.hasDeliveryService && (
                      <div className="mt-2 p-2 bg-red-100 rounded-lg border border-red-200">
                        <p className="text-[9px] text-red-600 font-black uppercase leading-tight">
                          ⚠️ {isMR ? 'डिलिव्हरी सेवेशिवाय मार्ट चालवू शकणार नाही' : 'Delivery service is required to process orders'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'संपूर्ण नाव' : 'Full Name'} <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-300" />
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'पासवर्ड' : 'Password'} <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="******"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600 p-1">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'पुन्हा टाका' : 'Confirm'} <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" />
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="******"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600 p-1">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'फोन नंबर' : 'Phone Number'} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-300" />
                <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="98XXXXXXXX"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-emerald-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <p className="text-[13px] font-black text-emerald-800 uppercase tracking-widest">{isMR ? 'पत्ता' : 'Location'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'पिनकोड' : 'Pincode'} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Hash size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-300" />
                  <input type="text" maxLength={6} value={form.pincode} onChange={e => handlePincodeChange(e.target.value)} placeholder="4XXXXX"
                    className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all
                      ${isFetchingPin ? 'border-amber-400 bg-amber-50' : 'border-emerald-100 bg-slate-50 focus:border-emerald-600'}`} />
                  {isFetchingPin && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'जिल्हा' : 'District'} <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setDistOpen(!distOpen)} className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 text-left flex justify-between items-center font-bold text-sm">
                  <span className="truncate">{form.district ? (maharashtraData[form.district][language] || maharashtraData[form.district].mr) : 'Select'}</span>
                  <ChevronDown size={14} className="text-emerald-300" />
                </button>
                {distOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-emerald-100 rounded-2xl shadow-xl z-[70] overflow-hidden max-h-48 flex flex-col w-[150%]">
                    <input autoFocus type="text" placeholder="Search..." value={distSearch} onChange={e => setDistSearch(e.target.value)} className="p-4 text-xs border-b outline-none font-bold" />
                    <div className="overflow-y-auto">
                      {districtKeys.map(k => <button key={k} type="button" onClick={() => update('district', k)} className="w-full text-left px-5 py-3 text-xs font-bold hover:bg-emerald-50">{maharashtraData[k][language] || maharashtraData[k].mr}</button>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'तालुका' : 'Taluka'} <span className="text-red-500">*</span></label>
                <button type="button" disabled={!form.district} onClick={() => setTalOpen(!talOpen)} className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 text-left flex justify-between items-center font-bold text-sm disabled:opacity-50">
                  <span className="truncate">{form.taluka ? (maharashtraData[form.district].talukas.find(t => t.en === form.taluka)?.[language] || maharashtraData[form.district].talukas.find(t => t.en === form.taluka)?.mr) : 'Select'}</span>
                  <ChevronDown size={14} className="text-emerald-300" />
                </button>
                {talOpen && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white border border-emerald-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 flex flex-col w-[150%]">
                    <input autoFocus type="text" placeholder="Search..." value={talSearch} onChange={e => setTalSearch(e.target.value)} className="p-4 text-xs border-b outline-none font-bold" />
                    <div className="overflow-y-auto">
                      {talukaList.map(t => <button key={t.en} type="button" onClick={() => update('taluka', t.en)} className="w-full text-left px-5 py-3 text-xs font-bold hover:bg-emerald-50">{t[language] || t.mr}</button>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-800 ml-1 uppercase">{isMR ? 'गाव' : 'Village'} <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-300" />
                {villages.length > 0 ? (
                  <select value={isOtherVillage ? 'other' : (villages.includes(form.village) ? form.village : '')}
                    onChange={e => {
                      if (e.target.value === 'other') {
                        setIsOtherVillage(true);
                        update('village', '');
                      } else {
                        setIsOtherVillage(false);
                        update('village', e.target.value);
                      }
                    }}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm appearance-none">
                    <option value="">{isMR ? 'गाव निवडा...' : 'Select Village...'}</option>
                    {villages.map(v => <option key={v} value={v}>{v}</option>)}
                    <option value="other">{isMR ? '-- दुसरे गाव --' : '-- Other --'}</option>
                  </select>
                ) : (
                  <input type="text" value={form.village} onChange={e => { setIsOtherVillage(false); update('village', e.target.value); }} placeholder="Village name..."
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold text-sm" />
                )}
                {villages.length > 0 && (
                  <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
                )}
              </div>
              {(isOtherVillage || (form.village && !villages.includes(form.village) && villages.length > 0)) && (
                <input type="text" autoFocus placeholder={isMR ? "तुमच्या गावाचे नाव टाका..." : "Enter village name..."}
                  value={form.village}
                  onChange={e => update('village', e.target.value)}
                  className="w-full px-6 py-3 rounded-xl border border-emerald-100 bg-white font-bold text-xs mt-2 outline-none focus:border-emerald-600" />
              )}
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
              {isMR ? 'माहिती सेव्ह करा' : 'Save Details & Continue'}
            </button>
            <button type="button" onClick={() => logout()} className="w-full text-center text-xs font-black text-emerald-800/40 uppercase tracking-widest hover:text-red-500 transition-colors mt-2">
              {isMR ? 'बाहेर पडा' : 'Logout & Try Later'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
