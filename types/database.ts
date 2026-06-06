export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: { id: string; name: string; description: string | null; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; created_at?: string }
        Update: { id?: string; name?: string; description?: string | null }
      }
      profiles: {
        Row: {
          id: string; role_id: string; full_name: string; email: string
          phone: string | null; avatar_url: string | null; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id: string; role_id: string; full_name: string; email: string
          phone?: string | null; avatar_url?: string | null; is_active?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          role_id?: string; full_name?: string; email?: string
          phone?: string | null; avatar_url?: string | null; is_active?: boolean; updated_at?: string
        }
      }
      categories: {
        Row: { id: string; name: string; description: string | null; is_active: boolean; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; is_active?: boolean }
        Update: { name?: string; description?: string | null; is_active?: boolean }
      }
      brands: {
        Row: { id: string; name: string; is_active: boolean; created_at: string }
        Insert: { id?: string; name: string; is_active?: boolean }
        Update: { name?: string; is_active?: boolean }
      }
      products: {
        Row: {
          id: string; category_id: string; brand_id: string | null; name: string
          description: string | null; image_url: string | null; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; category_id: string; brand_id?: string | null; name: string
          description?: string | null; image_url?: string | null; is_active?: boolean
        }
        Update: {
          category_id?: string; brand_id?: string | null; name?: string
          description?: string | null; image_url?: string | null; is_active?: boolean; updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string; product_id: string; sku: string; barcode: string | null
          color: string | null; size_type: 'letter' | 'number' | 'one_size' | null; size_value: string | null
          quality: string | null; type: string | null; reference: string | null
          purchase_price: number; sale_price: number; avg_cost: number
          stock: number; min_stock: number; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; product_id: string; sku?: string; barcode?: string | null
          color?: string | null; size_type?: 'letter' | 'number' | 'one_size' | null; size_value?: string | null
          quality?: string | null; type?: string | null; reference?: string | null
          purchase_price?: number; sale_price?: number; avg_cost?: number
          stock?: number; min_stock?: number; is_active?: boolean
        }
        Update: {
          barcode?: string | null; color?: string | null
          size_type?: 'letter' | 'number' | 'one_size' | null; size_value?: string | null
          quality?: string | null; type?: string | null; reference?: string | null
          purchase_price?: number; sale_price?: number; avg_cost?: number
          stock?: number; min_stock?: number; is_active?: boolean; updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string; name: string; contact_name: string | null; phone: string | null
          email: string | null; address: string | null; notes: string | null
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string; contact_name?: string | null; phone?: string | null
          email?: string | null; address?: string | null; notes?: string | null; is_active?: boolean
        }
        Update: {
          name?: string; contact_name?: string | null; phone?: string | null
          email?: string | null; address?: string | null; notes?: string | null; is_active?: boolean
        }
      }
      purchase_orders: {
        Row: {
          id: string; supplier_id: string | null; created_by: string
          status: 'pending' | 'received' | 'partial' | 'cancelled'
          notes: string | null; total_amount: number
          ordered_at: string; received_at: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; supplier_id?: string | null; created_by: string
          status?: 'pending' | 'received' | 'partial' | 'cancelled'
          notes?: string | null; total_amount?: number; ordered_at?: string; received_at?: string | null
        }
        Update: {
          supplier_id?: string | null; status?: 'pending' | 'received' | 'partial' | 'cancelled'
          notes?: string | null; total_amount?: number; received_at?: string | null
        }
      }
      purchase_order_items: {
        Row: {
          id: string; purchase_order_id: string; variant_id: string
          quantity: number; unit_cost: number; subtotal: number; created_at: string
        }
        Insert: {
          id?: string; purchase_order_id: string; variant_id: string
          quantity: number; unit_cost: number
        }
        Update: { quantity?: number; unit_cost?: number }
      }
      customers: {
        Row: {
          id: string; full_name: string; email: string | null; phone: string | null
          notes: string | null; is_active: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; full_name: string; email?: string | null; phone?: string | null
          notes?: string | null; is_active?: boolean
        }
        Update: {
          full_name?: string; email?: string | null; phone?: string | null
          notes?: string | null; is_active?: boolean
        }
      }
      discounts: {
        Row: {
          id: string; name: string; type: 'percentage' | 'fixed'; value: number
          is_active: boolean; requires_admin: boolean
          valid_from: string | null; valid_until: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string; type: 'percentage' | 'fixed'; value: number
          is_active?: boolean; requires_admin?: boolean
          valid_from?: string | null; valid_until?: string | null
        }
        Update: {
          name?: string; type?: 'percentage' | 'fixed'; value?: number
          is_active?: boolean; requires_admin?: boolean
          valid_from?: string | null; valid_until?: string | null
        }
      }
      sales: {
        Row: {
          id: string; consecutive_number: number
          customer_id: string | null; customer_name: string; customer_email: string; customer_phone: string | null
          created_by: string; discount_id: string | null
          subtotal: number; discount_amount: number; total: number
          status: 'completed' | 'cancelled' | 'exchanged'
          notes: string | null; receipt_url: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; customer_id?: string | null; customer_name: string; customer_email: string; customer_phone?: string | null
          created_by: string; discount_id?: string | null
          subtotal?: number; discount_amount?: number; total?: number
          status?: 'completed' | 'cancelled' | 'exchanged'
          notes?: string | null; receipt_url?: string | null
        }
        Update: {
          status?: 'completed' | 'cancelled' | 'exchanged'
          notes?: string | null; receipt_url?: string | null
        }
      }
      sale_items: {
        Row: {
          id: string; sale_id: string; variant_id: string
          quantity: number; unit_price: number; unit_cost_snapshot: number; subtotal: number
          created_at: string
        }
        Insert: {
          id?: string; sale_id: string; variant_id: string
          quantity: number; unit_price: number; unit_cost_snapshot?: number
        }
        Update: never
      }
      inventory_movements: {
        Row: {
          id: string; variant_id: string; sale_id: string | null; purchase_order_id: string | null
          movement_type: 'purchase' | 'sale' | 'return_sale' | 'exchange_out' | 'exchange_in' | 'manual_adjustment' | 'initial_stock'
          quantity_before: number; delta: number; quantity_after: number
          unit_cost: number | null; notes: string | null; performed_by: string; created_at: string
        }
        Insert: {
          id?: string; variant_id: string; sale_id?: string | null; purchase_order_id?: string | null
          movement_type: 'purchase' | 'sale' | 'return_sale' | 'exchange_out' | 'exchange_in' | 'manual_adjustment' | 'initial_stock'
          quantity_before: number; delta: number; quantity_after: number
          unit_cost?: number | null; notes?: string | null; performed_by: string
        }
        Update: never
      }
      warranties_exchanges: {
        Row: {
          id: string; original_sale_id: string; new_variant_id: string | null; handled_by: string
          type: 'warranty' | 'exchange'; reason: string
          status: 'pending' | 'resolved' | 'rejected'
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; original_sale_id: string; new_variant_id?: string | null; handled_by: string
          type: 'warranty' | 'exchange'; reason: string
          status?: 'pending' | 'resolved' | 'rejected'; notes?: string | null
        }
        Update: {
          new_variant_id?: string | null; status?: 'pending' | 'resolved' | 'rejected'
          notes?: string | null
        }
      }
      email_logs: {
        Row: {
          id: string; sale_id: string | null; recipient_email: string; subject: string
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          resend_message_id: string | null; error_message: string | null
          sent_at: string | null; created_at: string
        }
        Insert: {
          id?: string; sale_id?: string | null; recipient_email: string; subject: string
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          resend_message_id?: string | null; error_message?: string | null; sent_at?: string | null
        }
        Update: {
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          resend_message_id?: string | null; error_message?: string | null; sent_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string; performed_by: string | null; table_name: string; record_id: string | null
          operation: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values: Json | null; new_values: Json | null
          ip_address: string | null; user_agent: string | null; created_at: string
        }
        Insert: {
          id?: string; performed_by?: string | null; table_name: string; record_id?: string | null
          operation: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Json | null; new_values?: Json | null
          ip_address?: string | null; user_agent?: string | null
        }
        Update: never
      }
      app_config: {
        Row: {
          id: string; key: string; value: string; description: string | null
          updated_at: string; updated_by: string | null
        }
        Insert: { id?: string; key: string; value: string; description?: string | null; updated_by?: string | null }
        Update: { value?: string; description?: string | null; updated_at?: string; updated_by?: string | null }
      }
    }
    Views: {
      v_low_stock_alerts: {
        Row: {
          id: string; product_id: string; product_name: string; image_url: string | null
          category_name: string; sku: string; color: string | null
          size_type: string | null; size_value: string | null
          stock: number; min_stock: number; alert_type: 'out_of_stock' | 'low_stock'
        }
      }
    }
    Functions: {
      create_sale_atomic: {
        Args: {
          p_customer_name: string; p_customer_email: string; p_customer_phone: string | null
          p_customer_id: string | null; p_created_by: string; p_discount_id: string | null
          p_items: Json; p_notes: string | null
        }
        Returns: Json
      }
      update_avg_cost_on_purchase: {
        Args: { p_variant_id: string; p_qty_in: number; p_unit_cost: number }
        Returns: undefined
      }
      get_user_role: { Args: Record<never, never>; Returns: string }
    }
    Enums: Record<never, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Tipos convenientes
export type Profile = Tables<'profiles'>
export type Role = Tables<'roles'>
export type Category = Tables<'categories'>
export type Brand = Tables<'brands'>
export type Product = Tables<'products'>
export type ProductVariant = Tables<'product_variants'>
export type Supplier = Tables<'suppliers'>
export type PurchaseOrder = Tables<'purchase_orders'>
export type PurchaseOrderItem = Tables<'purchase_order_items'>
export type Customer = Tables<'customers'>
export type Discount = Tables<'discounts'>
export type Sale = Tables<'sales'>
export type SaleItem = Tables<'sale_items'>
export type InventoryMovement = Tables<'inventory_movements'>
export type WarrantyExchange = Tables<'warranties_exchanges'>
export type EmailLog = Tables<'email_logs'>
export type AppConfig = Tables<'app_config'>
export type LowStockAlert = Views<'v_low_stock_alerts'>

// Tipos enriquecidos para UI
export type ProductWithCategory = Product & {
  categories: Category
  brands: Brand | null
  product_variants: ProductVariant[]
}

export type SaleWithDetails = Sale & {
  profiles: Pick<Profile, 'full_name' | 'email'>
  sale_items: (SaleItem & {
    product_variants: ProductVariant & {
      products: Pick<Product, 'name' | 'image_url'>
    }
  })[]
}
