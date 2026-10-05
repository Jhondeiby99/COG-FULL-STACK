import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Home } from './pages/home';
import './styles/global.css';
import './index.css';

import type { Session } from '@supabase/supabase-js';
// Cada pantalla se descarga solo cuando se visita (el inicio se carga de inmediato)
const Login = lazy(() => import('./pages/login').then(m => ({ default: m.Login })));
const FoundationProfile = lazy(() => import('./pages/foundation-profile').then(m => ({ default: m.FoundationProfile })));
const SignUp = lazy(() => import('./pages/sign-up').then(m => ({ default: m.SignUp })));
const VolunteerProfile = lazy(() => import('./pages/volunteer-profile').then(m => ({ default: m.VolunteerProfile })));
const Explore = lazy(() => import('./pages/explore').then(m => ({ default: m.Explore })));
const AccountSettings = lazy(() => import('./pages/account-settings').then(m => ({ default: m.AccountSettings })));
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const EditVolunteerProfile = lazy(() => import('./pages/edit-volunteer-profile').then(m => ({ default: m.EditVolunteerProfile })));
const EditFoundationProfile = lazy(() => import('./pages/edit-foundation-profile').then(m => ({ default: m.EditFoundationProfile })));
const AdminDashboard = lazy(() => import('./pages/admin-dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminApproval = lazy(() => import('./pages/admin-approval').then(m => ({ default: m.AdminApproval })));
const AdminFoundations = lazy(() => import('./pages/admin-foundations').then(m => ({ default: m.AdminFoundations })));
const AdminVolunteers = lazy(() => import('./pages/admin-volunteers').then(m => ({ default: m.AdminVolunteers })));
const AccountNotifications = lazy(() => import('./pages/account-notifications').then(m => ({ default: m.AccountNotifications })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const ManageNeeds = lazy(() => import('./pages/manage-needs').then(m => ({ default: m.ManageNeeds })));

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const [authStatus, setAuthStatus] = useState<{ loading: boolean; session: boolean; role?: string }>({
    loading: true,
    session: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function resolveSession(session: Session | null) {
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

    supabase.auth.getSession().then(({ data: { session } }) => resolveSession(session));

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

  if (!authStatus.session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && authStatus.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/** Pantallas de edición: solo la cuenta dueña del :id de la URL o un administrador */
function SoloDuenoOAdmin({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const [permitido, setPermitido] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      let ok = !!uid && uid === id;
      if (uid && !ok) {
        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', uid).maybeSingle();
        ok = perfil?.rol === 'administrador';
      }
      if (activo) setPermitido(ok);
    })();
    return () => { activo = false; };
  }, [id]);

  if (permitido === null) return <CargandoPantalla />;
  return permitido ? <>{children}</> : <Navigate to="/" replace />;
}

function CargandoPantalla() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-[#f8fafc]">
      <div className="w-8 h-8 border-[3px] border-[#005684] border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<CargandoPantalla />}>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explore />} /> {/* <-- RUTA NUEVA */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/voluntario/:id" element={<VolunteerProfile />} />
        <Route path="/fundacion/:id" element={<FoundationProfile />} />

        {/* RUTAS PRIVADAS / DASHBOARD */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="ajustes" element={<AccountSettings />} />
          <Route path="voluntario/editar/:id" element={<SoloDuenoOAdmin><EditVolunteerProfile /></SoloDuenoOAdmin>} />
          <Route path="fundacion/editar/:id" element={<SoloDuenoOAdmin><EditFoundationProfile /></SoloDuenoOAdmin>} />
          <Route path="fundacion/necesidades/:id" element={<SoloDuenoOAdmin><ManageNeeds /></SoloDuenoOAdmin>} />
          <Route path="admin-dashboard" element={<ProtectedRoute requiredRole="administrador"><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin-aprobaciones" element={<ProtectedRoute requiredRole="administrador"><AdminApproval /></ProtectedRoute>} />
          <Route path="admin-fundaciones" element={<ProtectedRoute requiredRole="administrador"><AdminFoundations /></ProtectedRoute>} />
          <Route path="admin-voluntarios" element={<ProtectedRoute requiredRole="administrador"><AdminVolunteers /></ProtectedRoute>} />
          <Route path="admin-necesidades" element={<ProtectedRoute requiredRole="administrador"><ManageNeeds global /></ProtectedRoute>} />
          <Route path="admin-notificaciones" element={<AccountNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;