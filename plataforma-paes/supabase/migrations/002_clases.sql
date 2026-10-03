-- Clases (sesiones): cada clase corresponde a un contenido de una asignatura en un curso.
-- Ejecutar en Supabase > SQL Editor después de 001_esquema.sql.

create table clases (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos (id) on delete cascade,
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  profesor_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora time,
  contenido text,
  objetivos text,
  created_at timestamptz not null default now()
);

create index on clases (curso_id, asignatura_id, fecha);

-- Un material puede pertenecer a una clase. Si se borra la clase, el material queda suelto.
alter table materiales add column clase_id uuid references clases (id) on delete set null;
create index on materiales (clase_id);

alter table clases enable row level security;

create policy clases_leer on clases for select to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid() or curso_id in (select mis_cursos()));

create policy clases_crear on clases for insert to authenticated
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(curso_id, asignatura_id)))
  );

create policy clases_editar on clases for update to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid())
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(curso_id, asignatura_id)))
  );

create policy clases_borrar on clases for delete to authenticated
  using (mi_rol() = 'admin' or profesor_id = auth.uid());

-- Al crear un material, la clase elegida debe ser del mismo curso y asignatura.
drop policy materiales_crear on materiales;
create policy materiales_crear on materiales for insert to authenticated
  with check (
    profesor_id = auth.uid()
    and (mi_rol() = 'admin' or (mi_rol() = 'profesor' and enseno(curso_id, asignatura_id)))
    and (
      clase_id is null
      or exists (
        select 1 from clases c
        where c.id = materiales.clase_id
          and c.curso_id = materiales.curso_id
          and c.asignatura_id = materiales.asignatura_id
      )
    )
  );
