import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  statusBg?: string;
  statusText?: string;
  dotColor?: string;
}

// Datos de respaldo idénticos a la maqueta para garantizar fidelidad si la BD está en siembra o vacía
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
    status: 'Disponible',
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
    status: 'Fines de Semana',
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
    status: 'En Brigada Activa',
    statusBg: 'bg-[#dbeafe]',
    statusText: 'text-[#1e40af]',
    dotColor: 'bg-[#2563eb]'
  },
  {
    id: '4',
    name: 'Lic. Marcela Zuluaga',
    avatar: 'https://i.pravatar.cc/150?img=44',
    specialty: 'Psicóloga Comunitaria',
    certification: 'Tarjeta Colpsic',
    location: 'Manizales, Caldas',
    hours: '64 h donadas en campo',
    activity: 'Atención a Víctimas',
    status: 'Disponible',
    statusBg: 'bg-[#dcfce7]',
    statusText: 'text-[#166534]',
    dotColor: 'bg-[#16a34a]'
  },
  {
    id: '5',
    name: 'Carlos Mario Silva',
    avatar: 'https://i.pravatar.cc/150?img=33',
    specialty: 'Rescatista',
    certification: 'Cruz Roja Certificado',
    location: 'Barranquilla, Atlántico',
    hours: '120 h donadas en campo',
    activity: 'Misión Costa Norte',
    status: 'Disponible',
    statusBg: 'bg-[#dcfce7]',
    statusText: 'text-[#166534]',
    dotColor: 'bg-[#16a34a]'
  }
];

export function AdminVolunteers() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todas');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<string>('cualquiera');

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 5;

  // Modal para Invitar / Registrar
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState<string>('');
  const [nuevaCiudad, setNuevaCiudad] = useState<string>('');

  useEffect(() => {
    cargarVoluntarios();
  }, []);

  const getStatusStyles = (status?: string | null) => {
    switch (status) {
      case 'Disponible':
        return { statusBg: 'bg-[#dcfce7]', statusText: 'text-[#166534]', dotColor: 'bg-[#16a34a]' };
      case 'Fines de Semana':
        return { statusBg: 'bg-[#e0e7ff]', statusText: 'text-[#3730a3]', dotColor: 'bg-[#4f46e5]' };
      case 'En Brigada Activa':
        return { statusBg: 'bg-[#dbeafe]', statusText: 'text-[#1e40af]', dotColor: 'bg-[#2563eb]' };
      default:
        return { statusBg: 'bg-[#dcfce7]', statusText: 'text-[#166534]', dotColor: 'bg-[#16a34a]' };
    }
  };

  const cargarVoluntarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voluntarios')
        .select('*');

      if (error || !data || data.length === 0) {
        // En caso de error o tabla sin registros, se usan los datos de respaldo de la maqueta
        setVoluntarios(MOCK_VOLUNTARIOS);
      } else {
        // Mapeo dinámico de campos de Supabase a la estructura de la interfaz visual
        const mapeados: Voluntario[] = data.map((vol: any, idx: number) => {
          const status = vol.disponibilidad_estado || vol.estado || (vol.disponibilidad_activa ? 'Disponible' : 'Fines de Semana');
          const styles = getStatusStyles(status);

          return {
            id: vol.id || String(idx + 1),
            name: vol.nombre_completo || vol.nombre || `Voluntario ${idx + 1}`,
            avatar: vol.foto_url || vol.avatar || `https://i.pravatar.cc/150?img=${(idx % 50) + 1}`,
            specialty: vol.profesion || vol.especialidad || 'Atención Social',
            certification: vol.certificacion || vol.acreditacion || 'Verificado Plataforma',
            location: vol.ciudad_residencia || vol.ciudad || vol.ubicacion || 'Colombia',
            hours: typeof vol.horas_donadas === 'number' 
              ? `${vol.horas_donadas} h donadas en campo` 
              : (vol.horas_donadas || '40 h donadas en campo'),
            activity: vol.ultima_actividad || 'Disponible para misión',
            status: status,
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

  // Filtrado dinámico
  const voluntariosFiltrados = voluntarios.filter((vol) => {
    const coincideBusqueda = 
      vol.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      vol.specialty.toLowerCase().includes(busqueda.toLowerCase()) ||
      vol.location.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEspecialidad = 
      filtroEspecialidad === 'todas' || vol.specialty === filtroEspecialidad;

    const coincideDisponibilidad = 
      filtroDisponibilidad === 'cualquiera' || vol.status === filtroDisponibilidad;

    return coincideBusqueda && coincideEspecialidad && coincideDisponibilidad;
  });

  // Cálculo de paginación
  const totalItems = voluntariosFiltrados.length;
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const voluntariosPaginados = voluntariosFiltrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  // Lista de especialidades únicas para el selector de filtro
  const listaEspecialidades = Array.from(new Set(voluntarios.map(v => v.specialty)));

  // Manejador para invitar/crear voluntario en Supabase
  const handleCrearVoluntario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      const nuevoObj = {
        nombre_completo: nuevoNombre,
        profesion: nuevaEspecialidad || 'General',
        ciudad_residencia: nuevaCiudad || 'Bogotá D.C.',
        certificacion: 'Verificación Inicial',
        horas_donadas: 0,
        disponibilidad_estado: 'Disponible',
        disponibilidad_activa: true
      };

      const { error } = await supabase
        .from('voluntarios')
        .insert([nuevoObj]);

      if (error) {
        alert('Error al guardar en Supabase: ' + error.message);
      } else {
        await cargarVoluntarios();
        setModalOpen(false);
        setNuevoNombre('');
        setNuevaEspecialidad('');
        setNuevaCiudad('');
      }
    } catch (err) {
      console.error('Error al registrar:', err);
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
            onClick={() => window.print()}
            className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>📥</span> Exportar
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-[#0077b6] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#005b8c] transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>👤+</span> Invitar / Registrar Voluntario
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
            <option value="cualquiera">📅 Cualquier disponibilidad</option>
            <option value="Disponible">Disponible</option>
            <option value="Fines de Semana">Fines de Semana</option>
            <option value="En Brigada Activa">En Brigada Activa</option>
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-[#e2e8f0] pl-4 shrink-0">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span>
          <span className="text-xs text-[#64748b]">Total: <span className="font-bold text-[#071d37]">{voluntarios.length.toLocaleString('es-CO')}</span> voluntarios verificados</span>
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
            <div key={vol.id || index} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full">
              
              {/* Info Principal */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="relative shrink-0 mt-1">
                  <img src={vol.avatar} alt={vol.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-[#e2e8f0]" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <span className="bg-[#10b981] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">✓</span>
                  </div>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                    <h3 className="text-[14px] sm:text-[16px] font-extrabold text-[#071d37] truncate">{vol.name}</h3>
                    <span className="bg-[#eef2ff] text-[#4f46e5] text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                      {vol.specialty}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#0284c7] font-semibold mb-1.5">
                    <span className="bg-[#f0f9ff] border border-[#bae6fd] px-2 py-0.5 rounded-md flex items-center gap-1">
                      🛡️️ {vol.certification}
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

              {/* Estado y Acciones (Responsivo) */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 lg:gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e2e8f0] pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
                
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${vol.statusBg || 'bg-[#dcfce7]'} ${vol.statusText || 'text-[#166534]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vol.dotColor || 'bg-[#16a34a]'}`}></span>
                  {vol.status}
                </span>

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

      {/* MODAL INVITAR / REGISTRAR VOLUNTARIO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#071d37]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xl max-w-md w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h3 className="text-base font-extrabold text-[#071d37]">Registrar Nuevo Voluntario</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearVoluntario} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#475569] mb-1 block">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Dra. Sofía Ramírez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#071d37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] mb-1 block">Especialidad / Profesión</label>
                <input 
                  type="text" 
                  placeholder="Ej. Encomiendas & Acopio"
                  value={nuevaEspecialidad}
                  onChange={(e) => setNuevaEspecialidad(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#071d37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] mb-1 block">Ciudad</label>
                <input 
                  type="text" 
                  placeholder="Ej. Cali, Valle"
                  value={nuevaCiudad}
                  onChange={(e) => setNuevaCiudad(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#071d37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#e2e8f0]">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-[#f1f5f9] text-[#475569] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#e2e8f0] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#0077b6] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#005b8c] transition cursor-pointer"
                >
                  Guardar en Base de Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}