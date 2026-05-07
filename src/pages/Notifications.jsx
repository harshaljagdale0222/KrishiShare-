import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Package, Tractor, Factory, ArrowLeft, Loader } from 'lucide-react'
import { notificationAPI } from '../api'
import useAuthStore from '../store/authStore'
import useLanguageStore from '../store/languageStore'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user?._id) return
      const res = await notificationAPI.getAll()
      setNotifications(res.data)
    } catch (e) {
      console.error('Notif fetch failed', e)
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleReadAll = async () => {
    try {
      await notificationAPI.readAll()
      fetchNotifications()
      toast.success(language === 'mr' ? 'सर्व वाचले गेले!' : 'All marked as read!')
    } catch (e) { 
        toast.error('Failed to clear alerts') 
    }
  }

  const handleReadOne = async (id, link) => {
    try {
      await notificationAPI.readOne(id)
      if (link) navigate(link)
      fetchNotifications()
    } catch (e) { }
  }

  const typeConfig = { 
    order:   { icon: <Package size={20} />,   color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }, 
    booking: { icon: <Tractor size={20} />,   color: 'text-blue-600 bg-blue-50 border-blue-100' }, 
    payment: { icon: <Bell size={20} />,      color: 'text-indigo-600 bg-indigo-50 border-indigo-100' }, 
    harvest: { icon: <Factory size={20} />,   color: 'text-amber-600 bg-amber-50 border-amber-100' }, 
    system:  { icon: <Bell size={20} />,      color: 'text-gray-600 bg-gray-50 border-gray-100' }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Loader className="animate-spin text-primary-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Alerts & Notifications</h1>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button onClick={handleReadAll} className="text-[11px] font-black uppercase tracking-widest text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition">
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">No alerts right now</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.system
              return (
                <div 
                  key={n._id} 
                  onClick={() => handleReadOne(n._id, n.link)}
                  className={`bg-white rounded-[28px] p-6 border-2 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:shadow-gray-300/50 ${!n.isRead ? 'border-primary-400 ring-8 ring-primary-500/5 shadow-lg shadow-primary-100/20' : 'border-gray-100'}`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-[15px] tracking-tight ${!n.isRead ? 'font-black text-gray-950' : 'font-extrabold text-gray-600'}`}>{n.title}</h4>
                        <span className="text-[11px] font-black text-gray-500 whitespace-nowrap ml-4 leading-none bg-gray-50 px-2 py-1 rounded-lg">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[13px] mt-2 leading-relaxed ${!n.isRead ? 'font-extrabold text-gray-800' : 'font-bold text-gray-500'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm border ${cfg.color}`}>{n.type}</span>
                        {!n.isRead && (
                          <span className="flex items-center gap-2 text-[10px] font-black text-primary-700 uppercase tracking-widest bg-primary-100 px-3 py-1 rounded-lg shadow-sm border border-primary-200">
                            <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" /> New Alert
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
