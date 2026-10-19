-- CP-08: una fundación pendiente (o rechazada/inactiva) no debe poder publicar necesidades.
-- Antes, la política solo verificaba que la necesidad fuera de la propia fundación.
-- El administrador conserva el permiso de publicar en nombre de cualquier fundación.

drop policy if exists necesidades_crear on public.necesidades;

create policy necesidades_crear on public.necesidades
  for insert to authenticated
  with check (
    (select public.es_administrador())
    or (
      fundacion_id = (select auth.uid())
      and exists (
        select 1 from public.fundaciones f
        where f.id = necesidades.fundacion_id
          and f.estado = 'aprobada'
      )
    )
  );
