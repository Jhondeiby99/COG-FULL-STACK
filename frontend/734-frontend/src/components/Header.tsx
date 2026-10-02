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
  const notifRef = useRef<HTMLDivElement>(null);

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
            setProfileData({ name: admin?.nombre_completo || 'Administrador', avatar: admin?.avatar_url || null, rol: perfil.rol });
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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
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
    <header className="home-header relative z-[9999] bg-white shadow-sm flex flex-col w-full">
      {/* FILA PRINCIPAL: Visible siempre (Filtros, Logo, Usuario) */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 w-full gap-2 lg:gap-4">
        
        {/* IZQUIERDA: Filtros y Buscador (Desktop) */}
        <div className="flex items-center gap-3 flex-1">
          {/* Botón Filtros (Texto oculto en móvil) */}
          <button 
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 md:px-3 lg:px-4 lg:py-2 hover:bg-gray-100 transition-colors flex-shrink-0" 
            onClick={onFilterClick} 
            type="button"
          >
            <img src={Icons.iconFiltrosUrl} className="w-4 h-4 md:w-5 md:h-5" alt="Filtros" />
            <span className="hidden md:inline text-xs lg:text-sm font-semibold text-[#071d37]">Filtros</span>
            <span className="bg-[#005684] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
          </button>

          {/* Buscador de Escritorio (Oculto en móvil) */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-2 flex-1 max-w-sm border border-transparent focus-within:border-[#005684] transition-all">
            <img src={Icons.SearchIcon} className="w-4 h-4 opacity-50 mr-2" alt="Buscar" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              onChange={onSearchChange} 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
            />
          </div>
        </div>

        {/* CENTRO: Logo y Textos */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-sm md:text-base font-extrabold text-[#071d37] tracking-tight">7:34 AM</span>
          <span className="hidden sm:block text-[10px] md:text-xs text-gray-500 font-medium text-center">Conectando voluntades</span>
        </div>

        {/* DERECHA: Perfil, Notificaciones y Login */}
        <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
          {loading ? (
            <span className="text-xs text-gray-400">Cargando...</span>
          ) : user ? (
            <div className="flex items-center gap-2 md:gap-3 relative">
              <span className="text-xs font-bold text-[#071d37] hidden lg:inline mr-2">
                Hola, {profileData?.name?.split(' ')[0] || 'Usuario'}
              </span>

              {/* CONTENEDOR DE NOTIFICACIONES */}
              <div className="relative flex items-center justify-center" ref={notifRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowNotifs((prev) => !prev);
                  }}
                  className="relative p-1.5 md:p-2 hover:bg-gray-200 bg-gray-100 rounded-full transition cursor-pointer"
                >
                  <img src={Icons.CampanaIcon2} alt="Notificaciones" className="w-4 h-4 md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-2 w-2 md:h-2.5 md:w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-[-60px] sm:right-0 top-full mt-3 w-72 sm:w-80 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl z-[99999] overflow-hidden flex flex-col text-left">
                    <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
                      <span className="text-xs font-bold text-[#071d37]">Alertas</span>
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
                    <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[11px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition" onClick={() => setShowNotifs(false)}>
                      Ver todas
                    </Link>
                  </div>
                )}
              </div>

              {/* Botones de acción perfil (Mi Panel y Salir) */}
              <Link to={getDashboardPath()} className="hidden sm:inline-block rounded-lg bg-[#005684] px-2 py-1.5 md:px-3 text-[10px] md:text-xs font-bold text-white transition hover:bg-[#00456a] whitespace-nowrap">
                Mi Panel
              </Link>

              <button onClick={handleLogout} type="button" className="hidden sm:inline-block rounded-lg bg-red-50 px-2 py-1.5 md:px-3 text-[10px] md:text-xs font-bold text-red-600 border border-red-200 transition hover:bg-red-100 cursor-pointer">
                Salir
              </button>

              {/* Avatar Clickable en móvil para ir al panel */}
              <Link to={getDashboardPath()} className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-gray-200 ml-1">
                <img src={getAvatar()} className="w-full h-full object-cover" alt="Avatar" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <a href="/login" className="hidden sm:inline text-xs md:text-sm text-gray-600 font-medium hover:text-[#005684]">Ingresar</a>
              <Link to="/signup">
                <button className="bg-[#005684] text-white rounded-lg px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold flex items-center gap-1 hover:bg-[#004266] transition">
                  <span className="hidden sm:inline">Crear usuario</span>
                  <span className="sm:hidden">Registro</span>
                  <img src={Icons.arrowDownIcon} className="w-2 h-2 md:w-3 md:h-3 invert" alt="Desplegar" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FILA 2: Buscador para Móviles y Tablets (Solo visible en pantallas pequeñas lg:hidden) */}
      <div className="flex lg:hidden px-4 pb-3 w-full">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full border border-gray-200 focus-within:border-[#005684] transition-all">
          <img src={Icons.SearchIcon} className="w-4 h-4 opacity-50 mr-2" alt="Buscar" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            onChange={onSearchChange} 
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
          />
        </div>
      </div>

      {/* MODAL EXPULSIÓN */}
      {modalExpulsion && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5 transform transition-all scale-100">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center text-3xl shadow-sm">
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
              className="w-full py-3 px-4 bg-[#005684] hover:bg-[#004266] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Entendido, ir al Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}