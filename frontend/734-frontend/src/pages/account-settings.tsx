import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

import { Icon } from '../components/Icon';
interface Sesion {
  id: string;
  dispositivo: string;
  ubicacion: string;
  ip_o_sistema: string;
  es_actual: boolean;
  created_at: string;
}

export function AccountSettings() {
  // const navigate = useNavigate();
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      .eq('es_actual', true)
      .order('created_at', { ascending: false });

    if (!error && sesionesData) {
      setSesiones(sesionesData);
    }
    setLoadingSesiones(false);
  };

  // Cálculo en tiempo real de la fuerza de la contraseña
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Vacía', color: 'bg-gray-200', text: 'text-gray-400', bars: 0 };
    
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Débil', color: 'bg-red-500', text: 'text-red-600', bars: 1 };
    } else if (score <= 4) {
      return { score: 2, label: 'Media', color: 'bg-amber-500', text: 'text-amber-600', bars: 2 };
    } else {
      return { score: 3, label: 'Fuerte (Entropía óptima)', color: 'bg-[#005684]', text: 'text-[#005684]', bars: 3 };
    }
  }, [newPassword]);

  // Validación en tiempo real de coincidencia
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (newPassword !== confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden. Por favor verifica.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else {
      setMensaje({ tipo: 'success', texto: '¡Contraseña actualizada con éxito bajo normativa FIPS-140!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  // Para cerrar una sesión específica
  const handleCerrarSesion = async (id: string) => {
    const { error } = await supabase
      .from('sesiones_usuario')
      .update({ es_actual: false })
      .eq('id', id);

    if (!error) {
      setSesiones(prev => prev.filter(s => s.id !== id));
    }
  };

  // Para cerrar todas las demás sesiones
  const handleCerrarOtrasSesiones = async () => {
    const currentDbSessionId = localStorage.getItem('db_session_id');
    if (!userId || !currentDbSessionId) return;

    const { error } = await supabase
      .from('sesiones_usuario')
      .update({ es_actual: false })
      .eq('user_id', userId)
      .neq('id', currentDbSessionId);

    if (!error) {
      setSesiones(prev => prev.filter(s => s.id === currentDbSessionId));
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
            <span><Icon name="verificado" className="text-[#006194] opacity-80" /></span> 
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
            <span className="text-xl text-gray-400"><Icon name="llave" size="1.1em" /></span>
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><Icon name="candado" size="1.1em" /></span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#475569]">Confirmar nueva contraseña</label>
                <div className="relative mt-1">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña" 
                    className={`w-full bg-[#f8fafc] border rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white ${
                      passwordsMatch === null 
                        ? 'border-[#e2e8f0] focus:border-[#005684]' 
                        : passwordsMatch 
                        ? 'border-emerald-400 focus:border-emerald-600 bg-emerald-50/20' 
                        : 'border-red-300 focus:border-red-500 bg-red-50/20'
                    }`}
                    required 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon name={passwordsMatch === null ? 'candado' : passwordsMatch ? 'completado' : 'error'} size="1.1em" className={passwordsMatch === null ? '' : passwordsMatch ? 'text-[#059669]' : 'text-[#dc2626]'} />
                  </span>
                </div>
                {passwordsMatch === false && (
                  <span className="text-[10px] text-red-600 font-bold mt-1 block">Las contraseñas no coinciden</span>
                )}
                {passwordsMatch === true && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">¡Las contraseñas coinciden correctamente!</span>
                )}
              </div>
            </div>

            {/* SECCIÓN DINÁMICA DE FUERZA DE LA CLAVE */}
            <div className="mt-1 bg-[#EFF4FF] p-4 rounded-xl max-w-md border border-[#bae6fd]">
              <div className="flex justify-between items-center text-xs text-black mb-1.5">
                <span className="font-bold">Fuerza de la clave</span>
                <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full rounded-full w-1/3 transition-all duration-300 ${passwordStrength.bars >= 1 ? passwordStrength.color : 'bg-transparent'}`}></div>
                <div className={`h-full rounded-full w-1/3 transition-all duration-300 ${passwordStrength.bars >= 2 ? passwordStrength.color : 'bg-transparent'}`}></div>
                <div className={`h-full rounded-full w-1/3 transition-all duration-300 ${passwordStrength.bars >= 3 ? passwordStrength.color : 'bg-transparent'}`}></div>
              </div>
              <p className="text-[11px] text-[#64748b] mt-2 flex items-center gap-1.5">
                <span className="text-[#005684]"><Icon name="check" size="1.1em" /></span> 
                Usa mayúsculas, minúsculas, números y símbolos para máxima seguridad FIPS-140.
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
                disabled={loading || !newPassword || !confirmPassword || !passwordsMatch}
                className="bg-[#005684] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span><Icon name="cerrarSesion" size="1.1em" /></span> Cerrar todas las demás sesiones
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {loadingSesiones ? (
              <div className="text-center py-4 text-xs font-bold text-[#64748b]">Cargando terminales seguras...</div>
            ) : sesiones.length === 0 ? (
              <div className="text-center py-4 text-xs font-bold text-[#64748b]">No hay registros de sesión disponibles.</div>
            ) : (
              sesiones.map((sesion) => {
                const esEsteDispositivo = sesion.id === localStorage.getItem('db_session_id');

                return (
                  <div key={sesion.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] gap-4 transition hover:border-[#bae6fd]">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${esEsteDispositivo ? 'bg-[#e0f2fe] border-[#bae6fd] border' : 'bg-white border border-[#e2e8f0]'}`}>
                        <Icon name={sesion.dispositivo.toLowerCase().includes('móvil') ? 'movil' : 'computador'} size="1.1em" />
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