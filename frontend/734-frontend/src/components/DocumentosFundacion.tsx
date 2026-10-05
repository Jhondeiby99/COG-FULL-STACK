import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import {
  TIPOS_DOCUMENTO,
  MAX_DOCUMENTO_MB,
  FORMATOS_DOCUMENTO,
  eliminarDocumento,
  listarDocumentos,
  subirDocumento,
  urlTemporalDocumento,
  validarDocumento,
  revisarDocumento,
} from '../lib/documentos';
import type { DocumentoFundacion, EstadoRevision, TipoDocumento } from '../lib/documentos';

type Seleccion = Partial<Record<TipoDocumento, File>>;

interface DocumentosFundacionProps {
  /** Fundación dueña. Sin ella, el componente solo selecciona archivos (registro) y los entrega en `onSeleccion`. */
  fundacionId?: string | null;
  /** false = no permite subir ni borrar archivos */
  editable?: boolean;
  /** Modo administrador: lista de verificación para marcar cada documento como verificado o con observaciones */
  revision?: boolean;
  onSeleccion?: (archivos: Seleccion) => void;
  /** Se llama cuando cambia la cantidad de documentos cargados */
  onCambio?: (documentos: DocumentoFundacion[]) => void;
}

const ESTADO_UI: Record<EstadoRevision, { texto: string; chip: string; caja: string; icono: 'reloj' | 'verificado' | 'advertencia' }> = {
  pendiente: { texto: 'Pendiente de revisión', chip: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]', caja: 'border-[#fde68a] bg-[#fffdf5]', icono: 'reloj' },
  verificado: { texto: 'Verificado', chip: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]', caja: 'border-[#bbf7d0] bg-[#f0fdf4]', icono: 'verificado' },
  rechazado: { texto: 'Con observaciones', chip: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]', caja: 'border-[#fecaca] bg-[#fff7f7]', icono: 'advertencia' },
};

const formatoTamano = (bytes?: number | null) =>
  !bytes ? '' : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function DocumentosFundacion({ fundacionId, editable = true, revision = false, onSeleccion, onCambio }: DocumentosFundacionProps) {
  const modoSeleccion = !fundacionId;
  const [documentos, setDocumentos] = useState<DocumentoFundacion[]>([]);
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [cargando, setCargando] = useState(!modoSeleccion);
  const [ocupado, setOcupado] = useState<TipoDocumento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState<DocumentoFundacion | null>(null);
  // Documento al que el administrador le está escribiendo una observación
  const [observando, setObservando] = useState<{ id: string; nota: string } | null>(null);
  const inputs = useRef<Partial<Record<TipoDocumento, HTMLInputElement | null>>>({});

  const recargar = useCallback(async () => {
    if (!fundacionId) return;
    try {
      const docs = await listarDocumentos(fundacionId);
      setDocumentos(docs);
      onCambio?.(docs);
    } catch (e) {
      setError((e as { message?: string }).message || 'No se pudieron cargar los documentos.');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundacionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga/sincronización con Supabase al montar o al cambiar el parámetro
    recargar();
  }, [recargar]);

  const alElegirArchivo = async (tipo: TipoDocumento, file?: File) => {
    if (!file) return;
    setError(null);
    const invalido = validarDocumento(file);
    if (invalido) {
      setError(invalido);
      return;
    }
    if (modoSeleccion) {
      const nueva = { ...seleccion, [tipo]: file };
      setSeleccion(nueva);
      onSeleccion?.(nueva);
      return;
    }
    setOcupado(tipo);
    try {
      await subirDocumento(fundacionId as string, tipo, file);
      await recargar();
    } catch (e) {
      setError((e as { message?: string }).message || 'No se pudo subir el documento.');
    } finally {
      setOcupado(null);
    }
  };

  const quitarSeleccion = (tipo: TipoDocumento) => {
    const nueva = { ...seleccion };
    delete nueva[tipo];
    setSeleccion(nueva);
    onSeleccion?.(nueva);
  };

  const ver = async (doc: DocumentoFundacion) => {
    setError(null);
    // Se abre la pestaña antes del await para que el navegador no la bloquee como ventana emergente
    const pestana = window.open('', '_blank');
    try {
      const url = await urlTemporalDocumento(doc.ruta);
      if (pestana) pestana.location.replace(url);
      else window.location.assign(url);
    } catch (e) {
      pestana?.close();
      setError((e as { message?: string }).message || 'No se pudo abrir el documento.');
    }
  };

  const marcar = async (doc: DocumentoFundacion, estado: Exclude<EstadoRevision, 'pendiente'>, nota?: string) => {
    if (estado === 'rechazado' && !nota?.trim()) {
      setError('Escribe la observación para que la fundación sepa qué corregir.');
      return;
    }
    setError(null);
    setOcupado(doc.tipo);
    try {
      await revisarDocumento(doc.id, estado, nota);
      setObservando(null);
      await recargar();
    } catch (e) {
      setError((e as { message?: string }).message || 'No se pudo guardar la revisión.');
    } finally {
      setOcupado(null);
    }
  };

  const borrar = async () => {
    if (!confirmarBorrado) return;
    const doc = confirmarBorrado;
    setOcupado(doc.tipo);
    try {
      await eliminarDocumento(doc);
      await recargar();
      setConfirmarBorrado(null);
    } catch (e) {
      setError((e as { message?: string }).message || 'No se pudo eliminar el documento.');
      setConfirmarBorrado(null);
    } finally {
      setOcupado(null);
    }
  };

  const completos = modoSeleccion ? Object.keys(seleccion).length : documentos.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#64748b]">
          {editable
            ? `PDF o imagen (JPG, PNG, WEBP), máximo ${MAX_DOCUMENTO_MB}MB. Solo tu fundación y los administradores pueden verlos.`
            : 'Documentos legales cargados por la fundación. Los enlaces de visualización expiran a los 5 minutos.'}
        </p>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${completos === 3 ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fffbeb] text-[#b45309]'}`}>
          {completos}/3
        </span>
      </div>

      {cargando ? (
        <div className="py-6 flex justify-center text-[#005684]"><Icon name="cargando" size={20} className="animate-spin" /></div>
      ) : (
        TIPOS_DOCUMENTO.map(({ tipo, nombre, ayuda }) => {
          const doc = documentos.find(d => d.tipo === tipo);
          const archivo = seleccion[tipo];
          const presente = !!doc || !!archivo;
          const procesando = ocupado === tipo;
          const ui = doc ? ESTADO_UI[doc.estado_revision] : null;
          const verificacion = TIPOS_DOCUMENTO.find(t => t.tipo === tipo)!.verificacion;
          return (
            <div key={tipo} className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-3 ${ui ? ui.caja : archivo ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white ${doc?.estado_revision === 'verificado' ? 'text-[#059669]' : doc?.estado_revision === 'rechazado' ? 'text-[#dc2626]' : presente ? 'text-[#b45309]' : 'text-[#94a3b8]'}`}>
                <Icon name={ui ? ui.icono : archivo ? 'completado' : 'documento'} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-bold text-[#071d37]">{nombre}</p>
                  {ui && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ui.chip}`}>{ui.texto}</span>}
                </div>
                {doc ? (
                  <p className="text-[11px] text-[#475569] truncate">
                    {doc.nombre_archivo} · {formatoTamano(doc.tamano_bytes)} · {new Date(doc.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                ) : archivo ? (
                  <p className="text-[11px] text-[#475569] truncate">{archivo.name} · {formatoTamano(archivo.size)} · se subirá al registrarte</p>
                ) : (
                  <p className="text-[11px] text-[#94a3b8]">{editable ? ayuda : 'No ha sido cargado'}</p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {doc && (
                  <button type="button" onClick={() => ver(doc)} className="flex-1 sm:flex-none bg-white border border-[#bae6fd] text-[#0284c7] px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-[#f0f9ff] transition cursor-pointer inline-flex items-center justify-center gap-1">
                    <Icon name="ver" size={13} /> Ver
                  </button>
                )}
                {editable && (
                  <>
                    <input
                      ref={el => { inputs.current[tipo] = el; }}
                      type="file"
                      accept={FORMATOS_DOCUMENTO.join(',')}
                      className="hidden"
                      onChange={(e) => { alElegirArchivo(tipo, e.target.files?.[0]); e.target.value = ''; }}
                    />
                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => inputs.current[tipo]?.click()}
                      className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-60 ${presente ? 'bg-white border border-[#e2e8f0] text-[#334155] hover:bg-gray-50' : 'bg-[#005684] text-white hover:bg-[#00456a]'}`}
                    >
                      <Icon name={procesando ? 'cargando' : 'subir'} size={13} className={procesando ? 'animate-spin' : ''} />
                      {procesando ? 'Subiendo...' : presente ? 'Reemplazar' : 'Subir'}
                    </button>
                    {(doc || archivo) && (
                      <button
                        type="button"
                        disabled={procesando}
                        onClick={() => (doc ? setConfirmarBorrado(doc) : quitarSeleccion(tipo))}
                        aria-label={`Quitar ${nombre}`}
                        className="w-9 bg-white border border-[#fecaca] text-[#dc2626] rounded-lg hover:bg-[#fef2f2] transition cursor-pointer inline-flex items-center justify-center disabled:opacity-60"
                      >
                        <Icon name="eliminar" size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Observación del administrador (la ve la fundación para corregir) */}
            {doc?.estado_revision === 'rechazado' && doc.nota_revision && !revision && (
              <p className="text-[11px] text-[#b91c1c] bg-white border border-[#fecaca] rounded-lg px-3 py-2">
                <span className="font-bold">Observación:</span> {doc.nota_revision} Sube una versión corregida con “Reemplazar”.
              </p>
            )}

            {/* Lista de verificación del administrador */}
            {revision && doc && (
              <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex flex-col gap-2.5">
                <ul className="flex flex-col gap-1">
                  {verificacion.revisar.map(item => (
                    <li key={item} className="text-[11px] text-[#475569] flex items-start gap-1.5">
                      <Icon name="check" size={12} className="text-[#94a3b8] mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
                <a href={verificacion.enlace.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#0284c7] hover:underline inline-flex items-center gap-1 w-fit">
                  {verificacion.enlace.texto} <Icon name="externo" size={12} />
                </a>

                {doc.estado_revision !== 'pendiente' && doc.fecha_revision && (
                  <p className="text-[10px] text-[#94a3b8]">
                    Revisado el {new Date(doc.fecha_revision).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    {doc.nota_revision ? ` · “${doc.nota_revision}”` : ''}
                  </p>
                )}

                {observando?.id === doc.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      rows={2}
                      maxLength={300}
                      value={observando.nota}
                      onChange={(e) => setObservando({ id: doc.id, nota: e.target.value })}
                      placeholder="Ej: El certificado tiene más de 30 días, por favor sube uno reciente."
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#071d37] resize-none focus:outline-none focus:border-[#dc2626]"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setObservando(null)} disabled={procesando} className="flex-1 bg-gray-100 text-[#334155] py-2 rounded-lg text-[11px] font-bold hover:bg-gray-200 transition cursor-pointer">
                        Cancelar
                      </button>
                      <button type="button" onClick={() => marcar(doc, 'rechazado', observando.nota)} disabled={procesando || !observando.nota.trim()} className="flex-1 bg-[#dc2626] text-white py-2 rounded-lg text-[11px] font-bold hover:bg-[#b91c1c] transition cursor-pointer disabled:opacity-50">
                        {procesando ? 'Enviando...' : 'Enviar observación'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => marcar(doc, 'verificado')}
                      disabled={procesando || doc.estado_revision === 'verificado'}
                      className="flex-1 bg-[#059669] text-white py-2 rounded-lg text-[11px] font-bold hover:bg-[#047857] transition cursor-pointer disabled:opacity-50 disabled:cursor-default inline-flex items-center justify-center gap-1"
                    >
                      <Icon name="verificado" size={13} /> {doc.estado_revision === 'verificado' ? 'Verificado' : 'Marcar verificado'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setObservando({ id: doc.id, nota: doc.estado_revision === 'rechazado' ? doc.nota_revision || '' : '' })}
                      disabled={procesando}
                      className="flex-1 bg-white border border-[#fecaca] text-[#dc2626] py-2 rounded-lg text-[11px] font-bold hover:bg-[#fef2f2] transition cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Icon name="advertencia" size={13} /> Con problema
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          );
        })
      )}

      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-xl px-4 py-3 text-xs font-semibold flex items-start gap-2">
          <Icon name="advertencia" size={14} className="mt-0.5" /> {error}
        </div>
      )}

      {confirmarBorrado && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <span className="mb-3 text-[#dc2626]"><Icon name="eliminar" size={40} /></span>
            <h3 className="text-lg font-bold text-[#071d37] mb-2">Eliminar documento</h3>
            <p className="text-xs text-[#64748b] mb-6">
              Se eliminará “{confirmarBorrado.nombre_archivo}”. Tu documentación quedará incompleta hasta que subas uno nuevo.
            </p>
            <div className="flex w-full gap-3">
              <button type="button" onClick={() => setConfirmarBorrado(null)} disabled={!!ocupado} className="flex-1 bg-gray-100 text-[#334155] py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={borrar} disabled={!!ocupado} className="flex-1 bg-[#dc2626] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition cursor-pointer disabled:opacity-60">
                {ocupado ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
