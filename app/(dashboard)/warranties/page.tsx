import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatDate } from '@/lib/utils/format'
import { ShieldCheck, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const typeLabel: Record<string, { label: string; cls: string }> = {
  warranty: { label: 'Garantía', cls: 'bg-blue-50 text-blue-700' },
  exchange:  { label: 'Cambio',   cls: 'bg-violet-50 text-violet-700' },
}
const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700' },
  resolved: { label: 'Resuelto',   cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rechazado',  cls: 'bg-red-50 text-red-700' },
}

export default async function WarrantiesPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('warranties_exchanges')
    .select(`
      id, type, reason, status, created_at,
      sales!original_sale_id(consecutive_number, customer_name),
      profiles!handled_by(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garantías y Cambios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items?.length ?? 0} registros</p>
        </div>
        <Link href="/warranties/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Registrar
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!items || items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShieldCheck className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay garantías o cambios registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Comprobante', 'Cliente', 'Tipo', 'Motivo', 'Estado', 'Fecha', 'Atendido por'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => {
                const t = typeLabel[item.type] ?? typeLabel.warranty
                const s = statusLabel[item.status] ?? statusLabel.pending
                const consecutive = (item.sales as any)?.consecutive_number
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/sales/${(item.sales as any)?.id ?? ''}`}
                        className="flex items-center gap-1 font-mono text-sm font-medium text-gray-900 hover:underline">
                        #{String(consecutive ?? 0).padStart(6, '0')}
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{(item.sales as any)?.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.cls}`}>{t.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-gray-600">{(item.profiles as any)?.full_name}</td>
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
