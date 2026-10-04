import { supabase } from './supabase';

export type PrioridadNecesidad = 'alta' | 'media' | 'baja';

export interface Necesidad {
  id: string;
  fundacion_id?: string;
  titulo: string;
  descripcion?: string | null;
  categoria?: string | null;
  prioridad?: PrioridadNecesidad | null;
  meta_texto?: string | null;
  porcentaje_recaudado?: number | string | null;
  completada?: boolean | null;
  fecha_resolucion?: string | null;
  created_at?: string | null;
}

// Opciones y estilos compartidos por los formularios y tarjetas de necesidades
export const CATEGORIAS_NECESIDAD = ['Alimentos', 'Salud', 'Educación', 'Vivienda', 'Ropa y abrigo', 'Logística', 'Voluntariado', 'Dinero', 'Otro'];

export const PRIORIDAD_ESTILOS: Record<PrioridadNecesidad, { label: string; chip: string; barra: string }> = {
  alta: { label: 'Prioridad alta', chip: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]', barra: 'bg-[#ef4444]' },
  media: { label: 'Prioridad media', chip: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]', barra: 'bg-[#f59e0b]' },
  baja: { label: 'Prioridad baja', chip: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]', barra: 'bg-[#3b82f6]' },
};

// Porcentaje de recaudo normalizado: entero entre 0 y 100. Una necesidad resuelta siempre es 100%.
export function porcentajeRecaudo(nec: Pick<Necesidad, 'porcentaje_recaudado' | 'completada'>): number {
  if (nec.completada) return 100;
  const valor = Number(nec.porcentaje_recaudado);
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

// Recalcula el contador público "necesidades resueltas" de la fundación a partir de la tabla necesidades
export async function sincronizarNecesidadesResueltas(fundacionId: string) {
  const { count, error } = await supabase
    .from('necesidades')
    .select('id', { count: 'exact', head: true })
    .eq('fundacion_id', fundacionId)
    .eq('completada', true);

  if (error || count === null) {
    console.error('No se pudo recalcular necesidades resueltas:', error?.message);
    return;
  }
  await supabase.from('fundaciones').update({ necesidades_resueltas: count }).eq('id', fundacionId);
}

// Actualiza una necesidad y verifica que realmente se haya modificado (RLS puede bloquear sin error)
export async function actualizarNecesidad(necId: string, cambios: Partial<Necesidad>) {
  const { data, error } = await supabase
    .from('necesidades')
    .update(cambios)
    .eq('id', necId)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No tienes permisos para modificar esta necesidad. Verifica las políticas RLS de la tabla necesidades.');
  }
  return data[0] as Necesidad;
}

export async function marcarNecesidadResuelta(necId: string, fundacionId: string) {
  const actualizada = await actualizarNecesidad(necId, {
    completada: true,
    porcentaje_recaudado: 100,
    fecha_resolucion: new Date().toISOString(),
  });
  await sincronizarNecesidadesResueltas(fundacionId);
  return actualizada;
}

export async function reabrirNecesidad(necId: string, fundacionId: string) {
  const actualizada = await actualizarNecesidad(necId, {
    completada: false,
    fecha_resolucion: null,
  });
  await sincronizarNecesidadesResueltas(fundacionId);
  return actualizada;
}
