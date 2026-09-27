import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Link,useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';
import * as Icons from "../assets/icons/index.ts";

// Estilos de prioridad (Se mantienen de la maqueta)
const PRIORITY_STYLES = {
  alta: { label: 'Alta Prioridad', className: 'bg-[#fee2e2] text-[#991b1b]', bar: 'bg-[#e53e3e]', dot: 'bg-[#e53e3e]' },
  media: { label: 'Media Prioridad', className: 'bg-[#e0e7ff] text-[#3730a3]', bar: 'bg-[#553c9a]', dot: 'bg-[#3182ce]' },
  baja: { label: 'Baja Prioridad', className: 'bg-[#dcfce7] text-[#166534]', bar: 'bg-[#38a169]', dot: 'bg-[#047857]' },
};

type PriorityFilter = 'todas' | 'alta' | 'media' | 'baja';

export function FoundationProfile() {
  const { id } = useParams();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');
  
  // Estados Dinámicos
  const [fundacion, setFundacion] = useState<any>(null);
  const [necesidades, setNecesidades] = useState<any[]>([]);
  const [galeria, setGaleria] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Formulario de Contacto
  const [formData, setFormData] = useState({ nombre: '', email: '', tipo: 'donaciones', mensaje: '' });
  const [msgStatus, setMsgStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  useEffect(() => {
    async function fetchProfileData() {
      // 1. Traer la primera fundación aprobada (En producción esto se haría por el ID de la URL)
      const { data: fundData } = await supabase
        .from('fundaciones')
        .select('*')
        .eq('estado', 'aprobada')
        .eq('id', id)
        .limit(1)
        .single();

      if (fundData) {
        setFundacion(fundData);

        // 2. Traer sus Necesidades
        const { data: reqData } = await supabase.from('necesidades').select('*').eq('fundacion_id', fundData.id);
        if (reqData) setNecesidades(reqData);

        // 3. Traer su Galería
        const { data: galData } = await supabase.from('galeria_fundaciones').select('*').eq('fundacion_id', fundData.id);
        if (galData) setGaleria(galData);

        // 4. Traer sus Reseñas
        const { data: revData } = await supabase.from('resenas').select('*').eq('fundacion_id', fundData.id);
        if (revData) setResenas(revData);
      }
      setLoading(false);
    }
    fetchProfileData();
  }, [id]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundacion) return;
    setMsgStatus('loading');
    
    const { error } = await supabase.from('mensajes_contacto').insert([{
      fundacion_id: fundacion.id,
      nombre_remitente: formData.nombre,
      email_remitente: formData.email,
      tipo_consulta: formData.tipo,
      mensaje: formData.mensaje
    }]);

    if (error) {
      setMsgStatus('error');
    } else {
      setMsgStatus('success');
      setFormData({ nombre: '', email: '', tipo: 'donaciones', mensaje: '' });
      setTimeout(() => setMsgStatus('idle'), 3000);
    }
  };

  const visibleNeeds = useMemo(() => {
    if (priorityFilter === 'todas') return necesidades;
    return necesidades.filter((need) => need.prioridad === priorityFilter);
  }, [priorityFilter, necesidades]);

  if (loading) return <div className="min-h-svh flex items-center justify-center">Cargando perfil...</div>;
  if (!fundacion) return <div className="min-h-svh flex items-center justify-center">Fundación no encontrada</div>;

  // Helpers visuales
  const initials = fundacion.nombre_legal.replace('Fundación', '').replace('Corporación', '').trim().substring(0, 2).toUpperCase();
  const heroImage = fundacion.foto_portada_url && fundacion.foto_portada_url.trim() !== '' ? fundacion.foto_portada_url : 'https://images.unsplash.com/photo-1593113563332-f36e4b9317b6?auto=format&fit=crop&w=1920&q=80';

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#f8fafc] text-left text-[15px] leading-normal text-[#2d3748] font-sans">
      <SiteHeader />

      <main className="flex-1 pb-12">
        {/* Hero Section */}
        <section className="relative h-[280px] overflow-hidden md:h-[360px] bg-[#0f2a3f]">
          <img src={heroImage} alt="Portada de la fundación" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </section>

        <div className="relative w-full flex justify-center px-4 md:px-8">
          <div className="w-full max-w-[1240px]">
            
            {/* Tarjeta Perfil Header */}
            <section style={{ marginBottom: '2.5rem' }} className="relative z-20 -mt-16 md:-mt-24 mb-[40px] rounded-3xl bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-gray-100 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
                  
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2 shadow-md md:size-28">
                    {fundacion.logo_url ? (
                       <img src={fundacion.logo_url} className="w-full h-full object-contain rounded-xl" alt="Logo" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#e6f0ff] text-2xl font-bold text-[#005684] md:text-3xl">
                        {initials}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h1 className="!m-0 !text-3xl !font-bold !text-[#071d37] !md:text-3xl !tracking-tight">
                        {fundacion.nombre_legal}
                      </h1>
                      {fundacion.estado === 'aprobada' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6ff] px-2.5 py-0.5 text-xs font-bold text-[#005684]">
                          <img src={Icons.IconVerify} alt="Verificado" className="size-3.5" /> Verificada Oficial
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#64748b] md:text-sm">
                      <span className="flex items-center gap-1"><span className="opacity-60"><img src={Icons.NitIcon} alt="NIT"/></span> NIT: {fundacion.nit}</span>
                      <span className="flex items-center gap-1"><span className="text-blue-500"><img src={Icons.UbicacionIcon} alt="Ubicación"/></span> {fundacion.ubicacion}</span>
                      <span className="flex items-center gap-1 text-[#047857] font-bold"><span><img src={Icons.CheckVerifyIcon} alt="Vigente"/></span> RUT y Personería Vigente</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {fundacion.areas_impacto?.map((tag: string) => (
                        <span key={tag} className="rounded-full bg-[#e8f4fd] px-4 py-1.5 text-xs font-bold text-[#005684]">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                  <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-[#e8f2ff] px-5 py-2.5 text-sm font-bold text-[#005684] transition hover:bg-[#d4e7fe] flex-1 sm:flex-none">
                    <span><img src={Icons.MensajeIcon} alt='Contacto'/></span> Contactar
                  </button>
                  <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#005684] transition hover:bg-[#d4e7fe]">
                    <span className="text-sm"><img src={Icons.CompartirIcon} alt='Compartir'/></span>
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-[#005684] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#00456a] flex-1 sm:flex-none">
                    <span><img src={Icons.ManoIcon} alt='Donar'/></span> Donar ahora
                  </button>
                </div>
              </div>
            </section>

           {/* Estadísticas */}
            <div style={{ marginBottom: '2.5rem' }}  className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Trayectoria" value={fundacion.anos_operacion?.toString() || "0"} unit="años continuos" hint="Operación certificada" icon={Icons.TrayectoriaIcon} />
              <Stat label="Población Activa" value={fundacion.familias_acompanadas?.toString() || "0"} unit="beneficiarios" hint="En territorio" hintColor="text-[#10b981]" icon={Icons.PersonsIcon} />
              <Stat label="Reputación Social" value="4.9" unit="⭐⭐⭐⭐⭐" hint={`${resenas.length} opiniones auditadas`} icon={Icons.StarIcon} />
              <Stat label="Efectividad" value={fundacion.necesidades_resueltas?.toString() || "0"} unit="necesidades resueltas" hint="100% rendición verificada" hintColor="text-[#005684] font-bold" icon={Icons.CheckVerifyIcon} />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              
              {/* Columna Izquierda */}
              <div className="flex flex-col gap-8">
                
                {/* Sobre Nosotros */}
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏢</span>
                    <h2 className="m-0 text-xl font-extrabold !text-[#0B1C30]">Sobre nosotros y Territorio</h2>
                  </div>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4a5568]">
                    {fundacion.descripcion || 'Esta fundación aún no ha publicado su descripción institucional.'}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <InfoChip icon={Icons.EntidadIcon} title="Tipo de entidad" value="Fundación sin ánimo de lucro" />
                    <InfoChip icon="⚖️" title="Cobertura legal" value="Registro Cámara de Comercio" />
                    <InfoChip icon={Icons.IconVerify} title="Confianza" value="Comité de transparencia 7:34 AM" />
                  </div>

                  <div className="mt-8 flex items-center gap-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                    <TransparencyRing value={fundacion.indice_transparencia || 0} />
                    <div>
                      <p className="m-0 text-[15px] font-extrabold text-[#0f2a3f]">{fundacion.indice_transparencia}% Índice de transparencia</p>
                      <p className="mt-1 mb-0 text-sm text-[#718096] leading-snug">
                        Reportes de rendición publicados cada trimestre y necesidades auditadas por el comité.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Necesidades */}
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#e2e8f0] pb-4">
                    <div>
                      <h2 className="m-0 text-xl font-extrabold !text-[#0B1C30]">Necesidades publicadas</h2>
                      <p className="mt-1 mb-0 text-sm font-medium text-[#718096]">Requerimientos verificados para esta fundación en territorio.</p>
                    </div>
                    <div className="!flex !flex-wrap !gap-2 !rounded-lg !bg-[#f0f4f8] !p-1.5">
                      {(['todas', 'alta', 'media', 'baja'] as const).map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPriorityFilter(id)}
                          className={`!rounded-md !px-4 !py-1.5 !text-xs !font-bold !transition capitalize ${
                            priorityFilter === id ? '!bg-white !text-[#005684] !shadow-sm' : '!text-[#64748b] !hover:text-[#0f2a3f]'
                          }`}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="!flex !flex-col !gap-5">
                    {visibleNeeds.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay necesidades publicadas con esta prioridad.</p>
                    ) : (
                      visibleNeeds.map((need) => <NeedCard key={need.id} need={need} />)
                    )}
                  </div>
                </section>

                {/* Galería */}
                <section className="!rounded-2xl !bg-white !p-6 !shadow-sm !border !border-[#e2e8f0] !md:p-8">
                  <h2 className="!m-0 !text-xl !font-extrabold !text-[#0f2a3f] !mb-1">Galería de actividades en terreno</h2>
                  <p className="!mb-6 !text-sm !font-medium !text-[#718096]">Jornadas recientes de nutrición, educación y acompañamiento familiar.</p>
                  
                  {galeria.length === 0 ? (
                    <p className="text-sm text-gray-500">Esta fundación aún no ha subido fotografías de sus actividades.</p>
                  ) : (
                    <div className="!grid !grid-cols-2 !gap-4 !md:grid-cols-4">
                      {galeria.map((photo) => (
                        <div key={photo.id} className="!group !relative !overflow-hidden !rounded-xl bg-gray-100">
                          <img
                            src={photo.imagen_url}
                            alt={photo.alt_texto}
                            className="!h-32 !w-full !object-cover !transition-transform !duration-300 !group-hover:scale-110 !md:h-36"
                          />
                          <div className="!absolute !inset-0 !bg-black/10 !transition-opacity !group-hover:opacity-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Reseñas */}
                <section className="!rounded-2xl !bg-white !p-6 !shadow-sm !border !border-[#e2e8f0] !md:p-8">
                  <div className="!mb-6 !flex !items-center !justify-between !border-b !border-[#e2e8f0] !pb-4">
                    <h2 className="!m-0 !text-xl !font-extrabold !text-[#0f2a3f]">Calificaciones y comentarios</h2>
                    <div className="!flex !items-center !gap-2">
                      <span className="!text-xl !font-black !text-[#005684]">4.9</span>
                      <span className="!text-[#f59e0b] text-lg">★</span>
                    </div>
                  </div>
                  <div className="!flex !flex-col !gap-6">
                    {resenas.length === 0 ? (
                       <p className="text-sm text-gray-500">Aún no hay reseñas para esta fundación.</p>
                    ) : (
                      resenas.map((review) => (
                        <article key={review.id} className="!flex !gap-4 !border-b !border-[#f1f5f9] !pb-6 !last:border-0 !last:pb-0">
                          <img src={review.avatar_autor_url || 'https://i.pravatar.cc/150'} alt="" className="!size-12 !rounded-full !object-cover !shadow-sm" />
                          <div className="!min-w-0 !flex-1">
                            <div className="!flex !flex-wrap !items-center !justify-between !gap-2">
                              <h3 className="!m-0 !text-[15px] !font-bold !text-[#0f2a3f]">{review.nombre_autor}</h3>
                              <span className="!text-xs !font-medium !text-[#94a3b8]">Verificado</span>
                            </div>
                            <p className="!mt-0.5 !mb-1.5 !text-xs !font-bold !text-[#005684] !uppercase !tracking-wide">{review.rol_autor}</p>
                            <p className="!m-0 !text-sm !text-[#f59e0b] !tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                            <p className="!mt-2.5 !mb-0 !text-sm !leading-relaxed !text-[#4a5568]">{review.texto_comentario}</p>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* Columna Derecha (Sidebar) */}
              <aside className="flex flex-col gap-6 top-24 h-fit">
                
              {/* Tarjeta de Contacto */}
              <section className="rounded-3xl bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]">
                    <span className="text-lg"><img src={Icons.EnviarIcon} alt="Enviar"/></span> 
                  </div>
                  <div>
                    <h3 className="m-0 text-[15px] font-bold text-[#071d37]">Contacto Directo</h3>
                    <p className="m-0 text-xs text-[#64748b] mt-0.5">Respuesta promedio en menos de 4 horas</p>
                  </div>
                </div>

                <form className="flex flex-col gap-3.5" onSubmit={handleContactSubmit}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Nombre completo</label>
                    <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. María Fernanda Ospina" className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] text-[#2d3748] font-medium" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Correo electrónico</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="maria@ejemplo.com" className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] text-[#2d3748] font-medium" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Tipo de consulta</label>
                    <div className="relative">
                      <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] text-[#2d3748] font-medium appearance-none cursor-pointer">
                        <option value="donaciones">Quiero entregar donaciones físicas</option>
                        <option value="voluntariado">Quiero ser voluntario</option>
                        <option value="informacion">Solicitar información institucional</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Mensaje</label>
                    <textarea required value={formData.mensaje} onChange={e => setFormData({...formData, mensaje: e.target.value})} placeholder="¿Cómo te gustaría colaborar?" rows={3} className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] text-[#2d3748] font-medium resize-none" />
                  </div>

                  {msgStatus === 'success' && <p className="text-xs font-bold text-green-600 bg-green-50 p-2 rounded-lg text-center">¡Mensaje enviado con éxito!</p>}
                  {msgStatus === 'error' && <p className="text-xs font-bold text-red-600 text-center">Hubo un error al enviar.</p>}

                  <button type="submit" disabled={msgStatus === 'loading'} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#005684] py-3 rounded-xl hover:bg-[#00456a] transition-all shadow-sm mt-1 disabled:opacity-50">
                    <span><img src={Icons.EnviarIconWhite} alt="Enviar"/></span> {msgStatus === 'loading' ? 'Enviando...' : 'Enviar mensaje a coordinación'}
                  </button>
                </form>

                <div className="border-t border-gray-100/80 my-1" />

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]"><span className="text-xs"><img src={Icons.PhoneIcon}/></span></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Línea Verificada</span>
                      <span className="text-xs font-bold text-[#071d37] mt-0.5">{fundacion.telefono || 'No registrado'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]"><span className="text-xs"><img src={Icons.CorreoIcon}/></span></div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Correo Institucional</span>
                      <span className="text-xs font-bold text-[#071d37] mt-0.5 truncate">{fundacion.email_institucional}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]"><span className="text-xs"><img src={Icons.UbicacionIcon}/></span></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Sede de Acopio y Atención</span>
                      <span className="text-xs font-bold text-[#475569] mt-0.5 leading-normal">{fundacion.direccion_fisica || fundacion.ubicacion}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100/80 mt-1" />
                <div className="flex items-center justify-between w-full pt-1">
                  <span className="text-xs font-bold text-[#475569]">Canales digitales:</span>
                  <div className="flex items-center gap-2">
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs"><img src={Icons.CameraIcon}/></button>
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs"><img src={Icons.MundoIcon}/></button>
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs"><img src={Icons.RedIcon}/></button>
                  </div>
                </div>
              </section>

                <SidebarCard title="Ubicación en territorio">
                  <div className="overflow-hidden rounded-xl border border-[#e2e8f0] shadow-sm bg-gray-100 flex items-center justify-center h-48 relative">
                    <iframe title="Mapa" className="absolute inset-0 h-full w-full border-0" src="https://www.openstreetmap.org/export/embed.html?bbox=-74.075%2C4.630%2C-74.045%2C4.655&layer=mapnik&marker=4.643%2C-74.063" loading="lazy" />
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-[#005684]"><img src={Icons.UbicacionIcon}/></span>
                    <p className="m-0 text-sm font-medium text-[#475569]">{fundacion.ubicacion}<br/><span className="text-xs text-[#94a3b8]">Colombia</span></p>
                  </div>
                </SidebarCard>
                
                <div className="rounded-3xl bg-[#f4f7fc] p-6 border border-transparent flex gap-4 items-start w-full max-w-[380px]">
                  <div className="text-[#005684] shrink-0 mt-0.5 bg-transparent size-8 rounded-xl flex items-center justify-center">
                    <span className="text-base font-bold"><img className="w-[16px] h-[20px]" src={Icons.IconVerify}/></span> 
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="m-0 text-[15px] font-bold text-[#071d37] tracking-tight">Validado por 7:34 AM</h4>
                    <p className="m-0 text-xs leading-relaxed text-[#475569] font-medium">Esta organización fue auditada fiscal y territorialmente. Cumple con la trazabilidad digital de recursos.</p>
                  </div>
                </div>

              </aside>
            </div>
          </div>
        </div>
      </main>

      <section className="bg-[#0f2a3f] px-10 py-10 text-white mt-auto">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="m-0 text-2xl font-extrabold text-white">¿Deseas convocar voluntarios o publicar una causa?</h2>
            <p className="mt-2 mb-0 text-[15px] text-[#cbd5e1]">Suma tu organización a la red nacional y visibiliza necesidades verificadas de forma transparente.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/SignUp" className="rounded-lg bg-[#FFFFFF] px-6 py-3 text-center text-[15px] font-bold !text-black no-underline shadow-md whitespace-nowrap">Registrarme ahora</Link>
            <Link to="/" className="rounded-lg bg-[#007BB9] border border-white/20 px-6 py-3 text-center text-[15px] font-bold !text-white no-underline whitespace-nowrap">Volver al inicio</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() { return <Header />; }
function SiteFooter() { return <Footer />; }

function Stat({ value, label, unit, hint, hintColor = "text-[#64748b]", icon }: any) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs font-semibold text-[#64748b] tracking-tight">{label}</span>
        <div className="text-sm opacity-80 shrink-0"><img src={icon}/></div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-bold text-[#071d37] tracking-tight">{value}</span>
        <span className="text-xs font-medium text-[#475569]">{unit}</span>
      </div>
      <p className={`m-0 text-xs ${hintColor} tracking-normal`}>{hint}</p>
    </div>
  );
}

function InfoChip({ icon, title, value }: any) {
  return (
    <div className="flex flex-col rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg"><img src={icon}/></span>
        <p className="m-0 text-[11px] font-extrabold tracking-wider text-[#005684] uppercase">{title}</p>
      </div>
      <p className="m-0 text-sm font-bold text-[#0f2a3f]">{value}</p>
    </div>
  );
}

function SidebarCard({ title, children }: any) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0]">
      <h3 className="mt-0 mb-4 text-[15px] font-extrabold text-[#0f2a3f] border-b border-[#e2e8f0] pb-3">{title}</h3>
      {children}
    </section>
  );
}

function TransparencyRing({ value }: { value: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative size-[80px] shrink-0">
      <svg viewBox="0 0 80 80" className="size-[80px] -rotate-90 drop-shadow-sm">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#005684" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-black text-[#0f2a3f]">{value}%</span>
    </div>
  );
}

function NeedCard({ need }: any) {
  const style = PRIORITY_STYLES[need.prioridad as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.media;
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:shadow-md">
      <span className={`absolute inset-x-0 top-0 h-1.5 ${style.dot}`} />
      <div className="mb-3 mt-1 flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.className}`}>{style.label}</span>
        <span className="text-xs font-semibold text-[#94a3b8]">⏱️ Reciente</span>
      </div>
      <h3 className="m-0 text-base font-extrabold text-[#0f2a3f] leading-snug">{need.titulo}</h3>
      <p className="mt-2 mb-4 text-sm leading-relaxed text-[#4a5568]">{need.descripcion}</p>
      
      <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-4">
        <div className="mb-2.5 flex justify-between text-xs font-bold text-[#475569]">
          <span>Categoría: <span className="text-[#005684]">{need.categoria}</span></span>
          <span>Recaudado: {need.porcentaje_recaudado}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${need.porcentaje_recaudado}%` }} />
        </div>
        <p className="mt-2 mb-0 text-right text-xs font-semibold text-[#64748b]">{need.meta_texto}</p>
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#047857]">
          <img src={Icons.IconVerify} alt="Verificado" className="size-3.5" /> Verificada
        </span>
        <button type="button" className="rounded-full bg-[#005684] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#00456a]">
          Apoyar esta necesidad →
        </button>
      </div>
    </article>
  );
}