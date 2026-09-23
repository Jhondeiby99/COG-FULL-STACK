export function Home() {
  return (
    <div className="home-layout">
      {/* 1. Barra de Navegación (Header) */}
      <header className="home-header">
        <div className="header-left">
          <button className="btn-icon">
            <span className="icon">⚙️</span> Filtros avanzados
          </button>
          <div className="header-search">
            <span className="icon">🔍</span>
            <input type="text" placeholder="Causas, fundaciones..." />
          </div>
        </div>
        
        <div className="header-center">
          <div className="brand-logo-center">
            <span className="time-text">7:34 AM</span>
            <span className="brand-slogan">Conectando voluntades y causas</span>
          </div>
        </div>

        <div className="header-right">
            <div className="header-right-inicre">
                <a href="#" className="nav-link">Iniciar sesión</a>
               <button className="btn-primary small">
                Crear usuario <span>▼</span>
                </button>
                <div className="avatar-circle small">👤</div>
            </div>
        </div>
      </header>

      <main className="home-main">
        {/* 2. Sección Hero y Búsqueda Principal */}
        <section className="hero-section">
          <div className="live-badge">
            <span className="status-dot"></span>
            07:34 AM • RED NACIONAL ACTIVA | Conectando en tiempo real
          </div>
          
          <h1 className="hero-title">
            El momento exacto en que <span className="highlight">la ayuda</span> despierta
          </h1>
          <p className="hero-subtitle">
            7:34 AM es la plataforma cívica y transparente que vincula de forma directa las urgencias de fundaciones con la generosidad de donantes y el talento de voluntarios en toda Colombia.
          </p>

          {/* Caja de Búsqueda Flotante */}
          <div className="search-widget">
            <div className="search-tabs">
              <button className="tab active">Ver todo</button>
              <button className="tab">Solo necesidades</button>
              <button className="tab">Solo voluntarios</button>
            </div>
            
            <div className="search-bar-wrapper">
              <div className="input-with-icon">
                <span className="icon-prefix">🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar por necesidad, comuna, profesión, insumo o fundación..." 
                />
              </div>

              <button type="button" className="btn-filters">
                <span className="icon">⚙️</span> Filtros
              </button>

              <button type="button" className="btn-primary btn-explore">
                Explorar →
              </button>
            </div>

            <div className="search-tags">
              <span className="tag-label">RÁPIDOS:</span>
              <span className="tag">🍲 Alimentos Bogotá</span>
              <span className="tag">⚕️ Médicos Medellín</span>
              <span className="tag">🎒 Kits escolares Cali</span>
              <span className="tag urgent">🔴 Alta Prioridad</span>
            </div>
          </div>
        </section>

        {/* 3. Estadísticas */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon blue">🏢</div>
            <div className="stat-info">
              <h3>+120</h3>
              <p>Fundaciones auditadas y activas</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🤝</div>
            <div className="stat-info">
              <h3>+1,450</h3>
              <p>Voluntarios con perfil verificado</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📦</div>
            <div className="stat-info">
              <h3>+3,800</h3>
              <p>Donaciones e insumos canalizados</p>
            </div>
          </div>
        </section>

        {/* 4. Banner CTA */}
        <section className="cta-banner">
          <div className="cta-content">
            <span className="icon">💡</span>
            <div>
              <h3>¿Quieres ser parte de las soluciones de hoy?</h3>
              <p>Registra tu causa social o comparte tus horas de profesión.</p>
            </div>
          </div>
          <div className="cta-actions">
            <button className="btn-primary">Registrarme ahora</button>
            <button className="btn-outline">≡ Filtrar directorio</button>
          </div>
        </section>

        {/* 5. Sección: Necesidades de Fundaciones */}
        <section className="content-section">
          <div className="section-header">
            <div>
              <span className="section-label red">🔴 LLAMADOS URGENTES</span>
              <h2>Necesidades de Fundaciones</h2>
              <p>Requerimientos puntuales, verificados por nuestro comité de transparencia comunitaria.</p>
            </div>
            <div className="section-filters">
              <button className="btn-outline small">⚙️ Panel de Filtros</button>
              <div className="filter-pills">
                <span className="pill active">Todas (4)</span>
                <span className="pill">Alimentos</span>
                <span className="pill">Medicamentos</span>
                <span className="pill">Útiles</span>
              </div>
            </div>
          </div>

          <div className="cards-grid">
            {/* Tarjeta de Necesidad 1 */}
            <div className="need-card">
              <div className="card-top">
                <span className="badge urgent">🔴 Alta Prioridad</span>
                <span className="time-ago">Hace 2 horas</span>
              </div>
              <div className="foundation-info">
                <div className="org-icon">HE</div>
                <div>
                  <h4>Fundación Huellas de Esperanza</h4>
                  <p className="location">📍 Bogotá, Chapinero</p>
                </div>
              </div>
              <h3 className="need-title">Alimentos no perecederos para 45 adultos mayores</h3>
              <p className="need-desc">Requerimos granos secos (arroz, lentejas, avena), aceite vegetal y complementos...</p>
              
              <div className="progress-container">
                <div className="progress-labels">
                  <span>Categoría: <strong>Alimentos</strong></span>
                </div>
                <div className="progress-bar"><div className="fill" style={{width: '30%'}}></div></div>
                <div className="progress-stats">
                  <span>Recaudado: 30%</span>
                  <span>Meta: 200 kg</span>
                </div>
              </div>

              <div className="card-actions">
                <span className="verified-tag">✓ Verificada</span>
                <button className="btn-primary full-width">Ver necesidad →</button>
              </div>
            </div>

            {/* Tarjeta de Necesidad 2 */}
            <div className="need-card">
              <div className="card-top">
                <span className="badge medium">🔵 Media Prioridad</span>
                <span className="time-ago">Hace 1 día</span>
              </div>
              <div className="foundation-info">
                <div className="org-icon purple">CP</div>
                <div>
                  <h4>Corporación Semillas de Paz</h4>
                  <p className="location">📍 Medellín, Comuna 13</p>
                </div>
              </div>
              <h3 className="need-title">Kits de útiles escolares y cuadernos para inicio de clases</h3>
              <p className="need-desc">Campaña escolar para beneficiar a 110 niños y niñas del sector El Salado...</p>
              
              <div className="progress-container">
                <div className="progress-labels">
                  <span>Categoría: <strong>Útiles escolares</strong></span>
                </div>
                <div className="progress-bar"><div className="fill purple" style={{width: '60%'}}></div></div>
                <div className="progress-stats">
                  <span>Recaudado: 60%</span>
                  <span>Meta: 110 kits</span>
                </div>
              </div>

              <div className="card-actions">
                <span className="verified-tag">✓ Verificada</span>
                <button className="btn-primary full-width">Ver necesidad →</button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sección: Voluntarios Disponibles */}
        <section className="content-section gray-bg">
          <div className="section-header">
            <div>
              <span className="section-label green">🟢 TALENTO & SOLIDARIDAD</span>
              <h2>Voluntarios Disponibles</h2>
              <p>Profesionales y ciudadanos dispuestos a donar horas, conocimientos y experiencia.</p>
            </div>
            <button className="btn-success">⊕ Ofrecer voluntariado</button>
          </div>

          <div className="cards-grid">
            {/* Tarjeta de Voluntario 1 */}
            <div className="volunteer-card">
              <div className="card-top">
                <img src="https://i.pravatar.cc/150?img=47" alt="Perfil" className="avatar" />
                <span className="availability-badge">✈️ Viaja Nal.</span>
              </div>
              <h3 className="volunteer-name">Dra. Camila Restrepo</h3>
              <p className="volunteer-profession">Médica Pediatra</p>
              <p className="location">📍 Medellín (Comuna 10, La Candelaria)</p>
              
              <div className="service-box">
                <span className="box-label">SERVICIO QUE OFRECE:</span>
                <p>Brigadas de salud y atención primaria infantil comunitaria.</p>
              </div>
              
              <div className="schedule-info">
                <span className="icon">📅</span> Fines de semana (10 hrs/sem)
              </div>

              <div className="card-actions">
                <span className="verified-tag light">Identidad validada</span>
                <button className="btn-outline full-width">Ver perfil</button>
              </div>
            </div>

            {/* Tarjeta de Voluntario 2 */}
            <div className="volunteer-card">
              <div className="card-top">
                <img src="https://i.pravatar.cc/150?img=11" alt="Perfil" className="avatar" />
                <span className="availability-badge local">📍 Local</span>
              </div>
              <h3 className="volunteer-name">Ing. Alejandro Morales</h3>
              <p className="volunteer-profession">Software & Telemática</p>
              <p className="location">📍 Bogotá (Teusaquillo)</p>
              
              <div className="service-box">
                <span className="box-label">SERVICIO QUE OFRECE:</span>
                <p>Alfabetización digital y soporte técnico para fundaciones.</p>
              </div>
              
              <div className="schedule-info">
                <span className="icon">📅</span> Mar / Jue tardes (6 hrs/sem)
              </div>

              <div className="card-actions">
                <span className="verified-tag light">Identidad validada</span>
                <button className="btn-outline full-width">Ver perfil</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="time-text">7:34 AM</h2>
            <p>Plataforma cívica de solidaridad transparente que canaliza voluntades hacia causas de impacto social comprobable.</p>
            <span className="verified-tag blue">✓ Impacto Verificado</span>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Explorar</h4>
              <a href="#">Necesidades activas</a>
              <a href="#">Directorio de Fundaciones</a>
              <a href="#">Bolsa de Voluntariado</a>
              <a href="#">Cómo funciona</a>
            </div>
            <div className="link-group">
              <h4>Comunidad</h4>
              <a href="#">Registrar Organización</a>
              <a href="#">Sumarse como Voluntario</a>
              <a href="#">Preguntas frecuentes</a>
              <a href="#">Reportes de Rendición</a>
            </div>
            <div className="link-group">
              <h4>Legal & Contacto</h4>
              <a href="#">Política de Privacidad</a>
              <a href="#">Términos de Servicio</a>
              <a href="#">Canal de Coordinación</a>
              <a href="#" className="email-link">contacto@734am.org</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 7:34 AM. Plataforma de solidaridad y voluntariado comunitario.</p>
          <p>Despertando el compromiso social a cada hora.</p>
        </div>
      </footer>
    </div>
  );
}