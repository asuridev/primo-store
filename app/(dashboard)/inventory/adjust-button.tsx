'use client'

import { useState } from 'react'
import { SlidersHorizontal, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props { variantId: string; currentStock: number }

export function InventoryAdjustButton({ variantId, currentStock }: Props) {
  const [open, setOpen] = useState(false)
  const [newStock, setNewStock] = useState(currentStock)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!notes.trim()) { setError('La nota es obligatoria para ajustes manuales'); return }
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const delta = newStock - currentStock

    const { error: updateErr } = await supabase
      .from('product_variants')
      .update({ stock: newStock })
      .eq('id', variantId)

    if (updateErr) { setError('Error al actualizar stock'); setLoading(false); return }

    await supabase.from('inventory_movements').insert({
      variant_id: variantId,
      movement_type: 'manual_adjustment',
      quantity_before: currentStock,
      delta,
      quantity_after: newStock,
      notes: notes.trim(),
      performed_by: user.id,
    })

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setNewStock(currentStock); setNotes(''); setError('') }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600
                   hover:text-gray-900 border border-gray-200 px-2.5 py-1.5 rounded-lg
                   hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Ajustar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">Ajuste manual de stock</h3>
            <p className="text-sm text-gray-500 mb-5">Stock actual: <strong>{currentStock}</strong></p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva cantidad</label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={e => setNewStock(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {newStock !== currentStock && (
                  <p className="text-xs mt-1 text-gray-500">
                    Diferencia: {newStock > currentStock ? '+' : ''}{newStock - currentStock} unidades
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo del ajuste <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Conteo físico realizado, diferencia de inventario..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || newStock === currentStock}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white
                             text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
