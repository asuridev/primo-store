import { create } from 'zustand'
import type { CartItem, CartCustomer, CartDiscount } from '@/types/cart'

interface CartStore {
  items: CartItem[]
  customer: CartCustomer | null
  discount: CartDiscount | null
  notes: string

  // computed
  subtotal: () => number
  discountAmount: () => number
  total: () => number

  // actions
  addItem: (item: CartItem) => void
  updateQuantity: (variantId: string, qty: number) => void
  removeItem: (variantId: string) => void
  setCustomer: (customer: CartCustomer | null) => void
  setDiscount: (discount: CartDiscount | null) => void
  setNotes: (notes: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customer: null,
  discount: null,
  notes: '',

  subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  discountAmount: () => {
    const disc = get().discount
    const sub = get().subtotal()
    if (!disc) return 0
    if (disc.type === 'percentage') return Math.round(sub * disc.value / 100)
    return Math.min(disc.value, sub)
  },

  total: () => get().subtotal() - get().discountAmount(),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(i => i.variantId === item.variantId)
      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, item.availableStock)
        return {
          items: state.items.map(i =>
            i.variantId === item.variantId ? { ...i, quantity: newQty } : i
          ),
        }
      }
      return { items: [...state.items, item] }
    }),

  updateQuantity: (variantId, qty) =>
    set((state) => ({
      items: qty <= 0
        ? state.items.filter(i => i.variantId !== variantId)
        : state.items.map(i =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(qty, i.availableStock) }
              : i
          ),
    })),

  removeItem: (variantId) =>
    set((state) => ({ items: state.items.filter(i => i.variantId !== variantId) })),

  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),
  setNotes: (notes) => set({ notes }),

  clearCart: () => set({ items: [], customer: null, discount: null, notes: '' }),
}))
