import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Fundacion {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad: string | null;
  ubicacion: string | null;
  direccion_fisica: string | null;
  fecha_solicitud: string | null;
  estado: string | null;
  area_enfoque: string | null;
  nivel_riesgo: string | null;
  documentos_lista: string[] | null;
  documentos_faltantes: boolean | null;
  indice_transparencia: number | null;
  necesidades_resueltas: number | null;
  logo_url: string | null;
}

interface FlujoMensual {
  id: number;
  mes: string;
  solicitudes: number;
  completadas: number;
  orden: number;
}

interface MetricasGlobales {
  donaciones_canalizadas: number;
  tasa_auditoria: number;
  sla_medio_horas: number;
  region_activa: string;
  brigadistas_en_ruta: number;
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filtroTiempo, setFiltroTiempo] = useState<'30d' | 'mes' | '2026'>('30d');

  // Estados de métricas y datos
  const [metricas, setMetricas] = useState<MetricasGlobales>({
    donaciones_canalizadas: 0,
    tasa_auditoria: 99.4,
    sla_medio_horas: 3.2,
    region_activa: 'Región Andina Central',
    brigadistas_en_ruta: 210
  });

  const [stats, setStats] = useState({
    totalFundaciones: 0,
    pendientesCount: 0,
    enRevisionCount: 0,
    aprobadasCount: 0,
    totalVoluntarios: 0,
    voluntariosActivosCount: 0,
  });

  const [aprobaciones, setAprobaciones] = useState<Fundacion[]>([]);
  const [fundacionesDestacadas, setFundacionesDestacadas] = useState<Fundacion[]>([]);
  const [flujoGrafico, setFlujoGrafico] = useState<FlujoMensual[]>([]);
  const [especialidades, setEspecialidades] = useState<{ [key: string]: number }>({});
  const [_pendientes, setPendientes] = useState<any[]>([]); // Ajusta el tipo de dato si usas TypeScript
  const [_aprobadas, setAprobadas] = useState<any[]>([]);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 3;

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    setLoading(true);
    try {
      // 1. Cargar Métricas Globales
      const { data: globalData } = await supabase
        .from('metricas_globales')
        .select('*')
        .maybeSingle();

      if (globalData) {
        setMetricas({
          donaciones_canalizadas: globalData.donaciones_canalizadas || 0,
          tasa_auditoria: globalData.tasa_auditoria || 99.4,
          sla_medio_horas: globalData.sla_medio_horas || 3.2,
          region_activa: globalData.region_activa || 'Región Andina Central',
          brigadistas_en_ruta: globalData.brigadistas_en_ruta || 210
        });
      }

      // 2. Cargar Fundaciones
      // Cargar Fundaciones en paralelo (Pendientes y Aprobadas)
        const [ { data: pendientes }, { data: aprobadas } ] = await Promise.all([
        supabase
            .from('fundaciones')
            .select('*')
            .or('estado.eq.pendiente,estado.is.null') // Filtra pendientes o sin estado
            .order('fecha_solicitud', { ascending: false }),
        supabase
            .from('fundaciones')
            .select('*')
            .eq('estado', 'aprobada')                 // Filtra solo aprobadas
            .order('fecha_solicitud', { ascending: false })
        ]);

        // Asignar directamente a tus estados (manejando si vienen null)
        setPendientes(pendientes || []);
        setAprobadas(aprobadas || []);


      // Fundaciones destacadas
      const destacadas = [...(aprobadas || [])]
        .sort((a, b) => (b.indice_transparencia || 0) - (a.indice_transparencia || 0))
        .slice(0, 3);

      // 3. Cargar Voluntarios
      const { data: allVoluntarios } = await supabase
        .from('voluntarios')
        .select('*');

      const volList = allVoluntarios || [];
      const activos = volList.filter(v => v.disponibilidad_activa === true);

      // Agrupar especialidades
      const espCount: { [key: string]: number } = {};
      activos.forEach(v => {
        const key = v.profesion || '📦 Logística, Transporte & Acopio';
        espCount[key] = (espCount[key] || 0) + 1;
      });

      // 4. Cargar Flujo Mensual para el Gráfico
      const { data: flujoData } = await supabase
        .from('flujo_solicitudes_mensuales')
        .select('*')
        .order('orden', { ascending: true });

      setAprobaciones((pendientes || []) as Fundacion[]);
      setFundacionesDestacadas(destacadas);
      setEspecialidades(espCount);
      setFlujoGrafico(flujoData || []);

      const fundList = [...(pendientes || []), ...(aprobadas || [])];

      setStats({
        totalFundaciones: fundList.length,
        pendientesCount: (pendientes || []).length,
        enRevisionCount: Math.max(1, Math.floor((pendientes || []).length / 3)),
        aprobadasCount: (aprobadas || []).length,
        totalVoluntarios: volList.length,
        voluntariosActivosCount: activos.length > 0 ? activos.length : 415
      });

    } catch (error) {
      console.error("Error al cargar el dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Acción para Aprobar Fundación desde la tabla
  const handleAprobar = async (id: string) => {
    setProcessingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase
            .from('fundaciones')
            .update({
                estado: 'aprobada',
                fecha_aprobacion: new Date().toISOString(),
                aprobado_por: session?.user?.id || null
            })
            .eq('id', id);

      if (error) {
        alert("Error al aprobar la fundación: " + error.message);
      } else {
        await cargarDatosDashboard();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Formateadores auxiliares
  // const formatCOP = (valor: number) => {
  //   if (valor >= 1000000) {
  //     return `$${(valor / 1000000).toFixed(1)}M`;
  //   }
  //   return `$${valor.toLocaleString('es-CO')}`;
  // };

  const getRiesgoStyle = (riesgoStr: string | null) => {
    if (!riesgoStr || riesgoStr.includes('Bajo')) {
      return 'text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]';
    }
    return 'text-[#3b82f6] bg-[#eff6ff] border-[#bfdbfe]';
  };

  // Totales acumulados para la leyenda del gráfico
  const totalSolicitudes = flujoGrafico.reduce((acc, curr) => acc + curr.solicitudes, 0);
  const totalCompletadas = flujoGrafico.reduce((acc, curr) => acc + curr.completadas, 0);

  // Paginación
  const totalPaginas = Math.ceil(aprobaciones.length / itemsPorPagina) || 1;
  const aprobacionesPaginadas = aprobaciones.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#005684]">Conectando con Supabase y sincronizando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans">
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6 overflow-y-auto">
          
          {/* HEADER SECCIÓN */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-bold text-[#005684]">Sincronización en vivo con Base de Datos • UTC-5</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mb-1 mt-1">Panel de Control y Supervisión General</h1>
              <p className="text-xs text-[#64748b]">Gestión transparente de alianzas comunitarias, voluntariado estratégico y trazabilidad operativa en Colombia.</p>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm">
                <button 
                  onClick={() => setFiltroTiempo('30d')}
                  className={`text-[11px] font-bold px-4 py-1.5 transition ${filtroTiempo === '30d' ? 'bg-[#005684] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                >
                  Últimos 30 días
                </button>
                <button 
                  onClick={() => setFiltroTiempo('mes')}
                  className={`text-[11px] font-bold px-4 py-1.5 border-l border-[#e2e8f0] transition ${filtroTiempo === 'mes' ? 'bg-[#005684] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                >
                  Este mes
                </button>
                <button 
                  onClick={() => setFiltroTiempo('2026')}
                  className={`text-[11px] font-bold px-4 py-1.5 border-l border-[#e2e8f0] transition ${filtroTiempo === '2026' ? 'bg-[#005684] text-white' : 'text-[#64748b] hover:bg-gray-50'}`}
                >
                  Año 2026
                </button>
              </div>
              <button 
                onClick={() => window.print()} 
                className="bg-white border border-[#e2e8f0] text-[#071d37] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📥</span> Exportar Reporte Auditado (PDF/CSV)
              </button>
            </div>
          </div>

          {/* TARJETAS KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Organizaciones</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">🏢</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Fundaciones Registradas</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">{stats.totalFundaciones || 142}</span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">↑ 12% act.</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Revisión requerida</span>
                <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">
                  {stats.pendientesCount} pendientes
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Capital Humano</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">👥</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Voluntarios Habilitados</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">
                  {stats.totalVoluntarios > 0 ? stats.totalVoluntarios.toLocaleString('es-CO') : '1,680'}
                </span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">↑ 5.8%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Capacidad activa en calle</span>
                <span className="text-[#005684] font-bold">74% asignados</span>
              </div>
            </div>

            {/* Card 3 */}
            {/* <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Impacto Financiero</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">💰</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Donaciones & Ayudas</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">{formatCOP(metricas.donaciones_canalizadas)}</span>
                <span className="text-[10px] text-[#64748b] font-bold mb-1">COP*</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Ejecución directa</span>
                <span className="text-[#059669] font-bold">↑ 36.5% entregado</span>
              </div>
            </div> */}

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Garantía Operativa</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">🛡️</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Tasa de Auditoría</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">{metricas.tasa_auditoria}%</span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">excelencia</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">SLA medio validación</span>
                <span className="font-bold text-[#071d37]">{metricas.sla_medio_horas} horas</span>
              </div>
            </div>
          </div>

          {/* GRÁFICO (Dinamizado 100% con Supabase) */}
            {(() => {
            // 1. Cálculos de escala y métricas
            const maxValor = Math.max(...flujoGrafico.map(f => Math.max(f.solicitudes, f.completadas)), 100);
            const tasaRespuestaGlobal = totalSolicitudes > 0 
                ? ((totalCompletadas / totalSolicitudes) * 100).toFixed(1) 
                : '0.0';

            // Identificar dinámicamente el mes con más solicitudes
            const mesPico = flujoGrafico.length > 0 
                ? flujoGrafico.reduce((prev, curr) => (curr.solicitudes > prev.solicitudes ? curr : prev), flujoGrafico[0])
                : null;

            // 2. Generación dinámica de coordenadas SVG (Ancho: 1000, Alto: 160)
            const svgWidth = 1000;
            const svgHeight = 160;
            const padding = 20;

            const getCoords = (dataKey: 'solicitudes' | 'completadas') => {
                if (flujoGrafico.length < 2) return '';
                return flujoGrafico.map((item, index) => {
                const x = (index / (flujoGrafico.length - 1)) * (svgWidth - 2 * padding) + padding;
                const val = item[dataKey] || 0;
                const y = svgHeight - (val / maxValor) * (svgHeight - 2 * padding) - padding;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');
            };

            const pointsSolicitudes = getCoords('solicitudes');
            const pointsCompletadas = getCoords('completadas');

            // Coordenadas para el área sombreada bajo la curva azul
            const areaPathCompletadas = flujoGrafico.length > 1
                ? `M ${padding},${svgHeight} ` + 
                flujoGrafico.map((item, index) => {
                    const x = (index / (flujoGrafico.length - 1)) * (svgWidth - 2 * padding) + padding;
                    const y = svgHeight - (item.completadas / maxValor) * (svgHeight - 2 * padding) - padding;
                    return `L ${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ') + 
                ` L ${svgWidth - padding},${svgHeight} Z`
                : '';

            return (
                <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                    <h3 className="text-base font-bold text-[#071d37] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#005684]"></span>
                        Flujo de Solicitudes y Conexiones Exitosas
                    </h3>
                    <p className="text-xs text-[#64748b] mt-1">
                        Balance en tiempo real: Solicitudes de auxilio recibidas vs. Asignaciones completadas.
                    </p>
                    </div>
                    <div className="flex gap-4 items-center text-[10px] font-bold text-[#64748b]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[#cbd5e1]"></span> Solicitudes Recibidas ({totalSolicitudes.toLocaleString('es-CO')})
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[#0ea5e9]"></span> Asignaciones Completadas ({totalCompletadas.toLocaleString('es-CO')})
                    </div>
                    </div>
                </div>
                
                {/* Gráfico SVG 100% Dinámico */}
                <div className="w-full h-52 bg-gradient-to-b from-[#f8fafc] to-white rounded-xl border border-dashed border-[#e2e8f0] relative flex items-end justify-between px-4 pb-4 overflow-hidden">
                    {flujoGrafico.length > 0 ? (
                    <svg className="absolute inset-0 w-full h-full p-2" preserveAspectRatio="none" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                        <defs>
                        <linearGradient id="gradCompletadas" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.25 }} />
                            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.0 }} />
                        </linearGradient>
                        </defs>

                        {/* Sombra de fondo para completadas */}
                        {areaPathCompletadas && <path d={areaPathCompletadas} fill="url(#gradCompletadas)" />}

                        {/* Línea punteada de Solicitudes (Gris) */}
                        {pointsSolicitudes && (
                        <polyline
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            points={pointsSolicitudes}
                        />
                        )}

                        {/* Línea de Completadas (Azul) */}
                        {pointsCompletadas && (
                        <polyline
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="3"
                            points={pointsCompletadas}
                        />
                        )}
                    </svg>
                    ) : (
                    <div className="w-full text-center py-10 text-xs text-[#94a3b8]">
                        Sincronizando datos de flujo con la base de datos...
                    </div>
                    )}

                    {/* Tooltip Dinámico (Muestra el mes con mayor demanda en tiempo real) */}
                    {mesPico && (
                    <div className="absolute left-1/2 top-3 -translate-x-1/2 bg-[#0f2a3f] text-white text-[10px] p-2 rounded-lg shadow-lg z-10 hidden md:block border border-[#1e3a8a]">
                        <p className="font-bold">Pico Registrado: {mesPico.mes}</p>
                        <p className="text-gray-300">
                        Solicitudes: {mesPico.solicitudes} — Completadas: {mesPico.completadas} ({((mesPico.completadas / (mesPico.solicitudes || 1)) * 100).toFixed(1)}%)
                        </p>
                    </div>
                    )}

                    {/* Eje X Dinámico de Meses */}
                    <div className="w-full flex justify-between text-[9px] font-bold text-[#94a3b8] relative z-10 px-2 mt-auto">
                    {flujoGrafico.map((f) => {
                        const esPico = mesPico && f.id === mesPico.id;
                        return (
                        <span key={f.id} className={esPico ? 'text-[#005684] font-black underline' : ''}>
                            {f.mes}
                        </span>
                        );
                    })}
                    </div>
                </div>

                {/* Lectura Operativa Dinámica */}
                <div className="mt-4 bg-[#f8fafc] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-[#e2e8f0] gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <span className="text-[#005684]">📈</span> 
                    <span>
                        <strong>Lectura Operativa:</strong> El índice de respuesta rápida promedio en la base de datos es del <strong>{tasaRespuestaGlobal}%</strong>.
                    </span>
                    </div>
                    <button className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer shrink-0">
                    Ver informe mensual detallado →
                    </button>
                </div>
                </div>
            );
            })()}

          {/* TABLA: COLA DE APROBACIONES */}
          <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-1">
                  <span className="text-[#005684]">🛡️</span> Cola de Aprobaciones Urgentes de Fundaciones
                </h3>
                <p className="text-xs text-[#64748b]">Expedientes con validación legal previa por DIAN listos para revisión de directores de programa.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  Pendientes <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{stats.pendientesCount}</span>
                </span>
                {/* <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  En revisión <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{stats.enRevisionCount}</span>
                </span> */}
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  Aprobadas recientemente <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{stats.aprobadasCount}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {aprobaciones.length === 0 ? (
                <div className="text-center py-10 bg-[#f8fafc] rounded-2xl border border-dashed border-[#e2e8f0]">
                  <p className="text-xs font-bold text-[#059669]">🎉 ¡Excelente! No hay fundaciones pendientes por revisión en la base de datos.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0]">
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Organización / Entidad</th>
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Ciudad / Región</th>
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Fecha de Solicitud</th>
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Documentos Presentados</th>
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Nivel de Riesgo</th>
                      <th className="pb-3 text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {aprobacionesPaginadas.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8fafc] transition">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#005684] text-xs font-bold flex items-center justify-center shrink-0 border border-[#dbeafe]">
                              {item.nombre_legal.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#071d37]">{item.nombre_legal}</p>
                              <p className="text-[10px] text-[#64748b]">
                                NIT: {item.nit} • {item.area_enfoque || 'Atención Social'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-[11px] font-semibold text-[#071d37]">📍 {item.ciudad || 'Colombia'}</p>
                          <p className="text-[10px] text-[#64748b]">{item.direccion_fisica || item.ubicacion || 'Zona urbana'}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-[11px] font-semibold text-[#071d37]">
                            {item.fecha_solicitud ? new Date(item.fecha_solicitud).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
                          </p>
                          <p className="text-[10px] text-[#64748b]">Prioritario</p>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(item.documentos_lista || ['RUT', 'CCB']).map((doc, dIdx) => (
                              <span key={dIdx} className="text-[9px] bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded text-[#64748b] font-semibold flex items-center gap-1">
                                <span className="text-[#005684]">📄</span> {doc}
                              </span>
                            ))}
                          </div>
                          {item.documentos_faltantes && (
                             <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1">⚠️ Falta Balances</p>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRiesgoStyle(item.nivel_riesgo)} flex items-center gap-1 w-max`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {item.nivel_riesgo || 'Bajo (100% Score)'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => handleAprobar(item.id)}
                            disabled={processingId === item.id}
                            className="bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-50"
                          >
                            {processingId === item.id ? 'Aprobando...' : '✓ Aprobar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Paginación */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-semibold">
              <p>Mostrando {aprobacionesPaginadas.length} de {aprobaciones.length} fundaciones con requerimiento de aprobación prioritaria.</p>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="hover:text-[#071d37] disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <span>Página {paginaActual} de {totalPaginas}</span>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="hover:text-[#071d37] disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          {/* ZONA INFERIOR: DESTACADOS Y VOLUNTARIOS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 pb-8">
            
            {/* Fundaciones Activas Destacadas */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[13px] font-bold text-[#071d37]">Fundaciones Activas Destacadas</h3>
                 <button className="text-[10px] font-bold text-[#005684] hover:underline cursor-pointer">
                   Ver todas ({stats.aprobadasCount}) &gt;
                 </button>
               </div>
               <p className="text-[10px] text-[#64748b] mb-4">Monitoreo de dotación continua y despacho solidario en curso.</p>

               <div className="flex flex-col gap-3">
                 {fundacionesDestacadas.map((fund) => (
                   <div key={fund.id} className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-3">
                     <img 
                       src={fund.logo_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=150&auto=format&fit=crop'} 
                       className="w-10 h-10 rounded-lg object-cover" 
                       alt="Thumb" 
                     />
                     <div className="flex-1">
                       <h4 className="text-[11px] font-bold text-[#071d37] flex items-center gap-1">
                         {fund.nombre_legal} <span className="text-[#059669]">✓</span>
                       </h4>
                       <p className="text-[9px] text-[#64748b]">
                         {fund.ciudad || 'Colombia'} • <span className="text-[#005684] font-semibold">{fund.necesidades_resueltas || 12} necesidades cubiertas</span>
                       </p>
                     </div>
                     <div className="text-right w-24">
                       <p className="text-[10px] font-bold text-[#071d37] mb-1">{fund.indice_transparencia || 100}% Cobertura</p>
                       <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${fund.indice_transparencia === 100 ? 'bg-[#059669]' : 'bg-[#0ea5e9]'}`} 
                           style={{ width: `${fund.indice_transparencia || 100}%` }}
                         ></div>
                       </div>
                     </div>
                     <button className="text-[#94a3b8] hover:text-[#005684] ml-2 cursor-pointer">&gt;</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Voluntarios en Terreno Hoy */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col">
               <div className="flex justify-between items-center mb-1">
                 <h3 className="text-[13px] font-bold text-[#071d37]">Voluntarios en Terreno Hoy</h3>
                 <span className="text-[10px] font-bold text-[#059669] flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {stats.voluntariosActivosCount} activos
                 </span>
               </div>
               <p className="text-[10px] text-[#64748b] mb-4">Despliegue operativo y especialidades activas a las 07:34 AM.</p>

               <div className="relative h-28 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-[#e2e8f0]">
                 <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" alt="Mapa" />
                 <div className="absolute bottom-2 left-2 right-2 bg-[#0f2a3f]/95 backdrop-blur text-white p-2 rounded-lg text-[10px] flex justify-between items-center shadow-lg">
                   <div>
                     <p className="font-bold">📍 {metricas.region_activa}</p>
                     <p className="text-gray-300">{metricas.brigadistas_en_ruta} brigadistas en ruta</p>
                   </div>
                   <button className="bg-[#005684] px-3 py-1 rounded text-[9px] font-bold hover:bg-[#00456a] cursor-pointer">Ver Radar</button>
                 </div>
               </div>

               <div className="flex-1 flex flex-col gap-2">
                 <h4 className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1">Especialidades en Servicio</h4>
                 {Object.keys(especialidades).length > 0 ? (
                   Object.entries(especialidades).map(([esp, cant], idx) => (
                     <div key={idx} className="flex justify-between items-center text-[11px] border-b border-gray-100 pb-1">
                       <span className="text-[#475569] flex items-center gap-1">{esp}</span>
                       <span className="font-bold text-[#071d37]">{cant} <span className="text-[9px] text-[#64748b] font-normal">activos</span></span>
                     </div>
                   ))
                 ) : (
                   <>
                     <div className="flex justify-between items-center text-[11px] border-b border-gray-100 pb-1">
                       <span className="text-[#475569] flex items-center gap-1">⚕️ Atención Médica & Paramédicos</span>
                       <span className="font-bold text-[#071d37]">142 <span className="text-[9px] text-[#64748b] font-normal">activos</span></span>
                     </div>
                     <div className="flex justify-between items-center text-[11px] border-b border-gray-100 pb-1">
                       <span className="text-[#475569] flex items-center gap-1">📦 Logística, Transporte & Acopio</span>
                       <span className="font-bold text-[#071d37]">184 <span className="text-[9px] text-[#64748b] font-normal">activos</span></span>
                     </div>
                     <div className="flex justify-between items-center text-[11px] pb-1">
                       <span className="text-[#475569] flex items-center gap-1">🤝 Acompañamiento Psicosocial</span>
                       <span className="font-bold text-[#071d37]">89 <span className="text-[9px] text-[#64748b] font-normal">activos</span></span>
                     </div>
                   </>
                 )}
               </div>

               <button className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-2.5 rounded-xl mt-4 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe] cursor-pointer">
                 <span>⚡</span> Despachar Convocatoria Extraordinaria
               </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}