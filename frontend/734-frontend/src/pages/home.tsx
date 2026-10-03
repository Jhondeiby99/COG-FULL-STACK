import { useEffect, useState, useMemo, useRef } from 'react';
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
import * as Icons  from '../assets/icons/index.ts';

// Tipos
type Fundacion = { id: string; nombre_legal: string; ubicacion: string | null; };
type Necesidad = { id: string; titulo: string; descripcion: string | null; categoria: string | null; prioridad: 'alta' | 'media' | 'baja'; meta_texto: string | null; porcentaje_recaudado: number | null; completada: boolean | null; fundacion: Fundacion | Fundacion[] | null; };
type Voluntario = { id: string; nombre_completo: string; profesion: string | null; ubicacion: string | null; sobre_mi: string | null; avatar_url: string | null; tiempo_disponible: string | null; disponibilidad_viaje: string | null; is_verified: boolean | null; disponibilidad_activa: boolean | null; };

export function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [stats, setStats] = useState({ fundaciones: 0, voluntarios: 0, donaciones: 0 });
  const [loading, setLoading] = useState(true);

  // Estados de Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'needs' | 'volunteers'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Estados para el Autocompletado Búsqueda Hero
  const heroSearchRef = useRef<HTMLDivElement>(null);
  const [heroResults, setHeroResults] = useState({ fundaciones: [] as any[], voluntarios: [] as any[] });
  const [showHeroDropdown, setShowHeroDropdown] = useState(false);
  const [isSearchingHero, setIsSearchingHero] = useState(false);

  // Estados del Modal de Filtros Avanzados
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    ubicacion: 'Todas',
    prioridad: 'Todas',
    viaje: 'Todas'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthenticated(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setIsAuthenticated(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: reqData } = await supabase.from('necesidades').select(`*, fundacion:fundaciones(id, nombre_legal, ubicacion)`).eq('completada', false).order('created_at', { ascending: false }).limit(6);
      if (reqData) setNecesidades(reqData as unknown as Necesidad[]);

      const { data: volData } = await supabase.from('voluntarios').select('*').eq('is_verified', true).eq('disponibilidad_activa', true).limit(6);
      if (volData) setVoluntarios(volData as Voluntario[]);

      const { count: countFundaciones } = await supabase.from('fundaciones').select('*', { count: 'exact', head: true }).eq('estado', 'aprobada');
      const { count: countVoluntarios } = await supabase.from('voluntarios').select('*', { count: 'exact', head: true }).eq('is_verified', true).eq('disponibilidad_activa', true);
      const { data: metricas } = await supabase.from('metricas_globales').select('donaciones_canalizadas').maybeSingle();

      setStats({ fundaciones: countFundaciones || 0, voluntarios: countVoluntarios || 0, donaciones: metricas?.donaciones_canalizadas || 0 });
      setLoading(false);
    }
    fetchData();

    // Click outside handler para el Hero Dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setShowHeroDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Efecto del buscador dinámico Hero
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setHeroResults({ fundaciones: [], voluntarios: [] });
      setShowHeroDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearchingHero(true);
      const [fundRes, volRes] = await Promise.all([
        supabase.from('fundaciones').select('id, nombre_legal, logo_url, ubicacion').eq('estado', 'aprobada').ilike('nombre_legal', `%${query}%`).limit(3),
        supabase.from('voluntarios').select('id, nombre_completo, avatar_url, profesion').eq('is_verified', true).ilike('nombre_completo', `%${query}%`).limit(3)
      ]);
      setHeroResults({ fundaciones: fundRes.data || [], voluntarios: volRes.data || [] });
      setShowHeroDropdown(true);
      setIsSearchingHero(false);
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  // FILTRADO INTELIGENTE PARA TARJETAS EN PANTALLA
  const necesidadesFiltradas = useMemo(() => {
    return necesidades.filter((need) => {
      const fundacionObj = Array.isArray(need.fundacion) ? need.fundacion[0] : need.fundacion;
      const matchCategoria = selectedCategory === 'Todas' || (selectedCategory === 'Alta Prioridad' ? need.prioridad === 'alta' : need.categoria?.toLowerCase() === selectedCategory.toLowerCase());
      const matchPrioridad = advancedFilters.prioridad === 'Todas' || need.prioridad === advancedFilters.prioridad.toLowerCase();
      const matchUbicacion = advancedFilters.ubicacion === 'Todas' || fundacionObj?.ubicacion?.toLowerCase().includes(advancedFilters.ubicacion.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || need.titulo.toLowerCase().includes(q) || need.descripcion?.toLowerCase().includes(q) || need.categoria?.toLowerCase().includes(q) || fundacionObj?.nombre_legal?.toLowerCase().includes(q) || fundacionObj?.ubicacion?.toLowerCase().includes(q);

      return matchCategoria && matchSearch && matchPrioridad && matchUbicacion;
    });
  }, [necesidades, selectedCategory, searchQuery, advancedFilters]);

  const voluntariosFiltrados = useMemo(() => {
    return voluntarios.filter((v) => {
      const matchUbicacion = advancedFilters.ubicacion === 'Todas' || v.ubicacion?.toLowerCase().includes(advancedFilters.ubicacion.toLowerCase());
      const matchViaje = advancedFilters.viaje === 'Todas' || (advancedFilters.viaje === 'Nacional' ? v.disponibilidad_viaje === 'Nacional' : v.disponibilidad_viaje === 'Local');
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || v.nombre_completo.toLowerCase().includes(q) || v.profesion?.toLowerCase().includes(q) || v.ubicacion?.toLowerCase().includes(q) || v.sobre_mi?.toLowerCase().includes(q);

      return matchSearch && matchUbicacion && matchViaje;
    });
  }, [voluntarios, searchQuery, advancedFilters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHeroDropdown(false);
    if (searchQuery.trim()) navigate(`/explorar?q=${encodeURIComponent(searchQuery)}&tab=${activeTab}`);
  };

  const clearFilters = () => {
    setAdvancedFilters({ ubicacion: 'Todas', prioridad: 'Todas', viaje: 'Todas' });
    setSearchQuery('');
    setSelectedCategory('Todas');
    setActiveTab('all');
    setIsFilterModalOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'FN';
    const words = name.replace(/Fundación|Corporación|Asociación/gi, '').trim().split(' ');
    return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || 'FN';
  };

  const getPriorityStyle = (prioridad: string) => {
    if (prioridad === 'alta') return { badge: 'bg-red-100 text-red-700', text: '🔴 Alta Prioridad', bar: 'bg-red-500', icon: 'bg-red-50 text-red-600 border-red-200' };
    if (prioridad === 'media') return { badge: 'bg-purple-100 text-purple-700', text: '🔵 Media Prioridad', bar: 'bg-purple-500', icon: 'bg-purple-50 text-purple-600 border-purple-200' };
    return { badge: 'bg-green-100 text-green-700', text: '🟢 Baja Prioridad', bar: 'bg-green-500', icon: 'bg-green-50 text-green-600 border-green-200' };
  };

  const getCategoryCount = (category: string) => {
    if (category === 'Todas') return necesidades.length;
    if (category === 'Alta Prioridad') return necesidades.filter((n) => n.prioridad === 'alta').length;
    return necesidades.filter((n) => n.categoria?.toLowerCase() === category.toLowerCase()).length;
  };

  const getAvatarUrl = (url?: string | null) => url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';

  // Renderizador del Componente Desplegable Hero
  const renderHeroDropdown = () => {
    if (!showHeroDropdown) return null;
    const hasResults = heroResults.fundaciones.length > 0 || heroResults.voluntarios.length > 0;

    return (
      <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100000] flex flex-col text-left max-h-[60vh] overflow-y-auto" onMouseDown={(e) => e.preventDefault()}>
        {isSearchingHero && !hasResults ? (
          <div className="p-6 text-center text-sm text-gray-400 font-bold">Buscando perfiles oficiales...</div>
        ) : !hasResults ? (
          <div className="p-6 text-center text-sm text-gray-500">No hay organizaciones ni voluntarios llamados "{searchQuery}"</div>
        ) : (
          <div className="pb-3">
            {heroResults.fundaciones.length > 0 && (
              <div className="flex flex-col">
                <span className="bg-gray-50 px-5 py-2 text-[10px] font-extrabold text-[#005684] uppercase tracking-widest border-b border-gray-100">Fundaciones Vinculadas</span>
                {heroResults.fundaciones.map((f) => (
                  <Link key={f.id} to={`/fundacion/${f.id}`} onClick={() => setShowHeroDropdown(false)} className="flex items-center gap-4 px-5 py-3 hover:bg-[#f0f9ff] transition border-b border-gray-50 last:border-0 cursor-pointer">
                    <img src={getAvatarUrl(f.logo_url)} className="w-12 h-12 rounded-xl object-cover bg-white shadow-sm border border-gray-100" alt="Logo" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-extrabold text-[#071d37] truncate">{f.nombre_legal}</span>
                      <span className="text-xs text-gray-500 truncate font-medium">📍 {f.ubicacion || 'Colombia'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {heroResults.voluntarios.length > 0 && (
              <div className="flex flex-col">
                <span className="bg-emerald-50 px-5 py-2 text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest border-y border-emerald-100 mt-2">Red de Voluntarios</span>
                {heroResults.voluntarios.map((v) => (
                  <Link key={v.id} to={`/voluntario/${v.id}`} onClick={() => setShowHeroDropdown(false)} className="flex items-center gap-4 px-5 py-3 hover:bg-emerald-50 transition border-b border-gray-50 last:border-0 cursor-pointer">
                    <img src={getAvatarUrl(v.avatar_url)} className="w-12 h-12 rounded-full object-cover bg-white shadow-sm border border-gray-100" alt="Avatar" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-extrabold text-[#071d37] truncate flex items-center gap-1.5">{v.nombre_completo} <img src={Icons.IconVerify} className="w-4 h-4" alt="Verificado"/></span>
                      <span className="text-xs text-emerald-600 font-bold truncate">{v.profesion || 'Voluntario Activo'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => { setShowHeroDropdown(false); navigate(`/explorar?q=${encodeURIComponent(searchQuery)}`); }} className="w-full text-center py-4 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-[#005684] transition mt-2 border-t border-gray-100">
              Explorar resultados completos →
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header 
        searchValue={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onFilterClick={() => setIsFilterModalOpen(true)}
      />

      <main className="flex-1 w-full flex flex-col">
        {/* HERO SECTION */}
        <section className="bg-white px-4 md:px-8 py-12 md:py-20 flex flex-col items-center text-center border-b border-gray-200 relative">
          
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-red-100 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>RED NACIONAL ACTIVA</span>
            <span className="w-px h-3 bg-red-200"></span>
            <span className="text-red-500 font-medium">Conectando en tiempo real</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#071d37] max-w-4xl tracking-tight mb-6 leading-tight">
            El momento exacto en que <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005684] to-[#00a8e8]">la ayuda</span> despierta
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-2xl mb-10 leading-relaxed font-medium">
            Plataforma cívica y transparente que vincula de forma directa las urgencias de fundaciones con la generosidad de donantes y el talento de voluntarios.
          </p>

          {/* BUSCADOR INTERACTIVO RESPONSIVO */}
          <form className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-[#005684]/5 border border-gray-100 p-4 md:p-6 text-left relative z-40" onSubmit={handleSearchSubmit}>
            
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button type="button" onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'all' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Todo el directorio</button>
              <button type="button" onClick={() => setActiveTab('needs')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'needs' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Causas y Requerimientos</button>
              <button type="button" onClick={() => setActiveTab('volunteers')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'volunteers' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Perfiles Voluntarios</button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#005684] focus-within:ring-2 focus-within:ring-[#005684]/20 transition-all shadow-inner relative" ref={heroSearchRef}>
                <img src={SearchIcon} className="w-5 h-5 opacity-50" alt="Buscar" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if(searchQuery.length >= 2) setShowHeroDropdown(true); }}
                  placeholder="Escribe una causa, profesión, ciudad o fundación..."
                  className="bg-transparent border-none outline-none w-full text-sm text-[#071d37] font-medium placeholder-gray-400"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 font-bold text-lg px-2">✕</button>
                )}
                {/* Renderizar Dropdown de Búsqueda de Hero aquí */}
                {renderHeroDropdown()}
              </div>
              <div className="flex gap-2 relative z-0">
                <button type="button" onClick={() => setIsFilterModalOpen(true)} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition w-full md:w-auto text-sm shadow-sm active:scale-95">
                  <img src={iconFiltrosUrl} className="w-4 h-4" alt="Filtros" /> <span className="hidden md:inline">Filtros</span>
                </button>
                <button type="submit" className="bg-[#005684] hover:bg-[#004266] text-white px-6 py-3 rounded-xl font-bold transition w-full md:w-auto text-sm shadow-md active:scale-95">
                  Explorar →
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 relative z-0">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Accesos Rápidos:</span>
              <button type="button" onClick={() => { setSearchQuery('Alimentos'); setActiveTab('needs'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg border border-gray-200 transition">🍲 Alimentos</button>
              <button type="button" onClick={() => { setSearchQuery('Médicos'); setActiveTab('volunteers'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg border border-gray-200 transition">⚕️ Médicos</button>
              <button type="button" onClick={() => { setSearchQuery('Bogotá'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg border border-gray-200 transition">📍 Bogotá D.C.</button>
              <button type="button" onClick={() => { setSelectedCategory('Alta Prioridad'); setActiveTab('needs'); }} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${selectedCategory === 'Alta Prioridad' ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'}`}>🔴 Alta Prioridad</button>
            </div>
          </form>

          {/* ESTADÍSTICAS */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mt-16">
            <div className="bg-blue-50/50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100/50 text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0"><img src={EdificioIcon} className="w-6 h-6 opacity-70" alt="Edificio" /></div>
              <div><h3 className="text-2xl font-extrabold text-[#005684]">+{stats.fundaciones}</h3><p className="text-[11px] text-[#005684]/70 font-semibold uppercase tracking-wide">Fundaciones activas</p></div>
            </div>
            <div className="bg-emerald-50/50 rounded-2xl p-5 flex items-center gap-4 border border-emerald-100/50 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><img src={ManoIcon} className="w-6 h-6 opacity-70" alt="Mano" /></div>
              <div><h3 className="text-2xl font-extrabold text-emerald-700">+{stats.voluntarios}</h3><p className="text-[11px] text-emerald-600/70 font-semibold uppercase tracking-wide">Voluntarios validados</p></div>
            </div>
            <div className="bg-purple-50/50 rounded-2xl p-5 flex items-center gap-4 border border-purple-100/50 text-left">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0"><img src={PaqueteIcon} className="w-6 h-6 opacity-70" alt="Paquete" /></div>
              <div><h3 className="text-2xl font-extrabold text-purple-700">+{stats.donaciones.toLocaleString()}</h3><p className="text-[11px] text-purple-600/70 font-semibold uppercase tracking-wide">Insumos canalizados</p></div>
            </div>
          </section>
        </section>

        {/* CTA BANNER */}
        <section className="bg-gradient-to-r from-[#071d37] to-[#005684] text-white rounded-3xl p-6 md:p-10 mx-4 md:mx-8 lg:mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 my-12 shadow-xl shadow-[#005684]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <img src={CampanaIcon} className="w-8 h-8 invert opacity-90" alt="Campana" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-1">¿Quieres ser parte de las soluciones de hoy?</h3>
              <p className="text-sm text-blue-100 font-medium">Registra tu causa social o comparte tus horas de profesión.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            {!isAuthenticated && (
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="w-full bg-white text-[#005684] hover:bg-gray-50 px-6 py-3 rounded-xl font-bold transition shadow-sm text-sm active:scale-95">Registrarme ahora</button>
              </Link>
            )}
            <Link to="/explorar" className="w-full sm:w-auto">
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm backdrop-blur-sm active:scale-95">
                <img src={FiltroDirectorio} className="w-4 h-4 invert" alt="Filtrar" /> Ver Directorio Oficial
              </button>
            </Link>
          </div>
        </section>

        {/* CONTENEDOR PRINCIPAL RESULTADOS */}
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20 flex flex-col gap-16">
          
          {/* SECCIÓN NECESIDADES */}
          {(activeTab === 'all' || activeTab === 'needs') && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <span className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-md mb-2 tracking-widest uppercase">🔴 Llamados urgentes</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#071d37]">Necesidades de Fundaciones</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">Requerimientos puntuales, verificados por nuestro comité de transparencia.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button className="hidden lg:flex items-center gap-2 text-[#005684] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition border border-blue-100 shadow-sm" onClick={() => setIsFilterModalOpen(true)}>
                    <img src={iconFiltrosUrl} className="w-3 h-3" alt="Filtro" /> Panel Filtros Avanzados
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {['Todas', 'Alimentos', 'Medicamentos', 'Útiles', 'Alta Prioridad'].map((cat) => (
                      <span key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition border ${selectedCategory === cat ? 'bg-[#071d37] text-white border-[#071d37] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {cat} <span className="opacity-60 font-normal">({getCategoryCount(cat)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {loading ? (
                  <p className="text-gray-500 text-sm font-bold col-span-full">Cargando necesidades en tiempo real...</p>
                ) : necesidadesFiltradas.length === 0 ? (
                  <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <h3 className="text-lg font-bold text-[#071d37] mb-2">No se encontraron resultados</h3>
                    <p className="text-gray-500 text-sm mb-4">No hay llamados urgentes que coincidan con los filtros y búsqueda actuales.</p>
                    <button onClick={clearFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition">Limpiar filtros</button>
                  </div>
                ) : (
                  necesidadesFiltradas.map((need) => {
                    const style = getPriorityStyle(need.prioridad);
                    const fundacionObj = Array.isArray(need.fundacion) ? need.fundacion[0] : need.fundacion;

                    return (
                      <div key={need.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${style.badge}`}>{style.text}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Reciente</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${style.icon}`}>
                            {getInitials(fundacionObj?.nombre_legal)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[#071d37] truncate hover:text-[#005684] transition">
                              {fundacionObj?.id ? <Link to={`/fundacion/${fundacionObj.id}`}>{fundacionObj.nombre_legal}</Link> : <span>{fundacionObj?.nombre_legal || 'Desconocida'}</span>}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">📍 {fundacionObj?.ubicacion || 'Sin ubicación'}</p>
                          </div>
                        </div>

                        <h3 className="text-base font-extrabold text-gray-900 mb-2 leading-tight">{need.titulo}</h3>
                        <p className="text-xs text-gray-500 mb-6 flex-1 line-clamp-3 leading-relaxed">{need.descripcion || 'Sin descripción detallada.'}</p>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Progreso</span>
                            <span className="text-xs font-extrabold text-[#071d37]">{need.porcentaje_recaudado || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-1000 ${style.bar}`} style={{ width: `${Math.min(need.porcentaje_recaudado || 0, 100)}%` }}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium text-right">{need.meta_texto || 'S/M'}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1"><img src={Icons.IconVerify} className="w-3 h-3" alt="OK"/> Validada</span>
                          <Link to={`/fundacion/${fundacionObj?.id}`} className="flex-1">
                            <button className="w-full bg-[#071d37] hover:bg-[#005684] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm active:scale-95">Ver necesidad →</button>
                          </Link>
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
            <section className="flex flex-col gap-6 pt-8 border-t border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md mb-2 tracking-widest uppercase">🟢 Talento & Solidaridad</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#071d37]">Voluntarios Disponibles</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">Profesionales y ciudadanos dispuestos a donar horas, conocimientos y experiencia.</p>
                </div>
                {!isAuthenticated && (
                  <Link to="/signup">
                    <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition text-sm shadow-md w-full sm:w-auto active:scale-95">
                      <img src={IconVoluntario} className="w-4 h-4 invert" alt="Voluntariado" /> Ofrecer voluntariado
                    </button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {loading ? (
                  <p className="text-gray-500 text-sm font-bold col-span-full">Cargando talento solidario...</p>
                ) : voluntariosFiltrados.length === 0 ? (
                  <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <span className="text-4xl mb-4 block">👩‍⚕️</span>
                    <h3 className="text-lg font-bold text-[#071d37] mb-2">No se encontraron voluntarios</h3>
                    <p className="text-gray-500 text-sm mb-4">No hay perfiles activos que coincidan con la búsqueda actual.</p>
                    <button onClick={clearFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition">Limpiar filtros</button>
                  </div>
                ) : (
                  voluntariosFiltrados.map((voluntario) => (
                    <div key={voluntario.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${voluntario.disponibilidad_viaje === 'Local' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                          {voluntario.disponibilidad_viaje === 'Local' ? '📍 Local' : '✈️️ Viaja Nal.'}
                        </span>
                      </div>
                      
                      <img src={getAvatarUrl(voluntario.avatar_url)} alt="Perfil" className="w-16 h-16 rounded-full object-cover border-4 border-gray-50 mb-3 shadow-sm" />
                      
                      <h3 className="text-base font-extrabold text-gray-900 mb-0.5">{voluntario.nombre_completo}</h3>
                      <p className="text-[11px] font-bold text-[#005684] uppercase tracking-wide mb-1">{voluntario.profesion || 'Voluntario Activo'}</p>
                      <p className="text-xs text-gray-500 mb-4">📍 {voluntario.ubicacion || 'No especificada'}</p>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Servicio que ofrece</span>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                          {voluntario.sobre_mi || 'Ayuda comunitaria general.'}
                        </p>
                      </div>

                      <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2 mb-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <span>📅</span> {voluntario.tiempo_disponible || 'Disponibilidad a convenir'}
                      </div>

                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 border border-emerald-100 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Identidad OK</span>
                        <Link to={`/voluntario/${voluntario.id}`} className="flex-1">
                          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#071d37] text-xs font-bold py-2.5 rounded-xl transition shadow-sm active:scale-95">Ver perfil</button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* MODAL DE FILTROS AVANZADOS */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex justify-end animate-fade-in transition-all">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-[#071d37] flex items-center gap-2">
                <img src={iconFiltrosUrl} className="w-5 h-5" alt="Filtros" />
                Filtros Avanzados
              </h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-500 transition">✕</button>
            </div>
            
            <div className="p-6 flex flex-col gap-6 flex-1">
              {/* Filtro: Tipo de Resultado */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Tipo de Búsqueda</label>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => setActiveTab('all')} className={`text-left px-4 py-3 rounded-xl border text-sm font-semibold transition ${activeTab === 'all' ? 'bg-[#005684] text-white border-[#005684] shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>🌐 Mostrar Todo el Directorio</button>
                  <button onClick={() => setActiveTab('needs')} className={`text-left px-4 py-3 rounded-xl border text-sm font-semibold transition ${activeTab === 'needs' ? 'bg-[#005684] text-white border-[#005684] shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>🔴 Solo Necesidades y Causas</button>
                  <button onClick={() => setActiveTab('volunteers')} className={`text-left px-4 py-3 rounded-xl border text-sm font-semibold transition ${activeTab === 'volunteers' ? 'bg-[#005684] text-white border-[#005684] shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>🟢 Solo Voluntarios</button>
                </div>
              </div>

              {/* Filtro: Ubicación */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Ubicación / Ciudad</label>
                <select 
                  value={advancedFilters.ubicacion}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, ubicacion: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:border-[#005684] transition"
                >
                  <option value="Todas">Nacional (Todas las regiones)</option>
                  <option value="Bogotá">Bogotá D.C.</option>
                  <option value="Medellín">Medellín, Antioquia</option>
                  <option value="Cali">Cali, Valle del Cauca</option>
                  <option value="Barranquilla">Barranquilla, Atlántico</option>
                  <option value="Chocó">Chocó</option>
                </select>
              </div>

              {/* Filtro: Prioridad (Aplica a Necesidades) */}
              <div className={activeTab === 'volunteers' ? 'opacity-50 pointer-events-none' : ''}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center justify-between">
                  Nivel de Urgencia <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">Solo causas</span>
                </label>
                <div className="flex gap-2">
                  {['Todas', 'Alta', 'Media', 'Baja'].map(prio => (
                    <button 
                      key={prio} 
                      onClick={() => setAdvancedFilters({...advancedFilters, prioridad: prio})}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${advancedFilters.prioridad === prio ? 'bg-[#071d37] text-white border-[#071d37]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro: Viaje (Aplica a Voluntarios) */}
              <div className={activeTab === 'needs' ? 'opacity-50 pointer-events-none' : ''}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center justify-between">
                  Disponibilidad de Viaje <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">Solo voluntarios</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setAdvancedFilters({...advancedFilters, viaje: 'Todas'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${advancedFilters.viaje === 'Todas' ? 'bg-[#071d37] text-white border-[#071d37]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cualquiera</button>
                  <button onClick={() => setAdvancedFilters({...advancedFilters, viaje: 'Local'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${advancedFilters.viaje === 'Local' ? 'bg-[#071d37] text-white border-[#071d37]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Solo Local</button>
                  <button onClick={() => setAdvancedFilters({...advancedFilters, viaje: 'Nacional'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${advancedFilters.viaje === 'Nacional' ? 'bg-[#071d37] text-white border-[#071d37]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Nacional</button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0 z-10">
              <button onClick={clearFilters} className="px-5 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition shadow-sm w-1/3">Limpiar</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 bg-[#005684] text-white font-bold text-sm rounded-xl hover:bg-[#004266] transition shadow-md">Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}