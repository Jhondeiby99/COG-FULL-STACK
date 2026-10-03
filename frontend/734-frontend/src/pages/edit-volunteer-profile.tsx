import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";

interface Certificacion {
  id: string;
  titulo: string;
  entidad_folio: string;
  verificado: boolean;
  icono?: string;
  archivo_url?: string;
}

interface HistorialMision {
  id: string;
  voluntario_id?: string;
  fundacion_nombre: string;
  rol: string;
  fecha_texto?: string;
  descripcion?: string;
  certificado_por?: string;
}

interface ResenaData {
  id: string;
  fundacion_id?: string;
  voluntario_id?: string;
  nombre_autor: string;
  rol_autor?: string;
  avatar_autor_url?: string;
  rating?: number;
  texto_comentario?: string;
  created_at?: string;
}

interface HorariosFranjas {
  manana: Record<string, boolean>;
  tarde: Record<string, boolean>;
  noche: Record<string, boolean>;
}

const defaultHorarios: HorariosFranjas = {
  manana: { lun: false, mar: false, mie: false, jue: false, vie: false, sab: false, dom: false },
  tarde: { lun: false, mar: false, mie: false, jue: false, vie: false, sab: false, dom: false },
  noche: { lun: false, mar: false, mie: false, jue: false, vie: false, sab: false, dom: false },
};

const SUGERENCIAS_HABILIDADES = [
  'Primeros Auxilios',
  'Atención Médica',
  'Psicología Cívica',
  'Logística y Transporte',
  'Docencia y Talleres',
  'Nutrición Comunitaria',
  'Gestión de Riesgos',
  'Trabajo Social'
];

export function EditVolunteerProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFirstVerificationModal, setShowFirstVerificationModal] = useState(false);

  const [volunteerId, setVolunteerId] = useState<string | null>(id || null);

  const [disponibilidadActiva, setDisponibilidadActiva] = useState(true);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [ciudadBase, setCiudadBase] = useState('');
  const [radio, setRadio] = useState(35);
  const [viajar, setViajar] = useState(true);
  const [tiempoDisponible, setTiempoDisponible] = useState('0 hrs/semana');
  const [modalidadApoyo, setModalidadApoyo] = useState('Presencial');
  const [horasObjetivoMensual, setHorasObjetivoMensual] = useState(16);
  const [horasTotalesDonadas, setHorasTotalesDonadas] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [nuevaHabilidadInput, setNuevaHabilidadInput] = useState('');

  const [horarios, setHorarios] = useState<HorariosFranjas>(defaultHorarios);
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [historial, setHistorial] = useState<HistorialMision[]>([]);
  const [resenas, setResenas] = useState<ResenaData[]>([]);

  const markUnsaved = () => setHasUnsavedChanges(true);

  const mostrarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const evaluarSeccionesCompletas = () => {
    const sec01 = nombreCompleto.trim() !== '' && titulo.trim() !== '' && presentacion.trim() !== '';
    const sec02 = habilidades.length > 0;
    const tieneFranjas = 
      Object.values(horarios.manana || {}).some(Boolean) ||
      Object.values(horarios.tarde || {}).some(Boolean) ||
      Object.values(horarios.noche || {}).some(Boolean);
    const sec03 = tieneFranjas && horasObjetivoMensual > 0;
    const sec05 = ciudadBase.trim() !== '';

    return {
      sec01,
      sec02,
      sec03,
      sec05,
      todasCompletas: sec01 && sec02 && sec03 && sec05
    };
  };

  useEffect(() => {
    cargarDatosVoluntario();
  }, [id]);

  // NUEVO: Efecto que calcula automáticamente las horas semanales basándose en las franjas
  useEffect(() => {
    let totalHoras = 0;
    const dias = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
    
    dias.forEach(dia => {
      if (horarios.manana?.[dia]) totalHoras += 5;   // 07:00 a 12:00 = 5h
      if (horarios.tarde?.[dia]) totalHoras += 5;    // 13:00 a 18:00 = 5h
      if (horarios.noche?.[dia]) totalHoras += 3.5;  // 18:30 a 22:00 = 3.5h
    });

    if (totalHoras > 0) {
      setTiempoDisponible(`${totalHoras} hrs/semana`);
    } else {
      setTiempoDisponible('0 hrs/semana');
    }
  }, [horarios]);

  const cargarDatosVoluntario = async () => {
    setLoading(true);
    try {
      let targetId = id;

      if (!targetId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          targetId = authData.user.id;
        }
      }

      let query = supabase.from('voluntarios').select('*');
      if (targetId) {
        query = query.eq('id', targetId);
      } else {
        query = query.limit(1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener datos del voluntario:', error.message);
      } else if (data && data.length > 0) {
        const vol = data[0];
        const currentId = vol.id;
        setVolunteerId(currentId);

        setNombreCompleto(vol.nombre_completo || '');
        setTitulo(vol.profesion || '');
        setPresentacion(vol.presentacion_civica || vol.sobre_mi || '');
        setAvatarUrl(vol.avatar_url || '');
        setDisponibilidadActiva(vol.disponibilidad_activa ?? true);
        setCiudadBase(vol.ciudad_base || vol.ubicacion || '');
        setRadio(vol.radio_desplazamiento ?? 35);
        setViajar(vol.disponibilidad_viajar ?? true);
        setModalidadApoyo(vol.modalidad_apoyo || 'Presencial');
        setHorasObjetivoMensual(vol.horas_objetivo_mensual ?? 16);
        setHorasTotalesDonadas(vol.horas_totales_donadas ?? 0);
        setIsVerified(vol.is_verified ?? false);

        if (vol.habilidades && Array.isArray(vol.habilidades)) {
          setHabilidades(vol.habilidades);
        } else if (vol.competencias && Array.isArray(vol.competencias)) {
          const extraidas = vol.competencias.map((c: any) => typeof c === 'string' ? c : (c.titulo || c.nombre || ''));
          setHabilidades(extraidas.filter((s: string) => s.trim() !== ''));
        } else {
          setHabilidades([]);
        }

        if (vol.franjas_horarias && typeof vol.franjas_horarias === 'object') {
          setHorarios({
            ...defaultHorarios,
            ...vol.franjas_horarias
          });
        } else {
          setHorarios(defaultHorarios);
        }

        // Si ya traía un tiempo disponible configurado manualmente que no se pudo sobreescribir, se mantiene temporalmente hasta el cálculo
        if (vol.tiempo_disponible) {
           setTiempoDisponible(vol.tiempo_disponible);
        }

        if (vol.servicios_ofrecidos && Array.isArray(vol.servicios_ofrecidos)) {
          setCertificaciones(vol.servicios_ofrecidos);
        } else {
          setCertificaciones([]);
        }

        const { data: histData } = await supabase
          .from('historial_voluntariado')
          .select('*')
          .eq('voluntario_id', currentId);
        if (histData) setHistorial(histData);

        const { data: resData } = await supabase
          .from('resenas')
          .select('*')
          .eq('voluntario_id', currentId);
        if (resData) setResenas(resData);
      }
    } catch (err) {
      console.error('Error inesperado al conectar con Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const estadoSecciones = evaluarSeccionesCompletas();
      let verificadoCalculado = isVerified;
      let fueVerificadoPorPrimeraVez = false;

      if (estadoSecciones.todasCompletas && !isVerified) {
        verificadoCalculado = true;
        fueVerificadoPorPrimeraVez = true;
        setIsVerified(true);
      }

      const payload = {
        nombre_completo: nombreCompleto,
        profesion: titulo,
        presentacion_civica: presentacion,
        sobre_mi: presentacion,
        avatar_url: avatarUrl,
        disponibilidad_activa: disponibilidadActiva,
        ciudad_base: ciudadBase,
        ubicacion: ciudadBase,
        radio_desplazamiento: radio,
        disponibilidad_viajar: viajar,
        disponibilidad_viaje: viajar ? 'Dispuesta a viajar (Nivel Nacional)' : 'Disponibilidad Local',
        tiempo_disponible: tiempoDisponible, // Se guarda el string calculado automáticamente
        modalidad_apoyo: modalidadApoyo,
        horas_objetivo_mensual: horasObjetivoMensual,
        horas_totales_donadas: horasTotalesDonadas, 
        habilidades: habilidades, 
        franjas_horarias: horarios,
        servicios_ofrecidos: certificaciones,
        is_verified: verificadoCalculado
      };

      const targetId = volunteerId || id;

      if (targetId) {
        const { error } = await supabase
          .from('voluntarios')
          .update(payload)
          .eq('id', targetId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('voluntarios')
          .insert([payload])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setVolunteerId(data[0].id);
        }
      }

      setHasUnsavedChanges(false);

      if (fueVerificadoPorPrimeraVez) {
        setShowFirstVerificationModal(true);
      } else {
        mostrarToast('¡Ficha de voluntario actualizada exitosamente!');
      }
    } catch (err: any) {
      console.error('Error al guardar en Supabase:', err);
      alert('Ocurrió un problema al guardar los cambios: ' + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  const toggleHorario = (franja: 'manana' | 'tarde' | 'noche', dia: string) => {
    setHorarios(prev => {
      const franjaActual = prev?.[franja] || defaultHorarios[franja];
      return {
        ...defaultHorarios,
        ...prev,
        [franja]: {
          ...franjaActual,
          [dia]: !franjaActual[dia]
        }
      };
    });
    markUnsaved();
  };

  const handleAddHabilidad = (habilidadNombre?: string) => {
    const texto = habilidadNombre || nuevaHabilidadInput;
    if (!texto.trim()) return;
    const limpia = texto.trim();
    if (!habilidades.includes(limpia)) {
      setHabilidades(prev => [...prev, limpia]);
      markUnsaved();
    }
    if (!habilidadNombre) setNuevaHabilidadInput('');
  };

  const handleRemoveHabilidad = (index: number) => {
    setHabilidades(prev => prev.filter((_, i) => i !== index));
    markUnsaved();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      markUnsaved();
    };
    reader.readAsDataURL(file);
  };

  const handleCertUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 2MB permitido.");
      return;
    }

    const tituloCert = prompt('Ingresa el título de esta certificación (Ej. Curso APH):') || file.name;
    const entidadCert = prompt('Entidad emisora / Folio (Opcional):') || 'Documento adjunto';

    const reader = new FileReader();
    reader.onloadend = () => {
      const nueva: Certificacion = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        titulo: tituloCert,
        entidad_folio: entidadCert,
        verificado: true, 
        icono: '📄',
        archivo_url: reader.result as string
      };

      setCertificaciones(prev => [...prev, nueva]);
      markUnsaved();
      mostrarToast('Documento adjuntado correctamente.');
    };
    reader.readAsDataURL(file);
  };

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

  const estadoSecciones = evaluarSeccionesCompletas();

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#f8fafc] text-[#005684] font-bold gap-3">
        <div className="w-9 h-9 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Cargando ficha de voluntariado desde Supabase...</span>
      </div>
    );
  }
  
  const handleDiscard = () => {
    cargarDatosVoluntario();
    setHasUnsavedChanges(false);
    mostrarToast('Cambios descartados. Se restauraron los datos originales.');
  };

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans pb-24 relative">    
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7]">
            <span className="text-lg">✓</span>
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {showFirstVerificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#e2e8f0] text-center relative flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#047857] flex items-center justify-center text-3xl mb-4 border border-[#86efac]">
                ✓
              </div>
              <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border border-[#bbf7d0] mb-2">
                VERIFICACIÓN AUTOMÁTICA OBTENIDA
              </span>
              <h3 className="text-xl font-bold text-[#071d37] mb-2">¡Tu Perfil ha sido Completado!</h3>
              <p className="text-xs text-[#475569] leading-relaxed mb-4">
                Has completado exitosamente las secciones obligatorias: <b>01 Identidad</b>, <b>02 Habilidades</b>, <b>03 Disponibilidad</b> y <b>05 Cobertura</b>.
              </p>
              <button
                onClick={() => setShowFirstVerificationModal(false)}
                className="w-full bg-[#005684] hover:bg-[#00456a] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-md"
              >
                Entendido, continuar en mi ficha
              </button>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          {!isVerified && (
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📢</span>
                <div>
                  <h4 className="text-xs font-bold text-[#0369a1]">Requisitos de Visibilidad Pública y Verificación</h4>
                  <p className="text-[11px] text-[#0284c7] mt-0.5">
                    Completa las secciones obligatorias para ser verificado automáticamente y habilitado en el Directorio Nacional.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoSecciones.sec01 ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]' : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'}`}>
                  01 Identidad {estadoSecciones.sec01 ? '✓' : '○'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoSecciones.sec02 ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]' : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'}`}>
                  02 Habilidades {estadoSecciones.sec02 ? '✓' : '○'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoSecciones.sec03 ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]' : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'}`}>
                  03 Disponibilidad {estadoSecciones.sec03 ? '✓' : '○'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoSecciones.sec05 ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]' : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'}`}>
                  05 Cobertura {estadoSecciones.sec05 ? '✓' : '○'}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-1 mb-0">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border flex items-center gap-1 ${
                  isVerified 
                    ? 'bg-[#dcfce7] text-[#166534] border-[#EFF4FF]' 
                    : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                }`}>
                  <img src={Icons.CheckVerifyIcon} alt="Verificado" /> {isVerified ? 'FICHA COMPLETA' : 'PERFIL EN REVISIÓN'}
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">
                  ID: {volunteerId ? `VOL-${volunteerId.substring(0, 8).toUpperCase()}` : 'SIN ID'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mt-0 mb-2">Mi Ficha de Voluntariado</h1>
              <h2 className="text-lg font-bold text-[#005684] mt-0">
                — {nombreCompleto || 'Voluntario'} {titulo ? `(${titulo})` : ''}
              </h2>
            </div>
            
            <div className="flex flex-col items-start gap-3 shrink-0 m-auto md:m-0">
              <label className="flex items-center gap-2 cursor-pointer bg-[#EFF4FF] p-2 rounded-xl">
                <div 
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${disponibilidadActiva ? 'bg-[#047857]' : 'bg-gray-300'}`} 
                  onClick={() => { setDisponibilidadActiva(!disponibilidadActiva); markUnsaved(); }}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${disponibilidadActiva ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#071d37]">Disponibilidad Activa</span>
                  <span className="text-[10px] text-[#64748b]">Visible en búsquedas</span>
                </div>
              </label>
              
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => navigate(`/voluntario/${volunteerId}`)}
                  className="bg-[#eef6ff] text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-2 border border-[#dbeafe] cursor-pointer"
                >
                  <span>👁️</span> Previsualizar Perfil
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : '✓ Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start mt-2">
            
            <div className="flex flex-col gap-6">
              
              {/* 01. IDENTIDAD */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🪪</span> 01 / IDENTIDAD Y RESUMEN PROFESIONAL
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    estadoSecciones.sec01 ? 'text-[#10b981] bg-[#ecfdf5]' : 'text-[#f59e0b] bg-[#fffbe2]'
                  }`}>
                    {estadoSecciones.sec01 ? 'Sección Completa' : 'Incompleto'}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[#e2e8f0] bg-slate-100 shadow-sm flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} className="w-full h-full object-cover" alt="Perfil" />
                      ) : (
                        <span className="text-3xl text-slate-400">👤</span>
                      )}
                    </div>
                    {/* INPUT OCULTO DE FOTO */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[10px] font-bold text-[#005684] hover:underline cursor-pointer"
                    >
                      Cambiar Foto
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">Nombre Completo *</label>
                        <input 
                          type="text" 
                          value={nombreCompleto} 
                          onChange={(e) => { setNombreCompleto(e.target.value); markUnsaved(); }} 
                          placeholder="Tu nombre completo"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">Título Profesional / Profesión *</label>
                        <input 
                          type="text" 
                          value={titulo} 
                          onChange={(e) => { setTitulo(e.target.value); markUnsaved(); }} 
                          placeholder="Ej: Médica Pediatra / Lic. Psicología"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[11px] font-bold text-[#475569]">Presentación y Resumen Cívico *</label>
                        <span className="text-[10px] text-[#94a3b8]">{presentacion.length} / 500 caracteres</span>
                      </div>
                      <textarea 
                        value={presentacion} 
                        onChange={(e) => { setPresentacion(e.target.value); markUnsaved(); }} 
                        rows={3} 
                        placeholder="Escribe un breve resumen de tu experiencia y vocación de servicio..."
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2.5 text-xs text-[#475569] leading-relaxed outline-none transition resize-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 02. HABILIDADES Y ESPECIALIDADES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🛠️️</span> 02 / HABILIDADES Y ESPECIALIDADES
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    estadoSecciones.sec02 ? 'text-[#10b981] bg-[#ecfdf5]' : 'text-[#f59e0b] bg-[#fffbe2]'
                  }`}>
                    {estadoSecciones.sec02 ? 'Sección Completa' : 'Incompleto'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b] mb-4">
                  Agrega las habilidades que te identifican. Se requiere al menos 1 habilidad registrada.
                </p>

                {/* Input para agregar nuevas habilidades */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={nuevaHabilidadInput}
                    onChange={(e) => setNuevaHabilidadInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHabilidad(); } }}
                    placeholder="Escribe una habilidad (ej. Primeros Auxilios) y pulsa Agregar..."
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold text-[#071d37] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddHabilidad()}
                    className="bg-[#005684] hover:bg-[#00456a] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Tags de Habilidades Seleccionadas */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {habilidades.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] italic">No has agregado ninguna habilidad aún.</p>
                  ) : (
                    habilidades.map((hab, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full border border-[#bae6fd] bg-[#f0f9ff] px-3 py-1.5 text-xs font-bold text-[#0284c7] shadow-sm"
                      >
                        <span>● {hab}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHabilidad(idx)}
                          className="text-[#94a3b8] hover:text-[#ef4444] font-black text-xs cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Sugerencias Rápidas */}
                <div className="pt-3 border-t border-[#f1f5f9]">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase mb-2">Sugerencias frecuentes (Haz clic para añadir):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGERENCIAS_HABILIDADES.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddHabilidad(sug)}
                        disabled={habilidades.includes(sug)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          habilidades.includes(sug)
                            ? 'bg-[#f1f5f9] text-[#cbd5e1] border-[#e2e8f0] cursor-not-allowed'
                            : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#eef6ff] hover:text-[#005684]'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* 03. DISPONIBILIDAD Y FRANJAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">📅</span> 03 / DISPONIBILIDAD Y MODALIDAD
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      estadoSecciones.sec03 ? 'text-[#10b981] bg-[#ecfdf5]' : 'text-[#f59e0b] bg-[#fffbe2]'
                    }`}>
                      {estadoSecciones.sec03 ? 'Sección Completa' : 'Incompleto'}
                    </span>
                    <span className="bg-[#eef6ff] text-[#005684] text-xs font-black px-3 py-1 rounded-lg border border-[#dbeafe]">
                      {horasObjetivoMensual} Horas / Mes
                    </span>
                  </div>
                </div>

                {/* Modales y tiempos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* INPUT LECTURA (CÁLCULO AUTOMÁTICO) */}
                  <div>
                    <label className="text-[11px] font-bold text-[#475569] block mb-1">
                      Tiempo Disponible Semanal <span className="font-normal text-[#0284c7] italic">(Calculado)</span>
                    </label>
                    <input
                      type="text"
                      value={tiempoDisponible}
                      readOnly
                      className="w-full bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3 py-2 text-xs font-bold text-[#0369a1] outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#475569] block mb-1">Modalidad de Apoyo</label>
                    <select
                      value={modalidadApoyo}
                      onChange={(e) => { setModalidadApoyo(e.target.value); markUnsaved(); }}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold text-[#071d37] outline-none cursor-pointer"
                    >
                      <option value="Presencial">Presencial (En terreno)</option>
                      <option value="Remota / Virtual">Remota / Virtual</option>
                      <option value="Híbrida">Híbrida (Terreno y Virtual)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-[#EFF4FF]">
                      <tr>
                        <th className="text-[10px] font-bold text-[#94a3b8] uppercase w-1/4 p-2">Franja Horaria</th>
                        {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(d => (
                          <th key={d} className="text-[10px] font-bold text-[#94a3b8] uppercase p-2 text-center w-[10%]">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'manana', label: '☀️ Mañana (07:00 - 12:00)' },
                        { id: 'tarde', label: '🌤 Tarde (13:00 - 18:00)' },
                        { id: 'noche', label: '🌙 Noche (18:30 - 22:00)' }
                      ].map((franja) => (
                        <tr key={franja.id} className="border-t border-[#f1f5f9] bg-white">
                          <td className="py-2.5 text-xs font-semibold text-[#475569]">{franja.label}</td>
                          {['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'].map((dia) => {
                            const isActive = horarios[franja.id as keyof HorariosFranjas]?.[dia];
                            return (
                              <td key={dia} className="py-2.5 text-center">
                                <button 
                                  type="button"
                                  onClick={() => toggleHorario(franja.id as keyof HorariosFranjas, dia)}
                                  className={`w-11 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    isActive ? 'bg-[#047857] text-white shadow-sm' : 'bg-[#EFF4FF] text-[#94a3b8] hover:bg-[#cbd5e1]'
                                  }`}
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

                <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-[#475569]">Objetivo de dedicación comunitaria mensual</span>
                     <span className="text-sm font-extrabold text-[#0284c7]">~{Math.round(horasObjetivoMensual / 4)} misiones</span>
                   </div>
                   <input 
                     type="range" 
                     min="4" 
                     max="40" 
                     value={horasObjetivoMensual} 
                     onChange={(e) => { setHorasObjetivoMensual(Number(e.target.value)); markUnsaved(); }}
                     className="w-full accent-[#005684] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
              </section>

              {/* 04. HISTORIAL */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🤝</span> 04 / HISTORIAL DE MISIONES Y TESTIMONIOS RECIBIDOS
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {historial.length === 0 && resenas.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#f8fafc] border border-dashed border-[#e2e8f0] text-center text-xs text-[#94a3b8] italic">
                      Aún no tienes misiones o testimonios registrados en la base de datos.
                    </div>
                  ) : (
                    <>
                      {historial.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-[#EFF4FF] border border-[#e2e8f0]">
                          <div className="w-8 h-8 rounded-lg bg-[#eef6ff] text-[#0284c7] flex items-center justify-center shrink-0">🏥</div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start">
                               <div className="text-left">
                                 <h4 className="text-[13px] font-extrabold text-[#071d37]">{item.rol}</h4>
                                 <p className="text-[10px] font-semibold text-[#64748b] mt-1">
                                   {item.fundacion_nombre} • {item.fecha_texto || 'Reciente'}
                                 </p>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>

            </div>

            {/* COLUMNA DERECHA */}
            <div className="flex flex-col gap-6">
              
              {/* 05. COBERTURA */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                      <span className="text-base">📍</span> 05 / COBERTURA Y MOVILIDAD
                   </h3>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                     estadoSecciones.sec05 ? 'text-[#10b981] bg-[#ecfdf5]' : 'text-[#f59e0b] bg-[#fffbe2]'
                   }`}>
                     {estadoSecciones.sec05 ? 'Sección Completa' : 'Incompleto'}
                   </span>
                 </div>
                 
                 <div className="mb-4">
                   <label className="text-[11px] font-bold text-[#475569] block mb-1">Ciudad Base de Operaciones *</label>
                   <input 
                     type="text" 
                     value={ciudadBase} 
                     onChange={(e) => { setCiudadBase(e.target.value); markUnsaved(); }} 
                     placeholder="Ej: Medellín, Antioquia"
                     className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                   />
                 </div>

                 <div className="mb-3 flex justify-between items-center">
                   <label className="text-[11px] font-bold text-[#475569]">Radio de Desplazamiento Directo</label>
                   <span className="text-xs font-extrabold text-[#005684]">{radio} km</span>
                 </div>
                 <input 
                   type="range" 
                   min="5" 
                   max="100" 
                   value={radio} 
                   onChange={(e) => { setRadio(Number(e.target.value)); markUnsaved(); }} 
                   className="w-full accent-[#005684] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
                 />

                 <label className="flex items-start gap-2 cursor-pointer bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                   <input 
                     type="checkbox" 
                     checked={viajar} 
                     onChange={(e) => { setViajar(e.target.checked); markUnsaved(); }} 
                     className="mt-0.5 accent-[#005684]" 
                   />
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-[#071d37]">Disponibilidad de viajar</span>
                     <span className="text-[10px] text-[#64748b] leading-tight mt-0.5">Trayectos a nivel departamental o nacional.</span>
                   </div>
                 </label>
              </section>

              {/* 06. CERTIFICACIONES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                      <span className="text-base">🛡</span> 06 / CERTIFICACIONES
                   </h3>
                 </div>

                 <div className="flex flex-col gap-2 mb-4">
                   {certificaciones.length === 0 ? (
                     <p className="text-[10px] text-[#94a3b8] italic p-3 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">
                       No se han subido documentos.
                     </p>
                   ) : (
                     certificaciones.map((cert, idx) => (
                       <div key={cert.id || idx} className="bg-[#EFF4FF] border border-[#dbeafe] p-3 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-2.5 overflow-hidden">
                           <span className="text-[#047857] text-lg">{cert.icono || '📄'}</span>
                           <div className="truncate">
                             <p className="text-[11px] font-bold text-[#071d37] truncate">{cert.titulo}</p>
                             {cert.archivo_url && (
                               <button 
                                 type="button"
                                 onClick={() => handleViewDocument(cert.archivo_url!)} 
                                 className="text-[9px] text-[#0284c7] hover:underline font-bold cursor-pointer"
                               >
                                 Ver adjunto ↗
                               </button>
                             )}
                           </div>
                         </div>
                         <button 
                           onClick={() => { setCertificaciones(prev => prev.filter((_, i) => i !== idx)); markUnsaved(); }}
                           className="text-red-400 hover:text-red-600 font-bold ml-2 cursor-pointer"
                         >
                           ✕
                         </button>
                       </div>
                     ))
                   )}
                 </div>

                 {/* INPUT OCULTO PARA CERTIFICADOS */}
                 <input 
                   type="file" 
                   accept=".pdf,image/*" 
                   ref={certInputRef} 
                   className="hidden" 
                   onChange={handleCertUpload} 
                 />
                 <button 
                   type="button"
                   onClick={() => certInputRef.current?.click()}
                   className="w-full bg-[#DCE9FF66] border border-dashed border-[#cbd5e1] rounded-xl py-2.5 text-center text-[#005684] hover:bg-[#f0f6ff] transition cursor-pointer text-xs font-bold"
                 >
                   + Adjuntar Certificación (PDF/Img)
                 </button>
              </section>

              {/* MÉTRICAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <h3 className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-left mb-4">Métricas Cívicas (Gestión Manual)</h3>
                 <div className="grid grid-cols-2 gap-4 text-center divide-x divide-[#e2e8f0]">
                   <div className="bg-[#DCE9FF66] p-2 rounded-xl flex flex-col items-center justify-center border border-blue-100">
                     <input 
                       type="number"
                       min="0"
                       value={horasTotalesDonadas}
                       onChange={(e) => { setHorasTotalesDonadas(Number(e.target.value)); markUnsaved(); }}
                       className="w-20 bg-white border border-blue-200 text-2xl font-black text-[#005684] text-center rounded-lg outline-none focus:border-[#005684] py-1"
                     />
                     <p className="text-[10px] font-bold text-[#005684] mt-2">✏️ Horas donadas</p>
                   </div>
                   <div className="bg-[#ecfdf5] p-2 rounded-xl flex flex-col items-center justify-center border border-green-100">
                     <p className="text-2xl font-black text-[#047857]">100%</p>
                     <p className="text-[10px] font-bold text-[#047857] mt-2">Asistencia</p>
                   </div>
                 </div>
              </section>

            </div>
          </div>
        </div>

        {/* SNACKBAR FLOTANTE (CAMBIOS SIN GUARDAR) */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up px-4 w-full max-w-2xl">
            <div className="bg-[#0f2a3f] text-white rounded-2xl p-4 pr-5 shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border border-[#1e3a8a] w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-full bg-[#0284c7]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tienes cambios pendientes de publicación</p>
                  <p className="text-[11px] text-[#94a3b8]">Las actualizaciones impactarán inmediatamente tu ficha de voluntario pública.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto shrink-0 w-full sm:w-auto justify-end">
                <button 
                  onClick={handleDiscard}
                  className="text-xs font-bold text-[#cbd5e1] hover:text-white px-3 py-2 transition cursor-pointer"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#005684] hover:bg-[#00456a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-[#0284c7] cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}