'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, Package, Plus, Minus, Trash2, ShoppingCart,
         User, Mail, Phone, Tag, CheckCircle, Loader2, X, History } from 'lucide-react'
import { createSale } from '@/lib/actions/sales'
import { formatCurrency } from '@/lib/utils/format'
import Link from 'next/link'

interface Variant {
  id: string; sku: string; color: string | null; size_type: string | null
  size_value: string | null; sale_price: number; stock: number
}

interface Product {
  id: string; name: string; image_url: string | null
  categories: { name: string } | null
  product_variants: Variant[]
}

interface CartItem {
  variantId: string; productName: string; imageUrl: string | null
  color: string | null; sizeValue: string | null; price: number
  quantity: number; maxStock: number
}

interface Discount { id: string; name: string; type: 'percentage' | 'fixed'; value: number }

interface Props {
  products: Product[]
  discounts: Discount[]
}

function pad(n: number) { return String(n).padStart(6, '0') }

export function POSClient({ products, discounts }: Props) {
  const [search, setSearch]       = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart]           = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discountId, setDiscountId] = useState('')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState<{ saleId: string; consecutive: number } | null>(null)
  const [error, setError]         = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.categories as any)?.name?.toLowerCase().includes(q) ||
      p.product_variants.some(v => v.sku.toLowerCase().includes(q))
    )
  }, [products, search])

  const selectedDiscount = discounts.find(d => d.id === discountId)

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmount = selectedDiscount
    ? selectedDiscount.type === 'percentage'
      ? Math.round(subtotal * selectedDiscount.value / 100)
      : Math.min(selectedDiscount.value, subtotal)
    : 0
  const total = subtotal - discountAmount

  function addToCart(product: Product, variant: Variant) {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id)
      if (existing) {
        if (existing.quantity >= variant.stock) return prev
        return prev.map(i => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        variantId: variant.id, productName: product.name, imageUrl: product.image_url,
        color: variant.color, sizeValue: variant.size_value,
        price: variant.sale_price, quantity: 1, maxStock: variant.stock,
      }]
    })
    setSelectedProduct(null)
  }

  function updateQty(variantId: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.variantId !== variantId) return i
      const q = i.quantity + delta
      if (q <= 0) return i
      if (q > i.maxStock) return i
      return { ...i, quantity: q }
    }))
  }

  function removeItem(variantId: string) {
    setCart(prev => prev.filter(i => i.variantId !== variantId))
  }

  async function handleConfirm() {
    if (!customerName.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (!customerEmail.trim()) { setError('El correo del cliente es obligatorio'); return }
    if (cart.length === 0) { setError('Agrega al menos un producto'); return }
    setLoading(true); setError('')

    const result = await createSale({
      customer_name:  customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim() || undefined,
      discount_id:    discountId || undefined,
      items: cart.map(i => ({ variant_id: i.variantId, quantity: i.quantity, unit_price: i.price })),
      notes: notes.trim() || undefined,
    })

    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }
    setSuccess({ saleId: result.saleId!, consecutive: result.consecutive! })
    setLoading(false)
  }

  function resetPOS() {
    setCart([]); setCustomerName(''); setCustomerEmail('')
    setCustomerPhone(''); setDiscountId(''); setNotes('')
    setSearch(''); setSelectedProduct(null); setSuccess(null); setError('')
    searchRef.current?.focus()
  }

  // Success modal
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Venta #{pad(success.consecutive)} registrada
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Comprobante enviado a <strong>{customerEmail}</strong>
          </p>
          <div className="flex gap-3">
            <Link href={`/sales/${success.saleId}`}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50">
              Ver venta
            </Link>
            <button onClick={resetPOS}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800">
              Nueva venta
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 -mx-6 -mt-6">

      {/* LEFT — Product Search */}
      <div className="w-[340px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Productos</h2>
            <Link href="/sales/history"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900">
              <History className="w-3.5 h-3.5" /> Historial
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm">{search ? 'Sin resultados' : 'Sin productos disponibles'}</p>
            </div>
          )}
          {filteredProducts.map(product => (
            <button key={product.id}
              onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors
                ${selectedProduct?.id === product.id
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-50 text-gray-900 border border-transparent hover:border-gray-200'}`}>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  : <Package className="w-5 h-5 text-gray-400 m-2.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className={`text-xs ${selectedProduct?.id === product.id ? 'text-gray-300' : 'text-gray-500'}`}>
                  {(product.categories as any)?.name} · {product.product_variants.length} variante(s)
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Variant selector */}
        {selectedProduct && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-[280px] overflow-y-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                {selectedProduct.image_url
                  ? <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  : <Package className="w-6 h-6 text-gray-400 m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">{(selectedProduct.categories as any)?.name}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {selectedProduct.product_variants.map(v => {
                const desc = [v.color, v.size_value ? `T. ${v.size_value}` : null].filter(Boolean).join(' / ')
                const inCart = cart.find(i => i.variantId === v.id)
                return (
                  <button key={v.id}
                    onClick={() => addToCart(selectedProduct, v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200
                               rounded-xl hover:border-gray-400 hover:shadow-sm transition-all text-left">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{desc || 'Talla única'}</p>
                      <p className="text-xs text-gray-500">Stock: {v.stock}{inCart ? ` (${inCart.quantity} en carrito)` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(v.sale_price)}</p>
                      <Plus className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* CENTER — Cart */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Pedido en curso</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)} unidades
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {cart.length === 0 && (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-3" />
              <p className="text-sm">Selecciona productos en el panel izquierdo</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.variantId}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  : <Package className="w-6 h-6 text-gray-400 m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {[item.color, item.sizeValue ? `T. ${item.sizeValue}` : null].filter(Boolean).join(' / ') || 'Talla única'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(item.price)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.variantId, -1)}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.variantId, 1)}
                  disabled={item.quantity >= item.maxStock}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="w-24 text-right text-sm font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
              <button onClick={() => removeItem(item.variantId)} className="text-red-400 hover:text-red-600 ml-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Descuento ({selectedDiscount?.name})</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Customer + Confirm */}
      <div className="w-[300px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" /> Datos del cliente
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Correo <span className="text-red-500">*</span></span>
            </label>
            <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</span>
            </label>
            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {discounts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Descuento</span>
              </label>
              <select value={discountId} onChange={e => setDiscountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">Sin descuento</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Observaciones opcionales..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>{cart.length} producto(s)</span>
            <span className="font-semibold text-gray-900 text-sm">{formatCurrency(total)}</span>
          </div>

          <button onClick={handleConfirm} disabled={loading || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-gray-800
                       disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? 'Procesando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
