import { useEffect } from 'react'
import { socket } from '../utils/socket'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'
import useOrderStore from '../store/orderStore'
import useBookingStore from '../store/bookingStore'
import useProductStore from '../store/productStore'
import toast from 'react-hot-toast'

export default function NotificationListener() {
  const { user } = useAuthStore()
  const { addNotification, fetchNotifications } = useNotificationStore()
  const { updateOrderLocal, updateLiveLocation, addOrderLocal } = useOrderStore()
  const { updateBookingLocal, addBookingLocal } = useBookingStore()
  const { updateProductLocal } = useProductStore()

  useEffect(() => {
    if (!user?._id) return

    // Request Notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Connect to socket if not connected
    if (!socket.connected) {
      socket.connect()
    }

    // Join personal room for private notifications
    socket.emit('join', user._id)

    // Handle generic notification event
    socket.on('notification', (data) => {
      console.log('Real-time Notification Received:', data)
      
      // Add to store
      addNotification({
        _id: data.id || Date.now().toString(),
        title: data.title,
        message: data.message,
        type: data.type || 'order',
        createdAt: new Date(),
        isRead: false
      })

      // Show Toast
      toast.success(`${data.title}: ${data.message}`, { 
        duration: 5000, 
        position: 'top-right',
        icon: data.type === 'order' ? '📦' : '🔔'
      })

      // Show Browser Notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico'
        })
      }
    })

    // --- 🚀 REAL-TIME DATA SYNC (No Refresh Needed) ---
    socket.on('new_order', (data) => {
      console.log('New Order Socket Event:', data)
      toast.success(`🎉 Navin Order: ${data.message}`, { duration: 5000, position: 'top-right' })
      if (data.order) {
        addOrderLocal(data.order)
      }
    })

    socket.on('new_booking', (data) => {
      console.log('New Booking Socket Event:', data)
      toast.success(`🚜 Navin Booking: ${data.message}`, { duration: 5000, position: 'top-right' })
      if (data.booking) {
        addBookingLocal(data.booking)
      }
    })

    socket.on('order_status_updated', (updatedOrder) => {
      console.log('Order status updated real-time:', updatedOrder)
      updateOrderLocal(updatedOrder)
    })

    socket.on('booking_status_updated', (updatedBooking) => {
      console.log('Booking status updated real-time:', updatedBooking)
      updateBookingLocal(updatedBooking)
    })

    socket.on('product_updated', (updatedProduct) => {
      console.log('Product updated real-time:', updatedProduct)
      updateProductLocal(updatedProduct)
      if (updatedProduct.stock === 0) {
        toast.error(`⚠️ ${updatedProduct.name} cha stock sampala aahe!`, { id: updatedProduct._id })
      }
    })

    socket.on('order_location_update', (data) => {
      if (data.orderId && data.lat && data.lng) {
         updateLiveLocation(data.orderId, { lat: data.lat, lng: data.lng })
      }
    })

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message)
    })

    // Initial fetch
    fetchNotifications(user._id)

    return () => {
      socket.off('notification')
      socket.off('product_updated')
      socket.off('new_order')
      socket.off('new_booking')
      socket.off('order_status_updated')
      socket.off('booking_status_updated')
      socket.off('order_location_update')
      socket.off('connect_error')
    }
  }, [user?._id])

  return null
}
