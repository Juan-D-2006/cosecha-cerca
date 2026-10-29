-- Bucket público para fotos de productos; cada agricultor sube solo a su carpeta {user_id}/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy product_images_farmer_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.app_user_role() = 'farmer'
  );

create policy product_images_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and owner_id = (select auth.uid())::text);
