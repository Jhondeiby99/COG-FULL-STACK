import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

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

// Tipos reflejando la estructura real de Supabase
type Fundacion = {
  id: string;
  nombre_legal: string;
  ubicacion: string | null;
};

type Necesidad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  prioridad: 'alta' | 'media' | 'baja';
  meta_texto: string | null;
  porcentaje_recaudado: number | null;
  completada: boolean | null;
  fundacion: Fundacion | Fundacion[] | null;
};

type Voluntario = {
  id: string;
  nombre_completo: string;
  profesion: string | null;
  ubicacion: string | null;
  sobre_mi: string | null;
  avatar_url: string | null;
  tiempo_disponible: string | null;
  disponibilidad_viaje: string | null;
  is_verified: boolean | null;
  disponibilidad_activa: boolean | null;
};

export function Home() {
  const navigate = useNavigate();

  // Estados de datos
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [stats, setStats] = useState({
    fundaciones: 0,
    voluntarios: 0,
    donaciones: 0
  });
  const [loading, setLoading] = useState(true);

  // Estados interactivos de interfaz (Búsqueda y Filtros)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'needs' | 'volunteers'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 1. Traer Necesidades activas (no completadas) con la información de su Fundación
      const { data: reqData } = await supabase
        .from('necesidades')
        .select(`*, fundacion:fundaciones(id, nombre_legal, ubicacion)`)
        .eq('completada', false)
        .order('created_at', { ascending: false })
        .limit(6);

      if (reqData) {
        setNecesidades(reqData as unknown as Necesidad[]);
      }

      // 2. Traer Voluntarios verificados y activos
      const { data: volData } = await supabase
        .from('voluntarios')
        .select('*')
        .eq('is_verified', true)
        .eq('disponibilidad_activa', true)
        .limit(6);

      if (volData) {
        setVoluntarios(volData as Voluntario[]);
      }

      // 3. Traer Estadísticas Reales (Conteo + Métricas)
      const { count: countFundaciones } = await supabase
        .from('fundaciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobada');

      const { count: countVoluntarios } = await supabase
        .from('voluntarios')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .eq('disponibilidad_activa', true);

      const { data: metricas } = await supabase
        .from('metricas_globales')
        .select('donaciones_canalizadas')
        .maybeSingle();

      setStats({
        fundaciones: countFundaciones || 0,
        voluntarios: countVoluntarios || 0,
        donaciones: metricas?.donaciones_canalizadas || 0
      });

      setLoading(false);
    }

    fetchData();
  }, []);

  // Lógica de filtrado dinámico para la sección de necesidades
  const necesidadesFiltradas = useMemo(() => {
    return necesidades.filter((need) => {
      const matchCategoria =
        selectedCategory === 'Todas' ||
        need.categoria?.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchSearch =
        !searchQuery ||
        need.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        need.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        need.categoria?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategoria && matchSearch;
    });
  }, [necesidades, selectedCategory, searchQuery]);

  // Manejo de búsqueda global
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explorar?q=${encodeURIComponent(searchQuery)}&tab=${activeTab}`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'FN';
    const words = name.replace(/Fundación|Corporación/gi, '').trim().split(' ');
    return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || 'FN';
  };

  const getPriorityStyle = (prioridad: string) => {
    if (prioridad === 'alta') return { badge: 'urgent', text: '🔴 Alta Prioridad', colorClass: '' };
    if (prioridad === 'media') return { badge: 'medium', text: '🔵 Media Prioridad', colorClass: 'purple' };
    return { badge: 'low', text: '🟢 Baja Prioridad', colorClass: 'green' };
  };

  const getAvatarUrl = (url?: string | null) => {
    return url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';
  };

  return (
    <div className="home-layout">
      <Header />

      <main className="home-main">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="live-badge">
            <span className="status-dot"></span>
            <span className="live-badge-highlight">RED NACIONAL ACTIVA</span>
            <span className="live-badge-divider"></span>
            <span className="live-badge-text">Conectando en tiempo real</span>
          </div>

          <h1 className="hero-title">
            El momento exacto en que <span className="highlight">la ayuda</span> despierta
          </h1>
          <p className="hero-subtitle">
            Plataforma cívica y transparente que vincula de forma directa las urgencias de fundaciones con la generosidad de donantes y el talento de voluntarios en toda Colombia.
          </p>

          {/* BUSCADOR INTERACTIVO */}
          <form className="search-widget" onSubmit={handleSearchSubmit}>
            <div className="search-tabs">
              <button
                type="button"
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Ver todo
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'needs' ? 'active' : ''}`}
                onClick={() => setActiveTab('needs')}
              >
                Solo necesidades
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'volunteers' ? 'active' : ''}`}
                onClick={() => setActiveTab('volunteers')}
              >
                Solo voluntarios
              </button>
            </div>

            <div className="search-bar-wrapper">
              <div className="input-with-icon">
                <span className="icon-prefix">
                  <img src={SearchIcon} alt="Buscar" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por necesidad, comuna, profesión, insumo o fundación..."
                />
              </div>
              <button
                type="button"
                className="btn-filters"
                onClick={() => navigate('/explorar')}
              >
                <span className="icon">
                  <img src={iconFiltrosUrl} alt="Filtros" />
                </span>{' '}
                Filtros
              </button>
              <button type="submit" className="btn-primary btn-explore">
                Explorar →
              </button>
            </div>

            <div className="search-tags">
              <span className="tag-label">RÁPIDOS:</span>
              <button
                type="button"
                className="tag"
                onClick={() => setSearchQuery('Alimentos Bogotá')}
              >
                🍲 Alimentos Bogotá
              </button>
              <button
                type="button"
                className="tag"
                onClick={() => setSearchQuery('Médicos Medellín')}
              >
                ⚕️ Médicos Medellín
              </button>
              <button
                type="button"
                className="tag"
                onClick={() => setSearchQuery('Kits escolares Cali')}
              >
                🎒 Kits escolares Cali
              </button>
              <button
                type="button"
                className="tag urgent"
                onClick={() => setSelectedCategory('Alta Prioridad')}
              >
                🔴 Alta Prioridad
              </button>
            </div>
          </form>

          {/* ESTADÍSTICAS GLOBALES */}
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon blue">
                <img src={EdificioIcon} alt="Edificio" />
              </div>
              <div className="stat-info">
                <h3>+{stats.fundaciones}</h3>
                <p>Fundaciones auditadas y activas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <img src={ManoIcon} alt="Mano" />
              </div>
              <div className="stat-info">
                <h3>+{stats.voluntarios}</h3>
                <p>Voluntarios con perfil verificado</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <img src={PaqueteIcon} alt="Paquete" />
              </div>
              <div className="stat-info">
                <h3>+{stats.donaciones.toLocaleString()}</h3>
                <p>Donaciones e insumos canalizados</p>
              </div>
            </div>
          </section>
        </section>

        {/* CTA BANNER */}
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
            <Link to="/signup">
              <button className="btn-primary">Registrarme ahora</button>
            </Link>
            <Link to="/explorar">
              <button className="btn-outline">
                <img src={FiltroDirectorio} alt="Filtrar directorio" />
                Filtrar directorio
              </button>
            </Link>
          </div>
        </section>

        {/* SECCIÓN NECESIDADES */}
        {(activeTab === 'all' || activeTab === 'needs') && (
          <section className="content-section">
            <div className="section-header">
              <div className="subsection-title-cards">
                <span className="section-label red">🔴 LLAMADOS URGENTES</span>
                <h2>Necesidades de Fundaciones</h2>
                <p>Requerimientos puntuales, verificados por nuestro comité de transparencia comunitaria.</p>
              </div>
              <div className="section-filters">
                <button
                  className="btn-outline small"
                  onClick={() => navigate('/explorar')}
                >
                  <img src={iconFiltrosUrl} alt="Filtro" /> Panel de Filtros
                </button>
                <div className="filter-pills">
                  {['Todas', 'Alimentos', 'Medicamentos', 'Útiles'].map((cat) => (
                    <span
                      key={cat}
                      className={`pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ cursor: 'pointer' }}
                    >
                      {cat} {cat === 'Todas' ? `(${necesidades.length})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="cards-grid">
              {loading ? (
                <p className="text-gray-500 font-bold p-4">Cargando necesidades en tiempo real...</p>
              ) : necesidadesFiltradas.length === 0 ? (
                <p className="text-gray-500 p-4">No se encontraron llamados urgentes con los criterios seleccionados.</p>
              ) : (
                necesidadesFiltradas.map((need) => {
                  const style = getPriorityStyle(need.prioridad);
                  const fundacionObj = Array.isArray(need.fundacion)
                    ? need.fundacion[0]
                    : need.fundacion;

                  return (
                    <div key={need.id} className="need-card">
                      <div className="card-top">
                        <span className={`badge ${style.badge}`}>{style.text}</span>
                        <span className="time-ago">Reciente</span>
                      </div>
                      <div className="foundation-info">
                        <div className={`org-icon ${style.colorClass}`}>
                          {getInitials(fundacionObj?.nombre_legal)}
                        </div>
                        <div>
                          <h4>
                            {fundacionObj?.id ? (
                              <Link
                                to={`/fundacion/${fundacionObj.id}`}
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                              >
                                {fundacionObj.nombre_legal}
                              </Link>
                            ) : (
                              <span>{fundacionObj?.nombre_legal || 'Fundación Desconocida'}</span>
                            )}
                          </h4>
                          <p className="location">
                            📍 {fundacionObj?.ubicacion || 'Ubicación no registrada'}
                          </p>
                        </div>
                      </div>
                      <h3 className="need-title">{need.titulo}</h3>
                      <p className="need-desc">
                        {need.descripcion && need.descripcion.length > 100
                          ? `${need.descripcion.substring(0, 100)}...`
                          : need.descripcion || 'Sin descripción detallada.'}
                      </p>

                      <div className="progress-container">
                        <div className="progress-labels">
                          <span>
                            Categoría: <strong>{need.categoria || 'General'}</strong>
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`fill ${style.colorClass}`}
                            style={{ width: `${Math.min(need.porcentaje_recaudado || 0, 100)}%` }}
                          ></div>
                        </div>
                        <div className="progress-stats">
                          <span>Recaudado: {need.porcentaje_recaudado || 0}%</span>
                          <span>{need.meta_texto || 'S/M'}</span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <span className="verified-tag">✓ Verificada</span>
                        {fundacionObj?.id ? (
                          <Link to={`/fundacion/${fundacionObj.id}`} style={{ width: '100%' }}>
                            <button className="btn-primary full-width">Ver necesidad →</button>
                          </Link>
                        ) : (
                          <button className="btn-primary full-width" disabled>
                            Ver necesidad →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* SECCIÓN VOLUNTARIOS */}
        {(activeTab === 'all' || activeTab === 'volunteers') && (
          <section className="content-section gray-bg">
            <div className="section-header">
              <div className="subsection-title-cards">
                <span className="section-label green">🟢 TALENTO & SOLIDARIDAD</span>
                <h2>Voluntarios Disponibles</h2>
                <p>Profesionales y ciudadanos dispuestos a donar horas, conocimientos y experiencia.</p>
              </div>
              <Link to="/registro-voluntario">
                <button className="btn-success">
                  <img src={IconVoluntario} className="icon-svg" alt="Icono de Voluntariado" />
                  Ofrecer voluntariado
                </button>
              </Link>
            </div>

            <div className="cards-grid">
              {loading ? (
                <p className="text-gray-500 font-bold p-4">Cargando talento solidario...</p>
              ) : voluntarios.length === 0 ? (
                <p className="text-gray-500 p-4">Aún no hay voluntarios activos en este momento.</p>
              ) : (
                voluntarios.map((voluntario) => (
                  <div key={voluntario.id} className="volunteer-card">
                    <div className="card-top">
                      <img
                        src={getAvatarUrl(voluntario.avatar_url)}
                        alt="Perfil"
                        className="avatar"
                      />
                      <span
                        className={`availability-badge ${
                          voluntario.disponibilidad_viaje === 'Local' ? 'local' : ''
                        }`}
                      >
                        {voluntario.disponibilidad_viaje === 'Local' ? '📍 Local' : '✈️ Viaja Nal.'}
                      </span>
                    </div>
                    <h3 className="volunteer-name">{voluntario.nombre_completo}</h3>
                    <p className="volunteer-profession">{voluntario.profesion || 'Voluntario Activo'}</p>
                    <p className="location">📍 {voluntario.ubicacion || 'Ubicación no especificada'}</p>

                    <div className="service-box">
                      <span className="box-label">SERVICIO QUE OFRECE:</span>
                      <p>
                        {voluntario.sobre_mi
                          ? voluntario.sobre_mi.length > 75
                            ? `${voluntario.sobre_mi.substring(0, 75)}...`
                            : voluntario.sobre_mi
                          : 'Ayuda comunitaria general.'}
                      </p>
                    </div>

                    <div className="schedule-info">
                      <span className="icon">📅</span> {voluntario.tiempo_disponible || 'Disponibilidad a convenir'}
                    </div>

                    <div className="card-actions">
                      <span className="verified-tag light">Identidad validada</span>
                      <Link
                        to={`/voluntario/${voluntario.id}`}
                        className="w-full"
                        style={{ display: 'block', width: '100%' }}
                      >
                        <button className="btn-outline full-width">Ver perfil</button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}