import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface CanalRecaudo {
  id: string;
  tipo: string;
  icono?: string;
  detalles: string;
  titular_nota: string;
  estado_texto?: string;
  estado_color?: string;
}

interface NecesidadData {
  id: string;
  fundacion_id?: string;
  titulo: string;
  descripcion?: string | null;
  categoria?: string | null;
  prioridad?: 'alta' | 'media' | 'baja' | null;
  meta_texto?: string | null;
  porcentaje_recaudado?: number | null;
  completada?: boolean | null;
  created_at?: string | null;
}

interface FundacionData {
  id: string;
  nombre_legal?: string | null;
  sigla?: string | null;
  nit?: string | null;
  personeria_juridica?: string | null;
  ano_fundacion?: string | null;
  descripcion?: string | null;
  mision?: string | null;
  vision?: string | null;
  departamento?: string | null;
  ciudad?: string | null;
  localidad?: string | null;
  direccion_fisica?: string | null;
  telefono_whatsapp?: string | null;
  telefono?: string | null;
  email_contacto?: string | null;
  email_institucional?: string | null;
  instagram?: string | null;
  sitio_web?: string | null;
  portada_url?: string | null;
  foto_portada_url?: string | null;
  logo_url?: string | null;
  estado?: string | null;
  canales_recaudo?: CanalRecaudo[] | null;
}

export function EditFoundationProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Estados de carga y feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'basica' | 'causas' | 'recaudo' | 'documentos'>('basica');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ID de la fundación
  const [foundationId, setFoundationId] = useState<string | null>(id || null);

  // Formulario de datos (Iniciados vacíos sin valores quemados)
  const [razonSocial, setRazonSocial] = useState('');
  const [sigla, setSigla] = useState('');
  const [nit, setNit] = useState('');
  const [personeria, setPersoneria] = useState('');
  const [anoFundacion, setAnoFundacion] = useState('');
  
  const [descripcion, setDescripcion] = useState('');
  const [mision, setMision] = useState('');
  const [vision, setVision] = useState('');

  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');

  const [whatsapp, setWhatsapp] = useState('');
  const [telFijo, setTelFijo] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');

  const [portadaUrl, setPortadaUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // ESTADO PARA RENDERIZAR MAPA DINÁMICO
  const [mapQuery, setMapQuery] = useState('Colombia');

  // Listas dinámicas desde BD
  const [canalesRecaudo, setCanalesRecaudo] = useState<CanalRecaudo[]>([]);
  const [necesidades, setNecesidades] = useState<NecesidadData[]>([]);

  // Marcar cambios sin guardar
  const markUnsaved = () => setHasUnsavedChanges(true);

  // Cargar datos desde Supabase
  useEffect(() => {
    if (id) {
      setFoundationId(id);
    }
    cargarDatosFundacion();
  }, [id]);

  const cargarDatosFundacion = async () => {
    setLoading(true);
    try {
      let query = supabase.from('fundaciones').select('*');

      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.limit(1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener datos de Supabase:', error.message);
      } else if (data && data.length > 0) {
        const fund: FundacionData = data[0];
        const currentId = fund.id;
        setFoundationId(currentId);

        setRazonSocial(fund.nombre_legal || '');
        setSigla(fund.sigla || '');
        setNit(fund.nit || '');
        setPersoneria(fund.personeria_juridica || '');
        setAnoFundacion(fund.ano_fundacion ? String(fund.ano_fundacion) : '');
        setDescripcion(fund.descripcion || '');
        setMision(fund.mision || '');
        setVision(fund.vision || '');
        
        // UBICACIÓN
        setDepartamento(fund.departamento || '');
        setCiudad(fund.ciudad || '');
        setLocalidad(fund.localidad || '');
        setDireccionEntrega(fund.direccion_fisica || '');
        
        // ACTUALIZAR MAPA INICIALMENTE
        const queryUbicacion = [fund.direccion_fisica, fund.localidad, fund.ciudad, fund.departamento, 'Colombia']
          .filter(Boolean)
          .join(', ');
        setMapQuery(queryUbicacion);

        setWhatsapp(fund.telefono_whatsapp || '');
        setTelFijo(fund.telefono || '');
        setEmail(fund.email_contacto || fund.email_institucional || '');
        setInstagram(fund.instagram || '');
        setSitioWeb(fund.sitio_web || '');
        setPortadaUrl(fund.portada_url || fund.foto_portada_url || '');
        setLogoUrl(fund.logo_url || null);

        if (fund.canales_recaudo && Array.isArray(fund.canales_recaudo)) {
          setCanalesRecaudo(fund.canales_recaudo);
        } else {
          setCanalesRecaudo([]);
        }

        // Cargar necesidades
        const { data: necData, error: necError } = await supabase
          .from('necesidades')
          .select('*')
          .eq('fundacion_id', currentId)
          .order('created_at', { ascending: false });

        if (necError) {
          console.error('Error al obtener necesidades:', necError.message);
        } else if (necData) {
          setNecesidades(necData);
        }
      }
    } catch (err) {
      console.error('Error inesperado al conectar con Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // ACTUALIZADOR DE MAPA MANUAL (OnBlur)
  const handleUpdateMap = () => {
    const query = [direccionEntrega, localidad, ciudad, departamento, 'Colombia']
      .filter(item => item && item.trim() !== '')
      .join(', ');
    setMapQuery(query);
  };

  // Guardar Cambios en Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre_legal: razonSocial,
        sigla: sigla,
        nit: nit,
        personeria_juridica: personeria,
        ano_fundacion: anoFundacion,
        descripcion: descripcion,
        mision: mision,
        vision: vision,
        departamento: departamento,
        ciudad: ciudad,
        localidad: localidad,
        direccion_fisica: direccionEntrega,
        telefono_whatsapp: whatsapp,
        telefono: telFijo,
        email_contacto: email,
        email_institucional: email,
        instagram: instagram,
        sitio_web: sitioWeb,
        portada_url: portadaUrl,
        foto_portada_url: portadaUrl,
        logo_url: logoUrl,
        canales_recaudo: canalesRecaudo
      };

      const targetId = foundationId || id;

      if (targetId) {
        const { error } = await supabase
          .from('fundaciones')
          .update(payload)
          .eq('id', targetId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('fundaciones')
          .insert([payload])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setFoundationId(data[0].id);
        }
      }

      setHasUnsavedChanges(false);
      mostrarToast('¡Perfil actualizado con éxito en la base de datos!');
    } catch (err: any) {
      console.error('Error al guardar en Supabase:', err);
      alert('Ocurrió un problema al guardar los cambios: ' + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  // Agregar Canal de Recaudo
  const handleAddCanal = () => {
    const tipo = prompt('Ingresa el tipo/banco del canal de recaudo (Ej: Bancolombia — Cta. Corriente, Nequi, etc.):');
    if (!tipo) return;
    const detalles = prompt('Ingresa el número de cuenta o detalles:') || '';
    const titular_nota = prompt('Ingresa el titular o nota adicional:') || '';

    const nuevoCanal: CanalRecaudo = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      tipo,
      icono: tipo.toLowerCase().includes('nequi') ? '📱' : tipo.toLowerCase().includes('wompi') || tipo.toLowerCase().includes('pse') ? '💻' : '🏦',
      detalles,
      titular_nota,
      estado_texto: '✓ Activa',
      estado_color: 'text-[#047857]'
    };

    setCanalesRecaudo(prev => [...prev, nuevoCanal]);
    markUnsaved();
  };

  // Editar Canal de Recaudo
  const handleEditCanal = (index: number) => {
    const canal = canalesRecaudo[index];
    const tipo = prompt('Editar Nombre/Tipo del Canal:', canal.tipo);
    if (tipo === null) return;
    const detalles = prompt('Editar Detalles:', canal.detalles);
    if (detalles === null) return;
    const titular_nota = prompt('Editar Titular/Nota:', canal.titular_nota);
    if (titular_nota === null) return;

    const actualizados = [...canalesRecaudo];
    actualizados[index] = { ...canal, tipo, detalles, titular_nota };
    setCanalesRecaudo(actualizados);
    markUnsaved();
  };

  // Agregar Necesidad a la base de datos
  const handleAddNecesidad = async () => {
    const targetId = foundationId || id;
    if (!targetId) {
      alert('No hay una fundación vinculada para crear necesidades.');
      return;
    }

    const titulo = prompt('Título de la nueva necesidad u oferta voluntaria:');
    if (!titulo) return;
    const meta_texto = prompt('Meta o descripción breve (Ej: Meta: $4.500.000 COP • Recaudado: 0%):') || '';

    try {
      const nueva = {
        fundacion_id: targetId,
        titulo,
        meta_texto,
        porcentaje_recaudado: 0,
        completada: false
      };

      const { data, error } = await supabase
        .from('necesidades')
        .insert([nueva])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setNecesidades(prev => [data[0], ...prev]);
        mostrarToast('¡Necesidad añadida correctamente!');
      }
    } catch (err: any) {
      alert('Error al guardar la necesidad: ' + (err.message || 'Error de conexión'));
    }
  };

  // Eliminar Necesidad
  const handleDeleteNecesidad = async (necId: string) => {
    if (!confirm('¿Deseas eliminar esta necesidad publicada?')) return;
    try {
      const { error } = await supabase
        .from('necesidades')
        .delete()
        .eq('id', necId);

      if (error) throw error;
      setNecesidades(prev => prev.filter(n => n.id !== necId));
      mostrarToast('Necesidad eliminada.');
    } catch (err: any) {
      alert('Error al eliminar necesidad: ' + err.message);
    }
  };

  const mostrarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#f8fafc] text-[#005684] font-bold gap-3">
        <div className="w-9 h-9 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Cargando datos institucionales desde Supabase...</span>
      </div>
    );
  }
  // Descartar cambios y restaurar valores desde la BD
  const handleDiscard = () => {
    cargarDatosFundacion();
    setHasUnsavedChanges(false);
    mostrarToast('Cambios descartados. Se restauraron los datos originales.');
  };

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans pb-24 relative">    
        {/* NOTIFICACIÓN TOAST DE ÉXITO */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7] animate-bounce">
            <span className="text-lg">✓</span>
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          {/* HEADER DE LA PÁGINA */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-[#bbf7d0] flex items-center gap-1">
                  ✓ Entidad Verificada
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">
                  ID: {foundationId ? `FDN-${foundationId.substring(0, 40).toUpperCase()}` : 'SIN ID'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mt-1 mb-1">
                Editar Perfil Institucional — <span className="text-[#005684]">{sigla || razonSocial || 'Sin Registro'}</span>
              </h1>
              <p className="text-[13px] text-[#64748b] max-w-3xl">
                Gestiona la identidad pública, datos bancarios autorizados y necesidades operativas mostradas a la comunidad.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
              <button 
                onClick={() => navigate(`/fundacion/${foundationId}`)}
                className="bg-white text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#eef6ff] transition flex items-center gap-2 border border-[#dbeafe] cursor-pointer"
              >
                Ver Perfil Público ↗
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>✓</span> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-4">
             <button 
               onClick={() => setActiveTab('basica')}
               className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                 activeTab === 'basica' 
                   ? 'bg-[#005684] text-white shadow-sm' 
                   : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'
               }`}
             >
               <span>📁</span> Información Básica & Contacto
             </button>
             <button 
               onClick={() => setActiveTab('causas')}
               className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                 activeTab === 'causas' 
                   ? 'bg-[#005684] text-white shadow-sm' 
                   : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'
               }`}
             >
               <span>🎯</span> Causas & Misión
             </button>
             <button 
               onClick={() => setActiveTab('recaudo')}
               className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                 activeTab === 'recaudo' 
                   ? 'bg-[#005684] text-white shadow-sm' 
                   : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'
               }`}
             >
               <span>💳</span> Canales de Recaudo & Donación
             </button>
             <button 
               onClick={() => setActiveTab('documentos')}
               className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                 activeTab === 'documentos' 
                   ? 'bg-[#005684] text-white shadow-sm' 
                   : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'
               }`}
             >
               <span>🛡️</span> Documentación & Sellos
             </button>
          </div>

          {/* RETÍCULA DE EDICIÓN: 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
            
            {/* =======================================
                COLUMNA IZQUIERDA (Principal)
            ======================================= */}
            <div className="flex flex-col gap-6">
              
              {/* VISTA: INFORMACIÓN BÁSICA */}
              {activeTab === 'basica' && (
                <>
                  {/* 01. IDENTIDAD GRÁFICA */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base">🖼️</span> Identidad Gráfica Institucional
                      </h3>
                      <span className="text-[10px] text-[#64748b] font-bold">Aspect ratio 16:9 y 1:1</span>
                    </div>
                    
                    {/* Portada */}
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-6 h-48 border border-[#e2e8f0]">
                      {portadaUrl ? (
                        <img src={portadaUrl} className="w-full h-full object-cover" alt="Portada" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400 font-bold">
                          Sin foto de portada cargada
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <p className="text-white text-xs font-bold">Foto de Portada Principal</p>
                            <p className="text-white/80 text-[10px]">Resolución sugerida: 1920×1080px (Max 4MB)</p>
                          </div>
                          <button 
                            onClick={() => {
                              const newUrl = prompt('Ingresa la URL de la foto de portada:', portadaUrl);
                              if (newUrl !== null) {
                                setPortadaUrl(newUrl);
                                markUnsaved();
                              }
                            }}
                            className="bg-white/90 text-[#071d37] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white transition cursor-pointer"
                          >
                            📷 Cambiar Portada
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0]">
                      <div className="w-20 h-20 bg-white border border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center p-2 shadow-sm shrink-0 overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <>
                              <span className="text-2xl text-[#005684]">☀️</span>
                              <span className="text-[6px] font-bold text-[#071d37] mt-1 text-center leading-tight uppercase">
                                {sigla || razonSocial || 'SIN LOGO'}
                              </span>
                            </>
                          )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#071d37]">Logo Oficial / Emblema</h4>
                        <p className="text-[10px] text-[#64748b] mt-0.5 mb-2">PNG o SVG con fondo transparente. Mínimo 400x400 px.</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              const url = prompt('Ingresa la URL del logo oficial:', logoUrl || '');
                              if (url !== null) {
                                setLogoUrl(url);
                                markUnsaved();
                              }
                            }}
                            className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer"
                          >
                            Subir Nuevo Logo
                          </button>
                          {logoUrl && (
                            <button 
                              onClick={() => {
                                setLogoUrl(null);
                                markUnsaved();
                              }}
                              className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Descripcion Fundacion</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                            <button type="button" className="text-xs font-bold text-[#475569] hover:text-[#071d37]">B</button>
                            <button type="button" className="text-xs font-serif italic text-[#475569] hover:text-[#071d37]">I</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">≡</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">🔗</button>
                            <span className="text-[10px] text-[#94a3b8] ml-auto">{descripcion.length} / 600 caracteres</span>
                          </div>
                          <textarea 
                            value={descripcion} 
                            onChange={(e) => { setDescripcion(e.target.value); markUnsaved(); }} 
                            rows={4} 
                            placeholder="Escriba aquí la misión institucional..."
                            className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"
                          />
                        </div>
                      </div>
                  </section>

                  {/* 04. UBICACIÓN Y RECEPCIÓN DE AYUDAS CON MAPA FUNCIONAL */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base">📍</span> Ubicación y Recepción de Ayudas
                      </h3>
                      <button 
                        onClick={handleUpdateMap}
                        className="text-[10px] text-[#005684] font-bold bg-[#eef6ff] px-2 py-1 rounded-full flex items-center gap-1 hover:bg-[#dbeafe] transition cursor-pointer"
                      >
                        <span>⊕</span> Refrescar Mapa
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Departamento / Región</label>
                        <input 
                          type="text" 
                          value={departamento} 
                          onChange={(e) => { setDepartamento(e.target.value); markUnsaved(); }} 
                          onBlur={handleUpdateMap}
                          placeholder="Ej: Cundinamarca"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Ciudad / Municipio</label>
                        <input 
                          type="text" 
                          value={ciudad} 
                          onChange={(e) => { setCiudad(e.target.value); markUnsaved(); }} 
                          onBlur={handleUpdateMap}
                          placeholder="Ej: Bogotá D.C."
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Localidad / Sector</label>
                        <input 
                          type="text" 
                          value={localidad} 
                          onChange={(e) => { setLocalidad(e.target.value); markUnsaved(); }} 
                          onBlur={handleUpdateMap}
                          placeholder="Ej: Ciudad Bolívar"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Dirección de Entrega</label>
                        <input 
                          type="text" 
                          value={direccionEntrega} 
                          onChange={(e) => { setDireccionEntrega(e.target.value); markUnsaved(); }}
                          onBlur={handleUpdateMap} 
                          placeholder="Ej: Carrera 27B Bis # 71H - 14 Sur"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                    </div>

                    {/* MAPA DINÁMICO EN EMBED */}
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-64 border border-[#e2e8f0]">
                      <iframe 
                        title="Ubicación de la Fundación"
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                      El mapa se actualiza automáticamente basado en los datos ingresados.
                    </p>
                  </section>
                </>
              )}

              {/* VISTA: CAUSAS Y MISIÓN */}
              {activeTab === 'causas' && (
                <>
                  {/* 03. MISIÓN, VISIÓN E IMPACTO SOCIAL */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base">🎯</span> Misión, Visión e Impacto Social
                      </h3>
                      <span className="text-[10px] text-[#64748b] font-bold">Edición enriched</span>
                    </div>
                    
                    <div className="flex flex-col gap-5">
                      {/* Misión */}
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Misión Institucional</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                            <button type="button" className="text-xs font-bold text-[#475569] hover:text-[#071d37]">B</button>
                            <button type="button" className="text-xs font-serif italic text-[#475569] hover:text-[#071d37]">I</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">≡</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">🔗</button>
                            <span className="text-[10px] text-[#94a3b8] ml-auto">{mision.length} / 600 caracteres</span>
                          </div>
                          <textarea 
                            value={mision} 
                            onChange={(e) => { setMision(e.target.value); markUnsaved(); }} 
                            rows={4} 
                            placeholder="Escriba aquí la misión institucional..."
                            className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Visión */}
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Visión 2030</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                            <button type="button" className="text-xs font-bold text-[#475569] hover:text-[#071d37]">B</button>
                            <button type="button" className="text-xs font-serif italic text-[#475569] hover:text-[#071d37]">I</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">≡</button>
                            <button type="button" className="text-xs text-[#475569] hover:text-[#071d37]">🔗</button>
                            <span className="text-[10px] text-[#94a3b8] ml-auto">{vision.length} / 600 caracteres</span>
                          </div>
                          <textarea 
                            value={vision} 
                            onChange={(e) => { setVision(e.target.value); markUnsaved(); }} 
                            rows={3} 
                            placeholder="Escriba aquí la visión..."
                            className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* VISTA: CANALES DE RECAUDO */}
              {activeTab === 'recaudo' && (
                <>
                  {/* 05. CANALES DE RECAUDO */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-[#005684]">💳</span>
                        <h3 className="text-sm font-bold text-[#071d37] leading-tight">Canales de Recaudo Certificados</h3>
                      </div>
                      <span className="bg-[#eef6ff] text-[#005684] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-[#dbeafe] flex flex-col text-center leading-tight">
                        <span className="text-xs">{canalesRecaudo.length}</span> Canales
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748b] mb-4">Estas cuentas son expuestas directamente a los donantes bajo validación para evitar suplantaciones.</p>

                    <div className="flex flex-col gap-3">
                      {canalesRecaudo.length === 0 ? (
                        <p className="text-[11px] text-[#94a3b8] italic p-3 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">
                          No hay cuentas o canales de recaudo vinculados.
                        </p>
                      ) : (
                        canalesRecaudo.map((canal, idx) => (
                          <div key={canal.id || idx} className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{canal.icono || '💳'}</span>
                                <h4 className="text-[13px] font-bold text-[#071d37]">{canal.tipo}</h4>
                              </div>
                              <span className={`text-[10px] font-bold ${canal.estado_color || 'text-[#047857]'} flex items-center gap-0.5`}>
                                {canal.estado_texto || '✓ Activa'}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748b] ml-8">{canal.detalles}</p>
                            <div className="flex justify-between items-center mt-3 ml-8">
                              <p className="text-[10px] font-semibold text-[#94a3b8]">{canal.titular_nota}</p>
                              <button 
                                onClick={() => handleEditCanal(idx)} 
                                className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer bg-white px-3 py-1 rounded-lg border border-gray-200"
                              >
                                Editar Datos
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={handleAddCanal}
                      className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-3 rounded-xl mt-5 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe] cursor-pointer"
                    >
                      <span>⊕</span> Vincular Otra Cuenta Bancaria o Pasarela
                    </button>
                  </section>
                </>
              )}

              {/* VISTA: DOCUMENTACIÓN Y SELLOS */}
              {activeTab === 'documentos' && (
                <>
                  {/* 02. DATOS LEGALES */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-5">
                      <span className="text-base">⚖️</span> Datos Legales y Registro
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Razón Social Completa</label>
                        <input 
                          type="text" 
                          value={razonSocial} 
                          onChange={(e) => { setRazonSocial(e.target.value); markUnsaved(); }} 
                          placeholder="Ingrese la Razón Social"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sigla o Nombre Corto</label>
                          <input 
                            type="text" 
                            value={sigla} 
                            onChange={(e) => { setSigla(e.target.value); markUnsaved(); }} 
                            placeholder="Ej: Huellas de Esperanza"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1 flex items-center justify-between">
                            NIT / Registro Tributario
                            <span className="text-[#047857] flex items-center gap-1 normal-case"><span className="text-sm">✓</span> Validado DIAN</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={nit} 
                              readOnly 
                              placeholder="No especificado"
                              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#64748b] outline-none" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Personería Jurídica</label>
                          <input 
                            type="text" 
                            value={personeria} 
                            onChange={(e) => { setPersoneria(e.target.value); markUnsaved(); }} 
                            placeholder="Ej: Resolución Alcaldía Mayor 3844"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Año de Fundación</label>
                          <input 
                            type="text" 
                            value={anoFundacion} 
                            onChange={(e) => { setAnoFundacion(e.target.value); markUnsaved(); }} 
                            placeholder="Ej: 2018"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" 
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* UPLOAD DE DOCUMENTOS (Visual Complemento) */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-4">
                      <span className="text-base">📁</span> Archivos Adjuntos Oficiales
                    </h3>
                    <div className="border-2 border-dashed border-[#e2e8f0] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#f8fafc]">
                        <span className="text-3xl mb-2 text-gray-400">📄</span>
                        <p className="text-xs font-bold text-[#071d37]">Sube tu RUT Actualizado y Cámara de Comercio</p>
                        <p className="text-[10px] text-[#64748b] mt-1 mb-4">Formatos PDF aceptados, máximo 5MB por archivo.</p>
                        <button className="bg-white border border-[#e2e8f0] text-[#005684] px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer shadow-sm">
                          Examinar Archivos
                        </button>
                    </div>
                  </section>
                </>
              )}

            </div>

            {/* =======================================
                COLUMNA DERECHA (Sidebar Interno)
            ======================================= */}
            <div className="flex flex-col gap-6">
              
              {/* SIDEBAR PARA 'BÁSICA' */}
              {activeTab === 'basica' && (
                <>
                  {/* 06. CONTACTO & REDES OFICIALES */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-4">
                        <span className="text-base">💬</span> Contacto & Redes Oficiales
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">WhatsApp de Enlace Solidario</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">💬</span>
                            <input 
                              type="text" 
                              value={whatsapp} 
                              onChange={(e) => { setWhatsapp(e.target.value); markUnsaved(); }} 
                              placeholder="+57 300 000 0000"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                            />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Telefono Fijo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">📞</span>
                            <input 
                              type="text" 
                              value={telFijo} 
                              onChange={(e) => { setTelFijo(e.target.value); markUnsaved(); }} 
                              placeholder="+57 300 000 0000"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                            />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Correo Institucional Donaciones</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                            <input 
                              type="email" 
                              value={email} 
                              onChange={(e) => { setEmail(e.target.value); markUnsaved(); }} 
                              placeholder="contacto@fundacion.org"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" 
                            />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Instagram</label>
                          <input 
                            type="text" 
                            value={instagram} 
                            onChange={(e) => { setInstagram(e.target.value); markUnsaved(); }} 
                            placeholder="@usuario"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sitio Web</label>
                          <input 
                            type="text" 
                            value={sitioWeb} 
                            onChange={(e) => { setSitioWeb(e.target.value); markUnsaved(); }} 
                            placeholder="https://..."
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" 
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* SIDEBAR PARA 'CAUSAS' */}
              {activeTab === 'causas' && (
                <>
                  {/* 07. NECESIDADES PUBLICADAS */}
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                          <span className="text-base">📋</span> Necesidades Publicadas
                      </h3>
                      <button 
                        type="button"
                        onClick={handleAddNecesidad}
                        className="text-[10px] font-bold text-[#005684] hover:bg-[#eef6ff] px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>+</span> Añadir Demanda
                      </button>
                    </div>
                    <p className="text-[10px] text-[#64748b] mb-4 leading-tight">Prioridades en vivo vistas por voluntarios y donantes para la jornada.</p>

                    <div className="flex flex-col gap-3">
                      {necesidades.length === 0 ? (
                        <p className="text-[11px] text-[#94a3b8] italic p-3 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">
                          No hay necesidades registradas en la base de datos.
                        </p>
                      ) : (
                        necesidades.map((nec) => {
                          const pct = nec.porcentaje_recaudado ?? 0;
                          const isCompleted = nec.completada;
                          return (
                            <div 
                              key={nec.id} 
                              className={`p-3 rounded-xl flex items-center justify-between gap-2 ${
                                isCompleted ? 'bg-white border border-[#e2e8f0] opacity-60' : 'bg-[#f8fafc] border border-[#e2e8f0]'
                              }`}
                            >
                              <div className="flex-1">
                                <p className={`text-[11px] font-bold flex items-center gap-1 ${isCompleted ? 'text-[#64748b] line-through' : 'text-[#071d37]'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-gray-400' : pct > 50 ? 'bg-red-500' : 'bg-[#0ea5e9]'}`}></span>
                                  {nec.titulo}
                                </p>
                                <p className="text-[9px] text-[#64748b] mt-0.5">{nec.meta_texto || nec.descripcion || 'Sin especificación de meta'}</p>
                                {!isCompleted && (
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                    <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                  </div>
                                )}
                              </div>
                              {isCompleted ? (
                                <span className="bg-[#dcfce7] text-[#166534] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#bbf7d0]">
                                  Completada
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button 
                                    onClick={() => handleDeleteNecesidad(nec.id)} 
                                    className="text-[#94a3b8] hover:text-red-500 text-xs cursor-pointer"
                                    title="Eliminar necesidad"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* SIDEBAR PARA 'RECAUDO' Y 'DOCUMENTOS' (Info Tips) */}
              {(activeTab === 'recaudo' || activeTab === 'documentos') && (
                <div className="bg-gradient-to-br from-[#f8fafc] to-[#eef6ff] p-6 rounded-3xl border border-[#dbeafe] text-center shadow-sm">
                    <span className="text-3xl mb-2 block">💡</span>
                    <h4 className="text-[13px] font-bold text-[#071d37] mt-2">Consejo de Transparencia</h4>
                    <p className="text-[11px] text-[#64748b] mt-2 leading-relaxed">
                      Mantener la documentación legal y los canales de recaudo actualizados aumenta el <strong>nivel de confianza</strong> en un 80% frente a los donantes y empresas corporativas.
                    </p>
                </div>
              )}

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
                  <p className="text-[11px] text-[#94a3b8]">Las actualizaciones impactarán inmediatamente tu ficha institucional pública.</p>
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