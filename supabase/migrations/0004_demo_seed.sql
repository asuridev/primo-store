-- ============================================================
-- PRIMOS STORE — Datos Demo para presentación al cliente
-- ============================================================
-- INSTRUCCIONES:
-- 1. Asegúrate de tener al menos UN usuario admin creado en
--    Supabase Auth antes de correr este script.
-- 2. Reemplaza el UUID en la línea marcada con REEMPLAZAR_UUID
--    con el UUID real del usuario admin.
-- ============================================================

DO $$
DECLARE
  -- !! REEMPLAZA este UUID con el de tu usuario admin real !!
  v_admin_id        uuid := (SELECT id FROM profiles WHERE is_active = true LIMIT 1);

  -- Brands
  v_brand_levi      uuid;
  v_brand_dickies   uuid;
  v_brand_carhartt  uuid;
  v_brand_hanes     uuid;
  v_brand_primos    uuid;

  -- Categories
  v_cat_jeans       uuid;
  v_cat_camisetas   uuid;
  v_cat_bermudas    uuid;
  v_cat_gorras      uuid;
  v_cat_joggers     uuid;
  v_cat_medias      uuid;
  v_cat_boxer       uuid;

  -- Suppliers
  v_sup1 uuid;
  v_sup2 uuid;
  v_sup3 uuid;

  -- Products
  v_prod1  uuid; -- Jean slim Levi's
  v_prod2  uuid; -- Jean cargo Dickies
  v_prod3  uuid; -- Camiseta básica
  v_prod4  uuid; -- Camiseta polo
  v_prod5  uuid; -- Bermuda cargo
  v_prod6  uuid; -- Gorra snapback
  v_prod7  uuid; -- Jogger fleece
  v_prod8  uuid; -- Medias deportivas
  v_prod9  uuid; -- Boxer algodón
  v_prod10 uuid; -- Jean relaxed

  -- Variants (muestra de IDs para usarlos en ventas)
  v_var1a uuid; v_var1b uuid; v_var1c uuid;
  v_var2a uuid; v_var2b uuid;
  v_var3a uuid; v_var3b uuid; v_var3c uuid;
  v_var4a uuid; v_var4b uuid;
  v_var5a uuid; v_var5b uuid;
  v_var6a uuid; v_var6b uuid;
  v_var7a uuid; v_var7b uuid;
  v_var8a uuid;
  v_var9a uuid;
  v_var10a uuid; v_var10b uuid;

  -- Customers
  v_cust1 uuid; v_cust2 uuid; v_cust3 uuid;
  v_cust4 uuid; v_cust5 uuid;

  -- Discounts
  v_disc1 uuid; v_disc2 uuid; v_disc3 uuid;

  -- Purchase orders
  v_po1 uuid; v_po2 uuid; v_po3 uuid;

  -- Sales
  v_sale1 uuid; v_sale2 uuid; v_sale3 uuid;
  v_sale4 uuid; v_sale5 uuid; v_sale6 uuid;
  v_sale7 uuid; v_sale8 uuid;

BEGIN

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún perfil activo. Crea el usuario admin primero en Supabase Auth.';
  END IF;

  -- ============================================================
  -- BRANDS
  -- ============================================================
  INSERT INTO brands (name) VALUES ('Levi''s')    RETURNING id INTO v_brand_levi;
  INSERT INTO brands (name) VALUES ('Dickies')    RETURNING id INTO v_brand_dickies;
  INSERT INTO brands (name) VALUES ('Carhartt')   RETURNING id INTO v_brand_carhartt;
  INSERT INTO brands (name) VALUES ('Hanes')      RETURNING id INTO v_brand_hanes;
  INSERT INTO brands (name) VALUES ('Primos')     RETURNING id INTO v_brand_primos;

  -- ============================================================
  -- CATEGORIES (ya existen, sólo tomamos IDs)
  -- ============================================================
  SELECT id INTO v_cat_jeans     FROM categories WHERE name = 'Jeans'        LIMIT 1;
  SELECT id INTO v_cat_camisetas FROM categories WHERE name = 'Camisetas'    LIMIT 1;
  SELECT id INTO v_cat_bermudas  FROM categories WHERE name = 'Bermudas'     LIMIT 1;
  SELECT id INTO v_cat_gorras    FROM categories WHERE name = 'Gorras'       LIMIT 1;
  SELECT id INTO v_cat_joggers   FROM categories WHERE name = 'Joggers'      LIMIT 1;
  SELECT id INTO v_cat_medias    FROM categories WHERE name = 'Medias'       LIMIT 1;
  SELECT id INTO v_cat_boxer     FROM categories WHERE name = 'Boxer'        LIMIT 1;

  -- ============================================================
  -- SUPPLIERS
  -- ============================================================
  INSERT INTO suppliers (name, contact_name, phone, email, address, notes)
  VALUES ('Distribuidora Textil Bogotá', 'Carlos Mendoza', '3001234567',
          'ventas@textilbogota.co', 'Calle 12 # 15-30, Bogotá',
          'Proveedor principal de jeans y pantalones')
  RETURNING id INTO v_sup1;

  INSERT INTO suppliers (name, contact_name, phone, email, address, notes)
  VALUES ('Confecciones Del Norte', 'Adriana Ruiz', '3157896543',
          'adriana@confnorte.co', 'Carrera 8 # 20-10, Medellín',
          'Camisetas y ropa casual')
  RETURNING id INTO v_sup2;

  INSERT INTO suppliers (name, contact_name, phone, email, address, notes)
  VALUES ('Importadora Sport & Style', 'Pedro Gómez', '3209876543',
          'pedrog@sportstyle.co', 'Zona Franca Cali, Bod. 14',
          'Accesorios, gorras, medias y boxer')
  RETURNING id INTO v_sup3;

  -- ============================================================
  -- PRODUCTS
  -- ============================================================
  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_jeans, v_brand_levi, 'Jean Slim 511',
          'Jean corte slim clásico, tela denim 12 oz con stretch')
  RETURNING id INTO v_prod1;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_jeans, v_brand_dickies, 'Jean Cargo Industrial',
          'Jean cargo de trabajo con bolsillos laterales reforzados')
  RETURNING id INTO v_prod2;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_camisetas, v_brand_hanes, 'Camiseta Básica Cuello Redondo',
          'Camiseta 100% algodón peinado, 180 gr, corte regular')
  RETURNING id INTO v_prod3;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_camisetas, v_brand_primos, 'Camiseta Polo Piqué',
          'Polo con cuello y botones, tela piqué transpirable')
  RETURNING id INTO v_prod4;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_bermudas, v_brand_dickies, 'Bermuda Cargo Multi-bolsillos',
          'Bermuda de trabajo con 6 bolsillos, tela drill')
  RETURNING id INTO v_prod5;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_gorras, v_brand_primos, 'Gorra Snapback Bordada',
          'Gorra snapback con bordado frontal, visera plana')
  RETURNING id INTO v_prod6;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_joggers, v_brand_primos, 'Jogger Fleece Premium',
          'Pantalón deportivo con forro polar, puño en tobillo')
  RETURNING id INTO v_prod7;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_medias, v_brand_hanes, 'Medias Deportivas Pack x3',
          'Pack de 3 pares, media caña, con refuerzo en talón y punta')
  RETURNING id INTO v_prod8;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_boxer, v_brand_hanes, 'Boxer Algodón Elástico',
          'Boxer 95% algodón, cintura elástica ancha')
  RETURNING id INTO v_prod9;

  INSERT INTO products (category_id, brand_id, name, description)
  VALUES (v_cat_jeans, v_brand_carhartt, 'Jean Relaxed Fit Carhartt',
          'Jean corte amplio para comodidad todo el día, refuerzo en rodillas')
  RETURNING id INTO v_prod10;

  -- ============================================================
  -- PRODUCT VARIANTS
  -- Jean Slim 511 — tallas 28-36, colores azul y negro
  -- ============================================================
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod1, '', 'Azul oscuro', 'number', '30', 55000, 110000, 55000, 8, 3)
  RETURNING id INTO v_var1a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod1, '', 'Azul oscuro', 'number', '32', 55000, 110000, 55000, 12, 3)
  RETURNING id INTO v_var1b;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod1, '', 'Negro', 'number', '32', 55000, 115000, 55000, 6, 3)
  RETURNING id INTO v_var1c;

  -- Jean Cargo Industrial
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod2, '', 'Khaki', 'number', '32', 48000, 98000, 48000, 10, 3)
  RETURNING id INTO v_var2a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod2, '', 'Negro', 'number', '34', 48000, 98000, 48000, 7, 3)
  RETURNING id INTO v_var2b;

  -- Camiseta Básica
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod3, '', 'Blanca', 'letter', 'M', 18000, 38000, 18000, 20, 5)
  RETURNING id INTO v_var3a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod3, '', 'Negra', 'letter', 'M', 18000, 38000, 18000, 15, 5)
  RETURNING id INTO v_var3b;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod3, '', 'Gris', 'letter', 'L', 18000, 38000, 18000, 18, 5)
  RETURNING id INTO v_var3c;

  -- Camiseta Polo
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod4, '', 'Azul marino', 'letter', 'M', 32000, 68000, 32000, 9, 3)
  RETURNING id INTO v_var4a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod4, '', 'Blanca', 'letter', 'L', 32000, 68000, 32000, 7, 3)
  RETURNING id INTO v_var4b;

  -- Bermuda Cargo
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod5, '', 'Verde oliva', 'number', '32', 38000, 78000, 38000, 11, 3)
  RETURNING id INTO v_var5a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod5, '', 'Negro', 'number', '34', 38000, 78000, 38000, 8, 3)
  RETURNING id INTO v_var5b;

  -- Gorra Snapback
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod6, '', 'Negro/Dorado', 'one_size', 'Única', 15000, 35000, 15000, 25, 5)
  RETURNING id INTO v_var6a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod6, '', 'Blanco/Negro', 'one_size', 'Única', 15000, 35000, 15000, 20, 5)
  RETURNING id INTO v_var6b;

  -- Jogger Fleece
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod7, '', 'Gris jaspeado', 'letter', 'M', 42000, 85000, 42000, 10, 3)
  RETURNING id INTO v_var7a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod7, '', 'Negro', 'letter', 'L', 42000, 85000, 42000, 8, 3)
  RETURNING id INTO v_var7b;

  -- Medias deportivas
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod8, '', 'Blancas', 'one_size', 'Única', 8000, 18000, 8000, 40, 10)
  RETURNING id INTO v_var8a;

  -- Boxer
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod9, '', 'Surtido', 'letter', 'M', 12000, 25000, 12000, 30, 8)
  RETURNING id INTO v_var9a;

  -- Jean Relaxed Carhartt
  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod10, '', 'Azul claro', 'number', '34', 60000, 125000, 60000, 5, 3)
  RETURNING id INTO v_var10a;

  INSERT INTO product_variants (product_id, sku, color, size_type, size_value, purchase_price, sale_price, avg_cost, stock, min_stock)
  VALUES (v_prod10, '', 'Azul claro', 'number', '36', 60000, 125000, 60000, 2, 3)
  RETURNING id INTO v_var10b;
  -- v_var10b tiene stock=2 < min_stock=3, aparecerá en alertas de stock bajo

  -- ============================================================
  -- CUSTOMERS
  -- ============================================================
  INSERT INTO customers (full_name, email, phone, notes)
  VALUES ('Carlos Herrera', 'c.herrera@gmail.com', '3001234567', 'Cliente frecuente')
  RETURNING id INTO v_cust1;

  INSERT INTO customers (full_name, email, phone)
  VALUES ('María Fernanda López', 'mflopez@hotmail.com', '3112345678')
  RETURNING id INTO v_cust2;

  INSERT INTO customers (full_name, email, phone)
  VALUES ('Juan David Martínez', 'jdmartinez@gmail.com', '3209876543')
  RETURNING id INTO v_cust3;

  INSERT INTO customers (full_name, email, phone)
  VALUES ('Luisa Ramírez', 'luisa.ramirez@gmail.com', '3187654321')
  RETURNING id INTO v_cust4;

  INSERT INTO customers (full_name, email, phone)
  VALUES ('Andrés Felipe Torres', 'andres.torres@outlook.com', '3005551234')
  RETURNING id INTO v_cust5;

  -- ============================================================
  -- DISCOUNTS
  -- ============================================================
  INSERT INTO discounts (name, type, value, is_active, requires_admin)
  VALUES ('Descuento cliente frecuente 10%', 'percentage', 10, true, false)
  RETURNING id INTO v_disc1;

  INSERT INTO discounts (name, type, value, is_active, requires_admin)
  VALUES ('Descuento especial 15%', 'percentage', 15, true, true)
  RETURNING id INTO v_disc2;

  INSERT INTO discounts (name, type, value, is_active, requires_admin)
  VALUES ('Rebaja fija $10.000', 'fixed', 10000, true, false)
  RETURNING id INTO v_disc3;

  -- ============================================================
  -- PURCHASE ORDERS (para simular entradas de inventario)
  -- ============================================================
  INSERT INTO purchase_orders (supplier_id, created_by, status, notes, total_amount, ordered_at, received_at)
  VALUES (v_sup1, v_admin_id, 'received', 'Pedido mensual jeans',
          2240000,
          now() - interval '45 days',
          now() - interval '43 days')
  RETURNING id INTO v_po1;

  INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
  VALUES
    (v_po1, v_var1a, 10, 55000),
    (v_po1, v_var1b, 15, 55000),
    (v_po1, v_var1c, 8,  55000),
    (v_po1, v_var2a, 12, 48000),
    (v_po1, v_var2b, 10, 48000);

  INSERT INTO purchase_orders (supplier_id, created_by, status, notes, total_amount, ordered_at, received_at)
  VALUES (v_sup2, v_admin_id, 'received', 'Camisetas y polos',
          1376000,
          now() - interval '30 days',
          now() - interval '28 days')
  RETURNING id INTO v_po2;

  INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
  VALUES
    (v_po2, v_var3a, 25, 18000),
    (v_po2, v_var3b, 20, 18000),
    (v_po2, v_var3c, 22, 18000),
    (v_po2, v_var4a, 12, 32000),
    (v_po2, v_var4b, 10, 32000);

  INSERT INTO purchase_orders (supplier_id, created_by, status, notes, total_amount, ordered_at, received_at)
  VALUES (v_sup3, v_admin_id, 'received', 'Accesorios y varios',
          1534000,
          now() - interval '15 days',
          now() - interval '14 days')
  RETURNING id INTO v_po3;

  INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
  VALUES
    (v_po3, v_var6a, 30, 15000),
    (v_po3, v_var6b, 25, 15000),
    (v_po3, v_var7a, 12, 42000),
    (v_po3, v_var7b, 10, 42000),
    (v_po3, v_var8a, 50, 8000),
    (v_po3, v_var9a, 35, 12000);

  -- Registrar movimientos de entrada (initial_stock) para las compras
  INSERT INTO inventory_movements (variant_id, purchase_order_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by)
  VALUES
    (v_var1a, v_po1, 'purchase', 0, 10, 10, 55000, v_admin_id),
    (v_var1b, v_po1, 'purchase', 0, 15, 15, 55000, v_admin_id),
    (v_var1c, v_po1, 'purchase', 0, 8,  8,  55000, v_admin_id),
    (v_var2a, v_po1, 'purchase', 0, 12, 12, 48000, v_admin_id),
    (v_var2b, v_po1, 'purchase', 0, 10, 10, 48000, v_admin_id),
    (v_var3a, v_po2, 'purchase', 0, 25, 25, 18000, v_admin_id),
    (v_var3b, v_po2, 'purchase', 0, 20, 20, 18000, v_admin_id),
    (v_var3c, v_po2, 'purchase', 0, 22, 22, 18000, v_admin_id),
    (v_var4a, v_po2, 'purchase', 0, 12, 12, 32000, v_admin_id),
    (v_var4b, v_po2, 'purchase', 0, 10, 10, 32000, v_admin_id),
    (v_var6a, v_po3, 'purchase', 0, 30, 30, 15000, v_admin_id),
    (v_var6b, v_po3, 'purchase', 0, 25, 25, 15000, v_admin_id),
    (v_var7a, v_po3, 'purchase', 0, 12, 12, 42000, v_admin_id),
    (v_var7b, v_po3, 'purchase', 0, 10, 10, 42000, v_admin_id),
    (v_var8a, v_po3, 'purchase', 0, 50, 50, 8000,  v_admin_id),
    (v_var9a, v_po3, 'purchase', 0, 35, 35, 12000, v_admin_id);

  -- Bermuda y Jean Relaxed — stock inicial sin PO formal
  INSERT INTO inventory_movements (variant_id, movement_type, quantity_before, delta, quantity_after, unit_cost, notes, performed_by)
  VALUES
    (v_var5a,  'initial_stock', 0, 15, 15, 38000, 'Stock inicial apertura', v_admin_id),
    (v_var5b,  'initial_stock', 0, 12, 12, 38000, 'Stock inicial apertura', v_admin_id),
    (v_var10a, 'initial_stock', 0, 8,  8,  60000, 'Stock inicial apertura', v_admin_id),
    (v_var10b, 'initial_stock', 0, 5,  5,  60000, 'Stock inicial apertura', v_admin_id);

  -- ============================================================
  -- SALES (historial de ventas simulado ~30 días atrás)
  -- ============================================================

  -- Venta 1 — hace 28 días, Carlos Herrera, 2 jeans con descuento
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, discount_id, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust1, 'Carlos Herrera', 'c.herrera@gmail.com', '3001234567',
          v_admin_id, v_disc1, 220000, 22000, 198000, 'completed',
          now() - interval '28 days')
  RETURNING id INTO v_sale1;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale1, v_var1a, 1, 110000, 55000),
    (v_sale1, v_var1b, 1, 110000, 55000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var1a, v_sale1, 'sale', 10, -1, 9, 55000, v_admin_id, now() - interval '28 days'),
    (v_var1b, v_sale1, 'sale', 15, -1, 14, 55000, v_admin_id, now() - interval '28 days');

  UPDATE product_variants SET stock = stock - 1 WHERE id IN (v_var1a, v_var1b);

  -- Venta 2 — hace 21 días, María López, camisetas
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust2, 'María Fernanda López', 'mflopez@hotmail.com', '3112345678',
          v_admin_id, 114000, 0, 114000, 'completed',
          now() - interval '21 days')
  RETURNING id INTO v_sale2;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale2, v_var3a, 2, 38000, 18000),
    (v_sale2, v_var3b, 1, 38000, 18000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var3a, v_sale2, 'sale', 25, -2, 23, 18000, v_admin_id, now() - interval '21 days'),
    (v_var3b, v_sale2, 'sale', 20, -1, 19, 18000, v_admin_id, now() - interval '21 days');

  UPDATE product_variants SET stock = stock - 2 WHERE id = v_var3a;
  UPDATE product_variants SET stock = stock - 1 WHERE id = v_var3b;

  -- Venta 3 — hace 18 días, Juan David, gorra + polo
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust3, 'Juan David Martínez', 'jdmartinez@gmail.com', '3209876543',
          v_admin_id, 103000, 0, 103000, 'completed',
          now() - interval '18 days')
  RETURNING id INTO v_sale3;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale3, v_var6a, 1, 35000, 15000),
    (v_sale3, v_var4a, 1, 68000, 32000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var6a, v_sale3, 'sale', 30, -1, 29, 15000, v_admin_id, now() - interval '18 days'),
    (v_var4a, v_sale3, 'sale', 12, -1, 11, 32000, v_admin_id, now() - interval '18 days');

  UPDATE product_variants SET stock = stock - 1 WHERE id IN (v_var6a, v_var4a);

  -- Venta 4 — hace 12 días, Luisa Ramírez, jogger + medias
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, discount_id, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust4, 'Luisa Ramírez', 'luisa.ramirez@gmail.com', '3187654321',
          v_admin_id, v_disc3, 103000, 10000, 93000, 'completed',
          now() - interval '12 days')
  RETURNING id INTO v_sale4;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale4, v_var7a, 1, 85000, 42000),
    (v_sale4, v_var8a, 1, 18000, 8000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var7a, v_sale4, 'sale', 12, -1, 11, 42000, v_admin_id, now() - interval '12 days'),
    (v_var8a, v_sale4, 'sale', 50, -1, 49, 8000, v_admin_id, now() - interval '12 days');

  UPDATE product_variants SET stock = stock - 1 WHERE id IN (v_var7a, v_var8a);

  -- Venta 5 — hace 7 días, Andrés Torres, 2 camisetas + boxer
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust5, 'Andrés Felipe Torres', 'andres.torres@outlook.com', '3005551234',
          v_admin_id, 101000, 0, 101000, 'completed',
          now() - interval '7 days')
  RETURNING id INTO v_sale5;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale5, v_var3c, 2, 38000, 18000),
    (v_sale5, v_var9a, 1, 25000, 12000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var3c, v_sale5, 'sale', 22, -2, 20, 18000, v_admin_id, now() - interval '7 days'),
    (v_var9a, v_sale5, 'sale', 35, -1, 34, 12000, v_admin_id, now() - interval '7 days');

  UPDATE product_variants SET stock = stock - 2 WHERE id = v_var3c;
  UPDATE product_variants SET stock = stock - 1 WHERE id = v_var9a;

  -- Venta 6 — hace 4 días, Carlos Herrera de nuevo (cliente frecuente)
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, discount_id, subtotal, discount_amount, total, status, created_at)
  VALUES (v_cust1, 'Carlos Herrera', 'c.herrera@gmail.com', '3001234567',
          v_admin_id, v_disc1, 196000, 19600, 176400, 'completed',
          now() - interval '4 days')
  RETURNING id INTO v_sale6;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale6, v_var1c, 1, 115000, 55000),
    (v_sale6, v_var5a, 1, 78000, 38000),
    (v_sale6, v_var6b, 1, 35000, 15000);

  -- Ajustar stock: sale6
  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var1c, v_sale6, 'sale', 8, -1, 7, 55000, v_admin_id, now() - interval '4 days'),
    (v_var5a, v_sale6, 'sale', 15, -1, 14, 38000, v_admin_id, now() - interval '4 days'),
    (v_var6b, v_sale6, 'sale', 25, -1, 24, 15000, v_admin_id, now() - interval '4 days');

  UPDATE product_variants SET stock = stock - 1 WHERE id IN (v_var1c, v_var5a, v_var6b);

  -- Venta 7 — hace 2 días, venta cancelada (para mostrar estado)
  INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone,
                     created_by, subtotal, discount_amount, total, status, notes, created_at)
  VALUES (v_cust3, 'Juan David Martínez', 'jdmartinez@gmail.com', '3209876543',
          v_admin_id, 110000, 0, 110000, 'cancelled', 'Cliente se arrepintió',
          now() - interval '2 days')
  RETURNING id INTO v_sale7;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES (v_sale7, v_var10a, 1, 125000, 60000);

  -- Venta 8 — ayer, cliente anónimo
  INSERT INTO sales (customer_name, customer_email, customer_phone,
                     created_by, subtotal, discount_amount, total, status, created_at)
  VALUES ('Consumidor final', 'sin-email@primos.co', '',
          v_admin_id, 78000, 0, 78000, 'completed',
          now() - interval '1 day')
  RETURNING id INTO v_sale8;

  INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot)
  VALUES
    (v_sale8, v_var5b, 1, 78000, 38000);

  INSERT INTO inventory_movements (variant_id, sale_id, movement_type, quantity_before, delta, quantity_after, unit_cost, performed_by, created_at)
  VALUES
    (v_var5b, v_sale8, 'sale', 12, -1, 11, 38000, v_admin_id, now() - interval '1 day');

  UPDATE product_variants SET stock = stock - 1 WHERE id = v_var5b;

  -- ============================================================
  -- WARRANTIES / EXCHANGES
  -- ============================================================
  -- Garantía pendiente — sale2 (camiseta defectuosa)
  INSERT INTO warranties_exchanges (original_sale_id, new_variant_id, handled_by, type, reason, status, notes)
  VALUES (v_sale2, v_var3a, v_admin_id, 'warranty',
          'Camiseta con costura suelta en el cuello',
          'pending',
          'Cliente trae la prenda el próximo fin de semana');

  -- Cambio resuelto — sale3 (talla incorrecta en polo)
  INSERT INTO warranties_exchanges (original_sale_id, new_variant_id, handled_by, type, reason, status, notes)
  VALUES (v_sale3, v_var4b, v_admin_id, 'exchange',
          'Talla M quedó pequeña, cambio por talla L',
          'resolved',
          'Se realizó el cambio sin inconvenientes');

  -- ============================================================
  -- AJUSTE MANUAL de inventario (para mostrar movimientos variados)
  -- ============================================================
  INSERT INTO inventory_movements (variant_id, movement_type, quantity_before, delta, quantity_after, notes, performed_by, created_at)
  VALUES (v_var10b, 'manual_adjustment', 5, -3, 2,
          'Ajuste por inventario físico — 3 unidades dañadas en bodega',
          v_admin_id, now() - interval '10 days');

  UPDATE product_variants SET stock = 2 WHERE id = v_var10b;

  RAISE NOTICE '✅ Seed demo completado correctamente.';
  RAISE NOTICE '   Marcas: 5 | Proveedores: 3 | Productos: 10 | Variantes: ~21';
  RAISE NOTICE '   Clientes: 5 | Ventas: 8 | Órdenes de compra: 3 | Descuentos: 3';

END $$;
