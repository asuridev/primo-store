export interface CartItem {
  variantId: string
  productId: string
  productName: string
  productImageUrl: string | null
  variantDescription: string // ej: "Azul / Talla 32"
  color: string | null
  sizeValue: string | null
  sku: string
  unitPrice: number
  quantity: number
  availableStock: number
}

export interface CartCustomer {
  id: string | null   // null si es cliente nuevo (no guardado aún)
  fullName: string
  email: string
  phone: string
}

export interface CartDiscount {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
}

export interface CartState {
  items: CartItem[]
  customer: CartCustomer | null
  discount: CartDiscount | null
  notes: string
  // computed
  subtotal: number
  discountAmount: number
  total: number
}
