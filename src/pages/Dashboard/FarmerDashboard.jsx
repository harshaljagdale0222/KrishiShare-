import { Link } from 'react-router-dom'
import { MapPin, Phone, Bell, Edit, Sprout, Star, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import useOrderStore from '../../store/orderStore'
import useBookingStore from '../../store/bookingStore'
import WeatherCard    from '../../components/dashboard/WeatherCard'
import QuickStats     from '../../components/dashboard/QuickStats'
import RecentActivity from '../../components/dashboard/RecentActivity'
import NotificationDropdown from '../../components/common/NotificationDropdown'

const getQuickActions = (t) => [
  { icon:'🚜', label: t('bookEquipment'),  desc: t('feat1Desc'), link:'/book-equipment', color:'from-green-500  to-emerald-600' },
  { icon:'🛒', label: t('krishiMart'),      desc: t('feat2Desc'), link:'/shop',           color:'from-orange-500 to-amber-600'   },
  { icon:'🏭', label: t('sugarFactory'),    desc: t('sugarFactoryTitle'), link:'/sugar-factory', color:'from-blue-500   to-indigo-600'  },
  { icon:'🏛️', label: t('sarkariYojana') || 'Government Schemes', desc:'PM Kisan, Bima...', link:'/schemes', color:'from-purple-500 to-violet-600'  },
]

const getCropTips = (t, language) => {
  if (language === 'mr') return [
    { emoji:'💧', tip:'आज शेतात ठिबक सिंचन तपासा — पाणी बचत होईल.' },
    { emoji:'🌿', tip:'रब्बी हंगामात गहू पिकाला योग्य वेळी खते द्या.' },
    { emoji:'🐛', tip:'कीड तपासा — वेळेवर नियंत्रण केल्यास नुकसान टळेल.' },
    { emoji:'🌡️', tip:'तापमान वाढले आहे — दुपारच्या वेळी पाणी देऊ नका.' },
  ]
  if (language === 'hi') return [
    { emoji:'💧', tip:'आज खेत में ड्रिप सिंचाई की जाँच करें — पानी बचाएं।' },
    { emoji:'🌿', tip:'रबी सीजन में गेहूं की फसल को समय पर खाद दें।' },
    { emoji:'🐛', tip:'कीटों की जाँच करें — समय पर पता चलने से नुकसान कम होगा।' },
    { emoji:'🌡️', tip:'तापमान अधिक है — दोपहर में सिंचाई न करें।' },
  ]
  return [
    { emoji:'💧', tip:'Check drip irrigation today — reduce water wastage.' },
    { emoji:'🌿', tip:'Apply nitrogen fertilizer to wheat in the Rabi season.' },
    { emoji:'🐛', tip:'Check for pests — early detection prevents loss.' },
    { emoji:'🌡️', tip:'Temperature is high — avoid watering during afternoon.' },
  ]
}

export default function FarmerDashboard() {
  const { user } = useAuthStore()
  const { t, language } = useLanguageStore()
  const { fetchAllOrders } = useOrderStore()
  const { fetchAllBookings } = useBookingStore()
  const [activeTip, setActiveTip] = useState(0)

  useEffect(() => {
    fetchAllOrders()
    fetchAllBookings()
  }, [])

  const quickActions = getQuickActions(t)
  const cropTips     = getCropTips(t, language)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('goodMorning')
    if (h < 17) return t('goodAfternoon')
    return t('goodEvening')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafafa]">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-10 scale-110 blur-xl"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <Link to="/profile" className="relative group">
            <div className="relative">
              <div className="flex items-center gap-3 text-primary-600 font-bold uppercase tracking-[0.25em] text-[11px] mb-2">
                <span className="w-10 h-[2px] bg-primary-600/30 rounded-full" />
                {greeting()}
              </div>
              
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 leading-none tracking-tight">
                  {user?.name?.split(' ')[0] || (language === 'mr' ? 'शेतकरी' : 'Farmer')} 
                  <span className="text-primary-600 ml-2">दादा!</span>
                </h1>
                <span className="text-3xl animate-bounce-slow">👋</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-100 px-4 py-2 rounded-2xl text-[12px] font-bold text-gray-600 shadow-sm hover:border-primary-200 transition-colors">
                  <MapPin size={14} className="text-primary-500" /> {user?.location || 'Maharashtra'}
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-100 px-4 py-2 rounded-2xl text-[12px] font-bold text-gray-600 shadow-sm hover:border-green-400 transition-colors">
                  <Phone size={14} className="text-green-500" /> {user?.phone || '—'}
                </div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <NotificationDropdown />
            <Link to="/profile" className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-2.5 pr-8 flex items-center gap-4 hover:shadow-2xl hover:shadow-primary-100 transition-all duration-500 group">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-green-600 rounded-[22px] flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                {user?.name?.[0] || 'S'}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg leading-none mb-1.5 group-hover:text-primary-600 transition">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest">{t(user?.role) || user?.role}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* --- Main Dashboard Content --- */}
        <div className="space-y-10">
          
          {/* Stats Section with Glass Effect */}
          <div className="relative">
            <div className="absolute -left-10 top-0 w-64 h-64 bg-primary-200/30 rounded-full blur-[100px] -z-10" />
            <QuickStats />
          </div>

          {/* Quick Actions Grid - Elevated Design */}
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-gray-900 text-2xl tracking-tighter">⚡ {t('quickActions')}</h2>
              <div className="h-[2px] flex-1 mx-6 bg-gradient-to-r from-gray-100 to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.link}
                  className={`group relative bg-gradient-to-br ${action.color} rounded-[32px] p-6 overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:scale-110 transition-transform">
                      {action.icon}
                    </div>
                    <p className="font-black text-white text-lg leading-tight tracking-tight">{action.label}</p>
                    <p className="text-white/70 text-[11px] mt-1 font-medium uppercase tracking-wider">{action.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-white/40 uppercase group-hover:text-white transition-colors">
                      Open <ChevronRight size={12} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Secondary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            
            {/* Left Column: Contextual Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="hover:scale-[1.02] transition-transform duration-500">
                <WeatherCard />
              </div>

              {/* Advice Card - Premium Glass */}
              <div className="bg-white/60 backdrop-blur-2xl rounded-[40px] border border-white shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-3 tracking-tighter">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Sprout size={20} className="text-green-600" />
                    </div>
                    {t('farmingAdvice')}
                  </h3>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Daily</div>
                </div>
                <div className="space-y-3">
                  {cropTips.map((tip, i) => (
                    <div key={i} onClick={() => setActiveTip(i)}
                      className={`group flex gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300
                        ${activeTip === i
                          ? 'bg-gradient-to-br from-primary-600 to-green-600 text-white shadow-lg shadow-primary-200'
                          : 'bg-white/50 border border-white/80 hover:bg-white hover:shadow-md'
                        }`}>
                      <span className={`text-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${activeTip === i ? 'drop-shadow-md' : ''}`}>
                        {tip.emoji}
                      </span>
                      <p className={`text-sm leading-snug ${activeTip === i ? 'font-bold' : 'text-gray-600 font-medium'}`}>
                        {tip.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Summary Glass */}
              <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-400/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl -mr-10 -mt-10" />
                <h3 className="font-black mb-6 flex items-center gap-3 tracking-tighter text-lg">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Star size={16} className="text-amber-400" />
                  </div>
                  {t('yourProfile')}
                </h3>
                <div className="space-y-4">
                  {[
                    [t('name'),      user?.name     || 'User'],
                    [t('role'),     t(user?.role) || user?.role],
                    [t('location'), user?.location || 'Maharashtra'],
                    [t('phone'),    user?.phone    || '—'],
                  ].map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center group">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{key}</span>
                      <span className="font-black text-sm group-hover:text-primary-400 transition-colors">{val}</span>
                    </div>
                  ))}
                </div>
                <Link to="/profile"
                  className="mt-8 w-full bg-white/10 hover:bg-white text-white hover:text-gray-900 text-xs font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 border border-white/10">
                  <Edit size={14} /> {t('editProfile')}
                </Link>
              </div>
            </div>

            {/* Right Column: Activity & Large Promo Cards */}
            <div className="lg:col-span-2 space-y-8">
              <RecentActivity />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weather Promo */}
                <div className="group relative bg-gradient-to-br from-sky-400 to-blue-700 rounded-[40px] p-8 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-700">
                    <Sprout size={120} strokeWidth={1} />
                  </div>
                  <div className="relative z-10">
                    <p className="font-black text-white text-2xl tracking-tighter mb-1">🌦️ {t('feat3Title')}</p>
                    <p className="text-sky-100 text-xs font-bold uppercase tracking-widest mb-8 opacity-80">{t('feat3Desc')}</p>
                    <Link to="/weather"
                      className="inline-flex items-center gap-2 bg-white text-blue-700 font-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20">
                      {language === 'mr' ? 'बघा' : 'View'} <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* Schemes Promo */}
                <div className="group relative bg-gradient-to-br from-purple-500 to-violet-800 rounded-[40px] p-8 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                    <Star size={120} strokeWidth={1} />
                  </div>
                  <div className="relative z-10">
                    <p className="font-black text-white text-2xl tracking-tighter mb-1">🏛️ {t('sarkariYojana') || 'Schemes'}</p>
                    <p className="text-purple-100 text-[10px] font-bold uppercase tracking-widest mb-8 opacity-80">PM Kisan, Bima & more</p>
                    <Link to="/schemes"
                      className="inline-flex items-center gap-2 bg-white text-purple-700 font-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-purple-900/20">
                      {language === 'mr' ? 'तपासा' : 'Check'} <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* List Equipment Promo - Full Width */}
                <div className="md:col-span-2 group relative bg-gradient-to-r from-amber-400 to-orange-600 rounded-[40px] p-10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tighter mb-2 italic">🚜 {t('listEquipment')}</h3>
                      <p className="text-amber-100 font-bold text-sm max-w-md opacity-90">{t('listEquipmentDesc')}</p>
                    </div>
                    <Link to="/list-equipment"
                      className="bg-white text-orange-600 font-black px-10 py-5 rounded-[24px] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-2xl shadow-orange-900/30 whitespace-nowrap">
                      {t('listNow')} <ChevronRight size={18} className="inline ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}