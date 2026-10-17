# Backend de 7:34 AM — Documentación (Supabase)

> Proyecto Supabase: `nqcdobxnmeemuompjlwi` · Generado el 8 de octubre de 2026.
> La **Parte 1** explica cómo funciona el backend. La **Parte 2** es la referencia técnica completa, extraída directamente de la base de datos (tablas, políticas, triggers, funciones con su código, Storage y migraciones).

## Índice

- [Parte 1. Cómo funciona](#parte-1-cómo-funciona)
  - [1. Arquitectura](#1-arquitectura)
  - [2. Roles y modelo de seguridad](#2-roles-y-modelo-de-seguridad)
  - [3. Flujos principales](#3-flujos-principales)
  - [4. Archivos (Storage)](#4-archivos-storage)
  - [5. Lo que no está en la base de datos](#5-lo-que-no-está-en-la-base-de-datos)
- [Parte 2. Referencia técnica](#parte-2-referencia-técnica)

---

# Parte 1. Cómo funciona

## 1. Arquitectura

| Pieza | Uso |
|---|---|
| **Supabase Postgres** | Todos los datos. La lógica sensible vive en la base de datos (triggers y funciones), no en el navegador. |
| **Row Level Security (RLS)** | Activado en las 13 tablas. Cada consulta del navegador se filtra según quién la hace. |
| **Supabase Auth** | Cuentas con correo y contraseña, con confirmación de correo. |
| **Supabase Storage** | Bucket público `imagenes` y bucket privado `documentos-fundaciones`. |
| **Supabase Realtime** | Actualizaciones en vivo de `notificaciones` y `sesiones_usuario`. |
| **Frontend** | React + Vite publicado en GitHub Pages. Usa solo la clave pública (anon/publishable). |

Principio general: **el navegador no es de confianza**. Todo lo que define permisos, estados o sellos (rol, aprobación, verificación de documentos, “perfil completo”, autor de una reseña, remitente de un mensaje) lo calcula o valida la base de datos.

## 2. Roles y modelo de seguridad

### Roles de base de datos
- `anon`: visitante sin sesión.
- `authenticated`: usuario con sesión. Su id es `auth.uid()`.

### Roles de la aplicación (`perfiles.rol`, enum `rol_usuario`)
- `fundacion`, `voluntario`, `administrador`.
- `public.es_administrador()` responde si el usuario actual es administrador. Se usa en las políticas RLS.

### Reglas de seguridad clave
| Regla | Dónde se aplica |
|---|---|
| Nadie puede asignarse el rol de administrador ni cambiar su rol | Trigger `proteger_rol_perfil` en `perfiles` |
| Solo un administrador cambia el estado de una fundación; los registros nuevos entran como `pendiente` | Trigger `proteger_estado_fundacion` |
| No se aprueba una fundación sin sus 3 documentos verificados (primera aprobación) | Trigger `exigir_documentos_para_aprobar` |
| Solo un administrador verifica documentos; subir un archivo nuevo lo devuelve a `pendiente` | Trigger `controlar_revision_documento` |
| “Perfil completo” del voluntario lo calcula la BD | Trigger `calcular_perfil_completo_voluntario` |
| El autor de una reseña y el remitente de un mensaje salen de la sesión, no del formulario | `completar_autor_resena`, `asignar_remitente_mensaje` |
| Límite anti-spam en mensajes de contacto: 5 cada 10 min y 30 al día por cuenta o IP | `validar_y_limitar_contacto` |
| Las fundaciones no aprobadas, su galería y sus necesidades no son públicas | Políticas `fundaciones_leer`, `galeria_leer`, `necesidades_leer` |
| Las notificaciones solo las crean triggers y funciones internas | `notificaciones` no tiene política de INSERT |

### Funciones `SECURITY DEFINER`
Se ejecutan con privilegios del dueño para tareas internas (crear notificaciones, recalcular contadores). Sus permisos de ejecución están revocados para `anon` y `authenticated`, salvo:
- `es_administrador()` e `is_admin()`: las necesitan las políticas RLS.
- `enviar_aviso_masivo()` y `contar_destinatarios_aviso()`: llamables con sesión, pero internamente exigen rol administrador.
- `crear_administrador_manual()`: solo desde el SQL Editor; es la forma de crear administradores.

## 3. Flujos principales

### Registro de cuentas
1. El formulario llama a `supabase.auth.signUp` con los datos del perfil en `options.data` (rol, nombre, ciudad, etc.).
2. El trigger `crear_perfil_desde_registro` sobre `auth.users` crea `perfiles` y `fundaciones` (como `pendiente`) o `voluntarios`. Solo acepta los roles `fundacion` y `voluntario`.
3. Funciona igual con la confirmación de correo activada o desactivada.

### Aprobación de fundaciones
1. Al registrarse una fundación, `notificar_admins_nueva_fundacion` avisa a todos los administradores.
2. La fundación sube RUT, Cámara de Comercio y Personería jurídica a `documentos_fundacion` y Storage.
3. El administrador revisa cada documento: verificado o rechazado con nota. Si lo rechaza, `notificar_documento_rechazado` avisa a la fundación.
4. `recalcular_documentos_fundacion` mantiene al día `documentos_lista`, `documentos_faltantes`, `documentos_verificados` y `nivel_riesgo`.
5. Al aprobar, `exigir_documentos_para_aprobar` comprueba los 3 documentos verificados y `registrar_fecha_decision_fundacion` guarda la fecha de la decisión, que alimenta el “tiempo de auditoría” del panel.

### Necesidades
- Las crea y gestiona la fundación dueña o un administrador.
- `registrar_fecha_resolucion_necesidad` guarda la fecha al marcarla como completada.
- `sincronizar_contador_necesidades` mantiene `fundaciones.necesidades_resueltas`.

### Mensajes de contacto y notificaciones
- Cualquiera puede escribir a una fundación o a un voluntario. `validar_y_limitar_contacto` valida y limita los envíos y `asignar_remitente_mensaje` registra quién escribió, si tenía sesión.
- `crear_notificacion_por_mensaje_contacto` genera la notificación del destinatario.
- Tipos de notificación (`notificaciones.tipo`): `mensaje`, `aprobacion`, `documento`, `emergencia`, `sistema`. El campo `enlace` lleva a la pantalla correspondiente.

### Avisos masivos (administrador)
- `enviar_aviso_masivo(titulo, mensaje)` notifica a todos los voluntarios activos que tienen “Avisos de Emergencia Cívica” habilitados.

### Reseñas
- Solo usuarios con sesión, una por autor y por perfil, sin poder calificarse a sí mismos. `completar_autor_resena` fija el autor y bloquea cambios de autoría.

## 4. Archivos (Storage)

| Bucket | Acceso | Contenido | Ruta |
|---|---|---|---|
| `imagenes` | Público (lectura) | Logos, portadas, galería y avatares | `{id_del_dueño}/{tipo}-{fecha}.jpg` |
| `documentos-fundaciones` | Privado | Documentos legales | `{id_fundación}/{tipo}-{fecha}.pdf` |

Cada usuario solo puede escribir en su propia carpeta; los administradores, en todas. Los documentos privados se ven con enlaces temporales de 5 minutos.

## 5. Lo que no está en la base de datos

Se configura en el panel de Supabase y no aparece en este documento:
- **Authentication:** confirmación de correo, URLs de redirección (`.../COG-FULL-STACK/login` y `.../reset-password`) y protección contra contraseñas filtradas.
- **Claves:** el frontend usa solo la clave pública. La `service_role` nunca debe ir al frontend ni a la documentación.
- **Edge Functions:** el proyecto no tiene.

---

# Parte 2. Referencia técnica

## Resumen de tablas

| Tabla | RLS | Filas (8 oct 2026) | Políticas | Triggers |
|---|---|---|---|---|
| [administradores](#administradores) | sí | 1 | 3 | 0 |
| [documentos_fundacion](#documentos_fundacion) | sí | 0 | 1 | 3 |
| [fundaciones](#fundaciones) | sí | 1 | 3 | 4 |
| [galeria_fundaciones](#galeria_fundaciones) | sí | 3 | 3 | 0 |
| [historial_voluntariado](#historial_voluntariado) | sí | 0 | 1 | 0 |
| [limite_envios_contacto](#limite_envios_contacto) | sí | 0 | 0 | 0 |
| [mensajes_contacto](#mensajes_contacto) | sí | 0 | 2 | 3 |
| [necesidades](#necesidades) | sí | 0 | 4 | 2 |
| [notificaciones](#notificaciones) | sí | 0 | 2 | 0 |
| [perfiles](#perfiles) | sí | 4 | 3 | 1 |
| [resenas](#resenas) | sí | 1 | 4 | 1 |
| [sesiones_usuario](#sesiones_usuario) | sí | 15 | 4 | 0 |
| [voluntarios](#voluntarios) | sí | 2 | 3 | 1 |

## Enums

- **estado_aprobacion**: `pendiente`, `aprobada`, `rechazada`, `inactiva`
- **nivel_prioridad**: `alta`, `media`, `baja`
- **rol_usuario**: `fundacion`, `voluntario`, `administrador`

## Tablas en detalle

### administradores

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no |  |
| nombre_completo | text | no |  |
| cargo | text | sí | `'Administrador del Sistema'::text` |
| email | text | sí |  |
| telefono | text | sí |  |
| avatar_url | text | sí |  |
| nivel_acceso | text | sí | `'superadmin'::text` |
| activo | boolean | sí | `true` |
| created_at | timestamp with time zone | sí | `now()` |

**Restricciones**

- `administradores_id_fkey`: `FOREIGN KEY (id) REFERENCES perfiles(id) ON DELETE CASCADE`
- `administradores_pkey`: `PRIMARY KEY (id)`
- `administradores_email_key`: `UNIQUE (email)`

**Índices**

- `administradores_email_key`: `CREATE UNIQUE INDEX administradores_email_key ON public.administradores USING btree (email)`
- `administradores_pkey`: `CREATE UNIQUE INDEX administradores_pkey ON public.administradores USING btree (id)`

**Políticas RLS**

- **admin_insertar** (INSERT, roles: authenticated)
  - WITH CHECK: `( SELECT es_administrador() AS es_administrador)`
- **admin_leer** (SELECT, roles: authenticated)
  - USING: `( SELECT es_administrador() AS es_administrador)`
- **admin_actualizar_propio** (UPDATE, roles: authenticated)
  - USING: `(id = ( SELECT auth.uid() AS uid))`
  - WITH CHECK: `(id = ( SELECT auth.uid() AS uid))`

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### documentos_fundacion

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` |
| fundacion_id | uuid | no |  |
| tipo | text | no |  |
| ruta | text | no |  |
| nombre_archivo | text | no |  |
| tamano_bytes | integer | sí |  |
| mime | text | sí |  |
| created_at | timestamp with time zone | no | `now()` |
| estado_revision | text | no | `'pendiente'::text` |
| nota_revision | text | sí |  |
| revisado_por | uuid | sí |  |
| fecha_revision | timestamp with time zone | sí |  |

**Restricciones**

- `documentos_fundacion_estado_revision_check`: `CHECK ((estado_revision = ANY (ARRAY['pendiente'::text, 'verificado'::text, 'rechazado'::text])))`
- `documentos_fundacion_tipo_check`: `CHECK ((tipo = ANY (ARRAY['rut'::text, 'camara_comercio'::text, 'personeria'::text])))`
- `documentos_fundacion_fundacion_id_fkey`: `FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE CASCADE`
- `documentos_fundacion_revisado_por_fkey`: `FOREIGN KEY (revisado_por) REFERENCES perfiles(id) ON DELETE SET NULL`
- `documentos_fundacion_pkey`: `PRIMARY KEY (id)`
- `documentos_fundacion_fundacion_id_tipo_key`: `UNIQUE (fundacion_id, tipo)`

**Índices**

- `documentos_fundacion_fundacion_id_tipo_key`: `CREATE UNIQUE INDEX documentos_fundacion_fundacion_id_tipo_key ON public.documentos_fundacion USING btree (fundacion_id, tipo)`
- `documentos_fundacion_pkey`: `CREATE UNIQUE INDEX documentos_fundacion_pkey ON public.documentos_fundacion USING btree (id)`
- `idx_documentos_fundacion_revisado_por`: `CREATE INDEX idx_documentos_fundacion_revisado_por ON public.documentos_fundacion USING btree (revisado_por)`

**Políticas RLS**

- **documentos_propios_o_admin** (ALL, roles: authenticated)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
  - WITH CHECK: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`

**Triggers**

- `tr_controlar_revision_documento` → `controlar_revision_documento()`: CREATE TRIGGER tr_controlar_revision_documento BEFORE INSERT OR UPDATE ON public.documentos_fundacion FOR EACH ROW EXECUTE FUNCTION controlar_revision_documento()
- `tr_documentos_fundacion` → `tr_documentos_fundacion()`: CREATE TRIGGER tr_documentos_fundacion AFTER INSERT OR DELETE OR UPDATE ON public.documentos_fundacion FOR EACH ROW EXECUTE FUNCTION tr_documentos_fundacion()
- `tr_notificar_documento_rechazado` → `notificar_documento_rechazado()`: CREATE TRIGGER tr_notificar_documento_rechazado AFTER UPDATE ON public.documentos_fundacion FOR EACH ROW EXECUTE FUNCTION notificar_documento_rechazado()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### fundaciones

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` |
| nombre_legal | text | no |  |
| nit | text | no |  |
| representante_legal | text | no |  |
| telefono | text | sí |  |
| email_institucional | text | sí |  |
| ubicacion | text | sí |  |
| descripcion | text | sí |  |
| areas_impacto | text[] | sí |  |
| documento_legal_url | text | sí |  |
| estado | estado_aprobacion | sí | `'pendiente'::estado_aprobacion` |
| logo_url | text | sí |  |
| anos_operacion | integer | sí | `0` |
| familias_acompanadas | integer | sí | `0` |
| indice_transparencia | integer | sí | `0` |
| foto_portada_url | text | sí |  |
| necesidades_resueltas | integer | sí | `0` |
| direccion_fisica | text | sí |  |
| ciudad | text | sí |  |
| fecha_solicitud | timestamp with time zone | sí | `timezone('utc'::text, now())` |
| fecha_aprobacion | timestamp with time zone | sí |  |
| aprobado_por | uuid | sí |  |
| area_enfoque | text | sí |  |
| documentos_enlace | text | sí |  |
| nivel_riesgo | text | sí | `'Alto (sin documentos)'::text` |
| documentos_lista | text[] | sí | `'{}'::text[]` |
| documentos_faltantes | boolean | sí | `true` |
| sigla | text | sí |  |
| personeria_juridica | text | sí |  |
| ano_fundacion | text | sí |  |
| mision | text | sí |  |
| vision | text | sí |  |
| departamento | text | sí |  |
| localidad | text | sí |  |
| telefono_whatsapp | text | sí |  |
| email_contacto | text | sí |  |
| instagram | text | sí |  |
| sitio_web | text | sí |  |
| portada_url | text | sí |  |
| canales_recaudo | jsonb | sí | `'[]'::jsonb` |
| fecha_decision | timestamp with time zone | sí |  |
| documentos_verificados | boolean | no | `false` |

**Restricciones**

- `fundaciones_aprobado_por_fkey`: `FOREIGN KEY (aprobado_por) REFERENCES perfiles(id)`
- `fundaciones_id_fkey`: `FOREIGN KEY (id) REFERENCES perfiles(id) ON DELETE CASCADE`
- `fundaciones_pkey`: `PRIMARY KEY (id)`
- `fundaciones_email_institucional_key`: `UNIQUE (email_institucional)`
- `fundaciones_nit_key`: `UNIQUE (nit)`

**Índices**

- `fundaciones_email_institucional_key`: `CREATE UNIQUE INDEX fundaciones_email_institucional_key ON public.fundaciones USING btree (email_institucional)`
- `fundaciones_nit_key`: `CREATE UNIQUE INDEX fundaciones_nit_key ON public.fundaciones USING btree (nit)`
- `fundaciones_pkey`: `CREATE UNIQUE INDEX fundaciones_pkey ON public.fundaciones USING btree (id)`
- `idx_fundaciones_aprobado_por`: `CREATE INDEX idx_fundaciones_aprobado_por ON public.fundaciones USING btree (aprobado_por)`

**Políticas RLS**

- **fundaciones_crear_propia** (INSERT, roles: authenticated)
  - WITH CHECK: `(id = ( SELECT auth.uid() AS uid))`
- **fundaciones_leer** (SELECT, roles: public)
  - USING: `((estado = 'aprobada'::estado_aprobacion) OR (id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **fundaciones_actualizar** (UPDATE, roles: authenticated)
  - USING: `((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
  - WITH CHECK: `((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`

**Triggers**

- `tr_exigir_documentos_para_aprobar` → `exigir_documentos_para_aprobar()`: CREATE TRIGGER tr_exigir_documentos_para_aprobar BEFORE UPDATE ON public.fundaciones FOR EACH ROW EXECUTE FUNCTION exigir_documentos_para_aprobar()
- `tr_notificar_admins_nueva_fundacion` → `notificar_admins_nueva_fundacion()`: CREATE TRIGGER tr_notificar_admins_nueva_fundacion AFTER INSERT ON public.fundaciones FOR EACH ROW EXECUTE FUNCTION notificar_admins_nueva_fundacion()
- `tr_proteger_estado_fundacion` → `proteger_estado_fundacion()`: CREATE TRIGGER tr_proteger_estado_fundacion BEFORE INSERT OR UPDATE ON public.fundaciones FOR EACH ROW EXECUTE FUNCTION proteger_estado_fundacion()
- `tr_registrar_fecha_decision` → `registrar_fecha_decision_fundacion()`: CREATE TRIGGER tr_registrar_fecha_decision BEFORE UPDATE ON public.fundaciones FOR EACH ROW EXECUTE FUNCTION registrar_fecha_decision_fundacion()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### galeria_fundaciones

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| fundacion_id | uuid | sí |  |
| imagen_url | text | no |  |
| alt_texto | text | sí |  |

**Restricciones**

- `galeria_fundaciones_fundacion_id_fkey`: `FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE CASCADE`
- `galeria_fundaciones_pkey`: `PRIMARY KEY (id)`

**Índices**

- `galeria_fundaciones_pkey`: `CREATE UNIQUE INDEX galeria_fundaciones_pkey ON public.galeria_fundaciones USING btree (id)`
- `idx_galeria_fundacion`: `CREATE INDEX idx_galeria_fundacion ON public.galeria_fundaciones USING btree (fundacion_id)`

**Políticas RLS**

- **galeria_delete_propia** (DELETE, roles: authenticated)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **galeria_insert_propia** (INSERT, roles: authenticated)
  - WITH CHECK: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **galeria_leer** (SELECT, roles: public)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador) OR (EXISTS ( SELECT 1
   FROM fundaciones f
  WHERE ((f.id = galeria_fundaciones.fundacion_id) AND (f.estado = 'aprobada'::estado_aprobacion)))))`

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### historial_voluntariado

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| voluntario_id | uuid | sí |  |
| fundacion_nombre | text | no |  |
| rol | text | no |  |
| fecha_texto | text | sí |  |
| descripcion | text | sí |  |
| certificado_por | text | sí |  |

**Restricciones**

- `historial_voluntariado_voluntario_id_fkey`: `FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE CASCADE`
- `historial_voluntariado_pkey`: `PRIMARY KEY (id)`

**Índices**

- `historial_voluntariado_pkey`: `CREATE UNIQUE INDEX historial_voluntariado_pkey ON public.historial_voluntariado USING btree (id)`
- `idx_historial_voluntario`: `CREATE INDEX idx_historial_voluntario ON public.historial_voluntariado USING btree (voluntario_id)`

**Políticas RLS**

- **Historial visible para todos** (SELECT, roles: public)
  - USING: `true`

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### limite_envios_contacto

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | bigint | no |  |
| clave | text | no |  |
| created_at | timestamp with time zone | no | `now()` |

**Restricciones**

- `limite_envios_contacto_pkey`: `PRIMARY KEY (id)`

**Índices**

- `limite_envios_contacto_clave_fecha`: `CREATE INDEX limite_envios_contacto_clave_fecha ON public.limite_envios_contacto USING btree (clave, created_at)`
- `limite_envios_contacto_pkey`: `CREATE UNIQUE INDEX limite_envios_contacto_pkey ON public.limite_envios_contacto USING btree (id)`

**Políticas RLS**

- Ninguna (solo accesible por funciones internas)

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### mensajes_contacto

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| fundacion_id | uuid | sí |  |
| nombre_remitente | text | no |  |
| email_remitente | text | no |  |
| tipo_consulta | text | sí |  |
| mensaje | text | no |  |
| leido | boolean | sí | `false` |
| created_at | timestamp with time zone | sí | `timezone('utc'::text, now())` |
| voluntario_id | uuid | sí |  |
| remitente_id | uuid | sí |  |
| remitente_rol | text | sí |  |

**Restricciones**

- `mensajes_contacto_fundacion_id_fkey`: `FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE CASCADE`
- `mensajes_contacto_remitente_id_fkey`: `FOREIGN KEY (remitente_id) REFERENCES auth.users(id) ON DELETE SET NULL`
- `mensajes_contacto_voluntario_id_fkey`: `FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE SET NULL`
- `mensajes_contacto_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_mensajes_fundacion`: `CREATE INDEX idx_mensajes_fundacion ON public.mensajes_contacto USING btree (fundacion_id)`
- `idx_mensajes_remitente`: `CREATE INDEX idx_mensajes_remitente ON public.mensajes_contacto USING btree (remitente_id)`
- `idx_mensajes_voluntario`: `CREATE INDEX idx_mensajes_voluntario ON public.mensajes_contacto USING btree (voluntario_id)`
- `mensajes_contacto_pkey`: `CREATE UNIQUE INDEX mensajes_contacto_pkey ON public.mensajes_contacto USING btree (id)`

**Políticas RLS**

- **Permitir insercion a visitantes y autenticados** (INSERT, roles: anon,authenticated)
  - WITH CHECK: `true`
- **mensajes_leer_destinatario_o_admin** (SELECT, roles: authenticated)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR (voluntario_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`

**Triggers**

- `tr_asignar_remitente_mensaje` → `asignar_remitente_mensaje()`: CREATE TRIGGER tr_asignar_remitente_mensaje BEFORE INSERT ON public.mensajes_contacto FOR EACH ROW EXECUTE FUNCTION asignar_remitente_mensaje()
- `tr_crear_notificacion_mensaje` → `crear_notificacion_por_mensaje_contacto()`: CREATE TRIGGER tr_crear_notificacion_mensaje AFTER INSERT ON public.mensajes_contacto FOR EACH ROW EXECUTE FUNCTION crear_notificacion_por_mensaje_contacto()
- `tr_validar_y_limitar_contacto` → `validar_y_limitar_contacto()`: CREATE TRIGGER tr_validar_y_limitar_contacto BEFORE INSERT ON public.mensajes_contacto FOR EACH ROW EXECUTE FUNCTION validar_y_limitar_contacto()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### necesidades

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| fundacion_id | uuid | sí |  |
| titulo | text | no |  |
| descripcion | text | sí |  |
| categoria | text | sí |  |
| prioridad | nivel_prioridad | sí | `'media'::nivel_prioridad` |
| meta_texto | text | sí |  |
| porcentaje_recaudado | integer | sí | `0` |
| created_at | timestamp with time zone | sí | `timezone('utc'::text, now())` |
| completada | boolean | sí | `false` |
| fecha_resolucion | timestamp with time zone | sí |  |

**Restricciones**

- `necesidades_fundacion_id_fkey`: `FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE CASCADE`
- `necesidades_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_necesidades_fundacion`: `CREATE INDEX idx_necesidades_fundacion ON public.necesidades USING btree (fundacion_id)`
- `necesidades_pkey`: `CREATE UNIQUE INDEX necesidades_pkey ON public.necesidades USING btree (id)`

**Políticas RLS**

- **necesidades_eliminar** (DELETE, roles: authenticated)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **necesidades_crear** (INSERT, roles: authenticated)
  - WITH CHECK: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **necesidades_leer** (SELECT, roles: public)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador) OR (EXISTS ( SELECT 1
   FROM fundaciones f
  WHERE ((f.id = necesidades.fundacion_id) AND (f.estado = 'aprobada'::estado_aprobacion)))))`
- **necesidades_actualizar** (UPDATE, roles: authenticated)
  - USING: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
  - WITH CHECK: `((fundacion_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`

**Triggers**

- `tr_registrar_fecha_resolucion` → `registrar_fecha_resolucion_necesidad()`: CREATE TRIGGER tr_registrar_fecha_resolucion BEFORE UPDATE ON public.necesidades FOR EACH ROW EXECUTE FUNCTION registrar_fecha_resolucion_necesidad()
- `tr_sincronizar_contador_necesidades` → `sincronizar_contador_necesidades()`: CREATE TRIGGER tr_sincronizar_contador_necesidades AFTER INSERT OR DELETE OR UPDATE OF completada, fundacion_id ON public.necesidades FOR EACH ROW EXECUTE FUNCTION sincronizar_contador_necesidades()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### notificaciones

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` |
| user_id | uuid | sí |  |
| titulo | text | no |  |
| descripcion | text | no |  |
| icono | text | no |  |
| bg_icono | text | no |  |
| text_icono | text | no |  |
| accion_texto | text | sí |  |
| leido | boolean | sí | `false` |
| created_at | timestamp with time zone | sí | `now()` |
| mensaje_contacto_id | uuid | sí |  |
| tipo | text | sí |  |
| enlace | text | sí |  |

**Restricciones**

- `notificaciones_mensaje_contacto_id_fkey`: `FOREIGN KEY (mensaje_contacto_id) REFERENCES mensajes_contacto(id) ON DELETE CASCADE`
- `notificaciones_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES perfiles(id) ON DELETE CASCADE`
- `notificaciones_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_notificaciones_mensaje`: `CREATE INDEX idx_notificaciones_mensaje ON public.notificaciones USING btree (mensaje_contacto_id)`
- `idx_notificaciones_usuario_fecha`: `CREATE INDEX idx_notificaciones_usuario_fecha ON public.notificaciones USING btree (user_id, created_at DESC)`
- `notificaciones_pkey`: `CREATE UNIQUE INDEX notificaciones_pkey ON public.notificaciones USING btree (id)`

**Políticas RLS**

- **notificaciones_leer_propias** (SELECT, roles: authenticated)
  - USING: `(user_id = ( SELECT auth.uid() AS uid))`
- **notificaciones_actualizar_propias** (UPDATE, roles: authenticated)
  - USING: `(user_id = ( SELECT auth.uid() AS uid))`
  - WITH CHECK: `(user_id = ( SELECT auth.uid() AS uid))`

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### perfiles

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no |  |
| rol | rol_usuario | no |  |
| created_at | timestamp with time zone | sí | `timezone('utc'::text, now())` |
| alertas_correo | boolean | sí | `true` |
| alertas_push | boolean | sí | `true` |
| alertas_emergencia | boolean | sí | `true` |

**Restricciones**

- `perfiles_pkey`: `PRIMARY KEY (id)`

**Índices**

- `perfiles_pkey`: `CREATE UNIQUE INDEX perfiles_pkey ON public.perfiles USING btree (id)`

**Políticas RLS**

- **perfiles_crear_propio** (INSERT, roles: authenticated)
  - WITH CHECK: `(id = ( SELECT auth.uid() AS uid))`
- **perfiles_leer_propio** (SELECT, roles: authenticated)
  - USING: `(id = ( SELECT auth.uid() AS uid))`
- **perfiles_actualizar_propio** (UPDATE, roles: authenticated)
  - USING: `(id = ( SELECT auth.uid() AS uid))`
  - WITH CHECK: `(id = ( SELECT auth.uid() AS uid))`

**Triggers**

- `tr_proteger_rol_perfil` → `proteger_rol_perfil()`: CREATE TRIGGER tr_proteger_rol_perfil BEFORE INSERT OR UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION proteger_rol_perfil()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### resenas

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| fundacion_id | uuid | sí |  |
| voluntario_id | uuid | sí |  |
| nombre_autor | text | no |  |
| rol_autor | text | sí |  |
| avatar_autor_url | text | sí |  |
| rating | integer | sí |  |
| texto_comentario | text | sí |  |
| created_at | timestamp with time zone | sí | `now()` |
| autor_id | uuid | sí |  |

**Restricciones**

- `resenas_rating_check`: `CHECK (((rating >= 1) AND (rating <= 5)))`
- `resenas_rating_rango`: `CHECK (((rating >= 1) AND (rating <= 5)))`
- `resenas_un_destino`: `CHECK (((fundacion_id IS NULL) <> (voluntario_id IS NULL)))`
- `resenas_autor_id_fkey`: `FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `resenas_fundacion_id_fkey`: `FOREIGN KEY (fundacion_id) REFERENCES fundaciones(id) ON DELETE CASCADE`
- `resenas_voluntario_id_fkey`: `FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE CASCADE`
- `resenas_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_resenas_fundacion`: `CREATE INDEX idx_resenas_fundacion ON public.resenas USING btree (fundacion_id)`
- `idx_resenas_voluntario`: `CREATE INDEX idx_resenas_voluntario ON public.resenas USING btree (voluntario_id)`
- `resenas_autor_fundacion_unica`: `CREATE UNIQUE INDEX resenas_autor_fundacion_unica ON public.resenas USING btree (autor_id, fundacion_id) WHERE ((autor_id IS NOT NULL) AND (fundacion_id IS NOT NULL))`
- `resenas_autor_voluntario_unica`: `CREATE UNIQUE INDEX resenas_autor_voluntario_unica ON public.resenas USING btree (autor_id, voluntario_id) WHERE ((autor_id IS NOT NULL) AND (voluntario_id IS NOT NULL))`
- `resenas_pkey`: `CREATE UNIQUE INDEX resenas_pkey ON public.resenas USING btree (id)`

**Políticas RLS**

- **resenas_delete_propia** (DELETE, roles: authenticated)
  - USING: `((autor_id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
- **resenas_insert_autenticados** (INSERT, roles: authenticated)
  - WITH CHECK: `(autor_id = ( SELECT auth.uid() AS uid))`
- **Reseñas visibles para todos** (SELECT, roles: public)
  - USING: `true`
- **resenas_update_propia** (UPDATE, roles: authenticated)
  - USING: `(autor_id = ( SELECT auth.uid() AS uid))`
  - WITH CHECK: `(autor_id = ( SELECT auth.uid() AS uid))`

**Triggers**

- `tr_completar_autor_resena` → `completar_autor_resena()`: CREATE TRIGGER tr_completar_autor_resena BEFORE INSERT OR UPDATE ON public.resenas FOR EACH ROW EXECUTE FUNCTION completar_autor_resena()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### sesiones_usuario

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `uuid_generate_v4()` |
| user_id | uuid | sí |  |
| dispositivo | text | no |  |
| ubicacion | text | no |  |
| ip_o_sistema | text | no |  |
| es_actual | boolean | sí | `false` |
| created_at | timestamp with time zone | sí | `timezone('utc'::text, now())` |

**Restricciones**

- `sesiones_usuario_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES perfiles(id) ON DELETE CASCADE`
- `sesiones_usuario_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_sesiones_usuario`: `CREATE INDEX idx_sesiones_usuario ON public.sesiones_usuario USING btree (user_id)`
- `sesiones_usuario_pkey`: `CREATE UNIQUE INDEX sesiones_usuario_pkey ON public.sesiones_usuario USING btree (id)`

**Políticas RLS**

- **sesiones_eliminar_propias** (DELETE, roles: authenticated)
  - USING: `(user_id = ( SELECT auth.uid() AS uid))`
- **sesiones_crear_propias** (INSERT, roles: authenticated)
  - WITH CHECK: `(user_id = ( SELECT auth.uid() AS uid))`
- **sesiones_leer_propias** (SELECT, roles: authenticated)
  - USING: `(user_id = ( SELECT auth.uid() AS uid))`
- **sesiones_actualizar_propias** (UPDATE, roles: authenticated)
  - USING: `(user_id = ( SELECT auth.uid() AS uid))`
  - WITH CHECK: `(user_id = ( SELECT auth.uid() AS uid))`

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

---

### voluntarios

RLS: activado

| Columna | Tipo | Nulo | Por defecto |
|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` |
| nombre_completo | text | no |  |
| profesion | text | sí |  |
| ubicacion | text | sí |  |
| sobre_mi | text | sí |  |
| avatar_url | text | sí |  |
| is_verified | boolean | sí | `false` |
| tiempo_disponible | text | sí |  |
| disponibilidad_viaje | text | sí |  |
| modalidad_apoyo | text | sí |  |
| id_colegiada | text | sí |  |
| horas_totales_donadas | integer | sí | `0` |
| habilidades | text[] | sí |  |
| servicios_ofrecidos | jsonb | sí | `'[]'::jsonb` |
| bloques_libres | jsonb | sí | `'[]'::jsonb` |
| disponibilidad_activa | boolean | sí | `true` |
| presentacion_civica | text | sí |  |
| horas_objetivo_mensual | integer | sí | `16` |
| ciudad_base | text | sí |  |
| radio_desplazamiento | integer | sí | `35` |
| disponibilidad_viajar | boolean | sí | `true` |
| franjas_horarias | jsonb | sí | `'{}'::jsonb` |

**Restricciones**

- `voluntarios_id_fkey`: `FOREIGN KEY (id) REFERENCES perfiles(id) ON DELETE CASCADE`
- `voluntarios_pkey`: `PRIMARY KEY (id)`

**Índices**

- `idx_voluntarios_habilidades`: `CREATE INDEX idx_voluntarios_habilidades ON public.voluntarios USING gin (habilidades)`
- `voluntarios_pkey`: `CREATE UNIQUE INDEX voluntarios_pkey ON public.voluntarios USING btree (id)`

**Políticas RLS**

- **voluntarios_crear_propio** (INSERT, roles: authenticated)
  - WITH CHECK: `(id = ( SELECT auth.uid() AS uid))`
- **Voluntarios visibles para todos** (SELECT, roles: public)
  - USING: `true`
- **voluntarios_actualizar** (UPDATE, roles: authenticated)
  - USING: `((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`
  - WITH CHECK: `((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_administrador() AS es_administrador))`

**Triggers**

- `tr_perfil_completo_voluntario` → `calcular_perfil_completo_voluntario()`: CREATE TRIGGER tr_perfil_completo_voluntario BEFORE INSERT OR UPDATE ON public.voluntarios FOR EACH ROW EXECUTE FUNCTION calcular_perfil_completo_voluntario()

**Permisos de tabla**

- `anon`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
- `authenticated`: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

## Autenticación: triggers sobre `auth.users`

- `tr_crear_perfil_desde_registro` → `crear_perfil_desde_registro()`: CREATE TRIGGER tr_crear_perfil_desde_registro AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION crear_perfil_desde_registro()

## Storage

### Buckets

| Bucket | Acceso | Tamaño máx. | Tipos permitidos |
|---|---|---|---|
| documentos-fundaciones | privado | 15 MB | application/pdf, image/jpeg, image/png, image/webp |
| imagenes | público | 5120 kB | image/jpeg, image/png, image/webp |

### Políticas de `storage.objects`

- **docs_fundacion_actualizar** (UPDATE, roles: authenticated)
  - USING: `((bucket_id = 'documentos-fundaciones'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **docs_fundacion_eliminar** (DELETE, roles: authenticated)
  - USING: `((bucket_id = 'documentos-fundaciones'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **docs_fundacion_leer** (SELECT, roles: authenticated)
  - USING: `((bucket_id = 'documentos-fundaciones'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **docs_fundacion_subir** (INSERT, roles: authenticated)
  - WITH CHECK: `((bucket_id = 'documentos-fundaciones'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **imagenes_actualizar_propias** (UPDATE, roles: authenticated)
  - USING: `((bucket_id = 'imagenes'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **imagenes_eliminar_propias** (DELETE, roles: authenticated)
  - USING: `((bucket_id = 'imagenes'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **imagenes_leer_propias** (SELECT, roles: authenticated)
  - USING: `((bucket_id = 'imagenes'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`
- **imagenes_subir_propias** (INSERT, roles: authenticated)
  - WITH CHECK: `((bucket_id = 'imagenes'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR es_administrador()))`

## Funciones

### asignar_remitente_mensaje()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.asignar_remitente_mensaje()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Se toma de la sesión para que no se pueda suplantar desde el cliente
  new.remitente_id := auth.uid();
  new.remitente_rol := (select rol::text from perfiles where id = auth.uid());
  return new;
end; $function$
```

### calcular_perfil_completo_voluntario()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.calcular_perfil_completo_voluntario()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_franjas boolean;
begin
  select coalesce(bool_or(dia.value::text = 'true'), false) into v_franjas
  from jsonb_each(coalesce(new.franjas_horarias, '{}'::jsonb)) franja,
       lateral jsonb_each(case when jsonb_typeof(franja.value) = 'object' then franja.value else '{}'::jsonb end) dia;

  new.is_verified :=
        coalesce(trim(new.nombre_completo), '') <> ''
    and coalesce(trim(new.profesion), '') <> ''
    and coalesce(trim(coalesce(new.presentacion_civica, new.sobre_mi)), '') <> ''
    and coalesce(array_length(new.habilidades, 1), 0) > 0
    and v_franjas
    and coalesce(new.horas_objetivo_mensual, 0) > 0
    and coalesce(trim(new.ciudad_base), '') <> '';
  return new;
end; $function$
```

### completar_autor_resena()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.completar_autor_resena()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_rol text; v_nombre text; v_avatar text; v_detalle text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para calificar.';
  end if;
  if tg_op = 'UPDATE' then
    -- Solo se permite cambiar la calificación y el comentario
    new.autor_id := old.autor_id; new.fundacion_id := old.fundacion_id; new.voluntario_id := old.voluntario_id;
    new.nombre_autor := old.nombre_autor; new.rol_autor := old.rol_autor; new.avatar_autor_url := old.avatar_autor_url;
    new.created_at := old.created_at;
    return new;
  end if;

  new.autor_id := auth.uid();
  if new.autor_id = coalesce(new.fundacion_id, new.voluntario_id) then
    raise exception 'No puedes calificar tu propio perfil.';
  end if;

  select rol::text into v_rol from perfiles where id = auth.uid();
  if v_rol = 'voluntario' then
    select nombre_completo, avatar_url, coalesce(nullif(profesion, ''), 'Voluntario') into v_nombre, v_avatar, v_detalle from voluntarios where id = auth.uid();
    v_detalle := 'Voluntario · ' || v_detalle;
    if v_detalle = 'Voluntario · Voluntario' then v_detalle := 'Voluntario'; end if;
  elsif v_rol = 'fundacion' then
    select nombre_legal, logo_url into v_nombre, v_avatar from fundaciones where id = auth.uid();
    v_detalle := 'Fundación';
  elsif v_rol = 'administrador' then
    select nombre_completo, avatar_url into v_nombre, v_avatar from administradores where id = auth.uid();
    v_detalle := 'Administrador de la plataforma';
  end if;

  new.nombre_autor := coalesce(nullif(v_nombre, ''), 'Usuario registrado');
  new.rol_autor := coalesce(v_detalle, 'Usuario registrado');
  new.avatar_autor_url := v_avatar;
  new.created_at := now();
  return new;
end; $function$
```

### contar_destinatarios_aviso()

- Retorna: `integer`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.contar_destinatarios_aviso()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case when public.es_administrador() then (
    select count(*)::int from perfiles p join voluntarios v on v.id = p.id
    where p.rol = 'voluntario' and coalesce(p.alertas_emergencia, true) and coalesce(v.disponibilidad_activa, true)
  ) else 0 end;
$function$
```

### controlar_revision_documento()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.controlar_revision_documento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_admin boolean := current_user in ('postgres', 'service_role', 'supabase_admin') or public.es_administrador();
begin
  if tg_op = 'UPDATE' and new.ruta is distinct from old.ruta then
    new.estado_revision := 'pendiente'; new.nota_revision := null; new.revisado_por := null; new.fecha_revision := null;
    return new;
  end if;

  if not v_admin then
    if tg_op = 'INSERT' then
      new.estado_revision := 'pendiente'; new.nota_revision := null; new.revisado_por := null; new.fecha_revision := null;
    else
      new.estado_revision := old.estado_revision; new.nota_revision := old.nota_revision;
      new.revisado_por := old.revisado_por; new.fecha_revision := old.fecha_revision;
    end if;
  elsif tg_op = 'UPDATE' and (new.estado_revision is distinct from old.estado_revision or new.nota_revision is distinct from old.nota_revision) then
    new.revisado_por := auth.uid();
    new.fecha_revision := now();
    if new.estado_revision = 'verificado' then new.nota_revision := nullif(trim(coalesce(new.nota_revision, '')), ''); end if;
  end if;
  return new;
end; $function$
```

### crear_administrador_manual(user_id uuid, p_nombre text, p_email text, p_cargo text)

- Retorna: `void`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.crear_administrador_manual(user_id uuid, p_nombre text, p_email text, p_cargo text DEFAULT 'Administrador General'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insertar o actualizar perfil a rol 'administrador'
    INSERT INTO public.perfiles (id, rol, created_at)
    VALUES (user_id, 'administrador'::rol_usuario, now())
    ON CONFLICT (id) DO UPDATE SET rol = 'administrador'::rol_usuario;

    -- Insertar en la tabla administradores
    INSERT INTO public.administradores (id, nombre_completo, email, cargo)
    VALUES (user_id, p_nombre, p_email, p_cargo)
    ON CONFLICT (id) DO UPDATE SET 
        nombre_completo = EXCLUDED.nombre_completo,
        cargo = EXCLUDED.cargo;
END;
$function$
```

### crear_notificacion_por_mensaje_contacto()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.crear_notificacion_por_mensaje_contacto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_destino uuid;
begin
  v_destino := coalesce(new.voluntario_id, new.fundacion_id);
  if v_destino is not null then
    insert into notificaciones (user_id, titulo, descripcion, icono, bg_icono, text_icono, accion_texto, leido, created_at, mensaje_contacto_id, tipo)
    values (v_destino, 'Nuevo mensaje de contacto',
      coalesce(new.nombre_remitente, 'Alguien') || ' te ha enviado un mensaje: "' || substring(new.mensaje from 1 for 60) || '..."',
      '✉️', 'bg-blue-100', 'text-blue-600', 'Ver mensaje', false, now(), new.id, 'mensaje');
  end if;
  return new;
end; $function$
```

### crear_perfil_desde_registro()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.crear_perfil_desde_registro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol text := d->>'rol';
  v_ciudad text := nullif(left(trim(d->>'ciudad'), 80), '');
  v_sector text := nullif(left(trim(d->>'ubicacion'), 120), '');
  v_ubicacion text := nullif(concat_ws(', ', v_ciudad, v_sector), '');
begin
  if v_rol not in ('fundacion', 'voluntario') then
    return new;
  end if;

  insert into perfiles (id, rol) values (new.id, v_rol::rol_usuario) on conflict (id) do nothing;

  if v_rol = 'fundacion' then
    insert into fundaciones (id, nombre_legal, nit, representante_legal, telefono, email_institucional,
                             ciudad, localidad, ubicacion, estado, fecha_solicitud)
    values (
      new.id,
      left(coalesce(nullif(trim(d->>'nombre_legal'), ''), 'Fundación sin nombre'), 200),
      left(coalesce(trim(d->>'nit'), ''), 30),
      left(coalesce(trim(d->>'representante_legal'), ''), 150),
      left(trim(d->>'telefono'), 30),
      new.email,
      v_ciudad, v_sector, v_ubicacion,
      'pendiente', now()
    )
    on conflict (id) do nothing;
  else
    insert into voluntarios (id, nombre_completo, ciudad_base, ubicacion)
    values (
      new.id,
      left(coalesce(nullif(trim(d->>'nombre_completo'), ''), 'Voluntario'), 150),
      v_ciudad, v_ubicacion
    )
    on conflict (id) do nothing;
  end if;
  return new;
end; $function$
```

### enviar_aviso_masivo(p_titulo text, p_mensaje text)

- Retorna: `integer`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.enviar_aviso_masivo(p_titulo text, p_mensaje text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_total integer;
begin
  if not public.es_administrador() then
    raise exception 'Solo los administradores pueden enviar avisos masivos.';
  end if;
  if coalesce(trim(p_titulo), '') = '' or coalesce(trim(p_mensaje), '') = '' then
    raise exception 'El título y el mensaje son obligatorios.';
  end if;

  insert into notificaciones (user_id, titulo, descripcion, icono, bg_icono, text_icono, accion_texto, leido, created_at, tipo)
  select p.id, trim(p_titulo), trim(p_mensaje), '🚨', 'bg-red-100', 'text-red-600', 'Ver aviso', false, now(), 'emergencia'
  from perfiles p join voluntarios v on v.id = p.id
  where p.rol = 'voluntario' and coalesce(p.alertas_emergencia, true) and coalesce(v.disponibilidad_activa, true);

  get diagnostics v_total = row_count;
  return v_total;
end; $function$
```

### es_administrador()

- Retorna: `boolean`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.es_administrador()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'administrador');
$function$
```

### exigir_documentos_para_aprobar()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.exigir_documentos_para_aprobar()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.estado = 'aprobada' and old.estado is distinct from 'aprobada' and old.fecha_aprobacion is null
     and (select count(*) from documentos_fundacion where fundacion_id = new.id and estado_revision = 'verificado') < 3 then
    raise exception 'No se puede aprobar: la fundación debe tener sus 3 documentos legales verificados.' using errcode = 'P0001';
  end if;
  return new;
end; $function$
```

### is_admin()

- Retorna: `boolean`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'
  );
$function$
```

### notificar_admins_nueva_fundacion()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.notificar_admins_nueva_fundacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.estado = 'pendiente' then
    insert into notificaciones (user_id, titulo, descripcion, icono, bg_icono, text_icono, accion_texto, leido, created_at, tipo, enlace)
    select p.id, 'Nueva solicitud de registro',
      coalesce(new.nombre_legal, 'Una fundación') || ' solicitó unirse a la plataforma y está pendiente de revisión.',
      '🏛️', 'bg-amber-100', 'text-amber-600', 'Revisar solicitud ➔', false, now(), 'aprobacion', '/dashboard/admin-aprobaciones'
    from perfiles p where p.rol = 'administrador';
  end if;
  return new;
end; $function$
```

### notificar_documento_rechazado()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.notificar_documento_rechazado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_nombre text;
begin
  if new.estado_revision = 'rechazado' and old.estado_revision is distinct from 'rechazado' then
    v_nombre := case new.tipo when 'rut' then 'RUT' when 'camara_comercio' then 'Cámara de Comercio' else 'Personería jurídica' end;
    insert into notificaciones (user_id, titulo, descripcion, icono, bg_icono, text_icono, accion_texto, leido, created_at, tipo, enlace)
    values (new.fundacion_id, 'Documento con observaciones: ' || v_nombre,
            coalesce(nullif(new.nota_revision, ''), 'El administrador encontró un problema con este documento.') || ' Sube una versión corregida desde la pestaña Documentos de tu perfil.',
            '⚠️', 'bg-amber-100', 'text-amber-600', 'Corregir documento ➔', false, now(), 'documento',
            '/dashboard/fundacion/editar/' || new.fundacion_id);
  end if;
  return null;
end; $function$
```

### proteger_estado_fundacion()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.proteger_estado_fundacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_privilegiado boolean := current_user in ('postgres', 'service_role', 'supabase_admin') or public.es_administrador();
begin
  if v_privilegiado then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Un registro nuevo siempre entra como pendiente de revisión
    new.estado := 'pendiente';
    new.fecha_aprobacion := null;
    new.aprobado_por := null;
    new.fecha_decision := null;
  elsif new.estado is distinct from old.estado
     or new.fecha_aprobacion is distinct from old.fecha_aprobacion
     or new.aprobado_por is distinct from old.aprobado_por
     or new.fecha_decision is distinct from old.fecha_decision then
    raise exception 'Solo un administrador puede cambiar el estado de aprobación de una fundación.'
      using errcode = '42501';
  end if;
  return new;
end; $function$
```

### proteger_rol_perfil()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.proteger_rol_perfil()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_privilegiado boolean := current_user in ('postgres', 'service_role', 'supabase_admin') or public.es_administrador();
begin
  if v_privilegiado then return new; end if;
  if tg_op = 'INSERT' and new.rol = 'administrador' then
    raise exception 'No puedes registrarte como administrador.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.rol is distinct from old.rol then
    raise exception 'Solo un administrador puede cambiar el rol de un usuario.' using errcode = '42501';
  end if;
  return new;
end; $function$
```

### recalcular_documentos_fundacion(p_fundacion uuid)

- Retorna: `void`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.recalcular_documentos_fundacion(p_fundacion uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lista text[]; v_total int; v_verificados int; v_rechazados int;
begin
  select coalesce(array_agg(case tipo when 'rut' then 'RUT' when 'camara_comercio' then 'Cámara de Comercio' else 'Personería jurídica' end
                            order by case tipo when 'rut' then 1 when 'camara_comercio' then 2 else 3 end), '{}'),
         count(*), count(*) filter (where estado_revision = 'verificado'), count(*) filter (where estado_revision = 'rechazado')
    into v_lista, v_total, v_verificados, v_rechazados
    from documentos_fundacion where fundacion_id = p_fundacion;

  update fundaciones set
    documentos_lista = v_lista,
    documentos_faltantes = v_total < 3 or v_rechazados > 0,
    documentos_verificados = v_verificados = 3,
    nivel_riesgo = case
      when v_rechazados > 0 then 'Alto (documento con observaciones)'
      when v_verificados = 3 then 'Bajo (documentación verificada)'
      when v_total = 3 then 'Medio (en revisión)'
      when v_total = 0 then 'Alto (sin documentos)'
      else 'Medio (' || v_total || ' de 3 documentos)' end
  where id = p_fundacion;
end; $function$
```

### registrar_fecha_decision_fundacion()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.registrar_fecha_decision_fundacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.estado is distinct from old.estado and new.estado in ('aprobada', 'rechazada') and old.estado in ('pendiente') then
    new.fecha_decision := now();
    if new.estado = 'aprobada' and new.fecha_aprobacion is null then
      new.fecha_aprobacion := now();
    end if;
  end if;
  return new;
end; $function$
```

### registrar_fecha_resolucion_necesidad()

- Retorna: `trigger`
- Seguridad: `SECURITY INVOKER`
- Ejecutable por: `=X/postgres`, `postgres=X/postgres`, `anon=X/postgres`, `authenticated=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.registrar_fecha_resolucion_necesidad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.completada and not coalesce(old.completada, false) and new.fecha_resolucion is null then
    new.fecha_resolucion := now();
  elsif not new.completada then
    new.fecha_resolucion := null;
  end if;
  return new;
end; $function$
```

### sincronizar_contador_necesidades()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.sincronizar_contador_necesidades()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_ids uuid[];
begin
  v_ids := array_remove(array[
    case when tg_op <> 'DELETE' then new.fundacion_id end,
    case when tg_op <> 'INSERT' then old.fundacion_id end
  ], null);
  update fundaciones f
     set necesidades_resueltas = (select count(*) from necesidades n where n.fundacion_id = f.id and n.completada)
   where f.id = any(v_ids);
  return null;
end; $function$
```

### tr_documentos_fundacion()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.tr_documentos_fundacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform recalcular_documentos_fundacion(coalesce(new.fundacion_id, old.fundacion_id));
  return null;
end; $function$
```

### validar_y_limitar_contacto()

- Retorna: `trigger`
- Seguridad: `SECURITY DEFINER`
- Ejecutable por: `postgres=X/postgres`, `service_role=X/postgres`

```sql
CREATE OR REPLACE FUNCTION public.validar_y_limitar_contacto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_headers json;
  v_ip text;
  v_clave text;
  v_recientes int;
  v_hoy int;
begin
  -- Validaciones básicas del contenido
  new.mensaje := trim(coalesce(new.mensaje, ''));
  new.nombre_remitente := left(trim(coalesce(new.nombre_remitente, '')), 120);
  new.email_remitente := lower(trim(coalesce(new.email_remitente, '')));
  if length(new.mensaje) < 5 then
    raise exception 'El mensaje es demasiado corto.' using errcode = 'P0001';
  end if;
  if length(new.mensaje) > 2000 then
    raise exception 'El mensaje no puede superar los 2.000 caracteres.' using errcode = 'P0001';
  end if;
  if new.email_remitente !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El correo electrónico no es válido.' using errcode = 'P0001';
  end if;

  -- Identidad del remitente: su cuenta, o su IP si no inició sesión
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then v_headers := null; end;
  v_ip := coalesce(v_headers->>'cf-connecting-ip', split_part(v_headers->>'x-forwarded-for', ',', 1));
  v_clave := case
    when auth.uid() is not null then 'usuario:' || auth.uid()
    when nullif(trim(v_ip), '') is not null then 'ip:' || trim(v_ip)
    else 'correo:' || new.email_remitente end;

  select count(*) filter (where created_at > now() - interval '10 minutes'), count(*)
    into v_recientes, v_hoy
    from limite_envios_contacto where clave = v_clave and created_at > now() - interval '1 day';

  if v_recientes >= 5 or v_hoy >= 30 then
    raise exception 'Has enviado demasiados mensajes. Intenta de nuevo más tarde.' using errcode = 'P0001';
  end if;

  delete from limite_envios_contacto where clave = v_clave and created_at < now() - interval '1 day';
  insert into limite_envios_contacto (clave) values (v_clave);
  return new;
end; $function$
```

## Realtime

Tablas publicadas en `supabase_realtime`:

- `public.notificaciones`
- `public.sesiones_usuario`

## Extensiones

- `pg_stat_statements` 1.11 (esquema `extensions`)
- `pgcrypto` 1.3 (esquema `extensions`)
- `plpgsql` 1.0 (esquema `pg_catalog`)
- `supabase_vault` 0.3.1 (esquema `vault`)
- `uuid-ossp` 1.1 (esquema `extensions`)

## Historial de migraciones

| Versión | Nombre |
|---|---|
| 20261004010936 | calificaciones_contacto_notificaciones_admin |
| 20261004014923 | fundaciones_fecha_decision |
| 20261004015508 | necesidades_lectura_admin |
| 20261004020128 | necesidades_gestion_admin |
| 20261004020210 | fundaciones_proteger_estado |
| 20261004020223 | fundaciones_proteger_estado_invoker |
| 20261004030413 | sincronizar_necesidades_resueltas |
| 20261004034240 | documentos_fundacion |
| 20261004035834 | revision_documentos_fundacion |
| 20261004041409 | cerrar_escalada_privilegios |
| 20261004042410 | exigir_documentos_primera_aprobacion |
| 20261004042550 | limite_mensajes_contacto |
| 20261004042620 | eliminar_flujo_solicitudes_mensuales |
| 20261004042650 | bucket_imagenes_publicas |
| 20261004042849 | indices_claves_foraneas |
| 20261004185946 | imagenes_permiso_lectura_api |
| 20261004190709 | optimizar_politicas_rls |
| 20261004190815 | galeria_solo_fundaciones_visibles |
| 20261004192654 | perfil_completo_y_sellos_reales |
| 20261005010612 | crear_perfil_al_registrarse |
| 20261005012425 | registro_con_ciudad |
