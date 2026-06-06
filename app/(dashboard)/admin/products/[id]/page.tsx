import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { StockBadge } from '@/components/inventory/stock-badge'
import { ArrowLeft, Plus, Package } from 'lucide-react'
import Link from 'next/link'
import { ProductActions } from './product-actions'
import { StockEntryModal } from './stock-entry-modal'
import { AddVariantModal } from './add-variant-modal'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, image_url, description, is_active, created_at,
      categories(id, name),
      brands(id, name),
      product_variants(
        id, sku, barcode, color, size_type, size_value, quality, type, reference,
        purchase_price, sale_price, avg_cost, stock, min_stock, is_active, created_at
      )
    `)
    .eq('id', id)
    .single()

  if (!product) notFound()

  const variants = (product.product_variants as any[]) ?? []
  const [{ data: categories }, { data: brands }, { data: suppliers }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/products" className="mt-1 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            {!product.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {(product.categories as any)?.name}
            {(product.brands as any)?.name && ` · ${(product.brands as any).name}`}
            {' '}· Creado {formatDate(product.created_at)}
          </p>
        </div>
        <ProductActions
          productId={product.id}
          isActive={product.is_active}
          productName={product.name}
          categoryId={(product.categories as any)?.id ?? ''}
          brandId={(product.brands as any)?.id ?? ''}
          description={product.description ?? ''}
          categories={categories ?? []}
          brands={brands ?? []}
          currentImageUrl={product.image_url}
        />
      </div>

      {/* Info del producto */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-6">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-32 h-32 rounded-xl object-cover flex-shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
            {product.description && <p className="text-sm text-gray-600 mb-2">{product.description}</p>}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Categoría: <strong className="text-gray-900">{(product.categories as any)?.name}</strong></span>
              {(product.brands as any)?.name && (
                <span>Marca: <strong className="text-gray-900">{(product.brands as any).name}</strong></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Variantes ({variants.length})</h2>
          <AddVariantModal
            productId={product.id}
            suppliers={suppliers ?? []}
          />
        </div>

        {variants.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-sm">No hay variantes aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Variante</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">P. Venta</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">C. Prom.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v: any) => {
                  const desc = [v.color, v.size_value ? `T. ${v.size_value}` : null].filter(Boolean).join(' / ')
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{v.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{desc || 'Talla única'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {v.stock}
                        <span className="text-xs text-gray-400 font-normal ml-1">/ {v.min_stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={v.stock} minStock={v.min_stock} showCount={false} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(v.sale_price)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(v.avg_cost)}</td>
                      <td className="px-4 py-3 text-right">
                        <StockEntryModal variantId={v.id} variantDesc={desc || 'Talla única'} suppliers={suppliers ?? []} />
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
