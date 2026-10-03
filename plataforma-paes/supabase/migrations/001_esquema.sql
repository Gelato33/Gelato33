-- Esquema de la plataforma PAES (preuniversitario organizado por asignaturas).
-- Ejecutar completo en Supabase > SQL Editor (una sola vez por institución).

create extension if not exists pgcrypto;

-- ───────────── Tablas ─────────────

create type rol_usuario as enum ('admin', 'profesor', 'estudiante');
create type tipo_material as enum ('pdf', 'youtube', 'enlace');
create type tipo_evaluacion as enum ('ensayo', 'control', 'tecnico');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  rol rol_usuario not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table asignaturas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  color text not null default '#1860a8',
  activa boolean not null default true
);

-- En qué asignaturas está inscrito cada estudiante.
create table matriculas (
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  estudiante_id uuid not null references profiles (id) on delete cascade,
  primary key (asignatura_id, estudiante_id)
);

-- Qué docentes enseñan cada asignatura (puede haber más de uno).
create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  profesor_id uuid not null references profiles (id) on delete cascade,
  unique (asignatura_id, profesor_id)
);

-- Cada clase corresponde a un contenido de una asignatura.
create table clases (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  profesor_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora time,
  contenido text,
  objetivos text,
  created_at timestamptz not null default now()
);

create table materiales (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  clase_id uuid references clases (id) on delete set null,
  profesor_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  titulo text not null,
  tipo tipo_material not null,
  url text,
  storage_path text,
  created_at timestamptz not null default now(),
  check (url is not null or storage_path is not null)
);

create table evaluaciones (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  profesor_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  titulo text not null,
  tipo tipo_evaluacion not null,
  fecha date not null,
  detalle text
);

create table vistos (
  estudiante_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  material_id uuid not null references materiales (id) on delete cascade,
  primary key (estudiante_id, material_id)
);

create index on matriculas (estudiante_id);
create index on asignaciones (profesor_id);
create index on clases (asignatura_id, fecha);
create index on materiales (asignatura_id);
create index on materiales (clase_id);
create index on evaluaciones (asignatura_id, fecha);

-- ───────────── Funciones auxiliares ─────────────
-- security definer evita recursión entre políticas.

create function mi_rol() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from profiles where id = auth.uid() and activo
$$;

create function mis_asignaturas() returns setof uuid
language sql stable security definer set search_path = public as $$
  select asignatura_id from matriculas where estudiante_id = auth.uid()
$$;

create function enseno(p_asignatura uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from asignaciones where asignatura_id = p_asignatura and profesor_id = auth.uid()
  )
$$;

-- ───────────── Seguridad por filas (RLS) ─────────────

alter table profiles enable row level security;
alter table asignaturas enable row level security;
alter table matriculas enable row level security;
alter table asignaciones enable row level security;
alter table clases enable row level security;
alter table materiales enable row level security;
alter table evaluaciones enable row level security;
alter table vistos enable row level security;

-- profiles: cada uno ve su perfil; todos ven nombres de docentes y admin; el admin ve y edita todo.
create policy profiles_leer on profiles for select to authenticated
  using (id = auth.uid() or mi_rol() = 'admin' or rol in ('profesor', 'admin'));
create policy profiles_admin on profiles for all to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy asignaturas_leer on asignaturas for select to authenticated using (mi_rol() is not null);
create policy asignaturas_admin on asignaturas for all to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy matriculas_leer on matriculas for select to authenticated
  using (estudiante_id = auth.uid() or mi_rol() = 'admin');
create policy matriculas_admin on matriculas for all to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

create policy asignaciones_leer on asignaciones for select to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid() or asignatura_id in (select mis_asignaturas()));
create policy asignaciones_admin on asignaciones for all to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

-- clases: estudiantes ven las de sus asignaturas; cada docente gestiona las suyas.
create policy clases_leer on clases for select to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid() or asignatura_id in (select mis_asignaturas()));
create policy clases_crear on clases for insert to authenticated
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(asignatura_id)))
  );
create policy clases_editar on clases for update to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid())
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(asignatura_id)))
  );
create policy clases_borrar on clases for delete to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid());

-- materiales: la clase elegida debe ser de la misma asignatura.
create policy materiales_leer on materiales for select to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid() or asignatura_id in (select mis_asignaturas()));
create policy materiales_crear on materiales for insert to authenticated
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(asignatura_id)))
    and (
      clase_id is null
      or exists (select 1 from clases c where c.id = materiales.clase_id and c.asignatura_id = materiales.asignatura_id)
    )
  );
create policy materiales_borrar on materiales for delete to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid());

create policy evaluaciones_leer on evaluaciones for select to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid() or asignatura_id in (select mis_asignaturas()));
create policy evaluaciones_crear on evaluaciones for insert to authenticated
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(asignatura_id)))
  );
create policy evaluaciones_borrar on evaluaciones for delete to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid());

-- vistos: cada estudiante maneja solo su avance.
create policy vistos_propios on vistos for all to authenticated
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- ───────────── Almacenamiento de PDFs ─────────────

insert into storage.buckets (id, name, public) values ('materiales', 'materiales', false)
on conflict (id) do nothing;

-- Subir: solo docentes/admin, dentro de su carpeta (<id_usuario>/archivo.pdf).
create policy storage_subir on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materiales'
    and mi_rol() in ('admin', 'profesor')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leer: solo si el usuario puede ver el material que referencia ese archivo.
create policy storage_leer on storage.objects for select to authenticated
  using (
    bucket_id = 'materiales'
    and exists (select 1 from public.materiales m where m.storage_path = name)
  );

create policy storage_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'materiales' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────── Datos iniciales ─────────────

insert into asignaturas (nombre, color) values
  ('Matemática M1', '#2a6fd0'),
  ('Competencia Lectora', '#c93f4a'),
  ('Historia y Cs. Sociales', '#b36a14'),
  ('Ciencias · Biología', '#5a8f1f'),
  ('Ciencias · Física', '#1a8591'),
  ('Ciencias · Química', '#b83a7d')
on conflict (nombre) do nothing;
