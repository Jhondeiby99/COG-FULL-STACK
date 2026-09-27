import { useEffect, useState } from 'react';
import { Link , useParams} from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';
import * as Icons from "../assets/icons/index.ts";

export function VolunteerProfile() {
  const { id } = useParams();
  const [voluntario, setVoluntario] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [opiniones, setOpiniones] = useState<any[]>([]);
  const [masVoluntarios, setMasVoluntarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVolunteerData() {

      // 1. Validar que exista el ID en la URL
      if (!id) {
        setLoading(false);
        return;
      }

      const { data: volData } = await supabase
        .from('voluntarios')
        .select('*')
        .eq('is_verified', true)
        .eq('id', id)
        .limit(1)
        .single();

      if (volData) {
        setVoluntario(volData);

        // 2. Traer su Historial
        const { data: histData } = await supabase.from('historial_voluntariado').select('*').eq('voluntario_id', volData.id);
        if (histData) setHistorial(histData);

        // 3. Traer sus Reseñas
        const { data: revData } = await supabase.from('resenas').select('*').eq('voluntario_id', volData.id).order('created_at', { ascending: false });
        if (revData) setOpiniones(revData);

        // 4. Traer "Más Voluntarios" (excluyendo al actual)
        const { data: otrosData } = await supabase.from('voluntarios').select('*').neq('id', volData.id).eq('is_verified', true).limit(3);
        if (otrosData) setMasVoluntarios(otrosData);
      }
      setLoading(false);
    }
    fetchVolunteerData();
  }, [id]);

  const getAvatarUrl = (url?: string | null) => {
    return url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    const words = name.trim().split(' ');
    return (words[0]?.[0] + (words[1]?.[0] || '')).toUpperCase();
  };

  if (loading) return <div className="min-h-svh flex items-center justify-center font-bold text-[#005684]">Cargando perfil del voluntario...</div>;
  if (!voluntario) return <div className="min-h-svh flex items-center justify-center font-bold text-red-500">Voluntario no encontrado</div>;

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#f4f7fb] text-left text-[15px] leading-normal text-[#2d3748] font-sans">
      <Header />

      <main className="flex-1 pb-12">
        {/* Encabezado Superior (Header Azul Suave) */}
        <section className="bg-gradient-to-r from-[#eef6ff] to-[#f8fafc] py-8 border-b border-[#e2e8f0]">
          <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
            <div className="text-xs text-[#64748b] mb-4">
              <Link to="/" className="cursor-pointer hover:text-[#005684]">← Voluntarios</Link> <span className="mx-2">/</span> <span className="font-bold text-[#0f2a3f]">{voluntario.nombre_completo}</span> <span className="mx-2">/</span> Perfil verificado
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={getAvatarUrl(voluntario.avatar_url)} alt={voluntario.nombre_completo} className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-white" />
                  {voluntario.is_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                      <img src={Icons.CheckVerifyIcon} alt="Verificado" className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-extrabold text-[#0f2a3f] tracking-tight">{voluntario.nombre_completo}</h1>
                    {voluntario.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-bold text-[#047857]">
                        <img src={Icons.IconVerify} alt="Verificada" className="h-3.5 w-3.5" /> Verificada Oficial
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#005684]">{voluntario.profesion || 'Voluntario Activo'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-medium text-[#64748b]">
                    <span className="flex items-center gap-1"><img src={Icons.UbicacionIcon} className="h-3.5 w-3.5" alt="Ubicación"/> {voluntario.ubicacion || 'Ubicación no especificada'}</span>
                    <span className="flex items-center gap-1">✈️ {voluntario.disponibilidad_viaje === 'Local' ? 'Disponibilidad Local' : 'Dispuesta a viajar (Nivel Nacional)'}</span>
                  </div>
                  {voluntario.id_colegiada && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-[#64748b]">
                      <span>💬 ID Colegiada / Registro: {voluntario.id_colegiada}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-[#005684] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#00456a]">
                  <img src={Icons.MensajeIcon} className="h-4 w-4" alt="Mensaje"/> Contactar Voluntario
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-6 py-3 text-sm font-bold text-[#0f2a3f] shadow-sm transition hover:bg-[#f8fafc]">
                  <img src={Icons.HojaIcon} className="h-4 w-4" alt="Invitar"/> Invitar a proyecto
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Contenido Principal */}
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8 mt-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            
            <div className="flex flex-col gap-6">
              
              {/* Tarjetas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-[#e6f0ff] flex items-center justify-center mb-2">⏳</div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Tiempo disponible</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.tiempo_disponible?.split('/')[0] || 'A convenir'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">Por semana</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-[#e6f0ff] flex items-center justify-center mb-2">📍</div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Disp. de viaje</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.disponibilidad_viaje || 'Móvil total'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">A nivel departamental</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-[#dcfce7] flex items-center justify-center mb-2 text-[#047857]">⚕️</div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Modalidad</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.modalidad_apoyo || 'Presencial'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">En terreno o remota</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center justify-center bg-gradient-to-br from-[#0f2a3f] to-[#005684]">
                   <span className="text-3xl font-extrabold text-white">{voluntario.horas_totales_donadas || 0}</span>
                   <span className="text-[11px] font-bold text-[#cbd5e1] uppercase mt-1">Horas Totales</span>
                   <span className="text-[10px] text-[#94a3b8] mt-1 border-t border-white/20 pt-1">Donadas en plataforma</span>
                </div>
              </div>

              {/* Sobre Mí y Servicios (Dinámicos desde JSONB) */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl"><img src={Icons.PersonsIcon} className="h-6 w-6" alt="Persona"/></span>
                  <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Sobre mí y Servicio que ofrezco</h2>
                </div>
                <p className="text-[14px] leading-relaxed text-[#4a5568] mb-4">
                  {voluntario.sobre_mi || 'Este voluntario aún no ha agregado una descripción.'}
                </p>
                
                {voluntario.servicios_ofrecidos && voluntario.servicios_ofrecidos.length > 0 && (
                  <>
                    <p className="text-[14px] font-bold text-[#0f2a3f] mb-4">Apoyo a directores de fundaciones, hogares e iniciativas mediante:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {voluntario.servicios_ofrecidos.map((servicio: any, i: number) => (
                        <div key={i} className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                          <h3 className="text-sm font-bold text-[#005684] flex items-center gap-2 mb-1">
                            <span className="text-lg">{servicio.icono}</span> {servicio.titulo}
                          </h3>
                          <p className="text-[12px] text-[#64748b] leading-tight">{servicio.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Habilidades */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🛠️</span>
                  <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Habilidades y Especialidades</h2>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {voluntario.habilidades && voluntario.habilidades.length > 0 ? (
                    voluntario.habilidades.map((habilidad: string) => (
                      <span key={habilidad} className="rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#005684] shadow-sm">
                        <span className="text-[#94a3b8] mr-1">●</span> {habilidad}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Aún no se han registrado habilidades específicas.</p>
                  )}
                </div>
              </section>

              {/* Historial de Voluntariado */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-[#e2e8f0] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📜</span>
                    <div>
                      <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Historial de Voluntariado</h2>
                      <p className="text-[13px] font-medium text-[#64748b] mt-0.5">Acreditaciones oficiales certificadas por el protocolo 7:34 AM.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                     <div className="bg-[#f0f9ff] px-3 py-1.5 rounded-lg border border-[#bae6fd]">
                       <span className="block text-[10px] font-bold text-[#0284c7] uppercase">Horas Avaladas</span>
                       <span className="text-lg font-black text-[#0369a1]">{voluntario.horas_totales_donadas || 0}</span>
                     </div>
                     <div className="bg-[#dcfce7] px-3 py-1.5 rounded-lg border border-[#86efac]">
                       <span className="block text-[10px] font-bold text-[#166534] uppercase">Misiones</span>
                       <span className="text-lg font-black text-[#15803d]">{historial.length}</span>
                     </div>
                  </div>
                </div>

                {historial.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aún no hay historial de voluntariado registrado.</p>
                ) : (
                  <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#cbd5e1] before:to-transparent">
                    {historial.map((item, index) => (
                      <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#005684] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs font-bold">
                          {historial.length - index}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] shadow-sm ml-4 md:ml-0 md:group-odd:text-right">
                          <div className="flex flex-col md:flex-row items-start justify-between mb-2 gap-2">
                            <h3 className="font-bold text-[#0f2a3f] text-sm">{item.fundacion_nombre}</h3>
                            <span className="text-[11px] font-bold text-[#005684] bg-[#eef6ff] px-2 py-0.5 rounded-md whitespace-nowrap border border-[#dbeafe]">{item.fecha_texto}</span>
                          </div>
                          <p className="text-[13px] font-bold text-[#0ea5e9] mb-2">{item.rol}</p>
                          <p className="text-[13px] text-[#4a5568] leading-relaxed mb-3">{item.descripcion}</p>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] bg-[#dcfce7] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                            <img src={Icons.IconVerify} className="h-3 w-3" alt="Check" /> {item.certificado_por}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Opiniones */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <div>
                      <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Calificaciones y Opiniones</h2>
                      <p className="text-[13px] font-medium text-[#64748b] mt-0.5">Evaluaciones de directores y coordinadores de fundaciones aliadas.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#0f2a3f]">5.0 <span className="text-[#f59e0b] text-2xl">⭐⭐⭐⭐⭐</span></div>
                    <p className="text-[11px] font-bold text-[#64748b]">Basado en {opiniones.length} reseñas</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {opiniones.length === 0 ? (
                    <p className="text-sm text-gray-500">Este voluntario aún no ha recibido reseñas.</p>
                  ) : (
                    opiniones.map((opinion) => (
                      <div key={opinion.id} className="bg-[#f8fafc] p-5 rounded-xl border border-[#e2e8f0]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {opinion.avatar_autor_url ? (
                               <img src={opinion.avatar_autor_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                               <div className="h-10 w-10 rounded-full bg-[#0f2a3f] text-white flex items-center justify-center font-bold text-sm">
                                  {getInitials(opinion.nombre_autor)}
                               </div>
                            )}
                            <div>
                              <p className="font-bold text-sm text-[#0f2a3f]">{opinion.nombre_autor}</p>
                              <p className="text-xs text-[#64748b]">{opinion.rol_autor}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#94a3b8]">{new Date(opinion.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-[#4a5568] italic">"{opinion.texto_comentario}"</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Derecho */}
            <aside className="flex flex-col gap-6">
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0]">
                <h3 className="flex items-center gap-2 mt-0 mb-4 text-[15px] font-extrabold text-[#0f2a3f] border-b border-[#e2e8f0] pb-3">
                   <img src={Icons.GarantiaIcon} className="h-5 w-5" alt="Garantía"/> Acreditación 7:34 AM
                </h3>
                <ul className="flex flex-col gap-3 text-[13px] text-[#4a5568] font-medium">
                  <li className="flex items-start gap-2"><img src={Icons.CheckVerifyIcon} className="h-4 w-4 mt-0.5" alt="Check"/> Identidad verificada con documento oficial</li>
                  <li className="flex items-start gap-2"><img src={Icons.CheckVerifyIcon} className="h-4 w-4 mt-0.5" alt="Check"/> Registro profesional confirmado</li>
                  <li className="flex items-start gap-2"><img src={Icons.CheckVerifyIcon} className="h-4 w-4 mt-0.5" alt="Check"/> Antecedentes disciplinarios y legales al día</li>
                  <li className="flex items-start gap-2"><img src={Icons.CheckVerifyIcon} className="h-4 w-4 mt-0.5" alt="Check"/> Protocolo de Protección a Menores firmado</li>
                </ul>
                <div className="mt-5 bg-[#eef8ff] border border-[#bae6fd] rounded-xl p-4 flex items-center gap-3">
                   <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#0284c7] shadow-sm shrink-0">🛡️</div>
                   <div>
                     <p className="text-xs font-bold text-[#0369a1]">100% Voluntaria Segura</p>
                     <p className="text-[10px] text-[#0284c7]">Acreditada recientemente</p>
                   </div>
                </div>
              </section>

              {/* Bloques Libres Dinámicos desde JSONB */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0]">
                <h3 className="flex items-center gap-2 mt-0 mb-2 text-[15px] font-extrabold text-[#0f2a3f]">
                   📅 Próximos Bloques Libres
                </h3>
                <p className="text-xs text-[#64748b] mb-4">Horarios preferenciales para asignación inmediata.</p>
                
                <div className="flex flex-col gap-2">
                  {voluntario.bloques_libres && voluntario.bloques_libres.length > 0 ? (
                    voluntario.bloques_libres.map((bloque: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                        <span className="text-[13px] font-bold text-[#0f2a3f] flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${bloque.color || 'bg-blue-500'}`}></span> {bloque.dia}
                        </span>
                        <span className="text-xs font-bold text-[#64748b]">{bloque.horas}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">Sin horarios definidos.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-gradient-to-br from-[#0f2a3f] to-[#005684] p-6 text-white shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-xl">🤝</div>
                  <h3 className="text-lg font-bold">¿Tienes una causa urgente?</h3>
                </div>
                <p className="text-[13px] text-[#cbd5e1] leading-relaxed mb-5">
                  Puedes solicitar acompañamiento directamente a través del equipo de despacho solidario de 7:34 AM.
                </p>
                <button className="w-full bg-white text-[#005684] py-3 rounded-xl font-bold text-sm shadow-sm transition hover:bg-[#f8fafc] flex items-center justify-center gap-2">
                  <img src={Icons.MensajeIcon} className="h-4 w-4" alt="Mensaje"/> Enviar mensaje directo
                </button>
              </section>

            </aside>
          </div>
        </div>

        {/* Sección Más Voluntarios Disponibles */}
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8 mt-16 mb-8">
           <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
             <div>
               <p className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase mb-1">RED COLOMBIA 7:34 AM</p>
               <h2 className="text-2xl font-extrabold text-[#0f2a3f] m-0">Más voluntarios disponibles</h2>
             </div>
             <Link to="/" className="text-sm font-bold text-[#005684] hover:underline flex items-center gap-1">Explorar todo el directorio →</Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {masVoluntarios.map((vol) => (
               <div key={vol.id} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col h-full">
                 <div className="flex items-start gap-3 mb-3">
                   <img src={getAvatarUrl(vol.avatar_url)} className="h-12 w-12 rounded-full object-cover" alt="Avatar"/>
                   <div>
                     <h3 className="text-[15px] font-bold text-[#0f2a3f] flex items-center gap-1">
                       {vol.nombre_completo} {vol.is_verified && <img src={Icons.IconVerify} className="h-3.5 w-3.5" alt="Verificado"/>}
                     </h3>
                     <p className="text-[11px] font-bold text-[#005684] uppercase tracking-wide">{vol.profesion || 'Voluntario Activo'}</p>
                     <p className="text-[11px] text-[#64748b] mt-0.5">📍 {vol.ubicacion}</p>
                   </div>
                 </div>
                 <p className="text-[12px] text-[#4a5568] mb-4 flex-1">{vol.sobre_mi ? `${vol.sobre_mi.substring(0, 100)}...` : 'Ayuda comunitaria general.'}</p>
                 <div className="flex flex-wrap gap-1.5 mb-4">
                     <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-1 rounded-md border border-[#e2e8f0]">{vol.tiempo_disponible?.split('/')[0] || 'Flexible'}</span>
                     <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-1 rounded-md border border-[#e2e8f0]">{vol.modalidad_apoyo || 'Terreno'}</span>
                 </div>
                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#f1f5f9]">
                   <span className="text-[12px] font-bold text-[#f59e0b]">⭐ 4.9</span>
                   <button className="text-[12px] font-bold text-[#005684] hover:underline">Ver perfil</button>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}