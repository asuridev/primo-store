'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const name        = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const brand_id    = formData.get('brand_id') as string || null
  const description = formData.get('description') as string || null
  const imageFile   = formData.get('image') as File | null

  if (!name || !category_id) return { error: 'Nombre y categoría son obligatorios' }

  let image_url: string | null = null

  // Crear producto primero para tener el ID
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .insert({ name, category_id, brand_id, description })
    .select()
    .single()

  if (prodErr) return { error: prodErr.message }

  // Subir imagen si existe
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()
    const path = `${product.id}/main.${ext}`
    const buffer = await imageFile.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType: imageFile.type, upsert: true })

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)
      image_url = publicUrl

      await supabase.from('products').update({ image_url }).eq('id', product.id)
    }
  }

  revalidatePath('/admin/products')
  return { success: true, productId: product.id }
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const name        = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const brand_id    = formData.get('brand_id') as string || null
  const description = formData.get('description') as string || null
  const imageFile   = formData.get('image') as File | null

  const updates: Record<string, unknown> = { name, category_id, brand_id, description }

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()
    const path = `${productId}/main.${ext}`
    const buffer = await imageFile.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType: imageFile.type, upsert: true })

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)
      updates.image_url = publicUrl
    }
  }

  const { error } = await supabase.from('products').update(updates).eq('id', productId)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function toggleProductStatus(productId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: !isActive })
    .eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function createVariant(productId: string, variantData: {
  color?: string; size_type?: string; size_value?: string
  quality?: string; type?: string; reference?: string; barcode?: string
  purchase_price: number; sale_price: number; min_stock: number
  initial_stock: number; initial_cost: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { initial_stock, initial_cost, ...variantFields } = variantData

  const { data: variant, error: varErr } = await supabase
    .from('product_variants')
    .insert({ product_id: productId, ...variantFields, avg_cost: initial_cost })
    .select()
    .single()

  if (varErr) return { error: varErr.message }

  if (initial_stock > 0) {
    await supabase.rpc('update_avg_cost_on_purchase', {
      p_variant_id: variant.id,
      p_qty_in: initial_stock,
      p_unit_cost: initial_cost,
    })

    await supabase.from('inventory_movements').insert({
      variant_id: variant.id,
      movement_type: 'initial_stock',
      quantity_before: 0,
      delta: initial_stock,
      quantity_after: initial_stock,
      unit_cost: initial_cost,
      performed_by: user.id,
    })
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true, variantId: variant.id }
}

export async function registerStockEntry(variantId: string, quantity: number, unitCost: number, supplierId?: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: variant } = await supabase
    .from('product_variants').select('stock').eq('id', variantId).single()

  if (!variant) return { error: 'Variante no encontrada' }

  const stockBefore = variant.stock

  // Crear orden de compra
  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({ created_by: user.id, supplier_id: supplierId ?? null, status: 'received', received_at: new Date().toISOString() })
    .select().single()

  if (poErr) return { error: poErr.message }

  await supabase.from('purchase_order_items').insert({
    purchase_order_id: po.id, variant_id: variantId, quantity, unit_cost: unitCost,
  })

  // Actualizar stock + CPP
  await supabase.rpc('update_avg_cost_on_purchase', {
    p_variant_id: variantId, p_qty_in: quantity, p_unit_cost: unitCost,
  })

  // Registrar movimiento
  await supabase.from('inventory_movements').insert({
    variant_id: variantId,
    purchase_order_id: po.id,
    movement_type: 'purchase',
    quantity_before: stockBefore,
    delta: quantity,
    quantity_after: stockBefore + quantity,
    unit_cost: unitCost,
    notes: notes ?? null,
    performed_by: user.id,
  })

  revalidatePath('/inventory')
  revalidatePath('/admin/products')
  return { success: true }
}
