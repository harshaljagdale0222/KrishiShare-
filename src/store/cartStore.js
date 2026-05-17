import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1) => {
        if (qty <= 0) return;
        const existing = get().items.find(i => i._id === product._id)
        const currentQty = existing ? existing.quantity : 0;
        const maxStock = product.stock || 999;

        if (currentQty + qty > maxStock) {
          import('react-hot-toast').then(t => t.default.error(`Fakt ${maxStock} stock shillak aahe!`));
          if (existing) return; // Don't add more if already at limit
          qty = maxStock; // If adding fresh, cap it
        }

        if (existing) {
          set({
            items: get().items.map(i =>
              i._id === product._id
                ? { ...i, quantity: Math.min(maxStock, i.quantity + qty) }
                : i
            )
          })
        } else {
          set({ items: [...get().items, { ...product, quantity: Math.min(maxStock, qty) }] })
        }
      },

      removeItem: (id) => set({
        items: get().items.filter(i => i._id !== id)
      }),

      updateQuantity: (id, quantity) => {
        const item = get().items.find(i => i._id === id);
        if (!item) return;

        const maxStock = item.stock || 999;
        if (quantity > maxStock) {
          import('react-hot-toast').then(t => t.default.error(`Fakt ${maxStock} stock shillak aahe!`));
          quantity = maxStock;
        }

        set({
          items: get().items
            .map(i => i._id === id ? { ...i, quantity: Math.max(0, quantity) } : i)
            .filter(i => i.quantity > 0)
        })
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