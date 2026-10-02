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
}

interface SesionUsuario {
  id: string;
  es_actual: boolean;
}

export function Header({ onSearchChange, onFilterClick, searchPlaceholder = "Causas, fundaciones..." }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalExpulsion, setModalExpulsion] = useState(false);

  // Hook de Notificaciones
  const { notificaciones, unreadCount, marcarComoLeidas } = useNotifications(user?.id, { limit: 5 });
  const [showNotifs, setShowNotifs] = useState(false);
  
  // Refs separados para escritorio y móvil para manejar clics fuera sin conflictos
  const notifRefDesktop = useRef<HTMLDivElement>(null);
  const notifRefMobile = useRef<HTMLDivElement>(null);

  // 1. CARGA DE USUARIO Y PERFIL
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfileData(null);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideDesktop = notifRefDesktop.current && !notifRefDesktop.current.contains(event.target as Node);
      const clickedOutsideMobile = notifRefMobile.current && !notifRefMobile.current.contains(event.target as Node);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowNotifs(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 2. VALIDACIÓN Y ESCUCHA EN TIEMPO REAL DE LA SESIÓN EN BD
  useEffect(() => {
    if (!user) return;

    const dbSessionId = localStorage.getItem('db_session_id');
    if (!dbSessionId) return;

    const ejecutarExpulsion = () => {
      localStorage.removeItem('db_session_id');
      setModalExpulsion(true);
    };

    const verificarSesionInicial = async () => {
      const { data, error } = await supabase
        .from('sesiones_usuario')
        .select('id, es_actual')
        .eq('id', dbSessionId)
        .maybeSingle();

      if (error || !data || data.es_actual === false) {
        ejecutarExpulsion();
      }
    };

    verificarSesionInicial();

    const channel: RealtimeChannel = supabase
      .channel(`sesion_header_${dbSessionId}`)
      .on<SesionUsuario>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sesiones_usuario',
          filter: `id=eq.${dbSessionId}`
        },
        async (payload) => {
          const fueDesactivada = payload.new && 'es_actual' in payload.new && payload.new.es_actual === false;
          const fueEliminada = payload.eventType === 'DELETE';

          if (fueDesactivada || fueEliminada) {
            ejecutarExpulsion();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      if (dbSessionId) {
        await supabase
          .from('sesiones_usuario')
          .update({ es_actual: false })
          .eq('id', dbSessionId);

        localStorage.removeItem('db_session_id');
      }
    } catch (error) {
      console.error("Error al registrar el cierre de sesión en BD:", error);
    } finally {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      setProfileData(null);
      navigate('/login', { replace: true });
    }
  };

  const getAvatar = () => (profileData?.avatar && profileData.avatar.trim() !== '') ? profileData.avatar : Icons.PersonIcon;

  const getDashboardPath = () => {
    switch (profileData?.rol) {
      case 'administrador': return '/dashboard/admin-dashboard';
      case 'fundacion': return user?.id ? `/dashboard/fundacion/editar/${user.id}` : '/dashboard';
      case 'voluntario': default: return user?.id ? `/dashboard/voluntario/editar/${user.id}` : '/dashboard';
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. VERSIÓN WEB / DESKTOP (INTACTA - SE OCULTA EN MÓVIL)                   */}
      {/* ========================================================================= */}
      <div className="hidden sm:block w-full">
        <header className="home-header relative !overflow-visible z-[9999]">
          <div className="header-left">
            <button className="btn-filtros" onClick={onFilterClick} type="button">
              <img src={Icons.iconFiltrosUrl} className="icon-svg" alt="Filtros" />
              Filtros avanzados <span className="badge">3</span>
            </button>
            <div className="header-search">
              <img src={Icons.SearchIcon} className="icon-search" alt="Buscar" />
              <input type="text" placeholder={searchPlaceholder} onChange={onSearchChange} />
            </div>
          </div>

          <div className="header-center">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="brand-logo-center" style={{ cursor: 'pointer' }}>
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
                  <span className="text-xs font-bold text-[#071d37] hidden md:inline">
                    Hola, {profileData?.name || 'Usuario'}
                  </span>

                  {/* CONTENEDOR DE NOTIFICACIONES DESKTOP */}
                  <div className="relative flex items-center justify-center !overflow-visible" ref={notifRefDesktop}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNotifs((prev) => !prev);
                      }}
                      className="relative p-2 hover:bg-gray-200 bg-gray-100 rounded-full transition cursor-pointer"
                    >
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
                          <span className="text-xs font-bold text-[#071d37]">Alertas de Plataforma</span>
                          {unreadCount > 0 && (
                            <button onClick={() => marcarComoLeidas()} className="text-[10px] text-[#005684] hover:underline cursor-pointer">
                              Marcar leídas
                            </button>
                          )}
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
                        <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[11px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition">
                        Ver todas
                      </Link>
                      </div>
                    )}
                  </div>

                  <Link to={getDashboardPath()} className="rounded-lg bg-[#005684] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#00456a]">
                    Mi Panel
                  </Link>

                  <button onClick={handleLogout} type="button" className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 transition hover:bg-red-100 cursor-pointer" title="Cerrar sesión">
                    Salir
                  </button>

                  <div className="avatar-circle small overflow-hidden border border-gray-200">
                    <img src={getAvatar()} className="icon-person" alt="Avatar" />
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Iniciar sesión</Link>
                  <Link to="/signup">
                    <button className="btn-primary small" type="button">
                      Crear usuario 
                      <img src={Icons.arrowDownIcon} className="icon-arrow" alt="Desplegar" />
                    </button>
                  </Link>
                  <div className="avatar-circle small">
                    <img src={Icons.PersonIcon} className="icon-person" alt="Usuario por defecto" />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ========================================================================= */}
      {/* 2. VERSIÓN MÓVIL OPTIMIZADA                                               */}
      {/* ========================================================================= */}
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNotifs((prev) => !prev);
                      }}
                      className="relative p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition border border-gray-100 flex-shrink-0"
                    >
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
                          {unreadCount > 0 && (
                            <button onClick={() => marcarComoLeidas()} className="text-[10px] text-[#005684] hover:underline cursor-pointer">
                              Marcar leídas
                            </button>
                          )}
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
                        <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[10px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition">
                          Ver todas
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link to={getDashboardPath()} className="rounded-md bg-[#005684] px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#00456a] shadow-sm flex-shrink-0">
                    Panel
                  </Link>

                  <button onClick={handleLogout} type="button" className="rounded-md bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-600 border border-red-200 transition hover:bg-red-100 flex-shrink-0">
                    Salir
                  </button>

                  <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                    <img src={getAvatar()} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm active:bg-gray-100 transition-all text-gray-600">
                    <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={Icons.PersonIcon} className="w-full h-full opacity-70" alt="Login" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-tight">Ingresar</span>
                  </Link>
                  <Link to="/signup">
                    <button className="bg-[#005684] text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center shadow-sm hover:bg-[#004266] transition flex-shrink-0 whitespace-nowrap">
                      Registro
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center w-full gap-2 !overflow-visible">
            <button className="flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors flex-shrink-0" onClick={onFilterClick} type="button">
              <img src={Icons.iconFiltrosUrl} className="w-4 h-4" alt="Filtros" />
              <span className="bg-[#005684] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">3</span>
            </button>

            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0 border border-gray-200 focus-within:border-[#005684] transition-all">
              <img src={Icons.SearchIcon} className="w-3.5 h-3.5 opacity-50 mr-2 flex-shrink-0" alt="Buscar" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={onSearchChange}
                className="bg-transparent border-none outline-none text-xs w-full text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
        </header>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL DE EXPULSIÓN GLOBAL (SE MUESTRA EN AMBAS VERSIONES)              */}
      {/* ========================================================================= */}
      {modalExpulsion && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5 transform transition-all scale-100">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center text-3xl shadow-sm">
              🛡️
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-extrabold text-[#071d37]">
                Sesión Finalizada
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Tu sesión ha sido cerrada desde otro dispositivo o panel de seguridad. Por protección, deberás ingresar de nuevo.
              </p>
            </div>
            <button
              onClick={handleAceptarExpulsion}
              className="w-full py-3 px-4 bg-[#005684] hover:bg-[#004266] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              Entendido, ir al Login
            </button>
          </div>
        </div>
      )}
    </>
  );
}