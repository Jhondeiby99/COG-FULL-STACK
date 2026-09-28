import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AdminDashboard() {
  // Datos simulados para la tabla de aprobaciones
  const aprobaciones = [
    {
      id: 'PC',
      nombre: 'Fundación Pies Cálidos',
      nit: '901.442.891-3',
      ciudad: 'Bogotá D.C.',
      zona: 'Localidad Kennedy',
      fecha: '14 Oct 2025',
      hora: '08:15 AM (Hace 1h)',
      docs: ['RUT', 'CCB', 'Personería'],
      riesgo: 'Bajo (100% Score)',
      riesgoColor: 'text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]',
      docsFaltantes: false
    },
    {
      id: 'SV',
      nombre: 'Asociación Sueños Vivos',
      nit: '890.932.314-8',
      ciudad: 'Medellín',
      zona: 'Comuna 13 (San Javier)',
      fecha: '13 Oct 2025',
      hora: '04:30 PM (Ayer)',
      docs: ['RUT', 'CCB'],
      riesgo: 'Medio (Faltante doc)',
      riesgoColor: 'text-[#3b82f6] bg-[#eff6ff] border-[#bfdbfe]',
      docsFaltantes: true
    },
    {
      id: 'RC',
      nombre: 'Red Comunitaria del Sur',
      nit: '900.589.992-1',
      ciudad: 'Cali',
      zona: 'Distrito de Aguablanca',
      fecha: '12 Oct 2025',
      hora: '02:00 PM (Hace 2 días)',
      docs: ['RUT', 'CC Cali', 'Estatutos'],
      riesgo: 'Bajo (98% Score)',
      riesgoColor: 'text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]',
      docsFaltantes: false
    }
  ];

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans">
      

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
      

        {/* CONTENIDO DASHBOARD */}
        <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6 overflow-y-auto">
          
          {/* HEADER SECCIÓN */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-bold text-[#005684]">Sincronización en vivo • 07:34 AM UTC-5</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mb-1 mt-1">Panel de Control y Supervisión General</h1>
              <p className="text-xs text-[#64748b]">Gestión transparente de alianzas comunitarias, voluntariado estratégico y trazabilidad operativa en Colombia.</p>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm">
                <button className="bg-[#005684] text-white text-[11px] font-bold px-4 py-1.5">Últimos 30 días</button>
                <button className="text-[#64748b] hover:bg-gray-50 text-[11px] font-bold px-4 py-1.5 border-l border-[#e2e8f0]">Este mes</button>
                <button className="text-[#64748b] hover:bg-gray-50 text-[11px] font-bold px-4 py-1.5 border-l border-[#e2e8f0]">Año 2025</button>
              </div>
              <button className="bg-white border border-[#e2e8f0] text-[#071d37] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2">
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
                <span className="text-3xl font-black text-[#071d37]">142</span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">↑ 12% act.</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Revisión requerida</span>
                <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">6 pendientes</span>
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
                <span className="text-3xl font-black text-[#071d37]">1,680</span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">↑ 5.8%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Capacidad activa en calle</span>
                <span className="text-[#005684] font-bold">74% asignados</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Impacto Financiero</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">💰</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Donaciones & Ayudas</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">$48.2M</span>
                <span className="text-[10px] text-[#64748b] font-bold mb-1">COP*</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">Ejecución directa</span>
                <span className="text-[#059669] font-bold">↑ 36.5% entregado</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Garantía Operativa</p>
                <span className="bg-[#eef6ff] text-[#005684] p-1.5 rounded-lg">🛡️</span>
              </div>
              <h3 className="text-sm font-bold text-[#64748b]">Tasa de Auditoría</h3>
              <div className="flex items-end gap-2 mt-1 mb-3">
                <span className="text-3xl font-black text-[#071d37]">99.4%</span>
                <span className="text-[10px] text-[#059669] font-bold mb-1">excelencia</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-100">
                <span className="text-[#64748b]">SLA medio validación</span>
                <span className="font-bold text-[#071d37]">3.2 horas</span>
              </div>
            </div>
          </div>

          {/* GRÁFICO (Simulación) */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-bold text-[#071d37] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#005684]"></span>
                  Flujo de Solicitudes y Conexiones Exitosas
                </h3>
                <p className="text-xs text-[#64748b] mt-1">Balance mensual 2025: Solicitudes de auxilio recibidas vs. Asignaciones completadas en terreno.</p>
              </div>
              <div className="flex gap-4 items-center text-[10px] font-bold text-[#64748b]">
                 <div className="flex items-center gap-1.5">
                   <span className="w-3 h-0.5 bg-[#cbd5e1]"></span> Solicitudes Recibidas (3,410)
                 </div>
                 <div className="flex items-center gap-1.5">
                   <span className="w-3 h-0.5 bg-[#0ea5e9]"></span> Asignaciones Completadas (3,195)
                 </div>
              </div>
            </div>
            
            {/* Espacio reservado para Chart.js / Recharts */}
            <div className="w-full h-48 bg-gradient-to-b from-[#f8fafc] to-white rounded-xl border border-dashed border-[#e2e8f0] relative flex items-end justify-between px-10 pb-4">
               {/* Simulación visual de gráfico SVG */}
               <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                 <path d="M0,150 C200,100 400,180 600,80 C800,-20 900,120 1000,50 L1000,200 L0,200 Z" fill="url(#grad1)" opacity="0.2"/>
                 <path d="M0,150 C200,100 400,180 600,80 C800,-20 900,120 1000,50" fill="none" stroke="#0ea5e9" strokeWidth="3"/>
                 <defs>
                   <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" style={{stopColor:'#0ea5e9', stopOpacity:1}} />
                     <stop offset="100%" style={{stopColor:'#ffffff', stopOpacity:0}} />
                   </linearGradient>
                 </defs>
               </svg>
               {/* Tooltip Simulado */}
               <div className="absolute left-1/2 top-1/4 -translate-x-1/2 bg-[#0f2a3f] text-white text-[10px] p-2 rounded-lg shadow-lg z-10 hidden md:block">
                 <p className="font-bold">Agosto 2025 (Pico de Emergencia Climatológica)</p>
                 <p className="text-gray-300">Solicitudes: 412 — Completadas: 398 (96.6%)</p>
               </div>
               {/* Eje X (Meses) */}
               <div className="w-full flex justify-between text-[9px] font-bold text-[#94a3b8] relative z-10 px-2 mt-auto">
                 <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span className="text-[#071d37]">Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
               </div>
            </div>

            <div className="mt-4 bg-[#f8fafc] p-3 rounded-xl flex items-center justify-between border border-[#e2e8f0]">
               <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                 <span className="text-[#005684]">📈</span> <strong>Lectura Operativa:</strong> El índice de respuesta rápida se mantuvo en un promedio de <strong>93.7%</strong> durante la temporada de lluvias de agosto a octubre.
               </div>
               <button className="text-[11px] font-bold text-[#005684] hover:underline">Ver informe mensual detallado →</button>
            </div>
          </div>

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
                <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">Pendientes <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">6</span></span>
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">En revisión <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">1</span></span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">Aprobadas recientemente <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">24</span></span>
              </div>
            </div>

            <div className="overflow-x-auto">
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
                  {aprobaciones.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc] transition">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#005684] text-xs font-bold flex items-center justify-center shrink-0 border border-[#dbeafe]">
                            {item.id}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#071d37]">{item.nombre}</p>
                            <p className="text-[10px] text-[#64748b]">NIT: {item.nit} • Atención a la infancia</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-[11px] font-semibold text-[#071d37]">📍 {item.ciudad}</p>
                        <p className="text-[10px] text-[#64748b]">{item.zona}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-[11px] font-semibold text-[#071d37]">{item.fecha}</p>
                        <p className="text-[10px] text-[#64748b]">{item.hora}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {item.docs.map((doc, dIdx) => (
                            <span key={dIdx} className="text-[9px] bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded text-[#64748b] font-semibold flex items-center gap-1">
                              <span className="text-[#005684]">📄</span> {doc}
                            </span>
                          ))}
                        </div>
                        {item.docsFaltantes && (
                           <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1">⚠️ Falta Balances</p>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.riesgoColor} flex items-center gap-1 w-max`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {item.riesgo}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1 ml-auto">
                          ✓ Aprobar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-semibold">
              <p>Mostrando 3 de 6 fundaciones con requerimiento de aprobación prioritaria.</p>
              <div className="flex gap-4">
                <button className="hover:text-[#071d37]">Anterior</button>
                <span>Página 1 de 2</span>
                <button className="hover:text-[#071d37]">Siguiente</button>
              </div>
            </div>
          </section>

          {/* ZONA INFERIOR: DESTACADOS Y MAPA */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 pb-8">
            
            {/* Fundaciones Activas Destacadas */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[13px] font-bold text-[#071d37]">Fundaciones Activas Destacadas</h3>
                 <button className="text-[10px] font-bold text-[#005684] hover:underline">Ver todas (142) &gt;</button>
               </div>
               <p className="text-[10px] text-[#64748b] mb-4">Monitoreo de dotación continua y despacho solidario en curso.</p>

               <div className="flex flex-col gap-3">
                 {[
                   { name: 'Fundación Semillas del Chocó', loc: 'Quibdó, Chocó', stat: '16 necesidades cubiertas', val: 94, img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=150&auto=format&fit=crop' },
                   { name: 'Misión Salud Caribe', loc: 'Cartagena & Montes de María', stat: '9 brigadas activas', val: 58, img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=150&auto=format&fit=crop' },
                   { name: 'Banco de Alimentos del Oriente', loc: 'Bucaramanga, Santander', stat: '32 centros abastecidos', val: 100, img: 'https://images.unsplash.com/photo-1593113563332-e147ce3f7e4e?q=80&w=150&auto=format&fit=crop' }
                 ].map((fund, i) => (
                   <div key={i} className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-3">
                     <img src={fund.img} className="w-10 h-10 rounded-lg object-cover" alt="Thumb" />
                     <div className="flex-1">
                       <h4 className="text-[11px] font-bold text-[#071d37] flex items-center gap-1">
                         {fund.name} <span className="text-[#059669]">✓</span>
                       </h4>
                       <p className="text-[9px] text-[#64748b]">{fund.loc} • <span className="text-[#005684] font-semibold">{fund.stat}</span></p>
                     </div>
                     <div className="text-right w-24">
                       <p className="text-[10px] font-bold text-[#071d37] mb-1">{fund.val}% Cobertura</p>
                       <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${fund.val === 100 ? 'bg-[#059669]' : 'bg-[#0ea5e9]'}`} style={{width: `${fund.val}%`}}></div>
                       </div>
                     </div>
                     <button className="text-[#94a3b8] hover:text-[#005684] ml-2">&gt;</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Voluntarios en Terreno Hoy */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col">
               <div className="flex justify-between items-center mb-1">
                 <h3 className="text-[13px] font-bold text-[#071d37]">Voluntarios en Terreno Hoy</h3>
                 <span className="text-[10px] font-bold text-[#059669] flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-current"></span> 415 activos
                 </span>
               </div>
               <p className="text-[10px] text-[#64748b] mb-4">Despliegue operativo y especialidades activas a las 07:34 AM.</p>

               <div className="relative h-28 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-[#e2e8f0]">
                 <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" alt="Mapa" />
                 <div className="absolute bottom-2 left-2 right-2 bg-[#0f2a3f]/95 backdrop-blur text-white p-2 rounded-lg text-[10px] flex justify-between items-center shadow-lg">
                   <div>
                     <p className="font-bold">📍 Región Andina Central</p>
                     <p className="text-gray-300">210 brigadistas en ruta</p>
                   </div>
                   <button className="bg-[#005684] px-3 py-1 rounded text-[9px] font-bold hover:bg-[#00456a]">Ver Radar</button>
                 </div>
               </div>

               <div className="flex-1 flex flex-col gap-2">
                 <h4 className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1">Especialidades en Servicio</h4>
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
               </div>

               <button className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-2.5 rounded-xl mt-4 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe]">
                 <span>⚡</span> Despachar Convocatoria Extraordinaria
               </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}