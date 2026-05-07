import { create } from 'zustand'
import { bookingAPI } from '../api'
import axios from 'axios'

import toast from 'react-hot-toast'

const useBookingStore = create((set, get) => ({
  bookings: [],
  allBookings: [],
  loading: false,

  fetchMyBookings: async () => {
    set({ loading: true })
    try {
      const res = await bookingAPI.getMyBookings()
      set({ bookings: res.data, loading: false })
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },

  fetchAllBookings: async () => {
    set({ loading: true })
    try {
      const res = await bookingAPI.getAllBookings()
      set({ allBookings: res.data, loading: false })
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },

  addBooking: async (bookingData) => {
    try {
      const payload = {
        equipmentId: bookingData.equipment._id,
        equipmentName: bookingData.equipment.name,
        category: bookingData.equipment.category,
        owner: bookingData.equipment.ownerName || bookingData.equipment.owner,
        ownerId: bookingData.equipment.owner || bookingData.equipment.ownerId,
        ownerPhone: bookingData.equipment.ownerPhone || bookingData.equipment.phone || '',
        location: bookingData.address || bookingData.equipment.location || '',
        pricePerHour: Number(bookingData.equipment.pricePerHour) || 0,
        date: bookingData.date,
        hours: Number(bookingData.hours),
        timeSlot: bookingData.timeSlot,
        amount: Number(bookingData.totalPrice),
        advanceAmount: Number(bookingData.advanceAmount),
        note: bookingData.note
      }
      const res = await bookingAPI.create(payload)
      set({ bookings: [res.data, ...get().bookings] })
      toast.success('🎉 Booking confirmed successfully!')
    } catch (error) {
      toast.error('Booking failed!')
      console.error(error)
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const res = await bookingAPI.updateStatus(id, status)
      set({ 
        bookings: get().bookings.map(b => b._id === id ? res.data : b),
        allBookings: get().allBookings.map(b => b._id === id ? res.data : b)
      })
      toast.success('Status updated!')
    } catch (error) {
      toast.error('Error updating status!')
      console.error(error)
    }
  },

  cancelBooking: async (id) => {
    try {
      const res = await bookingAPI.cancelBooking(id)  // PATCH /:id/cancel - farmer can use this
      set({ bookings: get().bookings.map(b => b._id === id ? res.data : b) })
      toast.success('Booking cancelled!')
    } catch (error) {
      const msg = error?.response?.data?.message || 'Could not cancel booking!'
      toast.error(msg)
    }
  },

  updatePaymentStatus: async (id, status) => {
    try {
      const res = await bookingAPI.updatePaymentStatus(id, status)
      set({ 
        allBookings: get().allBookings.map(b => b._id === id ? res.data : b),
        bookings: get().bookings.map(b => b._id === id ? res.data : b)
      })
      toast.success(status === 'paid' ? '💰 Payment Marked as Paid!' : 'Payment marked as Pending')
    } catch (error) {
      toast.error('Payment update failed!')
    }
  },

  reportFarmer: async (id) => {
    try {
      const res = await bookingAPI.reportFarmer(id)
      set({ 
        allBookings: get().allBookings.map(b => b._id === id ? { ...b, isDisputed: true } : b),
        bookings: get().bookings.map(b => b._id === id ? { ...b, isDisputed: true } : b)
      })
      toast.error('🚨 Farmer Reported! Strike added.', { duration: 5000 })
    } catch (error) {
      toast.error('Reporting failed!')
    }
  },

  confirmAdvance: async (id) => {
    try {
      const res = await bookingAPI.confirmAdvance(id)
      set({ 
        bookings: get().bookings.map(b => b._id === id ? res.data : b),
        allBookings: get().allBookings.map(b => b._id === id ? res.data : b)
      })
      toast.success('🎉 Advance Paid! Booking Confirmed.')
    } catch (error) {
      toast.error('Payment failed! Try again.')
    }
  },

  handleRealPayment: async (booking, type = 'advance') => {
    try {
      toast.loading(type === 'advance' ? 'DUMMY: Advance payment processing...' : 'DUMMY: Full payment processing...', { id: 'dummy-pay' })
      
      // Simulate a small delay for "Real" feel
      await new Promise(resolve => setTimeout(resolve, 800))

      // Directly confirm the booking in backend
      const res = await bookingAPI.confirmAdvance(booking._id)
      
      set({ 
        bookings: get().bookings.map(b => b._id === booking._id ? res.data : b),
        allBookings: get().allBookings.map(b => b._id === booking._id ? res.data : b)
      })

      toast.dismiss('dummy-pay')
      toast.success(type === 'advance' ? '🎉 Advance Paid (Dummy)! Booking Confirmed.' : '🎉 Full Payment Received (Dummy)!')

      // Auto WhatsApp to Owner
      try {
        const { sendWhatsAppMessage, WA_TEMPLATES } = await import('../utils/whatsapp')
        const advAmt = booking.advanceAmount || Math.round(booking.amount * 0.05)
        const amount = type === 'advance' ? advAmt : (booking.amount - advAmt)
        
        const msg = type === 'advance' 
          ? WA_TEMPLATES.ADVANCE_PAID(booking.farmerName || 'Farmer', booking.equipmentName, amount)
          : `\u2705 *पूर्ण पेमेंट मिळाले (Dummy)*\n\nनमस्ते, मी ${booking.farmerName || 'Farmer'}. तुमच्या *${booking.equipmentName}* साठीचे उर्वरित \u20B9${amount} पेमेंट पूर्ण केले आहे. धन्यवाद! \uD83D\uDE4F`
        
        sendWhatsAppMessage(booking.ownerPhone, msg)
      } catch (e) {
        console.error('WhatsApp Error:', e)
      }

    } catch (error) {
      toast.dismiss('dummy-pay')
      toast.error('Dummy payment failed!')
      console.error(error)
    }
  },

  reportOwner: async (id) => {
    try {
      await bookingAPI.reportOwner(id)
      toast.error('🚨 Owner Reported! Strike added.', { duration: 5000 })
    } catch (error) {
      toast.error('Reporting failed!')
    }
  },

  // ─── Real-Time Sync (Update data without API call) ──
  updateBookingLocal: (updated) => {
    set((state) => ({
      bookings:    state.bookings.map(b => b._id === updated._id ? updated : b),
      allBookings: state.allBookings.map(b => b._id === updated._id ? updated : b)
    }))
  },

  addBookingLocal: (booking) => {
    set((state) => ({
      allBookings: [booking, ...state.allBookings]
    }))
  },

  clearBookings: () => set({ bookings: [], allBookings: [] }),
}))

export default useBookingStore