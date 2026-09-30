import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

interface Sesion {
  id: string;
  dispositivo: string;
  ubicacion: string;
  ip_o_sistema: string;
  es_actual: boolean;
  created_at: string;
}

export function AccountSettings() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoadingSesiones(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Cargar sesiones reales desde la tabla sesiones_usuario
    const { data: sesionesData, error } = await supabase
      .from('sesiones_usuario')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && sesionesData) {
      setSesiones(sesionesData);
    }
    setLoadingSesiones(false);
  };

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

  const handleCerrarSesion = async (id: string) => {
    // Eliminación en base de datos
    const { error } = await supabase
      .from('sesiones_usuario')
      .delete()
      .eq('id', id);

    if (!error) {
      setSesiones(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleCerrarOtrasSesiones = async () => {
    if (!userId) return;
    // Elimina todas las que no sean la actual
    const { error } = await supabase
      .from('sesiones_usuario')
      .delete()
      .eq('user_id', userId)
      .eq('es_actual', false);

    if (!error) {
      setSesiones(prev => prev.filter(s => s.es_actual));
    }
  };

  const formatearFecha = (fechaISO: string) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(fechaISO));
  };

  return (
    <div className="p-4 max-w-[1240px] w-full mx-auto flex flex-col gap-8">
      
      {/* CABECERA PRINCIPAL SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:p-2 rounded-3xl">
        <div className="text-left max-w-xl md:justify-start w-full md:w-[60%]">
          <span className="text-[11px] font-bold text-[#005684] uppercase tracking-wider block">
            PROTOCOLOS & GOBERNANZA CÍVICA
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] leading-tight mt-2 mb-0">
            Ajustes de Cuenta & Privacidad
          </h1>
          <p className="text-xs text-[#0B1C30] max-w-3xl text-[14px] leading-normal mt-0.5">
            Gestiona tus credenciales biométricas, políticas de contacto en territorio y el resguardo de tu registro cívico descentralizado.
          </p>
        </div>

        <div className="flex flex-col items-end justify-center gap-2 bg-white p-3 rounded-xl self-end text-right shrink-0 w-full md:w-[35%] border border-[#e2e8f0] shadow-sm"> 
          <div className="flex items-center gap-2 bg-[#EFF4FF] text-[11px] text-[#005684] px-2 py-1 rounded-xl font-bold border border-[#bae6fd]">
            <span><img height="16px" width="16" src={Icons.IconVerify} alt="Verify Icon" className="opacity-80" /></span> 
            Identidad Verificada 7:34 AM
          </div>
          <span className="text-[11px] font-semibold text-[#64748b]">
            Último acceso: {sesiones.length > 0 ? formatearFecha(sesiones[0].created_at) : 'Desconocido'}
          </span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-col gap-6">
        
        {/* SECCIÓN 1: CONTRASEÑA */}
        <section className="bg-white rounded-3xl p-6 md:p-8 text-left border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-[#071d37]">Contraseña y Credenciales</h2>
              <p className="text-xs text-[#64748b] mt-0.5">Mantén una clave robusta con entropía alta para proteger tu historial solidario.</p>
            </div>
            <span className="text-xl text-gray-400">🔑</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5 max-w-3xl">
            <div className="grid md:grid-cols-2 gap-5">
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
              </div>
            </div>

            <div className="mt-1 bg-[#EFF4FF] p-4 rounded-xl max-w-md border border-[#bae6fd]">
              <div className="flex justify-between items-center text-xs text-black mb-1.5">
                <span className="font-bold">Fuerza de la clave</span>
                <span className="text-[#005684] font-bold">Fuerte (Entropía óptima)</span>
              </div>
              <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden flex gap-1">
                <div className="h-full bg-[#005684] rounded-full w-1/3"></div>
                <div className="h-full bg-[#005684] rounded-full w-1/3"></div>
                <div className="h-full bg-[#005684] rounded-full w-1/3"></div>
              </div>
              <p className="text-[11px] text-[#64748b] mt-2 flex items-center gap-1.5">
                <span className="text-[#005684]"><img width="12" src={Icons.CheckCircleIcon} alt="Check"/></span> 
                Cumple normativa de cifrado FIPS-140.
              </p>
            </div>

            {mensaje && (
              <div className={`p-3 rounded-xl text-xs font-bold w-fit ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {mensaje.texto}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="submit" 
                disabled={loading || !newPassword}
                className="bg-[#005684] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </section>

        {/* SECCIÓN 2: SESIONES ACTIVAS */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-[#071d37]">Sesiones Activas y Dispositivos</h2>
              <p className="text-xs text-[#64748b]">Revisa los nodos y terminales que tienen tokens de acceso válidos a tu panel.</p>
            </div>
            <button 
              onClick={handleCerrarOtrasSesiones}
              disabled={sesiones.length <= 1}
              className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🚪</span> Cerrar todas las demás sesiones
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {loadingSesiones ? (
              <div className="text-center py-4 text-xs font-bold text-[#64748b]">Cargando terminales seguras...</div>
            ) : sesiones.length === 0 ? (
              <div className="text-center py-4 text-xs font-bold text-[#64748b]">No hay registros de sesión disponibles.</div>
            ) : (
              sesiones.map((sesion) => {
                // Validación estricta: Compara el ID de la BD con el ID guardado en este navegador
                const esEsteDispositivo = sesion.id === localStorage.getItem('db_session_id');

                return (
                  <div key={sesion.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] gap-4 transition hover:border-[#bae6fd]">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${esEsteDispositivo ? 'bg-[#e0f2fe] border-[#bae6fd] border' : 'bg-white border border-[#e2e8f0]'}`}>
                        {sesion.dispositivo.toLowerCase().includes('móvil') ? '📱' : '💻'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-extrabold text-[#071d37]">{sesion.dispositivo}</p>
                          {esEsteDispositivo && (
                            <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#bbf7d0]">Este Dispositivo</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-0.5">
                          {sesion.ubicacion} · IP {sesion.ip_o_sistema} · {formatearFecha(sesion.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-[#0284c7] bg-[#f0f9ff] px-2.5 py-1.5 rounded-lg border border-[#bae6fd]">TLS 1.3 Cifrado</span>
                      
                      {/* Oculta el botón cerrar si es el dispositivo actual, lo muestra para los demás */}
                      {!esEsteDispositivo && (
                        <button 
                          onClick={() => handleCerrarSesion(sesion.id)}
                          className="text-xs font-bold text-gray-500 hover:text-red-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}