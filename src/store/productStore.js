import { create } from 'zustand'
import { productAPI } from '../api'

const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true })
    try {
      const res = await productAPI.getAll()
      set({ products: res.data || [], loading: false })
    } catch (err) {
      set({ loading: false })
    }
  },

  updateProductLocal: (updatedProduct) => {
    set((state) => ({
      products: state.products.map(p => 
        p._id === updatedProduct._id ? updatedProduct : p
      )
    }))
  }
}))

export default useProductStore
