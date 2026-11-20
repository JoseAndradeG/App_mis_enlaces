-- =====================================================
-- Mis enlaces: tablas y reglas de seguridad (RLS)
-- Pega TODO este archivo en el SQL Editor de Supabase
-- y pulsa "Run". Se puede ejecutar más de una vez.
-- =====================================================

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  activada_en timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, nombre)
);

create table if not exists public.enlaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  url text not null,
  nombre text not null,
  resumen text,
  created_at timestamptz not null default now()
);

create index if not exists enlaces_user_idx on public.enlaces(user_id);
create index if not exists enlaces_categoria_idx on public.enlaces(categoria_id);

-- Seguridad: cada persona solo ve y toca sus propias filas
alter table public.categorias enable row level security;
alter table public.enlaces enable row level security;

drop policy if exists "categorias_select" on public.categorias;
drop policy if exists "categorias_insert" on public.categorias;
drop policy if exists "categorias_update" on public.categorias;
drop policy if exists "categorias_delete" on public.categorias;
drop policy if exists "enlaces_select" on public.enlaces;
drop policy if exists "enlaces_insert" on public.enlaces;
drop policy if exists "enlaces_update" on public.enlaces;
drop policy if exists "enlaces_delete" on public.enlaces;

create policy "categorias_select" on public.categorias
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "categorias_insert" on public.categorias
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categorias_update" on public.categorias
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categorias_delete" on public.categorias
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "enlaces_select" on public.enlaces
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "enlaces_insert" on public.enlaces
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.categorias c
                where c.id = categoria_id and c.user_id = (select auth.uid()))
  );
create policy "enlaces_update" on public.enlaces
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.categorias c
                where c.id = categoria_id and c.user_id = (select auth.uid()))
  );
create policy "enlaces_delete" on public.enlaces
  for delete to authenticated using ((select auth.uid()) = user_id);
