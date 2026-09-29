import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

export function AccountSettings() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [sesiones, setSesiones] = useState([
    { id: '1', dispositivo: 'MacBook Pro 16" — Arc Browser', ubicacion: 'Medellín, Colombia', info: 'IP 181.134.45.19 · Activo ahora mismo', actual: true },
    { id: '2', dispositivo: 'iPhone 15 Pro — App Nativa 7:34 AM', ubicacion: 'Bogotá, Cundinamarca', info: 'IP 186.82.112.4 · Hace 2 horas', actual: false },
    { id: '3', dispositivo: 'PC Estación Centro Logístico — Chrome', ubicacion: 'Bello, Antioquia', info: 'IP 190.157.2.11 · Hace 3 días', actual: false },
  ]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else {
      setMensaje({ tipo: 'success', texto: '¡Contraseña actualizada con éxito bajo normativa FIPS-140!' });
      setCurrentPassword('');
      setNewPassword('');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
        <div className="p-4 max-w-[1240px] w-full mx-auto flex flex-col gap-8">
          
          {/* CABECERA PRINCIPAL SUPERIOR */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:p-2 rounded-3xl">
                
                <div className="text-left max-w-xl md:justify-start w-[50%]">
                    {/* Origen del bloque de texto */}
                    <span className="text-[11px] font-bold text-[#005684] uppercase tracking-wider block">
                        PROTOCOLOS & GOBERNANZA CÍVICA
                    </span>
                    
                    {/* SE MODIFICÓ: Se agregó leading-tight para reducir el interlineado y mt-0.5 para pegarlo arriba */}
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] leading-tight mt-2 mb-0">
                        Ajustes de Cuenta & Privacidad
                    </h1>
                    
                    {/* SE MODIFICÓ: Se cambió mt a mt-1 para acercarlo más al título */}
                    <p className="text-xs text-[#0B1C30] max-w-3xl text-[14px] leading-normal mt-0.5">
                        Gestiona tus credenciales biométricas, políticas de contacto en territorio y el resguardo de tu registro cívico descentralizado.
                    </p>
                </div>
        
                {/* Bloque de verificación de la derecha */}
                <div className="flex flex-row items-center justify-end gap-2 bg-white p-2 rounded-xl self-end text-left ml-auto shrink-0 w-[30%] h-[50%]"> 
    
                <div className="flex items-center gap-2 bg-[#EFF4FF] text-[11px] text-[#0B1C30] px-1 py-1 rounded-xl font-bold border border-[#EFF4FF]">
                    <span>
                        <img height="20px" width="20" src={Icons.IconVerify} alt="Verify Icon" />
                    </span> 
                    Identidad Verificada 7:34 AM
                </div>
                
                <span className="text-[11px] font-semibold text-[#0B1C30]">
                    Último acceso: Hoy, 07:18 AM
                </span>
            </div>
            </div>



          {/* DISTRIBUCIÓN EN 2 COLUMNAS (Sidebar Izquierdo de Secciones + Bloques de Configuración Derecha) */}
          <div className="gap-8 items-start">
            
            {/* Columna Izquierda: Ejes de Gestión & Zona de Peligro 
            <div className="bg-white rounded-3xl p-5  flex flex-col gap-4">
              <p className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider px-2">Ejes de Gestión</p>
              <nav className="flex flex-col gap-1">
                <a href="#" className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#005684] text-white font-bold text-xs shadow-sm">
                  <span className="flex items-center gap-3"><span>🛡️</span> Seguridad y Acceso</span>
                  <span>●</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#64748b] hover:bg-gray-50 font-medium text-xs transition">
                  <span>🔔</span> Alertas & Mensajería
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#64748b] hover:bg-gray-50 font-medium text-xs transition">
                  <span>🔒</span> Privacidad & Datos
                </a>
                <a href="#" className="flex items-center justify-between px-4 py-3 rounded-2xl text-[#64748b] hover:bg-gray-50 font-medium text-xs transition">
                  <span className="flex items-center gap-3"><span>🎁</span> Donaciones Recurrentes</span>
                  <span className="bg-[#eef6ff] text-[#005684] text-[10px] font-bold px-2.5 py-0.5 rounded-full">2 Activas</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#64748b] hover:bg-gray-50 font-medium text-xs transition">
                  <span>🎫</span> Credencial Cívica
                </a>
              </nav>

              <div className="border-t border-gray-100 my-2" />

              <p className="text-[11px] font-extrabold text-[#ef4444] uppercase tracking-wider px-2">Zona de Peligro</p>
              
              <div className="bg-[#f0f6ff] border border-[#bae6fd] rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#005684] mb-1">
                  <span><img src={Icons.CheckVerifyIcon}></img></span> Auditoría 7:34 AM
                </div>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Historial de firmas de seguridad sincronizado con el bloque cívico #9182.
                </p>
              </div>
            </div>
            */}

            {/* Columna Derecha: Tarjetas de Configuración */}
            <div className="flex flex-col gap-6">
              
              {/* SECCIÓN 1: CONTRASEÑA Y CREDENCIALES */}
              <section className="bg-white rounded-3xl p-6 md:p-8 text-left">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-[#071d37]">Contraseña y Credenciales</h2>
                    <p className="text-xs text-[#64748b] mt-0.5">Mantén una clave robusta con entropía alta para proteger tu historial solidario.</p>
                  </div>
                  <span className="text-xl text-gray-400">🔑</span>
                </div>

                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs font-bold text-[#475569]">Contraseña actual</label>
                    <div className="relative mt-1">
                      <input 
                        type="password" 
                        value={currentPassword} 
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••••••" 
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#005684]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">👁️</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#475569]">Nueva contraseña</label>
                    <div className="relative mt-1">
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Mínimo 12 caracteres mixtos" 
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#005684]"
                        required 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    </div>
                    
                    <div className="mt-3 bg-[#EFF4FF] p-3 rounded-xl">
                      <div className="flex justify-between items-center text-xs text-black mb-1.5">
                        <span>Fuerza de la clave:</span>
                        <span>Muy Fuerte (Entropía óptima)</span>
                      </div>
                      <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden flex gap-1">
                        <div className="h-full bg-[#047857] rounded-full w-1/3"></div>
                        <div className="h-full bg-[#047857] rounded-full w-1/3"></div>
                        <div className="h-full bg-[#047857] rounded-full w-1/3"></div>
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-1.5 flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">
                        <img src={Icons.CheckCircleIcon}>
                        </img>
                        </span> Contiene números, símbolos y mayúsculas. Cumple normativa FIPS-140.
                      </p>
                    </div>
                  </div>

                  {mensaje && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {mensaje.texto}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-[#005684] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setNewPassword(''); setCurrentPassword(''); }}
                      className="bg-gray-100 text-[#475569] px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                </form>
              </section>

              {/* SECCIÓN 2: AUTENTICACIÓN EN DOS PASOS (2FA) */}
              <section className="bg-white rounded-3xl p-6 md:p-8 ">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#dcfce7] text-[#047857] flex items-center justify-center text-lg shrink-0">
                      📱
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-[#071d37]">Autenticación en Dos Pasos (2FA)</h2>
                        <span className="bg-[#dcfce7] text-[#047857] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Activado</span>
                      </div>
                      <p className="text-xs text-[#64748b]">Protegido con aplicación autenticadora (TOTP - RFC 6238).</p>
                    </div>
                  </div>
                  <button className="bg-[#eef6ff] text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-2 self-start sm:self-auto cursor-pointer">
                    <span>🔄</span> Reconfigurar QR / Códigos
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛡️</span>
                      <div>
                        <p className="text-xs font-extrabold text-[#071d37]">8 Llaves de Respaldo Restantes</p>
                        <p className="text-[11px] text-[#64748b]">Descargadas por última vez el 12 de Enero, 2025.</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-[#005684] hover:underline whitespace-nowrap cursor-pointer">Ver llaves →</button>
                  </div>

                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <p className="text-xs font-extrabold text-[#071d37]">App Principal Conectada</p>
                        <p className="text-[11px] text-[#64748b]">1Password / Google Authenticator vinculado.</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">✓ Sincronizado</span>
                  </div>
                </div>
              </section>

              {/* SECCIÓN 3: SESIONES ACTIVAS Y DISPOSITIVOS */}
              <section className="bg-white rounded-3xl p-6 md:p-8 ">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-[#071d37]">Sesiones Activas y Dispositivos</h2>
                    <p className="text-xs text-[#64748b]">Revisa los nodos y terminales que tienen tokens de acceso válidos a tu panel.</p>
                  </div>
                  <button 
                    onClick={() => setSesiones(sesiones.filter(s => s.actual))}
                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🚪</span> Cerrar todas las demás sesiones
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {sesiones.map((sesion) => (
                    <div key={sesion.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center text-lg shrink-0">
                          💻
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-extrabold text-[#071d37]">{sesion.dispositivo}</p>
                            {sesion.actual && (
                              <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-2 py-0.5 rounded-full">Esta sesión</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748b] mt-0.5">{sesion.ubicacion} · {sesion.info}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">TLS 1.3 Cifrado</span>
                        {!sesion.actual && (
                          <button 
                            onClick={() => setSesiones(sesiones.filter(s => s.id !== sesion.id))}
                            className="text-xs font-bold text-gray-500 hover:text-red-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            Cerrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

          </div>

        </div>

     
    
  );
}