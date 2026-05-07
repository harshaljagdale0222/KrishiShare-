import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find(i => i._id === product._id)
        if (existing) {
          set({
            items: get().items.map(i =>
              i._id === product._id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          })
        } else {
          set({ items: [...get().items, { ...product, quantity: 1 }] })
        }
      },

      removeItem: (id) => set({
        items: get().items.filter(i => i._id !== id)
      }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter(i => i._id !== id) })
        } else {
          set({
            items: get().items.map(i =>
              i._id === id ? { ...i, quantity } : i
            )
          })
        }
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    }),
    {
      name: 'krishi-cart',
    }
  )
)

export default useCartStore