import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    // URL a donde redirigirá Supabase tras hacer clic en el correo
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else {
      setMensaje({
        tipo: 'success',
        texto: '¡Enlace de recuperación enviado! Revisa tu bandeja de entrada o correo institucional.',
      });
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <main className="login-layout flex min-h-svh items-center justify-center bg-[#f4f7fb] p-4">
      <section className="login-form-container max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-[#e2e8f0]">
        <div className="form-wrapper flex flex-col gap-6">
          
          <div className="top-badge flex items-center gap-1.5 w-fit bg-[#eef6ff] text-[#005684] px-3 py-1 rounded-full text-xs font-bold">
            <span>🔒</span> Seguridad & Recuperación 7:34 AM
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#071d37] tracking-tight">¿Olvidaste tu contraseña?</h1>
            <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de voluntario o fundación y te enviaremos un enlace cifrado para restablecer tus credenciales.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <div className="input-group flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#475569]">Correo electrónico institucional o personal</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.org" 
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-[#071d37] focus:outline-none focus:border-[#005684]"
                  required 
                />
              </div>
            </div>

            {mensaje && (
              <div className={`p-3 rounded-xl text-xs font-bold ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#005684] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-gray-100">
            <Link to="/login" className="text-xs font-bold text-[#005684] hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}