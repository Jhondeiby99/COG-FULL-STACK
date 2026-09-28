import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from "../assets/icons/index.ts";
import { useState, useEffect } from 'react';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    async function getSessionAndRol() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Error obteniendo el rol del layout:", error.message);
          } else if (perfil) {
            setRol(perfil.rol);
          }
        } else {
          // Si no hay sesión activa, redirigir al login
          navigate('/login');
        }
      } catch (err) {
        console.error("Error inesperado en sesión:", err);
      } finally {
        setLoading(false);
      }
    }

    getSessionAndRol();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
      
      {/* SIDEBAR IZQUIERDO FIJO */}
      <aside className="w-72 bg-[#EFF4FF] border-r border-[#e2e8f0] flex flex-col justify-between p-6 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col gap-6">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#0f2a3f] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                7
              </div>
              <span className="font-extrabold text-[#071d37] text-lg tracking-tight">7:34 AM</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 cursor-pointer">☰</button>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] px-3 py-1.5 rounded-full text-[11px] font-bold w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OPERATIVO ACTIVO
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Panel Admin</span>
            <nav className="flex flex-col gap-1">
              <Link to="/dashboard/admin-dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#64748b] text-xs font-semibold transition ${isActive('/admin-dashboard') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}>
                <span>🗂️</span> Resumen
              </Link>
              {/* ... resto de enlaces ... */}
            </nav>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Usuario</span>
            <nav className="flex flex-col gap-1">
              <Link 
                to="/dashboard/voluntario/editar" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/voluntario/editar') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}
              >
                <span>👤</span> Editar Perfil Voluntario
              </Link>
              {/* ... resto de enlaces ... */}
            </nav>
            <nav className="flex flex-col gap-1">
              <Link 
                to="/dashboard/fundacion/editar" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/fundacion/editar') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}
              >
                <span>👤</span> Editar Perfil Fundacion
              </Link>
              {/* ... resto de enlaces ... */}
            </nav>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Sistema</span>
            <nav className="flex flex-col gap-1">
              {/* ... otros enlaces ... */}
              <Link 
                to="/dashboard/ajustes" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive('/ajustes') ? 'bg-[#005684] text-white shadow-sm' : 'text-[#64748b] hover:bg-gray-50 font-semibold'}`}
              >
                <span>⚙️</span> Preferencias
              </Link>
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-xs font-bold transition w-full px-3 py-2 rounded-xl hover:bg-red-50 cursor-pointer"
          >
            <span>
              <img src={Icons.LogoutIcon}></img>
            </span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENEDOR DERECHO */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        
      <header className="bg-[#EFF4FF] border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-[#071d37] font-bold">Administración</span>
          </div>
          
          <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 w-60 gap-2">
            <span className="text-gray-400 text-xs">
                <img src={Icons.SearchIcon}></img>
            </span>
            <input type="text" placeholder="Buscar voluntarios, solicitudes..." className="bg-transparent text-xs w-full focus:outline-none" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold text-gray-600">
              <span className="bg-[#006194] px-2.5 py-1 rounded-lg shadow-xs text-white">Admin</span>
              <span className="px-2.5 py-1 text-[#3F4850] bg-[#DAE2FD] rounded-xl">Gestor</span>
              <span className="px-2.5 py-1 text-[#3F4850] bg-[#DAE2FD] rounded-xl">Voluntario</span>
            </div>
            <img src={Icons.CampanaIcon2}></img>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="h-9 w-9 rounded-full bg-[#0f2a3f] text-white flex items-center justify-center font-bold text-xs">
                ER
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#071d37]">Elena Rostova</span>
                <span className="text-[10px] text-gray-400">Coordinación General ▾</span>
              </div>
            </div>
          </div>
        </header>

        {/* AQUÍ SE INYECTA EL CONTENIDO DE LA PÁGINA (AccountSettings o EditVolunteerProfile) */}
        <div className="p-4 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
            <Outlet /> 
        </div>

      </div>
    </div>
  );
}