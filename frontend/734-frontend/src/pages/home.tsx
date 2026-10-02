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
import * as Icons  from '../assets/icons/index.ts';

// Tipos
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [stats, setStats] = useState({ fundaciones: 0, voluntarios: 0, donaciones: 0 });
  const [loading, setLoading] = useState(true);

  // Estados de interfaz
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'needs' | 'volunteers'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: reqData } = await supabase
        .from('necesidades')
        .select(`*, fundacion:fundaciones(id, nombre_legal, ubicacion)`)
        .eq('completada', false)
        .order('created_at', { ascending: false })
        .limit(6);

      if (reqData) setNecesidades(reqData as unknown as Necesidad[]);

      const { data: volData } = await supabase
        .from('voluntarios')
        .select('*')
        .eq('is_verified', true)
        .eq('disponibilidad_activa', true)
        .limit(6);

      if (volData) setVoluntarios(volData as Voluntario[]);

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

  const necesidadesFiltradas = useMemo(() => {
    return necesidades.filter((need) => {
      const fundacionObj = Array.isArray(need.fundacion) ? need.fundacion[0] : need.fundacion;
      const matchCategoria = selectedCategory === 'Todas' ||
        (selectedCategory === 'Alta Prioridad' ? need.prioridad === 'alta' : need.categoria?.toLowerCase() === selectedCategory.toLowerCase());
      
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || need.titulo.toLowerCase().includes(q) || need.descripcion?.toLowerCase().includes(q) ||
        need.categoria?.toLowerCase().includes(q) || fundacionObj?.nombre_legal?.toLowerCase().includes(q) ||
        fundacionObj?.ubicacion?.toLowerCase().includes(q);

      return matchCategoria && matchSearch;
    });
  }, [necesidades, selectedCategory, searchQuery]);

  const voluntariosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return voluntarios;
    const q = searchQuery.toLowerCase().trim();
    return voluntarios.filter((v) => v.nombre_completo.toLowerCase().includes(q) || v.profesion?.toLowerCase().includes(q) || v.ubicacion?.toLowerCase().includes(q) || v.sobre_mi?.toLowerCase().includes(q));
  }, [voluntarios, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/explorar?q=${encodeURIComponent(searchQuery)}&tab=${activeTab}`);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'FN';
    const words = name.replace(/Fundación|Corporación|Asociación/gi, '').trim().split(' ');
    return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || 'FN';
  };

  // Adaptación de estilos Tailwind para las prioridades
  const getPriorityStyle = (prioridad: string) => {
    if (prioridad === 'alta') return { badge: 'bg-red-100 text-red-700', text: '🔴 Alta Prioridad', bar: 'bg-red-500', icon: 'bg-red-50 text-red-600 border-red-200' };
    if (prioridad === 'media') return { badge: 'bg-purple-100 text-purple-700', text: '🔵 Media Prioridad', bar: 'bg-purple-500', icon: 'bg-purple-50 text-purple-600 border-purple-200' };
    return { badge: 'bg-green-100 text-green-700', text: '🟢 Baja Prioridad', bar: 'bg-green-500', icon: 'bg-green-50 text-green-600 border-green-200' };
  };

  const getAvatarUrl = (url?: string | null) => url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';

  const getCategoryCount = (category: string) => {
    if (category === 'Todas') return necesidades.length;
    if (category === 'Alta Prioridad') return necesidades.filter((n) => n.prioridad === 'alta').length;
    return necesidades.filter((n) => n.categoria?.toLowerCase() === category.toLowerCase()).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />

      <main className="flex-1 w-full flex flex-col">
        {/* HERO SECTION */}
        <section className="bg-white px-4 md:px-8 py-12 md:py-20 flex flex-col items-center text-center border-b border-gray-200">
          
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
            Plataforma cívica y transparente que vincula de forma directa las urgencias de fundaciones con la generosidad de donantes y el talento de voluntarios en toda Colombia.
          </p>

          {/* BUSCADOR INTERACTIVO RESPONSIVO */}
          <form className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-[#005684]/5 border border-gray-100 p-4 md:p-6 text-left" onSubmit={handleSearchSubmit}>
            
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button type="button" onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'all' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Ver todo</button>
              <button type="button" onClick={() => setActiveTab('needs')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'needs' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Solo necesidades</button>
              <button type="button" onClick={() => setActiveTab('volunteers')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'volunteers' ? 'bg-[#005684] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Solo voluntarios</button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#005684] focus-within:ring-2 focus-within:ring-[#005684]/20 transition-all">
                <img src={SearchIcon} className="w-5 h-5 opacity-50" alt="Buscar" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar necesidad, profesión, fundación..."
                  className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigate('/explorar')} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition w-full md:w-auto text-sm shadow-sm">
                  <img src={iconFiltrosUrl} className="w-4 h-4" alt="Filtros" /> <span className="hidden md:inline">Filtros</span>
                </button>
                <button type="submit" className="bg-[#005684] hover:bg-[#004266] text-white px-6 py-3 rounded-xl font-bold transition w-full md:w-auto text-sm shadow-md">
                  Explorar →
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">RÁPIDOS:</span>
              <button type="button" onClick={() => { setSearchQuery('Alimentos Bogotá'); setActiveTab('all'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg border border-gray-200 transition">🍲 Alimentos Bogotá</button>
              <button type="button" onClick={() => { setSearchQuery('Médicos Medellín'); setActiveTab('volunteers'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg border border-gray-200 transition">⚕️ Médicos Medellín</button>
              <button type="button" onClick={() => { setSearchQuery('Kits escolares Cali'); setActiveTab('needs'); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg border border-gray-200 transition">🎒 Kits Cali</button>
              <button type="button" onClick={() => { setSelectedCategory('Alta Prioridad'); setActiveTab('needs'); }} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${selectedCategory === 'Alta Prioridad' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'}`}>🔴 Alta Prioridad</button>
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
                <button className="w-full bg-white text-[#005684] hover:bg-gray-50 px-6 py-3 rounded-xl font-bold transition shadow-sm text-sm">Registrarme ahora</button>
              </Link>
            )}
            <Link to="/explorar" className="w-full sm:w-auto">
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm backdrop-blur-sm">
                <img src={FiltroDirectorio} className="w-4 h-4 invert" alt="Filtrar" /> Directorio
              </button>
            </Link>
          </div>
        </section>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20 flex flex-col gap-16">
          
          {/* SECCIÓN NECESIDADES */}
          {(activeTab === 'all' || activeTab === 'needs') && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <span className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-md mb-2 tracking-widest uppercase">🔴 Llamados urgentes</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#071d37]">Necesidades de Fundaciones</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">Requerimientos puntuales, verificados por nuestro comité de transparencia comunitaria.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button className="hidden lg:flex items-center gap-2 text-[#005684] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition" onClick={() => navigate('/explorar?tab=needs')}>
                    <img src={iconFiltrosUrl} className="w-3 h-3" alt="Filtro" /> Panel Filtros
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {['Todas', 'Alimentos', 'Medicamentos', 'Útiles', 'Alta Prioridad'].map((cat) => (
                      <span key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition border ${selectedCategory === cat ? 'bg-[#071d37] text-white border-[#071d37]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
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
                  <p className="text-gray-500 text-sm col-span-full bg-white p-6 rounded-2xl border border-gray-200 text-center">No se encontraron llamados urgentes con los criterios seleccionados.</p>
                ) : (
                  necesidadesFiltradas.map((need) => {
                    const style = getPriorityStyle(need.prioridad);
                    const fundacionObj = Array.isArray(need.fundacion) ? need.fundacion[0] : need.fundacion;

                    return (
                      <div key={need.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group">
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
                            <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${Math.min(need.porcentaje_recaudado || 0, 100)}%` }}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium text-right">{need.meta_texto || 'S/M'}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1"><img src={Icons.IconVerify} className="w-3 h-3" alt="OK"/> Validada</span>
                          <Link to={`/fundacion/${fundacionObj?.id}`} className="flex-1">
                            <button className="w-full bg-[#071d37] hover:bg-[#005684] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">Ver necesidad →</button>
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
                    <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition text-sm shadow-md w-full sm:w-auto">
                      <img src={IconVoluntario} className="w-4 h-4 invert" alt="Voluntariado" /> Ofrecer voluntariado
                    </button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {loading ? (
                  <p className="text-gray-500 text-sm font-bold col-span-full">Cargando talento solidario...</p>
                ) : voluntariosFiltrados.length === 0 ? (
                  <p className="text-gray-500 text-sm col-span-full bg-white p-6 rounded-2xl border border-gray-200 text-center">No se encontraron voluntarios activos con los criterios seleccionados.</p>
                ) : (
                  voluntariosFiltrados.map((voluntario) => (
                    <div key={voluntario.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${voluntario.disponibilidad_viaje === 'Local' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                          {voluntario.disponibilidad_viaje === 'Local' ? '📍 Local' : '✈️ Viaja Nal.'}
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
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Identidad OK</span>
                        <Link to={`/voluntario/${voluntario.id}`} className="flex-1">
                          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition shadow-sm">Ver perfil</button>
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

      <Footer />
    </div>
  );
}