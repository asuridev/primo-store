'use client'

import { useState } from 'react'
import { PackagePlus, Loader2 } from 'lucide-react'
import { registerStockEntry } from '@/lib/actions/products'
import { useRouter } from 'next/navigation'

interface Props {
  variantId: string
  variantDesc: string
  suppliers: { id: string; name: string }[]
}

export function StockEntryModal({ variantId, variantDesc, suppliers }: Props) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quantity || !unitCost) { setError('Cantidad y costo son obligatorios'); return }
    setLoading(true); setError('')

    const result = await registerStockEntry(
      variantId, Number(quantity), Number(unitCost),
      supplierId || undefined, notes || undefined
    )

    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }

    setOpen(false); setLoading(false)
    setQuantity(''); setUnitCost(''); setSupplierId(''); setNotes('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600
                   hover:text-gray-900 border border-gray-200 px-2.5 py-1.5 rounded-lg
                   hover:bg-gray-50 transition-colors"
      >
        <PackagePlus className="w-3.5 h-3.5" />
        Entrada
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">Registrar entrada de stock</h3>
            <p className="text-sm text-gray-500 mb-5">{variantDesc}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad *</label>
                  <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo unitario *</label>
                  <input type="number" min={0} value={unitCost} onChange={e => setUnitCost(e.target.value)} required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              {suppliers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Proveedor (opcional)</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Sin proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
