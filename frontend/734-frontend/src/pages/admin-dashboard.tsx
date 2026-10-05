import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { VolunteerMap } from '../components/VolunteerMap';
import type { VoluntarioMapa } from '../components/VolunteerMap';

import { Icon } from '../components/Icon';
import type { NombreIcono } from '../lib/iconos';
interface Fundacion {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad: string | null;
  ubicacion: string | null;
  direccion_fisica: string | null;
  fecha_solicitud: string | null;
  fecha_decision: string | null;
  estado: string | null;
  area_enfoque: string | null;
  nivel_riesgo: string | null;
  documentos_lista: string[] | null;
  documentos_faltantes: boolean | null;
  logo_url: string | null;
}

interface NecesidadDash {
  id: string;
  fundacion_id: string;
  completada: boolean | null;
  created_at: string | null;
  fecha_resolucion: string | null;
}

interface ResenaDash {
  fundacion_id: string;
  rating: number | null;
}

type Periodo = '30d' | 'mes' | 'anio';

const ANIO_ACTUAL = new Date().getFullYear();
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ITEMS_POR_PAGINA = 3;

function inicioPeriodo(p: Periodo): Date {
  const hoy = new Date();
  if (p === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (p === 'anio') return new Date(hoy.getFullYear(), 0, 1);
  const d = new Date(hoy);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 29);
  return d;
}

const enPeriodo = (fecha: string | null, desde: Date) => !!fecha && new Date(fecha) >= desde;

function formatearDuracion(horas: number | null) {
  if (horas === null) return '—';
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 24) return `${horas.toFixed(1).replace('.', ',')} h`;
  return `${(horas / 24).toFixed(1).replace('.', ',')} días`;
}

function haceCuanto(fecha: string | null, ahora: number) {
  if (!fecha) return 'Sin fecha';
  const dias = Math.floor((ahora - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Hace 1 día';
  return `Hace ${dias} días`;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('30d');

  const [fundaciones, setFundaciones] = useState<Fundacion[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioMapa[]>([]);
  const [necesidades, setNecesidades] = useState<NecesidadDash[]>([]);
  const [resenas, setResenas] = useState<ResenaDash[]>([]);

  const [paginaActual, setPaginaActual] = useState(1);
  const [puntoActivo, setPuntoActivo] = useState<number | null>(null);

  // No hace setState antes del primer await: el indicador de carga lo maneja quien la invoca
  const cargarDatosDashboard = useCallback(async () => {
    try {
      const [fund, vol, nec, res] = await Promise.all([
        supabase.from('fundaciones').select('id, nombre_legal, nit, ciudad, ubicacion, direccion_fisica, fecha_solicitud, fecha_decision, estado, area_enfoque, nivel_riesgo, documentos_lista, documentos_faltantes, logo_url'),
        supabase.from('voluntarios').select('id, nombre_completo, profesion, ciudad_base, ubicacion, disponibilidad_activa'),
        supabase.from('necesidades').select('id, fundacion_id, completada, created_at, fecha_resolucion'),
        supabase.from('resenas').select('fundacion_id, rating').not('fundacion_id', 'is', null),
      ]);
      const error = fund.error || vol.error || nec.error || res.error;
      if (error) throw error;

      setFundaciones((fund.data || []) as Fundacion[]);
      setVoluntarios((vol.data || []) as VoluntarioMapa[]);
      setNecesidades((nec.data || []) as NecesidadDash[]);
      setResenas((res.data || []) as ResenaDash[]);
      setActualizado(new Date());
      setErrorCarga(null);
    } catch (e) {
      const err = e as { message?: string };
      setErrorCarga(err.message || 'Error de conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga/sincronización con Supabase al montar o al cambiar el parámetro
    cargarDatosDashboard();
  }, [cargarDatosDashboard]);

  const reintentarCarga = () => {
    setLoading(true);
    setErrorCarga(null);
    cargarDatosDashboard();
  };

  const ahora = actualizado?.getTime() ?? 0;

  const desde = useMemo(() => inicioPeriodo(periodo), [periodo]);
  const etiquetaPeriodo = periodo === '30d' ? 'últimos 30 días' : periodo === 'mes' ? 'este mes' : `año ${ANIO_ACTUAL}`;

  // ===== Métricas =====
  const m = useMemo(() => {
    const activas = fundaciones.filter(f => f.estado === 'aprobada');
    const pendientes = fundaciones
      .filter(f => f.estado === 'pendiente' || !f.estado)
      .sort((a, b) => new Date(a.fecha_solicitud || 0).getTime() - new Date(b.fecha_solicitud || 0).getTime());
    const nuevasPeriodo = fundaciones.filter(f => enPeriodo(f.fecha_solicitud, desde)).length;

    const volActivos = voluntarios.filter(v => v.disponibilidad_activa !== false);

    const necCompletadas = necesidades.filter(n => n.completada);
    const necPublicadasPeriodo = necesidades.filter(n => enPeriodo(n.created_at, desde)).length;
    const necCompletadasPeriodo = necCompletadas.filter(n => enPeriodo(n.fecha_resolucion, desde)).length;

    // Tiempo de auditoría: desde la solicitud hasta la decisión del administrador
    const tiempos = fundaciones
      .filter(f => f.fecha_solicitud && f.fecha_decision && enPeriodo(f.fecha_decision, desde))
      .map(f => (new Date(f.fecha_decision as string).getTime() - new Date(f.fecha_solicitud as string).getTime()) / 3600000)
      .filter(h => h >= 0)
      .sort((a, b) => a - b);
    const promedioAuditoria = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : null;
    const medianaAuditoria = tiempos.length
      ? (tiempos.length % 2 ? tiempos[(tiempos.length - 1) / 2] : (tiempos[tiempos.length / 2 - 1] + tiempos[tiempos.length / 2]) / 2)
      : null;
    const esperaMasAntigua = pendientes[0]?.fecha_solicitud
      ? Math.max(0, ahora - new Date(pendientes[0].fecha_solicitud).getTime()) / 3600000
      : null;

    // Especialidades de voluntarios activos
    const esp: Record<string, number> = {};
    volActivos.forEach(v => {
      const k = v.profesion?.trim() || 'Sin especialidad registrada';
      esp[k] = (esp[k] || 0) + 1;
    });
    const especialidades = Object.entries(esp).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Fundaciones destacadas: más necesidades completadas, luego publicadas y mejor calificación
    const porFundacion = new Map<string, { publicadas: number; completadas: number }>();
    necesidades.forEach(n => {
      const s = porFundacion.get(n.fundacion_id) || { publicadas: 0, completadas: 0 };
      s.publicadas++;
      if (n.completada) s.completadas++;
      porFundacion.set(n.fundacion_id, s);
    });
    const ratings = new Map<string, number[]>();
    resenas.forEach(r => {
      if (!r.rating) return;
      ratings.set(r.fundacion_id, [...(ratings.get(r.fundacion_id) || []), r.rating]);
    });
    const destacadas = activas
      .map(f => {
        const s = porFundacion.get(f.id) || { publicadas: 0, completadas: 0 };
        const rs = ratings.get(f.id) || [];
        return {
          ...f,
          ...s,
          cumplimiento: s.publicadas ? Math.round((s.completadas / s.publicadas) * 100) : 0,
          rating: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
          numResenas: rs.length,
        };
      })
      .sort((a, b) => b.completadas - a.completadas || b.publicadas - a.publicadas || (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    return {
      totalFundaciones: fundaciones.length,
      activas: activas.length,
      pendientes,
      rechazadas: fundaciones.filter(f => f.estado === 'rechazada').length,
      inactivas: fundaciones.filter(f => f.estado === 'inactiva').length,
      nuevasPeriodo,
      totalVoluntarios: voluntarios.length,
      volActivos: volActivos.length,
      pctVolActivos: voluntarios.length ? Math.round((volActivos.length / voluntarios.length) * 100) : 0,
      necTotal: necesidades.length,
      necCompletadas: necCompletadas.length,
      necAbiertas: necesidades.length - necCompletadas.length,
      necPublicadasPeriodo,
      necCompletadasPeriodo,
      tasaCumplimiento: necesidades.length ? Math.round((necCompletadas.length / necesidades.length) * 100) : 0,
      promedioAuditoria,
      medianaAuditoria,
      decisionesPeriodo: tiempos.length,
      esperaMasAntigua,
      especialidades,
      destacadas,
    };
  }, [fundaciones, voluntarios, necesidades, resenas, desde, ahora]);

  // ===== Serie del gráfico: necesidades publicadas vs completadas =====
  const serie = useMemo(() => {
    const buckets: { etiqueta: string; desde: Date; hasta: Date; publicadas: number; completadas: number }[] = [];
    const hoy = new Date();
    if (periodo === 'anio') {
      for (let mes = 0; mes <= hoy.getMonth(); mes++) {
        buckets.push({ etiqueta: MESES[mes], desde: new Date(ANIO_ACTUAL, mes, 1), hasta: new Date(ANIO_ACTUAL, mes + 1, 1), publicadas: 0, completadas: 0 });
      }
    } else {
      const d = new Date(desde);
      while (d <= hoy) {
        const fin = new Date(d);
        fin.setDate(fin.getDate() + 1);
        buckets.push({ etiqueta: `${d.getDate()} ${MESES[d.getMonth()]}`, desde: new Date(d), hasta: fin, publicadas: 0, completadas: 0 });
        d.setDate(d.getDate() + 1);
      }
    }
    const ubicar = (fecha: string | null) => {
      if (!fecha) return null;
      const t = new Date(fecha);
      return buckets.find(b => t >= b.desde && t < b.hasta) || null;
    };
    necesidades.forEach(n => {
      const bp = ubicar(n.created_at);
      if (bp) bp.publicadas++;
      if (n.completada) {
        const bc = ubicar(n.fecha_resolucion);
        if (bc) bc.completadas++;
      }
    });
    return buckets;
  }, [necesidades, periodo, desde]);

  // ===== Acciones =====
  const exportarCSV = () => {
    const celda = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas: (string | number | null)[][] = [
      ['Reporte del Panel de Control', `Periodo: ${etiquetaPeriodo}`, `Generado: ${new Date().toLocaleString('es-CO')}`],
      [],
      ['INDICADOR', 'VALOR'],
      ['Fundaciones registradas', m.totalFundaciones],
      ['Fundaciones activas (aprobadas)', m.activas],
      ['Fundaciones pendientes', m.pendientes.length],
      ['Fundaciones rechazadas', m.rechazadas],
      ['Fundaciones inactivas', m.inactivas],
      [`Nuevas solicitudes (${etiquetaPeriodo})`, m.nuevasPeriodo],
      ['Voluntarios registrados', m.totalVoluntarios],
      ['Voluntarios activos', m.volActivos],
      ['Necesidades publicadas (total)', m.necTotal],
      ['Necesidades completadas (total)', m.necCompletadas],
      [`Necesidades publicadas (${etiquetaPeriodo})`, m.necPublicadasPeriodo],
      [`Necesidades completadas (${etiquetaPeriodo})`, m.necCompletadasPeriodo],
      ['Tasa de cumplimiento de necesidades (%)', m.tasaCumplimiento],
      [`Tiempo promedio de auditoría (${etiquetaPeriodo})`, formatearDuracion(m.promedioAuditoria)],
      [`Tiempo mediano de auditoría (${etiquetaPeriodo})`, formatearDuracion(m.medianaAuditoria)],
      ['Decisiones de auditoría en el periodo', m.decisionesPeriodo],
      [],
      ['SERIE', 'Necesidades publicadas', 'Necesidades completadas'],
      ...serie.map(b => [b.etiqueta, b.publicadas, b.completadas]),
      [],
      ['FUNDACIONES PENDIENTES', 'NIT', 'Ciudad', 'Fecha de solicitud'],
      ...m.pendientes.map(f => [f.nombre_legal, f.nit, f.ciudad, f.fecha_solicitud ? new Date(f.fecha_solicitud).toLocaleDateString('es-CO') : '']),
      [],
      ['FUNDACIONES DESTACADAS', 'Necesidades publicadas', 'Necesidades completadas', 'Cumplimiento (%)', 'Calificación'],
      ...m.destacadas.map(f => [f.nombre_legal, f.publicadas, f.completadas, f.cumplimiento, f.rating ? f.rating.toFixed(1) : '']),
    ];
    const csv = '﻿' + filas.map(f => f.map(celda).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-panel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Paginación de la cola
  const totalPaginas = Math.max(1, Math.ceil(m.pendientes.length / ITEMS_POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas); // si se aprueba la última de una página, retrocede sola
  const pendientesPagina = m.pendientes.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  const getRiesgoStyle = (riesgo: string | null) =>
    !riesgo || riesgo.includes('Bajo')
      ? 'text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]'
      : riesgo.includes('Alto')
        ? 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]'
        : 'text-[#3b82f6] bg-[#eff6ff] border-[#bfdbfe]';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#005684]">Sincronizando panel con la base de datos...</p>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] shadow-sm max-w-md w-full text-center flex flex-col items-center gap-3">
          <span className="text-4xl"><Icon name="advertencia" size="1.1em" /></span>
          <h2 className="text-lg font-bold text-[#071d37]">No se pudo cargar el panel</h2>
          <p className="text-xs text-[#64748b]">{errorCarga}</p>
          <button type="button" onClick={reintentarCarga} className="bg-[#005684] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Geometría del gráfico
  const svgW = 1000;
  const svgH = 200;
  const pad = 24;
  const maxValor = Math.max(1, ...serie.map(b => Math.max(b.publicadas, b.completadas)));
  const xDe = (i: number) => (serie.length <= 1 ? svgW / 2 : pad + (i / (serie.length - 1)) * (svgW - 2 * pad));
  const yDe = (v: number) => svgH - pad - (v / maxValor) * (svgH - 2 * pad);
  const puntos = (k: 'publicadas' | 'completadas') => serie.map((b, i) => `${xDe(i).toFixed(1)},${yDe(b[k]).toFixed(1)}`).join(' ');
  const area = serie.length > 1
    ? `M ${xDe(0)},${svgH - pad} ` + serie.map((b, i) => `L ${xDe(i).toFixed(1)},${yDe(b.completadas).toFixed(1)}`).join(' ') + ` L ${xDe(serie.length - 1)},${svgH - pad} Z`
    : '';
  const totalPubSerie = serie.reduce((a, b) => a + b.publicadas, 0);
  const totalCompSerie = serie.reduce((a, b) => a + b.completadas, 0);
  const pasoEtiquetas = Math.max(1, Math.ceil(serie.length / 8));
  const puntoSel = puntoActivo !== null ? serie[puntoActivo] : null;

  return (
    <div className="w-full">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-6">

        {/* ENCABEZADO */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-bold text-[#005684]">
                Datos en vivo • Actualizado {actualizado?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button type="button" onClick={() => cargarDatosDashboard()} className="text-[10px] font-bold text-[#64748b] hover:text-[#005684] cursor-pointer print:hidden" title="Actualizar datos">
                <Icon name="actualizar" size="1.1em" /> Actualizar
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mb-1 mt-1">Panel de Control y Supervisión General</h1>
            <p className="text-xs text-[#64748b]">Gestión transparente de alianzas comunitarias, voluntariado y trazabilidad operativa en Colombia.</p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 print:hidden">
            <div className="flex bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm">
              {([['30d', 'Últimos 30 días'], ['mes', 'Este mes'], ['anio', `Año ${ANIO_ACTUAL}`]] as [Periodo, string][]).map(([valor, texto], i) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => { setPeriodo(valor); setPuntoActivo(null); }}
                  className={`flex-1 text-[11px] font-bold px-4 py-1.5 transition cursor-pointer ${i > 0 ? 'border-l border-[#e2e8f0]' : ''} ${periodo === valor ? 'bg-[#005684] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                >
                  {texto}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={exportarCSV} className="flex-1 bg-white border border-[#e2e8f0] text-[#071d37] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <span><Icon name="reporte" size="1.1em" /></span> Exportar CSV
              </button>
              <button type="button" onClick={() => window.print()} className="flex-1 bg-white border border-[#e2e8f0] text-[#071d37] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <span><Icon name="imprimir" size="1.1em" /></span> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>

        {/* TARJETAS KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            categoria="Organizaciones" icono="fundacion" titulo="Fundaciones Registradas"
            valor={m.totalFundaciones.toLocaleString('es-CO')}
            extra={m.nuevasPeriodo > 0 ? `+${m.nuevasPeriodo} en ${etiquetaPeriodo}` : `Sin nuevas en ${etiquetaPeriodo}`}
            pieIzq={`${m.activas} activas`}
            pieDer={<span className={`font-bold px-2 py-0.5 rounded-full border ${m.pendientes.length ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{m.pendientes.length} pendientes</span>}
          />
          <KpiCard
            categoria="Capital Humano" icono="voluntarios" titulo="Voluntarios Registrados"
            valor={m.totalVoluntarios.toLocaleString('es-CO')}
            extra={`${m.pctVolActivos}% activos`}
            pieIzq="Disponibles para misiones"
            pieDer={<span className="text-[#005684] font-bold">{m.volActivos} activos</span>}
          />
          <KpiCard
            categoria="Necesidades" icono="necesidad" titulo="Publicadas / Completadas"
            valor={<>{m.necTotal}<span className="text-xl text-[#94a3b8] font-bold"> / </span><span className="text-[#059669]">{m.necCompletadas}</span></>}
            extra={`${m.tasaCumplimiento}% cumplidas`}
            pieIzq={`En ${etiquetaPeriodo}`}
            pieDer={<span className="font-bold text-[#071d37]">+{m.necPublicadasPeriodo} publ. · {m.necCompletadasPeriodo} compl.</span>}
          />
          <KpiCard
            categoria="Garantía Operativa" icono="auditoria" titulo="Tiempo de Auditoría"
            valor={formatearDuracion(m.promedioAuditoria)}
            extra={m.decisionesPeriodo ? `promedio · ${m.decisionesPeriodo} decisión${m.decisionesPeriodo === 1 ? '' : 'es'}` : `sin decisiones en ${etiquetaPeriodo}`}
            pieIzq="Solicitud pendiente más antigua"
            pieDer={<span className={`font-bold ${m.esperaMasAntigua !== null && m.esperaMasAntigua > 72 ? 'text-red-600' : 'text-[#071d37]'}`}>{m.esperaMasAntigua !== null ? formatearDuracion(m.esperaMasAntigua) : 'Ninguna'}</span>}
            titleAttr="Tiempo entre la solicitud de registro de la fundación y la decisión (aprobación o rechazo) del administrador."
          />
        </div>

        {/* GRÁFICO */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-5 gap-3">
            <div>
              <h3 className="text-base font-bold text-[#071d37] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#005684]"></span>
                Necesidades Publicadas vs. Completadas
              </h3>
              <p className="text-xs text-[#64748b] mt-1">Evolución de las necesidades de las fundaciones en {etiquetaPeriodo}.</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-[10px] font-bold text-[#64748b]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#94a3b8]"></span> Publicadas ({totalPubSerie})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#0ea5e9]"></span> Completadas ({totalCompSerie})</span>
            </div>
          </div>

          <div className="relative w-full h-56 bg-gradient-to-b from-[#f8fafc] to-white rounded-xl border border-dashed border-[#e2e8f0] overflow-hidden" onMouseLeave={() => setPuntoActivo(null)}>
            {totalPubSerie + totalCompSerie === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[#94a3b8] text-center px-4">
                No hay necesidades publicadas ni completadas en {etiquetaPeriodo}.
              </div>
            ) : (
              <svg className="absolute inset-0 w-full h-[calc(100%-24px)]" preserveAspectRatio="none" viewBox={`0 0 ${svgW} ${svgH}`}>
                <defs>
                  <linearGradient id="gradCompletadas" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(f => (
                  <line key={f} x1={pad} x2={svgW - pad} y1={yDe(maxValor * f)} y2={yDe(maxValor * f)} stroke="#eef2f7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {area && <path d={area} fill="url(#gradCompletadas)" />}
                <polyline fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" points={puntos('publicadas')} vectorEffect="non-scaling-stroke" />
                <polyline fill="none" stroke="#0ea5e9" strokeWidth="2.5" points={puntos('completadas')} vectorEffect="non-scaling-stroke" />
                {puntoActivo !== null && (
                  <line x1={xDe(puntoActivo)} x2={xDe(puntoActivo)} y1={pad / 2} y2={svgH - pad} stroke="#005684" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                )}
                {serie.map((_, i) => (
                  <rect
                    key={i}
                    x={xDe(i) - (svgW / Math.max(serie.length, 1)) / 2}
                    y={0}
                    width={svgW / Math.max(serie.length, 1)}
                    height={svgH}
                    fill="transparent"
                    onMouseEnter={() => setPuntoActivo(i)}
                    onClick={() => setPuntoActivo(i)}
                  />
                ))}
              </svg>
            )}

            {puntoSel && puntoActivo !== null && (
              <div
                className="absolute top-2 bg-[#0f2a3f] text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2"
                style={{ left: `${Math.min(Math.max((xDe(puntoActivo) / svgW) * 100, 12), 88)}%` }}
              >
                <p className="font-bold">{puntoSel.etiqueta}</p>
                <p className="text-gray-300">Publicadas: {puntoSel.publicadas} · Completadas: {puntoSel.completadas}</p>
              </div>
            )}

            <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3 text-[9px] font-bold text-[#94a3b8]">
              {serie.map((b, i) => (
                <span key={i} className={i % pasoEtiquetas === 0 || i === serie.length - 1 ? '' : 'invisible'}>{b.etiqueta}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-[#f8fafc] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-[#e2e8f0] gap-2">
            <p className="text-[11px] text-[#475569] flex items-center gap-2">
              <span className="text-[#005684]"><Icon name="trayectoria" size="1.1em" /></span>
              <span>
                <strong>Lectura operativa:</strong> {m.necAbiertas} necesidad{m.necAbiertas === 1 ? '' : 'es'} abierta{m.necAbiertas === 1 ? '' : 's'} y una tasa de cumplimiento histórica del <strong>{m.tasaCumplimiento}%</strong>.
              </span>
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 shrink-0 print:hidden">
              <Link to="/dashboard/admin-necesidades" className="text-[11px] font-bold text-[#005684] hover:underline">
                Gestionar necesidades →
              </Link>
              <button type="button" onClick={exportarCSV} className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer text-left">
                Descargar informe →
              </button>
            </div>
          </div>
        </section>

        {/* COLA DE APROBACIONES */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-1">
                <span className="text-[#005684]"><Icon name="seguridad" size="1.1em" /></span> Cola de Aprobaciones de Fundaciones
              </h3>
              <p className="text-xs text-[#64748b]">Ordenadas por antigüedad: las solicitudes que más tiempo llevan esperando aparecen primero.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                Pendientes <span className="bg-red-500 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[9px]">{m.pendientes.length}</span>
              </span>
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                Activas <span className="bg-emerald-500 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[9px]">{m.activas}</span>
              </span>
              <Link to="/dashboard/admin-aprobaciones" className="bg-[#eef6ff] border border-[#dbeafe] text-[#005684] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#d4e7fe] transition print:hidden">
                Gestionar solicitudes →
              </Link>
            </div>
          </div>

          {m.pendientes.length === 0 ? (
            <div className="text-center py-10 bg-[#f8fafc] rounded-2xl border border-dashed border-[#e2e8f0]">
              <p className="text-xs font-bold text-[#059669]"><Icon name="celebracion" size="1.1em" /> No hay fundaciones pendientes de revisión.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    {['Organización / Entidad', 'Ciudad / Región', 'Solicitud', 'Documentos', 'Nivel de Riesgo'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {pendientesPagina.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8fafc] transition">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#005684] text-xs font-bold flex items-center justify-center shrink-0 border border-[#dbeafe]">
                            {(item.nombre_legal || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#071d37]">{item.nombre_legal}</p>
                            <p className="text-[10px] text-[#64748b]">NIT: {item.nit || '—'} • {item.area_enfoque || 'Sin área registrada'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-[11px] font-semibold text-[#071d37]"><Icon name="ubicacion" className="text-[#006194]" size="1.1em" /> {item.ciudad || 'Sin ciudad'}</p>
                        <p className="text-[10px] text-[#64748b]">{item.direccion_fisica || item.ubicacion || '—'}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-[11px] font-semibold text-[#071d37]">
                          {item.fecha_solicitud ? new Date(item.fecha_solicitud).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                        </p>
                        <p className="text-[10px] text-[#64748b]">{haceCuanto(item.fecha_solicitud, ahora)}</p>
                      </td>
                      <td className="py-4 pr-4">
                        {item.documentos_lista && item.documentos_lista.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.documentos_lista.map((doc, i) => (
                              <span key={i} className="text-[9px] bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded text-[#64748b] font-semibold flex items-center gap-1">
                                <span className="text-[#005684]"><Icon name="documento" size="1.1em" /></span> {doc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8]">Sin documentos</span>
                        )}
                        {item.documentos_faltantes && <p className="text-[9px] text-red-500 font-bold mt-1"><Icon name="advertencia" size="1.1em" /> Documentación incompleta</p>}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRiesgoStyle(item.nivel_riesgo)} flex items-center gap-1 w-max`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {item.nivel_riesgo || 'Sin evaluar'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          to="/dashboard/admin-aprobaciones"
                          title="La aprobación requiere verificar los 3 documentos legales"
                          className="bg-[#005684] hover:bg-[#00456a] text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1 print:hidden"
                        >
                          <Icon name="auditoria" size={13} /> Revisar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {m.pendientes.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mt-4 pt-4 border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-semibold print:hidden">
              <p>Mostrando {pendientesPagina.length} de {m.pendientes.length} solicitudes pendientes.</p>
              <div className="flex gap-4 items-center">
                <button type="button" onClick={() => setPaginaActual(Math.max(1, pagina - 1))} disabled={pagina === 1} className="hover:text-[#071d37] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Anterior</button>
                <span>Página {pagina} de {totalPaginas}</span>
                <button type="button" onClick={() => setPaginaActual(Math.min(totalPaginas, pagina + 1))} disabled={pagina === totalPaginas} className="hover:text-[#071d37] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Siguiente</button>
              </div>
            </div>
          )}
        </section>

        {/* ZONA INFERIOR */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 pb-8">

          {/* Fundaciones Activas Destacadas */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm flex flex-col">
            <div className="flex justify-between items-center gap-2 mb-1">
              <h3 className="text-[13px] font-bold text-[#071d37]">Fundaciones Activas Destacadas</h3>
              <Link to="/dashboard/admin-fundaciones" className="text-[10px] font-bold text-[#005684] hover:underline shrink-0 print:hidden">
                Ver todas ({m.activas}) &gt;
              </Link>
            </div>
            <p className="text-[10px] text-[#64748b] mb-4">Ranking por necesidades completadas, necesidades publicadas y calificación de la comunidad.</p>

            <div className="flex flex-col gap-3">
              {m.destacadas.length === 0 ? (
                <p className="text-xs text-[#94a3b8] text-center py-6">Aún no hay fundaciones activas.</p>
              ) : m.destacadas.map((fund, idx) => (
                <Link key={fund.id} to={`/fundacion/${fund.id}`} className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl flex items-center gap-3 hover:border-[#bae6fd] hover:bg-[#f0f9ff] transition">
                  <span className="text-[11px] font-black text-[#94a3b8] w-4 text-center shrink-0">{idx + 1}</span>
                  {fund.logo_url ? (
                    <img src={fund.logo_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#eef6ff] text-[#005684] text-xs font-bold flex items-center justify-center shrink-0 border border-[#dbeafe]">
                      {(fund.nombre_legal || '?').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-[#071d37] truncate">{fund.nombre_legal} <span className="text-[#059669]"><Icon name="check" size="1.1em" /></span></h4>
                    <p className="text-[9px] text-[#64748b] truncate">
                      {fund.ciudad || 'Sin ciudad'} • <span className="text-[#005684] font-semibold">{fund.completadas}/{fund.publicadas} necesidades cubiertas</span>
                      {fund.rating !== null && <> • <Icon name="calificacion" size="1.1em" filled /> {fund.rating.toFixed(1)}</>}
                    </p>
                  </div>
                  <div className="text-right w-20 sm:w-24 shrink-0">
                    <p className="text-[10px] font-bold text-[#071d37] mb-1">{fund.cumplimiento}%</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fund.cumplimiento === 100 ? 'bg-[#059669]' : 'bg-[#0ea5e9]'}`} style={{ width: `${fund.cumplimiento}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto pt-5">
              {[
                ['Activas', m.activas, 'text-[#059669]'],
                ['Inactivas', m.inactivas, 'text-[#64748b]'],
                ['Rechazadas', m.rechazadas, 'text-[#dc2626]'],
              ].map(([t, v, c]) => (
                <div key={t as string} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2.5 text-center">
                  <p className={`text-lg font-black ${c}`}>{v}</p>
                  <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wide">{t}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mapa de voluntarios */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm flex flex-col">
            <div className="flex justify-between items-center gap-2 mb-1">
              <h3 className="text-[13px] font-bold text-[#071d37]">Mapa de Voluntarios</h3>
              <span className="text-[10px] font-bold text-[#059669] flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {m.volActivos} activos
              </span>
            </div>
            <p className="text-[10px] text-[#64748b] mb-4">Distribución por ciudad. Pulsa un punto para ver los voluntarios de esa zona.</p>

            <VolunteerMap voluntarios={voluntarios} />

            <div className="flex flex-col gap-2 mt-5">
              <h4 className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1">Especialidades activas</h4>
              {m.especialidades.length === 0 ? (
                <p className="text-[11px] text-[#94a3b8]">No hay voluntarios activos.</p>
              ) : m.especialidades.map(([esp, cant]) => (
                <div key={esp} className="flex justify-between items-center gap-3 text-[11px] border-b border-gray-100 pb-1 last:border-0">
                  <span className="text-[#475569] truncate">{esp}</span>
                  <span className="font-bold text-[#071d37] shrink-0">{cant} <span className="text-[9px] text-[#64748b] font-normal">activos</span></span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/admin-notificaciones')}
              className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-2.5 rounded-xl mt-4 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe] cursor-pointer print:hidden"
            >
              <span><Icon name="rapido" size="1.1em" /></span> Despachar Convocatoria Extraordinaria
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ categoria, icono, titulo, valor, extra, pieIzq, pieDer, titleAttr }: {
  categoria: string;
  icono: NombreIcono;
  titulo: string;
  valor: ReactNode;
  extra: string;
  pieIzq: string;
  pieDer: ReactNode;
  titleAttr?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between" title={titleAttr}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">{categoria}</p>
        <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg"><Icon name={icono} size={16} /></span>
      </div>
      <h3 className="text-sm font-bold text-[#64748b]">{titulo}</h3>
      <div className="flex flex-wrap items-end gap-x-2 mt-1 mb-3">
        <span className="text-3xl font-black text-[#071d37]">{valor}</span>
        <span className="text-[10px] text-[#059669] font-bold mb-1">{extra}</span>
      </div>
      <div className="flex justify-between items-center gap-2 text-[10px] pt-3 border-t border-gray-100">
        <span className="text-[#64748b]">{pieIzq}</span>
        <span className="text-right">{pieDer}</span>
      </div>
    </div>
  );
}
