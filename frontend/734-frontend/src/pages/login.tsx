import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [activeUserType, setActiveUserType] = useState<'voluntario' | 'fundacion'>('voluntario');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    if (data.user) {
      const ua = navigator.userAgent;
      
      // 1. Detectar navegador
      let browserName = "Web";
      if (ua.includes("Firefox")) browserName = "Firefox";
      else if (ua.includes("Edg")) browserName = "Edge";
      else if (ua.includes("Chrome")) browserName = "Chrome";
      else if (ua.includes("Safari")) browserName = "Safari";

      // 2. Armar string detallado
      const esMovil = /Mobile|Android|iP(ad|hone)/.test(ua);
      const dispositivoInfo = `${esMovil ? 'Móvil' : 'Escritorio'} - ${browserName} (${navigator.platform})`;
      const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data: sessionData, error: sessionError } = await supabase
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
    }

    navigate('/');
  };

  return (
    <main className="login-layout">
      <section className="login-form-container">
        <div className="form-wrapper">
          
          <div className="top-badge">
            <span className="time-icon">🕒</span> 7:34 AM <span className="status-dot">•</span>
          </div>

          <h1>Bienvenido de nuevo</h1>
          <p className="subtitle">
            Plataforma cívica que articula solidaridad activa, fundaciones acreditadas y voluntariado.
          </p>

          <div className="user-type-toggle">
            <div 
              className="sliding-background"
              style={{ transform: activeUserType === 'voluntario' ? 'translateX(0)' : 'translateX(100%)' }}
            ></div>

            <button 
              type="button" 
              className={`toggle-btn ${activeUserType === 'voluntario' ? 'active' : ''}`}
              onClick={() => setActiveUserType('voluntario')}
            >
              <span className="icon">🙋</span> Voluntario / Donante
            </button>

            <button 
              type="button" 
              className={`toggle-btn ${activeUserType === 'fundacion' ? 'active' : ''}`}
              onClick={() => setActiveUserType('fundacion')}
            >
              <span className="icon">🏢</span> Fundación / ONG
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="email">Correo electrónico</label>
                <span className="helper-text">Requerido</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon left">✉️</span>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="ejemplo@correo.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Contraseña de acceso</label>
                <span className="helper-text">Mín. 6 caracteres</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon left">🔒</span>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <span className="input-icon right">👁️</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Recordar sesión
              </label>
              <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión en 7:34 AM'} <span>→</span>
            </button>
          </form>
          
          <div className="divider"><span>O CONTINÚA CON</span></div>

          <div className="alt-login-buttons">
            <button className="btn-outline"><span className="icon">G</span> Google</button>
            <button className="btn-outline"><span className="icon">📄</span> Firma / RUT</button>
          </div>

          <div className="security-banner">
            <div className="shield-icon">🛡️</div>
            <div className="security-info">
              <h4>Acceso Seguro y Transparente <span className="badge-tls">TLS 1.3</span></h4>
              <p>Identidad cívica blindada y trazabilidad operativa de impacto social en tiempo real.</p>
            </div>
          </div>

          <div className="login-footer">
            <Link to="/signup"><p>¿Aún no tienes cuenta? Regístrate gratis ↗</p></Link>
          </div>

        </div>
      </section>
    </main>
  );
}