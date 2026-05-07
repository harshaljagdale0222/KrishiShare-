import { useState, useEffect } from 'react'
import { ExternalLink, Phone, ChevronDown, ChevronUp, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react'
import { schemeAPI } from '../../api'
import useLanguageStore from '../../store/languageStore'

export default function GovernmentSchemes() {
  const [schemes,      setSchemes]    = useState([])
  const [loading,      setLoading]    = useState(true)
  const [expandedId,   setExpandedId] = useState(null)
  const [search,       setSearch]     = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const { language } = useLanguageStore()

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const res = await schemeAPI.getAll()
      setSchemes(res.data)
    } catch (err) {
      console.error("Schemes loading failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchemes()
  }, [])

  const filters = [
    { id:'all',      label: language === 'mr' ? 'सर्व' : 'All' },
    { id:'machinery',label: language === 'mr' ? '🚜 अवजारे' : '🚜 Machinery' },
    { id:'subsidy',  label: language === 'mr' ? '💰 सबसिडी' : '💰 Subsidy' },
    { id:'insurance',label: language === 'mr' ? '🛡️ विमा' : '🛡️ Insurance' },
  ]

  const filtered = schemes.filter(s => {
    const title = (s.title?.[language] || s.title?.en || "").toLowerCase()
    const desc  = (s.description?.[language] || s.description?.en || "").toLowerCase()
    const searchTerm = search.toLowerCase()
    
    const matchSearch = title.includes(searchTerm) || desc.includes(searchTerm)
    
    const matchFilter = activeFilter === 'all' || 
                        (s.category?.en || "").toLowerCase().includes(activeFilter.toLowerCase()) ||
                        (s.category?.mr || "").toLowerCase().includes(activeFilter.toLowerCase())
                        
    return matchSearch && matchFilter
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="text-center">
          <RefreshCw size={40} className="text-primary-600 animate-spin mx-auto mb-4" />
          <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Yojana Load Hot Aahet...</p>
       </div>
    </div>
  )



  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-green-700 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
          <h1 className="text-2xl font-black italic tracking-tight">🏛️ {language === 'mr' ? 'सरकारी योजना' : 'Sarkari Yojana'}</h1>
          <p className="text-green-100 text-sm mt-1">{language === 'mr' ? 'कृषी शेअरद्वारे आधुनिक शेतीसाठी सर्व योजना' : 'All schemes for modern farming via Krishi Share'}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-8 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'mr' ? "योजना शोधा..." : "Search schemes..."}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none text-sm focus:border-primary-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition flex-shrink-0
                ${activeFilter === f.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon:'💰', label: language === 'mr' ? 'एकूण योजना' : 'Total Schemes', value: schemes.length },
            { icon:'✅', label: language === 'mr' ? 'उपलब्ध' : 'Available', value: schemes.length },
            { icon:'📞', label: language === 'mr' ? 'हेल्पलाईन' : 'Helplines', value: schemes.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-xl">{stat.icon}</p>
              <p className="font-bold text-gray-800 text-lg">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Scheme Cards */}
        {filtered.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-400 font-bold">{language === 'mr' ? 'कोणतीही योजना सापडली नाही' : 'No schemes found'}</p>
           </div>
        ) : filtered.map((scheme) => {
          const isExpanded = expandedId === scheme._id
          const title = scheme.title[language] || scheme.title.en
          const desc  = scheme.description[language] || scheme.description.en
          const benefit = scheme.benefit?.[language] || scheme.benefit?.en
          const eligibility = scheme.eligibility?.[language] || scheme.eligibility?.en
          const cat = scheme.category?.[language] || scheme.category?.en

          return (
            <div key={scheme._id}
              className={`bg-white rounded-[32px] border-2 shadow-sm overflow-hidden transition-all duration-300
                ${isExpanded ? 'border-primary-200 bg-primary-50/30 ring-4 ring-primary-50' : 'border-gray-100'}`}>

              {/* Card Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : scheme._id)}
                className="w-full text-left">
                <div className={`p-6 ${isExpanded ? 'bg-gradient-to-br from-primary-600 to-green-600 text-white' : 'text-gray-800'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner
                        ${isExpanded ? 'bg-white/20' : 'bg-gray-50'}`}>
                        {scheme.image ? <img src={scheme.image} className="w-full h-full object-cover rounded-2xl" alt="" /> : '🌾'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest
                            ${isExpanded ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>
                            {cat}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-green-400/20 text-green-600 uppercase tracking-widest">
                            🟢 Active
                          </span>
                        </div>
                        <h3 className="font-black text-lg leading-tight tracking-tight">{title}</h3>
                        {!isExpanded && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{desc}</p>}
                      </div>
                    </div>
                    <div className={`${isExpanded ? 'bg-white/20' : 'bg-gray-100'} rounded-xl p-2 flex-shrink-0 transition-colors`}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">

                  {/* Benefit */}
                  <div className="bg-white border-2 border-primary-100 rounded-[24px] p-5 shadow-sm">
                    <p className="text-[10px] font-black text-primary-600 mb-2 uppercase tracking-[0.2em]">💰 {language === 'mr' ? 'फायदे' : 'Benefits'}</p>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed">{benefit || desc}</p>
                  </div>

                  {/* Eligibility */}
                  {eligibility && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">👥 {language === 'mr' ? 'पात्रता' : 'Eligibility'}</p>
                      <p className="text-sm text-gray-700 bg-white border border-gray-100 rounded-2xl px-5 py-4 font-medium shadow-sm">
                        {eligibility}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <a href={`tel:18001801551`}
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                      <Phone size={16} /> Help
                    </a>
                    <a href={scheme.applyUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-200 active:scale-95">
                      <ExternalLink size={16} /> {language === 'mr' ? 'अर्ज करा' : 'Apply Now'}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Helpline Box */}
        <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl -mr-10 -mt-10" />
          <p className="font-black text-lg mb-6 flex items-center gap-2 tracking-tight">
            <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-sm">📞</span>
            {language === 'mr' ? 'कृषी हेल्पलाईन्स' : 'Krishi Helplines'}
          </p>
          <div className="space-y-4">
            {[
              { label: language === 'mr' ? 'किसान कॉल सेंटर' : 'Kisan Call Center', number:'1800-180-1551' },
              { label: language === 'mr' ? 'पीएम किसान हेल्पलाईन' : 'PM Kisan Helpline', number:'155261' },
              { label: language === 'mr' ? 'पीक विमा हेल्पलाईन' : 'Fasal Bima Helpline', number:'14447' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{item.label}</span>
                <a href={`tel:${item.number}`}
                  className="flex items-center gap-2 text-xs font-black text-primary-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-primary-600 hover:text-white transition-all">
                  <Phone size={12} /> {item.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}