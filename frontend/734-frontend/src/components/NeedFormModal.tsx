import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { actualizarNecesidad, porcentajeRecaudo, CATEGORIAS_NECESIDAD, PRIORIDAD_ESTILOS } from '../lib/necesidades';
import type { Necesidad, PrioridadNecesidad } from '../lib/necesidades';

import { Icon } from './Icon';
const MAX_TITULO = 90;
const MAX_DESCRIPCION = 400;

interface Valores {
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: PrioridadNecesidad;
  meta_texto: string;
  porcentaje: number;
}

interface NeedFormModalProps {
  /** Fundación dueña; si se omite al crear, se muestra un selector con `opcionesFundacion` */
  fundacionId?: string | null;
  opcionesFundacion?: { id: string; nombre: string }[];
  /** Si se pasa, el formulario edita esa necesidad; si no, crea una nueva */
  necesidad?: Necesidad | null;
  onClose: () => void;
  onSaved: (necesidad: Necesidad, esNueva: boolean) => void;
}

/** Formulario único para crear o editar necesidades (editor de perfil y pantalla de gestión) */
export function NeedFormModal({ fundacionId, opcionesFundacion, necesidad, onClose, onSaved }: NeedFormModalProps) {
  const pedirFundacion = !necesidad && !fundacionId && !!opcionesFundacion;
  const [fundacionSel, setFundacionSel] = useState('');
  const [original] = useState<Valores>(() => ({
    titulo: necesidad?.titulo || '',
    descripcion: necesidad?.descripcion || '',
    categoria: necesidad?.categoria || '',
    prioridad: (necesidad?.prioridad as PrioridadNecesidad) || 'media',
    meta_texto: necesidad?.meta_texto || '',
    porcentaje: necesidad ? porcentajeRecaudo(necesidad) : 0,
  }));
  const [form, setForm] = useState<Valores>(original);
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!necesidad;
  const errorTitulo = form.titulo.trim().length < 4 ? 'Escribe un título de al menos 4 caracteres.' : null;
  const destino = necesidad?.fundacion_id || fundacionId || fundacionSel;
  const errorFundacion = pedirFundacion && !fundacionSel ? 'Selecciona la fundación a la que pertenece la necesidad.' : null;
  const sinCambios = esEdicion && JSON.stringify(form) === JSON.stringify(original);

  const guardar = async () => {
    setIntento(true);
    if (errorTitulo || errorFundacion || sinCambios || !destino) return;
    setGuardando(true);
    setError(null);
    const datos = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria || null,
      prioridad: form.prioridad,
      meta_texto: form.meta_texto.trim() || null,
      porcentaje_recaudado: form.porcentaje,
    };
    try {
      if (necesidad) {
        onSaved(await actualizarNecesidad(necesidad.id, datos), false);
      } else {
        const { data, error: err } = await supabase
          .from('necesidades')
          .insert([{ ...datos, fundacion_id: destino, completada: false }])
          .select();
        if (err) throw err;
        if (!data?.length) throw new Error('No tienes permisos para publicar necesidades en esta fundación.');
        onSaved(data[0] as Necesidad, true);
      }
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
      setGuardando(false);
    }
  };

  const campo = 'w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#071d37] focus:outline-none focus:border-[#005684] focus:ring-1 focus:ring-[#005684]';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e2e8f0] flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h3 className="text-lg font-extrabold text-[#071d37]">{esEdicion ? 'Editar necesidad' : 'Nueva necesidad'}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"><Icon name="cerrar" size="1.1em" /></button>
        </div>

        <div className="px-6 pb-2 flex flex-col gap-4 overflow-y-auto">
          {pedirFundacion && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#071d37]">Fundación *</label>
              <select
                value={fundacionSel}
                onChange={(e) => setFundacionSel(e.target.value)}
                className={`${campo} px-3 cursor-pointer ${intento && errorFundacion ? '!border-[#fca5a5]' : ''}`}
              >
                <option value="">Selecciona una fundación...</option>
                {opcionesFundacion?.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
              {intento && errorFundacion && <p className="text-[11px] text-[#dc2626]">{errorFundacion}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-[#071d37]">Título *</label>
              <span className="text-[10px] text-[#94a3b8]">{form.titulo.length}/{MAX_TITULO}</span>
            </div>
            <input
              type="text"
              value={form.titulo}
              maxLength={MAX_TITULO}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Mercados para 40 familias"
              className={`${campo} ${intento && errorTitulo ? '!border-[#fca5a5] focus:!ring-[#dc2626]' : ''}`}
            />
            {intento && errorTitulo && <p className="text-[11px] text-[#dc2626]">{errorTitulo}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-[#071d37]">Descripción</label>
              <span className="text-[10px] text-[#94a3b8]">{form.descripcion.length}/{MAX_DESCRIPCION}</span>
            </div>
            <textarea
              rows={3}
              value={form.descripcion}
              maxLength={MAX_DESCRIPCION}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Explica para qué es y cómo se puede ayudar."
              className={`${campo} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#071d37]">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={`${campo} px-3 cursor-pointer`}>
                <option value="">General</option>
                {[...new Set([...CATEGORIAS_NECESIDAD, ...(form.categoria ? [form.categoria] : [])])].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#071d37]">Meta</label>
              <input type="text" value={form.meta_texto} maxLength={80} onChange={(e) => setForm({ ...form, meta_texto: e.target.value })} placeholder="Ej: 40 mercados" className={campo} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#071d37]">Prioridad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['alta', 'media', 'baja'] as PrioridadNecesidad[]).map(pr => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setForm({ ...form, prioridad: pr })}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${form.prioridad === pr ? `${PRIORIDAD_ESTILOS[pr].chip} ring-2 ring-offset-1 ring-current` : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'}`}
                >
                  {pr.charAt(0).toUpperCase() + pr.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#071d37]">Avance de recaudo</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.porcentaje}
                  onChange={(e) => setForm({ ...form, porcentaje: Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
                  className="w-16 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2 py-1 text-xs font-bold text-right text-[#071d37] focus:outline-none focus:border-[#005684]"
                />
                <span className="text-xs font-bold text-[#64748b]">%</span>
              </div>
            </div>
            <input type="range" min={0} max={100} step={5} value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: Number(e.target.value) })} className="w-full accent-[#005684] cursor-pointer" />
            <p className="text-[10px] text-[#94a3b8]">Indica cuánto de la meta ya se ha cubierto. Para cerrarla al 100% usa “Marcar como resuelta”.</p>
          </div>

          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-xl px-4 py-3 text-xs font-semibold">
              <Icon name="advertencia" size="1.1em" /> {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-5 border-t border-[#f1f5f9] mt-2">
          <button type="button" onClick={onClose} disabled={guardando} className="bg-gray-100 text-[#334155] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando || sinCambios} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Publicar necesidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
