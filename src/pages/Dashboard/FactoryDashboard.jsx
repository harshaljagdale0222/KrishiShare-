import { useState, useEffect } from 'react'
import { Building2, Users, FileText, CheckCircle, Clock, MapPin, Phone, User, TrendingUp, Info } from 'lucide-react'
import { harvestAPI, factoryAPI } from '../../api'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function FactoryDashboard() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('requests')
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await harvestAPI.getFactoryRequests()
      setRequests(res.data)
    } catch (err) {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAccept = async (id) => {
    try {
      await harvestAPI.acceptRequest(id)
      toast.success('विनंती स्वीकारली! शेतकऱ्याला कळवण्यात आले आहे.')
      fetchRequests()
    } catch (err) {
      toast.error('Error accepting request')
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-outfit">
      
      {/* Header */}
      <div className="bg-slate-900 pt-16 pb-32 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">FACTORY CONSOLE</h1>
              <div className="flex items-center gap-4">
                 <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active System</div>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Operator: {user.name}</p>
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10 text-white text-center min-w-[150px]">
                 <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">New Requests</p>
                 <p className="text-3xl font-black">{requests.filter(r => r.status === 'pending').length}</p>
              </div>
           </div>
        </div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16">
        
        {/* Navigation */}
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[40px] shadow-2xl border border-white flex gap-2 mb-12 w-fit">
           <button onClick={() => setActiveTab('requests')} className={`px-10 py-4 rounded-[32px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Harvesting Requests</button>
           <button onClick={() => setActiveTab('analytics')} className={`px-10 py-4 rounded-[32px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Operations</button>
        </div>

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
             {requests.map(r => {
               const myStatus = r.requestedFactories.find(rf => rf.factoryId === user._id)?.status
               return (
                 <div key={r._id} className="bg-white rounded-[48px] shadow-xl border border-slate-100 overflow-hidden group">
                    <div className="h-64 relative">
                       <img src={r.photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Field" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                       <div className="absolute bottom-6 left-8">
                          <p className="text-white text-3xl font-black italic tracking-tighter mb-1">{r.area} ऊस क्षेत्र</p>
                          <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                             <MapPin size={12} /> {r.district}, Maharashtra
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">शेतकरी</p>
                             <p className="font-black text-slate-800 text-lg">{r.farmerName}</p>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">वाण (Variety)</p>
                             <p className="font-black text-slate-800 text-lg">{r.variety}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-4 text-slate-500">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                             <Phone size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Contact Farmer</p>
                             <p className="font-black text-slate-800 tracking-tighter">{r.farmerPhone}</p>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-slate-50">
                          {myStatus === 'pending' ? (
                             <button onClick={() => handleAccept(r._id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95">
                                विनंती स्वीकारा (ACCEPT REQUEST) →
                             </button>
                          ) : (
                             <div className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-xl">
                                <CheckCircle size={20} className="text-emerald-400" /> विनंती आधीच स्वीकारली आहे
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               )
             })}

             {requests.length === 0 && !loading && (
               <div className="lg:col-span-2 text-center py-40 bg-white rounded-[60px] border-4 border-dashed border-slate-100">
                  <Info size={64} className="mx-auto mb-6 text-slate-200" />
                  <p className="text-xl font-black text-slate-300 uppercase tracking-widest">अद्याप कोणतीही तोडणी विनंती प्राप्त नाही</p>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  )
}
