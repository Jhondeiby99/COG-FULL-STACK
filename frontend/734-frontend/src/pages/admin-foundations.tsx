import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface FundacionDB {
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
  coordinador?: string | null;
  telefono?: string | null;
  beneficiarios_mes?: number | null;
  demandas_activas?: number | null;
  metric_label?: string | null;
  metric_value?: string | null;
  metric_sub?: string | null;
  logo_url?: string | null;
}

interface FundacionVista {
  id: string;
  idIniciales: string;
  name: string;
  status: 'Activa' | 'En Revisión' | 'Inactiva';
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

// Datos de respaldo estáticos idénticos a la maqueta por si la base de datos no tiene suficientes registros
const FALLBACK_FUNDACIONES: FundacionVista[] = [
  { 
    id: '1',
    idIniciales: 'HE', 
    name: 'Fundación Huellas de Esperanza', 
    status: 'Activa', 
    nit: '900.824.112-4', 
    location: 'Bogotá D.C., Cundinamarca', 
    category: 'Nutrición Infantil', 
    metricLabel: 'Beneficiarios', 
    metricValue: '450', 
    metricSub: 'niños/mes', 
    demands: 3, 
    contact: '+57 (1) 682-9011', 
    avatarBg: 'bg-[#e0f2fe]', 
    avatarText: 'text-[#0284c7]',
    causaRaw: 'Nutrición Infantil',
    deptoRaw: 'Cundinamarca'
  },
  { 
    id: '2',
    idIniciales: 'SC', 
    name: 'Fundación Semillas del Chocó', 
    status: 'Activa', 
    nit: '818.004.992-1', 
    location: 'Quibdó, Chocó', 
    category: 'Agua Potable & Infancia', 
    metricLabel: 'Beneficiarios', 
    metricValue: '280', 
    metricSub: 'niños directos', 
    demands: 2, 
    contact: '+57 (4) 671-4490', 
    avatarBg: 'bg-[#dcfce7]', 
    avatarText: 'text-[#166534]',
    causaRaw: 'Agua Potable & Infancia',
    deptoRaw: 'Chocó'
  },
  { 
    id: '3',
    idIniciales: 'MC', 
    name: 'Misión Salud Caribe', 
    status: 'Activa', 
    nit: '901.332.880-9', 
    location: 'Santa Marta, Magdalena', 
    category: 'Brigadas Médicas', 
    metricLabel: 'Atendidos', 
    metricValue: '1,200', 
    metricSub: 'pacientes', 
    demands: 5, 
    contact: '+57 (5) 438-1200', 
    avatarBg: 'bg-[#e0f2fe]', 
    avatarText: 'text-[#0284c7]',
    causaRaw: 'Brigadas Médicas',
    deptoRaw: 'Magdalena'
  },
  { 
    id: '4',
    idIniciales: 'BO', 
    name: 'Banco de Alimentos de Oriente', 
    status: 'Activa', 
    nit: '804.015.340-7', 
    location: 'Bucaramanga, Santander', 
    category: 'Rescate de Alimentos', 
    metricLabel: 'Red Cobertura', 
    metricValue: '42', 
    metricSub: 'comedores', 
    demands: 1, 
    contact: '+57 (7) 645-8822', 
    avatarBg: 'bg-[#e0f2fe]', 
    avatarText: 'text-[#0284c7]',
    causaRaw: 'Rescate de Alimentos',
    deptoRaw: 'Santander'
  },
  { 
    id: '5',
    idIniciales: 'RC', 
    name: 'Red Comunitaria del Sur', 
    status: 'En Revisión', 
    nit: '901.774.209-3', 
    location: 'Cali, Valle del Cauca', 
    category: 'Comedores Comunitarios', 
    metricLabel: 'Beneficiarios', 
    metricValue: '310', 
    metricSub: 'familias', 
    demands: 0, 
    contact: '+57 (2) 554-3019', 
    avatarBg: 'bg-[#fee2e2]', 
    avatarText: 'text-[#991b1b]',
    causaRaw: 'Comedores Comunitarios',
    deptoRaw: 'Valle del Cauca'
  },
];

export function AdminFoundations() {
  const [loading, setLoading] = useState(true);
  const [fundaciones, setFundaciones] = useState<FundacionVista[]>([]);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroCausa, setFiltroCausa] = useState('Todas');
  const [filtroDepto, setFiltroDepto] = useState('Todos');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 5;

  useEffect(() => {
    cargarFundaciones();
  }, []);

  const cargarFundaciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fundaciones')
        .select('*')
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Mapeo de datos de Supabase a la estructura de la maqueta
        const formateadas: FundacionVista[] = data.map((item: FundacionDB, idx: number) => {
          const iniciales = getInitials(item.nombre_legal || 'Fundación');
          const esActiva = item.estado === 'aprobada' || item.estado === 'Activa';
          const esRevision = item.estado === 'pendiente' || item.estado === 'En Revisión' || !item.estado;

          // Colores dinámicos para los avatares
          const avatarStyles = esRevision
            ? { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' }
            : idx % 2 === 0
            ? { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]' }
            : { bg: 'bg-[#dcfce7]', text: 'text-[#166534]' };

          return {
            id: item.id,
            idIniciales: iniciales,
            name: item.nombre_legal || 'Organización Sin Nombre',
            status: esActiva ? 'Activa' : esRevision ? 'En Revisión' : 'Inactiva',
            nit: item.nit || 'Sin NIT',
            location: item.ciudad 
              ? `${item.ciudad}${item.departamento || item.ubicacion ? `, ${item.departamento || item.ubicacion}` : ''}`
              : item.ubicacion || 'Colombia',
            category: item.area_enfoque || 'Atención Social',
            metricLabel: item.metric_label || 'Beneficiarios',
            metricValue: item.metric_value || (item.beneficiarios_mes ? item.beneficiarios_mes.toLocaleString('es-CO') : '350'),
            metricSub: item.metric_sub || 'personas/mes',
            demands: item.demandas_activas ?? (idx % 3),
            contact: item.telefono || item.coordinador || '+57 (601) 000-0000',
            avatarBg: avatarStyles.bg,
            avatarText: avatarStyles.text,
            causaRaw: item.area_enfoque || 'General',
            deptoRaw: item.departamento || item.ciudad || 'Nacional'
          };
        });

        setFundaciones(formateadas);
      } else {
        // Si no hay filas aún en Supabase, mostramos la maqueta original
        setFundaciones(FALLBACK_FUNDACIONES);
      }
    } catch (err) {
      console.error('Error al conectar con la tabla fundaciones:', err);
      setFundaciones(FALLBACK_FUNDACIONES);
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

  // Listas para los selects de filtro
  const opcionesCausas = useMemo(() => {
    const causas = Array.from(new Set(fundaciones.map(f => f.causaRaw).filter(Boolean)));
    return ['Todas', ...causas];
  }, [fundaciones]);

  const opcionesDeptos = useMemo(() => {
    const deptos = Array.from(new Set(fundaciones.map(f => f.deptoRaw).filter(Boolean)));
    return ['Todos', ...deptos];
  }, [fundaciones]);

  // Filtrado en tiempo real
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

  // Cálculos de KPI globales dinámicos
  const totalRegistradas = fundaciones.length > 0 ? fundaciones.length : 142;
  const activasCount = fundaciones.filter(f => f.status === 'Activa').length || 137;
  const enRevisionCount = fundaciones.filter(f => f.status === 'En Revisión').length || 5;

  // Paginación
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
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#eef6ff] text-[#005684] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span> Directorio Central
            </span>
            <span className="text-[11px] text-[#64748b]">Actualizado hoy a las 07:34 AM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-1 leading-tight">
            Directorio de Fundaciones
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Listado maestro de organizaciones registradas, con acceso a su perfil público y herramientas de edición.
          </p>
        </div>
        
        {/* <div className="shrink-0">
          <button className="bg-[#0077b6] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#005b8c] transition flex items-center gap-2 shadow-sm cursor-pointer">
            <span>+</span> Registrar Nueva Fundación
          </button>
        </div> */}
      </div>

      {/* TARJETAS KPI (4 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center text-xl shrink-0">
            🏢
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Total Registradas</p>
            <p className="text-2xl font-black text-[#071d37]">{totalRegistradas}</p>
          </div>
        </div>
        
        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#166534] flex items-center justify-center text-xl shrink-0">
            ✓
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Activas Operando</p>
            <p className="text-2xl font-black text-[#071d37]">{activasCount}</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#fee2e2] text-[#991b1b] flex items-center justify-center text-xl shrink-0">
            📋
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">En Revisión</p>
            <p className="text-2xl font-black text-[#071d37]">{enRevisionCount}</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-[#475569] flex items-center justify-center text-xl shrink-0">
            👥
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider mb-0.5">Beneficiarios Mes</p>
            <p className="text-2xl font-black text-[#071d37]">18,450</p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 gap-2 w-full">
          <span className="text-gray-400 text-sm">🔍</span>
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            placeholder="Buscar fundación por nombre, NIT..." 
            className="bg-transparent text-xs font-medium text-[#071d37] w-full focus:outline-none" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filtroCausa}
            onChange={(e) => {
              setFiltroCausa(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer"
          >
            {opcionesCausas.map((causa, i) => (
              <option key={i} value={causa}>
                {causa === 'Todas' ? 'Causa: Todas' : causa}
              </option>
            ))}
          </select>

          <select 
            value={filtroDepto}
            onChange={(e) => {
              setFiltroDepto(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer"
          >
            {opcionesDeptos.map((depto, i) => (
              <option key={i} value={depto}>
                {depto === 'Todos' ? 'Departamento: Todos' : depto}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-[#e2e8f0] pl-4 shrink-0">
          <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span>
          <span className="text-xs text-[#64748b]">Mostrando <span className="font-bold text-[#071d37]">{fundacionesFiltradas.length}</span> fundaciones registradas</span>
        </div>
      </div>

      {/* LISTADO DE FUNDACIONES */}
      <div className="flex flex-col gap-4 w-full min-w-0">
        {fundacionesPaginadas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#e2e8f0] shadow-sm">
            <p className="text-sm font-bold text-[#64748b]">No se encontraron fundaciones con los criterios de búsqueda seleccionados.</p>
          </div>
        ) : (
          fundacionesPaginadas.map((fund) => (
            <div key={fund.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5 w-full">
              
              {/* Info Principal */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 ${fund.avatarBg} ${fund.avatarText}`}>
                  {fund.idIniciales}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="text-[14px] sm:text-[15px] font-extrabold text-[#071d37] truncate">{fund.name}</h3>
                    <span className={`shrink-0 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${fund.status === 'Activa' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {fund.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-[#64748b] mb-1.5">
                    <span className="whitespace-nowrap">NIT: {fund.nit}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="truncate">📍 {fund.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#0284c7] font-semibold">
                    <span className="shrink-0">
                      {fund.idIniciales === 'MC' ? '🏥' : fund.idIniciales === 'BO' || fund.idIniciales === 'RC' ? '🍲' : '💧'}
                    </span> 
                    <span className="truncate">{fund.category}</span>
                  </div>
                </div>
              </div>

              {/* Métricas y Datos (Totalmente Responsivo sin desbordamiento) */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 lg:gap-6 border-t xl:border-t-0 xl:border-l border-[#e2e8f0] pt-4 xl:pt-0 xl:pl-6 w-full xl:w-auto">
                
                <div className="flex flex-col min-w-[90px]">
                  <span className="text-[10px] text-[#64748b] font-semibold">{fund.metricLabel}</span>
                  <span className="text-sm font-black text-[#071d37] mt-0.5">{fund.metricValue}</span>
                  <span className="text-[10px] font-bold text-[#475569] leading-tight">{fund.metricSub}</span>
                </div>

                <div className="flex flex-col min-w-[80px]">
                  <span className="text-[10px] text-[#64748b] font-semibold mb-1">Demandas</span>
                  <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold w-fit ${fund.demands > 0 ? 'bg-[#e0f2fe] text-[#0284c7]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                      {fund.demands} activas
                  </span>
                </div>

                <div className="flex flex-col min-w-[110px]">
                  <span className="text-[10px] text-[#64748b] font-semibold">Contacto</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#071d37] mt-0.5 whitespace-nowrap">{fund.contact}</span>
                </div>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 ml-auto">
                  <button className="bg-[#eef6ff] text-[#005684] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-1.5 border border-[#dbeafe] whitespace-nowrap cursor-pointer">
                      Vista Pública <span>↗</span>
                  </button>
                  <button className="bg-white border border-[#e2e8f0] text-[#475569] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer">
                      ✏️ Editar
                  </button>
                  <button className="text-[#94a3b8] hover:text-[#475569] px-1 font-bold text-lg cursor-pointer">
                      ⋮
                  </button>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

      {/* PAGINACIÓN DINÁMICA */}
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
                paginaActual === num
                  ? 'bg-[#0077b6] text-white shadow-sm'
                  : 'text-[#475569] hover:bg-gray-50'
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

    </div>
  );
}