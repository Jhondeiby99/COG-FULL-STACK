import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { Icon } from '../components/Icon';
export function Login() {
  const navigate = useNavigate();
  const [activeUserType, setActiveUserType] = useState<'voluntario' | 'fundacion' | 'administrador'>('voluntario');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Autenticación básica con Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    // 2. VALIDACIÓN ESTRICTA DE ROL (Verificar en la tabla perfiles)
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle();

    if (perfilError || !perfilData) {
      await supabase.auth.signOut();
      setError('No se encontró un perfil cívico asociado a este correo.');
      setLoading(false);
      return;
    }

    const rolUsuario = perfilData.rol?.toLowerCase();

    if (activeUserType === 'voluntario' && rolUsuario !== 'voluntario' && rolUsuario !== 'administrador') {
      await supabase.auth.signOut();
      setError('Esta cuenta pertenece a una Fundación. Por favor selecciona la pestaña "Fundación / ONG".');
      setLoading(false);
      return;
    }

    if (activeUserType === 'fundacion' && rolUsuario !== 'fundacion' && rolUsuario !== 'administrador') {
      await supabase.auth.signOut();
      setError('Esta cuenta pertenece a un Voluntario. Por favor selecciona la pestaña "Voluntario / Donante".');
      setLoading(false);
      return;
    }

    if (activeUserType !== 'administrador' && rolUsuario === 'administrador') {
      await supabase.auth.signOut();
      setError('Esta cuenta pertenece a un Administrador, selecciona la opción de Admin.');
      setLoading(false);
      return;
    }

    // 4. Registro de Sesión Activa
    const ua = navigator.userAgent;
    let browserName = "Web";
    if (ua.includes("Firefox")) browserName = "Firefox";
    else if (ua.includes("Edg")) browserName = "Edge";
    else if (ua.includes("Chrome")) browserName = "Chrome";
    else if (ua.includes("Safari")) browserName = "Safari";

    const esMovil = /Mobile|Android|iP(ad|hone)/.test(ua);
    const dispositivoInfo = `${esMovil ? 'Móvil' : 'Escritorio'} - ${browserName} (${navigator.platform})`;
    const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data: sessionData } = await supabase
      .from('sesiones_usuario')
      .insert([{
        user_id: data.user.id,
        dispositivo: dispositivoInfo,
        ubicacion: zonaHoraria,
        ip_o_sistema: 'Red Protegida',
        es_actual: true
      }])
      .select('id')
      .single();

    if (sessionData) {
      localStorage.setItem('db_session_id', sessionData.id);
    }

    setLoading(false);
    
    if (rolUsuario === 'administrador') {
      navigate('/dashboard/admin-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <main className="login-layout min-h-screen flex items-center justify-center bg-gray-50 p-3 overflow-y-auto">
      <section className="login-form-container w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 my-auto">
        <div className="form-wrapper flex flex-col">
          
          {/* Botón de invitado compacto */}
          <div className="mb-3">
            <Link to="/" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005684] hover:underline bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
              ← Regresar como invitado
            </Link>
          </div>

          <div className="top-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <span className="time-icon"><Icon name="reloj" size="1.1em" /></span> 7:34 AM <span className="status-dot">•</span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-[#071d37] mb-1">Bienvenido de nuevo</h1>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Plataforma cívica que articula solidaridad activa, fundaciones acreditadas y voluntariado.
          </p>

          {/* Selector compacto de tipo de usuario */}
          <div className="user-type-toggle grid grid-cols-3 relative bg-gray-100 p-1 rounded-2xl mb-4">
            <button 
              type="button" 
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${activeUserType === 'voluntario' ? 'bg-[#005684] text-white shadow-sm' : 'text-gray-600'}`}
              onClick={() => setActiveUserType('voluntario')}
            >
              <Icon name="voluntario" size="1.1em" /> Voluntario
            </button>

            <button 
              type="button" 
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${activeUserType === 'fundacion' ? 'bg-[#005684] text-white shadow-sm' : 'text-gray-600'}`}
              onClick={() => setActiveUserType('fundacion')}
            >
              <Icon name="fundacion" size="1.1em" /> Fundación
            </button>

            <button 
              type="button" 
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${activeUserType === 'administrador' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600'}`}
              onClick={() => setActiveUserType('administrador')}
            >
              <Icon name="seguridad" size="1.1em" /> Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="input-group">
              <div className="label-row flex justify-between text-[11px] mb-1">
                <label htmlFor="email" className="font-bold text-gray-700">Correo electrónico</label>
                <span className="text-gray-400">Requerido</span>
              </div>
              <div className="input-wrapper relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-xs"><Icon name="correo" size="1.1em" /></span>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="ejemplo@correo.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#005684]"
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row flex justify-between text-[11px] mb-1">
                <label htmlFor="password" className="font-bold text-gray-700">Contraseña de acceso</label>
                <span className="text-gray-400">Mín. 6 caracteres</span>
              </div>
              <div className="input-wrapper relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-xs"><Icon name="candado" size="1.1em" /></span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-9 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#005684]"
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  <Icon name={showPassword ? 'ocultar' : 'ver'} size={18} />
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

            <div className="form-options flex justify-between items-center text-xs my-1">
              <label className="remember-me flex items-center gap-1.5 text-gray-600 cursor-pointer">
                <input type="checkbox" className="accent-[#005684]" /> Recordar sesión
              </label>
              <Link to="/forgot-password" className="text-[#005684] font-bold hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" className="w-full bg-[#005684] hover:bg-[#004266] text-white py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2 mt-1" disabled={loading}>
              {loading ? 'Verificando perfil...' : 'Iniciar Sesión en 7:34 AM'} <span>→</span>
            </button>
          </form>

          {/* Banner de seguridad más compacto */}
          <div className="security-banner mt-4 flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <div className="shield-icon text-base"><Icon name="seguridad" size="1.1em" /></div>
            <div className="security-info text-left">
              <h4 className="text-[11px] font-bold text-[#071d37]">Acceso Seguro y Transparente <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">TLS 1.3</span></h4>
              <p className="text-[10px] text-gray-500">Identidad cívica blindada en tiempo real.</p>
            </div>
          </div>

          <div className="login-footer mt-4 text-center">
            <Link to="/signup" className="text-xs font-bold text-[#005684] hover:underline">¿Aún no tienes cuenta? Regístrate gratis <Icon name="externo" size="1.1em" /></Link>
          </div>

        </div>
      </section>
    </main>
  );
}