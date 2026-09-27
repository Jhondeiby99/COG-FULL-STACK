import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

import iconFiltrosUrl from '../assets/icons/icon-filtros.svg';
import SearchIcon from '../assets/icons/SearchIcon.svg';
import CampanaIcon from '../assets/icons/CampanaIcon.svg';
import FiltroDirectorio from '../assets/icons/FiltroDirectorio.svg';
import EdificioIcon from '../assets/icons/EdificioIcon.svg';
import ManoIcon from '../assets/icons/ManoIcon.svg';
import PaqueteIcon from '../assets/icons/PaqueteIcon.svg';
import IconVoluntario from '../assets/icons/IconVoluntario.svg';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';

// Tipos básicos
type Fundacion = { id: string; nombre_legal: string; ubicacion: string };
type Necesidad = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: 'alta' | 'media' | 'baja';
  meta_texto: string;
  porcentaje_recaudado: number;
  fundacion: Fundacion;
};
type Voluntario = {
  id: string;
  nombre_completo: string;
  profesion: string;
  ubicacion: string;
  sobre_mi: string;
  avatar_url: string | null;
  tiempo_disponible: string;
  disponibilidad_viaje: string;
};

export function Home() {
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [stats, setStats] = useState({
    fundaciones: 0,
    voluntarios: 0,
    donaciones: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Traer Necesidades con la información de su Fundación
      const { data: reqData } = await supabase
        .from('necesidades')
        .select(`*, fundacion:fundaciones(id,nombre_legal, ubicacion)`)
        .order('created_at', { ascending: false })
        .limit(4);

      if (reqData) setNecesidades(reqData as Necesidad[]);

      // 2. Traer Voluntarios
      const { data: volData } = await supabase
        .from('voluntarios')
        .select('*')
        .limit(4);

      if (volData) setVoluntarios(volData as Voluntario[]);

      // 3. Traer Estadísticas Reales (Conteos + Métricas Globales)
      const { count: countFundaciones } = await supabase
        .from('fundaciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobada');

      const { count: countVoluntarios } = await supabase
        .from('voluntarios')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);

      const { data: metricas } = await supabase
        .from('metricas_globales')
        .select('donaciones_canalizadas')
        .single();

      setStats({
        fundaciones: countFundaciones || 0,
        voluntarios: countVoluntarios || 0,
        donaciones: metricas?.donaciones_canalizadas || 0
      });
      
      setLoading(false);
    }

    fetchData();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'FN';
    const words = name.replace('Fundación', '').replace('Corporación', '').trim().split(' ');
    return (words[0]?.[0] + (words[1]?.[0] || '')).toUpperCase();
  };

  const getPriorityStyle = (prioridad: string) => {
    if (prioridad === 'alta') return { badge: 'urgent', text: '🔴 Alta Prioridad', colorClass: '' };
    if (prioridad === 'media') return { badge: 'medium', text: '🔵 Media Prioridad', colorClass: 'purple' };
    return { badge: 'low', text: '🟢 Baja Prioridad', colorClass: 'green' };
  };

  // Validación estricta para evitar el error src=""
  const getAvatarUrl = (url?: string | null) => {
    return url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';
  };

  return (
    <div className="home-layout">
      <Header />

      <main className="home-main">
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

          <div className="search-widget">
            <div className="search-tabs">
              <button className="tab active">Ver todo</button>
              <button className="tab">Solo necesidades</button>
              <button className="tab">Solo voluntarios</button>
            </div>
            
            <div className="search-bar-wrapper">
              <div className="input-with-icon">
                <span className="icon-prefix"><img src={SearchIcon} alt="Buscar" /></span>
                <input type="text" placeholder="Buscar por necesidad, comuna, profesión, insumo o fundación..." />
              </div>
              <button type="button" className="btn-filters">
                <span className="icon"><img src={iconFiltrosUrl} alt="Filtros" /></span> Filtros
              </button>
              <button type="button" className="btn-primary btn-explore">Explorar →</button>
            </div>

            <div className="search-tags">
              <span className="tag-label">RÁPIDOS:</span>
              <span className="tag">🍲 Alimentos Bogotá</span>
              <span className="tag">⚕️ Médicos Medellín</span>
              <span className="tag">🎒 Kits escolares Cali</span>
              <span className="tag urgent">🔴 Alta Prioridad</span>
            </div>
          </div>

          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon blue"><img src={EdificioIcon} alt="Edificio" /></div>
              <div className="stat-info">
                <h3>+{stats.fundaciones}</h3>
                <p>Fundaciones auditadas y activas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><img src={ManoIcon} alt="Mano" /></div>
              <div className="stat-info">
                <h3>+{stats.voluntarios}</h3>
                <p>Voluntarios con perfil verificado</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><img src={PaqueteIcon} alt="Paquete" /></div>
              <div className="stat-info">
                <h3>+{stats.donaciones.toLocaleString()}</h3>
                <p>Donaciones e insumos canalizados</p>
              </div>
            </div>
          </section>
        </section>

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
            <Link to="/signup"><button className="btn-primary">Registrarme ahora</button></Link>
            <button className="btn-outline"><img src={FiltroDirectorio} alt="Filtrar directorio" />Filtrar directorio</button>
          </div>
        </section>

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
                <span className="pill active">Todas ({necesidades.length})</span>
                <span className="pill">Alimentos</span>
                <span className="pill">Medicamentos</span>
                <span className="pill">Útiles</span>
              </div>
            </div>
          </div>

          <div className="cards-grid">
            {loading ? (
              <p className="text-gray-500 font-bold p-4">Cargando necesidades en tiempo real...</p>
            ) : necesidades.length === 0 ? (
              <p className="text-gray-500 p-4">No hay llamados urgentes publicados en este momento.</p>
            ) : (
              necesidades.map((need) => {
                const style = getPriorityStyle(need.prioridad);
                const fundacion = Array.isArray(need.fundacion) ? need.fundacion[0] : need.fundacion;

                return (
                  <div key={need.id} className="need-card">
                    <div className="card-top">
                      <span className={`badge ${style.badge}`}>{style.text}</span>
                      <span className="time-ago">Reciente</span>
                    </div>
                    <div className="foundation-info">
                      <div className={`org-icon ${style.colorClass}`}>{getInitials(fundacion?.nombre_legal)}</div>
                      <div>
                        <h4>
                          <Link to="/fundacion" style={{ color: 'inherit' }}>
                            {fundacion?.nombre_legal || 'Fundación Desconocida'}
                          </Link>
                        </h4>
                        <p className="location">📍 {fundacion?.ubicacion || 'Ubicación no registrada'}</p>
                      </div>
                    </div>
                    <h3 className="need-title">{need.titulo}</h3>
                    <p className="need-desc">
                      {need.descripcion?.length > 100 ? `${need.descripcion.substring(0, 100)}...` : need.descripcion}
                    </p>
                    
                    <div className="progress-container">
                      <div className="progress-labels">
                        <span>Categoría: <strong>{need.categoria}</strong></span>
                      </div>
                      <div className="progress-bar">
                        <div className={`fill ${style.colorClass}`} style={{width: `${need.porcentaje_recaudado}%`}}></div>
                      </div>
                      <div className="progress-stats">
                        <span>Recaudado: {need.porcentaje_recaudado}%</span>
                        <span>{need.meta_texto}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <span className="verified-tag">✓ Verificada</span>
                      <Link to={`/fundacion/${fundacion?.id}`}>
                          <button className="btn-primary full-width">Ver necesidad →</button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

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
            {loading ? (
              <p className="text-gray-500 font-bold p-4">Cargando talento solidario...</p>
            ) : voluntarios.length === 0 ? (
              <p className="text-gray-500 p-4">Aún no hay voluntarios registrados.</p>
            ) : (
              voluntarios.map((voluntario) => (
                <div key={voluntario.id} className="volunteer-card">
                  <div className="card-top">
                    <img src={getAvatarUrl(voluntario.avatar_url)} alt="Perfil" className="avatar" />
                    <span className={`availability-badge ${voluntario.disponibilidad_viaje === 'Local' ? 'local' : ''}`}>
                      {voluntario.disponibilidad_viaje === 'Local' ? '📍 Local' : '✈️ Viaja Nal.'}
                    </span>
                  </div>
                  <h3 className="volunteer-name">{voluntario.nombre_completo}</h3>
                  <p className="volunteer-profession">{voluntario.profesion || 'Voluntario Activo'}</p>
                  <p className="location">📍 {voluntario.ubicacion || 'Ubicación no especificada'}</p>
                  
                  <div className="service-box">
                    <span className="box-label">SERVICIO QUE OFRECE:</span>
                    <p>{voluntario.sobre_mi ? `${voluntario.sobre_mi.substring(0, 75)}...` : 'Ayuda comunitaria general.'}</p>
                  </div>
                  
                  <div className="schedule-info">
                    <span className="icon">📅</span> {voluntario.tiempo_disponible || 'Disponibilidad a convenir'}
                  </div>

                  <div className="card-actions">
                    <span className="verified-tag light">Identidad validada</span>
                    <Link to={`/voluntario/${voluntario.id}`} className="w-full" style={{ display: 'block', width: '100%' }}>
                      <button className="btn-outline full-width">Ver perfil</button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}