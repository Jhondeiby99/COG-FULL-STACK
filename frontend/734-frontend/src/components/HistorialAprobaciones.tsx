import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import type { NombreIcono } from '../lib/iconos';
import { formatearFecha, type EventoHistorial, type TipoEvento } from '../lib/historialAprobaciones';

type Filtro = 'todos' | 'decisiones' | 'documentos' | 'solicitudes';

const ESTILO: Record<TipoEvento, { icono: NombreIcono; clase: string }> = {
  solicitud: { icono: 'formulario', clase: 'bg-[#eef6ff] text-[#0284c7]' },
  documento_verificado: { icono: 'auditoria', clase: 'bg-[#ecfdf5] text-[#059669]' },
  documento_observado: { icono: 'advertencia', clase: 'bg-[#fffbeb] text-[#b45309]' },
  aprobada: { icono: 'check', clase: 'bg-[#dcfce7] text-[#166534]' },
  rechazada: { icono: 'cerrar', clase: 'bg-[#fee2e2] text-[#b91c1c]' },
  inactiva: { icono: 'reloj', clase: 'bg-[#f1f5f9] text-[#475569]' },
};

const FILTROS: { id: Filtro; texto: string; tipos: TipoEvento[] | null }[] = [
  { id: 'todos', texto: 'Todo', tipos: null },
  { id: 'decisiones', texto: 'Decisiones', tipos: ['aprobada', 'rechazada', 'inactiva'] },
  { id: 'documentos', texto: 'Documentos', tipos: ['documento_verificado', 'documento_observado'] },
  { id: 'solicitudes', texto: 'Solicitudes', tipos: ['solicitud'] },
];

export function HistorialAprobaciones({ eventos, onClose, onDescargarActa, descargando }: {
  eventos: EventoHistorial[];
  onClose: () => void;
  onDescargarActa: () => void;
  descargando: boolean;
}) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const tipos = FILTROS.find(f => f.id === filtro)?.tipos;
    const q = busqueda.trim().toLowerCase();
    return eventos.filter(e =>
      (!tipos || tipos.includes(e.tipo)) &&
      (!q || e.fundacion.toLowerCase().includes(q) || e.nit.toLowerCase().includes(q))
    );
  }, [eventos, filtro, busqueda]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e2e8f0] flex flex-col max-h-[92vh]">
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-3">
          <div>
            <span className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">Comité de verificación</span>
            <h3 className="text-lg font-extrabold text-[#071d37] leading-tight">Historial general</h3>
            <p className="text-[11px] text-[#64748b]">{eventos.length} actuaciones registradas en la plataforma</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer shrink-0">
            <Icon name="cerrar" size={18} />
          </button>
        </div>

        <div className="px-6 pb-3 flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por fundación o NIT"
            className="flex-1 text-xs px-3 py-2 bg-[#f4f7fc] border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-[#005684]"
          />
          <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg overflow-x-auto">
            {FILTROS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${filtro === f.id ? 'bg-white text-[#005684] shadow-sm' : 'text-[#64748b] hover:text-[#071d37]'}`}
              >
                {f.texto}
              </button>
            ))}
          </div>
        </div>

        <ol className="px-6 pb-4 overflow-y-auto flex flex-col gap-2">
          {visibles.length === 0 ? (
            <li className="text-center text-xs text-[#64748b] py-10">No hay actuaciones que coincidan.</li>
          ) : (
            visibles.map((e, i) => (
              <li key={`${e.tipo}-${e.fundacionId}-${e.fecha}-${i}`} className="flex gap-3 items-start border border-[#f1f5f9] rounded-xl p-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ESTILO[e.tipo].clase}`}>
                  <Icon name={ESTILO[e.tipo].icono} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <Link to={`/fundacion/${e.fundacionId}`} className="text-[13px] font-extrabold text-[#071d37] hover:underline truncate">
                      {e.fundacion}
                    </Link>
                    <span className="text-[10px] text-[#94a3b8] whitespace-nowrap">{formatearFecha(e.fecha, true)}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 break-words">{e.detalle}</p>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    NIT {e.nit}{e.responsable ? ` · Por ${e.responsable}` : ''}
                  </p>
                </div>
              </li>
            ))
          )}
        </ol>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f1f5f9]">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-bold text-[#64748b] hover:bg-gray-100 rounded-xl cursor-pointer">
            Cerrar
          </button>
          <button
            type="button"
            onClick={onDescargarActa}
            disabled={descargando}
            className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Icon name="descargar" size={14} /> {descargando ? 'Preparando...' : 'Descargar acta'}
          </button>
        </div>
      </div>
    </div>
  );
}
