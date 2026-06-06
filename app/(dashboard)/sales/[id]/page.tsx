import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { ArrowLeft, Package, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ResendReceiptButton } from './resend-receipt-button'

function pad(n: number) { return String(n).padStart(6, '0') }

const statusLabel: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700' },
  exchanged:  { label: 'Cambiada',   cls: 'bg-amber-50 text-amber-700' },
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      id, consecutive_number, customer_name, customer_email, customer_phone,
      subtotal, discount_amount, total, status, notes, receipt_url, created_at,
      profiles!created_by(full_name),
      discounts(name, type, value),
      sale_items(
        id, quantity, unit_price, subtotal,
        product_variants(
          id, sku, color, size_value,
          products(name, image_url)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!sale) notFound()

  const st = statusLabel[(sale as any).status] ?? statusLabel.completed

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/sales/history" className="mt-1 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-xl font-bold text-gray-900">Venta #{pad((sale as any).consecutive_number)}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-sm text-gray-500">
            {formatDateTime((sale as any).created_at)} · Vendedor: {((sale as any).profiles as any)?.full_name}
          </p>
        </div>
        <div className="flex gap-2">
          {(sale as any).receipt_url && (
            <a href={(sale as any).receipt_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-sm rounded-xl hover:bg-gray-50">
              <ExternalLink className="w-4 h-4" /> PDF
            </a>
          )}
          <ResendReceiptButton saleId={sale.id} />
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Cliente</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-0.5">Nombre</p>
            <p className="font-medium text-gray-900">{(sale as any).customer_name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Correo</p>
            <p className="font-medium text-gray-900">{(sale as any).customer_email}</p>
          </div>
          {(sale as any).customer_phone && (
            <div>
              <p className="text-gray-500 mb-0.5">Teléfono</p>
              <p className="font-medium text-gray-900">{(sale as any).customer_phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Productos</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Producto', 'Variante', 'Cant.', 'P. Unit.', 'Subtotal'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((sale as any).sale_items ?? []).map((item: any) => {
              const variant = item.product_variants
              const product = variant?.products
              const desc = [variant?.color, variant?.size_value ? `T. ${variant.size_value}` : null]
                .filter(Boolean).join(' / ') || 'Talla única'
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {product?.image_url
                          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          : <Package className="w-4 h-4 text-gray-400 m-2.5" />}
                      </div>
                      <span className="font-medium text-gray-900">{product?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="px-6 py-5 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>{formatCurrency((sale as any).subtotal)}</span>
          </div>
          {(sale as any).discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Descuento{(sale as any).discounts ? ` (${((sale as any).discounts as any)?.name})` : ''}</span>
              <span>- {formatCurrency((sale as any).discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span><span>{formatCurrency((sale as any).total)}</span>
          </div>
        </div>
      </div>

      {(sale as any).notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Notas</h2>
          <p className="text-sm text-gray-600">{(sale as any).notes}</p>
        </div>
      )}
    </div>
  )
}
