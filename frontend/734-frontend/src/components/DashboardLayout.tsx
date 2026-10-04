import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import type { Notificacion } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";
import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNotifications } from '../hooks/useNotifications';

interface SesionUsuario {
  id: string;
  es_actual: boolean;
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados principales
  const [modalExpulsion, setModalExpulsion] = useState(false);
  const [rol, setRol] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{ name: string; avatar: string | null; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hook de Notificaciones (Límite de 5 para el dropdown)
  const { notificaciones, unreadCount, marcarComoLeidas } = useNotifications(profileData?.id, { limit: 5 });
  const [showNotifs, setShowNotifs] = useState(false);

  // Al pulsar un aviso de la campana: se marca como leído y se abre su destino
  const abrirNotificacionCampana = (n: Notificacion) => {
    setShowNotifs(false);
    if (!n.leido) marcarComoLeidas([n.id]);
    if (n.enlace) {
      navigate(n.enlace);
    } else {
      navigate('/dashboard/admin-notificaciones', { state: { abrirNotificacionId: n.id } });
    }
  };
  const notifRef = useRef<HTMLDivElement>(null);

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 1. CARGA INICIAL DE SESIÓN Y ROL DEL USUARIO
  useEffect(() => {
    let isMounted = true;

    async function getSessionAndRol() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol,id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          if (perfil) {
            setRol(perfil.rol);
            if (perfil.rol === 'fundacion') {
              const { data: fund } = await supabase
                .from('fundaciones')
                .select('nombre_legal, logo_url, id')
                .eq('id', session.user.id)
                .single();
              if (isMounted) setProfileData({ name: fund?.nombre_legal || 'Fundación', avatar: fund?.logo_url, id: fund?.id || session.user.id });
            } else if (perfil.rol === 'voluntario') {
              const { data: vol } = await supabase
                .from('voluntarios')
                .select('nombre_completo, avatar_url, id')
                .eq('id', session.user.id)
                .single();
              if (isMounted) setProfileData({ name: vol?.nombre_completo || 'Voluntario', avatar: vol?.avatar_url, id: vol?.id || session.user.id });
            } else if (perfil.rol === 'administrador' || perfil.rol === 'admin') {
              const { data: admin } = await supabase
                .from('administradores')
                .select('nombre_completo, avatar_url, id')
                .eq('id', session.user.id)
                .maybeSingle();

              if (isMounted) {
                setProfileData({
                  name: admin?.nombre_completo || 'Administrador',
                  avatar: admin?.avatar_url || null,
                  id: admin?.id || session.user.id
                });
              }
            }
          }
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("Error en sesión:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getSessionAndRol();

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => { 
      isMounted = false; 
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate]);

  // 2. ESCUCHA Y VALIDACIÓN EN TIEMPO REAL DE LA SESIÓN ACTUAL
  useEffect(() => {
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
      .channel(`sesion_layout_${dbSessionId}`)
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
  }, [navigate]);

  const handleAceptarExpulsion = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setModalExpulsion(false);
    navigate('/login', { replace: true });
  };

  const handleLogout = async () => {
    try {
      const dbSessionId = localStorage.getItem('db_session_id');
      if (dbSessionId) {
        await supabase.from('sesiones_usuario').update({ es_actual: false }).eq('id', dbSessionId);
        localStorage.removeItem('db_session_id');
      }
    } catch (error) {
      console.error("Error al registrar el cierre de sesión en BD:", error);
    } finally {
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/login', { replace: true });
    }
  };

  const isActive = (path: string) => location.pathname.includes(path);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-[#EFF4FF]">
        <p className="text-xs font-bold text-[#005684] animate-pulse">Cargando módulos de seguridad...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full bg-[#EFF4FF] text-[#2d3748] font-sans">
      
      {/* OVERLAY PARA MÓVIL */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#071d37]/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR RESPONSIVE */}
      <aside className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#EFF4FF] border-r border-[#e2e8f0] flex flex-col justify-between p-6 shrink-0 h-screen overflow-y-auto transform transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#0f2a3f] text-white flex items-center justify-center font-bold text-xs shadow-sm">7</div>
              <span className="font-extrabold text-[#071d37] text-lg tracking-tight">7:34 AM</span>
            </div>
            <button 
              className="lg:hidden text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] px-3 py-1.5 rounded-full text-[11px] font-bold w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OPERATIVO ACTIVO
          </div>

          {(rol === 'administrador' || rol === 'admin') && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Panel Admin</span>
              <nav className="flex flex-col gap-1">
                <Link to="/dashboard/admin-dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive('/admin-dashboard') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50'}`}><span>🗂️</span> Resumen</Link>
                <Link to="/dashboard/admin-aprobaciones" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive('/admin-aprobaciones') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50'}`}><span>🗂️</span> Aprobaciones</Link>
                <Link to="/dashboard/admin-fundaciones" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive('/admin-fundaciones') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50'}`}><span>🗂️</span> Fundaciones</Link>
                <Link to="/dashboard/admin-voluntarios" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive('/admin-voluntarios') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50'}`}><span>👥</span> Voluntarios</Link>
              </nav>
            </div>
          )}

          {(rol === 'voluntario' || rol === 'fundacion') && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Usuario</span>
              {rol === 'voluntario' && (
                <nav className="flex flex-col gap-1">
                  <Link to={`/dashboard/voluntario/editar/${profileData?.id ?? ''}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/voluntario/editar') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}><span>👤</span> Editar Perfil Voluntario</Link>
                </nav>
              )}
              {rol === 'fundacion' && (
                <nav className="flex flex-col gap-1">
                  <Link to={`/dashboard/fundacion/editar/${profileData?.id ?? ''}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/fundacion/editar') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}><span>🏢</span> Editar Perfil Fundación</Link>
                  <Link to={`/dashboard/fundacion/necesidades/${profileData?.id ?? ''}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/fundacion/necesidades') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}><span>📋</span> Gestionar Necesidades</Link>
                </nav>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Sistema</span>
            <nav className="flex flex-col gap-1">
              <Link to="/dashboard/ajustes" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/ajustes') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}><span>⚙</span> Seguridad</Link>
              <Link to="/dashboard/admin-notificaciones" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/admin-notificaciones') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}><span>🔔</span> Notificaciones</Link>
            </nav>
          </div>
        </div>

        {/* ACCIONES INFERIORES */}
        <div className="mt-auto pt-6 flex flex-col gap-2 border-t border-[#e2e8f0]">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 text-[#005684] bg-white border border-[#dbeafe] hover:bg-[#eef6ff] hover:border-[#bae6fd] shadow-sm text-xs font-bold transition w-full px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <span>🌍</span> Ir al Sitio Público
          </Link>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 text-red-600 bg-transparent hover:bg-red-50 text-xs font-bold transition w-full px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <span><img src={Icons.LogoutIcon} alt="Cerrar sesión" className="w-4 h-4" /></span> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative w-full lg:w-[calc(100%-18rem)]">
        <header className="print:hidden bg-[#EFF4FF] border-b border-[#e2e8f0] px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-[#071d37] hover:bg-blue-50 rounded-lg transition cursor-pointer"
            >
              ☰
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="hidden sm:inline">&gt;</span>
              <span className="text-[#071d37] font-bold capitalize">{rol || 'Administración'}</span>
            </div>
          </div>

          {/* {(rol === 'administrador' || rol === 'admin') && (
            <div className="hidden md:flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 w-60 gap-2">
              <span className="text-gray-400 text-xs"><img src={Icons.SearchIcon} alt="Buscar" /></span>
              <input type="text" placeholder="Buscar voluntarios..." className="bg-transparent text-xs w-full focus:outline-none" />
            </div>
          )} */}

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold text-gray-600">
              <span className={`px-2.5 py-1 rounded-lg transition ${rol === 'administrador' || rol === 'admin' ? 'bg-[#006194] text-white shadow-xs' : 'bg-[#DAE2FD] text-[#3F4850]'}`}>Admin</span>
              <span className={`px-2.5 py-1 rounded-lg transition ${rol === 'fundacion' ? 'bg-[#006194] text-white shadow-xs' : 'bg-[#DAE2FD] text-[#3F4850]'}`}>Fundación</span>
              <span className={`px-2.5 py-1 rounded-lg transition ${rol === 'voluntario' ? 'bg-[#006194] text-white shadow-xs' : 'bg-[#DAE2FD] text-[#3F4850]'}`}>Voluntario</span>
            </div>

            {/* DROPDOWN NOTIFICACIONES */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <img src={Icons.CampanaIcon2} alt="Notificaciones" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#071d37]">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button onClick={() => marcarComoLeidas()} className="text-[10px] text-[#005684] hover:underline cursor-pointer">
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto flex flex-col">
                    {notificaciones.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">No hay notificaciones.</div>
                    ) : (
                      notificaciones.map((n) => (
                        <button type="button" key={n.id} onClick={() => abrirNotificacionCampana(n)} className={`w-full text-left cursor-pointer p-3 border-b border-gray-100 flex flex-col gap-1 hover:bg-gray-50 transition ${!n.leido ? 'bg-[#f0f9ff]' : ''}`}>
                          <span className="text-xs font-bold text-[#071d37]">{n.titulo}</span>
                          <span className="text-[11px] text-gray-500 line-clamp-2">{n.descripcion}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <Link to="/dashboard/admin-notificaciones" className="p-2 text-center text-[11px] font-bold text-[#005684] bg-gray-50 hover:bg-gray-100 transition">
                    Ver todas
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 border-l border-gray-200 pl-2 sm:pl-4">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#0f2a3f] text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                {profileData?.avatar ? <img src={profileData.avatar} alt="Perfil" className="w-full h-full object-cover" /> : profileData?.name ? profileData.name.substring(0, 2) : 'US'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#071d37]">{profileData?.name || 'Usuario'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          <Outlet />
        </div>
      </div>

      {modalExpulsion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5 transform transition-all scale-100">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center text-3xl shadow-sm">
              🛡
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
    </div>
  );
}
