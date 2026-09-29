import { useState } from 'react';

export function AdminVolunteers() {
  // Datos simulados idénticos al mockup
  const voluntarios = [
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
          <button className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm cursor-pointer">
            <span>📥</span> Exportar
          </button>
          <button className="bg-[#0077b6] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#005b8c] transition flex items-center gap-2 shadow-sm cursor-pointer">
            <span>👤+</span> Invitar / Registrar Voluntario
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 gap-2 w-full">
          <span className="text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Buscar por nombre, especialidad o ciudad..." className="bg-transparent text-xs font-medium text-[#071d37] w-full focus:outline-none" />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer w-full sm:w-auto">
            <option>🏢 Todas las especialidades</option>
          </select>
          <select className="bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer w-full sm:w-auto">
            <option>📅 Cualquier disponibilidad</option>
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-[#e2e8f0] pl-4 shrink-0">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span>
          <span className="text-xs text-[#64748b]">Total: <span className="font-bold text-[#071d37]">1,680</span> voluntarios verificados</span>
        </div>
      </div>

      {/* LISTADO DE VOLUNTARIOS */}
      <div className="flex flex-col gap-4 w-full min-w-0">
        {voluntarios.map((vol, index) => (
          <div key={index} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full">
            
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
                    🛡️ {vol.certification}
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
              
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${vol.statusBg} ${vol.statusText}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${vol.dotColor}`}></span>
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
        ))}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 mb-6 gap-4">
        <span className="text-xs text-[#64748b] font-medium">
          Mostrando <span className="font-bold text-[#071d37]">1 - 5</span> de <span className="font-bold text-[#071d37]">1,680</span> voluntarios
        </span>
        <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 shadow-sm">
          <button className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold">&lt;</button>
          <button className="w-8 h-8 flex items-center justify-center bg-[#0077b6] text-white rounded-lg text-xs font-bold shadow-sm">1</button>
          <button className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-gray-50 rounded-lg text-xs font-bold">2</button>
          <button className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-gray-50 rounded-lg text-xs font-bold">3</button>
          <span className="w-8 h-8 flex items-center justify-center text-[#94a3b8] text-xs font-bold">...</span>
          <button className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-gray-50 rounded-lg text-xs font-bold">42</button>
          <button className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:bg-gray-50 rounded-lg text-sm font-bold">&gt;</button>
        </div>
        <span className="text-xs text-[#64748b] font-medium hidden sm:block">
          Página 1 de 42
        </span>
      </div>

    </div>
  );
}