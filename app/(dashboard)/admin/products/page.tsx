import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'
import { Plus, Package, ChevronRight } from 'lucide-react'
import { StockBadge } from '@/components/inventory/stock-badge'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, image_url, is_active, created_at,
      categories(name),
      brands(name),
      product_variants(id, stock, min_stock, sale_price, is_active)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products?.length ?? 0} productos registrados</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white
                     text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!products?.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay productos aún</p>
            <Link href="/admin/products/new" className="mt-3 text-sm text-gray-900 font-medium hover:underline">
              Agregar primer producto →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map(product => {
              const variants = (product.product_variants as any[]) ?? []
              const activeVariants = variants.filter(v => v.is_active)
              const totalStock = activeVariants.reduce((s: number, v: any) => s + v.stock, 0)
              const minStock   = activeVariants.reduce((s: number, v: any) => s + v.min_stock, 0)
              const maxPrice   = Math.max(...activeVariants.map((v: any) => v.sale_price), 0)

              return (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Imagen */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      {!product.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {(product.categories as any)?.name}
                      {(product.brands as any)?.name && ` · ${(product.brands as any).name}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activeVariants.length} variantes · desde {formatCurrency(maxPrice)}
                    </p>
                  </div>

                  {/* Stock */}
                  <div className="text-right flex-shrink-0 mr-2">
                    <StockBadge stock={totalStock} minStock={minStock} showCount />
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
