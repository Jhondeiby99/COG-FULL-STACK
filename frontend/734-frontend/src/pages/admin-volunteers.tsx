import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DialogModal } from '../components/DialogModal';

export interface Voluntario {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  certification: string;
  location: string;
  hours: string;
  activity: string;
  status: string;
  disponibilidad_activa: boolean;
  franjas_horarias: any;
  statusBg?: string;
  statusText?: string;
  dotColor?: string;
}

const MOCK_VOLUNTARIOS: Voluntario[] = [
  {
    id: '1',
    name: 'Dra. Camila Restrepo Uribe',
    avatar: 'https://i.pravatar.cc/150?img=47',
    specialty: 'Médica Pediatra',
    certification: 'ReTHUS Activo',
    location: 'Medellín, Antioquia',
    hours: '142 h donadas en campo',
    activity: 'Última guardia: Ayer',
    status: 'Disponible (Con Franjas)',
    disponibilidad_activa: true,
    franjas_horarias: { manana: { lun: true, mar: true } },
    statusBg: 'bg-[#dcfce7]',
    statusText: 'text-[#166534]',
    dotColor: 'bg-[#16a34a]'
  },
  {
    id: '2',
    name: 'Ing. Mateo Restrepo Gómez',
    avatar: 'https://i.pravatar.cc/150?img=11',
    specialty: 'Ingeniería Estructural',
    certification: 'Matrícula COPNIA',
    location: 'Bogotá D.C.',
    hours: '88 h donadas en campo',
    activity: 'Módulo Hábitat',
    status: 'Disponible (Con Franjas)',
    disponibilidad_activa: true,
    franjas_horarias: { tarde: { sab: true, dom: true } },
    statusBg: 'bg-[#e0e7ff]',
    statusText: 'text-[#3730a3]',
    dotColor: 'bg-[#4f46e5]'
  },
  {
    id: '3',
    name: 'Julián Osorio Morales',
    avatar: 'https://i.pravatar.cc/150?img=12',
    specialty: 'Logística & Paramédico',
    certification: 'Acreditación APH',
    location: 'Cali, Valle',
    hours: '210 h donadas en campo',
    activity: 'Asignado a: Misión Cordillera',
    status: 'Inactivo',
    disponibilidad_activa: false,
    franjas_horarias: null,
    statusBg: 'bg-[#f1f5f9]',
    statusText: 'text-[#64748b]',
    dotColor: 'bg-[#94a3b8]'
  }
];

export function AdminVolunteers() {
  const [aviso, setAviso] = useState<{ title: string; message: string } | null>(null);
  const navigate = useNavigate();
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todas');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<string>('cualquiera');

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 5;

  // Control del Menú Desplegable (Opciones de cada fila)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuAbierto(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    cargarVoluntarios();
  }, []);

  const getStatusStyles = (activa: boolean, franjas: any) => {
    if (!activa) {
      return { status: 'Inactivo', statusBg: 'bg-[#f1f5f9]', statusText: 'text-[#64748b]', dotColor: 'bg-[#94a3b8]' };
    }

    // Verificar si tiene franjas horarias configuradas
    const tieneFranjas = franjas && typeof franjas === 'object' && (
      Object.values(franjas.manana || {}).some(Boolean) ||
      Object.values(franjas.tarde || {}).some(Boolean) ||
      Object.values(franjas.noche || {}).some(Boolean)
    );

    if (tieneFranjas) {
      return { status: 'Con Franjas Horarias', statusBg: 'bg-[#dcfce7]', statusText: 'text-[#166534]', dotColor: 'bg-[#16a34a]' };
    }

    return { status: 'Disponible (Sin Franjas)', statusBg: 'bg-[#e0e7ff]', statusText: 'text-[#3730a3]', dotColor: 'bg-[#4f46e5]' };
  };

  const cargarVoluntarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voluntarios')
        .select('*');

      if (error || !data || data.length === 0) {
        setVoluntarios(MOCK_VOLUNTARIOS);
      } else {
        const mapeados: Voluntario[] = data.map((vol: any, idx: number) => {
          const activa = vol.disponibilidad_activa ?? true;
          const franjas = vol.franjas_horarias;
          const styles = getStatusStyles(activa, franjas);

          return {
            id: vol.id || String(idx + 1),
            name: vol.nombre_completo || `Voluntario ${idx + 1}`,
            avatar: vol.avatar_url || `https://i.pravatar.cc/150?img=${(idx % 50) + 1}`,
            specialty: vol.profesion || 'Atención Social',
            certification: 'Verificado Plataforma',
            location: vol.ciudad_base || vol.ubicacion || 'Colombia',
            hours: `${vol.horas_totales_donadas || 0} h donadas`,
            activity: activa ? 'Disponible para misión' : 'Perfil Inactivo',
            disponibilidad_activa: activa,
            franjas_horarias: franjas,
            ...styles
          };
        });
        setVoluntarios(mapeados);
      }
    } catch (err) {
      console.error('Error al conectar con Supabase:', err);
      setVoluntarios(MOCK_VOLUNTARIOS);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado avanzado cruzado con franjas horarias y disponibilidad activa
  const voluntariosFiltrados = voluntarios.filter((vol) => {
    const coincideBusqueda = 
      vol.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      vol.specialty.toLowerCase().includes(busqueda.toLowerCase()) ||
      vol.location.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEspecialidad = 
      filtroEspecialidad === 'todas' || vol.specialty === filtroEspecialidad;

    let coincideDisponibilidad = true;
    if (filtroDisponibilidad === 'inactivo') {
      coincideDisponibilidad = !vol.disponibilidad_activa;
    } else if (filtroDisponibilidad === 'con_franjas') {
      const tiene = vol.franjas_horarias && (
        Object.values(vol.franjas_horarias.manana || {}).some(Boolean) ||
        Object.values(vol.franjas_horarias.tarde || {}).some(Boolean) ||
        Object.values(vol.franjas_horarias.noche || {}).some(Boolean)
      );
      coincideDisponibilidad = vol.disponibilidad_activa && tiene;
    } else if (filtroDisponibilidad === 'activo_general') {
      coincideDisponibilidad = vol.disponibilidad_activa;
    }

    return coincideBusqueda && coincideEspecialidad && coincideDisponibilidad;
  });

  const totalItems = voluntariosFiltrados.length;
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const voluntariosPaginados = voluntariosFiltrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const listaEspecialidades = Array.from(new Set(voluntarios.map(v => v.specialty)));

  const handleExportar = () => {
    const cabeceras = ['ID', 'Nombre', 'Especialidad', 'Ubicación', 'Horas', 'Estado'];
    const filas = voluntariosFiltrados.map(v => 
      `"${v.id}","${v.name}","${v.specialty}","${v.location}","${v.hours}","${v.status}"`
    );
    const csvContent = [cabeceras.join(','), ...filas].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Directorio_Voluntarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ACCIÓN DE INACTIVAR / ACTIVAR EN BASE DE DATOS Y FRONTEND
  const handleToggleEstado = async (voluntario: Voluntario) => {
    const nuevoEstadoActivo = !voluntario.disponibilidad_activa;

    // Actualización optimista local
    setVoluntarios(prev => prev.map(v => {
      if (v.id === voluntario.id) {
        const updatedStyles = getStatusStyles(nuevoEstadoActivo, v.franjas_horarias);
        return {
          ...v,
          disponibilidad_activa: nuevoEstadoActivo,
          activity: nuevoEstadoActivo ? 'Disponible para misión' : 'Perfil Inactivo',
          ...updatedStyles
        };
      }
      return v;
    }));

    // Persistencia real en Supabase
    try {
      const { error } = await supabase
        .from('voluntarios')
        .update({ disponibilidad_activa: nuevoEstadoActivo })
        .eq('id', voluntario.id);

      if (error) {
        console.error("Error al actualizar la disponibilidad en Supabase:", error.message);
        setAviso({ title: 'No se pudo actualizar', message: 'No se pudo actualizar el estado del voluntario. Se restauró el valor anterior.' });
        // Revertir si hay error
        cargarVoluntarios();
      }
    } catch (e) {
      console.error("Error de red al actualizar:", e);
      setAviso({ title: 'Error de conexión', message: 'No se pudo contactar al servidor. Intenta de nuevo.' });
      cargarVoluntarios();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#005684] font-bold flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold">Cargando directorio de voluntarios desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {aviso && <DialogModal title={aviso.title} message={aviso.message} onClose={() => setAviso(null)} />}

      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#005684] uppercase tracking-wider">
              CUERPO DE IMPACTO TERRITORIAL
            </span>
            <span className="text-[11px] text-[#64748b]">• Actualizado 07:34 AM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-1 leading-tight">
            Directorio de Voluntarios
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Gestiona el equipo de brigadistas y profesionales cívicos, consulta su perfil público o actualiza sus fichas de servicio y disponibilidad.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleExportar}
            className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>📥</span> Exportar Datos CSV
          </button>
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
            placeholder="Buscar por nombre, especialidad o ciudad..." 
            className="bg-transparent text-xs font-medium text-[#071d37] w-full focus:outline-none" 
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select 
            value={filtroEspecialidad}
            onChange={(e) => {
              setFiltroEspecialidad(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="todas">🏢 Todas las especialidades</option>
            {listaEspecialidades.map((esp, i) => (
              <option key={i} value={esp}>{esp}</option>
            ))}
          </select>

          <select 
            value={filtroDisponibilidad}
            onChange={(e) => {
              setFiltroDisponibilidad(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="cualquiera">📅 Cualquier estado</option>
            <option value="activo_general">Activos (Disponibles)</option>
            <option value="con_franjas">Con Franjas Horarias Definidas</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-[#e2e8f0] pl-4 shrink-0">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span>
          <span className="text-xs text-[#64748b]">Total: <span className="font-bold text-[#071d37]">{voluntarios.length.toLocaleString('es-CO')}</span> verificados</span>
        </div>
      </div>

      {/* LISTADO DE VOLUNTARIOS */}
      <div className="flex flex-col gap-4 w-full min-w-0">
        {voluntariosPaginados.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] text-center text-xs text-[#64748b]">
            No se encontraron voluntarios que coincidan con la búsqueda o filtro seleccionado.
          </div>
        ) : (
          voluntariosPaginados.map((vol, index) => (
            <div key={vol.id || index} className={`bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full transition ${!vol.disponibilidad_activa ? 'opacity-70 bg-gray-50/50' : ''}`}>
              
              {/* Info Principal */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="relative shrink-0 mt-1">
                  <img src={vol.avatar} alt={vol.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-[#e2e8f0]" />
                  {vol.disponibilidad_activa && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <span className="bg-[#10b981] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">✓</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                    <h3 className={`text-[14px] sm:text-[16px] font-extrabold truncate ${!vol.disponibilidad_activa ? 'text-[#64748b] line-through decoration-gray-300' : 'text-[#071d37]'}`}>{vol.name}</h3>
                    <span className="bg-[#eef2ff] text-[#4f46e5] text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                      {vol.specialty}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#0284c7] font-semibold mb-1.5">
                    <span className="bg-[#f0f9ff] border border-[#bae6fd] px-2 py-0.5 rounded-md flex items-center gap-1">
                      🛡 {vol.certification}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-[#64748b]">
                    <span className="flex items-center gap-1 truncate">📍 {vol.location}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1 whitespace-nowrap">⏱️ {vol.hours}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="truncate">{vol.activity}</span>
                  </div>
                </div>
              </div>

              {/* Estado y Acciones */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 lg:gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e2e8f0] pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
                
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${vol.statusBg} ${vol.statusText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vol.dotColor}`}></span>
                  {vol.status}
                </span>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 ml-auto relative">
                  <button 
                    onClick={() => navigate(`/voluntario/${vol.id}`)}
                    className="bg-[#eef6ff] text-[#005684] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-1.5 border border-[#dbeafe] whitespace-nowrap cursor-pointer"
                  >
                      Vista <span>↗</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/voluntario/editar/${vol.id}`)}
                    className="bg-white border border-[#e2e8f0] text-[#475569] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                      ✏️ Editar
                  </button>

                  {/* Menú de Opciones (⋮) */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbierto(menuAbierto === vol.id ? null : vol.id);
                      }}
                      className="text-[#94a3b8] hover:text-[#475569] px-2 font-bold text-lg cursor-pointer flex items-center justify-center h-full"
                    >
                        ⋮
                    </button>
                    
                    {menuAbierto === vol.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-2 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider bg-[#f8fafc] border-b border-[#e2e8f0]">
                          Opciones de Perfil
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleToggleEstado(vol); 
                            setMenuAbierto(null); 
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-bold transition hover:bg-gray-50 flex items-center gap-2 text-[#475569]"
                        >
                          {!vol.disponibilidad_activa ? (
                            <><span className="text-[#10b981] text-lg leading-none">●</span> Activar en BD</>
                          ) : (
                            <><span className="text-[#ef4444] text-lg leading-none">●</span> Inactivar en BD</>
                          )}
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
          Mostrando <span className="font-bold text-[#071d37]">{totalItems > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceInicio + itemsPorPagina, totalItems)}</span> de <span className="font-bold text-[#071d37]">{totalItems}</span> voluntarios
        </span>

        <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            &lt;
          </button>
          
          {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPaginaActual(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  paginaActual === pageNum
                    ? 'bg-[#0077b6] text-white shadow-sm'
                    : 'text-[#475569] hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPaginas > 5 && <span className="w-8 h-8 flex items-center justify-center text-[#94a3b8] text-xs font-bold">...</span>}

          <button 
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold disabled:opacity-40 cursor-pointer"
          >
            &gt;
          </button>
        </div>

        <span className="text-xs text-[#64748b] font-medium hidden sm:block">
          Página {paginaActual} de {totalPaginas}
        </span>
      </div>

    </div>
  );
}