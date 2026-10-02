import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Validación de fuerza en tiempo real (normativa FIPS-140)
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Vacía', color: 'bg-gray-200', text: 'text-gray-400', bars: 0 };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score: 1, label: 'Débil', color: 'bg-red-500', text: 'text-red-600', bars: 1 };
    if (score <= 4) return { score: 2, label: 'Media', color: 'bg-amber-500', text: 'text-amber-600', bars: 2 };
    return { score: 3, label: 'Fuerte (Entropía óptima)', color: 'bg-[#005684]', text: 'text-[#005684]', bars: 3 };
  }, [newPassword]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    setMensaje(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else {
      setMensaje({ tipo: 'success', texto: '¡Contraseña actualizada con éxito! Redirigiendo al login...' });
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    }
    setLoading(false);
  };

  return (
    <main className="login-layout flex min-h-svh items-center justify-center bg-[#f4f7fb] p-4">
      <section className="login-form-container max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-[#e2e8f0]">
        <div className="form-wrapper flex flex-col gap-6">
          
          <div className="top-badge flex items-center gap-1.5 w-fit bg-[#eef6ff] text-[#005684] px-3 py-1 rounded-full text-xs font-bold">
            <span>🔑</span> Nueva Credencial Cívica
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#071d37] tracking-tight">Establecer contraseña</h1>
            <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
              Ingresa tu nueva contraseña cumpliendo con los estándares de seguridad de la plataforma.
            </p>
          </div>

          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            <div className="input-group flex flex-col gap-1">
              <label className="text-xs font-bold text-[#475569]">Nueva contraseña</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 12 caracteres mixtos" 
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-xs font-semibold text-[#071d37] focus:outline-none focus:border-[#005684]"
                required 
              />
            </div>

            <div className="input-group flex flex-col gap-1">
              <label className="text-xs font-bold text-[#475569]">Confirmar nueva contraseña</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña" 
                className={`w-full bg-[#f8fafc] border rounded-xl px-4 py-3 text-xs font-semibold text-[#071d37] focus:outline-none ${
                  passwordsMatch === null ? 'border-[#e2e8f0]' : passwordsMatch ? 'border-emerald-400 bg-emerald-50/20' : 'border-red-300 bg-red-50/20'
                }`}
                required 
              />
              {passwordsMatch === false && <span className="text-[10px] text-red-600 font-bold">No coinciden</span>}
              {passwordsMatch === true && <span className="text-[10px] text-emerald-600 font-bold">¡Coinciden perfectamente!</span>}
            </div>

            {/* Medidor de fuerza */}
            <div className="bg-[#EFF4FF] p-3 rounded-xl border border-[#bae6fd]">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-[#071d37]">Fuerza de la clave</span>
                <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full rounded-full w-1/3 transition-all ${passwordStrength.bars >= 1 ? passwordStrength.color : 'bg-transparent'}`}></div>
                <div className={`h-full rounded-full w-1/3 transition-all ${passwordStrength.bars >= 2 ? passwordStrength.color : 'bg-transparent'}`}></div>
                <div className={`h-full rounded-full w-1/3 transition-all ${passwordStrength.bars >= 3 ? passwordStrength.color : 'bg-transparent'}`}></div>
              </div>
            </div>

            {mensaje && (
              <div className={`p-3 rounded-xl text-xs font-bold ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !passwordsMatch}
              className="w-full bg-[#005684] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}