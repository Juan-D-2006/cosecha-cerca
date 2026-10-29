-- =====================================================================
-- CosechaCerca · Esquema inicial (Supabase / PostgreSQL + PostGIS)
-- =====================================================================
create extension if not exists postgis with schema extensions;

-- ---------- Tipos ----------
create type public.user_role        as enum ('farmer', 'buyer', 'admin');
create type public.buyer_type       as enum ('market', 'restaurant', 'community_kitchen', 'other');
create type public.unit_type        as enum ('kg', 'unit', 'box', 'bunch', 'liter');
create type public.listing_status   as enum ('active', 'sold_out', 'expired', 'paused');
create type public.order_status     as enum ('pending', 'confirmed', 'ready', 'completed', 'cancelled', 'expired');
create type public.fulfillment_type as enum ('pickup', 'delivery');

-- ---------- Utilidad: updated_at ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Perfiles (1:1 con auth.users) ----------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              public.user_role not null,
  buyer_type        public.buyer_type,
  full_name         text not null,
  organization_name text,                -- nombre de la chacra, restaurante o comedor
  phone             text,
  bio               text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint buyer_needs_type check (role <> 'buyer' or buyer_type is not null)
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Rol del usuario actual (usado en políticas RLS y funciones)
create or replace function public.app_user_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------- Ubicaciones (puntos de recojo / entrega) ----------
create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  label      text not null,              -- "Chacra Pachacámac", "Local Surquillo"
  address    text,
  district   text,
  geog       extensions.geography(Point, 4326) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index locations_geog_idx  on public.locations using gist (geog);
create index locations_owner_idx on public.locations (owner_id);
create unique index locations_one_default on public.locations (owner_id) where is_default;

-- ---------- Categorías ----------
create table public.categories (
  id   smallint generated always as identity primary key,
  slug text unique not null,
  name text not null
);
insert into public.categories (slug, name) values
  ('verduras', 'Verduras'), ('frutas', 'Frutas'), ('tuberculos', 'Tubérculos'),
  ('granos', 'Granos y menestras'), ('hierbas', 'Hierbas aromáticas'),
  ('lacteos', 'Lácteos'), ('huevos', 'Huevos'), ('otros', 'Otros');

-- ---------- Publicaciones de cosecha / excedentes ----------
create table public.listings (
  id                 uuid primary key default gen_random_uuid(),
  farmer_id          uuid not null references public.profiles (id) on delete cascade,
  location_id        uuid not null references public.locations (id),
  category_id        smallint references public.categories (id),
  title              text not null check (char_length(title) between 3 and 120),
  description        text,
  unit               public.unit_type not null,
  price_per_unit     numeric(10,2) not null check (price_per_unit >= 0),
  quantity_total     numeric(10,2) not null check (quantity_total > 0),
  quantity_available numeric(10,2) not null check (quantity_available >= 0),
  min_order_qty      numeric(10,2) not null default 1 check (min_order_qty > 0),
  harvested_at       date,
  available_until    timestamptz not null,       -- después de esto, se pierde
  is_surplus         boolean not null default false,  -- excedente (prioridad anti-desperdicio)
  image_url          text,
  status             public.listing_status not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint qty_le_total check (quantity_available <= quantity_total)
);
create index listings_active_idx   on public.listings (status, available_until);
create index listings_farmer_idx   on public.listings (farmer_id);
create index listings_category_idx on public.listings (category_id);
create index listings_location_idx on public.listings (location_id);
create trigger trg_listings_updated before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------- Pedidos (un pedido = un agricultor) ----------
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid not null references public.profiles (id),
  farmer_id      uuid not null references public.profiles (id),
  status         public.order_status not null default 'pending',
  fulfillment    public.fulfillment_type not null default 'pickup',
  pickup_at      timestamptz,
  notes          text,
  total          numeric(12,2) not null default 0,
  reserved_until timestamptz,        -- si el agricultor no confirma antes, se libera el stock
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_buyer_idx   on public.orders (buyer_id, created_at desc);
create index orders_farmer_idx  on public.orders (farmer_id, created_at desc);
create index orders_pending_idx on public.orders (reserved_until) where status = 'pending';
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  listing_id uuid not null references public.listings (id),
  quantity   numeric(10,2) not null check (quantity > 0),
  unit_price numeric(10,2) not null,   -- precio congelado al momento del pedido
  subtotal   numeric(12,2) generated always as (quantity * unit_price) stored
);
create index order_items_order_idx   on public.order_items (order_id);
create index order_items_listing_idx on public.order_items (listing_id);

-- =====================================================================
-- Alta automática de perfil al registrarse (metadata del signUp)
-- =====================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'buyer');
begin
  if v_role = 'admin' then v_role := 'buyer'; end if;   -- nadie se auto-asigna admin
  insert into public.profiles (id, role, buyer_type, full_name, organization_name, phone)
  values (
    new.id,
    v_role,
    case when v_role = 'buyer'
         then coalesce((new.raw_user_meta_data->>'buyer_type')::public.buyer_type, 'other') end,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Búsqueda por cercanía (catálogo)
-- security definer: expone solo columnas públicas, sin teléfono ni dirección exacta
-- =====================================================================
create or replace function public.nearby_listings(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_km    double precision default 25,
  p_category     text    default null,
  p_surplus_only boolean default false,
  p_search       text    default null,
  p_limit        int     default 50
) returns table (
  id uuid, title text, description text, category_slug text, category_name text,
  unit public.unit_type, price_per_unit numeric, quantity_available numeric,
  min_order_qty numeric, available_until timestamptz, is_surplus boolean, image_url text,
  farmer_id uuid, farmer_name text, district text, distance_km double precision
)
language sql stable security definer set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select l.id, l.title, l.description, c.slug, c.name,
         l.unit, l.price_per_unit, l.quantity_available,
         l.min_order_qty, l.available_until, l.is_surplus, l.image_url,
         p.id, coalesce(p.organization_name, p.full_name), loc.district,
         round((st_distance(loc.geog, o.g) / 1000)::numeric, 2)::double precision
  from public.listings l
  join public.locations loc on loc.id = l.location_id
  join public.profiles  p   on p.id   = l.farmer_id
  left join public.categories c on c.id = l.category_id
  cross join origin o
  where l.status = 'active'
    and l.available_until > now()
    and l.quantity_available > 0
    and st_dwithin(loc.geog, o.g, least(p_radius_km, 200) * 1000)
    and (p_category is null or c.slug = p_category)
    and (not p_surplus_only or l.is_surplus)
    and (p_search is null or l.title ilike '%' || p_search || '%')
  order by st_distance(loc.geog, o.g), l.available_until
  limit least(greatest(p_limit, 1), 100)
$$;

-- =====================================================================
-- Pedidos con reserva atómica de inventario
-- =====================================================================
-- Devuelve el stock de un pedido (uso interno)
create or replace function public.release_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.listings l
     set quantity_available = l.quantity_available + oi.qty,
         status = case when l.status = 'sold_out' and l.available_until > now()
                       then 'active'::public.listing_status else l.status end
    from (select listing_id, sum(quantity) as qty
            from public.order_items where order_id = p_order_id
           group by listing_id) oi
   where l.id = oi.listing_id;
end $$;

-- Crea un pedido y descuenta stock en una sola transacción.
-- p_items: [{"listing_id": "uuid", "quantity": 5}, ...]
create or replace function public.create_order(
  p_items       jsonb,
  p_fulfillment public.fulfillment_type default 'pickup',
  p_pickup_at   timestamptz default null,
  p_notes       text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_buyer    uuid := auth.uid();
  v_farmer   uuid;
  v_order_id uuid;
  v_total    numeric(12,2) := 0;
  v_item     record;
  v_listing  public.listings%rowtype;
begin
  if v_buyer is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if public.app_user_role() is distinct from 'buyer' then
    raise exception 'Solo los compradores pueden crear pedidos' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  select farmer_id into v_farmer
    from public.listings where id = (p_items->0->>'listing_id')::uuid;
  if v_farmer is null then
    raise exception 'Producto no encontrado';
  end if;

  insert into public.orders (buyer_id, farmer_id, fulfillment, pickup_at, notes, reserved_until)
  values (v_buyer, v_farmer, p_fulfillment, p_pickup_at, p_notes, now() + interval '24 hours')
  returning id into v_order_id;

  -- Orden por id para bloquear filas siempre en el mismo orden (evita deadlocks)
  for v_item in
    select (e->>'listing_id')::uuid as listing_id, (e->>'quantity')::numeric as quantity
      from jsonb_array_elements(p_items) e
     order by 1
  loop
    select * into v_listing from public.listings where id = v_item.listing_id for update;

    if not found then
      raise exception 'Producto % no encontrado', v_item.listing_id;
    elsif v_listing.farmer_id <> v_farmer then
      raise exception 'Todos los productos de un pedido deben ser del mismo agricultor';
    elsif v_listing.status <> 'active' or v_listing.available_until <= now() then
      raise exception '"%" ya no está disponible', v_listing.title;
    elsif v_item.quantity is null or v_item.quantity < v_listing.min_order_qty then
      raise exception 'La cantidad mínima para "%" es %', v_listing.title, v_listing.min_order_qty;
    elsif v_item.quantity > v_listing.quantity_available then
      raise exception 'Stock insuficiente para "%": quedan %', v_listing.title, v_listing.quantity_available;
    end if;

    update public.listings
       set quantity_available = quantity_available - v_item.quantity,
           status = case when quantity_available - v_item.quantity = 0
                         then 'sold_out'::public.listing_status else status end
     where id = v_listing.id;

    insert into public.order_items (order_id, listing_id, quantity, unit_price)
    values (v_order_id, v_listing.id, v_item.quantity, v_listing.price_per_unit);

    v_total := v_total + v_item.quantity * v_listing.price_per_unit;
  end loop;

  update public.orders set total = v_total where id = v_order_id;
  return v_order_id;
end $$;

-- Máquina de estados del pedido:
--   pending -> confirmed -> ready -> completed   (solo el agricultor)
--   pending | confirmed | ready -> cancelled     (comprador o agricultor; devuelve stock)
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   public.order_status
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found or v_uid is null
     or (v_uid is distinct from v_order.buyer_id and v_uid is distinct from v_order.farmer_id) then
    raise exception 'Pedido no encontrado' using errcode = '42501';
  end if;
  if v_order.status in ('completed', 'cancelled', 'expired') then
    raise exception 'El pedido ya está cerrado (%)', v_order.status;
  end if;

  if p_status = 'cancelled' then
    perform public.release_order_stock(p_order_id);
  elsif v_uid <> v_order.farmer_id then
    raise exception 'Solo el agricultor puede avanzar el pedido' using errcode = '42501';
  elsif not ((v_order.status = 'pending'   and p_status = 'confirmed')
          or (v_order.status = 'confirmed' and p_status = 'ready')
          or (v_order.status = 'ready'     and p_status = 'completed')) then
    raise exception 'Transición inválida: % -> %', v_order.status, p_status;
  end if;

  update public.orders
     set status = p_status,
         reserved_until = case when p_status = 'confirmed' then null else reserved_until end
   where id = p_order_id;
end $$;

-- Libera reservas vencidas y marca cosechas expiradas (ejecutar con pg_cron)
create or replace function public.expire_stale() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_count int := 0;
begin
  for v_order in
    select id from public.orders
     where status = 'pending' and reserved_until < now()
     for update skip locked
  loop
    perform public.release_order_stock(v_order.id);
    update public.orders set status = 'expired' where id = v_order.id;
    v_count := v_count + 1;
  end loop;

  update public.listings set status = 'expired'
   where status in ('active', 'sold_out') and available_until < now();

  return v_count;
end $$;

-- Funciones internas: no invocables desde el cliente
revoke execute on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.expire_stale()           from public, anon, authenticated;
revoke execute on function public.handle_new_user()        from public, anon, authenticated;
revoke execute on function public.create_order(jsonb, public.fulfillment_type, timestamptz, text) from public, anon;
revoke execute on function public.update_order_status(uuid, public.order_status) from public, anon;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.locations   enable row level security;
alter table public.categories  enable row level security;
alter table public.listings    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Perfiles: visibles para usuarios autenticados; cada uno edita solo campos no sensibles
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from anon, authenticated;
grant update (full_name, organization_name, phone, bio) on public.profiles to authenticated;

-- Ubicaciones
create policy locations_select on public.locations for select to authenticated using (true);
create policy locations_insert on public.locations for insert to authenticated with check (owner_id = (select auth.uid()));
create policy locations_update on public.locations for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy locations_delete on public.locations for delete to authenticated using (owner_id = (select auth.uid()));

-- Categorías: lectura pública
create policy categories_select on public.categories for select to anon, authenticated using (true);

-- Publicaciones
create policy listings_select on public.listings for select to anon, authenticated using (
  (status = 'active' and available_until > now())
  or farmer_id = (select auth.uid())
  or exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
              where oi.listing_id = listings.id and o.buyer_id = (select auth.uid()))
);
create policy listings_insert on public.listings for insert to authenticated with check (
  farmer_id = (select auth.uid())
  and public.app_user_role() = 'farmer'
  and exists (select 1 from public.locations where id = location_id and owner_id = (select auth.uid()))
);
create policy listings_update on public.listings for update to authenticated
  using (farmer_id = (select auth.uid()))
  with check (
    farmer_id = (select auth.uid())
    and exists (select 1 from public.locations where id = location_id and owner_id = (select auth.uid()))
  );
create policy listings_delete on public.listings for delete to authenticated
  using (farmer_id = (select auth.uid()));

-- Pedidos: solo lectura directa; se crean/modifican vía create_order / update_order_status
create policy orders_select on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or farmer_id = (select auth.uid()));
create policy order_items_select on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id
           and (o.buyer_id = (select auth.uid()) or o.farmer_id = (select auth.uid())))
);
