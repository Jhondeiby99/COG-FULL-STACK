/**
 * Tipos de las filas de la base de datos (generados desde el esquema de Supabase).
 * Si cambia una tabla, regenerarlos con: Supabase → API Docs → TypeScript, o `supabase gen types`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EstadoAprobacion = 'pendiente' | 'aprobada' | 'rechazada' | 'inactiva';
export type NivelPrioridad = 'alta' | 'media' | 'baja';
export type RolUsuario = 'fundacion' | 'voluntario' | 'administrador';

export interface FundacionRow {
  ano_fundacion: string | null;
  anos_operacion: number | null;
  aprobado_por: string | null;
  area_enfoque: string | null;
  areas_impacto: string[] | null;
  canales_recaudo: Json | null;
  ciudad: string | null;
  departamento: string | null;
  descripcion: string | null;
  direccion_fisica: string | null;
  documento_legal_url: string | null;
  documentos_enlace: string | null;
  documentos_faltantes: boolean | null;
  documentos_lista: string[] | null;
  documentos_verificados: boolean;
  email_contacto: string | null;
  email_institucional: string | null;
  estado: EstadoAprobacion | null;
  familias_acompanadas: number | null;
  fecha_aprobacion: string | null;
  fecha_decision: string | null;
  fecha_solicitud: string | null;
  foto_portada_url: string | null;
  id: string;
  indice_transparencia: number | null;
  instagram: string | null;
  localidad: string | null;
  logo_url: string | null;
  mision: string | null;
  necesidades_resueltas: number | null;
  nit: string;
  nivel_riesgo: string | null;
  nombre_legal: string;
  personeria_juridica: string | null;
  portada_url: string | null;
  representante_legal: string;
  sigla: string | null;
  sitio_web: string | null;
  telefono: string | null;
  telefono_whatsapp: string | null;
  ubicacion: string | null;
  vision: string | null;
}

export interface VoluntarioRow {
  avatar_url: string | null;
  bloques_libres: Json | null;
  ciudad_base: string | null;
  disponibilidad_activa: boolean | null;
  disponibilidad_viajar: boolean | null;
  disponibilidad_viaje: string | null;
  franjas_horarias: Json | null;
  habilidades: string[] | null;
  horas_objetivo_mensual: number | null;
  horas_totales_donadas: number | null;
  id: string;
  id_colegiada: string | null;
  is_verified: boolean | null;
  modalidad_apoyo: string | null;
  nombre_completo: string;
  presentacion_civica: string | null;
  profesion: string | null;
  radio_desplazamiento: number | null;
  servicios_ofrecidos: Json | null;
  sobre_mi: string | null;
  tiempo_disponible: string | null;
  ubicacion: string | null;
}

export interface NecesidadRow {
  categoria: string | null;
  completada: boolean | null;
  created_at: string | null;
  descripcion: string | null;
  fecha_resolucion: string | null;
  fundacion_id: string | null;
  id: string;
  meta_texto: string | null;
  porcentaje_recaudado: number | null;
  prioridad: NivelPrioridad | null;
  titulo: string;
}

export interface ResenaRow {
  autor_id: string | null;
  avatar_autor_url: string | null;
  created_at: string | null;
  fundacion_id: string | null;
  id: string;
  nombre_autor: string;
  rating: number | null;
  rol_autor: string | null;
  texto_comentario: string | null;
  voluntario_id: string | null;
}

export interface GaleriaRow {
  alt_texto: string | null;
  fundacion_id: string | null;
  id: string;
  imagen_url: string;
}

export interface HistorialVoluntariadoRow {
  certificado_por: string | null;
  descripcion: string | null;
  fecha_texto: string | null;
  fundacion_nombre: string;
  id: string;
  rol: string;
  voluntario_id: string | null;
}

/** Certificación guardada en voluntarios.servicios_ofrecidos (JSON) */
export interface CertificacionVoluntario {
  id: string;
  titulo: string;
  descripcion?: string;
  entidad_folio?: string;
  icono?: string;
  verificado?: boolean;
  archivo_url?: string;
}

/** voluntarios.franjas_horarias: franja → día (lun..dom) → disponible */
export type FranjasHorarias = Partial<Record<'manana' | 'tarde' | 'noche', Record<string, boolean>>>;
