-- ============================================================
-- PRIMOS STORE — Schema Inicial
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- SEQUENCES
CREATE SEQUENCE IF NOT EXISTS sale_consecutive_seq START WITH 1 INCREMENT BY 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS sku_seq START WITH 1 INCREMENT BY 1 CACHE 10;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
  ('admin',  'Acceso completo a todos los módulos'),
  ('seller', 'Solo ventas, clientes y consulta de inventario');

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES roles(id),
  full_name   text NOT NULL,
  email       text NOT NULL UNIQUE,
  phone       text,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_email   ON profiles(email);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO categories (name) VALUES
  ('Jeans'), ('Camisetas'), ('Bermudas'), ('Gorras'),
  ('Pantalonetas'), ('Joggers'), ('Medias'), ('Boxer');

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  brand_id    uuid REFERENCES brands(id),
  name        text NOT NULL,
  description text,
  image_url   text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_id  ON products(category_id);
CREATE INDEX idx_products_brand_id     ON products(brand_id);
CREATE INDEX idx_products_is_active    ON products(is_active);
CREATE INDEX idx_products_name_trgm    ON products USING gin(name gin_trgm_ops);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            text NOT NULL UNIQUE,
  barcode        text UNIQUE,
  color          text,
  size_type      text CHECK (size_type IN ('letter', 'number', 'one_size')),
  size_value     text,
  quality        text,
  type           text,
  reference      text,
  purchase_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  sale_price     numeric(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  avg_cost       numeric(12,2) NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
  stock          integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock      integer NOT NULL DEFAULT 3 CHECK (min_stock >= 0),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product_id      ON product_variants(product_id);
CREATE INDEX idx_variants_sku             ON product_variants(sku);
CREATE INDEX idx_variants_barcode         ON product_variants(barcode);
CREATE INDEX idx_variants_is_active       ON product_variants(is_active);
CREATE INDEX idx_variants_low_stock       ON product_variants(stock, min_stock) WHERE is_active = true;
CREATE INDEX idx_variants_reference_trgm  ON product_variants USING gin(COALESCE(reference,'') gin_trgm_ops);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  notes        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_name_trgm ON suppliers USING gin(name gin_trgm_ops);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  uuid REFERENCES suppliers(id),
  created_by   uuid NOT NULL REFERENCES profiles(id),
  status       text NOT NULL DEFAULT 'received'
                 CHECK (status IN ('pending','received','partial','cancelled')),
  notes        text,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  ordered_at   timestamptz NOT NULL DEFAULT now(),
  received_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_supplier   ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_status     ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_ordered_at ON purchase_orders(ordered_at DESC);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE purchase_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id        uuid NOT NULL REFERENCES product_variants(id),
  quantity          integer NOT NULL CHECK (quantity > 0),
  unit_cost         numeric(12,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal          numeric(14,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_items_order_id   ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_variant_id ON purchase_order_items(variant_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  email      text,
  phone      text,
  notes      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_email     ON customers(email);
CREATE INDEX idx_customers_name_trgm ON customers USING gin(full_name gin_trgm_ops);

-- ============================================================
-- DISCOUNTS
-- ============================================================
CREATE TABLE discounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  type           text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value          numeric(10,2) NOT NULL CHECK (value > 0),
  is_active      boolean NOT NULL DEFAULT true,
  requires_admin boolean NOT NULL DEFAULT false,
  valid_from     timestamptz,
  valid_until    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE sales (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consecutive_number integer NOT NULL DEFAULT nextval('sale_consecutive_seq') UNIQUE,
  customer_id        uuid REFERENCES customers(id),
  customer_name      text NOT NULL,
  customer_email     text NOT NULL,
  customer_phone     text,
  created_by         uuid NOT NULL REFERENCES profiles(id),
  discount_id        uuid REFERENCES discounts(id),
  subtotal           numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount    numeric(14,2) NOT NULL DEFAULT 0,
  total              numeric(14,2) NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'completed'
                       CHECK (status IN ('completed','cancelled','exchanged')),
  notes              text,
  receipt_url        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_consecutive ON sales(consecutive_number DESC);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_by  ON sales(created_by);
CREATE INDEX idx_sales_created_at  ON sales(created_at DESC);
CREATE INDEX idx_sales_status      ON sales(status);

-- ============================================================
-- SALE ITEMS
-- ============================================================
CREATE TABLE sale_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id            uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  variant_id         uuid NOT NULL REFERENCES product_variants(id),
  quantity           integer NOT NULL CHECK (quantity > 0),
  unit_price         numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  subtotal           numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale_id    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE TABLE inventory_movements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id        uuid NOT NULL REFERENCES product_variants(id),
  sale_id           uuid REFERENCES sales(id),
  purchase_order_id uuid REFERENCES purchase_orders(id),
  movement_type     text NOT NULL CHECK (movement_type IN (
    'purchase', 'sale', 'return_sale', 'exchange_out', 'exchange_in',
    'manual_adjustment', 'initial_stock'
  )),
  quantity_before   integer NOT NULL,
  delta             integer NOT NULL,
  quantity_after    integer NOT NULL,
  unit_cost         numeric(12,2),
  notes             text,
  performed_by      uuid NOT NULL REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_variant_id  ON inventory_movements(variant_id);
CREATE INDEX idx_movements_sale_id     ON inventory_movements(sale_id);
CREATE INDEX idx_movements_po_id       ON inventory_movements(purchase_order_id);
CREATE INDEX idx_movements_type        ON inventory_movements(movement_type);
CREATE INDEX idx_movements_created_at  ON inventory_movements(created_at DESC);

-- ============================================================
-- WARRANTIES / EXCHANGES
-- ============================================================
CREATE TABLE warranties_exchanges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_sale_id uuid NOT NULL REFERENCES sales(id),
  new_variant_id   uuid REFERENCES product_variants(id),
  handled_by       uuid NOT NULL REFERENCES profiles(id),
  type             text NOT NULL CHECK (type IN ('warranty','exchange')),
  reason           text NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','resolved','rejected')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_we_original_sale ON warranties_exchanges(original_sale_id);
CREATE INDEX idx_we_handled_by    ON warranties_exchanges(handled_by);

-- ============================================================
-- EMAIL LOGS
-- ============================================================
CREATE TABLE email_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id           uuid REFERENCES sales(id),
  recipient_email   text NOT NULL,
  subject           text NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','sent','failed','bounced')),
  resend_message_id text,
  error_message     text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_sale_id ON email_logs(sale_id);
CREATE INDEX idx_email_logs_status  ON email_logs(status);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid REFERENCES profiles(id),
  table_name   text NOT NULL,
  record_id    uuid,
  operation    text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  old_values   jsonb,
  new_values   jsonb,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_table_name   ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id    ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_new_values        ON audit_logs USING gin(new_values);

-- ============================================================
-- APP CONFIG
-- ============================================================
CREATE TABLE app_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       text NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES profiles(id)
);

INSERT INTO app_config (key, value, description) VALUES
  ('store_name',          'Primos Store',                         'Nombre de la tienda'),
  ('store_address',       '',                                     'Dirección física'),
  ('store_phone',         '',                                     'Teléfono de contacto'),
  ('store_email',         '',                                     'Correo de contacto'),
  ('store_logo_url',      '',                                     'URL del logo en Supabase Storage'),
  ('max_discount_pct',    '20',                                   'Porcentaje máximo sin aprobación admin'),
  ('receipt_footer_text', '¡Gracias por su compra!',              'Texto al pie del comprobante'),
  ('currency_symbol',     '$',                                    'Símbolo de moneda'),
  ('sale_email_subject',  'Tu recibo de compra - Primos Store',   'Asunto del correo de comprobante');

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_po_updated_at
  BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_we_updated_at
  BEFORE UPDATE ON warranties_exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_discounts_updated_at
  BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-generación de SKU
-- ============================================================
CREATE OR REPLACE FUNCTION generate_variant_sku()
RETURNS TRIGGER AS $$
DECLARE
  cat_part   text;
  prod_part  text;
  color_part text;
  size_part  text;
  seq_part   text;
BEGIN
  SELECT
    UPPER(SUBSTRING(c.name, 1, 3)),
    UPPER(SUBSTRING(p.name, 1, 3))
  INTO cat_part, prod_part
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE p.id = NEW.product_id;

  color_part := UPPER(SUBSTRING(COALESCE(NEW.color, 'XX'), 1, 2));
  size_part  := LPAD(COALESCE(NEW.size_value, '00'), 4, '0');
  seq_part   := LPAD(NEXTVAL('sku_seq')::text, 4, '0');

  NEW.sku := cat_part || '-' || prod_part || '-' || color_part || size_part || '-' || seq_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_sku
  BEFORE INSERT ON product_variants
  FOR EACH ROW
  WHEN (NEW.sku IS NULL OR NEW.sku = '')
  EXECUTE FUNCTION generate_variant_sku();

-- ============================================================
-- FUNCIÓN: Actualización CPP al recibir mercancía
-- ============================================================
CREATE OR REPLACE FUNCTION update_avg_cost_on_purchase(
  p_variant_id uuid,
  p_qty_in     integer,
  p_unit_cost  numeric
) RETURNS void AS $$
DECLARE
  v_stock    integer;
  v_avg_cost numeric;
  v_new_avg  numeric;
BEGIN
  SELECT stock, avg_cost
  INTO v_stock, v_avg_cost
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  v_new_avg := CASE
    WHEN v_stock <= 0 THEN p_unit_cost
    ELSE ROUND(
      ((v_stock * v_avg_cost) + (p_qty_in * p_unit_cost)) / (v_stock + p_qty_in),
      2
    )
  END;

  UPDATE product_variants
  SET
    stock      = stock + p_qty_in,
    avg_cost   = v_new_avg,
    updated_at = now()
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN ATÓMICA: Crear venta
-- ============================================================
CREATE OR REPLACE FUNCTION create_sale_atomic(
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_id    uuid,
  p_created_by     uuid,
  p_discount_id    uuid,
  p_items          jsonb,
  p_notes          text
) RETURNS jsonb AS $$
DECLARE
  v_sale_id         uuid;
  v_consecutive     integer;
  v_subtotal        numeric := 0;
  v_discount_amount numeric := 0;
  v_total           numeric;
  v_item            jsonb;
  v_variant_id      uuid;
  v_quantity        integer;
  v_unit_price      numeric;
  v_unit_cost       numeric;
  v_current_stock   integer;
  v_dtype           text;
  v_dvalue          numeric;
BEGIN
  -- 1. Bloquear variantes y validar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id  := (v_item->>'variant_id')::uuid;
    v_quantity    := (v_item->>'quantity')::integer;

    SELECT stock INTO v_current_stock
    FROM product_variants
    WHERE id = v_variant_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'VARIANTE_NO_ENCONTRADA:%', v_variant_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE:%:disponible:%:requerido:%',
        v_variant_id, v_current_stock, v_quantity;
    END IF;
  END LOOP;

  -- 2. Calcular subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal +
      ((v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric);
  END LOOP;

  -- 3. Calcular descuento
  IF p_discount_id IS NOT NULL THEN
    SELECT type, value INTO v_dtype, v_dvalue
    FROM discounts
    WHERE id = p_discount_id AND is_active = true;

    IF FOUND THEN
      IF v_dtype = 'percentage' THEN
        v_discount_amount := ROUND(v_subtotal * v_dvalue / 100, 2);
      ELSE
        v_discount_amount := LEAST(v_dvalue, v_subtotal);
      END IF;
    END IF;
  END IF;

  v_total := v_subtotal - v_discount_amount;

  -- 4. Crear venta
  INSERT INTO sales (
    customer_name, customer_email, customer_phone, customer_id,
    created_by, discount_id, subtotal, discount_amount, total, notes
  ) VALUES (
    p_customer_name, p_customer_email, p_customer_phone, p_customer_id,
    p_created_by, p_discount_id, v_subtotal, v_discount_amount, v_total, p_notes
  )
  RETURNING id, consecutive_number INTO v_sale_id, v_consecutive;

  -- 5. Crear ítems, descontar stock, registrar movimientos
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    SELECT avg_cost, stock
    INTO v_unit_cost, v_current_stock
    FROM product_variants
    WHERE id = v_variant_id;

    INSERT INTO sale_items (
      sale_id, variant_id, quantity, unit_price, unit_cost_snapshot
    ) VALUES (
      v_sale_id, v_variant_id, v_quantity, v_unit_price, v_unit_cost
    );

    UPDATE product_variants
    SET stock = stock - v_quantity, updated_at = now()
    WHERE id = v_variant_id;

    INSERT INTO inventory_movements (
      variant_id, sale_id, movement_type,
      quantity_before, delta, quantity_after,
      unit_cost, performed_by
    ) VALUES (
      v_variant_id, v_sale_id, 'sale',
      v_current_stock, -v_quantity, v_current_stock - v_quantity,
      v_unit_cost, p_created_by
    );
  END LOOP;

  RETURN jsonb_build_object(
    'sale_id',           v_sale_id,
    'consecutive_number', v_consecutive
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VISTA: Alertas de stock bajo
-- ============================================================
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT
  pv.id,
  p.id          AS product_id,
  p.name        AS product_name,
  p.image_url,
  c.name        AS category_name,
  pv.sku,
  pv.color,
  pv.size_type,
  pv.size_value,
  pv.stock,
  pv.min_stock,
  CASE
    WHEN pv.stock = 0 THEN 'out_of_stock'
    ELSE 'low_stock'
  END AS alert_type
FROM product_variants pv
JOIN products p   ON p.id = pv.product_id
JOIN categories c ON c.id = p.category_id
WHERE pv.is_active = true
  AND p.is_active  = true
  AND pv.stock <= pv.min_stock
ORDER BY pv.stock ASC, p.name ASC;

-- ============================================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario en auth
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id uuid;
  v_role    text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'seller');

  SELECT id INTO v_role_id FROM public.roles WHERE name = v_role;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'seller';
  END IF;

  INSERT INTO public.profiles (id, role_id, full_name, email)
  VALUES (
    NEW.id,
    v_role_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
