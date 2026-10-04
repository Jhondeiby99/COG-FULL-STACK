import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  actualizarNecesidad,
  marcarNecesidadResuelta,
  porcentajeRecaudo,
  reabrirNecesidad,
  sincronizarNecesidadesResueltas,
} from '../lib/necesidades';
import type { Necesidad, PrioridadNecesidad } from '../lib/necesidades';

type FiltroEstado = 'todas' | 'abiertas' | 'resueltas';
type FiltroPrioridad = 'todas' | PrioridadNecesidad;

interface FormNecesidad {
  id: string | null;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: PrioridadNecesidad;
  meta_texto: string;
  porcentaje: number;
}

const FORM_VACIO: FormNecesidad = { id: null, titulo: '', descripcion: '', categoria: '', prioridad: 'media', meta_texto: '', porcentaje: 0 };
const CATEGORIAS = ['Alimentos', 'Salud', 'Educación', 'Vivienda', 'Ropa y abrigo', 'Logística', 'Voluntariado', 'Dinero', 'Otro'];

const PRIORIDAD: Record<PrioridadNecesidad, { label: string; chip: string; barra: string; borde: string }> = {
  alta: { label: 'Prioridad alta', chip: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]', barra: 'bg-[#ef4444]', borde: 'bg-[#ef4444]' },
  media: { label: 'Prioridad media', chip: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]', barra: 'bg-[#f59e0b]', borde: 'bg-[#f59e0b]' },
  baja: { label: 'Prioridad baja', chip: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]', barra: 'bg-[#3b82f6]', borde: 'bg-[#3b82f6]' },
};

const MAX_TITULO = 90;
const MAX_DESCRIPCION = 400;

export function ManageNeeds() {
  const { id } = useParams();
  const [fundacionId, setFundacionId] = useState<string | null>(null);
  const [nombreFundacion, setNombreFundacion] = useState('');
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('abiertas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todas');
  const [busqueda, setBusqueda] = useState('');

  const [form, setForm] = useState<FormNecesidad | null>(null);
  const [formOriginal, setFormOriginal] = useState<FormNecesidad | null>(null);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ tipo: 'resolver' | 'reabrir' | 'eliminar'; nec: Necesidad } | null>(null);
  const [modal, setModal] = useState<{ title: string; message: string; isError: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const cargar = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const objetivo = id || session?.user?.id;
      if (!objetivo) throw new Error('No se encontró la fundación a gestionar.');

      const [fund, nec] = await Promise.all([
        supabase.from('fundaciones').select('id, nombre_legal, sigla').eq('id', objetivo).maybeSingle(),
        supabase.from('necesidades').select('*').eq('fundacion_id', objetivo).order('created_at', { ascending: false }),
      ]);
      if (fund.error) throw fund.error;
      if (nec.error) throw nec.error;
      if (!fund.data) throw new Error('La fundación no existe o no tienes acceso a ella.');

      setFundacionId(fund.data.id);
      setNombreFundacion(fund.data.sigla || fund.data.nombre_legal);
      setNecesidades((nec.data || []) as Necesidad[]);
      setErrorCarga(null);
    } catch (e) {
      const err = e as { message?: string };
      setErrorCarga(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ===== Métricas =====
  const resumen = useMemo(() => {
    const resueltas = necesidades.filter(n => n.completada).length;
    const abiertas = necesidades.filter(n => !n.completada);
    const recaudoPromedio = abiertas.length
      ? Math.round(abiertas.reduce((acc, n) => acc + porcentajeRecaudo(n), 0) / abiertas.length)
      : 0;
    return {
      total: necesidades.length,
      abiertas: abiertas.length,
      resueltas,
      urgentes: abiertas.filter(n => n.prioridad === 'alta').length,
      recaudoPromedio,
      cumplimiento: necesidades.length ? Math.round((resueltas / necesidades.length) * 100) : 0,
    };
  }, [necesidades]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const orden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    return necesidades
      .filter(n => filtroEstado === 'todas' || (filtroEstado === 'resueltas' ? n.completada : !n.completada))
      .filter(n => filtroPrioridad === 'todas' || (n.prioridad || 'media') === filtroPrioridad)
      .filter(n => !q || [n.titulo, n.descripcion, n.categoria, n.meta_texto].some(t => t?.toLowerCase().includes(q)))
      .sort((a, b) =>
        Number(!!a.completada) - Number(!!b.completada) ||
        orden[a.prioridad || 'media'] - orden[b.prioridad || 'media'] ||
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [necesidades, filtroEstado, filtroPrioridad, busqueda]);

  // ===== Formulario =====
  const abrirFormulario = (nec?: Necesidad) => {
    const valores: FormNecesidad = nec
      ? {
          id: nec.id,
          titulo: nec.titulo || '',
          descripcion: nec.descripcion || '',
          categoria: nec.categoria || '',
          prioridad: (nec.prioridad as PrioridadNecesidad) || 'media',
          meta_texto: nec.meta_texto || '',
          porcentaje: porcentajeRecaudo(nec),
        }
      : FORM_VACIO;
    setForm(valores);
    setFormOriginal(valores);
    setIntentoGuardar(false);
  };

  const errorTitulo = form && form.titulo.trim().length < 4 ? 'Escribe un título de al menos 4 caracteres.' : null;
  const sinCambios = !!form && !!formOriginal && JSON.stringify(form) === JSON.stringify(formOriginal);

  const guardarFormulario = async () => {
    if (!form || !fundacionId) return;
    setIntentoGuardar(true);
    if (errorTitulo || (form.id && sinCambios)) return;
    setGuardando(true);
    const datos = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria || null,
      prioridad: form.prioridad,
      meta_texto: form.meta_texto.trim() || null,
      porcentaje_recaudado: form.porcentaje,
    };
    try {
      if (form.id) {
        const actualizada = await actualizarNecesidad(form.id, datos);
        setNecesidades(prev => prev.map(n => (n.id === form.id ? actualizada : n)));
        mostrarToast('Necesidad actualizada');
      } else {
        const { data, error } = await supabase
          .from('necesidades')
          .insert([{ ...datos, fundacion_id: fundacionId, completada: false }])
          .select();
        if (error) throw error;
        if (!data?.length) throw new Error('No tienes permisos para publicar necesidades en esta fundación.');
        setNecesidades(prev => [data[0] as Necesidad, ...prev]);
        setFiltroEstado(f => (f === 'resueltas' ? 'abiertas' : f));
        mostrarToast('Necesidad publicada en el perfil');
      }
      setForm(null);
    } catch (e) {
      const err = e as { message?: string };
      setModal({ title: 'No se pudo guardar', message: err.message || 'Error de conexión.', isError: true });
    } finally {
      setGuardando(false);
    }
  };

  // ===== Acciones confirmadas =====
  const ejecutarConfirmacion = async () => {
    if (!confirmacion || !fundacionId) return;
    const { tipo, nec } = confirmacion;
    setGuardando(true);
    try {
      if (tipo === 'resolver') {
        const act = await marcarNecesidadResuelta(nec.id, fundacionId);
        setNecesidades(prev => prev.map(n => (n.id === nec.id ? act : n)));
        mostrarToast('Necesidad marcada como resuelta');
      } else if (tipo === 'reabrir') {
        const act = await reabrirNecesidad(nec.id, fundacionId);
        setNecesidades(prev => prev.map(n => (n.id === nec.id ? act : n)));
        mostrarToast('Necesidad reabierta');
      } else {
        const { data, error } = await supabase.from('necesidades').delete().eq('id', nec.id).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('No tienes permisos para eliminar esta necesidad.');
        setNecesidades(prev => prev.filter(n => n.id !== nec.id));
        await sincronizarNecesidadesResueltas(fundacionId);
        mostrarToast('Necesidad eliminada');
      }
      setConfirmacion(null);
    } catch (e) {
      const err = e as { message?: string };
      setConfirmacion(null);
      setModal({ title: 'No se pudo completar la acción', message: err.message || 'Error de conexión.', isError: true });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#005684]">Cargando necesidades...</p>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] shadow-sm max-w-md w-full text-center flex flex-col items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-[#071d37]">No se pudieron cargar las necesidades</h2>
          <p className="text-xs text-[#64748b]">{errorCarga}</p>
          <button type="button" onClick={() => { setLoading(true); cargar(); }} className="bg-[#005684] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const textoConfirmacion = confirmacion && {
    resolver: { icono: '✅', titulo: 'Marcar como resuelta', msg: 'La necesidad se mostrará como resuelta (100%) en tu perfil público y dejará de recibir apoyos.', boton: 'Sí, marcar resuelta', color: 'bg-[#059669] hover:bg-[#047857]' },
    reabrir: { icono: '↩️', titulo: 'Reabrir necesidad', msg: 'La necesidad volverá a mostrarse como abierta en tu perfil público.', boton: 'Sí, reabrir', color: 'bg-[#005684] hover:bg-[#00456a]' },
    eliminar: { icono: '🗑️', titulo: 'Eliminar necesidad', msg: 'Se eliminará definitivamente y dejará de mostrarse en tu perfil. Esta acción no se puede deshacer.', boton: 'Sí, eliminar', color: 'bg-[#dc2626] hover:bg-[#b91c1c]' },
  }[confirmacion.tipo];

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7]">
          <span className="text-lg">✓</span>
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <Link to={`/dashboard/fundacion/editar/${fundacionId}`} className="text-[11px] font-bold text-[#64748b] hover:text-[#005684] transition">
            ← Volver a editar perfil
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-2 leading-tight">Gestionar Necesidades</h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Publica, actualiza el avance de recaudo y marca como resueltas las necesidades de <span className="font-bold text-[#071d37]">{nombreFundacion}</span>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link to={`/fundacion/${fundacionId}`} className="bg-white border border-[#e2e8f0] text-[#071d37] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition text-center shadow-sm">
            👁️ Ver perfil público
          </Link>
          <button type="button" onClick={() => abrirFormulario()} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer">
            + Nueva necesidad
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { t: 'Abiertas', v: resumen.abiertas, s: `${resumen.urgentes} de prioridad alta`, c: 'text-[#071d37]', i: '📌' },
          { t: 'Resueltas', v: resumen.resueltas, s: `${resumen.cumplimiento}% de cumplimiento`, c: 'text-[#059669]', i: '✅' },
          { t: 'Recaudo promedio', v: `${resumen.recaudoPromedio}%`, s: 'de las necesidades abiertas', c: 'text-[#0284c7]', i: '📈' },
          { t: 'Publicadas', v: resumen.total, s: 'en total', c: 'text-[#071d37]', i: '🗂️' },
        ].map(k => (
          <div key={k.t} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">{k.t}</p>
              <span className="text-sm">{k.i}</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${k.c}`}>{k.v}</p>
            <p className="text-[10px] text-[#64748b] mt-1">{k.s}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex bg-[#f1f5f9] rounded-xl p-1 text-[11px] font-bold w-full md:w-auto">
          {([['abiertas', `Abiertas (${resumen.abiertas})`], ['resueltas', `Resueltas (${resumen.resueltas})`], ['todas', 'Todas']] as [FiltroEstado, string][]).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setFiltroEstado(v)} className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${filtroEstado === v ? 'bg-white text-[#005684] shadow-sm' : 'text-[#64748b] hover:text-[#071d37]'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value as FiltroPrioridad)} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#005684] cursor-pointer">
            <option value="todas">Todas las prioridades</option>
            <option value="alta">Prioridad alta</option>
            <option value="media">Prioridad media</option>
            <option value="baja">Prioridad baja</option>
          </select>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar necesidad..." className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#334155] focus:outline-none focus:border-[#005684] sm:w-56" />
        </div>
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-[#cbd5e1] text-center flex flex-col items-center gap-3">
          <span className="text-4xl">{necesidades.length === 0 ? '📋' : '🔍'}</span>
          <p className="text-sm font-bold text-[#071d37]">
            {necesidades.length === 0 ? 'Aún no has publicado necesidades' : 'No hay necesidades con estos filtros'}
          </p>
          <p className="text-xs text-[#64748b] max-w-sm">
            {necesidades.length === 0
              ? 'Publica lo que tu fundación necesita para que voluntarios y donantes puedan apoyarte.'
              : 'Prueba cambiando el estado, la prioridad o la búsqueda.'}
          </p>
          {necesidades.length === 0 && (
            <button type="button" onClick={() => abrirFormulario()} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer mt-1">
              + Publicar la primera necesidad
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map(nec => {
            const p = PRIORIDAD[(nec.prioridad as PrioridadNecesidad) || 'media'];
            const pct = porcentajeRecaudo(nec);
            const resuelta = !!nec.completada;
            return (
              <article key={nec.id} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-3 transition hover:shadow-md ${resuelta ? 'border-[#bbf7d0]' : 'border-[#e2e8f0]'}`}>
                <span className={`absolute inset-x-0 top-0 h-1 ${resuelta ? 'bg-[#10b981]' : p.borde}`} />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${resuelta ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' : p.chip}`}>
                    {resuelta ? '✓ Resuelta' : p.label}
                  </span>
                  <span className="text-[10px] font-semibold text-[#94a3b8]">
                    {resuelta && nec.fecha_resolucion
                      ? new Date(nec.fecha_resolucion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                      : nec.created_at ? new Date(nec.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-[15px] font-extrabold text-[#071d37] leading-snug break-words">{nec.titulo}</h3>
                  {nec.descripcion && <p className="text-xs text-[#64748b] mt-1 leading-relaxed line-clamp-3">{nec.descripcion}</p>}
                </div>

                <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-xl p-3 mt-auto">
                  <div className="flex justify-between text-[11px] font-bold text-[#475569] mb-2 gap-2">
                    <span className="truncate">{nec.categoria || 'General'}</span>
                    <span className={resuelta ? 'text-[#059669]' : 'text-[#071d37]'}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${resuelta ? 'bg-[#10b981]' : p.barra}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-2 text-right truncate">{nec.meta_texto || 'Sin meta especificada'}</p>
                </div>

                <div className="flex gap-2">
                  {resuelta ? (
                    <button type="button" onClick={() => setConfirmacion({ tipo: 'reabrir', nec })} className="flex-1 bg-white border border-[#e2e8f0] text-[#334155] py-2 rounded-xl text-[11px] font-bold hover:bg-gray-50 transition cursor-pointer">
                      ↩ Reabrir
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => setConfirmacion({ tipo: 'resolver', nec })} className="flex-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] py-2 rounded-xl text-[11px] font-bold hover:bg-[#bbf7d0] transition cursor-pointer">
                        ✓ Resuelta
                      </button>
                      <button type="button" onClick={() => abrirFormulario(nec)} className="flex-1 bg-[#eef6ff] text-[#005684] border border-[#dbeafe] py-2 rounded-xl text-[11px] font-bold hover:bg-[#d4e7fe] transition cursor-pointer">
                        ✏️ Editar
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => setConfirmacion({ tipo: 'eliminar', nec })} aria-label="Eliminar necesidad" className="w-10 shrink-0 bg-white border border-[#fecaca] text-[#dc2626] rounded-xl text-sm hover:bg-[#fef2f2] transition cursor-pointer">
                    🗑
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Formulario crear / editar */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e2e8f0] flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-extrabold text-[#071d37]">{form.id ? 'Editar necesidad' : 'Nueva necesidad'}</h3>
              <button type="button" onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer">✕</button>
            </div>

            <div className="px-6 pb-2 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-[#071d37]">Título *</label>
                  <span className="text-[10px] text-[#94a3b8]">{form.titulo.length}/{MAX_TITULO}</span>
                </div>
                <input type="text" value={form.titulo} maxLength={MAX_TITULO} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Mercados para 40 familias" className={`w-full bg-[#f8fafc] border rounded-xl px-4 py-2.5 text-sm text-[#071d37] focus:outline-none focus:ring-1 ${intentoGuardar && errorTitulo ? 'border-[#fca5a5] focus:ring-[#dc2626]' : 'border-[#e2e8f0] focus:border-[#005684] focus:ring-[#005684]'}`} />
                {intentoGuardar && errorTitulo && <p className="text-[11px] text-[#dc2626]">{errorTitulo}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-[#071d37]">Descripción</label>
                  <span className="text-[10px] text-[#94a3b8]">{form.descripcion.length}/{MAX_DESCRIPCION}</span>
                </div>
                <textarea rows={3} value={form.descripcion} maxLength={MAX_DESCRIPCION} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Explica para qué es y cómo se puede ayudar." className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#071d37] resize-none focus:outline-none focus:border-[#005684] focus:ring-1 focus:ring-[#005684]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#071d37]">Categoría</label>
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-[#071d37] focus:outline-none focus:border-[#005684] cursor-pointer">
                    <option value="">General</option>
                    {[...new Set([...CATEGORIAS, ...(form.categoria ? [form.categoria] : [])])].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#071d37]">Meta</label>
                  <input type="text" value={form.meta_texto} maxLength={80} onChange={(e) => setForm({ ...form, meta_texto: e.target.value })} placeholder="Ej: 40 mercados" className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#071d37] focus:outline-none focus:border-[#005684] focus:ring-1 focus:ring-[#005684]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#071d37]">Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['alta', 'media', 'baja'] as PrioridadNecesidad[]).map(pr => (
                    <button key={pr} type="button" onClick={() => setForm({ ...form, prioridad: pr })} className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${form.prioridad === pr ? PRIORIDAD[pr].chip + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'}`}>
                      {pr.charAt(0).toUpperCase() + pr.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#071d37]">Avance de recaudo</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={100} value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))) })} className="w-16 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2 py-1 text-xs font-bold text-right text-[#071d37] focus:outline-none focus:border-[#005684]" />
                    <span className="text-xs font-bold text-[#64748b]">%</span>
                  </div>
                </div>
                <input type="range" min={0} max={100} step={5} value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: Number(e.target.value) })} className="w-full accent-[#005684] cursor-pointer" />
                <p className="text-[10px] text-[#94a3b8]">
                  Indica cuánto de la meta ya se ha cubierto. Para cerrarla al 100% usa “Marcar como resuelta”.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-5 border-t border-[#f1f5f9] mt-2">
              <button type="button" onClick={() => setForm(null)} disabled={guardando} className="bg-gray-100 text-[#334155] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={guardarFormulario} disabled={guardando || (!!form.id && sinCambios)} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {guardando ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Publicar necesidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación */}
      {confirmacion && textoConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3">{textoConfirmacion.icono}</span>
            <h3 className="text-lg font-bold text-[#071d37] mb-1">{textoConfirmacion.titulo}</h3>
            <p className="text-xs font-bold text-[#334155] mb-2 break-words">“{confirmacion.nec.titulo}”</p>
            <p className="text-xs text-[#64748b] mb-6">{textoConfirmacion.msg}</p>
            <div className="flex w-full gap-3">
              <button type="button" onClick={() => setConfirmacion(null)} disabled={guardando} className="flex-1 bg-gray-100 text-[#334155] py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={ejecutarConfirmacion} disabled={guardando} className={`flex-1 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60 ${textoConfirmacion.color}`}>
                {guardando ? 'Procesando...' : textoConfirmacion.boton}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3">{modal.isError ? '⚠️' : '✅'}</span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">{modal.title}</h3>
            <p className="text-xs text-[#64748b] mb-6">{modal.message}</p>
            <button type="button" onClick={() => setModal(null)} className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
