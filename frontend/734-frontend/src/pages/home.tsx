import iconFiltrosUrl from '../assets/icons/icon-filtros.svg';
import SearchIcon from '../assets/icons/SearchIcon.svg';
import CampanaIcon from '../assets/icons/CampanaIcon.svg';
import FiltroDirectorio from '../assets/icons/FiltroDirectorio.svg';
import EdificioIcon from '../assets/icons/EdificioIcon.svg';
import ManoIcon from '../assets/icons/ManoIcon.svg';
import PaqueteIcon from '../assets/icons/PaqueteIcon.svg';
import IconVoluntario from '../assets/icons/IconVoluntario.svg';
import IconVerify from '../assets/icons/IconVerify.svg';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';

export function Home() {
  return (
    <div className="home-layout">
      <Header />

      <main className="home-main">
        {/* 2. Sección Hero y Búsqueda Principal */}
        <section className="hero-section">
          <div className="live-badge">
            <span className="status-dot"></span>
            <span className="live-badge-highlight">07:34 AM • RED NACIONAL ACTIVA</span>
            <span className="live-badge-divider"></span>
            <span className="live-badge-text">Conectando en tiempo real</span>
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
                <span className="icon-prefix"><img src={SearchIcon} alt="Buscar" /></span>
                <input 
                  type="text" 
                  placeholder="Buscar por necesidad, comuna, profesión, insumo o fundación..." 
                />
              </div>

              <button type="button" className="btn-filters">
                <span className="icon"><img src={iconFiltrosUrl} alt="Filtros" /></span> Filtros
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
          {/* 3. Estadísticas */}
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon blue"><img src={EdificioIcon} alt="Edificio" /></div>
              <div className="stat-info">
                <h3>+120</h3>
                <p>Fundaciones auditadas y activas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><img src={ManoIcon} alt="Mano" /></div>
              <div className="stat-info">
                <h3>+1,450</h3>
                <p>Voluntarios con perfil verificado</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><img src={PaqueteIcon} alt="Paquete" /></div>
              <div className="stat-info">
                <h3>+3,800</h3>
                <p>Donaciones e insumos canalizados</p>
              </div>
            </div>
          </section>
        </section>

        

        {/* 4. Banner CTA */}
        <section className="cta-banner">
          <div className="cta-content">
            <div className="cta-icon-wrapper">
            <img src={CampanaIcon} className="cta-icon" alt="Campana" />
            </div>
            <div>
              <h3>¿Quieres ser parte de las soluciones de hoy?</h3>
              <p>Registra tu causa social o comparte tus horas de profesión.</p>
            </div>
          </div>
          <div className="cta-actions">
            <button className="btn-primary">Registrarme ahora</button>
            <button className="btn-outline"><img src={FiltroDirectorio} alt="Filtrar directorio" />Filtrar directorio</button>
          </div>
        </section>

        {/* 5. Sección: Necesidades de Fundaciones */}
        <section className="content-section">
          <div className="section-header">
            <div className="subsection-title-cards">
              <span className="section-label red">🔴 LLAMADOS URGENTES</span>
              <h2>Necesidades de Fundaciones</h2>
              <p>Requerimientos puntuales, verificados por nuestro comité de transparencia comunitaria.</p>
            </div>
            <div className="section-filters">
              <button className="btn-outline small"><img src={iconFiltrosUrl} alt="Filtro" /> Panel de Filtros</button>
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
                  <h4>
                    <a href="/fundacion" style={{ color: 'inherit' }}>
                      Fundación Huellas de Esperanza
                    </a>
                  </h4>
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
            <div className="subsection-title-cards">
              <span className="section-label green">🟢 TALENTO & SOLIDARIDAD</span>
              <h2>Voluntarios Disponibles</h2>
              <p>Profesionales y ciudadanos dispuestos a donar horas, conocimientos y experiencia.</p>
            </div>
            <button className="btn-success"><img src={IconVoluntario} className='icon-svg' alt="Icono de Voluntariado" /> Ofrecer voluntariado</button>
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
      <Footer />
    </div>
  );
}