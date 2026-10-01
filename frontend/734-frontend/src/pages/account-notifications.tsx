import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';

export function AccountNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  
  // Preferencias
  const [alertasCorreo, setAlertasCorreo] = useState(true);
  const [alertasPush, setAlertasPush] = useState(true);
  const [alertasEmergencia, setAlertasEmergencia] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hook completo de notificaciones para este usuario (sin límite para la vista completa)
  const { notificaciones, unreadCount, loading: loadingNotifs, marcarComoLeidas } = useNotifications(userId);

  const tiempoRelativo = (fecha: string) => {
    const segundos = Math.floor((new Date().getTime() - new Date(fecha).getTime()) / 1000);
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

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('alertas_correo, alertas_push, alertas_emergencia')
        .eq('id', user.id)
        .single();

      if (perfil) {
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
          <span className="text-lg">✓</span>
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
            <span>✓</span> Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full mt-2">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2">
              <span className="text-[#0284c7]">🔔</span> Avisos Recientes
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
                <div key={notif.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm flex items-start gap-4 transition hover:shadow-md">
                  <div className={`mt-2 shrink-0 w-2.5 h-2.5 rounded-full ${!notif.leido ? 'bg-[#0284c7]' : 'bg-transparent'}`}></div>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${notif.bg_icono || 'bg-[#f0f9ff]'} ${notif.text_icono || 'text-[#0284c7]'}`}>
                    {notif.icono || '✉️'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                      <h3 className="text-[15px] font-extrabold text-[#071d37]">{notif.titulo}</h3>
                      <span className="text-[11px] font-semibold text-[#64748b] whitespace-nowrap">
                        {tiempoRelativo(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#475569] leading-relaxed mb-3">
                      {notif.descripcion}
                    </p>
                    
                    {notif.accion_texto && (
                      <button className="bg-[#eef6ff] text-[#0284c7] text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#d4e7fe] transition w-fit cursor-pointer">
                        {notif.accion_texto}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:w-[380px] shrink-0">
          <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-6">
            <span className="text-[#005684]">🎛️</span> Canales y Preferencias
          </h2>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm flex flex-col gap-6 sticky top-24">
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Ajusta la forma en que el sistema 7:34 AM despacha recordatorios y avisos críticos.
            </p>

            <div className="flex flex-col gap-4">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">✉️</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Alertas por Correo Electrónico</h4>
                      <button 
                        onClick={() => setAlertasCorreo(!alertasCorreo)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasCorreo ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasCorreo ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Recibir resúmenes de aprobaciones y avisos del sistema en tu email principal.
                    </p>
                 </div>
              </div>

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">🔔</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Notificaciones Push</h4>
                      <button 
                        onClick={() => setAlertasPush(!alertasPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasPush ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasPush ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Alertas instantáneas en el navegador o app sobre nuevas donaciones y convocatorias.
                    </p>
                 </div>
              </div>

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">🚨</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Avisos de Emergencia Cívica</h4>
                      <button 
                        onClick={() => setAlertasEmergencia(!alertasEmergencia)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${alertasEmergencia ? 'bg-[#005684]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${alertasEmergencia ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      Notificaciones prioritarias cuando se activa una brigada urgente en terreno.
                    </p>
                 </div>
              </div>
            </div>

            <button 
              onClick={guardarPreferencias}
              disabled={savingPrefs}
              className="w-full bg-[#005684] text-white px-5 py-3.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm mt-2 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span>{savingPrefs ? '⏳' : '💾'}</span> {savingPrefs ? 'Guardando...' : 'Guardar Preferencias'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}