import { createClient } from '@/lib/supabase/server'
import { NewProductForm } from './new-product-form'

export default async function NewProductPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: brands }, { data: suppliers }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Nuevo producto</h1>
        <p className="text-sm text-gray-500 mt-0.5">Agrega un producto con sus variantes y stock inicial</p>
      </div>
      <NewProductForm
        categories={categories ?? []}
        brands={brands ?? []}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}
