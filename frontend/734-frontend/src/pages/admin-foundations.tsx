import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { Icon } from '../components/Icon';
interface FundacionDB {
  familias_acompanadas?: number | null;
  telefono_whatsapp?: string | null;
  id: string;
  nombre_legal?: string | null;
  nit: string;
  ciudad?: string | null;
  ubicacion?: string | null;
  departamento?: string | null;
  direccion_fisica?: string | null;
  area_enfoque?: string | null;
  estado?: string | null;
  fecha_solicitud?: string | null;
  telefono?: string | null;
  logo_url?: string | null;
}

interface FundacionVista {
  id: string;
  idIniciales: string;
  name: string;
  status: 'Activa' | 'En Revisión' | 'Inactiva' | 'Rechazada';
  nit: string;
  location: string;
  category: string;
  metricLabel: string;
  metricValue: string;
  metricSub: string;
  demands: number;
  contact: string;
  avatarBg: string;
  avatarText: string;
  causaRaw: string;
  deptoRaw: string;
}

export function AdminFoundations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [fundaciones, setFundaciones] = useState<FundacionVista[]>([]);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroCausa, setFiltroCausa] = useState('Todas');
  const [filtroDepto, setFiltroDepto] = useState('Todos');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 5;

  // Menú de tres puntos por ID
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuAbiertoId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    cargarFundaciones();
  }, []);

  const cargarFundaciones = async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: necesidades }] = await Promise.all([
        supabase.from('fundaciones').select('*'),
        supabase.from('necesidades').select('fundacion_id').eq('completada', false),
      ]);

      if (error) throw error;
      // Necesidades abiertas reales por fundación
      const abiertas: Record<string, number> = {};
      (necesidades || []).forEach(n => { abiertas[n.fundacion_id] = (abiertas[n.fundacion_id] || 0) + 1; });

      if (data && data.length > 0) {
        const formateadas: FundacionVista[] = data.map((item: FundacionDB, idx: number) => {
          const iniciales = getInitials(item.nombre_legal || 'Fundación');
          const estadoBd = item.estado?.toLowerCase() || 'activa';
          
          let statusLabel: FundacionVista['status'] = 'Activa';
          if (estadoBd === 'inactiva' || estadoBd === 'inactivo') statusLabel = 'Inactiva';
          else if (estadoBd === 'pendiente' || estadoBd === 'en revisión') statusLabel = 'En Revisión';
          else if (estadoBd === 'rechazada') statusLabel = 'Rechazada';

          const avatarStyles = statusLabel === 'Inactiva' || statusLabel === 'Rechazada'
            ? { bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]' }
            : statusLabel === 'En Revisión'
            ? { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' }
            : idx % 2 === 0
            ? { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]' }
            : { bg: 'bg-[#dcfce7]', text: 'text-[#166534]' };

          return {
            id: item.id,
            idIniciales: iniciales,
            name: item.nombre_legal || 'Organización Sin Nombre',
            status: statusLabel,
            nit: item.nit || 'Sin NIT',
            location: item.ciudad 
              ? `${item.ciudad}${item.departamento || item.ubicacion ? `, ${item.departamento || item.ubicacion}` : ''}`
              : item.ubicacion || 'Colombia',
            category: item.area_enfoque || 'Atención Social',
            metricLabel: 'Familias',
            metricValue: (item.familias_acompanadas ?? 0).toLocaleString('es-CO'),
            metricSub: 'acompañadas',
            demands: abiertas[item.id] || 0,
            contact: item.telefono || item.telefono_whatsapp || 'Sin teléfono',
            avatarBg: avatarStyles.bg,
            avatarText: avatarStyles.text,
            causaRaw: item.area_enfoque || 'General',
            deptoRaw: item.departamento || item.ciudad || 'Nacional'
          };
        });

        setFundaciones(formateadas);
      } else {
        setFundaciones([]);
      }
      setErrorCarga(null);
    } catch (err) {
      console.error('Error al conectar con la tabla fundaciones:', err);
      setFundaciones([]);
      setErrorCarga('No se pudieron cargar las fundaciones. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'FN';
    const words = name.trim().split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ACCIÓN DE INACTIVAR / ACTIVAR EN BASE DE DATOS Y FRONTEND
  const handleToggleInactivar = async (fundacion: FundacionVista) => {
    const nuevoEstado = fundacion.status === 'Inactiva' ? 'aprobada' : 'inactiva';
    const nuevoEstadoLabel: 'Activa' | 'Inactiva' = nuevoEstado === 'aprobada' ? 'Activa' : 'Inactiva';

    try {
      const { data, error } = await supabase
        .from('fundaciones')
        .update({ estado: nuevoEstado })
        .eq('id', fundacion.id)
        .select();

      if (error) {
        setErrorModal({ title: 'No se pudo actualizar', message: 'Error al actualizar el estado: ' + error.message });
        return;
      }

      if (!data || data.length === 0) {
        setErrorModal({ title: 'No se pudo actualizar', message: 'No se pudo actualizar el registro. Verifica los permisos RLS en la tabla fundaciones.' });
        return;
      }

      // Actualizar estado local
      setFundaciones(prev => prev.map(f => f.id === fundacion.id ? { ...f, status: nuevoEstadoLabel } : f));
      setMenuAbiertoId(null);
    } catch (e) {
      console.error('Error de red:', e);
      setErrorModal({ title: 'Error de conexión', message: 'No se pudo contactar al servidor. Intenta de nuevo.' });
    }
  };

  const opcionesCausas = useMemo(() => {
    const causas = Array.from(new Set(fundaciones.map(f => f.causaRaw).filter(Boolean)));
    return ['Todas', ...causas];
  }, [fundaciones]);

  const opcionesDeptos = useMemo(() => {
    const deptos = Array.from(new Set(fundaciones.map(f => f.deptoRaw).filter(Boolean)));
    return ['Todos', ...deptos];
  }, [fundaciones]);

  const fundacionesFiltradas = useMemo(() => {
    return fundaciones.filter(fund => {
      const cumpleBusqueda = 
        fund.name.toLowerCase().includes(busqueda.toLowerCase()) ||
        fund.nit.toLowerCase().includes(busqueda.toLowerCase()) ||
        fund.location.toLowerCase().includes(busqueda.toLowerCase());
      
      const cumpleCausa = filtroCausa === 'Todas' || fund.causaRaw === filtroCausa;
      const cumpleDepto = filtroDepto === 'Todos' || fund.deptoRaw === filtroDepto;

      return cumpleBusqueda && cumpleCausa && cumpleDepto;
    });
  }, [fundaciones, busqueda, filtroCausa, filtroDepto]);

  const totalRegistradas = fundaciones.length;
  const activasCount = fundaciones.filter(f => f.status === 'Activa').length;
  const enRevisionCount = fundaciones.filter(f => f.status === 'En Revisión').length;

  const totalPaginas = Math.ceil(fundacionesFiltradas.length / itemsPorPagina) || 1;
  const fundacionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return fundacionesFiltradas.slice(inicio, inicio + itemsPorPagina);
  }, [fundacionesFiltradas, paginaActual]);

  if (loading) {
    return (
      <div className="p-12 text-center text-[#005684] font-bold flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Sincronizando directorio con la base de datos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#eef6ff] text-[#005684] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span> Directorio Central
            </span>
            <span className="text-[11px] text-[#64748b]">Actualizado hoy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-1 leading-tight">
            Directorio de Fundaciones
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Listado maestro de organizaciones registradas, con acceso a su perfil público y herramientas de edición e inactivación.
          </p>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center text-xl shrink-0"><Icon name="fundacion" size="1.1em" /></div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Total Registradas</p>
            <p className="text-2xl font-black text-[#071d37]">{totalRegistradas}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#166534] flex items-center justify-center text-xl shrink-0"><Icon name="check" size="1.1em" /></div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Activas Operando</p>
            <p className="text-2xl font-black text-[#071d37]">{activasCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#fee2e2] text-[#991b1b] flex items-center justify-center text-xl shrink-0"><Icon name="necesidad" size="1.1em" /></div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">En Revisión</p>
            <p className="text-2xl font-black text-[#071d37]">{enRevisionCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-[#475569] flex items-center justify-center text-xl shrink-0"><Icon name="voluntarios" size="1.1em" /></div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Red Consolidada</p>
            <p className="text-2xl font-black text-[#071d37]">{totalRegistradas} Entidades</p>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 gap-2 w-full">
          <span className="text-gray-400 text-sm"><Icon name="buscar" size="1.1em" /></span>
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            placeholder="Buscar fundación por nombre, NIT..." 
            className="bg-transparent text-xs font-medium text-[#071d37] w-full focus:outline-none" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filtroCausa}
            onChange={(e) => { setFiltroCausa(e.target.value); setPaginaActual(1); }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer"
          >
            {opcionesCausas.map((causa, i) => (
              <option key={i} value={causa}>{causa === 'Todas' ? 'Causa: Todas' : causa}</option>
            ))}
          </select>

          <select 
            value={filtroDepto}
            onChange={(e) => { setFiltroDepto(e.target.value); setPaginaActual(1); }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer"
          >
            {opcionesDeptos.map((depto, i) => (
              <option key={i} value={depto}>{depto === 'Todos' ? 'Departamento: Todos' : depto}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTADO */}
      <div className="flex flex-col gap-4 w-full min-w-0">
        {errorCarga ? (
          <div className="bg-white rounded-2xl border border-[#fecaca] p-8 text-center flex flex-col items-center gap-3">
            <Icon name="advertencia" size={32} className="text-[#dc2626]" />
            <p className="text-sm font-bold text-[#071d37]">{errorCarga}</p>
            <button type="button" onClick={cargarFundaciones} className="bg-[#005684] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">Reintentar</button>
          </div>
        ) : fundacionesPaginadas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#e2e8f0] shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">No se encontraron fundaciones con los criterios seleccionados.</p>
          </div>
        ) : (
          fundacionesPaginadas.map((fund) => (
            <div key={fund.id} className={`bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5 w-full transition ${fund.status === 'Inactiva' ? 'opacity-70 bg-gray-50' : ''}`}>
              
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 ${fund.avatarBg} ${fund.avatarText}`}>
                  {fund.idIniciales}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <h3 className={`text-[14px] sm:text-[15px] font-extrabold truncate ${fund.status === 'Inactiva' ? 'text-gray-500 line-through' : 'text-[#071d37]'}`}>{fund.name}</h3>
                    <span className={`shrink-0 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${fund.status === 'Activa' ? 'bg-[#dcfce7] text-[#166534]' : fund.status === 'En Revisión' ? 'bg-[#fffbeb] text-[#b45309]' : fund.status === 'Rechazada' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-gray-200 text-gray-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {fund.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-[#64748b] mb-1.5">
                    <span className="whitespace-nowrap">NIT: {fund.nit}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="truncate"><Icon name="ubicacion" className="text-[#006194]" size="1.1em" /> {fund.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#0284c7] font-semibold">
                    <span><Icon name="fundacion" size="1.1em" /></span> <span className="truncate">{fund.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 lg:gap-6 border-t xl:border-t-0 xl:border-l border-[#e2e8f0] pt-4 xl:pt-0 xl:pl-6 w-full xl:w-auto">
                <div className="flex flex-col min-w-[90px]">
                  <span className="text-[10px] text-[#64748b] font-semibold">{fund.metricLabel}</span>
                  <span className="text-sm font-black text-[#071d37] mt-0.5">{fund.metricValue}</span>
                  <span className="text-[10px] font-bold text-[#475569] leading-tight">{fund.metricSub}</span>
                </div>

                <div className="flex flex-col min-w-[80px]">
                  <span className="text-[10px] text-[#64748b] font-semibold mb-1">Demandas</span>
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold w-fit bg-[#e0f2fe] text-[#0284c7]">
                      {fund.demands} abierta{fund.demands === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 ml-auto relative">
                  <button 
                    onClick={() => navigate(`/fundacion/${fund.id}`)}
                    className="bg-[#eef6ff] text-[#005684] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-1.5 border border-[#dbeafe] whitespace-nowrap cursor-pointer"
                  >
                      Vista <span><Icon name="externo" size="1.1em" /></span>
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/fundacion/editar/${fund.id}`)}
                    className="bg-white border border-[#e2e8f0] text-[#475569] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                      <Icon name="editar" size="1.1em" /> Editar
                  </button>

                  {/* MENÚ DE TRES PUNTOS (INACTIVAR / ACTIVAR) */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === fund.id ? null : fund.id); }}
                      className="text-[#94a3b8] hover:text-[#475569] px-2 font-bold text-lg cursor-pointer flex items-center justify-center h-full"
                    >
                        ⋮
                    </button>
                    
                    {menuAbiertoId === fund.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-2 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider bg-[#f8fafc] border-b border-[#e2e8f0]">
                          Opciones Institucionales
                        </div>
                        {fund.status === 'Activa' || fund.status === 'Inactiva' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleInactivar(fund); }}
                            className="w-full text-left px-4 py-3 text-xs font-bold transition hover:bg-gray-50 flex items-center gap-2 text-[#475569]"
                          >
                            {fund.status === 'Inactiva' ? (
                              <><span className="text-[#10b981] text-lg leading-none">●</span> Activar Fundación</>
                            ) : (
                              <><span className="text-[#ef4444] text-lg leading-none">●</span> Inactivar Fundación</>
                            )}
                          </button>
                        ) : (
                          // Las pendientes y rechazadas se gestionan desde la revisión de documentos
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(null); navigate('/dashboard/admin-aprobaciones'); }}
                            className="w-full text-left px-4 py-3 text-xs font-bold transition hover:bg-gray-50 flex items-center gap-2 text-[#475569]"
                          >
                            <Icon name="auditoria" size="1.1em" /> Revisar solicitud
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(null); navigate(`/dashboard/fundacion/necesidades/${fund.id}`); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold transition hover:bg-gray-50 flex items-center gap-2 text-[#475569] border-t border-[#f1f5f9]"
                        >
                          <span><Icon name="necesidad" size="1.1em" /></span> Gestionar necesidades
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 mb-6 gap-4">
        <span className="text-xs text-[#64748b] font-medium">
          Mostrando <span className="font-bold text-[#071d37]">
            {fundacionesFiltradas.length > 0 ? (paginaActual - 1) * itemsPorPagina + 1 : 0} - {Math.min(paginaActual * itemsPorPagina, fundacionesFiltradas.length)}
          </span> de <span className="font-bold text-[#071d37]">{fundacionesFiltradas.length}</span> fundaciones
        </span>

        <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            &lt;
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPaginaActual(num)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition ${
                paginaActual === num ? 'bg-[#0077b6] text-white shadow-sm' : 'text-[#475569] hover:bg-gray-50'
              }`}
            >
              {num}
            </button>
          ))}

          <button 
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas || totalPaginas === 0}
            className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            &gt;
          </button>
        </div>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3 text-red-500"><Icon name="advertencia" size="1.1em" /></span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">{errorModal.title}</h3>
            <p className="text-xs text-[#64748b] mb-6">{errorModal.message}</p>
            <button onClick={() => setErrorModal(null)} className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}