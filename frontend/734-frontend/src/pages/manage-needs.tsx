import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  marcarNecesidadResuelta,
  porcentajeRecaudo,
  reabrirNecesidad,
  sincronizarNecesidadesResueltas,
  PRIORIDAD_ESTILOS,
} from '../lib/necesidades';
import type { Necesidad, PrioridadNecesidad } from '../lib/necesidades';
import { NeedFormModal } from '../components/NeedFormModal';

import { Icon } from '../components/Icon';
type FiltroEstado = 'todas' | 'abiertas' | 'resueltas';
type FiltroPrioridad = 'todas' | PrioridadNecesidad;

interface FundacionOpcion {
  id: string;
  nombre: string;
  estado: string | null;
}

/**
 * Gestión de necesidades.
 * - Fundación: sus propias necesidades.
 * - Administrador: las de una fundación (con selector para cambiar) o, con `global`, las de todas.
 */
export function ManageNeeds({ global = false }: { global?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [esAdmin, setEsAdmin] = useState(false);
  const [fundaciones, setFundaciones] = useState<FundacionOpcion[]>([]);
  const [filtroFundacion, setFiltroFundacion] = useState('todas');
  const [fundacionId, setFundacionId] = useState<string | null>(null);
  const [nombreFundacion, setNombreFundacion] = useState('');
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('abiertas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todas');
  const [busqueda, setBusqueda] = useState('');

  const [formNec, setFormNec] = useState<{ necesidad: Necesidad | null } | null>(null);
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
      const uid = session?.user?.id;
      const { data: perfil } = uid
        ? await supabase.from('perfiles').select('rol').eq('id', uid).maybeSingle()
        : { data: null };
      const admin = perfil?.rol === 'administrador';
      setEsAdmin(admin);

      if (admin) {
        const { data: lista, error: errLista } = await supabase
          .from('fundaciones')
          .select('id, nombre_legal, sigla, estado')
          .order('nombre_legal');
        if (errLista) throw errLista;
        setFundaciones((lista || []).map(f => ({ id: f.id, nombre: f.sigla || f.nombre_legal, estado: f.estado })));
      }

      if (global) {
        if (!admin) throw new Error('Esta vista es exclusiva para administradores.');
        const { data, error } = await supabase.from('necesidades').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setFundacionId(null);
        setNombreFundacion('');
        setNecesidades((data || []) as Necesidad[]);
        setErrorCarga(null);
        return;
      }

      const objetivo = id || uid;
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
  }, [id, global]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga/sincronización con Supabase al montar o al cambiar el parámetro
    cargar();
  }, [cargar]);

  const nombrePorId = useMemo(() => new Map(fundaciones.map(f => [f.id, f.nombre])), [fundaciones]);
  const base = useMemo(
    () => (global && filtroFundacion !== 'todas' ? necesidades.filter(n => n.fundacion_id === filtroFundacion) : necesidades),
    [necesidades, global, filtroFundacion]
  );
  // Fundación "activa" para crear: la de la ruta o la filtrada en la vista global
  const fundacionDestino = global ? (filtroFundacion !== 'todas' ? filtroFundacion : null) : fundacionId;

  // ===== Métricas =====
  const resumen = useMemo(() => {
    const necesidades = base;
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
  }, [base]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const orden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    return base
      .filter(n => filtroEstado === 'todas' || (filtroEstado === 'resueltas' ? n.completada : !n.completada))
      .filter(n => filtroPrioridad === 'todas' || (n.prioridad || 'media') === filtroPrioridad)
      .filter(n => !q || [n.titulo, n.descripcion, n.categoria, n.meta_texto, nombrePorId.get(n.fundacion_id || '')].some(t => t?.toLowerCase().includes(q)))
      .sort((a, b) =>
        Number(!!a.completada) - Number(!!b.completada) ||
        orden[a.prioridad || 'media'] - orden[b.prioridad || 'media'] ||
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [base, filtroEstado, filtroPrioridad, busqueda, nombrePorId]);

  // ===== Formulario (componente compartido) =====
  const abrirFormulario = (nec?: Necesidad) => setFormNec({ necesidad: nec ?? null });

  const alGuardar = (nec: Necesidad, esNueva: boolean) => {
    setFormNec(null);
    if (esNueva) {
      setNecesidades(prev => [nec, ...prev]);
      setFiltroEstado(f => (f === 'resueltas' ? 'abiertas' : f));
      mostrarToast('Necesidad publicada en el perfil');
    } else {
      setNecesidades(prev => prev.map(n => (n.id === nec.id ? nec : n)));
      mostrarToast('Necesidad actualizada');
    }
  };

  // ===== Acciones confirmadas =====
  const ejecutarConfirmacion = async () => {
    if (!confirmacion) return;
    const { tipo, nec } = confirmacion;
    const fundacionNec = nec.fundacion_id || fundacionId;
    if (!fundacionNec) return;
    setGuardando(true);
    try {
      if (tipo === 'resolver') {
        const act = await marcarNecesidadResuelta(nec.id, fundacionNec);
        setNecesidades(prev => prev.map(n => (n.id === nec.id ? act : n)));
        mostrarToast('Necesidad marcada como resuelta');
      } else if (tipo === 'reabrir') {
        const act = await reabrirNecesidad(nec.id, fundacionNec);
        setNecesidades(prev => prev.map(n => (n.id === nec.id ? act : n)));
        mostrarToast('Necesidad reabierta');
      } else {
        const { data, error } = await supabase.from('necesidades').delete().eq('id', nec.id).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('No tienes permisos para eliminar esta necesidad.');
        setNecesidades(prev => prev.filter(n => n.id !== nec.id));
        await sincronizarNecesidadesResueltas(fundacionNec);
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
          <span className="text-4xl"><Icon name="advertencia" size="1.1em" /></span>
          <h2 className="text-lg font-bold text-[#071d37]">No se pudieron cargar las necesidades</h2>
          <p className="text-xs text-[#64748b]">{errorCarga}</p>
          <button type="button" onClick={() => { setLoading(true); cargar(); }} className="bg-[#005684] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const perfilTxt = esAdmin ? 'el perfil público de la fundación' : 'tu perfil público';
  const textoConfirmacion = confirmacion && {
    resolver: { icono: 'completado' as const, titulo: 'Marcar como resuelta', msg: `La necesidad se mostrará como resuelta (100%) en ${perfilTxt} y dejará de recibir apoyos.`, boton: 'Sí, marcar resuelta', color: 'bg-[#059669] hover:bg-[#047857]' },
    reabrir: { icono: 'deshacer' as const, titulo: 'Reabrir necesidad', msg: `La necesidad volverá a mostrarse como abierta en ${perfilTxt}.`, boton: 'Sí, reabrir', color: 'bg-[#005684] hover:bg-[#00456a]' },
    eliminar: { icono: 'eliminar' as const, titulo: 'Eliminar necesidad', msg: `Se eliminará definitivamente y dejará de mostrarse en ${perfilTxt}. Esta acción no se puede deshacer.`, boton: 'Sí, eliminar', color: 'bg-[#dc2626] hover:bg-[#b91c1c]' },
  }[confirmacion.tipo];

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7]">
          <span className="text-lg"><Icon name="check" size="1.1em" /></span>
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          {global ? (
            <Link to="/dashboard/admin-dashboard" className="text-[11px] font-bold text-[#64748b] hover:text-[#005684] transition">← Volver al panel</Link>
          ) : (
            <Link to={`/dashboard/fundacion/editar/${fundacionId}`} className="text-[11px] font-bold text-[#64748b] hover:text-[#005684] transition">← Volver a editar perfil</Link>
          )}
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] leading-tight">
              {global ? 'Necesidades de las Fundaciones' : 'Gestionar Necesidades'}
            </h1>
            {esAdmin && <span className="bg-[#eef2ff] text-[#4f46e5] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Admin</span>}
          </div>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            {global
              ? 'Supervisa, publica y actualiza las necesidades de todas las fundaciones de la plataforma.'
              : <>Publica, actualiza el avance de recaudo y marca como resueltas las necesidades de <span className="font-bold text-[#071d37]">{nombreFundacion}</span>.</>}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {(fundacionDestino) && (
            <Link to={`/fundacion/${fundacionDestino}`} className="bg-white border border-[#e2e8f0] text-[#071d37] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition text-center shadow-sm">
              <Icon name="ver" size="1.1em" /> Ver perfil público
            </Link>
          )}
          <button type="button" onClick={() => abrirFormulario()} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer">
            + Nueva necesidad
          </button>
        </div>
      </div>

      {/* Administrador dentro de una fundación: cambiar rápidamente de fundación */}
      {esAdmin && !global && (
        <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#3730a3]">
            <span className="font-bold">Modo administrador:</span> los cambios se reflejan en el perfil público de la fundación.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={fundacionId || ''}
              onChange={(e) => e.target.value && navigate(`/dashboard/fundacion/necesidades/${e.target.value}`)}
              aria-label="Cambiar de fundación"
              className="bg-white border border-[#c7d2fe] rounded-xl px-3 py-2 text-xs font-semibold text-[#3730a3] focus:outline-none cursor-pointer max-w-full sm:max-w-[240px]"
            >
              {fundaciones.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
            <Link to="/dashboard/admin-necesidades" className="text-xs font-bold text-[#4f46e5] hover:underline whitespace-nowrap text-center">
              Ver todas →
            </Link>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { t: 'Abiertas', v: resumen.abiertas, s: `${resumen.urgentes} de prioridad alta`, c: 'text-[#071d37]', i: 'fijado' as const },
          { t: 'Resueltas', v: resumen.resueltas, s: `${resumen.cumplimiento}% de cumplimiento`, c: 'text-[#059669]', i: 'completado' as const },
          { t: 'Recaudo promedio', v: `${resumen.recaudoPromedio}%`, s: 'de las necesidades abiertas', c: 'text-[#0284c7]', i: 'trayectoria' as const },
          { t: 'Publicadas', v: resumen.total, s: 'en total', c: 'text-[#071d37]', i: 'expedientes' as const },
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
          {global && (
            <select value={filtroFundacion} onChange={(e) => setFiltroFundacion(e.target.value)} aria-label="Filtrar por fundación" className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#005684] cursor-pointer sm:max-w-[220px]">
              <option value="todas">Todas las fundaciones</option>
              {fundaciones.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}{f.estado && f.estado !== 'aprobada' ? ` (${f.estado})` : ''}</option>
              ))}
            </select>
          )}
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
          <span className="text-[#94a3b8]"><Icon name={base.length === 0 ? 'necesidad' : 'buscar'} size={40} /></span>
          <p className="text-sm font-bold text-[#071d37]">
            {base.length === 0
              ? (esAdmin ? 'No hay necesidades publicadas' : 'Aún no has publicado necesidades')
              : 'No hay necesidades con estos filtros'}
          </p>
          <p className="text-xs text-[#64748b] max-w-sm">
            {base.length === 0
              ? (esAdmin ? 'Puedes publicar una en nombre de la fundación.' : 'Publica lo que tu fundación necesita para que voluntarios y donantes puedan apoyarte.')
              : 'Prueba cambiando el estado, la prioridad o la búsqueda.'}
          </p>
          {base.length === 0 && (
            <button type="button" onClick={() => abrirFormulario()} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer mt-1">
              + Publicar la primera necesidad
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map(nec => {
            const p = PRIORIDAD_ESTILOS[(nec.prioridad as PrioridadNecesidad) || 'media'];
            const pct = porcentajeRecaudo(nec);
            const resuelta = !!nec.completada;
            return (
              <article key={nec.id} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-3 transition hover:shadow-md ${resuelta ? 'border-[#bbf7d0]' : 'border-[#e2e8f0]'}`}>
                <span className={`absolute inset-x-0 top-0 h-1 ${resuelta ? 'bg-[#10b981]' : p.barra}`} />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${resuelta ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' : p.chip}`}>
                    {resuelta ? <><Icon name="check" size={11} /> Resuelta</> : p.label}
                  </span>
                  <span className="text-[10px] font-semibold text-[#94a3b8]">
                    {resuelta && nec.fecha_resolucion
                      ? new Date(nec.fecha_resolucion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                      : nec.created_at ? new Date(nec.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>

                {global && (
                  <button
                    type="button"
                    onClick={() => setFiltroFundacion(nec.fundacion_id || 'todas')}
                    title="Ver solo esta fundación"
                    className="text-[11px] font-bold text-[#005684] hover:underline w-fit text-left truncate max-w-full cursor-pointer -mb-1"
                  >
                    <Icon name="institucion" size="1.1em" /> {nombrePorId.get(nec.fundacion_id || '') || 'Fundación'}
                  </button>
                )}
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
                      <Icon name="deshacer" size="1.1em" /> Reabrir
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => setConfirmacion({ tipo: 'resolver', nec })} className="flex-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] py-2 rounded-xl text-[11px] font-bold hover:bg-[#bbf7d0] transition cursor-pointer">
                        <Icon name="check" size="1.1em" /> Resuelta
                      </button>
                      <button type="button" onClick={() => abrirFormulario(nec)} className="flex-1 bg-[#eef6ff] text-[#005684] border border-[#dbeafe] py-2 rounded-xl text-[11px] font-bold hover:bg-[#d4e7fe] transition cursor-pointer">
                        <Icon name="editar" size="1.1em" /> Editar
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => setConfirmacion({ tipo: 'eliminar', nec })} aria-label="Eliminar necesidad" className="w-10 shrink-0 bg-white border border-[#fecaca] text-[#dc2626] rounded-xl text-sm hover:bg-[#fef2f2] transition cursor-pointer">
                    <Icon name="eliminar" size="1.1em" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formNec && (fundacionDestino || global) && (
        <NeedFormModal
          fundacionId={fundacionDestino}
          opcionesFundacion={global ? fundaciones.map(f => ({ id: f.id, nombre: f.nombre })) : undefined}
          necesidad={formNec.necesidad}
          onClose={() => setFormNec(null)}
          onSaved={alGuardar}
        />
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
            <span className="text-4xl mb-3"><Icon name={modal.isError ? 'advertencia' : 'completado'} size={40} className={modal.isError ? 'text-[#dc2626]' : 'text-[#059669]'} /></span>
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
