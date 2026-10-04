import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { Icon } from './Icon';
import { Estrellas } from './Estrellas';
interface RatingFormProps {
  /** Perfil que se califica: exactamente uno de los dos */
  fundacionId?: string;
  voluntarioId?: string;
  /** Se llama después de publicar, editar o eliminar para recargar la lista */
  onChange: () => void;
}

interface ResenaPropia {
  id: string;
  rating: number;
  texto_comentario: string;
}

const MIN_COMENTARIO = 10;
const MAX_COMENTARIO = 500;
const ETIQUETAS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

export function RatingForm({ fundacionId, voluntarioId, onChange }: RatingFormProps) {
  const perfilId = fundacionId || voluntarioId || '';
  const columna = fundacionId ? 'fundacion_id' : 'voluntario_id';

  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [propia, setPropia] = useState<ResenaPropia | null>(null);
  const [editando, setEditando] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [modal, setModal] = useState<{ title: string; message: string; isError: boolean } | null>(null);

  const cargarPropia = async (uid: string) => {
    const { data } = await supabase
      .from('resenas')
      .select('id, rating, texto_comentario')
      .eq(columna, perfilId)
      .eq('autor_id', uid)
      .maybeSingle();
    setPropia(data as ResenaPropia | null);
    setEditando(false);
  };

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!activo) return;
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid && perfilId) await cargarPropia(uid);
      if (activo) setCargando(false);
    })();
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilId]);

  const iniciarEdicion = (r: ResenaPropia | null) => {
    setRating(r?.rating ?? 0);
    setComentario(r?.texto_comentario ?? '');
    setIntento(false);
    setHover(0);
    setEditando(true);
  };

  const comentarioLimpio = comentario.trim();
  const errorRating = rating < 1 ? 'Selecciona de 1 a 5 estrellas.' : null;
  const errorComentario = comentarioLimpio.length < MIN_COMENTARIO
    ? `Escribe al menos ${MIN_COMENTARIO} caracteres.`
    : null;
  const sinCambios = !!propia && propia.rating === rating && propia.texto_comentario.trim() === comentarioLimpio;

  const guardar = async () => {
    setIntento(true);
    if (errorRating || errorComentario || sinCambios || !userId) return;
    setGuardando(true);
    try {
      const { error } = propia
        ? await supabase.from('resenas').update({ rating, texto_comentario: comentarioLimpio }).eq('id', propia.id)
        : await supabase.from('resenas').insert([{ [columna]: perfilId, rating, texto_comentario: comentarioLimpio }]);
      if (error) throw error;
      await cargarPropia(userId);
      onChange();
      setModal({ title: propia ? 'Calificación actualizada' : '¡Gracias por tu calificación!', message: 'Tu opinión ya es visible en este perfil.', isError: false });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const msg = err.code === '23505'
        ? 'Ya calificaste este perfil. Puedes editar tu calificación existente.'
        : err.message || 'Error de conexión. Intenta de nuevo.';
      setModal({ title: 'No se pudo guardar', message: msg, isError: true });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!propia || !userId) return;
    setGuardando(true);
    const { error } = await supabase.from('resenas').delete().eq('id', propia.id);
    setGuardando(false);
    setConfirmarEliminar(false);
    if (error) {
      setModal({ title: 'No se pudo eliminar', message: error.message, isError: true });
      return;
    }
    await cargarPropia(userId);
    onChange();
  };

  if (cargando || !perfilId) return null;

  const contenedor = 'rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5';

  let contenido;
  if (!userId) {
    contenido = (
      <div className={`${contenedor} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <p className="text-[13px] text-[#64748b]">
          <span className="font-bold text-[#0f2a3f]">¿Has trabajado con este perfil?</span> Inicia sesión para dejar tu calificación.
        </p>
        <Link to="/login" className="shrink-0 text-center bg-[#005684] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition">
          Iniciar sesión
        </Link>
      </div>
    );
  } else if (userId === perfilId) {
    contenido = (
      <div className={contenedor}>
        <p className="text-[13px] text-[#64748b]">Así ven los demás las calificaciones de tu perfil. No puedes calificarte a ti mismo.</p>
      </div>
    );
  } else if (!editando && propia) {
    contenido = (
      <div className={`${contenedor} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#005684] uppercase tracking-wide">Tu calificación</p>
          <div className="mt-1"><Estrellas valor={propia.rating} /></div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => iniciarEdicion(propia)} className="flex-1 sm:flex-none bg-white border border-[#bae6fd] text-[#0284c7] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#f0f9ff] transition cursor-pointer">
            Editar
          </button>
          <button type="button" onClick={() => setConfirmarEliminar(true)} className="flex-1 sm:flex-none bg-white border border-[#fecaca] text-[#dc2626] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#fef2f2] transition cursor-pointer">
            Eliminar
          </button>
        </div>
      </div>
    );
  } else if (!editando) {
    contenido = (
      <div className={`${contenedor} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <p className="text-[13px] text-[#64748b]">
          <span className="font-bold text-[#0f2a3f]">Comparte tu experiencia.</span> Tu calificación ayuda a otros a decidir con confianza.
        </p>
        <button type="button" onClick={() => iniciarEdicion(null)} className="shrink-0 bg-[#005684] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
          <Icon name="calificacion" size="1.1em" filled /> Calificar
        </button>
      </div>
    );
  } else {
    const visible = hover || rating;
    contenido = (
      <div className={`${contenedor} flex flex-col gap-4`}>
        <div>
          <p className="text-xs font-bold text-[#0f2a3f] mb-1.5">{propia ? 'Editar tu calificación' : 'Tu calificación'}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className={`text-3xl leading-none px-0.5 transition cursor-pointer ${n <= visible ? 'text-[#f59e0b]' : 'text-[#cbd5e1]'}`}
                >
                  <Icon name="calificacion" size="1.1em" filled />
                </button>
              ))}
            </div>
            {visible > 0 && <span className="text-xs font-bold text-[#64748b]">{ETIQUETAS[visible]}</span>}
          </div>
          {intento && errorRating && <p className="text-[11px] text-[#dc2626] mt-1">{errorRating}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0f2a3f]">Comentario</label>
            <span className="text-[10px] text-[#94a3b8]">{comentario.length}/{MAX_COMENTARIO}</span>
          </div>
          <textarea
            value={comentario}
            maxLength={MAX_COMENTARIO}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder="Cuéntanos cómo fue tu experiencia."
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#0f2a3f] resize-none focus:outline-none focus:ring-1 ${intento && errorComentario ? 'border-[#fca5a5] focus:ring-[#dc2626]' : 'border-[#e2e8f0] focus:border-[#005684] focus:ring-[#005684]'}`}
          />
          {intento && errorComentario && <p className="text-[11px] text-[#dc2626]">{errorComentario}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={() => setEditando(false)} disabled={guardando} className="bg-white border border-[#e2e8f0] text-[#334155] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando || sinCambios} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {guardando ? 'Guardando...' : propia ? 'Guardar cambios' : 'Publicar calificación'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {contenido}

      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3"><Icon name="eliminar" size="1.1em" /></span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">Eliminar calificación</h3>
            <p className="text-xs text-[#64748b] mb-6">Tu calificación dejará de mostrarse en este perfil. ¿Deseas continuar?</p>
            <div className="flex w-full gap-3">
              <button type="button" onClick={() => setConfirmarEliminar(false)} disabled={guardando} className="flex-1 bg-gray-100 text-[#334155] py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={eliminar} disabled={guardando} className="flex-1 bg-[#dc2626] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition cursor-pointer disabled:opacity-60">
                {guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="text-4xl mb-3"><Icon name={modal.isError ? 'advertencia' : 'completado'} size={40} className={modal.isError ? 'text-[#dc2626]' : 'text-[#059669]'} /></span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">{modal.title}</h3>
            <p className="text-xs text-[#64748b] mb-6">{modal.message}</p>
            <button type="button" onClick={() => setModal(null)} className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
