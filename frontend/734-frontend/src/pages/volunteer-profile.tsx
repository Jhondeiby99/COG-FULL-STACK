import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';
import { RatingForm } from '../components/RatingForm';

import { Icon } from '../components/Icon';
import { iconoDesdeEmoji } from '../lib/iconos';
import { Estrellas } from '../components/Estrellas';
import type { VoluntarioRow, HistorialVoluntariadoRow, ResenaRow, CertificacionVoluntario, FranjasHorarias } from '../lib/database.types';
export function VolunteerProfile() {
  const { id } = useParams<{ id: string }>();
  const [voluntario, setVoluntario] = useState<VoluntarioRow | null>(null);
  const [historial, setHistorial] = useState<HistorialVoluntariadoRow[]>([]);
  const [opiniones, setOpiniones] = useState<ResenaRow[]>([]);
  const [masVoluntarios, setMasVoluntarios] = useState<VoluntarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Quién mira el perfil: el propio voluntario o un administrador pueden ver perfiles incompletos
  const [puedeVistaPrevia, setPuedeVistaPrevia] = useState(false);

  // Estados interactivos para Modal de Contacto / Invitación
  const [showContactModal, setShowContactModal] = useState(false);
  const [modalMode, setModalMode] = useState<'contacto' | 'invitacion'>('contacto');
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    
    async function fetchVolunteerData() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1. Consulta de Voluntario (Uso seguro de maybeSingle)
      const { data: volData } = await supabase
        .from('voluntarios')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (volData) {
        setVoluntario(volData);

        if (!volData.is_verified) {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          let permitido = uid === volData.id;
          if (uid && !permitido) {
            const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', uid).maybeSingle();
            permitido = perfil?.rol === 'administrador';
          }
          setPuedeVistaPrevia(permitido);
          if (!permitido) {
            setLoading(false);
            return;
          }
        }

        // 2. Traer su Historial
        const { data: histData } = await supabase
          .from('historial_voluntariado')
          .select('*')
          .eq('voluntario_id', volData.id);
        if (histData) setHistorial(histData);

        // 3. Traer sus Reseñas
        const { data: revData } = await supabase
          .from('resenas')
          .select('*')
          .eq('voluntario_id', volData.id)
          .order('created_at', { ascending: false });
        if (revData) setOpiniones(revData);

        // 4. Traer "Más Voluntarios"
        const { data: otrosData } = await supabase
          .from('voluntarios')
          .select('*')
          .neq('id', volData.id)
          .eq('is_verified', true)
          .limit(3);
        if (otrosData) setMasVoluntarios(otrosData);
      }

      setLoading(false);
    }

    fetchVolunteerData();
  }, [id]);

  // Cálculo dinámico de promedio de estrellas
  const recargarOpiniones = async () => {
    if (!voluntario?.id) return;
    const { data } = await supabase
      .from('resenas')
      .select('*')
      .eq('voluntario_id', voluntario.id)
      .order('created_at', { ascending: false });
    if (data) setOpiniones(data);
  };

  const avgRating = useMemo(() => {
    if (!opiniones || opiniones.length === 0) return '—';
    const sum = opiniones.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / opiniones.length).toFixed(1);
  }, [opiniones]);

  // NUEVO: Totalizador de horas
  const totalHorasDonadas = useMemo(() => {
    return voluntario?.horas_totales_donadas || 0;
  }, [voluntario]);

  // Manejo del Modal
  const openModal = (mode: 'contacto' | 'invitacion', initialMsg: string = '') => {
    setModalMode(mode);
    setContactForm((prev) => ({ ...prev, mensaje: initialMsg }));
    setShowContactModal(true);
  };

  
useEffect(() => {
  async function autofillUser() {
    if (showContactModal) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Intentar obtener datos de la fundación o perfil
        const { data: fundacion } = await supabase
          .from('fundaciones')
          .select('nombre_legal, email_institucional')
          .eq('id', user.id)
          .maybeSingle();

        if (fundacion) {
          setContactForm((prev) => ({
            ...prev,
            nombre: prev.nombre || fundacion.nombre_legal || '',
            email: prev.email || fundacion.email_institucional || user.email || ''
          }));
        } else if (user.email) {
          setContactForm((prev) => ({
            ...prev,
            email: prev.email || user.email || ''
          }));
        }
      }
    }
  }
  autofillUser();
}, [showContactModal]);

// Envío del Formulario
const handleContactSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!voluntario) return;
  setContactStatus('loading');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    let senderFundacionId: string | null = null;

    // Si hay usuario logueado, validar si es una Fundación activa
    if (user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

      if (perfil?.rol === 'fundacion') {
        senderFundacionId = user.id;
      }
    }

    // Inserción flexible (funciona para anónimos y logueados)
    const { error } = await supabase.from('mensajes_contacto').insert([{
      fundacion_id: senderFundacionId, // ID de la fundación si está logueada, o null si es visitante/otro
      voluntario_id: voluntario.id,    // Siempre es el destinatario
      nombre_remitente: contactForm.nombre,
      email_remitente: contactForm.email,
      tipo_consulta: modalMode === 'invitacion' ? 'Invitación a Proyecto' : 'Contacto Directo',
      mensaje: contactForm.mensaje
    }]);

    if (error) throw error;

    setContactStatus('success');
    setTimeout(() => {
      setShowContactModal(false);
      setContactStatus('idle');
      setContactForm({ nombre: '', email: '', mensaje: '' });
    }, 2000);
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    const e = err as { code?: string; message?: string };
    setContactError(e.code === 'P0001' && e.message ? e.message : null);
    setContactStatus('error');
  }
};

  // FUNCIÓN PARA ABRIR BASE64 DE FORMA SEGURA
  const handleViewDocument = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        })
        .catch(err => console.error("Error visualizando documento:", err));
    } else {
      window.open(url, '_blank');
    }
  };

  const getAvatarUrl = (url?: string | null) => {
    return url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    const words = name.trim().split(' ');
    return (words[0]?.[0] + (words[1]?.[0] || '')).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center font-bold text-[#005684] bg-[#f4f7fb]">
        Cargando perfil del voluntario...
      </div>
    );
  }

  // Los perfiles incompletos no son públicos: solo su dueño y los administradores los ven
  if (voluntario && !voluntario.is_verified && !puedeVistaPrevia) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#f4f7fb] gap-4 px-4 text-center">
        <Icon name="reloj" className="h-10 w-10 text-[#94a3b8]" />
        <h2 className="text-xl font-bold text-[#0f2a3f]">Perfil en construcción</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Este voluntario aún no ha completado su perfil. Estará disponible cuando registre sus datos, habilidades, horarios y ciudad.
        </p>
        <Link to="/explorar" className="text-sm font-bold text-[#005684] hover:underline">
          ← Volver a explorar
        </Link>
      </div>
    );
  }

  if (!voluntario) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#f4f7fb] gap-4">
        <h2 className="text-xl font-bold text-[#0f2a3f]">Voluntario no encontrado</h2>
        <p className="text-sm text-gray-500">El perfil solicitado no existe o no está registrado.</p>
        <Link to="/explorar" className="text-sm font-bold text-[#005684] hover:underline">
          ← Volver a explorar
        </Link>
      </div>
    );
  }

  // Normalización de datos con fallbacks
  const ubicacionTexto = voluntario.ubicacion || voluntario.ciudad_base || 'Ubicación no especificada';
  const dispViajeTexto = voluntario.disponibilidad_viaje || (voluntario.disponibilidad_viajar ? 'Dispuesta a viajar (Nivel Nacional)' : 'Disponibilidad Local');
  const habilidadesLista = voluntario.habilidades || [];
  // Formateador dinámico de franjas horarias a lista visual
  const formatFranjas = (franjas: FranjasHorarias | null) => {
    if (!franjas) return [];

    const result: { dia: string; horas: string }[] = [];
    const diasMap: Record<string, string> = { 
      lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' 
    };

    ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'].forEach(d => {
      const activas: string[] = [];
      if (franjas.manana?.[d]) activas.push('Mañana (07-12)');
      if (franjas.tarde?.[d]) activas.push('Tarde (13-18)');
      if (franjas.noche?.[d]) activas.push('Noche (18:30-22)');
      if (activas.length > 0) {
        result.push({ dia: diasMap[d], horas: activas.join(', ') });
      }
    });

    return result;
  };

  const horariosLista = formatFranjas(voluntario.franjas_horarias as FranjasHorarias | null);

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#f4f7fb] text-left text-[15px] leading-normal text-[#2d3748] font-sans">
      <Header />

      {!voluntario.is_verified && (
        <div className="bg-[#fffbeb] border-b border-[#fde68a] px-4 py-3 text-center text-xs text-[#92400e]">
          <Icon name="advertencia" size={14} className="mr-1.5" />
          <span className="font-bold">Vista previa:</span> este perfil está incompleto y no es visible para el público.
        </div>
      )}

      <main className="flex-1 pb-12">
        {/* Encabezado Superior */}
        <section className="bg-gradient-to-r from-[#eef6ff] to-[#f8fafc] py-8 border-b border-[#e2e8f0]">
          <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
            <div className="text-xs text-[#64748b] mb-4">
              <Link to="/explorar" className="cursor-pointer hover:text-[#005684]">← Explorar directorio</Link>
              <span className="mx-2">/</span>
              <span className="font-bold text-[#0f2a3f]">{voluntario.nombre_completo}</span>
              <span className="mx-2">/</span>
              Perfil {voluntario.is_verified ? 'completo' : 'incompleto'}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={getAvatarUrl(voluntario.avatar_url)}
                    alt={voluntario.nombre_completo}
                    className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-white"
                  />
                  {voluntario.is_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm" title="Perfil completo">
                      <Icon name="completado" className="text-[#006194] h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-extrabold text-[#0f2a3f] tracking-tight">{voluntario.nombre_completo}</h1>
                    {/* {voluntario.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-bold text-[#047857]">
                        <Icon name="verificado" className="text-[#006194] h-3.5 w-3.5" /> Verificada Oficial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs font-bold text-[#b45309]">
                        En Revisión
                      </span>
                    )} */}
                  </div>
                  <p className="text-sm font-bold text-[#005684]">{voluntario.profesion || 'Voluntario Activo'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-medium text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Icon name="ubicacion" className="text-[#006194] h-3.5 w-3.5" /> {ubicacionTexto}
                    </span>
                    <span className="flex items-center gap-1"><Icon name="viaje" size="1.1em" /> {dispViajeTexto}</span>
                  </div>
                  {voluntario.id_colegiada && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-[#64748b]">
                      <span><Icon name="mensaje" size="1.1em" /> ID Colegiada / Registro: {voluntario.id_colegiada}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openModal('contacto')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#005684] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#00456a]"
                >
                  <Icon name="mensaje" className="h-4 w-4" /> Contactar Voluntario
                </button>
                <button
                  type="button"
                  onClick={() => openModal('invitacion', `Hola ${voluntario.nombre_completo}, nos gustaría invitarte a participar en un proyecto con nuestra organización.`)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-6 py-3 text-sm font-bold text-[#0f2a3f] shadow-sm transition hover:bg-[#f8fafc]"
                >
                  <Icon name="formulario" className="h-4 w-4" /> Invitar a proyecto
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
                  <div className="h-8 w-8 rounded-full bg-[#e6f0ff] flex items-center justify-center mb-2"><Icon name="cargando" size="1.1em" /></div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Tiempo disponible</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.tiempo_disponible?.split('/')[0] || 'A convenir'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">Por semana</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-[#e6f0ff] flex items-center justify-center mb-2"><Icon name="ubicacion" className="text-[#006194]" size="1.1em" /></div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Disp. de viaje</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.disponibilidad_viaje || 'Móvil total'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">A nivel departamental</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-[#dcfce7] flex items-center justify-center mb-2 text-[#047857]"><Icon name="salud" size="1.1em" /></div>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Modalidad</span>
                  <span className="text-[15px] font-extrabold text-[#0f2a3f] mt-1">{voluntario.modalidad_apoyo || 'Presencial'}</span>
                  <span className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">En terreno o remota</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center justify-center bg-gradient-to-br from-[#0f2a3f] to-[#005684]">
                  <span className="text-3xl font-extrabold text-white">{totalHorasDonadas}</span>
                  <span className="text-[11px] font-bold text-[#cbd5e1] uppercase mt-1">Horas Totales</span>
                  <span className="text-[10px] text-[#94a3b8] mt-1 border-t border-white/20 pt-1">Donadas en plataforma</span>
                </div>
              </div>

              {/* Sobre Mí y Servicios */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">
                    <Icon name="voluntarios" className="h-6 w-6" />
                  </span>
                  <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Sobre mí y Certificaciones</h2>
                </div>
                <p className="text-[14px] leading-relaxed text-[#4a5568] mb-4">
                  {voluntario.sobre_mi || voluntario.presentacion_civica || 'Este voluntario aún no ha agregado una descripción.'}
                </p>

                {voluntario.servicios_ofrecidos && Array.isArray(voluntario.servicios_ofrecidos) && voluntario.servicios_ofrecidos.length > 0 && (
                  <>
                    <p className="text-[14px] font-bold text-[#0f2a3f] mb-4">Certificaciones y documentos registrados:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(voluntario.servicios_ofrecidos as unknown as CertificacionVoluntario[]).map((servicio, i: number) => (
                        <div key={i} className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                          <h3 className="text-sm font-bold text-[#005684] flex items-center gap-2 mb-1">
                            <span className="text-lg"><Icon name={iconoDesdeEmoji(servicio.icono, 'documento')} size="1.1em" /></span> {servicio.titulo || 'Certificación'}
                          </h3>
                          {servicio.descripcion && <p className="text-[12px] text-[#64748b] leading-tight mb-2">{servicio.descripcion}</p>}
                          
                          {/* BOTÓN PÚBLICO PARA VER EL DOCUMENTO ADJUNTO */}
                          {servicio.archivo_url && (
                            <button 
                              type="button"
                              onClick={() => handleViewDocument(servicio.archivo_url ?? '')} 
                              className="inline-flex items-center gap-1.5 mt-2 bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#e0f2fe] transition cursor-pointer"
                            >
                              <span><Icon name="ver" size="1.1em" /></span> Ver documento adjunto
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Habilidades */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl"><Icon name="herramientas" size="1.1em" /></span>
                  <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Habilidades y Especialidades</h2>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {habilidadesLista.length > 0 ? (
                    habilidadesLista.map((habilidad, idx: number) => (
                      <span key={idx} className="rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#005684] shadow-sm">
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
                    <span className="text-xl"><Icon name="certificado" size="1.1em" /></span>
                    <div>
                      <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Historial de Voluntariado</h2>
                      <p className="text-[13px] font-medium text-[#64748b] mt-0.5">Certificaciones y títulos registrados por el voluntario.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="bg-[#f0f9ff] px-3 py-1.5 rounded-lg border border-[#bae6fd]">
                      <span className="block text-[10px] font-bold text-[#0284c7] uppercase">Horas Avaladas</span>
                      <span className="text-lg font-black text-[#0369a1]">{totalHorasDonadas}</span>
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
                  <div className="flex flex-col gap-4">
                    {historial.map((item, index) => (
                      <div key={item.id || index} className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] shadow-sm">
                        <div className="flex flex-col md:flex-row items-start justify-between mb-2 gap-2">
                          <h3 className="font-bold text-[#0f2a3f] text-sm">{item.fundacion_nombre}</h3>
                          <span className="text-[11px] font-bold text-[#005684] bg-[#eef6ff] px-2 py-0.5 rounded-md whitespace-nowrap border border-[#dbeafe]">
                            {item.fecha_texto || 'Reciente'}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-[#0ea5e9] mb-2">{item.rol}</p>
                        <p className="text-[13px] text-[#4a5568] leading-relaxed mb-3">{item.descripcion}</p>
                        {item.certificado_por && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] bg-[#dcfce7] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                            <Icon name="verificado" className="text-[#006194] h-3 w-3" /> {item.certificado_por}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Opiniones Dinámicas */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl"><Icon name="calificacion" size="1.1em" filled /></span>
                    <div>
                      <h2 className="m-0 text-xl font-extrabold text-[#0f2a3f]">Calificaciones y Opiniones</h2>
                      <p className="text-[13px] font-medium text-[#64748b] mt-0.5">Evaluaciones de fundaciones y usuarios registrados en la plataforma.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#0f2a3f]">
                      {avgRating} <span className="text-[#f59e0b] text-2xl"><Icon name="calificacion" size="1.1em" filled /></span>
                    </div>
                    <p className="text-[11px] font-bold text-[#64748b]">Basado en {opiniones.length} reseña{opiniones.length === 1 ? '' : 's'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {voluntario?.id && <RatingForm voluntarioId={voluntario.id} onChange={recargarOpiniones} />}
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
                              <p className="text-xs text-[#64748b]">{opinion.rol_autor || 'Coordinación'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-[#94a3b8] block">
                              {opinion.created_at ? new Date(opinion.created_at).toLocaleDateString() : ''}
                            </span>
                            <Estrellas valor={opinion.rating || 5} size={12} />
                          </div>
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
                  <Icon name="usuario" className="h-5 w-5" /> Estado del perfil
                </h3>
                <ul className="flex flex-col gap-3 text-[13px] text-[#4a5568] font-medium">
                  <li className="flex items-start gap-2">
                    <Icon name={voluntario.is_verified ? 'completado' : 'reloj'} className={`h-4 w-4 mt-0.5 ${voluntario.is_verified ? 'text-[#006194]' : 'text-[#94a3b8]'}`} />
                    {voluntario.is_verified ? 'Perfil completo: datos, habilidades, horarios y ciudad registrados' : 'Perfil en construcción'}
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-[#94a3b8]">
                    <Icon name="info" className="h-4 w-4 mt-0.5" /> Los datos y certificaciones son registrados por el propio voluntario.
                  </li>
                  {/* <li className="flex items-start gap-2">
                    <Icon name="completado" className="text-[#006194] h-4 w-4 mt-0.5" /> Registro profesional confirmado
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="completado" className="text-[#006194] h-4 w-4 mt-0.5" /> Antecedentes disciplinarios y legales al día
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="completado" className="text-[#006194] h-4 w-4 mt-0.5" /> Protocolo de Protección a Menores firmado
                  </li> */}
                </ul>
                {/* <div className="mt-5 bg-[#eef8ff] border border-[#bae6fd] rounded-xl p-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#0284c7] shadow-sm shrink-0"><Icon name="seguridad" size="1.1em" /></div>
                  <div>
                    <p className="text-xs font-bold text-[#0369a1]">100% Voluntaria Segura</p>
                    <p className="text-[10px] text-[#0284c7]">Acreditada recientemente</p>
                  </div>
                </div> */}
              </section>

              {/* Bloques Libres Dinámicos */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0]">
                <h3 className="text-[15px] font-extrabold text-[#0f2a3f] mb-2"><Icon name="calendario" size="1.1em" /> Bloques y Franjas Disponibles</h3>
                <div className="flex flex-col gap-2">
                  {horariosLista.length > 0 ? (
                    horariosLista.map((item, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                      <span className="text-xs font-bold text-[#0f2a3f]">● {item.dia}</span>
                      <span className="text-xs font-bold text-[#0284c7]">{item.horas}</span>
                    </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center">Sin horarios definidos.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-gradient-to-br from-[#0f2a3f] to-[#005684] p-6 text-white shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-xl"><Icon name="alianza" size="1.1em" /></div>
                  <h3 className="text-lg font-bold">¿Tienes una causa urgente?</h3>
                </div>
                <p className="text-[13px] text-[#cbd5e1] leading-relaxed mb-5">
                  Puedes solicitar acompañamiento directamente a través del equipo de despacho solidario de 7:34 AM.
                </p>
                <button
                  type="button"
                  onClick={() => openModal('contacto', 'Solicitud urgente de apoyo comunitario desde la plataforma.')}
                  className="w-full bg-white text-[#005684] py-3 rounded-xl font-bold text-sm shadow-sm transition hover:bg-[#f8fafc] flex items-center justify-center gap-2"
                >
                  <Icon name="mensaje" className="h-4 w-4" /> Enviar mensaje directo
                </button>
              </section>
            </aside>
          </div>
        </div>

        {/* Sección Más Voluntarios Disponibles */}
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8 mt-16 mb-8">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
            <div>
              <p className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase mb-1">7:34 AM</p>
              <h2 className="text-2xl font-extrabold text-[#0f2a3f] m-0">Más voluntarios disponibles</h2>
            </div>
            <Link to="/explorar" className="text-sm font-bold text-[#005684] hover:underline flex items-center gap-1">
              Explorar todo el directorio →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {masVoluntarios.map((vol) => (
              <div key={vol.id} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <img src={getAvatarUrl(vol.avatar_url)} className="h-12 w-12 rounded-full object-cover" alt="Avatar" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0f2a3f] flex items-center gap-1">
                      {vol.nombre_completo}
                      {vol.is_verified && <Icon name="completado" className="text-[#006194] h-3.5 w-3.5" label="Perfil completo" />}
                    </h3>
                    <p className="text-[11px] font-bold text-[#005684] uppercase tracking-wide">{vol.profesion || 'Voluntario Activo'}</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5"><Icon name="ubicacion" className="text-[#006194]" size="1.1em" /> {vol.ubicacion || vol.ciudad_base || 'Colombia'}</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#4a5568] mb-4 flex-1">
                  {vol.sobre_mi ? `${vol.sobre_mi.substring(0, 100)}...` : 'Ayuda comunitaria general.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                    {vol.tiempo_disponible?.split('/')[0] || 'Flexible'}
                  </span>
                  <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                    {vol.modalidad_apoyo || 'Terreno'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#f1f5f9]">
                  <span className="text-[12px] font-bold text-[#f59e0b]"><Icon name="calificacion" size="1.1em" filled /> 5.0</span>
                  <Link to={`/voluntario/${vol.id}`} className="text-[12px] font-bold text-[#005684] hover:underline">
                    Ver perfil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal interactivo de Contacto / Invitación */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-[#0f2a3f]">
                {modalMode === 'invitacion' ? 'Invitar a Proyecto' : 'Contactar Voluntario'}
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                <Icon name="cerrar" size="1.1em" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Tu Nombre / Organización</label>
                <input
                  type="text"
                  required
                  value={contactForm.nombre}
                  onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                  placeholder="Ej. Fundación Esperanza"
                  className="w-full text-xs px-3 py-2 bg-[#f4f7fc] border border-gray-200 rounded-lg focus:outline-none focus:border-[#005684]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Correo Electrónico de Contacto</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="contacto@organizacion.org"
                  className="w-full text-xs px-3 py-2 bg-[#f4f7fc] border border-gray-200 rounded-lg focus:outline-none focus:border-[#005684]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Mensaje / Detalle del Proyecto</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.mensaje}
                  onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#f4f7fc] border border-gray-200 rounded-lg focus:outline-none focus:border-[#005684] resize-none"
                />
              </div>

              {contactStatus === 'success' && (
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2 rounded text-center">
                  ¡Mensaje enviado con éxito!
                </p>
              )}
              {contactStatus === 'error' && (
                <p className="text-xs font-bold text-red-600 text-center">
                  {contactError || 'Ocurrió un error al enviar la solicitud.'}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contactStatus === 'loading'}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#005684] rounded-lg hover:bg-[#00456a] disabled:opacity-50"
                >
                  {contactStatus === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}