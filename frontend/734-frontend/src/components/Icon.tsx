import type { LucideProps } from 'lucide-react';
import { ICONOS } from '../lib/iconos';
import type { NombreIcono } from '../lib/iconos';

interface IconProps extends Omit<LucideProps, 'ref'> {
  /** Concepto del registro central (lib/iconos.ts) */
  name: NombreIcono;
  /** Texto para lectores de pantalla; si se omite, el ícono es decorativo */
  label?: string;
  /** Rellena el ícono con el color actual (p. ej. estrellas de calificación) */
  filled?: boolean;
}

/**
 * Ícono único de la plataforma. El color se hereda del texto (`text-...`) y el tamaño
 * se controla con `size` o con clases (`size-4`). Trazo 1.75 como en los mockups.
 */
export function Icon({ name, label, filled = false, size = 16, strokeWidth = 1.75, className = '', ...rest }: IconProps) {
  const Componente = ICONOS[name];
  return (
    <Componente
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      size={size}
      strokeWidth={strokeWidth}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      {...rest}
    />
  );
}
