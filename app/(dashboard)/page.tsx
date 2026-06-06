import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle,
  XCircle, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const yearStart  = new Date(now.getFullYear(), 0, 1).toISOString()

  const [
    { data: salesToday },
    { data: salesMonth },
    { data: inventoryValue },
    { data: outOfStock },
    { data: lowStock },
    { data: topProducts },
    { data: recentSales },
    { data: alerts },
  ] = await Promise.all([
    supabase.from('sales').select('total').eq('status', 'completed').gte('created_at', todayStart),
    supabase.from('sales').select('total').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('product_variants').select('stock, avg_cost').eq('is_active', true).gt('stock', 0),
    supabase.from('product_variants').select('id').eq('is_active', true).eq('stock', 0),
    supabase.from('v_low_stock_alerts').select('id').eq('alert_type', 'low_stock'),
    supabase
      .from('sale_items')
      .select('quantity, unit_price, product_variants(products(name, image_url))')
      .gte('created_at', monthStart)
      .limit(100),
    supabase
      .from('sales')
      .select('id, consecutive_number, customer_name, total, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('v_low_stock_alerts').select('*').order('stock').limit(5),
  ])

  const todayRevenue  = (salesToday  ?? []).reduce((s, r) => s + Number(r.total), 0)
  const monthRevenue  = (salesMonth  ?? []).reduce((s, r) => s + Number(r.total), 0)
  const invValue      = (inventoryValue ?? []).reduce((s, r) => s + r.stock * Number(r.avg_cost), 0)
  const outCount      = outOfStock?.length ?? 0
  const lowCount      = lowStock?.length ?? 0

  // top products aggregation
  type ProductAgg = { name: string; image_url: string | null; units: number; revenue: number }
  const productMap = new Map<string, ProductAgg>()
  ;(topProducts ?? []).forEach((item: any) => {
    const name = item.product_variants?.products?.name ?? 'Desconocido'
    const img  = item.product_variants?.products?.image_url ?? null
    const prev = productMap.get(name) ?? { name, image_url: img, units: 0, revenue: 0 }
    productMap.set(name, {
      ...prev,
      units:   prev.units   + item.quantity,
      revenue: prev.revenue + (item.quantity * Number(item.unit_price)),
    })
  })
  const top5 = Array.from(productMap.values()).sort((a, b) => b.units - a.units).slice(0, 5)

  return {
    todayRevenue, monthRevenue, invValue,
    outCount, lowCount,
    top5, recentSales: recentSales ?? [],
    alerts: alerts ?? [],
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ventas hoy"
          value={formatCurrency(d.todayRevenue)}
          icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
        />
        <KpiCard
          label="Ventas del mes"
          value={formatCurrency(d.monthRevenue)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
        />
        <KpiCard
          label="Valor inventario"
          value={formatCurrency(d.invValue)}
          icon={<Package className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
        />
        <KpiCard
          label="Alertas de stock"
          value={`${d.outCount + d.lowCount}`}
          sub={`${d.outCount} agotados · ${d.lowCount} bajos`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          href="/inventory"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Ventas recientes</h2>
            <Link href="/sales/history" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {d.recentSales.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No hay ventas aún</p>
          ) : (
            <div className="space-y-1">
              {d.recentSales.map((sale: any) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{String(sale.consecutive_number).padStart(6,'0')} — {sale.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas + Top productos */}
        <div className="space-y-4">
          {/* Alertas de stock */}
          {d.alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Stock crítico</h2>
                <Link href="/inventory" className="text-xs text-gray-500 hover:text-gray-900">
                  Ver todo
                </Link>
              </div>
              <div className="space-y-2">
                {d.alerts.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      a.alert_type === 'out_of_stock' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{a.product_name}</p>
                      <p className="text-xs text-gray-500">
                        {[a.color, a.size_value ? `T.${a.size_value}` : null].filter(Boolean).join(' ')}
                        {' '}&mdash; {a.stock === 0 ? 'Agotado' : `${a.stock} uds`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top productos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Top productos del mes</h2>
            {d.top5.length === 0 ? (
              <p className="text-xs text-gray-400">Sin ventas este mes</p>
            ) : (
              <div className="space-y-2">
                {d.top5.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.units} uds vendidas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, icon, bg, href
}: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; bg: string; href?: string
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`${bg} p-2.5 rounded-xl`}>{icon}</div>
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
