import { useState, useEffect, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { socket } from '../../utils/socket'
import toast from 'react-hot-toast'
import { notificationAPI } from '../../api'

export default function NotificationDropdown() {
  const { user, isAuthenticated } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()
      socket.connect()

      // 🔔 Request Browser Notification Permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      const handleNewNotification = (data) => {
        // Automatically append incoming notification
        const newNotif = {
          _id: data.id || Date.now().toString(),
          title: data.title || 'Notification',
          message: data.message,
          isRead: false,
          link: data.link || '/orders',
          type: data.type || 'system',
          createdAt: new Date()
        }
        setNotifications(prev => [newNotif, ...prev])
        
        // 🚀 Show In-App Toast
        toast(data.message, {
          duration: 4000,
          position: 'top-right',
          icon: data.type === 'order' ? '📦' : '🔔',
        })

        // 🌐 Show Native Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(data.title || "KrishiShare Update", {
            body: data.message,
            icon: '/favicon.ico', // Change to your app icon path if available
          });
        }
      }

      socket.on('new_order', handleNewNotification)
      socket.on('order_status_update', handleNewNotification)
      socket.on('harvest_update', handleNewNotification) // Added harvest support

      return () => {
        socket.off('new_order', handleNewNotification)
        socket.off('order_status_update', handleNewNotification)
        socket.off('harvest_update', handleNewNotification)
      }
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length)
  }, [notifications])

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll()
      setNotifications(res.data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id, link) => {
    try {
      await notificationAPI.readOne(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setIsOpen(false)
      if (link) navigate(link)
    } catch (error) {
      console.error(error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationAPI.readAll()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error(error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="relative p-2 text-gray-600 hover:text-primary-600 transition hover:bg-gray-100 rounded-full group"
      >
        <Bell size={24} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full min-w-[20px] h-[20px] flex items-center justify-center border-2 border-white px-1 shadow-md animate-bounce-subtle">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-3 text-gray-300 opacity-50" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">When you place orders, updates will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <div 
                    key={notif._id} 
                    onClick={() => markAsRead(notif._id, notif.link)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition flex gap-3 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex flex-shrink-0 items-center justify-center text-lg">
                      {notif.type === 'order' ? '📦' : '🔔'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && <span className="w-2 h-2 bg-primary-600 rounded-full mt-1.5 flex-shrink-0 shadow-sm"></span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
