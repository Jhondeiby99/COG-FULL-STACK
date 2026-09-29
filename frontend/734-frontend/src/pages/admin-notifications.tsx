import { useState } from 'react';

export function AdminNotifications() {
  const [alertasCorreo, setAlertasCorreo] = useState(true);
  const [alertasPush, setAlertasPush] = useState(true);
  const [alertasEmergencia, setAlertasEmergencia] = useState(true);

  // Datos simulados idénticos al mockup
  const notificaciones = [
    {
      id: 1,
      titulo: 'Nueva solicitud de fundación',
      descripcion: 'Fundación Pies Cálidos ha enviado sus documentos para aprobación.',
      tiempo: 'Hace 25 min',
      icono: '📄',
      bgIcono: 'bg-[#eef2ff]',
      textIcono: 'text-[#4f46e5]',
      nuevo: true,
      accion: 'Ver Solicitud ➔',
    },
    {
      id: 2,
      titulo: 'Nueva brigada de voluntarios',
      descripcion: 'Se completaron los cupos de voluntarios para la jornada médica en Ciudad Bolívar.',
      tiempo: 'Hace 2 h',
      icono: '👥',
      bgIcono: 'bg-[#e2e8f0]',
      textIcono: 'text-[#475569]',
      nuevo: true,
    },
    {
      id: 3,
      titulo: 'Alerta de verificación',
      descripcion: 'Tu reporte mensual de impacto ha sido validado satisfactoriamente.',
      tiempo: 'Ayer',
      icono: '🛡️',
      bgIcono: 'bg-[#ecfdf5]',
      textIcono: 'text-[#059669]',
      nuevo: true,
    },
    {
      id: 4,
      titulo: 'Actualización de seguridad',
      descripcion: 'Nuevo inicio de sesión detectado desde Bogotá D.C.',
      tiempo: 'Hace 2 días',
      icono: '🔄',
      bgIcono: 'bg-[#f1f5f9]',
      textIcono: 'text-[#334155]',
      nuevo: true,
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      
      {/* CABECERA */}
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
          <button className="bg-[#f0f9ff] text-[#0284c7] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#e0f2fe] transition flex items-center gap-2 shadow-sm cursor-pointer border border-[#bae6fd]">
            <span>✓</span> Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* GRID DE 2 COLUMNAS (Avisos Izquierda / Preferencias Derecha) */}
      <div className="flex flex-col lg:flex-row gap-8 w-full mt-2">
        
        {/* COLUMNA IZQUIERDA: Avisos Recientes */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2">
              <span className="text-[#0284c7]">🔔</span> Avisos Recientes
            </h2>
            <span className="bg-[#e0f2fe] text-[#0284c7] text-[11px] font-bold px-2.5 py-1 rounded-full">
              4 No leídos
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {notificaciones.map((notif) => (
              <div key={notif.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm flex items-start gap-4 transition hover:shadow-md">
                
                {/* Indicador de Nuevo (Punto Azul) */}
                <div className="mt-2 shrink-0 w-2.5 h-2.5 bg-[#0284c7] rounded-full"></div>
                
                {/* Icono de Categoría */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${notif.bgIcono} ${notif.textIcono}`}>
                  {notif.icono}
                </div>

                {/* Contenido de Notificación */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <h3 className="text-[15px] font-extrabold text-[#071d37]">{notif.titulo}</h3>
                    <span className="text-[11px] font-semibold text-[#64748b] whitespace-nowrap">{notif.tiempo}</span>
                  </div>
                  <p className="text-[13px] text-[#475569] leading-relaxed mb-3">
                    {notif.descripcion}
                  </p>
                  
                  {notif.accion && (
                    <button className="bg-[#eef6ff] text-[#0284c7] text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#d4e7fe] transition w-fit cursor-pointer">
                      {notif.accion}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* COLUMNA DERECHA: Preferencias */}
        <div className="w-full lg:w-[380px] shrink-0">
          
          <h2 className="text-lg font-bold text-[#071d37] flex items-center gap-2 mb-6">
            <span className="text-[#005684]">🎛️</span> Canales y Preferencias
          </h2>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm flex flex-col gap-6 sticky top-24">
            
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Ajusta la forma en que el sistema 7:34 AM despacha recordatorios y avisos críticos.
            </p>

            <div className="flex flex-col gap-4">
              
              {/* Toggle 1 */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">✉️</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Alertas por Correo Electrónico</h4>
                      {/* Toggle Button */}
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

              {/* Toggle 2 */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">🔔</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Notificaciones Push</h4>
                      {/* Toggle Button */}
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

              {/* Toggle 3 */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex gap-4">
                 <div className="text-xl shrink-0 mt-0.5">🚨</div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[14px] font-bold text-[#071d37] leading-tight">Avisos de Emergencia Cívica</h4>
                      {/* Toggle Button */}
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

            <button className="w-full bg-[#005684] text-white px-5 py-3.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm mt-2 flex justify-center items-center gap-2 cursor-pointer">
              <span>💾</span> Guardar Preferencias
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}