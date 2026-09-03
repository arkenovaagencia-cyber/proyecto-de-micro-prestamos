-- ============================================================
-- PLATAFORMA DE MICROPRÉSTAMOS — Reinicio a esquema multi-prestamista
-- Pega TODO este archivo en Supabase → SQL Editor → New query → Run
-- ⚠️ Este script ELIMINA las tablas del esquema anterior (profiles,
--    prestamos, pagos de schema.sql) y todos sus datos. Úsalo solo si
--    estás de acuerdo en empezar de cero sobre este mismo proyecto.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- LIMPIEZA: fuera el esquema de un solo negocio
-- ------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.pagos cascade;
drop table if exists public.prestamos cascade;
drop table if exists public.profiles cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.handle_new_user() cascade;

-- ============================================================
-- 1. PRESTAMISTAS (tenants — cada negocio dentro de la plataforma)
-- ============================================================
create table public.prestamistas (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  slug text unique not null,               -- para URLs propias en el futuro (ej. plataforma.com/p/mi-negocio)
  logo_url text,
  color_primario text default '#0B4F4A',
  color_acento text default '#FF8A3D',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.prestamistas is 'Cada negocio/prestamista que usa la plataforma (multi-tenant).';

-- ============================================================
-- 2. PROFILES (usuarios — clientes, admin de prestamista, admin de plataforma)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  prestamista_id uuid references public.prestamistas(id) on delete set null, -- null si es admin de plataforma
  role text not null default 'cliente' check (role in ('cliente','prestamista_admin','plataforma_admin')),
  nombre text not null,
  telefono text,
  cedula text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Todo usuario autenticado. prestamista_id indica a qué negocio pertenece (null = admin de toda la plataforma).';
create index idx_profiles_prestamista on public.profiles(prestamista_id);

-- ============================================================
-- 3. CLIENTES (ficha de negocio, separada del login)
-- ============================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  prestamista_id uuid not null references public.prestamistas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  nombre_completo text not null,
  cedula text,
  telefono text not null,
  correo text,
  direccion text,
  estado text not null default 'activo' check (estado in ('activo','inactivo','en_mora')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clientes_prestamista on public.clientes(prestamista_id);

-- ============================================================
-- 4. PRESTAMOS
-- ============================================================
create table public.prestamos (
  id uuid primary key default gen_random_uuid(),
  prestamista_id uuid not null references public.prestamistas(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  monto_solicitado numeric(12,2) not null check (monto_solicitado > 0),
  monto_aprobado numeric(12,2),
  tasa_interes numeric(5,2) not null default 20,
  plazo_cuotas int not null check (plazo_cuotas > 0),
  frecuencia_pago text not null default 'mensual' check (frecuencia_pago in ('semanal','quincenal','mensual')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','revision','aprobado','rechazado','activo','pagado','en_mora','cancelado')),
  motivo_rechazo text,
  saldo_pendiente numeric(12,2),
  fecha_solicitud timestamptz not null default now(),
  fecha_aprobacion timestamptz,
  aprobado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_prestamos_prestamista on public.prestamos(prestamista_id);
create index idx_prestamos_cliente on public.prestamos(cliente_id);

-- ============================================================
-- 5. CUOTAS
-- ============================================================
create table public.cuotas (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  numero_cuota int not null,
  fecha_vencimiento date not null,
  monto_cuota numeric(12,2) not null,
  monto_pagado numeric(12,2) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente','pagada','parcial','vencida')),
  unique (prestamo_id, numero_cuota)
);
create index idx_cuotas_prestamo on public.cuotas(prestamo_id);

-- ============================================================
-- 6. PAGOS (con métodos y verificación de comprobantes)
-- ============================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  prestamista_id uuid not null references public.prestamistas(id) on delete cascade,
  prestamo_id uuid not null references public.prestamos(id) on delete restrict,
  cuota_id uuid references public.cuotas(id) on delete set null,
  monto numeric(12,2) not null check (monto > 0),
  metodo text not null default 'efectivo' check (metodo in ('efectivo','transferencia','paypal')),
  estado text not null default 'confirmado' check (estado in ('pendiente','confirmado','rechazado')),
  comprobante_url text,
  fecha_pago timestamptz not null default now(),
  registrado_por uuid references public.profiles(id),
  notas text,
  created_at timestamptz not null default now()
);
create index idx_pagos_prestamista on public.pagos(prestamista_id);
create index idx_pagos_prestamo on public.pagos(prestamo_id);

-- ============================================================
-- 7. GARANTIAS
-- ============================================================
create table public.garantias (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  tipo text not null check (tipo in ('telefono','tv','vehiculo','joyas','electronico','otro')),
  descripcion text not null,
  valor_estimado numeric(12,2),
  fotos text[] default '{}',
  documentos text[] default '{}',
  estado text not null default 'pendiente_verificacion'
    check (estado in ('pendiente_verificacion','verificada','rechazada','devuelta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_garantias_prestamo on public.garantias(prestamo_id);

-- ============================================================
-- 8. CONFIGURACION_PLATAFORMA (una fila por prestamista — la base del panel CMS)
-- ============================================================
create table public.configuracion_plataforma (
  prestamista_id uuid primary key references public.prestamistas(id) on delete cascade,
  nombre_publico text,
  logo_url text,
  color_primario text,
  color_acento text,
  hero_titulo text,
  hero_subtitulo text,
  banners jsonb default '[]',
  faq jsonb default '[]',
  contacto jsonb default '{}',          -- {telefono, correo, direccion}
  redes_sociales jsonb default '{}',    -- {facebook, instagram, whatsapp, ...}
  metodos_pago_activos jsonb default '["efectivo"]',
  info_transferencia jsonb default '{}',-- {banco, cuenta, titular}
  config_prestamos jsonb default '{}',  -- {tasa_default, plazos_disponibles, monto_min, monto_max}
  funciones_activas jsonb default '{}', -- {garantias:true, paypal:false, ...}
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
comment on table public.configuracion_plataforma is 'Todo lo que el panel CMS de cada prestamista puede editar sin tocar código.';

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_prestamistas_updated before update on public.prestamistas
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_clientes_updated before update on public.clientes
  for each row execute function public.set_updated_at();
create trigger trg_prestamos_updated before update on public.prestamos
  for each row execute function public.set_updated_at();
create trigger trg_garantias_updated before update on public.garantias
  for each row execute function public.set_updated_at();

create or replace function public.mi_prestamista_id()
returns uuid language sql security definer stable as $$
  select prestamista_id from public.profiles where id = auth.uid();
$$;

create or replace function public.mi_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.es_admin_plataforma()
returns boolean language sql security definer stable as $$
  select public.mi_role() = 'plataforma_admin';
$$;

create or replace function public.es_admin_de(p_prestamista_id uuid)
returns boolean language sql security definer stable as $$
  select public.es_admin_plataforma()
    or (public.mi_role() = 'prestamista_admin' and public.mi_prestamista_id() = p_prestamista_id);
$$;

-- Crear perfil automáticamente al registrarse (rol y prestamista vienen en metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, telefono, cedula, role, prestamista_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'cedula',
    coalesce(new.raw_user_meta_data->>'role', 'cliente'),
    nullif(new.raw_user_meta_data->>'prestamista_id','')::uuid
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Actualizar saldo del préstamo al registrar un pago confirmado
create or replace function public.actualizar_saldo_prestamo()
returns trigger language plpgsql as $$
begin
  if new.estado = 'confirmado' then
    update public.prestamos
    set saldo_pendiente = coalesce(saldo_pendiente, monto_aprobado) - new.monto
    where id = new.prestamo_id;

    if (select saldo_pendiente from public.prestamos where id = new.prestamo_id) <= 0 then
      update public.prestamos set estado = 'pagado' where id = new.prestamo_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_pagos_actualizar_saldo after insert or update on public.pagos
  for each row execute function public.actualizar_saldo_prestamo();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.prestamistas enable row level security;
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.prestamos enable row level security;
alter table public.cuotas enable row level security;
alter table public.pagos enable row level security;
alter table public.garantias enable row level security;
alter table public.configuracion_plataforma enable row level security;

-- PRESTAMISTAS: cualquiera autenticado puede ver los activos (necesario para landing pública); solo admin de plataforma edita
create policy "prestamistas_select_activos" on public.prestamistas for select using (activo or public.es_admin_plataforma());
create policy "prestamistas_admin_write" on public.prestamistas for insert with check (public.es_admin_plataforma());
create policy "prestamistas_admin_update" on public.prestamistas for update using (public.es_admin_plataforma());

-- PROFILES
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.es_admin_de(prestamista_id));
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or public.es_admin_de(prestamista_id));

-- CLIENTES
create policy "clientes_select" on public.clientes for select
  using (public.es_admin_de(prestamista_id) or profile_id = auth.uid());
create policy "clientes_admin_write" on public.clientes for insert with check (public.es_admin_de(prestamista_id));
create policy "clientes_admin_update" on public.clientes for update using (public.es_admin_de(prestamista_id));
create policy "clientes_admin_delete" on public.clientes for delete using (public.es_admin_de(prestamista_id));

-- PRESTAMOS
create policy "prestamos_select" on public.prestamos for select
  using (public.es_admin_de(prestamista_id) or cliente_id in (select id from public.clientes where profile_id = auth.uid()));
create policy "prestamos_insert" on public.prestamos for insert
  with check (public.es_admin_de(prestamista_id) or cliente_id in (select id from public.clientes where profile_id = auth.uid()));
create policy "prestamos_admin_update" on public.prestamos for update using (public.es_admin_de(prestamista_id));

-- CUOTAS (via prestamo)
create policy "cuotas_select" on public.cuotas for select using (
  exists (select 1 from public.prestamos p where p.id = prestamo_id
    and (public.es_admin_de(p.prestamista_id) or p.cliente_id in (select id from public.clientes where profile_id = auth.uid())))
);
create policy "cuotas_admin_write" on public.cuotas for insert with check (
  exists (select 1 from public.prestamos p where p.id = prestamo_id and public.es_admin_de(p.prestamista_id))
);
create policy "cuotas_admin_update" on public.cuotas for update using (
  exists (select 1 from public.prestamos p where p.id = prestamo_id and public.es_admin_de(p.prestamista_id))
);

-- PAGOS: cliente puede subir su propio comprobante (queda pendiente); admin confirma/rechaza
create policy "pagos_select" on public.pagos for select using (
  public.es_admin_de(prestamista_id)
  or prestamo_id in (select p.id from public.prestamos p join public.clientes c on c.id=p.cliente_id where c.profile_id = auth.uid())
);
create policy "pagos_cliente_sube_comprobante" on public.pagos for insert with check (
  estado = 'pendiente'
  and prestamo_id in (select p.id from public.prestamos p join public.clientes c on c.id=p.cliente_id where c.profile_id = auth.uid())
);
create policy "pagos_admin_write" on public.pagos for insert with check (public.es_admin_de(prestamista_id));
create policy "pagos_admin_update" on public.pagos for update using (public.es_admin_de(prestamista_id));

-- GARANTIAS (via prestamo)
create policy "garantias_select" on public.garantias for select using (
  exists (select 1 from public.prestamos p where p.id = prestamo_id
    and (public.es_admin_de(p.prestamista_id) or p.cliente_id in (select id from public.clientes where profile_id = auth.uid())))
);
create policy "garantias_cliente_insert" on public.garantias for insert with check (
  exists (select 1 from public.prestamos p join public.clientes c on c.id=p.cliente_id
    where p.id = prestamo_id and c.profile_id = auth.uid())
);
create policy "garantias_admin_update" on public.garantias for update using (
  exists (select 1 from public.prestamos p where p.id = prestamo_id and public.es_admin_de(p.prestamista_id))
);

-- CONFIGURACION_PLATAFORMA: lectura pública (para pintar la landing de cada prestamista); solo su admin edita
create policy "config_select_public" on public.configuracion_plataforma for select using (true);
create policy "config_admin_upsert" on public.configuracion_plataforma for insert with check (public.es_admin_de(prestamista_id));
create policy "config_admin_update" on public.configuracion_plataforma for update using (public.es_admin_de(prestamista_id));

-- ============================================================
-- ALMACENAMIENTO: buckets para comprobantes, garantías y assets de marca
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('comprobantes', 'comprobantes', false),
  ('garantias', 'garantias', false),
  ('branding', 'branding', true)   -- logos e imágenes de landing, públicos por diseño
on conflict (id) do nothing;

create policy "sube_su_comprobante" on storage.objects for insert with check (
  bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "ve_comprobantes_propios_o_admin" on storage.objects for select using (
  bucket_id = 'comprobantes' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin_plataforma())
);
create policy "sube_foto_garantia" on storage.objects for insert with check (
  bucket_id = 'garantias' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "ve_garantias_propias_o_admin" on storage.objects for select using (
  bucket_id = 'garantias' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin_plataforma())
);
create policy "branding_lectura_publica" on storage.objects for select using (bucket_id = 'branding');
create policy "branding_solo_admin_sube" on storage.objects for insert with check (
  bucket_id = 'branding' and public.es_admin_plataforma()
);

-- ============================================================
-- Fin del script.
-- ============================================================
