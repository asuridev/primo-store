import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function pad(n: number) { return String(n).padStart(6, '0') }

const statusLabel: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700' },
  exchanged:  { label: 'Cambiada',   cls: 'bg-amber-50 text-amber-700' },
}

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('sales')
    .select(`
      id, consecutive_number, customer_name, customer_email,
      subtotal, discount_amount, total, status, created_at,
      profiles!created_by(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (sp.from)   query = query.gte('created_at', sp.from)
  if (sp.to)     query = query.lte('created_at', sp.to + 'T23:59:59')
  if (sp.status) query = query.eq('status', sp.status)

  const { data: sales } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sales" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sales?.length ?? 0} registros</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input type="date" name="from" defaultValue={sp.from}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input type="date" name="to" defaultValue={sp.to}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
          <select name="status" defaultValue={sp.status ?? ''}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Todos</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="exchanged">Cambiadas</option>
          </select>
        </div>
        <button type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
          Filtrar
        </button>
        <Link href="/sales/history" className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
          Limpiar
        </Link>
      </form>

      <div className="bg-white rounded-xl border border-gray-200">
        {!sales || sales.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShoppingBag className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay ventas con estos filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['N°', 'Cliente', 'Vendedor', 'Fecha', 'Total', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((s: any) => {
                const st = statusLabel[s.status] ?? statusLabel.completed
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/sales/${s.id}`}
                        className="font-mono text-sm font-medium text-gray-900 hover:underline">
                        #{pad(s.consecutive_number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.customer_name}</p>
                      <p className="text-xs text-gray-500">{s.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(s.profiles as any)?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(s.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(s.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
