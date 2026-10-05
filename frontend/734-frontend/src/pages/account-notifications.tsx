import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';
import type { Notificacion } from '../hooks/useNotifications';

import { Icon } from '../components/Icon';
import { iconoDesdeEmoji } from '../lib/iconos';
interface MensajeContactoDetalle {
  id: string;
  nombre_remitente: string;
  email_remitente: string;
  tipo_consulta?: string;
  mensaje: string;
  created_at: string;
  remitente_id?: string | null;
  remitente_rol?: string | null;
}

const ETIQUETA_TIPO: Record<string, string> = {
  mensaje: 'Mensaje de Contacto',
  aprobacion: 'Solicitud de Registro',
  emergencia: 'Aviso de Emergencia Cívica',
  sistema: 'Aviso del Sistema',
};

const MAX_TITULO_AVISO = 80;
const MAX_MENSAJE_AVISO = 500;

export function AccountNotifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);

  // Aviso masivo (solo administradores)
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoMensaje, setAvisoMensaje] = useState('');
  const [destinatariosAviso, setDestinatariosAviso] = useState<number | null>(null);
  const [confirmarAviso, setConfirmarAviso] = useState(false);
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [resultadoModal, setResultadoModal] = useState<{ title: string; message: string; isError: boolean } | null>(null);
  
  // Estado para la notificación seleccionada y el detalle del mensaje
  const [notificacionModal, setNotificacionModal] = useState<Notificacion | null>(null);
  const [detalleMensaje, setDetalleMensaje] = useState<MensajeContactoDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Preferencias
  const [alertasCorreo, setAlertasCorreo] = useState(true);
  const [alertasPush, setAlertasPush] = useState(true);
  const [alertasEmergencia, setAlertasEmergencia] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hook de notificaciones
  const { notificaciones, unreadCount, loading: loadingNotifs, marcarComoLeidas } = useNotifications(userId);

  const tiempoRelativo = (fechaStr: string) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '';
    
    const segundos = Math.floor((new Date().getTime() - fecha.getTime()) / 1000);
    if (segundos < 60) return 'Hace un momento';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  };

  const mostrarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Abrir modal y consultar tabla mensajes_contacto
  const abrirNotificacion = async (notif: Notificacion) => {
    // Marcar como leída si no lo estaba
    if (!notif.leido) {
      marcarComoLeidas([notif.id]);
    }

    // Notificaciones con destino propio (p. ej. solicitudes de registro) llevan directo a su pantalla
    if (notif.enlace) {
      navigate(notif.enlace);
      return;
    }

    setNotificacionModal(notif);
    setDetalleMensaje(null);

    // Avisos que no provienen de un mensaje de contacto solo muestran su descripción
    if (notif.tipo && notif.tipo !== 'mensaje') return;

    // Si la notificación tiene un ID de mensaje vinculado
    const mensajeId = notif.mensaje_contacto_id;

    if (mensajeId) {
      setLoadingDetalle(true);
      try {
        const { data, error } = await supabase
          .from('mensajes_contacto')
          .select('*')
          .eq('id', mensajeId)
          .single();

        if (!error && data) {
          setDetalleMensaje(data as MensajeContactoDetalle);
        }
      } catch (err) {
        console.error('Error cargando el mensaje de contacto:', err);
      } finally {
        setLoadingDetalle(false);
      }
    } else if (userId) {
      // Búsqueda de respaldo por usuario y fecha si es una notificación antigua
      setLoadingDetalle(true);
      try {
        const { data } = await supabase
          .from('mensajes_contacto')
          .select('*')
          .or(`fundacion_id.eq.${userId},voluntario_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setDetalleMensaje(data[0] as MensajeContactoDetalle);
        }
      } catch (err) {
        console.error('Error en búsqueda de respaldo:', err);
      } finally {
        setLoadingDetalle(false);
      }
    }
  };

  // Abrir automáticamente la notificación pulsada desde la campana
  useEffect(() => {
    const abrirId = (location.state as { abrirNotificacionId?: string } | null)?.abrirNotificacionId;
    if (!abrirId || loadingNotifs) return;
    const notif = notificaciones.find(n => n.id === abrirId);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga/sincronización con Supabase al montar o al cambiar el parámetro
    if (notif) abrirNotificacion(notif);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, loadingNotifs, notificaciones]);

  const cerrarModal = () => {
    setNotificacionModal(null);
    setDetalleMensaje(null);
  };

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol, alertas_correo, alertas_push, alertas_emergencia')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setRol(perfil.rol);
        if (perfil.rol === 'administrador') {
          const { data: total } = await supabase.rpc('contar_destinatarios_aviso');
          setDestinatariosAviso(typeof total === 'number' ? total : 0);
        }
        setAlertasCorreo(perfil.alertas_correo ?? true);
        setAlertasPush(perfil.alertas_push ?? true);
        setAlertasEmergencia(perfil.alertas_emergencia ?? true);
      }
    }
    cargarPerfil();
  }, []);

  const guardarPreferencias = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({
          alertas_correo: alertasCorreo,
          alertas_push: alertasPush,
          alertas_emergencia: alertasEmergencia
        })
        .eq('id', userId);

      if (error) throw error;
      mostrarToast('Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error al guardar las preferencias:', error);
      mostrarToast('Error al guardar las preferencias');
    } finally {
      setSavingPrefs(false);
    }
  };

  const rutaPerfilRemitente = (detalle: MensajeContactoDetalle | null) => {
    if (!detalle?.remitente_id) return null;
    if (detalle.remitente_rol === 'voluntario') return `/voluntario/${detalle.remitente_id}`;
    if (detalle.remitente_rol === 'fundacion') return `/fundacion/${detalle.remitente_id}`;
    return null;
  };

  const solicitarEnvioAviso = () => {
    if (!avisoTitulo.trim() || !avisoMensaje.trim()) {
      setResultadoModal({ title: 'Faltan datos', message: 'Escribe el título y el mensaje del aviso antes de enviarlo.', isError: true });
      return;
    }
    if (!destinatariosAviso) {
      setResultadoModal({ title: 'Sin destinatarios', message: 'No hay voluntarios activos con los Avisos de Emergencia Cívica habilitados.', isError: true });
      return;
    }
    setConfirmarAviso(true);
  };

  const enviarAvisoMasivo = async () => {
    setEnviandoAviso(true);
    try {
      const { data, error } = await supabase.rpc('enviar_aviso_masivo', {
        p_titulo: avisoTitulo.trim(),
        p_mensaje: avisoMensaje.trim(),
      });
      if (error) throw error;
      setConfirmarAviso(false);
      setAvisoTitulo('');
      setAvisoMensaje('');
      setResultadoModal({
        title: 'Aviso enviado',
        message: `El aviso llegó a ${data ?? 0} voluntario${data === 1 ? '' : 's'} activo${data === 1 ? '' : 's'}.`,
        isError: false,
      });
    } catch (e) {
      const err = e as { message?: string };
      setConfirmarAviso(false);
      setResultadoModal({ title: 'No se pudo enviar el aviso', message: err.message || 'Error de conexión. Intenta de nuevo.', isError: true });
    } finally {
      setEnviandoAviso(false);
    }
  };

  const esAdmin = rol === 'administrador';
  const rutaRemitente = rutaPerfilRemitente(detalleMensaje);

  if (loadingNotifs) {
    return (
      <div className="flex justify-center items-center h-64 text-[#005684] font-bold">
        Cargando centro de control...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto relative">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7]">
          <span className="text-lg"><Icon name="check" size="1.1em" /></span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#eef2ff] text-[#4f46e5] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              CENTRO DE CONTROL
            </span>
            <span className="text-[11px] text-[#64748b]">• ACTUALIZADO HOY</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-1 leading-tight">
            Centro de Notificaciones
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Bandeja de avisos recientes y preferencias de alerta de la plataforma.
          </p>
        </div>

        <div className="shrink-0">
          <button 
            onClick={() => marcarComoLeidas()}
            disabled={unreadCount === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border ${
              unreadCount > 0 
                ? 'bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe] border-[#bae6fd] cursor-pointer' 
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <span><Icon name="check" size="1.1em" /></span> Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full mt-2">
        {/* Lista de Notificaciones */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2">
              <span className="text-[#0284c7]"><Icon name="notificaciones" size="1.1em" /></span> Avisos Recientes
            </h2>
            {unreadCount > 0 && (
              <span className="bg-[#e0f2fe] text-[#0284c7] text-[11px] font-bold px-2.5 py-1 rounded-full">
                {unreadCount} No leíd{unreadCount === 1 ? 'o' : 'os'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {notificaciones.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] shadow-sm text-center">
                <p className="text-sm text-[#64748b]">No tienes notificaciones recientes.</p>
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => abrirNotificacion(notif)}
                  className={`rounded-3xl p-5 sm:p-6 border transition shadow-sm hover:shadow-md cursor-pointer flex items-start gap-4 ${
                    !notif.leido 
                      ? 'bg-[#f8fafc] border-[#bae6fd]' 
                      : 'bg-white border-[#e2e8f0]'
                  }`}
                >
                  <div className={`mt-2 shrink-0 w-2.5 h-2.5 rounded-full ${!notif.leido ? 'bg-[#0284c7]' : 'bg-transparent'}`}></div>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${notif.bg_icono || 'bg-[#f0f9ff]'} ${notif.text_icono || 'text-[#0284c7]'}`}>
                    <Icon name={iconoDesdeEmoji(notif.icono, 'correo')} size="1.1em" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1.5">
                      <h3 className={`text-[15px] ${!notif.leido ? 'font-extrabold text-[#071d37]' : 'font-bold text-[#334155]'}`}>
                        {notif.titulo || 'Notificación'}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#64748b] whitespace-nowrap">
                        {tiempoRelativo(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#475569] leading-relaxed mb-3 line-clamp-2">
                      {notif.descripcion || 'Has recibido un nuevo mensaje.'}
                    </p>
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirNotificacion(notif);
                      }}
                      className="bg-[#eef6ff] text-[#0284c7] text-[11px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#d4e7fe] transition w-fit cursor-pointer border border-[#bae6fd]"
                    >
                      {(notif.accion_texto || 'Ver mensaje').replace(/\s*[➔→]\s*$/, '')} <Icon name="siguiente" size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Lateral de Preferencias */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col">
          {esAdmin && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-6">
                <span className="text-[#dc2626]"><Icon name="convocatoria" size="1.1em" /></span> Aviso Masivo a Voluntarios
              </h2>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
                <p className="text-[13px] text-[#64748b] leading-relaxed">
                  Llega a todos los voluntarios activos que tienen habilitados los <span className="font-bold text-[#071d37]">Avisos de Emergencia Cívica</span>.
                </p>
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-semibold text-[#991b1b]">Destinatarios actuales</span>
                  <span className="text-[15px] font-extrabold text-[#dc2626]">{destinatariosAviso ?? '…'}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#071d37]">Título del aviso</label>
                  <input
                    type="text"
                    value={avisoTitulo}
                    maxLength={MAX_TITULO_AVISO}
                    onChange={(e) => setAvisoTitulo(e.target.value)}
                    placeholder="Ej: Brigada urgente en Cali"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#071d37] focus:outline-none focus:border-[#005684] focus:ring-1 focus:ring-[#005684]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#071d37]">Mensaje</label>
                    <span className="text-[10px] text-[#94a3b8]">{avisoMensaje.length}/{MAX_MENSAJE_AVISO}</span>
                  </div>
                  <textarea
                    value={avisoMensaje}
                    maxLength={MAX_MENSAJE_AVISO}
                    onChange={(e) => setAvisoMensaje(e.target.value)}
                    rows={4}
                    placeholder="Describe la emergencia, el lugar y cómo pueden ayudar."
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#071d37] resize-none focus:outline-none focus:border-[#005684] focus:ring-1 focus:ring-[#005684]"
                  />
                </div>
                <button
                  type="button"
                  onClick={solicitarEnvioAviso}
                  disabled={enviandoAviso || !avisoTitulo.trim() || !avisoMensaje.trim()}
                  className="w-full bg-[#dc2626] text-white px-5 py-3.5 rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition shadow-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span><Icon name="emergencia" size="1.1em" /></span> Enviar aviso masivo
                </button>
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-6">
            <span className="text-[#005684]"><Icon name="filtros" size="1.1em" /></span> Canales y Preferencias
          </h2>

          <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm flex flex-col gap-6 ${esAdmin ? '' : 'lg:sticky lg:top-24'}`}>
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Ajusta la forma en que el sistema despacha recordatorios y avisos críticos.
            </p>

            <div className="flex flex-col gap-4">
              {/* <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5"><Icon name="correo" size="1.1em" /></div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Alertas por Correo Electrónico</h4>
                      <button 
                        type="button"
                        onClick={() => setAlertasCorreo(!alertasCorreo)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasCorreo ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasCorreo ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Recibir resúmenes de aprobaciones y avisos en tu email.
                    </p>
                 </div>
              </div> */}

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5"><Icon name="notificaciones" size="1.1em" /></div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Notificaciones Push</h4>
                      <button 
                        type="button"
                        onClick={() => setAlertasPush(!alertasPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasPush ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasPush ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Alertas instantáneas sobre nuevas donaciones y convocatorias.
                    </p>
                 </div>
              </div>

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5"><Icon name="emergencia" size="1.1em" /></div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Avisos de Emergencia Cívica</h4>
                      <button 
                        type="button"
                        onClick={() => setAlertasEmergencia(!alertasEmergencia)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasEmergencia ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasEmergencia ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Notificaciones prioritarias de brigadas urgentes.
                    </p>
                 </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={guardarPreferencias}
              disabled={savingPrefs}
              className="w-full bg-[#005684] text-white px-5 py-3.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm mt-2 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <Icon name={savingPrefs ? 'cargando' : 'guardar'} size={14} className={savingPrefs ? 'animate-spin' : ''} /> {savingPrefs ? 'Guardando...' : 'Guardar Preferencias'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CON INFORMACIÓN DE LA TABLA MENSAJES_CONTACTO */}
      {notificacionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] relative flex flex-col gap-5">
            
            <button 
              type="button"
              onClick={cerrarModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <Icon name="cerrar" size="1.1em" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${notificacionModal.bg_icono || 'bg-[#f0f9ff]'} ${notificacionModal.text_icono || 'text-[#0284c7]'}`}>
                <Icon name={iconoDesdeEmoji(notificacionModal.icono, 'correo')} size="1.1em" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wide">
                  {ETIQUETA_TIPO[notificacionModal.tipo || 'mensaje'] || 'Notificación'}
                </span>
                <h3 className="text-lg font-extrabold text-[#071d37] leading-tight">
                  {notificacionModal.titulo || 'Nuevo mensaje'}
                </h3>
              </div>
            </div>

            {loadingDetalle ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#0284c7]">
                <div className="w-6 h-6 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold">Cargando datos del remitente...</span>
              </div>
            ) : detalleMensaje ? (
              <>
                {/* Datos del Remitente */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#64748b] font-medium">Remitente</p>
                      <p className="text-sm font-bold text-[#071d37]">{detalleMensaje.nombre_remitente || 'Anónimo'}</p>
                    </div>
                    {detalleMensaje.tipo_consulta && (
                      <span className="bg-[#e0f2fe] text-[#0284c7] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                        {detalleMensaje.tipo_consulta}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-[#64748b] font-medium">Correo electrónico</p>
                    <a 
                      href={`mailto:${detalleMensaje.email_remitente}`} 
                      className="text-xs font-bold text-[#0284c7] hover:underline"
                    >
                      {detalleMensaje.email_remitente}
                    </a>
                  </div>
                </div>

                {/* Contenido del Mensaje */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-[#071d37]">Mensaje enviado:</p>
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 max-h-[40vh] overflow-y-auto shadow-inner">
                    <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap break-words">
                      {detalleMensaje.mensaje}
                    </p>
                  </div>
                </div>

                {rutaRemitente ? (
                  <button
                    type="button"
                    onClick={() => navigate(rutaRemitente)}
                    className="bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] rounded-2xl px-4 py-3 text-xs font-bold hover:bg-[#e0f2fe] transition flex items-center justify-between gap-3 cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={detalleMensaje.remitente_rol === 'fundacion' ? 'institucion' : 'voluntario'} size={16} />
                      Ver perfil {detalleMensaje.remitente_rol === 'fundacion' ? 'de la fundación' : 'del voluntario'} remitente
                    </span>
                    <span><Icon name="siguiente" size="1.1em" /></span>
                  </button>
                ) : (
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    El remitente no había iniciado sesión al enviar el mensaje, por eso no tiene un perfil vinculado.
                  </p>
                )}

                <div className="text-[11px] text-[#64748b] font-medium flex justify-between items-center border-t border-[#f1f5f9] pt-3">
                  <span>Recibido: {new Date(detalleMensaje.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </>
            ) : (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {notificacionModal.descripcion}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              {detalleMensaje?.email_remitente && (
                <a 
                  href={`mailto:${detalleMensaje.email_remitente}?subject=Re: ${encodeURIComponent(detalleMensaje.tipo_consulta || 'Consulta')}`}
                  className="bg-[#e0f2fe] text-[#0284c7] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#bae6fd] transition flex items-center justify-center gap-2"
                >
                  <Icon name="correo" size="1.1em" /> Responder por email
                </a>
              )}
              <button 
                type="button"
                onClick={cerrarModal}
                className="bg-[#005684] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmación de aviso masivo */}
      {confirmarAviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-red-100 text-red-600"><Icon name="emergencia" size="1.1em" /></div>
              <div>
                <span className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">Confirmar envío</span>
                <h3 className="text-lg font-extrabold text-[#071d37] leading-tight">{avisoTitulo.trim()}</h3>
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 max-h-[30vh] overflow-y-auto">
              <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap break-words">{avisoMensaje.trim()}</p>
            </div>
            <p className="text-xs text-[#64748b]">
              Se enviará a <span className="font-bold text-[#071d37]">{destinatariosAviso}</span> voluntario{destinatariosAviso === 1 ? '' : 's'}. Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmarAviso(false)}
                disabled={enviandoAviso}
                className="bg-gray-100 text-[#334155] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviarAvisoMasivo}
                disabled={enviandoAviso}
                className="bg-[#dc2626] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                {enviandoAviso ? 'Enviando...' : 'Sí, enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado / errores */}
      {resultadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3"><Icon name={resultadoModal.isError ? 'advertencia' : 'completado'} size={40} className={resultadoModal.isError ? 'text-[#dc2626]' : 'text-[#059669]'} /></span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">{resultadoModal.title}</h3>
            <p className="text-xs text-[#64748b] mb-6">{resultadoModal.message}</p>
            <button
              type="button"
              onClick={() => setResultadoModal(null)}
              className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}