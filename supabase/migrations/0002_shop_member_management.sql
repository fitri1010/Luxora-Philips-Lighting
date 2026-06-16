-- ============================================================
-- 0002 — Shop member management (list, roles, removal, invite code)
-- ============================================================

-- Store email in profiles so the owner can see members by email.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email
  from auth.users u where u.id = p.id and p.email is null;

-- Trigger now also records the email on signup.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role, shop_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'OWNER'),
    new.raw_user_meta_data->>'shop_name',
    new.email
  );
  return new;
end; $$;

-- Is the caller the owner of their current shop?
create or replace function public.is_shop_owner() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.shops
    where id = public.current_shop_id() and owner_id = auth.uid()
  )
$$;

-- Members can read each other's profile (so the owner can list the team).
drop policy if exists "read shop members" on public.profiles;
create policy "read shop members" on public.profiles for select
  using (shop_id = public.current_shop_id());

-- Owner can update their own shop (e.g. regenerate join code).
drop policy if exists "owner update shop" on public.shops;
create policy "owner update shop" on public.shops for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Owner-only management actions (security definer = bypass RLS, validated inside).
create or replace function public.set_member_role(member_id uuid, new_role text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.is_shop_owner() then raise exception 'Hanya owner yang boleh.'; end if;
  if new_role not in ('OWNER','STAFF','ACCOUNTANT') then raise exception 'Role tidak valid.'; end if;
  update public.profiles set role = new_role
    where id = member_id and shop_id = public.current_shop_id();
end; $$;

create or replace function public.remove_shop_member(member_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare own uuid;
begin
  if not public.is_shop_owner() then raise exception 'Hanya owner yang boleh.'; end if;
  select owner_id into own from public.shops where id = public.current_shop_id();
  if member_id = own then raise exception 'Owner tidak dapat dikeluarkan.'; end if;
  update public.profiles set shop_id = null
    where id = member_id and shop_id = public.current_shop_id();
end; $$;

create or replace function public.regenerate_join_code() returns text
  language plpgsql security definer set search_path = public as $$
declare code text;
begin
  if not public.is_shop_owner() then raise exception 'Hanya owner yang boleh.'; end if;
  code := upper(substr(md5(random()::text), 1, 6));
  update public.shops set join_code = code where id = public.current_shop_id();
  return code;
end; $$;
