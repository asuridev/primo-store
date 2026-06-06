import { createClient } from '@/lib/supabase/server'
import { POSClient } from './pos-client'

export default async function SalesPage() {
  const supabase = await createClient()

  // Load products with variants (only active with stock info)
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, image_url,
      categories(name),
      product_variants(
        id, sku, color, size_type, size_value, sale_price, stock, is_active
      )
    `)
    .eq('is_active', true)
    .order('name')

  // Load discounts available to seller (non-admin-required)
  const { data: discounts } = await supabase
    .from('discounts')
    .select('id, name, type, value')
    .eq('is_active', true)
    .eq('requires_admin', false)
    .order('name')

  const filteredProducts = (products ?? []).map((p: any) => ({
    ...p,
    product_variants: (p.product_variants ?? []).filter((v: any) => v.is_active && v.stock > 0),
  })).filter((p: any) => p.product_variants.length > 0)

  return <POSClient products={filteredProducts} discounts={discounts ?? []} />
}
