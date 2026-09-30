import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";

interface HeaderProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export function Header({ onSearchChange, onFilterClick, searchPlaceholder = "Causas, fundaciones..." }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estado de Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
      await supabase.auth.signOut();
      navigate('/login', { replace: true }); // Obliga al navegador a olvidar la ruta anterior
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
    <header className="home-header">
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
    </header>
  );
}