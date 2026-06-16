-- ============================================================
-- 0001 — Multi-user shops + normalized per-shop tables (RLS)
-- ============================================================

-- ===== SHOPS + MEMBERSHIP =====
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id),
  join_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists shop_id uuid references public.shops(id);

create or replace function public.current_shop_id() returns uuid
  language sql security definer stable set search_path = public as $$
  select shop_id from public.profiles where id = auth.uid()
$$;

alter table public.shops enable row level security;
drop policy if exists "members read shop" on public.shops;
create policy "members read shop" on public.shops for select
  using (id = public.current_shop_id() or owner_id = auth.uid());
drop policy if exists "create own shop" on public.shops;
create policy "create own shop" on public.shops for insert with check (owner_id = auth.uid());

create or replace function public.join_shop_by_code(code text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select id into sid from public.shops where join_code = upper(code);
  if sid is null then raise exception 'Kode toko tidak ditemukan'; end if;
  update public.profiles set shop_id = sid where id = auth.uid();
  return sid;
end; $$;

-- ===== NORMALIZED PER-SHOP TABLES =====
drop table if exists public.business_data;

create table if not exists public.orders (
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id text not null, order_date text, customer_name text, customer_phone text,
  province text, city text, district text, product_name text, category text, sku text,
  qty int, unit_price bigint, gross_sales bigint, discount bigint, net_sales bigint, order_status text,
  admin_fee bigint, service_fee bigint, handling_fee bigint,
  shipping_paid_by_buyer bigint, shipping_forwarded_to_courier bigint,
  primary key (shop_id, order_id)
);
create table if not exists public.pos_transactions (
  shop_id uuid not null references public.shops(id) on delete cascade,
  transaction_id text not null, cashier_name text, transaction_date text, customer_name text,
  product_name text, qty int, selling_price bigint, total_amount bigint, payment_method text,
  primary key (shop_id, transaction_id)
);
create table if not exists public.inventory_items (
  shop_id uuid not null references public.shops(id) on delete cascade,
  sku text not null, product_name text, stock_beginning int, stock_in int, stock_out int,
  stock_return int, stock_ending int, minimum_stock int, cost_price bigint,
  primary key (shop_id, sku)
);
create table if not exists public.risk_items (
  shop_id uuid not null references public.shops(id) on delete cascade,
  id text not null, order_id text, product_name text, sku text,
  return_status text, return_reason text, cancel_reason text,
  damaged_goods boolean, lost_package boolean, return_loss bigint, date text,
  qty int, inspection_status text,
  primary key (shop_id, id)
);
create table if not exists public.zakat_records (
  shop_id uuid not null references public.shops(id) on delete cascade,
  id text not null, date text, calculated_wealth bigint, zakat_amount bigint,
  nishab_status text, payment_status text, channel text,
  primary key (shop_id, id)
);
create table if not exists public.anomalies (
  shop_id uuid not null references public.shops(id) on delete cascade,
  id text not null, type text, severity text, title text, description text, date text,
  status text, impact_value bigint, metadata jsonb,
  primary key (shop_id, id)
);
create table if not exists public.shop_settings (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  doc jsonb not null default '{}', updated_at timestamptz default now()
);

-- RLS: only members of the shop may access these rows
do $$ declare t text;
begin
  foreach t in array array['orders','pos_transactions','inventory_items','risk_items','zakat_records','anomalies','shop_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "shop members all" on public.%I', t);
    execute format('create policy "shop members all" on public.%I for all using (shop_id = public.current_shop_id()) with check (shop_id = public.current_shop_id())', t);
  end loop;
end $$;
