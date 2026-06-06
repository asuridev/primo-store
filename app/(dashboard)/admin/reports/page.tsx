import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { BarChart3, Package, TrendingUp, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { SalesChart } from './sales-chart'
import { CsvExport } from './csv-export'

const TABS = [
  { id: 'sales',      label: 'Ventas',     icon: TrendingUp  },
  { id: 'inventory',  label: 'Inventario', icon: Package     },
  { id: 'financial',  label: 'Financiero', icon: BarChart3   },
  { id: 'warranties', label: 'Garantías',  icon: ShieldCheck },
]

function defaultDates() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: from.toISOString().slice(0, 10),
    to:   now.toISOString().slice(0, 10),
  }
}

function groupByDay(rows: { created_at: string; total: number }[]) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + Number(r.total))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, total]) => ({ label: d.slice(5), total }))
}

async function getSalesData(from: string, to: string) {
  const supabase = await createClient()
  const toFull   = to + 'T23:59:59'

  const [{ data: sales }, { data: topVariants }, { data: topCustomers }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, consecutive_number, customer_name, total, created_at, status')
      .eq('status', 'completed')
      .gte('created_at', from)
      .lte('created_at', toFull)
      .order('created_at', { ascending: true }),
    supabase
      .from('sale_items')
      .select('quantity, unit_price, subtotal, product_variants(sku, color, size_value, products(name))')
      .gte('created_at', from)
      .lte('created_at', toFull),
    supabase
      .from('sales')
      .select('customer_name, customer_email, total')
      .eq('status', 'completed')
      .gte('created_at', from)
      .lte('created_at', toFull),
  ])

  const totalRevenue = (sales ?? []).reduce((s, r) => s + Number(r.total), 0)
  const avgSale      = sales?.length ? totalRevenue / sales.length : 0
  const chartData    = groupByDay((sales ?? []).map(s => ({ created_at: s.created_at, total: Number(s.total) })))

  type PA = { sku: string; name: string; variant: string; units: number; revenue: number }
  const prodMap = new Map<string, PA>()
  ;(topVariants ?? []).forEach((si: any) => {
    const pv   = si.product_variants
    const key  = pv?.sku ?? 'unknown'
    const prev = prodMap.get(key) ?? {
      sku: pv?.sku ?? '', name: pv?.products?.name ?? '',
      variant: [pv?.color, pv?.size_value ? `T.${pv.size_value}` : null].filter(Boolean).join(' ') || '-',
      units: 0, revenue: 0,
    }
    prodMap.set(key, { ...prev, units: prev.units + si.quantity, revenue: prev.revenue + Number(si.subtotal) })
  })
  const topProducts = Array.from(prodMap.values()).sort((a, b) => b.units - a.units).slice(0, 20)

  type CA = { name: string; email: string; count: number; total: number }
  const custMap = new Map<string, CA>()
  ;(topCustomers ?? []).forEach((s: any) => {
    const key  = s.customer_email || s.customer_name
    const prev = custMap.get(key) ?? { name: s.customer_name, email: s.customer_email, count: 0, total: 0 }
    custMap.set(key, { ...prev, count: prev.count + 1, total: prev.total + Number(s.total) })
  })
  const topCust = Array.from(custMap.values()).sort((a, b) => b.total - a.total).slice(0, 15)

  return { sales: sales ?? [], totalRevenue, avgSale, chartData, topProducts, topCust }
}

async function getInventoryData() {
  const supabase = await createClient()
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, sku, color, size_value, stock, min_stock, avg_cost, sale_price, products(name, categories(name))')
    .eq('is_active', true)
    .order('stock', { ascending: true })

  const all        = variants ?? []
  const totalValue = all.reduce((s, v: any) => s + v.stock * Number(v.avg_cost), 0)
  const outOfStock = all.filter((v: any) => v.stock === 0).length
  const lowStock   = all.filter((v: any) => v.stock > 0 && v.stock <= v.min_stock).length

  return { variants: all, totalValue, outOfStock, lowStock }
}

async function getFinancialData(from: string, to: string) {
  const supabase = await createClient()
  const toFull   = to + 'T23:59:59'

  const { data: items } = await supabase
    .from('sale_items')
    .select('quantity, unit_price, unit_cost_snapshot, product_variants(products(categories(name)))')
    .gte('created_at', from)
    .lte('created_at', toFull)

  type CatRow = { category: string; revenue: number; cost: number }
  const catMap = new Map<string, CatRow>()
  let totalRevenue = 0, totalCost = 0

  ;(items ?? []).forEach((si: any) => {
    const cat     = (si.product_variants?.products?.categories as any)?.name ?? 'Sin categoría'
    const revenue = si.quantity * Number(si.unit_price)
    const cost    = si.quantity * Number(si.unit_cost_snapshot)
    totalRevenue += revenue
    totalCost    += cost
    const prev = catMap.get(cat) ?? { category: cat, revenue: 0, cost: 0 }
    catMap.set(cat, { ...prev, revenue: prev.revenue + revenue, cost: prev.cost + cost })
  })

  const byCategory = Array.from(catMap.values())
    .map(r => ({ ...r, profit: r.revenue - r.cost, margin: r.revenue ? ((r.revenue - r.cost) / r.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  return { totalRevenue, totalCost, totalProfit: totalRevenue - totalCost, byCategory }
}

async function getWarrantiesData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('warranties_exchanges')
    .select(`id, type, reason, status, created_at,
      sales!original_sale_id(consecutive_number, customer_name),
      profiles!handled_by(full_name)`)
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as any[]
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; from?: string; to?: string }>
}) {
  const sp   = await searchParams
  const tab  = sp.tab ?? 'sales'
  const { from: defFrom, to: defTo } = defaultDates()
  const from = sp.from ?? defFrom
  const to   = sp.to   ?? defTo

  const needsDates = tab === 'sales' || tab === 'financial'

  const [sd, id, fd, wd] = await Promise.all([
    needsDates           ? getSalesData(from, to)      : Promise.resolve(null),
    tab === 'inventory'  ? getInventoryData()           : Promise.resolve(null),
    tab === 'financial'  ? getFinancialData(from, to)  : Promise.resolve(null),
    tab === 'warranties' ? getWarrantiesData()          : Promise.resolve([] as any[]),
  ])

  const salesData     = sd
  const inventoryData = id
  const financialData = fd
  const warranties    = wd as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Analiza el rendimiento del negocio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <Link
              key={t.id}
              href={`/admin/reports?tab=${t.id}&from=${from}&to=${to}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Date filter */}
      {needsDates && (
        <form className="flex gap-3 items-end flex-wrap">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" name="from" defaultValue={from}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" name="to" defaultValue={to}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <button type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            Aplicar
          </button>
        </form>
      )}

      {/* VENTAS */}
      {tab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Ventas completadas" value={String(salesData.sales.length)} />
            <Kpi label="Ingresos totales"   value={formatCurrency(salesData.totalRevenue)} />
            <Kpi label="Promedio por venta" value={formatCurrency(salesData.avgSale)} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Ventas diarias</h2>
            <SalesChart data={salesData.chartData} />
          </div>

          <ReportTable
            title="Top productos más vendidos"
            headers={['#', 'SKU', 'Producto', 'Variante', 'Unidades', 'Ingresos']}
            csvFilename={`top-productos-${from}-${to}.csv`}
            csvData={salesData.topProducts.map(p => ({
              SKU: p.sku, Producto: p.name, Variante: p.variant,
              'Unidades vendidas': p.units, Ingresos: p.revenue,
            }))}
            empty={salesData.topProducts.length === 0}
            colSpan={6}
          >
            {salesData.topProducts.map((p, i) => (
              <tr key={p.sku} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-bold text-sm">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-gray-900 text-sm">{p.name}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{p.variant}</td>
                <td className="px-4 py-3 font-semibold text-sm">{p.units}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </ReportTable>

          <ReportTable
            title="Top clientes"
            headers={['Cliente', 'Email', 'Compras', 'Total']}
            csvFilename={`top-clientes-${from}-${to}.csv`}
            csvData={salesData.topCust.map(c => ({
              Cliente: c.name, Email: c.email,
              'Nro. compras': c.count, 'Total comprado': c.total,
            }))}
            empty={salesData.topCust.length === 0}
            colSpan={4}
          >
            {salesData.topCust.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 text-sm">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{c.email}</td>
                <td className="px-4 py-3 text-sm">{c.count}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{formatCurrency(c.total)}</td>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}

      {/* INVENTARIO */}
      {tab === 'inventory' && inventoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Kpi label="Referencias activas"  value={String(inventoryData.variants.length)} />
            <Kpi label="Valor del inventario" value={formatCurrency(inventoryData.totalValue)} />
            <Kpi label="Stock bajo"           value={String(inventoryData.lowStock)} highlight="amber" />
            <Kpi label="Agotados"             value={String(inventoryData.outOfStock)} highlight="red" />
          </div>

          <ReportTable
            title="Inventario actual"
            headers={['SKU', 'Producto', 'Categoría', 'Variante', 'Stock', 'Mín.', 'CPP', 'Precio', 'Valor']}
            csvFilename="inventario-actual.csv"
            csvData={inventoryData.variants.map((v: any) => ({
              SKU: v.sku, Producto: v.products?.name ?? '',
              Categoría: (v.products?.categories as any)?.name ?? '',
              Color: v.color ?? '', Talla: v.size_value ?? '',
              Stock: v.stock, 'Stock mínimo': v.min_stock,
              'Costo promedio': v.avg_cost, 'Precio venta': v.sale_price,
              'Valor en inventario': v.stock * Number(v.avg_cost),
            }))}
            empty={inventoryData.variants.length === 0}
            colSpan={9}
          >
            {inventoryData.variants.map((v: any) => {
              const isOut = v.stock === 0
              const isLow = !isOut && v.stock <= v.min_stock
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{v.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm max-w-[140px] truncate">{v.products?.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{(v.products?.categories as any)?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {[v.color, v.size_value ? `T.${v.size_value}` : null].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                      {v.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{v.min_stock}</td>
                  <td className="px-4 py-3 text-gray-700 text-sm">{formatCurrency(Number(v.avg_cost))}</td>
                  <td className="px-4 py-3 text-gray-700 text-sm">{formatCurrency(Number(v.sale_price))}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{formatCurrency(v.stock * Number(v.avg_cost))}</td>
                </tr>
              )
            })}
          </ReportTable>
        </div>
      )}

      {/* FINANCIERO */}
      {tab === 'financial' && financialData && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Kpi label="Ingresos brutos" value={formatCurrency(financialData.totalRevenue)} />
            <Kpi label="Costo de ventas" value={formatCurrency(financialData.totalCost)} />
            <Kpi label="Utilidad bruta"  value={formatCurrency(financialData.totalProfit)} highlight="green" />
            <Kpi
              label="Margen bruto"
              value={financialData.totalRevenue
                ? `${((financialData.totalProfit / financialData.totalRevenue) * 100).toFixed(1)}%`
                : '—'}
              highlight="green"
            />
          </div>

          <ReportTable
            title="Utilidad por categoría"
            headers={['Categoría', 'Ingresos', 'Costo ventas', 'Utilidad', 'Margen %']}
            csvFilename={`utilidad-categorias-${from}-${to}.csv`}
            csvData={financialData.byCategory.map(r => ({
              Categoría: r.category, Ingresos: r.revenue,
              'Costo de ventas': r.cost, Utilidad: r.profit,
              'Margen %': r.margin.toFixed(2),
            }))}
            empty={financialData.byCategory.length === 0}
            colSpan={5}
          >
            {financialData.byCategory.map(r => (
              <tr key={r.category} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 text-sm">{r.category}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">{formatCurrency(r.revenue)}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">{formatCurrency(r.cost)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-700 text-sm">{formatCurrency(r.profit)}</td>
                <td className="px-4 py-3 font-semibold text-sm">{r.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}

      {/* GARANTÍAS */}
      {tab === 'warranties' && (
        <ReportTable
          title={`Garantías y cambios (${warranties.length})`}
          headers={['Tipo', 'Venta', 'Cliente', 'Razón', 'Estado', 'Atendido por', 'Fecha']}
          csvFilename="garantias-cambios.csv"
          csvData={warranties.map((w: any) => ({
            Tipo: w.type === 'warranty' ? 'Garantía' : 'Cambio',
            'Venta original': `#${String((w.sales as any)?.consecutive_number ?? '').padStart(6, '0')}`,
            Cliente: (w.sales as any)?.customer_name ?? '',
            Razón: w.reason, Estado: w.status,
            Atendido_por: (w.profiles as any)?.full_name ?? '',
            Fecha: w.created_at?.slice(0, 10),
          }))}
          empty={warranties.length === 0}
          colSpan={7}
        >
          {warranties.map((w: any) => {
            const statusCls: Record<string, string> = {
              pending:  'bg-amber-50 text-amber-700',
              resolved: 'bg-green-50 text-green-700',
              rejected: 'bg-red-50 text-red-700',
            }
            const statusLabel: Record<string, string> = {
              pending: 'Pendiente', resolved: 'Resuelto', rejected: 'Rechazado',
            }
            return (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    w.type === 'warranty' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {w.type === 'warranty' ? 'Garantía' : 'Cambio'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  #{String((w.sales as any)?.consecutive_number ?? '').padStart(6, '0')}
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">{(w.sales as any)?.customer_name}</td>
                <td className="px-4 py-3 text-gray-600 text-sm max-w-[180px] truncate">{w.reason}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls[w.status] ?? ''}`}>
                    {statusLabel[w.status] ?? w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{(w.profiles as any)?.full_name}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(w.created_at)}</td>
              </tr>
            )
          })}
        </ReportTable>
      )}
    </div>
  )
}

function Kpi({ label, value, highlight }: {
  label: string; value: string; highlight?: 'green' | 'amber' | 'red'
}) {
  const cls = highlight === 'green' ? 'text-emerald-600'
    : highlight === 'amber' ? 'text-amber-600'
    : highlight === 'red'   ? 'text-red-600'
    : 'text-gray-900'
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  )
}

function ReportTable({ title, headers, csvFilename, csvData, children, empty, colSpan }: {
  title: string
  headers: string[]
  csvFilename: string
  csvData: Record<string, string | number | null>[]
  children: React.ReactNode
  empty: boolean
  colSpan: number
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <CsvExport filename={csvFilename} data={csvData} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empty
              ? <tr><td colSpan={colSpan} className="text-center py-10 text-gray-400 text-sm">Sin datos</td></tr>
              : children}
          </tbody>
        </table>
      </div>
    </div>
  )
}
