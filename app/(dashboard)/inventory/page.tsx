import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'
import { StockBadge } from '@/components/inventory/stock-badge'
import { Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { InventoryAdjustButton } from './adjust-button'

interface SearchParams { category?: string; status?: string; search?: string }

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Obtener el rol del usuario
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('roles(name)').eq('id', user!.id).single()
  const role = ((profile as any)?.roles as { name: string } | null)?.name ?? 'seller'
  const isAdmin = role === 'admin'

  // Categorías para filtro
  const { data: categories } = await supabase
    .from('categories').select('id, name').eq('is_active', true).order('name')

  // Query de variantes con producto y categoría
  let query = supabase
    .from('product_variants')
    .select(`
      id, sku, color, size_type, size_value, quality, stock, min_stock,
      sale_price, avg_cost, is_active,
      products(
        id, name, image_url, is_active,
        categories(id, name),
        brands(name)
      )
    `)
    .order('created_at', { ascending: false })

  if (!isAdmin) query = query.eq('is_active', true)

  if (params.category) query = query.eq('products.categories.id', params.category)

  if (params.status === 'out') query = query.eq('stock', 0)
  else if (params.status === 'low') query = query.gt('stock', 0)

  if (params.search) {
    query = query.or(`sku.ilike.%${params.search}%,color.ilike.%${params.search}%`)
  }

  const { data: variants } = await query

  // Filtrar por stock status en app (ya que no podemos comparar columnas en supabase-js fácilmente)
  let filtered = variants ?? []
  if (params.status === 'low') {
    filtered = filtered.filter(v => v.stock > 0 && v.stock <= v.min_stock)
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(v =>
      (v.products as any)?.name?.toLowerCase().includes(s) ||
      v.sku.toLowerCase().includes(s) ||
      v.color?.toLowerCase().includes(s) ||
      v.size_value?.toLowerCase().includes(s)
    )
  }

  const outCount = (variants ?? []).filter(v => v.stock === 0).length
  const lowCount = (variants ?? []).filter(v => v.stock > 0 && v.stock <= v.min_stock).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} variantes</p>
        </div>
        <div className="flex items-center gap-2">
          {outCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {outCount} agotados
            </span>
          )}
          {lowCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              {lowCount} stock bajo
            </span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form className="flex flex-wrap gap-3">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por producto, SKU, color..."
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todas las categorías</option>
            {(categories ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todos los estados</option>
            <option value="out">Agotados</option>
            <option value="low">Stock bajo</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Filtrar
          </button>
          {(params.search || params.category || params.status) && (
            <Link
              href="/inventory"
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio venta</th>}
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo prom.</th>}
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(variant => {
                  const product = variant.products as any
                  const variantDesc = [
                    variant.color,
                    variant.size_value ? `T. ${variant.size_value}` : null
                  ].filter(Boolean).join(' / ')

                  return (
                    <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product?.name}</p>
                            <p className="text-xs text-gray-500">{product?.categories?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {variant.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{variantDesc || 'Talla única'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{variant.stock}</span>
                        <span className="text-xs text-gray-400 ml-1">/ mín {variant.min_stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={variant.stock} minStock={variant.min_stock} showCount={false} />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(variant.sale_price)}</td>
                      )}
                      {isAdmin && (
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(variant.avg_cost)}</td>
                      )}
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <InventoryAdjustButton variantId={variant.id} currentStock={variant.stock} />
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link a movimientos */}
      <div className="flex justify-end">
        <Link
          href="/inventory/movements"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          Ver historial de movimientos →
        </Link>
      </div>
    </div>
  )
}
