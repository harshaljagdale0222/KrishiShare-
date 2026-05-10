import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Factory, MapPin, Phone, TrendingUp, Activity, Send, Star, 
  Search, Filter, ChevronRight, ArrowLeft, ArrowRight, Info,
  ShieldCheck, Loader, Map, Navigation2, X, PlusCircle, Building2, Zap
} from 'lucide-react'
import { factoryAPI, harvestAPI } from '../../api'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import useHarvestStore from '../../store/harvestStore'
import toast from 'react-hot-toast'
import { maharashtraData } from '../../utils/locationData'
import { calculateDistance } from '../../utils/distance'

// ─── Detailed Factory View ────────────────────────────────
function FactoryDetails({ factory, onBack, onApplyMember, onRequestHarvest, t, language }) {
  const isDevanagari = language === 'mr' || language === 'hi';
  
  return (
    <div className="min-h-screen bg-white font-outfit">
       {/* Hero */}
       <div className="h-[40vh] bg-emerald-900 relative flex items-center justify-center">
          <button onClick={onBack} className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all z-50">
             <ArrowLeft size={20} />
          </button>
          <div className="text-center text-white space-y-6 px-6">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight drop-shadow-2xl">{factory.name}</h2>
             <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="bg-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <MapPin size={12} /> {factory.taluka} | {factory.district}
                </span>
                {factory.established && (
                  <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                     {t('since')} {factory.established}
                  </span>
                )}
                <span className="bg-blue-500/80 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Navigation2 size={12} /> {factory.distance} KM AWAY
                </span>
             </div>
          </div>
       </div>

       {/* Stats */}
       <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10 pb-20">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row gap-12">
             <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between border-b pb-6">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('address')}</p>
                      <p className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> {factory.fullAddress}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('contact')}</p>
                      <p className="font-bold text-emerald-600 flex items-center gap-2 justify-end"><Phone size={16} /> {factory.contact}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('frpRate')}</p>
                      <p className="text-4xl font-black text-gray-900 italic">₹{factory.frpRate}<span className="text-sm text-gray-400 ml-1">/Ton</span></p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('capacity')}</p>
                      <p className="text-4xl font-black text-gray-900">{factory.capacity || '2500 T/D'}</p>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={onRequestHarvest} disabled={!factory.isOpen} className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                      {t('harvestRequest')}
                   </button>
                   <button onClick={onApplyMember} disabled={factory.isMember} className="flex-1 py-5 border-2 border-emerald-600 text-emerald-600 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                      {factory.isMember ? t('alreadyMember') : t('joinMembership')}
                   </button>
                </div>
             </div>

             <div className="w-full md:w-64 space-y-6">
                <div className="bg-gray-50 rounded-[32px] p-8 text-center space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('status')}</p>
                   <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white ${factory.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      <Activity size={28} className="animate-pulse" />
                   </div>
                   <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{factory.isOpen ? t('factoryOpen') : t('factoryClosed')}</p>
                </div>
                <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(factory.name)}`)} className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                   <Navigation2 size={14} /> {t('directions')}
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

function RequestForm({ factory, onSubmit, onBack, loading, t }) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({ acres: '', date: '' })

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="p-3 bg-gray-50 rounded-xl text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="font-black text-gray-900 uppercase text-sm">{t('harvestRequest')}</h2>
        <div className="w-10" />
      </div>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
         <div className="bg-white rounded-[40px] p-8 shadow-xl space-y-8 border border-gray-100">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('areaAcres')}</label>
               <input type="number" value={form.acres} onChange={e => setForm({...form, acres: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-6 font-black text-xl" />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('harvestDate')}</label>
               <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-6 font-black text-xl" />
            </div>
         </div>
         <button onClick={() => onSubmit(form)} disabled={loading} className="w-full py-8 bg-emerald-600 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">
            {loading ? <Loader className="animate-spin" /> : t('submitRequest')}
         </button>
      </div>
    </div>
  )
}

const SugarFactory = () => {
  const { user } = useAuthStore()
  const { language, t } = useLanguageStore()
  const { postRequest, loading } = useHarvestStore()

  const [district, setDistrict] = useState('All')
  const [taluka, setTaluka] = useState('All')
  const [search, setSearch] = useState('')
  const [rawFactories, setRawFactories] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [viewDetailsFactory, setViewDetailsFactory] = useState(null)
  const [myMemberships, setMyMemberships] = useState([])
  const [currentCoords, setCurrentCoords] = useState(null)

  const isDevanagari = language === 'mr' || language === 'hi';

  const fetchData = async () => {
    setIsFetching(true)
    try {
      const [facRes, memRes] = await Promise.all([
        factoryAPI.getAll(),
        factoryAPI.getMyMemberships()
      ])
      const factories = Array.isArray(facRes.data) ? facRes.data : (facRes.data?.value || [])
      setRawFactories(factories)
      setMyMemberships(memRes.data)
    } catch (e) { toast.error('Error') } finally { setIsFetching(false) }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { setTaluka('All') }, [district])

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, (err) => console.log('Location access denied'), { enableHighAccuracy: true })
    }
  }, [])

  const filteredFactories = useMemo(() => {
    let result = rawFactories.map(f => {
      const userLat = currentCoords?.lat || user?.coordinates?.lat || 18.5204;
      const userLng = currentCoords?.lng || user?.coordinates?.lng || 73.8567;
      return {
        ...f,
        distance: calculateDistance(userLat, userLng, f.coordinates?.lat, f.coordinates?.lng),
        isMember: myMemberships.some(m => m.factoryId?._id === f._id && m.status === 'approved'),
      }
    })
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(f => f.name.toLowerCase().includes(q) || (f.taluka && f.taluka.toLowerCase().includes(q)))
    } else {
      if (district !== 'All') result = result.filter(f => f.district === district)
      if (taluka !== 'All') result = result.filter(f => f.taluka === taluka)
    }
    return result.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
  }, [rawFactories, district, taluka, search, myMemberships, user])

  if (selectedFactory) {
    return <RequestForm factory={selectedFactory} onBack={() => setSelectedFactory(null)} onSubmit={async (data) => {
      try {
        await postRequest({ ...data, factoryId: selectedFactory._id })
        toast.success(t('requestSent'))
        setSelectedFactory(null)
      } catch (err) { toast.error('Error') }
    }} loading={loading} t={t} />
  }

  if (viewDetailsFactory) {
    return <FactoryDetails factory={viewDetailsFactory} t={t} language={language} onBack={() => setViewDetailsFactory(null)} onApplyMember={async () => {
       try { await factoryAPI.applyMembership(viewDetailsFactory._id); toast.success('Done'); fetchData(); } catch(e){}
    }} onRequestHarvest={() => setSelectedFactory(viewDetailsFactory)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 font-outfit pb-20">
      <div className="bg-emerald-900 text-white pt-16 pb-24 px-6 text-center rounded-b-[60px] shadow-2xl">
         <div className="max-w-5xl mx-auto space-y-12">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{t('sugarFactoryTitle')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white/10 p-4 rounded-3xl flex items-center justify-center gap-3 border border-white/10">
                  <MapPin size={20} className="text-emerald-400" />
                  <select value={district} onChange={e => setDistrict(e.target.value)} className="bg-transparent border-none text-white font-black text-sm outline-none text-center appearance-none cursor-pointer">
                    <option value="All" className="text-gray-900">{t('allMaharashtra')}</option>
                    {Object.keys(maharashtraData).sort().map(d => (
                       <option key={d} value={d} className="text-gray-900">{isDevanagari ? maharashtraData[d].mr : d}</option>
                    ))}
                  </select>
               </div>
               <div className="bg-white/10 p-4 rounded-3xl flex items-center justify-center gap-3 border border-white/10">
                  <Filter size={20} className="text-blue-400" />
                  <select value={taluka} onChange={e => setTaluka(e.target.value)} className="bg-transparent border-none text-white font-black text-sm outline-none text-center appearance-none cursor-pointer">
                    <option value="All" className="text-gray-900">{t('allTalukas')}</option>
                    {(maharashtraData[district]?.talukas || []).map(t_val => (
                       <option key={t_val.en} value={t_val.en} className="text-gray-900">{isDevanagari ? t_val.mr : t_val.en}</option>
                    ))}
                  </select>
               </div>
               <div className="bg-white p-4 rounded-3xl flex items-center justify-center gap-3 shadow-xl">
                  <Search size={20} className="text-emerald-600" />
                  <input type="text" placeholder={t('searchMills')} value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none text-gray-900 font-black text-sm outline-none text-center w-full" />
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isFetching ? Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-white animate-pulse rounded-[40px]" />) : (
               filteredFactories.map(f => (
                 <div key={f._id} onClick={() => setViewDetailsFactory(f)} className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col justify-between group">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                         <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">🏭</div>
                         <div className="text-right">
                           <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{f.taluka}</span>
                           <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center justify-end gap-1"><Navigation2 size={10}/> {f.distance} KM</p>
                         </div>
                       </div>
                       <h3 className="text-xl font-black text-gray-900 uppercase leading-tight line-clamp-2">{f.name}</h3>
                       <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-50">
                          <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('frpRate')}</p><p className="text-lg font-black text-gray-900">₹{f.frpRate}</p></div>
                          <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('rating')}</p><p className="text-lg font-black text-gray-900 flex items-center gap-1"><Star size={14} className="fill-amber-500 text-amber-500"/> {f.rating}</p></div>
                       </div>
                    </div>
                    <div className="flex gap-3 mt-8" onClick={e => e.stopPropagation()}>
                       <button onClick={() => setSelectedFactory(f)} className="flex-1 py-5 bg-emerald-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                          {t('harvestRequest')} <ArrowRight size={16} />
                       </button>
                       <a href={`tel:${f.contact}`} className="w-16 h-16 bg-white border border-gray-100 rounded-[24px] flex items-center justify-center text-emerald-600 active:scale-90 transition-all"><Phone size={20} /></a>
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
    </div>
  )
}
export default SugarFactory
