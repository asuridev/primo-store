-- ============================================================
-- PRIMOS STORE — Storage Bucket Policies
-- ============================================================

-- product-images: público para lectura, admin para escritura
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND get_user_role() = 'admin'
  );

CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND get_user_role() = 'admin'
  );

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND get_user_role() = 'admin'
  );

-- receipts: solo service_role puede subir; autenticados pueden leer los suyos
CREATE POLICY "receipts_authenticated_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts');
