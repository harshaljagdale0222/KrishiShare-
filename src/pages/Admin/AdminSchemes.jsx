import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, ExternalLink, RefreshCw } from 'lucide-react'
import { schemeAPI } from '../../api'
import useLanguageStore from '../../store/languageStore'
import { toast } from 'react-hot-toast'

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const { language } = useLanguageStore()

  const [newScheme, setNewScheme] = useState({
    title: { en: '', mr: '' },
    description: { en: '', mr: '' },
    category: { en: '', mr: '' },
    benefit: { en: '', mr: '' },
    applyUrl: '',
    image: ''
  })

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const res = await schemeAPI.getAll()
      setSchemes(res.data)
    } catch (err) {
      toast.error("Failed to load schemes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchemes()
  }, [])

  const handleAddScheme = async (e) => {
    e.preventDefault()
    try {
      // Note: We'll need to add a POST method to schemeAPI
      await schemeAPI.create(newScheme)
      toast.success("Scheme added successfully! ✅")
      setShowAddModal(false)
      fetchSchemes()
    } catch (err) {
      toast.error("Error adding scheme")
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return
    try {
      await schemeAPI.delete(id)
      toast.success("Scheme deleted")
      fetchSchemes()
    } catch (err) {
      toast.error("Delete failed")
    }
  }

  if (loading) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">🏛️ Manage Government Schemes</h1>
          <p className="text-gray-500 text-sm">Add or update schemes for farmers</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-200 hover:scale-105 transition"
        >
          <Plus size={20} /> Add New Scheme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.map((s) => (
          <div key={s._id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
            <div className="h-40 rounded-2xl bg-gray-50 mb-4 overflow-hidden">
              <img src={s.image || 'https://via.placeholder.com/400x200'} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{s.title[language] || s.title.en}</h3>
            <p className="text-gray-500 text-xs line-clamp-2 mb-4">{s.description[language] || s.description.en}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {s.category.en}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(s._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">Add New Scheme</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>

            <form onSubmit={handleAddScheme} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Title (English)</label>
                  <input required type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                    onChange={e => setNewScheme({...newScheme, title: {...newScheme.title, en: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">शीर्षक (मराठी)</label>
                  <input required type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                    onChange={e => setNewScheme({...newScheme, title: {...newScheme.title, mr: e.target.value}})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Apply URL</label>
                <input required type="url" placeholder="https://..." className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                  onChange={e => setNewScheme({...newScheme, applyUrl: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image URL</label>
                <input required type="url" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                  onChange={e => setNewScheme({...newScheme, image: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category (English)</label>
                  <input required type="text" placeholder="e.g. Subsidy" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                    onChange={e => setNewScheme({...newScheme, category: {...newScheme.category, en: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">वर्ग (मराठी)</label>
                  <input required type="text" placeholder="उदा. सबसिडी" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" 
                    onChange={e => setNewScheme({...newScheme, category: {...newScheme.category, mr: e.target.value}})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-primary-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-primary-200 hover:bg-primary-700 transition">
                Create Scheme ✅
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
