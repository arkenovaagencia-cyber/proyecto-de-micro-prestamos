-- Corre esto UNA VEZ en Supabase → SQL Editor, antes de registrarte en la app.
-- Crea tu propio negocio como el primer "prestamista" de la plataforma.

insert into public.prestamistas (nombre_negocio, slug, color_primario, color_acento)
values ('Prestamigo', 'prestamigo', '#0B4F4A', '#FF8A3D');

-- Verifica que se creó:
select * from public.prestamistas;
