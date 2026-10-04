import { supabase } from './supabase';

/** Bucket privado de Storage: solo la fundación dueña y los administradores pueden leerlo */
const BUCKET = 'documentos-fundaciones';

export type TipoDocumento = 'rut' | 'camara_comercio' | 'personeria';

export type EstadoRevision = 'pendiente' | 'verificado' | 'rechazado';

export interface FuenteVerificacion {
  /** Qué debe comprobar el administrador */
  revisar: string[];
  /** Consulta oficial donde se valida */
  enlace: { texto: string; url: string };
}

export const TIPOS_DOCUMENTO: { tipo: TipoDocumento; nombre: string; ayuda: string; verificacion: FuenteVerificacion }[] = [
  {
    tipo: 'rut',
    nombre: 'RUT',
    ayuda: 'Registro Único Tributario expedido por la DIAN.',
    verificacion: {
      revisar: ['El NIT coincide con el registrado en la plataforma', 'El RUT figura como activo'],
      enlace: { texto: 'Consultar estado del RUT (DIAN)', url: 'https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces' },
    },
  },
  {
    tipo: 'camara_comercio',
    nombre: 'Cámara de Comercio',
    ayuda: 'Certificado de existencia y representación legal (máx. 30 días).',
    verificacion: {
      revisar: [
        'Es una entidad sin ánimo de lucro con matrícula activa y renovada',
        'El representante legal coincide con el registrado',
        'El certificado tiene menos de 30 días (valida su código de verificación en la cámara que lo expidió)',
      ],
      enlace: { texto: 'Buscar por NIT en RUES', url: 'https://www.rues.org.co/' },
    },
  },
  {
    tipo: 'personeria',
    nombre: 'Personería jurídica',
    ayuda: 'Acto administrativo que reconoce a la entidad sin ánimo de lucro.',
    verificacion: {
      revisar: ['La entidad existe legalmente y el nombre coincide', 'Suele constar en el certificado de Cámara de Comercio'],
      enlace: { texto: 'Buscar por NIT en RUES', url: 'https://www.rues.org.co/' },
    },
  },
];

/** Consultas recomendadas sobre el representante legal (con su cédula) */
export const VERIFICACION_REPRESENTANTE = [
  { texto: 'Antecedentes disciplinarios (Procuraduría)', url: 'https://www.procuraduria.gov.co/' },
  { texto: 'Antecedentes judiciales (Policía Nacional)', url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/' },
];

export const MAX_DOCUMENTO_MB = 15;
export const FORMATOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export interface DocumentoFundacion {
  id: string;
  fundacion_id: string;
  tipo: TipoDocumento;
  ruta: string;
  nombre_archivo: string;
  tamano_bytes: number | null;
  mime: string | null;
  created_at: string;
  estado_revision: EstadoRevision;
  nota_revision: string | null;
  revisado_por: string | null;
  fecha_revision: string | null;
}

/** Devuelve un mensaje de error si el archivo no es válido, o null si se puede subir */
export function validarDocumento(file: File): string | null {
  if (!FORMATOS_DOCUMENTO.includes(file.type)) return `"${file.name}" no es un PDF ni una imagen (JPG, PNG o WEBP).`;
  if (file.size > MAX_DOCUMENTO_MB * 1024 * 1024) return `"${file.name}" supera el máximo de ${MAX_DOCUMENTO_MB}MB.`;
  return null;
}

export async function listarDocumentos(fundacionId: string): Promise<DocumentoFundacion[]> {
  const { data, error } = await supabase.from('documentos_fundacion').select('*').eq('fundacion_id', fundacionId);
  if (error) throw error;
  return (data || []) as DocumentoFundacion[];
}

/** Sube (o reemplaza) el documento de un tipo. La BD recalcula sola los documentos faltantes y el nivel de riesgo. */
export async function subirDocumento(fundacionId: string, tipo: TipoDocumento, file: File): Promise<DocumentoFundacion> {
  const errorValidacion = validarDocumento(file);
  if (errorValidacion) throw new Error(errorValidacion);

  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const ruta = `${fundacionId}/${tipo}-${Date.now()}.${extension}`;

  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, file, { contentType: file.type });
  if (errorSubida) throw errorSubida;

  const { data: anterior } = await supabase
    .from('documentos_fundacion')
    .select('ruta')
    .eq('fundacion_id', fundacionId)
    .eq('tipo', tipo)
    .maybeSingle();

  const { data, error } = await supabase
    .from('documentos_fundacion')
    .upsert(
      { fundacion_id: fundacionId, tipo, ruta, nombre_archivo: file.name, tamano_bytes: file.size, mime: file.type, created_at: new Date().toISOString() },
      { onConflict: 'fundacion_id,tipo' }
    )
    .select()
    .single();

  if (error) {
    // Si no se pudo registrar, no dejamos el archivo huérfano en Storage
    await supabase.storage.from(BUCKET).remove([ruta]);
    throw error;
  }
  if (anterior?.ruta && anterior.ruta !== ruta) {
    await supabase.storage.from(BUCKET).remove([anterior.ruta]);
  }
  return data as DocumentoFundacion;
}

export async function eliminarDocumento(doc: DocumentoFundacion) {
  const { error } = await supabase.from('documentos_fundacion').delete().eq('id', doc.id);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([doc.ruta]);
}

/** Enlace temporal (5 minutos) para ver un documento privado */
export async function urlTemporalDocumento(ruta: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 300);
  if (error || !data) throw error || new Error('No se pudo generar el enlace del documento.');
  return data.signedUrl;
}

/** Solo administradores: marca un documento como verificado o con observaciones (la BD registra quién y cuándo) */
export async function revisarDocumento(docId: string, estado: Exclude<EstadoRevision, 'pendiente'>, nota?: string) {
  const { data, error } = await supabase
    .from('documentos_fundacion')
    .update({ estado_revision: estado, nota_revision: nota?.trim() || null })
    .eq('id', docId)
    .select()
    .single();
  if (error) throw error;
  if ((data as DocumentoFundacion).estado_revision !== estado) {
    throw new Error('No tienes permisos para revisar documentos.');
  }
  return data as DocumentoFundacion;
}
