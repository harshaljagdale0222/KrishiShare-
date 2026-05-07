import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, Mail, Edit3, Save, X, LogOut, Star, Tractor, Camera, Hash } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useBookingStore from '../store/bookingStore'
import useLanguageStore from '../store/languageStore'
import { maharashtraData } from '../utils/locationData'
import { ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore()
  const { bookings }  = useBookingStore()
  const { t, language } = useLanguageStore()
  const isMR          = language === 'mr'
  const navigate      = useNavigate()

  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({
    name:     user?.name     || '',
    phone:    user?.phone    || '',
    location: user?.location || '',
    email:    user?.email    || '',
    bio:      user?.bio      || '',
    businessName: user?.businessName || user?.factoryName || '',
    district: '',
    taluka:   '',
    village:  '',
    pincode:  '',
  })
  const [isFetchingPin, setIsFetchingPin] = useState(false)
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isOtherVillage, setIsOtherVillage]       = useState(false)

  const handleEdit = () => {
    // Parse existing location if possible: "Village, Taluka, District, Maharashtra - Pincode"
    const loc = user?.location || ''
    const parts = loc.split(', ')
    const pinPart = loc.split(' - ')[1]
    
    setForm(prev => ({
      ...prev,
      village: parts[0] || '',
      taluka:  parts[1] || '',
      district: parts[2] || '',
      pincode:  pinPart || '',
    }))
    setEditing(true)
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

  const handleSave = () => {
    const loc = `${form.village}, ${form.taluka}, ${form.district}, Maharashtra - ${form.pincode}`
    updateUser({ ...user, ...form, location: loc })
    toast.success(t('profileUpdated'))
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    toast.success(t('logoutSuccess'))
    navigate('/login')
  }

  const roleConfig = {
    farmer:   { emoji: '🧑‍🌾', labelKey: 'farmer',          color: 'bg-green-100  text-green-700'  },
    owner:    { emoji: '🚜',   labelKey: 'equipmentOwner',  color: 'bg-blue-100   text-blue-700'   },
    delivery: { emoji: '🛵',   labelKey: 'deliveryPartner', color: 'bg-orange-100 text-orange-700' },
    admin:    { emoji: '👨‍💼', labelKey: 'admin',            color: 'bg-purple-100 text-purple-700' },
  }

  const role = roleConfig[user?.role] || roleConfig.farmer

  const stats = [
    { icon: '🚜', label: t('myBookings'), value: bookings.length,                                       color: 'bg-green-50  text-green-700  border-green-200'  },
    { icon: '✅', label: t('completed'),  value: bookings.filter(b => b.status === 'completed').length,  color: 'bg-blue-50   text-blue-700   border-blue-200'   },
    { icon: '⏳', label: t('pending'),    value: bookings.filter(b => b.status === 'pending').length,    color: 'bg-amber-50  text-amber-700  border-amber-200'  },
    { icon: '❌', label: t('cancelled'),  value: bookings.filter(b => b.status === 'cancelled').length,  color: 'bg-red-50    text-red-700    border-red-200'    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="bg-gradient-to-r from-primary-600 to-green-700 h-24 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-primary-600">
                  {user?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-1 shadow-md">
                  <Camera size={12} />
                </button>
              </div>
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
              {!editing ? (
                <button onClick={handleEdit}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1 transition">
                  <Edit3 size={14} /> {t('editProfileBtn')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave}
                    className="bg-white text-primary-600 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 transition">
                    <Save size={14} /> {t('saveProfile')}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1 transition">
                    <X size={14} /> {t('cancelEdit')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-12 px-6 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-1 inline-block ${role.color}`}>
                  {role.emoji} {t(role.labelKey)}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-amber-700 text-sm">4.8</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                { key: 'name',     icon: User,   label: t('name'),     type: 'text',  placeholder: t('fullName')    },
                { key: 'phone',    icon: Phone,  label: t('phone'),    type: 'tel',   placeholder: '9876543210'     },
                { key: 'email',    icon: Mail,   label: 'Email',       type: 'email', placeholder: 'email@gmail.com'},
              ].map(({ key, icon: Icon, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                  {editing ? (
                    <div className="relative">
                      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={type} value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-primary-300 bg-primary-50 rounded-xl outline-none focus:border-primary-500 text-gray-800 text-sm" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2.5 px-3 bg-gray-50 rounded-xl">
                      <Icon size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm font-medium">{form[key] || '—'}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Special Handling for Location */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{t('location')}</label>
                {editing ? (
                  <div className="space-y-3 bg-primary-50 p-4 rounded-2xl border-2 border-primary-300">
                    <div className="relative">
                      <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" maxLength={6} value={form.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="Pincode"
                        className={`w-full pl-9 pr-4 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary-500 text-sm ${isFetchingPin ? 'bg-amber-50 animate-pulse' : 'bg-white'}`} />
                      {isFetchingPin && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="relative">
                         <select value={form.district} onChange={e => setForm({...form, district: e.target.value, taluka: '', village: ''})}
                           className="w-full px-3 py-2 border border-primary-200 bg-white rounded-xl outline-none text-sm appearance-none focus:border-primary-500">
                           <option value="">{isMR ? 'जिल्हा' : 'District'}</option>
                           {Object.keys(maharashtraData).sort().map(d => <option key={d} value={d}>{maharashtraData[d][language]}</option>)}
                         </select>
                         <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                       </div>
                       <div className="relative">
                         <select value={form.taluka} onChange={e => setForm({...form, taluka: e.target.value, village: ''})} disabled={!form.district}
                           className="w-full px-3 py-2 border border-primary-200 bg-white rounded-xl outline-none text-sm appearance-none focus:border-primary-500 disabled:opacity-50">
                           <option value="">{isMR ? 'तालुका' : 'Taluka'}</option>
                           {form.district && maharashtraData[form.district].talukas.map(t => <option key={t.en} value={t.en}>{t[language]}</option>)}
                         </select>
                         <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                       </div>
                    </div>
                    <div className="relative">
                      {villageSuggestions.length > 0 ? (
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
                          className="w-full px-3 py-2 border border-primary-200 bg-white rounded-xl outline-none text-sm appearance-none focus:border-primary-500">
                          <option value="">{isMR ? 'गाव निवडा' : 'Select Village'}</option>
                          {villageSuggestions.map(v => <option key={v} value={v}>{v}</option>)}
                          <option value="other">{isMR ? '-- दुसरे गाव --' : '-- Other --'}</option>
                        </select>
                      ) : (
                        <input type="text" value={form.village}
                          onChange={e => { setIsOtherVillage(false); setForm({...form, village: e.target.value}); }}
                          placeholder="Village name"
                          className="w-full px-3 py-2 border border-primary-200 bg-white rounded-xl outline-none text-sm focus:border-primary-500" />
                      )}
                      {villageSuggestions.length > 0 && <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
                    </div>
                    {(isOtherVillage || (form.village && !villageSuggestions.includes(form.village) && villageSuggestions.length > 0)) && (
                      <input type="text" autoFocus placeholder={isMR ? "गावाचे नाव टाका..." : "Enter village name..."}
                        value={form.village}
                        onChange={e => setForm({...form, village: e.target.value})}
                        className="w-full px-3 py-2 border border-primary-200 bg-white rounded-xl outline-none text-sm mt-1" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2.5 px-3 bg-gray-50 rounded-xl">
                    <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 text-sm font-medium">{user?.location || '—'}</span>
                  </div>
                )}
              </div>

              {/* Show Business Name for compatible roles */}
              {(user?.role === 'equipment_owner' || user?.role === 'mart_owner' || user?.role === 'factory_owner') && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">🏢 Business/Factory Name</label>
                  {editing ? (
                    <input type="text" value={form.businessName || user?.businessName || user?.factoryName || ''}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-primary-300 bg-primary-50 rounded-xl outline-none focus:border-primary-500 text-gray-800 text-sm" />
                  ) : (
                    <div className="py-2.5 px-3 bg-gray-50 rounded-xl font-bold text-primary-700">
                      {user?.businessName || user?.factoryName || '—'}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">📝 {t('bioLabel')}</label>
                {editing ? (
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder={t('bioPlaceholder')} rows={2}
                    className="w-full px-4 py-2.5 border-2 border-primary-300 bg-primary-50 rounded-xl outline-none focus:border-primary-500 text-gray-800 text-sm resize-none" />
                ) : (
                  <div className="py-2.5 px-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 text-sm italic">{form.bio || t('bioPlaceholder')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tractor size={18} className="text-primary-600" /> {t('bookingStats')}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className={`border rounded-2xl p-3 text-center ${stat.color}`}>
                <div className="text-xl mb-1">{stat.icon}</div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs mt-0.5 opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <h3 className="font-bold text-gray-800 px-5 pt-5 pb-3">⚡ {t('quickLinks')}</h3>
          <div className="divide-y divide-gray-50">
            {[
              { icon: '🚜', label: t('myBookings'),   path: '/my-bookings'   },
              { icon: '📦', label: t('myOrders'),     path: '/orders'        },
              { icon: '🛒', label: t('krishiMart'),   path: '/shop'          },
              { icon: '🏭', label: t('sugarFactory'), path: '/sugar-factory' },
            ].map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Member Since */}
        <div className="bg-gradient-to-r from-primary-600 to-green-700 rounded-2xl p-5 text-white mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-xs">{t('memberSince')}</p>
              <p className="font-bold text-lg mt-0.5">Nov 2024 pasun</p>
              <p className="text-green-200 text-xs mt-1">🌾 {t('verifiedAccount')}</p>
            </div>
            <div className="text-5xl opacity-50">🌾</div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-white border-2 border-primary-200 text-primary-600 hover:bg-primary-50 py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2 mb-3">
          <LogOut size={18} /> {t('logoutBtn')}
        </button>

        {/* Delete Profile */}
        <button onClick={() => {
            const confirm = window.confirm(isMR ? 'तुम्हाला तुमची प्रोफाईल कायमस्वरूपी डिलीट करायची आहे का? हा बदल पुन्हा मागे घेता येणार नाही.' : 'Are you sure you want to permanently delete your profile? This action cannot be undone.')
            if (confirm) {
              const secondConfirm = window.confirm(isMR ? 'मी पुन्हा विचारतोय, सर्व डेटा आणि बुकिंग्ज निघून जातील. पुढे जायचे?' : 'Last warning: All your data and bookings will be lost. Proceed?')
              if (secondConfirm) {
                useAuthStore.getState().deleteAccount().then(success => {
                  if (success) navigate('/login')
                })
              }
            }
          }}
          className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 border border-red-100">
          <X size={18} /> {isMR ? 'प्रोफाईल डिलीट करा' : 'Delete Profile'}
        </button>
      </div>
    </div>
  )
}