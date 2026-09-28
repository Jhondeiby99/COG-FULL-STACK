import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

export function EditVolunteerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estados del Formulario
  const [disponibilidadActiva, setDisponibilidadActiva] = useState(true);
  const [nombreCompleto, setNombreCompleto] = useState('Camila Restrepo Montoya');
  const [titulo, setTitulo] = useState('Médica Pediatra (Esp. Neo)');
  const [presentacion, setPresentacion] = useState('Médica con 8 años de trayectoria hospitalaria y vocación por brigadas rurales en zonas de difícil acceso. Comprometida con la atención pediátrica humanizada...');
  const [ciudadBase, setCiudadBase] = useState('Medellín, Antioquia (Valle de Aburrá)');
  const [radio, setRadio] = useState(35);
  const [viajar, setViajar] = useState(true);

  // Grilla de Horarios Simulada
  const [horarios, setHorarios] = useState({
    manana: { lun: false, mar: false, mie: false, jue: false, vie: false, sab: true, dom: true },
    tarde: { lun: false, mar: false, mie: true, jue: false, vie: false, sab: true, dom: false },
    noche: { lun: false, mar: true, mie: false, jue: false, vie: false, sab: false, dom: false },
  });

  const markUnsaved = () => setHasUnsavedChanges(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSave = async () => {
    setLoading(true);
    // Aquí iría la lógica de guardado en Supabase (update a la tabla voluntarios)
    setTimeout(() => {
      setLoading(false);
      setHasUnsavedChanges(false);
    }, 800);
  };

  const toggleHorario = (franja: 'manana' | 'tarde' | 'noche', dia: string) => {
    setHorarios(prev => ({
      ...prev,
      [franja]: { ...prev[franja], [dia]: !prev[franja][dia as keyof typeof prev['manana']] }
    }));
    markUnsaved();
  };

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans pb-24">    

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          {/* HEADER DE LA FICHA */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-[#bbf7d0] flex items-center gap-1">
                  ✓ FICHA VERIFICADA NIVEL 3
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">ID: VOL-734-COL-082</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37]">Mi Ficha de Voluntariado</h1>
              <h2 className="text-lg font-bold text-[#005684] mt-0.5">— Dra. Camila Restrepo (Médica Pediatra)</h2>
              <p className="text-[13px] text-[#64748b] mt-2 max-w-2xl">Esta información se sincroniza en tiempo real con las brigadas de emergencia activa y el Directorio Nacional de Talento Cívico 7:34 AM.</p>
            </div>
            
            <div className="flex flex-col items-end gap-3 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${disponibilidadActiva ? 'bg-[#047857]' : 'bg-gray-300'}`} onClick={() => {setDisponibilidadActiva(!disponibilidadActiva); markUnsaved();}}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${disponibilidadActiva ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-[#071d37]">Disponibilidad Activa</span>
                  <span className="text-[10px] text-[#64748b]">Visible en búsquedas</span>
                </div>
              </label>
              <div className="flex items-center gap-2 mt-2">
                <button className="bg-[#eef6ff] text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-2 border border-[#dbeafe]">
                  <span>👁️</span> Previsualizar Perfil
                </button>
                <button onClick={handleSave} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm flex items-center gap-2">
                  <span>✓</span> Guardar Cambios
                </button>
              </div>
            </div>
          </div>

          {/* RETÍCULA DE EDICIÓN: 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start mt-2">
            
            {/* COLUMNA IZQUIERDA (Principal) */}
            <div className="flex flex-col gap-6">
              
              {/* 01. IDENTIDAD Y RESUMEN */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🪪</span> 01 / IDENTIDAD Y RESUMEN PROFESIONAL
                  </h3>
                  <span className="text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full">Auditoría Aprobada</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <img src="https://i.pravatar.cc/150?img=47" className="w-24 h-24 rounded-2xl object-cover border border-[#e2e8f0] shadow-sm" alt="Perfil" />
                    <span className="text-[10px] font-bold text-[#94a3b8]">JPG o PNG max. 5MB</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">Nombre Completo</label>
                        <input type="text" value={nombreCompleto} onChange={(e)=>{setNombreCompleto(e.target.value); markUnsaved();}} className="w-full bg-[#f8fafc] border border-transparent focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">Título Profesional / Especialidad</label>
                        <input type="text" value={titulo} onChange={(e)=>{setTitulo(e.target.value); markUnsaved();}} className="w-full bg-[#f8fafc] border border-transparent focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[11px] font-bold text-[#475569]">Presentación y Resumen Cívico</label>
                        <span className="text-[10px] text-[#94a3b8]">{presentacion.length} / 500 caracteres</span>
                      </div>
                      <textarea value={presentacion} onChange={(e)=>{setPresentacion(e.target.value); markUnsaved();}} rows={3} className="w-full bg-[#f8fafc] border border-transparent focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs text-[#475569] leading-relaxed outline-none transition resize-none"></textarea>
                    </div>
                  </div>
                </div>
              </section>

              {/* 02. ESPECIALIDADES Y COMPETENCIAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-1">
                  <span className="text-base">🎯</span> 02 / ESPECIALIDADES Y COMPETENCIAS CÍVICAS
                </h3>
                <p className="text-[11px] text-[#64748b] mb-4">Click en etiqueta para alternar o cambiar nivel</p>

                <div className="flex flex-wrap gap-3">
                  <div className="bg-[#f0f6ff] border border-[#bae6fd] rounded-xl p-3 w-48 relative">
                    <span className="absolute top-3 right-3 text-[#0284c7]">✓</span>
                    <p className="text-xs font-extrabold text-[#071d37]">Pediatría General</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5 leading-tight mb-2">Diagnóstico infantil, curvas de desarrollo</p>
                    <span className="bg-[#005684] text-white text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">Avanzado (8+ años)</span>
                  </div>
                  <div className="bg-[#f0f6ff] border border-[#bae6fd] rounded-xl p-3 w-48 relative">
                    <span className="absolute top-3 right-3 text-[#0284c7]">✓</span>
                    <p className="text-xs font-extrabold text-[#071d37]">Primeros Auxilios</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5 leading-tight mb-2">Triage START, RCP pediátrico, trauma</p>
                    <span className="bg-[#0284c7] text-white text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">Instructor Certificado</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 w-48 relative opacity-70 cursor-pointer hover:opacity-100 transition">
                    <span className="absolute top-3 right-3 text-[#cbd5e1]">○</span>
                    <p className="text-xs font-extrabold text-[#071d37]">Medicina Preventiva</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5 leading-tight mb-2">Esquemas PAI, higiene y desparasitación</p>
                    <span className="bg-[#64748b] text-white text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">Intermedio</span>
                  </div>
                  <div className="border border-dashed border-[#cbd5e1] rounded-xl p-3 w-48 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition">
                    <span className="text-[#94a3b8] text-lg font-bold">+</span>
                    <p className="text-[11px] font-bold text-[#64748b] mt-1">Añadir otra competencia</p>
                    <p className="text-[9px] text-[#94a3b8] mt-0.5">Nutrición, Salud mental, etc.</p>
                  </div>
                </div>
              </section>

              {/* 03. DISPONIBILIDAD Y FRANJAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">📅</span> 03 / DISPONIBILIDAD Y FRANJAS HORARIAS
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#64748b]">Compromiso Mensual:</span>
                    <span className="bg-[#eef6ff] text-[#005684] text-xs font-black px-3 py-1 rounded-lg border border-[#dbeafe]">16 Horas / Mes</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748b] mb-4">Haz clic sobre los bloques para encender/apagar tus turnos disponibles habituales. Las fundaciones solo te convocarán en tus franjas marcadas.</p>

                {/* Grid de Horarios */}
                <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="text-[10px] font-bold text-[#94a3b8] uppercase pb-3 w-1/4">Franja Horaria</th>
                        {['Lun','Mar','Mie','Jue','Vie','Sab','Dom'].map(d => (
                          <th key={d} className="text-[10px] font-bold text-[#94a3b8] uppercase pb-3 text-center w-[10%]">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'manana', label: '☀️ Mañana (07:00 - 12:00)' },
                        { id: 'tarde', label: '🌤️ Tarde (13:00 - 18:00)' },
                        { id: 'noche', label: '🌙 Noche (18:30 - 22:00)' }
                      ].map((franja) => (
                        <tr key={franja.id} className="border-t border-[#f1f5f9]">
                          <td className="py-2.5 text-xs font-semibold text-[#475569]">{franja.label}</td>
                          {['lun','mar','mie','jue','vie','sab','dom'].map((dia) => {
                            const isActive = horarios[franja.id as keyof typeof horarios][dia as keyof typeof horarios['manana']];
                            return (
                              <td key={dia} className="py-2.5 text-center">
                                <button 
                                  onClick={() => toggleHorario(franja.id as any, dia)}
                                  className={`w-11 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isActive ? 'bg-[#047857] text-white shadow-sm' : 'bg-[#e2e8f0] text-[#94a3b8] hover:bg-[#cbd5e1]'}`}
                                >
                                  {isActive ? 'Activo' : 'Off'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Slider Objetivo Mensual */}
                <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-[#475569]">Objetivo de dedicación comunitaria mensual</span>
                     <span className="text-sm font-extrabold text-[#0284c7]">~4 misiones</span>
                   </div>
                   <input type="range" min="4" max="40" defaultValue="16" className="w-full accent-[#005684] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" onChange={markUnsaved}/>
                   <div className="flex justify-between text-[9px] font-bold text-[#94a3b8] mt-1.5">
                     <span>4 hrs/mes<br/>(Mínimo)</span>
                     <span className="text-center text-[#64748b]">16 hrs/mes<br/>(Recomendado)</span>
                     <span className="text-right">40 hrs/mes (Dedicación Estimada bimestral<br/>Alta)</span>
                   </div>
                </div>
              </section>

              {/* 04. HISTORIAL DE MISIONES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🤝</span> 04 / HISTORIAL DE MISIONES Y TESTIMONIOS RECIBIDOS
                  </h3>
                  <button className="text-[11px] font-bold text-[#005684] hover:underline flex items-center gap-1">
                    <span>▷</span> Solicitar Recomendación a Fundación
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Item 1 */}
                  <div className="flex gap-4 p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#0284c7] flex items-center justify-center shrink-0">🏥</div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="text-[13px] font-extrabold text-[#071d37]">Jornada Pediátrica Comuna 13</h4>
                           <span className="bg-[#e0e7ff] text-[#3730a3] text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 inline-block">Completada (32 Atenciones)</span>
                           <p className="text-[10px] font-semibold text-[#64748b] mt-1">Fundación Huellas del Mañana • Sep 2024</p>
                         </div>
                         <div className="text-[11px] font-bold text-[#f59e0b] bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                           <span>★</span> 5.0 Cívico
                         </div>
                       </div>
                       <p className="text-[11px] text-[#475569] mt-2 italic leading-relaxed border-l-2 border-[#cbd5e1] pl-2">"La dedicación de la Dra. Camila fue clave para identificar a tiempo 8 casos de desnutrición infantil y canalizarlos con el sistema de salud."</p>
                    </div>
                  </div>
                  {/* Item 2 */}
                  <div className="flex gap-4 p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#0284c7] flex items-center justify-center shrink-0">💧</div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="text-[13px] font-extrabold text-[#071d37]">Brigada Médica Emergencia Invernal Chocó</h4>
                           <span className="bg-[#dbeafe] text-[#1e40af] text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 inline-block">Misión Desplegada</span>
                           <p className="text-[10px] font-semibold text-[#64748b] mt-1">Cruz Cívica Regional • Jul 2024</p>
                         </div>
                         <div className="text-[11px] font-bold text-[#f59e0b] bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                           <span>★</span> 5.0 Cívico
                         </div>
                       </div>
                       <p className="text-[11px] text-[#475569] mt-2 italic leading-relaxed border-l-2 border-[#cbd5e1] pl-2">"Lideró el protocolo de tamizaje y desparasitación con admirable temple en condiciones de lluvia extrema."</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* COLUMNA DERECHA (Sidebar Interno) */}
            <div className="flex flex-col gap-6">
              
              {/* 05. COBERTURA */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-4">
                    <span className="text-base">📍</span> 05 / COBERTURA Y MOVILIDAD
                 </h3>
                 
                 <div className="mb-4">
                   <label className="text-[11px] font-bold text-[#475569] block mb-1">Ciudad Base de Operaciones</label>
                   <input type="text" value={ciudadBase} onChange={(e)=>{setCiudadBase(e.target.value); markUnsaved();}} className="w-full bg-[#f8fafc] border border-transparent focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                 </div>

                 <div className="mb-3 flex justify-between items-center">
                   <label className="text-[11px] font-bold text-[#475569]">Radio de Desplazamiento Directo</label>
                   <span className="text-xs font-extrabold text-[#005684]">{radio} km</span>
                 </div>
                 <input type="range" min="5" max="100" value={radio} onChange={(e)=>{setRadio(Number(e.target.value)); markUnsaved();}} className="w-full accent-[#005684] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-1"/>
                 <div className="flex justify-between text-[9px] text-[#94a3b8] mb-4">
                   <span>Solo local</span>
                   <span>Metropolitana (~35km)</span>
                   <span>100km+</span>
                 </div>

                 {/* Mockup Mapa */}
                 <div className="rounded-xl overflow-hidden bg-[#e2e8f0] h-28 relative mb-4">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-60" alt="Mapa" />
                    <div className="absolute inset-0 bg-[#0284c7]/20 flex items-center justify-center">
                       <div className="bg-[#0f2a3f]/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg text-center">
                         Zona de rápida intervención:<br/>AMVA Sur
                       </div>
                    </div>
                 </div>

                 <label className="flex items-start gap-2 cursor-pointer bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                   <input type="checkbox" checked={viajar} onChange={(e)=>{setViajar(e.target.checked); markUnsaved();}} className="mt-0.5 accent-[#005684]" />
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-[#071d37]">Disponibilidad de viajar a otros municipios</span>
                     <span className="text-[10px] text-[#64748b] leading-tight mt-0.5">Vuelos o trayectos terrestres en fines de semana programados.</span>
                   </div>
                 </label>
              </section>

              {/* 06. CERTIFICACIONES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                      <span className="text-base">🛡️</span> 06 / CERTIFICACIONES Y AUDITORÍA
                   </h3>
                   <span className="text-[10px] font-bold text-[#10b981] flex items-center gap-1"><span className="text-sm">○</span> 100% Válido</span>
                 </div>

                 <div className="flex flex-col gap-2 mb-4">
                   <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                       <span className="text-[#047857]">⚕️</span>
                       <div>
                         <p className="text-[11px] font-bold text-[#071d37]">Registro ReTHUS MinSalud</p>
                         <p className="text-[9px] text-[#64748b]">FOLIO-2018-MED-09211</p>
                       </div>
                     </div>
                     <span className="bg-[#047857] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Verificado</span>
                   </div>
                   <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                       <span className="text-[#047857]">🎓</span>
                       <div>
                         <p className="text-[11px] font-bold text-[#071d37]">Diploma Médico Cirujano</p>
                         <p className="text-[9px] text-[#64748b]">Universidad de Antioquia (2015)</p>
                       </div>
                     </div>
                     <span className="bg-[#047857] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Verificado</span>
                   </div>
                   <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                       <span className="text-[#047857]">💉</span>
                       <div>
                         <p className="text-[11px] font-bold text-[#071d37]">Carné Vacunación al Día</p>
                         <p className="text-[9px] text-[#64748b]">Hepatitis B, Fiebre Amarilla, Tétanos</p>
                       </div>
                     </div>
                     <span className="bg-[#047857] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Verificado</span>
                   </div>
                 </div>

                 <button className="w-full bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl py-4 text-center text-[#005684] hover:bg-[#f0f6ff] transition cursor-pointer flex flex-col items-center justify-center gap-1">
                   <span className="text-lg">📄</span>
                   <span className="text-xs font-bold">Adjuntar nueva certificación</span>
                   <span className="text-[9px] text-[#94a3b8]">PDF hasta 10MB (Especializaciones, Cruz Roja, etc.)</span>
                 </button>

                 <div className="mt-4 bg-[#eef6ff] p-3 rounded-xl flex gap-2 items-start">
                   <span className="text-[#005684] text-sm">🔒</span>
                   <p className="text-[9px] font-medium text-[#475569] leading-tight">Toda documentación médica es resguardada bajo la Ley de Hábeas Data y encriptación de grado hospitalario en 7:34 AM.</p>
                 </div>
              </section>

              {/* MÉTRICAS DE CONFIABILIDAD */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <h3 className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-center mb-4">Métricas de Confiabilidad Cívica</h3>
                 <div className="grid grid-cols-2 gap-4 text-center divide-x divide-[#e2e8f0]">
                   <div>
                     <p className="text-2xl font-black text-[#005684]">142</p>
                     <p className="text-[10px] font-bold text-[#64748b]">Horas donadas</p>
                   </div>
                   <div>
                     <p className="text-2xl font-black text-[#047857]">100%</p>
                     <p className="text-[10px] font-bold text-[#64748b]">Asistencia efectiva</p>
                   </div>
                 </div>
              </section>

            </div>
          </div>
        </div>

        {/* 3. SNACKBAR FLOTANTE (CAMBIOS SIN GUARDAR) */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="bg-[#0f2a3f] text-white rounded-2xl p-4 pr-5 shadow-2xl flex items-center gap-6 border border-[#1e3a8a] max-w-2xl w-full">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0284c7]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <span className="animate-spin text-lg">↺</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Cambios sin guardar detectados</p>
                  <p className="text-[11px] text-[#94a3b8]">Última sincronización con el servidor: Hoy 07:34 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto shrink-0">
                <button 
                  onClick={() => setHasUnsavedChanges(false)}
                  className="text-xs font-bold text-[#cbd5e1] hover:text-white px-3 py-2 transition"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {loading ? 'Guardando...' : '💾 Guardar y Publicar Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

      
    </div>
  );
}