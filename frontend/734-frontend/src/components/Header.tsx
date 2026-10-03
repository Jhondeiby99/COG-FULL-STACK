import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNotifications } from '../hooks/useNotifications';

interface HeaderProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
}

interface SesionUsuario {
  id: string;
  es_actual: boolean;
}

export function Header({ onSearchChange, onFilterClick, searchPlaceholder = "Causas, fundaciones...", searchValue }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalExpulsion, setModalExpulsion] = useState(false);

  // Hook de Notificaciones
  const { notificaciones, unreadCount, marcarComoLeidas } = useNotifications(user?.id, { limit: 5 });
  const [showNotifs, setShowNotifs] = useState(false);
  
  // Refs separados para clics fuera
  const notifRefDesktop = useRef<HTMLDivElement>(null);
  const notifRefMobile = useRef<HTMLDivElement>(null);
  const searchRefDesktop = useRef<HTMLDivElement>(null);
  const searchRefMobile = useRef<HTMLDivElement>(null);

  // Estados para el Autocompletado de Búsqueda
  const [internalSearch, setInternalSearch] = useState('');
  const [searchResults, setSearchResults] = useState({ fundaciones: [] as any[], voluntarios: [] as any[] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Sincronizar búsqueda externa (ej: desde Home) con interna
  useEffect(() => {
    if (searchValue !== undefined) setInternalSearch(searchValue);
  }, [searchValue]);

  // Efecto de Búsqueda a Supabase
  useEffect(() => {
    const query = internalSearch.trim();
    if (query.length < 2) {
      setSearchResults({ fundaciones: [], voluntarios: [] });
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      const [fundRes, volRes] = await Promise.all([
        supabase.from('fundaciones').select('id, nombre_legal, logo_url, ubicacion').eq('estado', 'aprobada').ilike('nombre_legal', `%${query}%`).limit(3),
        supabase.from('voluntarios').select('id, nombre_completo, avatar_url, profesion').eq('is_verified', true).ilike('nombre_completo', `%${query}%`).limit(3)
      ]);
      setSearchResults({
        fundaciones: fundRes.data || [],
        voluntarios: volRes.data || []
      });
      setShowDropdown(true);
      setIsSearching(false);
    };

    const timer = setTimeout(fetchResults, 300); // Debounce de 300ms
    return () => clearTimeout(timer);
  }, [internalSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearch(e.target.value);
    if (onSearchChange) onSearchChange(e);
  };

  useEffect(() => {
    async function getAuthUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).maybeSingle();

        if (perfil) {
          if (perfil.rol === 'fundacion') {
            const { data: fund } = await supabase.from('fundaciones').select('nombre_legal, logo_url').eq('id', session.user.id).maybeSingle();
            setProfileData({ name: fund?.nombre_legal || 'Fundación', avatar: fund?.logo_url, rol: perfil.rol });
          } else if (perfil.rol === 'voluntario') {
            const { data: vol } = await supabase.from('voluntarios').select('nombre_completo, avatar_url').eq('id', session.user.id).maybeSingle();
            setProfileData({ name: vol?.nombre_completo || 'Voluntario', avatar: vol?.avatar_url, rol: perfil.rol });
          } else if (perfil.rol === 'administrador') {
            const { data: admin } = await supabase.from('administradores').select('nombre_completo, avatar_url').eq('id', session.user.id).maybeSingle();
            setProfileData({ name: admin?.nombre_completo || 'Administrador Global', avatar: admin?.avatar_url || null, rol: perfil.rol });
          }
        }
      }
      setLoading(false);
    }

    getAuthUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfileData(null);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideNotifD = notifRefDesktop.current && !notifRefDesktop.current.contains(event.target as Node);
      const clickedOutsideNotifM = notifRefMobile.current && !notifRefMobile.current.contains(event.target as Node);
      if (clickedOutsideNotifD && clickedOutsideNotifM) setShowNotifs(false);

      const clickedOutsideSearchD = searchRefDesktop.current && !searchRefDesktop.current.contains(event.target as Node);
      const clickedOutsideSearchM = searchRefMobile.current && !searchRefMobile.current.contains(event.target as Node);
      if (clickedOutsideSearchD && clickedOutsideSearchM) setShowDropdown(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const dbSessionId = localStorage.getItem('db_session_id');
    if (!dbSessionId) return;

    const ejecutarExpulsion = () => {
      localStorage.removeItem('db_session_id');
      setModalExpulsion(true);
    };

    const verificarSesionInicial = async () => {
      const { data, error } = await supabase.from('sesiones_usuario').select('id, es_actual').eq('id', dbSessionId).maybeSingle();
      if (error || !data || data.es_actual === false) ejecutarExpulsion();
    };

    verificarSesionInicial();

    const channel: RealtimeChannel = supabase
      .channel(`sesion_header_${dbSessionId}`)
      .on<SesionUsuario>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sesiones_usuario', filter: `id=eq.${dbSessionId}` },
        (payload) => {
          const fueDesactivada = payload.new && 'es_actual' in payload.new && payload.new.es_actual === false;
          if (fueDesactivada || payload.eventType === 'DELETE') ejecutarExpulsion();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAceptarExpulsion = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setModalExpulsion(false);
    setUser(null);
    setProfileData(null);
    navigate('/login', { replace: true });
  };

  const handleLogout = async () => {
    try {
      const dbSessionId = localStorage.getItem('db_session_id');
      if (dbSessionId) await supabase.from('sesiones_usuario').update({ es_actual: false }).eq('id', dbSessionId);
      localStorage.removeItem('db_session_id');
    } finally {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      setProfileData(null);
      navigate('/login', { replace: true });
    }
  };

  const getAvatar = () => (profileData?.avatar && profileData.avatar.trim() !== '') ? profileData.avatar : Icons.PersonIcon;
  const getAvatarUrlHelper = (url: string) => url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';

  const getDashboardPath = () => {
    switch (profileData?.rol) {
      case 'administrador': return '/dashboard/admin-dashboard';
      case 'fundacion': return user?.id ? `/dashboard/fundacion/editar/${user.id}` : '/dashboard';
      case 'voluntario': default: return user?.id ? `/dashboard/voluntario/editar/${user.id}` : '/dashboard';
    }
  };

  // Componente Reutilizable del Menú Desplegable
  const renderSearchDropdown = () => {
    if (!showDropdown) return null;
    const hasResults = searchResults.fundaciones.length > 0 || searchResults.voluntarios.length > 0;

    return (
      <div 
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100000] flex flex-col text-left"
        onMouseDown={(e) => e.preventDefault()} // Evita que el input pierda foco al hacer clic
      >
        {isSearching && !hasResults ? (
          <div className="p-4 text-center text-xs text-gray-400 font-bold">Buscando perfiles...</div>
        ) : !hasResults ? (
          <div className="p-4 text-center text-xs text-gray-500">No se encontraron resultados para "{internalSearch}"</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pb-2">
            {searchResults.fundaciones.length > 0 && (
              <div className="flex flex-col">
                <span className="bg-gray-50 px-4 py-1.5 text-[10px] font-extrabold text-[#005684] uppercase tracking-widest border-b border-gray-100">Fundaciones</span>
                {searchResults.fundaciones.map((f) => (
                  <Link key={f.id} to={`/fundacion/${f.id}`} onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f9ff] transition border-b border-gray-50 last:border-0 cursor-pointer">
                    <img src={getAvatarUrlHelper(f.logo_url)} className="w-10 h-10 rounded-xl object-cover bg-white shadow-sm border border-gray-100" alt="Logo" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-[#071d37] truncate">{f.nombre_legal}</span>
                      <span className="text-[11px] text-gray-500 truncate">📍 {f.ubicacion || 'Colombia'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {searchResults.voluntarios.length > 0 && (
              <div className="flex flex-col">
                <span className="bg-emerald-50 px-4 py-1.5 text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest border-y border-emerald-100 mt-1">Voluntarios</span>
                {searchResults.voluntarios.map((v) => (
                  <Link key={v.id} to={`/voluntario/${v.id}`} onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition border-b border-gray-50 last:border-0 cursor-pointer">
                    <img src={getAvatarUrlHelper(v.avatar_url)} className="w-10 h-10 rounded-full object-cover bg-white shadow-sm border border-gray-100" alt="Avatar" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-[#071d37] truncate flex items-center gap-1">{v.nombre_completo} <img src={Icons.IconVerify} className="w-3 h-3" alt="Verificado"/></span>
                      <span className="text-[11px] text-emerald-600 font-bold truncate">{v.profesion || 'Voluntario Activo'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <button 
  onClick={() => { 
    setShowDropdown(false); 
    navigate(`/explorar?q=${encodeURIComponent(internalSearch)}`); 
  }} 
  className="w-full text-center py-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-[#005684] transition mt-1 border-t border-gray-100"
>
  Ver todos los resultados →
</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. VERSIÓN WEB / DESKTOP */}
      <div className="hidden sm:block w-full">
        <header className="home-header relative !overflow-visible z-[9999]">
          <div className="header-left">
            <button className="btn-filtros transition hover:opacity-80" onClick={onFilterClick} type="button">
              <img src={Icons.iconFiltrosUrl} className="icon-svg" alt="Filtros" />
              Filtros <span className="badge bg-[#005684] text-white">3</span>
            </button>
            <div className="header-search relative focus-within:ring-2 focus-within:ring-[#005684]/20 transition-all !overflow-visible" ref={searchRefDesktop}>
              <img src={Icons.SearchIcon} className="icon-search" alt="Buscar" />
              <input type="text" placeholder={searchPlaceholder} value={internalSearch} onChange={handleInputChange} onFocus={() => { if(internalSearch.length >= 2) setShowDropdown(true); }} />
              {renderSearchDropdown()}
            </div>
          </div>

          <div className="header-center">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="brand-logo-center transition hover:scale-105" style={{ cursor: 'pointer' }}>
                <span className="time-text">7:34 AM</span>
                <span className="brand-slogan">Conectando voluntades y causas</span>
              </div>
            </Link>
          </div>

          <div className="header-right !overflow-visible">
            <div className="header-right-inicre flex items-center gap-4 !overflow-visible">
              {loading ? (
                <span className="text-xs text-gray-400">Cargando...</span>
              ) : user ? (
                <div className="flex items-center gap-3 !overflow-visible">
                  <span className="text-xs font-bold text-[#071d37] hidden md:inline">Hola, {profileData?.name || 'Usuario'}</span>

                  {/* CAMPANA NOTIFICACIONES */}
                  <div className="relative flex items-center justify-center !overflow-visible" ref={notifRefDesktop}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifs((prev) => !prev); }} className="relative p-2 hover:bg-gray-200 bg-gray-100 rounded-full transition cursor-pointer">
                      <img src={Icons.CampanaIcon2} alt="Notificaciones" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                    {showNotifs && (
                      <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl z-[99999] overflow-hidden flex flex-col text-left">
                        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
                          <span className="text-xs font-bold text-[#071d37]">Alertas</span>
                          {unreadCount > 0 && <button onClick={() => marcarComoLeidas()} className="text-[10px] text-[#005684] hover:underline cursor-pointer">Marcar leídas</button>}
                        </div>
                        <div className="max-h-64 overflow-y-auto flex flex-col">
                          {notificaciones.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">Estás al día.</div>
                          ) : (
                            notificaciones.map((n) => (
                              <div key={n.id} className={`p-3 border-b border-gray-100 flex flex-col gap-1 hover:bg-gray-50 transition ${!n.leido ? 'bg-[#f0f9ff]' : ''}`}>
                                <span className="text-xs font-bold text-[#071d37]">{n.titulo}</span>
                                <span className="text-[11px] text-gray-500 line-clamp-2">{n.descripcion}</span>
                              </div>
                            ))
                          )}
                        </div>
                        <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[11px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition">Ver todas</Link>
                      </div>
                    )}
                  </div>

                  <Link to={getDashboardPath()} className="rounded-lg bg-[#005684] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#00456a] shadow-sm">Mi Panel</Link>
                  <button onClick={handleLogout} type="button" className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 transition hover:bg-red-100 cursor-pointer" title="Cerrar sesión">Salir</button>
                  <div className="avatar-circle small overflow-hidden border border-gray-200 shadow-sm"><img src={getAvatar()} className="icon-person" alt="Avatar" /></div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="nav-link font-bold text-[#005684]">Iniciar sesión</Link>
                  <Link to="/signup">
                    <button className="bg-[#005684] hover:bg-[#004266] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2" type="button">
                      Crear usuario <img src={Icons.arrowDownIcon} className="w-3 h-3 invert" alt="Desplegar" />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* 2. VERSIÓN MÓVIL OPTIMIZADA */}
      <div className="block sm:hidden w-full relative z-[9999] bg-white border-b border-gray-100 shadow-sm !overflow-visible">
        <header className="flex flex-col w-full px-4 py-3 gap-3 !overflow-visible">
          
          <div className="flex justify-between items-center w-full !overflow-visible">
            <Link to="/" style={{ textDecoration: 'none' }} className="flex flex-col flex-shrink-0 cursor-pointer">
              <span className="text-[13px] font-extrabold text-[#071d37] tracking-tight">7:34 AM</span>
              <span className="text-[9px] text-gray-500 font-medium">Conectando voluntades</span>
            </Link>

            <div className="flex items-center gap-2 flex-shrink-0 !overflow-visible">
              {loading ? (
                <span className="text-[10px] text-gray-400">Cargando...</span>
              ) : user ? (
                <div className="flex items-center gap-2 relative !overflow-visible">
                  
                  <div ref={notifRefMobile} className="!overflow-visible">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifs((prev) => !prev); }} className="relative p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition border border-gray-100 flex-shrink-0">
                      <img src={Icons.CampanaIcon2} alt="Notificaciones" className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                    {showNotifs && (
                      <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] max-w-[320px] bg-white border border-[#e2e8f0] rounded-xl shadow-2xl z-[99999] overflow-hidden flex flex-col text-left">
                        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
                          <span className="text-xs font-bold text-[#071d37]">Alertas</span>
                          {unreadCount > 0 && <button onClick={() => marcarComoLeidas()} className="text-[10px] text-[#005684] hover:underline cursor-pointer">Marcar leídas</button>}
                        </div>
                        <div className="max-h-56 overflow-y-auto flex flex-col">
                          {notificaciones.length === 0 ? (
                            <div className="p-4 text-center text-[11px] text-gray-500">Estás al día.</div>
                          ) : (
                            notificaciones.map((n) => (
                              <div key={n.id} className={`p-3 border-b border-gray-100 flex flex-col gap-1 hover:bg-gray-50 transition ${!n.leido ? 'bg-[#f0f9ff]' : ''}`}>
                                <span className="text-[11px] font-bold text-[#071d37]">{n.titulo}</span>
                                <span className="text-[10px] text-gray-500 line-clamp-2">{n.descripcion}</span>
                              </div>
                            ))
                          )}
                        </div>
                        <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[10px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition">Ver todas</Link>
                      </div>
                    )}
                  </div>

                  <Link to={getDashboardPath()} className="rounded-md bg-[#005684] px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#00456a] shadow-sm flex-shrink-0">Panel</Link>
                  <button onClick={handleLogout} type="button" className="rounded-md bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-600 border border-red-200 transition hover:bg-red-100 flex-shrink-0">Salir</button>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 shadow-sm"><img src={getAvatar()} className="w-full h-full object-cover" alt="Avatar" /></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm active:bg-gray-100 transition-all text-[#005684]">
                    <span className="text-[10px] font-extrabold tracking-tight">Ingresar</span>
                  </Link>
                  <Link to="/signup">
                    <button className="bg-[#005684] text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold shadow-sm hover:bg-[#004266] transition flex-shrink-0">Registro</button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center w-full gap-2 !overflow-visible">
            <button className="flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors flex-shrink-0 active:scale-95" onClick={onFilterClick} type="button">
              <img src={Icons.iconFiltrosUrl} className="w-4 h-4" alt="Filtros" />
              <span className="bg-[#005684] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">3</span>
            </button>
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0 border border-gray-200 focus-within:border-[#005684] focus-within:ring-1 transition-all relative !overflow-visible" ref={searchRefMobile}>
              <img src={Icons.SearchIcon} className="w-3.5 h-3.5 opacity-50 mr-2 flex-shrink-0" alt="Buscar" />
              <input type="text" placeholder={searchPlaceholder} value={internalSearch} onChange={handleInputChange} onFocus={() => { if(internalSearch.length >= 2) setShowDropdown(true); }} className="bg-transparent border-none outline-none text-xs w-full text-gray-700 placeholder-gray-400" />
              {renderSearchDropdown()}
            </div>
          </div>
        </header>
      </div>

      {modalExpulsion && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center text-3xl shadow-sm">🛡️</div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-extrabold text-[#071d37]">Sesión Finalizada</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">Tu sesión ha sido cerrada desde otro dispositivo o panel de seguridad. Por protección, deberás ingresar de nuevo.</p>
            </div>
            <button onClick={handleAceptarExpulsion} className="w-full py-3 px-4 bg-[#005684] hover:bg-[#004266] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95">Entendido, ir al Login</button>
          </div>
        </div>
      )}
    </>
  );
}