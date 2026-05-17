import { create } from 'zustand'
import { harvestAPI } from '../api'
import toast from 'react-hot-toast'

const useHarvestStore = create((set, get) => ({
  requests:       [],
  factoryRequests:[],
  loading:        false,

  // ─── Farmer: Request pathvto ──────────────────────────
  postRequest: async (factoryId, factoryName, ownerId, data) => {
    set({ loading: true })
    try {
      const res = await harvestAPI.postRequest({
        factoryId,
        factoryName,
        ownerId,
        cropType:  data.cropType,
        acres:     data.acres,
        date:      data.date,
        village:   data.village,
        location:  data.location || '',
        notes:     data.notes    || '',
        photo:     data.photo    || '',
      })
      set((state) => ({
        requests: [res.data, ...state.requests],
        loading:  false,
      }))
      return res.data._id
    } catch (err) {
      set({ loading: false })
      toast.error(err.response?.data?.message || 'Failed to send request!')
      return null
    }
  },

  // ─── Farmer: Mazi requests load karo ─────────────────
  fetchMyRequests: async () => {
    set({ loading: true })
    try {
      const res = await harvestAPI.getMyRequests()
      set({ requests: res.data, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  // ─── Owner: Factory requests load karo ───────────────
  fetchFactoryRequests: async () => {
    set({ loading: true })
    try {
      const res = await harvestAPI.getFactoryRequests()
      set({ factoryRequests: res.data, loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  // ─── Owner: Accept / Reject ───────────────────────────
  updateRequestStatus: async (requestId, status, factoryNote = '') => {
    try {
      const res = await harvestAPI.updateStatus(requestId, { status, factoryNote })
      set((state) => ({
        factoryRequests: state.factoryRequests.map(r =>
          r._id === requestId ? res.data : r
        )
      }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed!')
    }
  },

  // ─── Farmer: Cancel ───────────────────────────────────
  cancelRequest: async (requestId) => {
    try {
      await harvestAPI.cancelRequest(requestId)
      set((state) => ({
        requests: state.requests.map(r =>
          r._id === requestId ? { ...r, status: 'cancelled' } : r
        )
      }))
      toast('Request cancelled successfully.', { icon: '❌' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed!')
    }
  },

  // ─── Getters ──────────────────────────────────────────
  getFarmerRequests:    ()          => get().requests,
  getAllOpenRequests:    ()          => get().requests.filter(r => r.status === 'open'),
  getAllRequests:        ()          => get().factoryRequests,
}))

export default useHarvestStore