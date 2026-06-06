import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'
import { CategoriesManager } from './categories-manager'
import { BrandsManager } from './brands-manager'
import { SuppliersManager } from './suppliers-manager'

export default async function SettingsPage() {
  const supabase = await createClient()

  const [{ data: configs }, { data: categories }, { data: brands }, { data: suppliers }] =
    await Promise.all([
      supabase.from('app_config').select('key, value').order('key'),
      supabase.from('categories').select('id, name, is_active').order('name'),
      supabase.from('brands').select('id, name, is_active').order('name'),
      supabase.from('suppliers').select('id, name, contact_name, phone, email, is_active').order('name'),
    ])

  const cfg: Record<string, string> = {}
  configs?.forEach(c => { cfg[c.key] = c.value })

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes generales de la tienda y datos maestros</p>
      </div>

      <SettingsForm config={cfg} />
      <CategoriesManager initialCategories={categories ?? []} />
      <BrandsManager initialBrands={brands ?? []} />
      <SuppliersManager initialSuppliers={suppliers ?? []} />
    </div>
  )
}
