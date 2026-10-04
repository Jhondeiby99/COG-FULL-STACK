import { Icon } from './Icon';
import type { NombreIcono } from '../lib/iconos';

interface DialogModalProps {
  title: string;
  message: string;
  /** 'error' y 'exito' muestran un aviso; 'confirmar' pide confirmación con dos botones */
  variant?: 'error' | 'exito' | 'info' | 'confirmar';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Color del botón de confirmación (p. ej. rojo para acciones destructivas) */
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const ICONOS: Record<NonNullable<DialogModalProps['variant']>, { nombre: NombreIcono; color: string }> = {
  error: { nombre: 'advertencia', color: 'text-[#dc2626]' },
  exito: { nombre: 'completado', color: 'text-[#059669]' },
  info: { nombre: 'info', color: 'text-[#0284c7]' },
  confirmar: { nombre: 'ayuda', color: 'text-[#005684]' },
};

/** Modal estándar de la plataforma para reemplazar alert() y confirm() */
export function DialogModal({
  title,
  message,
  variant = 'error',
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onClose,
  onConfirm,
}: DialogModalProps) {
  const esConfirmacion = variant === 'confirmar';
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
        <span className={`mb-3 ${ICONOS[variant].color}`}><Icon name={ICONOS[variant].nombre} size={40} /></span>
        <h3 className="text-lg font-bold text-[#071d37] mb-2">{title}</h3>
        <p className="text-xs text-[#64748b] mb-6 whitespace-pre-line">{message}</p>
        {esConfirmacion ? (
          <div className="flex w-full gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 text-[#334155] py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50">
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60 ${danger ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 'bg-[#005684] hover:bg-[#00456a]'}`}
            >
              {loading ? 'Procesando...' : confirmLabel || 'Confirmar'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={onClose} className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
            {confirmLabel || 'Entendido'}
          </button>
        )}
      </div>
    </div>
  );
}
