'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReceiptDocument } from '@/components/pdf/receipt-document'
import { Resend } from 'resend'
import { SaleReceiptEmail } from '@/lib/resend/templates/sale-receipt'
import { revalidatePath } from 'next/cache'

interface SaleItem {
  variant_id: string
  quantity: number
  unit_price: number
}

interface CreateSaleInput {
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_id?: string
  discount_id?: string
  items: SaleItem[]
  notes?: string
}

function pad(n: number) { return String(n).padStart(6, '0') }

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit' })
}

export async function createSale(input: CreateSaleInput) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'No autorizado' }

  // Get store config
  const { data: configs } = await serviceClient
    .from('app_config')
    .select('key, value')
    .in('key', ['store_name', 'store_address', 'store_phone', 'store_email',
                 'receipt_footer_text', 'sale_email_subject'])

  const cfg: Record<string, string> = {}
  configs?.forEach(c => { cfg[c.key] = c.value })

  // Upsert customer if no existing id
  let customerId = input.customer_id ?? null
  if (!customerId && input.customer_email) {
    const { data: existingCustomer } = await serviceClient
      .from('customers')
      .select('id')
      .eq('email', input.customer_email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
      // Update name/phone if provided
      await serviceClient.from('customers').update({
        full_name: input.customer_name,
        phone: input.customer_phone ?? undefined,
      }).eq('id', customerId)
    } else {
      const { data: newCustomer } = await serviceClient
        .from('customers')
        .insert({ full_name: input.customer_name, email: input.customer_email, phone: input.customer_phone ?? null })
        .select('id')
        .single()
      customerId = newCustomer?.id ?? null
    }
  }

  // Call atomic PG function
  const { data: saleResult, error: saleError } = await serviceClient.rpc('create_sale_atomic', {
    p_customer_name:  input.customer_name,
    p_customer_email: input.customer_email,
    p_customer_phone: input.customer_phone ?? null,
    p_customer_id:    customerId,
    p_created_by:     session.user.id,
    p_discount_id:    input.discount_id ?? null,
    p_items:          JSON.stringify(input.items),
    p_notes:          input.notes ?? null,
  })

  if (saleError) {
    if (saleError.message.includes('STOCK_INSUFICIENTE')) {
      return { success: false, error: 'Stock insuficiente para uno o más productos' }
    }
    return { success: false, error: saleError.message }
  }

  const saleId     = (saleResult as any).sale_id
  const consecutive = (saleResult as any).consecutive_number

  // Fetch sale details for receipt
  const { data: sale } = await serviceClient
    .from('sales')
    .select('subtotal, discount_amount, total, notes')
    .eq('id', saleId)
    .single()

  const { data: saleItems } = await serviceClient
    .from('sale_items')
    .select(`
      quantity, unit_price, subtotal,
      product_variants(color, size_value, products(name))
    `)
    .eq('sale_id', saleId)

  const receiptItems = (saleItems ?? []).map((si: any) => ({
    description: si.product_variants?.products?.name ?? '',
    color:       si.product_variants?.color ?? null,
    sizeValue:   si.product_variants?.size_value ?? null,
    quantity:    si.quantity,
    unitPrice:   si.unit_price,
    subtotal:    si.subtotal,
  }))

  const receiptData = {
    consecutive,
    date:          fmtDate(new Date()),
    customerName:  input.customer_name,
    customerEmail: input.customer_email,
    customerPhone: input.customer_phone ?? null,
    storeName:     cfg.store_name ?? 'Primos Store',
    storeAddress:  cfg.store_address || null,
    storePhone:    cfg.store_phone   || null,
    storeEmail:    cfg.store_email   || null,
    items:         receiptItems,
    subtotal:      sale?.subtotal ?? 0,
    discountAmount:sale?.discount_amount ?? 0,
    total:         sale?.total ?? 0,
    notes:         sale?.notes ?? null,
    footerText:    cfg.receipt_footer_text || null,
  }

  // Generate PDF
  let receiptUrl: string | null = null
  try {
    const pdfBuffer = await renderToBuffer(
      createElement(ReceiptDocument, { data: receiptData }) as any
    )

    const fileName = `receipts/${saleId}.pdf`
    const { data: uploadData } = await serviceClient.storage
      .from('receipts')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadData) {
      const { data: urlData } = serviceClient.storage.from('receipts').getPublicUrl(fileName)
      receiptUrl = urlData.publicUrl

      // Save receipt_url to sale
      await serviceClient.from('sales').update({ receipt_url: receiptUrl }).eq('id', saleId)
    }
  } catch (_e) {
    // PDF generation failure is non-critical — continue with email
  }

  // Send email with Resend
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'recibos@primosstore.co'

  if (resendKey && input.customer_email) {
    const resend = new Resend(resendKey)
    const subject = (cfg.sale_email_subject ?? 'Tu recibo de compra').replace(
      '{store}', cfg.store_name ?? 'Primos Store'
    )

    const { error: emailError, data: emailData } = await resend.emails.send({
      from: `${cfg.store_name ?? 'Primos Store'} <${fromEmail}>`,
      to:   input.customer_email,
      subject,
      react: createElement(SaleReceiptEmail, {
        consecutive,
        customerName:   input.customer_name,
        storeName:      cfg.store_name ?? 'Primos Store',
        date:           fmtDate(new Date()),
        items:          receiptItems,
        subtotal:       sale?.subtotal ?? 0,
        discountAmount: sale?.discount_amount ?? 0,
        total:          sale?.total ?? 0,
        footerText:     cfg.receipt_footer_text || null,
      }),
    })

    await serviceClient.from('email_logs').insert({
      sale_id:           saleId,
      recipient_email:   input.customer_email,
      subject,
      status:            emailError ? 'failed' : 'sent',
      resend_message_id: (emailData as any)?.id ?? null,
      error_message:     emailError?.message ?? null,
      sent_at:           emailError ? null : new Date().toISOString(),
    })
  }

  revalidatePath('/sales')
  revalidatePath('/sales/history')

  return { success: true, saleId, consecutive }
}

export async function resendReceipt(saleId: string) {
  const serviceClient = await createServiceClient()

  const { data: sale } = await serviceClient
    .from('sales')
    .select(`
      id, consecutive_number, customer_name, customer_email, customer_phone,
      subtotal, discount_amount, total, notes,
      sale_items(
        quantity, unit_price, subtotal,
        product_variants(color, size_value, products(name))
      )
    `)
    .eq('id', saleId)
    .single()

  if (!sale) return { success: false, error: 'Venta no encontrada' }

  const { data: configs } = await serviceClient
    .from('app_config').select('key, value')
    .in('key', ['store_name', 'receipt_footer_text', 'sale_email_subject'])

  const cfg: Record<string, string> = {}
  configs?.forEach(c => { cfg[c.key] = c.value })

  const receiptItems = ((sale as any).sale_items ?? []).map((si: any) => ({
    description: si.product_variants?.products?.name ?? '',
    color:       si.product_variants?.color ?? null,
    sizeValue:   si.product_variants?.size_value ?? null,
    quantity:    si.quantity,
    unitPrice:   si.unit_price,
    subtotal:    si.subtotal,
  }))

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'recibos@primosstore.co'

  if (!resendKey) return { success: false, error: 'Email no configurado' }

  const resend  = new Resend(resendKey)
  const subject = cfg.sale_email_subject ?? `Tu recibo de compra - ${cfg.store_name ?? 'Primos Store'}`

  const { error } = await resend.emails.send({
    from:  `${cfg.store_name ?? 'Primos Store'} <${fromEmail}>`,
    to:    (sale as any).customer_email,
    subject,
    react: createElement(SaleReceiptEmail, {
      consecutive:    (sale as any).consecutive_number,
      customerName:   (sale as any).customer_name,
      storeName:      cfg.store_name ?? 'Primos Store',
      date:           fmtDate(new Date()),
      items:          receiptItems,
      subtotal:       (sale as any).subtotal,
      discountAmount: (sale as any).discount_amount,
      total:          (sale as any).total,
      footerText:     cfg.receipt_footer_text || null,
    }),
  })

  if (error) return { success: false, error: error.message }

  await serviceClient.from('email_logs').insert({
    sale_id: saleId, recipient_email: (sale as any).customer_email,
    subject, status: 'sent', sent_at: new Date().toISOString(),
  })

  return { success: true }
}

export async function getSaleDetail(saleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, consecutive_number, customer_name, customer_email, customer_phone,
      subtotal, discount_amount, total, status, notes, receipt_url, created_at,
      profiles!created_by(full_name),
      discounts(name, type, value),
      sale_items(
        id, quantity, unit_price, subtotal, unit_cost_snapshot,
        product_variants(
          id, sku, color, size_value,
          products(name, image_url)
        )
      )
    `)
    .eq('id', saleId)
    .single()

  if (error) return null
  return data
}
