'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createVariant } from '@/lib/actions/products'
import { useRouter } from 'next/navigation'

const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const NUMBER_SIZES = ['28', '30', '32', '34', '36', '38', '40']

interface Props {
  productId: string
  suppliers: { id: string; name: string }[]
}

export function AddVariantModal({ productId, suppliers }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [form, setForm] = useState({
    color: '', size_type: 'letter', size_value: '',
    quality: '', reference: '', barcode: '',
    purchase_price: '', sale_price: '', min_stock: '3', initial_stock: '0',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sale_price) { setError('El precio de venta es obligatorio'); return }
    setLoading(true); setError('')

    const result = await createVariant(productId, {
      color:          form.color      || undefined,
      size_type:      form.size_type  || undefined,
      size_value:     form.size_value || undefined,
      quality:        form.quality    || undefined,
      reference:      form.reference  || undefined,
      barcode:        form.barcode    || undefined,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price:     Number(form.sale_price),
      min_stock:      Number(form.min_stock) || 3,
      initial_stock:  Number(form.initial_stock) || 0,
      initial_cost:   Number(form.purchase_price) || 0,
    })

    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }

    setOpen(false); setLoading(false)
    setForm({ color: '', size_type: 'letter', size_value: '', quality: '', reference: '', barcode: '', purchase_price: '', sale_price: '', min_stock: '3', initial_stock: '0' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600
                   hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
        <Plus className="w-4 h-4" /> Nueva variante
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-5">Nueva variante</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="Azul, Negro..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo talla</label>
                  <select value={form.size_type} onChange={e => set('size_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900">
                    <option value="letter">Letra</option>
                    <option value="number">Número</option>
                    <option value="one_size">Talla única</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                  {form.size_type === 'one_size' ? (
                    <input disabled placeholder="Talla única" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                  ) : (
                    <select value={form.size_value} onChange={e => set('size_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900">
                      <option value="">Seleccionar...</option>
                      {(form.size_type === 'letter' ? LETTER_SIZES : NUMBER_SIZES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio compra</label>
                  <input type="number" min={0} value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio venta *</label>
                  <input type="number" min={0} value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="0" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label>
                  <input type="number" min={0} value={form.min_stock} onChange={e => set('min_stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad inicial</label>
                  <input type="number" min={0} value={form.initial_stock} onChange={e => set('initial_stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Referencia</label>
                  <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código de barras</label>
                  <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar variante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
