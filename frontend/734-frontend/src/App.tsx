import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { FoundationProfile } from './pages/foundation-profile';
import { SignUp } from './pages/sign-up';
import { VolunteerProfile } from './pages/volunteer-profile';
import './styles/global.css';
import './index.css';
import { AccountSettings } from './pages/account-settings';
import { DashboardLayout } from './components/DashboardLayout';
import { EditVolunteerProfile } from './pages/edit-volunteer-profile';
import { EditFoundationProfile } from './pages/edit-foundation-profile';
import { AdminDashboard } from './pages/admin-dashboard';
import { AdminApproval } from './pages/admin-approval';
import { AdminFoundations } from './pages/admin-foundations';
import { AdminVolunteers } from './pages/admin-volunteers';
import { AccountNotifications } from './pages/account-notifications';

// Componente opcional para proteger paneles exclusivos (Ej: Admin o Edición)
// Reemplaza tu función ProtectedRoute en App.tsx por esta:
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const [authStatus, setAuthStatus] = useState<{ loading: boolean; session: boolean; role?: string }>({
    loading: true,
    session: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function resolveSession(session: any) {
      if (!session) {
        if (isMounted) setAuthStatus({ loading: false, session: false });
        return;
      }

      if (requiredRole) {
        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
        if (isMounted) setAuthStatus({ loading: false, session: true, role: perfil?.rol });
      } else {
        if (isMounted) setAuthStatus({ loading: false, session: true });
      }
    }

    // 1. Revisión inicial al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => resolveSession(session));

    // 2. VIGILANTE EN TIEMPO REAL: Si la sesión muere, expulsa al usuario al instante
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) setAuthStatus({ loading: false, session: false });
      } else {
        resolveSession(session);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (authStatus.loading) {
    return (
      <div className="min-h-svh flex items-center justify-center font-bold text-[#005684] bg-[#f8fafc]">
        Verificando credenciales cívicas...
      </div>
    );
  }

  // Si se detecta que no hay sesión, expulsa inmediatamente a /login
  if (!authStatus.session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && authStatus.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================== */}
        {/* RUTA PÚBLICAS (Cualquiera puede entrar sin estar logueado)         */}
        {/* ================================================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/voluntario/:id" element={<VolunteerProfile />} />
        <Route path="/fundacion/:id" element={<FoundationProfile />} />

        <Route 
         path='/ajustes'
         element={
            <AccountSettings />
         }
        />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="ajustes" element={<AccountSettings />} />
          {/* Rutas modificadas con el parámetro :id */}
          <Route path="voluntario/editar/:id" element={<EditVolunteerProfile />} />
          <Route path="fundacion/editar/:id" element={<EditFoundationProfile />} />
          
          <Route path="admin-dashboard" element={<AdminDashboard />} />
          <Route path="admin-aprobaciones" element={<AdminApproval />} />
          <Route path="admin-fundaciones" element={<AdminFoundations />} />
          <Route path="admin-voluntarios" element={<AdminVolunteers />} />
          <Route path="admin-notificaciones" element={<AccountNotifications />} />
          {/* Otras rutas del dashboard */}
       </Route>

        {/* Redirección por defecto ante cualquier ruta extraña */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;