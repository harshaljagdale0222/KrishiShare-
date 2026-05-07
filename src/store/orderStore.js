import { create } from 'zustand'
import { orderAPI } from '../api'
import toast from 'react-hot-toast'

const useOrderStore = create((set, get) => ({
  myOrders:  [],
  allOrders: [],
  loading:   false,

  // ─── Farmer: Order place karo ─────────────────────────
  placeOrder: async (orderData) => {
    set({ loading: true })
    try {
      const res = await orderAPI.placeOrder(orderData)
      set((state) => ({
        myOrders: [res.data, ...state.myOrders],
        loading:  false,
      }))
      toast.success('Order place zala! 🎉')
      return res.data
    } catch (err) {
      set({ loading: false })
      toast.error(err.response?.data?.message || 'Order place nahi zala!')
      return null
    }
  },

  // ─── Farmer: Mazi orders load karo ───────────────────
  fetchMyOrders: async () => {
    set({ loading: true })
    try {
      const res = await orderAPI.getMyOrders()
      set({ myOrders: res.data, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  // ─── Owner: Sab orders load karo ─────────────────────
  fetchAllOrders: async () => {
    set({ loading: true })
    try {
      const res = await orderAPI.getAllOrders()
      set({ allOrders: res.data, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const res = await orderAPI.cancelOrder(orderId)
      set((state) => ({
        myOrders: state.myOrders.map(o => o._id === orderId ? res.data : o)
      }))
      toast.success('Order cancel zala! ❌')
    } catch (err) {
      toast.error('Cancellation failed!')
    }
  },

  markBillGenerated: async (orderId) => {
    try {
      const res = await orderAPI.generateBill(orderId)
      get().updateOrderLocal(res.data)
      toast.success('Bill generate houn farmer la pathavale! 📄')
    } catch (err) {
      toast.error('Bill generation failed!')
    }
  },

  payAdvance: async (orderId) => {
    try {
      const res = await orderAPI.payAdvance(orderId)
      set((state) => ({
        myOrders: state.myOrders.map(o => o._id === orderId ? res.data : o)
      }))
      toast.success('10% Advance Pay kela! ✅')
    } catch (err) {
      toast.error('Payment failed!')
    }
  },

  // ─── Owner: Status update ─────────────────────────────
  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await orderAPI.updateStatus(orderId, { status })
      set((state) => ({
        allOrders: state.allOrders.map(o =>
          o._id === orderId ? res.data : o
        )
      }))
      const msgs = {
        accepted:  '✅ Order Accept kela!',
        rejected:  '❌ Order Reject kela!',
        packing:   '📫 Packing suru keli!',
        delivered: '🎉 Order Delivered!',
      }
      toast.success(msgs[status] || 'Status update zala!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed!')
    }
  },

  // ─── Getters ──────────────────────────────────────────
  getFarmerOrders: ()          => get().myOrders,
  getAllOrders:     ()          => get().allOrders,

  // ─── Real-Time Sync (Update data without API call) ──
  updateOrderLocal: (updatedOrder) => {
    set((state) => ({
      myOrders:  state.myOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o),
      allOrders: state.allOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o)
    }))
  },

  addOrderLocal: (order) => {
    set((state) => ({
      allOrders: [order, ...state.allOrders]
    }))
  },

  // ─── Live Location Update (for UI sync) ──────────────
  updateLiveLocation: (orderId, coords) => {
    set((state) => ({
      myOrders: state.myOrders.map(o => 
        o._id === orderId ? { ...o, currentLocation: coords } : o
      ),
      allOrders: state.allOrders.map(o => 
        o._id === orderId ? { ...o, currentLocation: coords } : o
      )
    }))
  }
}))

export default useOrderStore