import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";

interface HeaderProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export function Header({ 
  onSearchChange, 
  onFilterClick, 
  searchPlaceholder = "Causas, fundaciones..." 
}: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    async function getAuthUser() {
      // 1. Obtener la sesión actual de Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);

        // 2. Consultar la tabla perfiles para saber el rol y buscar su nombre real
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (perfilError) {
          console.error("Error cargando perfil:", perfilError.message);
        }

        if (perfil) {
          if (perfil.rol === 'fundacion') {
            const { data: fund, error: fundacionError } = await supabase
              .from('fundaciones')
              .select('nombre_legal, logo_url')
              .eq('id', session.user.id)
              .maybeSingle();

            if (fundacionError) {
              console.error("Error cargando perfil fundacion:", fundacionError.message);
            }

            setProfileData({ 
              name: fund?.nombre_legal || 'Fundación', 
              avatar: fund?.logo_url,
              rol: perfil.rol 
            });

          } else if (perfil.rol === 'voluntario') {
            const { data: vol, error: voluntarioError } = await supabase
              .from('voluntarios')
              .select('nombre_completo, avatar_url')
              .eq('id', session.user.id)
              .maybeSingle();

            if (voluntarioError) {
              console.error("Error cargando perfil voluntario:", voluntarioError.message);
            }

            setProfileData({ 
              name: vol?.nombre_completo || 'Voluntario', 
              avatar: vol?.avatar_url,
              rol: perfil.rol 
            });
            
          } else if (perfil.rol === 'administrador') {
            setProfileData({ 
              name: 'Administrador', 
              avatar: null,
              rol: perfil.rol 
            });
          }
        }
      }
      setLoading(false);
    }

    getAuthUser();

    // Escuchar cambios de sesión en tiempo real (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Opcional: Podrías volver a ejecutar getAuthUser() aquí si quieres actualizar el perfil automáticamente al cambiar de usuario
      } else {
        setUser(null);
        setProfileData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getAvatar = () => {
    if (profileData?.avatar && profileData.avatar.trim() !== '') {
      return profileData.avatar;
    }
    return Icons.PersonIcon;
  };

  // FUNCIÓN CORREGIDA: Ahora usa el estado 'user' en lugar de la variable local 'session'
  const getDashboardPath = () => {
    switch (profileData?.rol) {
      case 'administrador':
        return '/dashboard/admin-dashboard';
      case 'fundacion':
        return user?.id ? `/dashboard/fundacion/editar/${user.id}` : '/dashboard';
      case 'voluntario':
      default:
        return user?.id ? `/dashboard/voluntario/editar/${user.id}` : '/dashboard';
    }
  };



  return (
    <header className="home-header">
      <div className="header-left">
        {/* Botón de Filtros */}
        <button className="btn-filtros" onClick={onFilterClick} type="button">
          <img src={Icons.iconFiltrosUrl} className="icon-svg" alt="Filtros" />
          Filtros avanzados
          <span className="badge">3</span>
        </button>

        {/* Buscador */}
        <div className="header-search">
          <img src={Icons.SearchIcon} className="icon-search" alt="Buscar" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            onChange={onSearchChange} 
          />
        </div>
      </div>
      
      {/* Centro - Logo / Hora */}
      <div className="header-center">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-logo-center" style={{ cursor: 'pointer' }}>
            <span className="time-text">7:34 AM</span>
            <span className="brand-slogan">Conectando voluntades y causas</span>
          </div>
        </Link>
      </div>

      {/* Derecha - Acciones de Usuario (Dinámico según sesión) */}
      <div className="header-right">
        <div className="header-right-inicre">
          {loading ? (
            <span className="text-xs text-gray-400">Cargando...</span>
          ) : user ? (
            /* VISTA: Usuario Logueado */
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#071d37] hidden md:inline">
                Hola, {profileData?.name || 'Usuario'}
              </span>
              
              {/* Botón dinámico hacia el dashboard según rol */}
              <Link 
                to={getDashboardPath()}
                className="rounded-lg bg-[#005684] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#00456a]"
              >
                Mi Panel
              </Link>
              
              <button 
                onClick={handleLogout} 
                type="button"
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 transition hover:bg-red-100 cursor-pointer"
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>

              <div className="avatar-circle small overflow-hidden border border-gray-200">
                <img src={getAvatar()} className="icon-person" alt="Avatar" />
              </div>
            </div>
          ) : (
            /* VISTA: Usuario NO Logueado */
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