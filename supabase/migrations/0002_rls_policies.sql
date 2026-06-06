-- ============================================================
-- PRIMOS STORE — Row Level Security Policies
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config           ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: obtener rol del usuario autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT r.name
  FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND p.is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROLES: lectura para todos
-- ============================================================
CREATE POLICY "roles_select" ON roles
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- CATEGORIES / BRANDS: todos leen, solo admin escribe
-- ============================================================
CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_write_admin" ON categories
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "brands_select" ON brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "brands_write_admin" ON brands
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- PRODUCTS: admin ve todo; vendedor solo activos
-- ============================================================
CREATE POLICY "products_select_admin" ON products
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "products_select_seller" ON products
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND is_active = true);

CREATE POLICY "products_write_admin" ON products
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- PRODUCT VARIANTS: admin ve todo; vendedor solo activos
-- ============================================================
CREATE POLICY "variants_select_admin" ON product_variants
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "variants_select_seller" ON product_variants
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND is_active = true);

CREATE POLICY "variants_write_admin" ON product_variants
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- SUPPLIERS / PURCHASE ORDERS: solo admin
-- ============================================================
CREATE POLICY "suppliers_admin" ON suppliers
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "purchase_orders_admin" ON purchase_orders
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "po_items_admin" ON purchase_order_items
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- CUSTOMERS: ambos roles leen/crean
-- ============================================================
CREATE POLICY "customers_select" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert" ON customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "customers_update_admin" ON customers
  FOR UPDATE TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "customers_delete_admin" ON customers
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- DISCOUNTS: admin ve todo; vendedor solo activos sin requerir admin
-- ============================================================
CREATE POLICY "discounts_select_admin" ON discounts
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "discounts_select_seller" ON discounts
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND is_active = true AND requires_admin = false);

CREATE POLICY "discounts_write_admin" ON discounts
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- SALES: admin ve todo; vendedor solo las suyas; nadie borra
-- ============================================================
CREATE POLICY "sales_select_admin" ON sales
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "sales_select_seller" ON sales
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND created_by = auth.uid());

CREATE POLICY "sales_insert" ON sales
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "sales_update_admin" ON sales
  FOR UPDATE TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "sales_no_delete" ON sales
  FOR DELETE TO authenticated USING (false);

-- ============================================================
-- SALE ITEMS
-- ============================================================
CREATE POLICY "sale_items_select_admin" ON sale_items
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "sale_items_select_seller" ON sale_items
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'seller' AND
    EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id AND s.created_by = auth.uid())
  );

CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE POLICY "movements_select_admin" ON inventory_movements
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "movements_select_seller" ON inventory_movements
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND performed_by = auth.uid());

CREATE POLICY "movements_insert" ON inventory_movements
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- WARRANTIES / EXCHANGES
-- ============================================================
CREATE POLICY "we_select_admin" ON warranties_exchanges
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "we_select_seller" ON warranties_exchanges
  FOR SELECT TO authenticated
  USING (get_user_role() = 'seller' AND handled_by = auth.uid());

CREATE POLICY "we_insert" ON warranties_exchanges
  FOR INSERT TO authenticated WITH CHECK (handled_by = auth.uid());

CREATE POLICY "we_update_admin" ON warranties_exchanges
  FOR UPDATE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- EMAIL LOGS
-- ============================================================
CREATE POLICY "email_logs_select_admin" ON email_logs
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "email_logs_insert" ON email_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- APP CONFIG: todos leen; solo admin escribe
-- ============================================================
CREATE POLICY "app_config_select" ON app_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "app_config_admin" ON app_config
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
