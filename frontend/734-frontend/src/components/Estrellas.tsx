import { Icon } from './Icon';

/** Calificación de 1 a 5 con estrellas de Lucide (rellenas hasta el valor) */
export function Estrellas({ valor, size = 14 }: { valor: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(valor)));
  return (
    <span className="inline-flex items-center gap-0.5 text-[#f59e0b]" role="img" aria-label={`${v} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Icon key={n} name="calificacion" size={size} filled={n <= v} className={n <= v ? '' : 'text-[#cbd5e1]'} />
      ))}
    </span>
  );
}
