import { supabase } from './supabase';
import { TIPOS_DOCUMENTO } from './documentos';
import type { EstadoAprobacion } from './database.types';

export type TipoEvento = 'solicitud' | 'documento_verificado' | 'documento_observado' | 'aprobada' | 'rechazada' | 'inactiva';

export interface EventoHistorial {
  fecha: string;
  tipo: TipoEvento;
  fundacionId: string;
  fundacion: string;
  nit: string;
  detalle: string;
  responsable: string | null;
}

export interface FundacionActa {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad: string | null;
  representante_legal: string | null;
  estado: EstadoAprobacion | null;
  fecha_solicitud: string | null;
  fecha_decision: string | null;
  aprobado_por_nombre: string | null;
  documentos_verificados: number;
}

export interface DatosHistorial {
  eventos: EventoHistorial[];
  fundaciones: FundacionActa[];
}

const NOMBRE_DOCUMENTO = Object.fromEntries(TIPOS_DOCUMENTO.map(d => [d.tipo, d.nombre]));

/** Reconstruye el historial de aprobaciones con lo que registra la base de datos */
export async function cargarHistorial(): Promise<DatosHistorial> {
  const [{ data: funds, error: errFunds }, { data: docs, error: errDocs }] = await Promise.all([
    supabase
      .from('fundaciones')
      .select('id, nombre_legal, nit, ciudad, ubicacion, representante_legal, estado, fecha_solicitud, fecha_aprobacion, fecha_decision, aprobado_por'),
    supabase
      .from('documentos_fundacion')
      .select('fundacion_id, tipo, estado_revision, nota_revision, revisado_por, fecha_revision'),
  ]);
  if (errFunds) throw errFunds;
  if (errDocs) throw errDocs;

  const fundaciones = funds || [];
  const documentos = docs || [];

  const idsAdmins = [...new Set([
    ...fundaciones.map(f => f.aprobado_por),
    ...documentos.map(d => d.revisado_por),
  ].filter(Boolean))] as string[];
  const admins = new Map<string, string>();
  if (idsAdmins.length) {
    const { data } = await supabase.from('administradores').select('id, nombre_completo').in('id', idsAdmins);
    (data || []).forEach(a => admins.set(a.id, a.nombre_completo));
  }
  const nombreAdmin = (id: string | null) => (id ? admins.get(id) || 'Administrador' : null);

  const porId = new Map(fundaciones.map(f => [f.id, f]));
  const eventos: EventoHistorial[] = [];

  for (const f of fundaciones) {
    const base = { fundacionId: f.id, fundacion: f.nombre_legal, nit: f.nit };
    if (f.fecha_solicitud) {
      eventos.push({ ...base, fecha: f.fecha_solicitud, tipo: 'solicitud', detalle: 'Solicitud de ingreso recibida', responsable: null });
    }
    if (f.estado === 'aprobada') {
      const fecha = f.fecha_aprobacion || f.fecha_decision;
      if (fecha) eventos.push({ ...base, fecha, tipo: 'aprobada', detalle: 'Fundación aprobada', responsable: nombreAdmin(f.aprobado_por) });
    } else if ((f.estado === 'rechazada' || f.estado === 'inactiva') && f.fecha_decision) {
      eventos.push({
        ...base,
        fecha: f.fecha_decision,
        tipo: f.estado,
        detalle: f.estado === 'rechazada' ? 'Solicitud rechazada' : 'Fundación desactivada',
        responsable: null,
      });
    }
  }

  for (const d of documentos) {
    const f = porId.get(d.fundacion_id);
    if (!f || !d.fecha_revision || d.estado_revision === 'pendiente') continue;
    const nombreDoc = NOMBRE_DOCUMENTO[d.tipo] || d.tipo;
    const verificado = d.estado_revision === 'verificado';
    eventos.push({
      fundacionId: f.id,
      fundacion: f.nombre_legal,
      nit: f.nit,
      fecha: d.fecha_revision,
      tipo: verificado ? 'documento_verificado' : 'documento_observado',
      detalle: verificado ? `${nombreDoc} verificado` : `${nombreDoc} con observaciones${d.nota_revision ? `: ${d.nota_revision}` : ''}`,
      responsable: nombreAdmin(d.revisado_por),
    });
  }

  eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const verificadosPorFundacion: Record<string, number> = {};
  documentos.forEach(d => {
    if (d.estado_revision === 'verificado') verificadosPorFundacion[d.fundacion_id] = (verificadosPorFundacion[d.fundacion_id] || 0) + 1;
  });

  return {
    eventos,
    fundaciones: fundaciones.map(f => ({
      id: f.id,
      nombre_legal: f.nombre_legal,
      nit: f.nit,
      ciudad: f.ciudad || f.ubicacion || null,
      representante_legal: f.representante_legal,
      estado: f.estado,
      fecha_solicitud: f.fecha_solicitud,
      fecha_decision: f.estado === 'aprobada' ? f.fecha_aprobacion || f.fecha_decision : f.fecha_decision,
      aprobado_por_nombre: f.estado === 'aprobada' ? nombreAdmin(f.aprobado_por) : null,
      documentos_verificados: verificadosPorFundacion[f.id] || 0,
    })),
  };
}

const ESTADO_TEXTO: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  inactiva: 'Inactiva',
};

export const formatearFecha = (fecha: string | null, conHora = false) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', conHora
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
};

const esc = (texto: string | null | undefined) =>
  String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Arma el acta del comité de verificación como documento HTML imprimible */
export function construirActa({ eventos, fundaciones }: DatosHistorial, generadoPor: string): string {
  const ahora = new Date();
  const conteo = (estado: string) => fundaciones.filter(f => (f.estado || 'pendiente') === estado).length;
  const decididas = fundaciones
    .filter(f => f.estado && f.estado !== 'pendiente')
    .sort((a, b) => new Date(b.fecha_decision || 0).getTime() - new Date(a.fecha_decision || 0).getTime());
  const pendientes = fundaciones.filter(f => !f.estado || f.estado === 'pendiente');
  const consecutivo = `ACTA-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}`;

  const filas = (items: string[][]) => items.map(c => `<tr>${c.map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
  const vacio = (cols: number, texto: string) => `<tr><td colspan="${cols}" class="vacio">${texto}</td></tr>`;

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${consecutivo} · Comité de Verificación 7:34 AM</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f2a3f; font-size: 11px; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  h2 { font-size: 13px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #005684; color: #005684; }
  .meta { color: #475569; margin: 0; line-height: 1.6; }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
  .resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .resumen div { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; text-align: center; }
  .resumen b { display: block; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; }
  th { background: #eef6ff; font-size: 10px; text-transform: uppercase; }
  tr { page-break-inside: avoid; }
  .vacio { text-align: center; color: #64748b; font-style: italic; }
  .firmas { display: flex; gap: 40px; margin-top: 48px; }
  .firmas div { flex: 1; border-top: 1px solid #0f2a3f; padding-top: 4px; text-align: center; }
  .pie { margin-top: 24px; color: #64748b; font-size: 9px; }
</style></head><body>
  <div class="cabecera">
    <div>
      <h1>Acta del Comité de Verificación</h1>
      <p class="meta">Plataforma 7:34 AM · Aprobación de fundaciones</p>
    </div>
    <p class="meta" style="text-align:right">
      <b>${consecutivo}</b><br>
      Generada: ${esc(formatearFecha(ahora.toISOString(), true))}<br>
      Por: ${esc(generadoPor)}
    </p>
  </div>

  <h2>1. Resumen de solicitudes</h2>
  <div class="resumen">
    <div><b>${conteo('pendiente')}</b>Pendientes</div>
    <div><b>${conteo('aprobada')}</b>Aprobadas</div>
    <div><b>${conteo('rechazada')}</b>Rechazadas</div>
    <div><b>${conteo('inactiva')}</b>Inactivas</div>
  </div>

  <h2>2. Decisiones registradas</h2>
  <table>
    <thead><tr><th>Fundación</th><th>NIT</th><th>Ciudad</th><th>Decisión</th><th>Fecha</th><th>Responsable</th><th>Docs. verificados</th></tr></thead>
    <tbody>${decididas.length ? filas(decididas.map(f => [
      esc(f.nombre_legal), esc(f.nit), esc(f.ciudad || '—'), esc(ESTADO_TEXTO[f.estado || ''] || f.estado),
      esc(formatearFecha(f.fecha_decision)), esc(f.aprobado_por_nombre || '—'), `${f.documentos_verificados}/3`,
    ])) : vacio(7, 'No hay decisiones registradas.')}</tbody>
  </table>

  <h2>3. Solicitudes pendientes de dictamen</h2>
  <table>
    <thead><tr><th>Fundación</th><th>NIT</th><th>Representante legal</th><th>Recibida</th><th>Docs. verificados</th></tr></thead>
    <tbody>${pendientes.length ? filas(pendientes.map(f => [
      esc(f.nombre_legal), esc(f.nit), esc(f.representante_legal || '—'), esc(formatearFecha(f.fecha_solicitud)), `${f.documentos_verificados}/3`,
    ])) : vacio(5, 'No hay solicitudes pendientes.')}</tbody>
  </table>

  <h2>4. Bitácora de actuaciones</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Fundación</th><th>Actuación</th><th>Responsable</th></tr></thead>
    <tbody>${eventos.length ? filas(eventos.map(e => [
      esc(formatearFecha(e.fecha, true)), `${esc(e.fundacion)}<br><span style="color:#64748b">NIT ${esc(e.nit)}</span>`, esc(e.detalle), esc(e.responsable || '—'),
    ])) : vacio(4, 'Sin actuaciones registradas.')}</tbody>
  </table>

  <div class="firmas"><div>Firma administrador(a)</div><div>Firma comité de verificación</div></div>
  <p class="pie">Documento generado automáticamente a partir de los registros de la plataforma 7:34 AM. Las fechas y responsables provienen de la base de datos.</p>
</body></html>`;
}

/** Abre el diálogo de impresión con el acta (permite guardarla como PDF) sin ventanas emergentes */
export function imprimirActa(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    throw new Error('El navegador no permitió preparar el acta.');
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow.onafterprint = () => iframe.remove();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Respaldo por si el navegador no dispara onafterprint
    setTimeout(() => iframe.remove(), 60000);
  }, 250);
}
