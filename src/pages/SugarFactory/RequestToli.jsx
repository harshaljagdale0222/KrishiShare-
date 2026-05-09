import { useState, useEffect } from 'react'
import { Camera, Upload, Send, MapPin, Search, CheckCircle, Factory, Trash2, LayoutGrid, Building2, Info } from 'lucide-react'
import { factoryAPI, harvestAPI } from '../../api'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function RequestToli() {
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [factories, setFactories] = useState([])
  const [selectedFactories, setSelectedFactories] = useState([])
  const [district, setDistrict] = useState('Solapur')
  const [photo, setPhoto] = useState(null)
  const [details, setDetails] = useState({ area: '', variety: '' })
  const [loading, setLoading] = useState(false)
  const [myRequests, setMyRequests] = useState([])

  const fetchFactories = async () => {
    try {
      const res = await factoryAPI.getAll()
      setFactories(res.data.filter(f => f.location.toLowerCase().includes(district.toLowerCase())))
    } catch (err) {
      toast.error('Factories fetch fail!')
    }
  }

  const fetchMyRequests = async () => {
    try {
      const res = await harvestAPI.getFarmerRequests()
      setMyRequests(res.data)
    } catch (err) {}
  }

  useEffect(() => {
    fetchFactories()
    fetchMyRequests()
  }, [district])

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhoto(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const toggleFactory = (id) => {
    setSelectedFactories(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!photo || !details.area || selectedFactories.length === 0) {
      return toast.error('कृपया सर्व माहिती भरा!')
    }
    setLoading(true)
    try {
      await harvestAPI.submitRequest({
        district,
        photo,
        area: details.area,
        variety: details.variety,
        factoryIds: selectedFactories
      })
      toast.success('विनंती पाठवली! कारखाने आता तुमची विनंती पाहू शकतात.')
      setStep(1)
      setPhoto(null)
      setSelectedFactories([])
      fetchMyRequests()
    } catch (err) {
      toast.error('Error sending request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-outfit">
      
      {/* Dynamic Header */}
      <div className="bg-emerald-600 pt-16 pb-32 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl font-black text-white italic mb-2 tracking-tight">ऊस तोडणी विनंती (TOLI)</h1>
          <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] opacity-80">Send harvest requests directly to multiple factories</p>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-20">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-10">
          <button onClick={() => setStep(1)} className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${step === 1 ? 'bg-white text-emerald-600 shadow-xl' : 'text-white/60 hover:text-white'}`}>नया विनंती</button>
          <button onClick={() => setStep(2)} className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${step === 2 ? 'bg-white text-emerald-600 shadow-xl' : 'text-white/60 hover:text-white'}`}>माझ्या विनंत्या ({myRequests.length})</button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* Step 1: Upload Photo & Details */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-white p-10 rounded-[48px] shadow-xl border border-emerald-50">
                  <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                     <Camera size={24} className="text-emerald-500" /> १. ऊसाचा फोटो आणि माहिती
                  </h3>
                  
                  <div className="space-y-6">
                     <div className="relative group">
                        {photo ? (
                          <div className="relative h-64 rounded-[32px] overflow-hidden shadow-2xl">
                             <img src={photo} className="w-full h-full object-cover" alt="Sugarcane" />
                             <button onClick={() => setPhoto(null)} className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform">
                                <Trash2 size={20} />
                             </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-emerald-100 bg-emerald-50/30 rounded-[32px] cursor-pointer hover:bg-emerald-50 transition-all group">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg group-hover:scale-110 transition-transform mb-4">
                                <Upload size={32} />
                             </div>
                             <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">ऊसाचा फोटो अपलोड करा</p>
                             <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                          </label>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">एकूण क्षेत्र (एकर)</label>
                           <input type="text" value={details.area} onChange={(e) => setDetails({...details, area: e.target.value})} placeholder="उदा. २ एकर" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">ऊस जात (Variety)</label>
                           <input type="text" value={details.variety} onChange={(e) => setDetails({...details, variety: e.target.value})} placeholder="उदा. ८६०३२" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Step 2: Select Factories */}
            <div className="lg:col-span-7 space-y-8">
               <div className="bg-white p-10 rounded-[48px] shadow-xl border border-emerald-50 min-h-[600px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                     <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <Building2 size={24} className="text-emerald-500" /> २. कारखाने निवडा
                     </h3>
                     <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                        <MapPin size={16} className="text-emerald-500" />
                        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-transparent font-black text-sm outline-none">
                           <option value="Solapur">सोलापूर</option>
                           <option value="Satara">सातारा</option>
                           <option value="Sangli">सांगली</option>
                           <option value="Pune">पुणे</option>
                           <option value="Kolhapur">कोल्हापूर</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                     {factories.map(f => (
                       <div key={f._id} onClick={() => toggleFactory(f._id)} className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer group ${selectedFactories.includes(f._id) ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-50 bg-white hover:border-emerald-100'}`}>
                          <div className="flex justify-between items-start mb-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${selectedFactories.includes(f._id) ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-400'}`}>🏭</div>
                             {selectedFactories.includes(f._id) && <CheckCircle size={20} className="text-emerald-600" />}
                          </div>
                          <h4 className="font-black text-slate-800 uppercase text-sm mb-2">{f.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.location}</p>
                       </div>
                     ))}
                  </div>

                  {factories.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                       <Factory size={64} className="mx-auto mb-4" />
                       <p className="font-black uppercase tracking-widest text-sm">या जिल्ह्यात कारखाने सापडले नाहीत</p>
                    </div>
                  )}

                  {selectedFactories.length > 0 && (
                    <button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95">
                       {loading ? 'विनंती पाठवत आहे...' : `विनंती पाठवा (${selectedFactories.length} कारखाने) →`}
                    </button>
                  )}
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
             {myRequests.map(r => (
               <div key={r._id} className="bg-white p-8 rounded-[40px] shadow-lg border border-emerald-50 flex flex-col md:flex-row gap-10 items-center">
                  <div className="w-48 h-48 rounded-[32px] overflow-hidden shadow-xl shrink-0">
                     <img src={r.photo} className="w-full h-full object-cover" alt="Field" />
                  </div>
                  <div className="flex-1 space-y-6">
                     <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-2xl font-black text-slate-900 italic">{r.area} ऊस तोडणी</h3>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'pending' ? 'bg-amber-50 text-amber-600' : r.status === 'accepted' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {r.status === 'pending' ? 'प्रतीक्षेत' : r.status === 'accepted' ? 'प्रतिसाद आला' : 'निश्चित झाले'}
                        </span>
                     </div>
                     
                     <div className="flex flex-wrap gap-8">
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">जात (Variety)</p>
                           <p className="font-black text-slate-800">{r.variety}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">कारखाने (Sent To)</p>
                           <p className="font-black text-slate-800">{r.requestedFactories.length} Units</p>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">कारखान्यांचा प्रतिसाद:</p>
                        <div className="flex flex-wrap gap-4">
                           {r.requestedFactories.map(rf => (
                             <div key={rf.factoryId} className={`px-5 py-3 rounded-2xl border-2 flex items-center justify-between gap-6 ${rf.status === 'accepted' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-50 bg-gray-50/50 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${rf.status === 'accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                     {rf.status === 'accepted' ? 'Accepted' : 'Pending'}
                                  </span>
                                </div>
                                {rf.status === 'accepted' && r.status !== 'finalized' && (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await harvestAPI.finalizeFactory(r._id, rf.factoryId)
                                        toast.success('कारखाना निश्चित केला! तोडणीची तयारी सुरू करा.')
                                        fetchMyRequests()
                                      } catch(e) {}
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                                  >
                                    निवडा (SELECT)
                                  </button>
                                )}
                                {r.finalFactoryId === rf.factoryId && (
                                  <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest">निश्चित केला ✅</span>
                                )}
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             ))}
             {myRequests.length === 0 && (
               <div className="text-center py-40 bg-white rounded-[60px] border-4 border-dashed border-emerald-50">
                  <Info size={64} className="mx-auto mb-6 text-emerald-100" />
                  <p className="text-xl font-black text-slate-300 uppercase tracking-widest italic">अद्याप कोणतीही विनंती पाठवली नाही</p>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  )
}
