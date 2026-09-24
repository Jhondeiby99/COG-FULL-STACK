import { useState } from 'react';
export function Login() {
    // 1. Creamos el estado para saber cuál está activo por defecto
  const [activeUserType, setActiveUserType] = useState<'voluntario' | 'fundacion'>('voluntario');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lógica futura de autenticación
    console.log("Formulario enviado");
  };

  return (
    <main className="login-layout">
      {/* Contenedor principal del formulario */}
      <section className="login-form-container">
        <div className="form-wrapper">
          
          {/* Logo / Badge superior */}
          <div className="top-badge">
            <span className="time-icon">🕒</span> 7:34 AM <span className="status-dot">•</span>
          </div>

          <h1>Bienvenido de nuevo</h1>
          <p className="subtitle">
            Plataforma cívica que articula solidaridad activa, fundaciones acreditadas y voluntariado.
          </p>

          {/* Selector de tipo de usuario con animación de deslizamiento */}
          <div className="user-type-toggle">
            {/* Fondo animado que se mueve según el estado */}
            <div 
              className="sliding-background"
              style={{
                transform: activeUserType === 'voluntario' ? 'translateX(0)' : 'translateX(100%)'
              }}
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
            
            {/* Campo de Correo / Documento */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="email">Correo electrónico o Documento</label>
                <span className="helper-text">Requerido</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon left">✉️</span>
                <input 
                  type="text" 
                  id="email" 
                  placeholder="ejemplo@correo.org o 900.123.456-7" 
                  required 
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Contraseña de acceso</label>
                <span className="helper-text">Mín. 8 caracteres</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon left">🔒</span>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                />
                <span className="input-icon right">👁️</span>
              </div>
            </div>

            {/* Opciones: Recordar sesión y Olvidaste contraseña */}
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Recordar sesión
              </label>
              <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>

            {/* Botón Principal */}
            <button type="submit" className="btn-primary">
              Iniciar Sesión en 7:34 AM <span>→</span>
            </button>
          </form>
          
          {/* Divisor */}
          <div className="divider">
            <span>O CONTINÚA CON</span>
          </div>

          {/* Botones de acceso alternativo */}
          <div className="alt-login-buttons">
            <button className="btn-outline">
              <span className="icon">G</span> Google
            </button>
            <button className="btn-outline">
              <span className="icon">📄</span> Firma / RUT
            </button>
          </div>

          {/* Banner de Seguridad */}
          <div className="security-banner">
            <div className="shield-icon">🛡️</div>
            <div className="security-info">
              <h4>Acceso Seguro y Transparente <span className="badge-tls">TLS 1.3</span></h4>
              <p>Identidad cívica blindada y trazabilidad operativa de impacto social en tiempo real.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>¿Aún no tienes cuenta? <a href="#">Regístrate gratis ↗</a></p>
          </div>

        </div>
      </section>
    </main>
  );
}