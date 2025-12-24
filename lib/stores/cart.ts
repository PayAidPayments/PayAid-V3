import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  type: 'module' | 'bundle'
  moduleId?: string
  bundleId?: string
  name: string
  price: number
  tier?: 'starter' | 'professional'
  modules?: string[]
}

interface CartStore {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'id'>) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (item) => {
        const id = `${item.type}-${item.moduleId || item.bundleId}-${item.tier || 'default'}`
        set((state) => {
          // Check if item already exists
          const existingIndex = state.items.findIndex((i) => i.id === id)
          if (existingIndex >= 0) {
            // Update existing item
            const newItems = [...state.items]
            newItems[existingIndex] = { ...item, id }
            return { items: newItems }
          }
          // Add new item
          return { items: [...state.items, { ...item, id }] }
        })
      },
      removeFromCart: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },
      getItemCount: () => {
        return get().items.length
      },
    }),
    {
      name: 'payaid-cart',
    }
  )
)

