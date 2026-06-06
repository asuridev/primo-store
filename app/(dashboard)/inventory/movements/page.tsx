import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils/format'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  purchase:          { label: 'Compra',          color: 'text-blue-700 bg-blue-50 border-blue-200'   },
  initial_stock:     { label: 'Stock inicial',   color: 'text-violet-700 bg-violet-50 border-violet-200' },
  sale:              { label: 'Venta',            color: 'text-red-700 bg-red-50 border-red-200'      },
  return_sale:       { label: 'Devolución',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  exchange_out:      { label: 'Cambio (salida)',  color: 'text-orange-700 bg-orange-50 border-orange-200' },
  exchange_in:       { label: 'Cambio (entrada)', color: 'text-teal-700 bg-teal-50 border-teal-200'   },
  manual_adjustment: { label: 'Ajuste manual',   color: 'text-gray-700 bg-gray-50 border-gray-200'   },
}

export default async function MovementsPage() {
  const supabase = await createClient()

  const { data: movements } = await supabase
    .from('inventory_movements')
    .select(`
      id, movement_type, quantity_before, delta, quantity_after,
      unit_cost, notes, created_at,
      product_variants(
        sku, color, size_value,
        products(name, image_url)
      ),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historial de movimientos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Trazabilidad completa del inventario</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!movements?.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto / Variante</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Antes</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cambio</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Después</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => {
                  const cfg = MOVEMENT_LABELS[m.movement_type] ?? { label: m.movement_type, color: 'text-gray-700 bg-gray-50 border-gray-200' }
                  const variant = m.product_variants as any
                  const variantDesc = [variant?.color, variant?.size_value ? `T.${variant.size_value}` : null].filter(Boolean).join(' / ')

                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {variant?.products?.image_url ? (
                            <img src={variant.products.image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{variant?.products?.name}</p>
                            <p className="text-xs text-gray-500">{variantDesc || 'Talla única'} · {variant?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{m.quantity_before}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${m.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.delta > 0 ? '+' : ''}{m.delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{m.quantity_after}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {(m.profiles as any)?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                        {m.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
