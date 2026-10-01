import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";
import { RealtimeChannel } from '@supabase/supabase-js';

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

  // Estado del Modal de Expulsión
  const [modalExpulsion, setModalExpulsion] = useState(false);

  // Estado de Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // 1. CARGA DE USUARIO, NOTIFICACIONES Y PERFIL
  useEffect(() => {
    async function getAuthUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Cargar Notificaciones
        const { data: notifs } = await supabase
          .from('notificaciones')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (notifs) setNotificaciones(notifs);

        const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).maybeSingle();

        if (perfil) {
          if (perfil.rol === 'fundacion') {
            const { data: fund } = await supabase.from('fundaciones').select('nombre_legal, logo_url').eq('id', session.user.id).maybeSingle();
            setProfileData({ name: fund?.nombre_legal || 'Fundación', avatar: fund?.logo_url, rol: perfil.rol });
          } else if (perfil.rol === 'voluntario') {
            const { data: vol } = await supabase.from('voluntarios').select('nombre_completo, avatar_url').eq('id', session.user.id).maybeSingle();
            setProfileData({ name: vol?.nombre_completo || 'Voluntario', avatar: vol?.avatar_url, rol: perfil.rol });
          } else if (perfil.rol === 'administrador') {
            setProfileData({ name: 'Administrador', avatar: null, rol: perfil.rol });
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
        setNotificaciones([]);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 2. VALIDACIÓN Y ESCUCHA EN TIEMPO REAL DE LA SESIÓN EN BD (PÁGINAS PÚBLICAS)
  useEffect(() => {
    if (!user) return; // Solo activa la verificación si el usuario está logueado

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

  // Manejador del botón del modal de expulsión
  const handleAceptarExpulsion = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setModalExpulsion(false);
    setUser(null);
    setProfileData(null);
    navigate('/login', { replace: true });
  };

  // Cierre de sesión voluntario
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

  const marcarLeidas = async () => {
    const ids = notificaciones.filter(n => !n.leido).map(n => n.id);
    if (ids.length === 0) return;
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    await supabase.from('notificaciones').update({ leido: true }).in('id', ids);
  };

  const unreadCount = notificaciones.filter(n => !n.leido).length;

  return (
    <header className="home-header relative">
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

      <div className="header-right">
        <div className="header-right-inicre flex items-center gap-4">
          {loading ? (
            <span className="text-xs text-gray-400">Cargando...</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#071d37] hidden md:inline">
                Hola, {profileData?.name || 'Usuario'}
              </span>

              {/* NOTIFICACIONES */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition cursor-pointer">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                    <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
                      <span className="text-xs font-bold text-[#071d37]">Alertas de Plataforma</span>
                      {unreadCount > 0 && (
                        <button onClick={marcarLeidas} className="text-[10px] text-[#005684] hover:underline cursor-pointer">
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
              <a href="/login" className="nav-link">Iniciar sesión</a>
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

      {/* MODAL VISUAL DE EXPULSIÓN DE SESIÓN */}
      {modalExpulsion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
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
    </header>
  );
}