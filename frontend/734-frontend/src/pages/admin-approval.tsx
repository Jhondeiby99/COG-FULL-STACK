import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DialogModal } from '../components/DialogModal';

import { Icon } from '../components/Icon';
interface Fundacion {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad?: string | null;
  ubicacion?: string | null;
  area_enfoque?: string | null;
  fecha_solicitud?: string | null;
  coordinador?: string | null;
  estado?: string | null;
  fecha_aprobacion?: string | null;
  aprobado_por_nombre?: string | null;
  documentos_lista?: string[] | null;
}

export function AdminApproval() {
  const [aviso, setAviso] = useState<{ title: string; message: string } | null>(null);
  const [rechazoPendiente, setRechazoPendiente] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'pendientes' | 'aprobadas'>('pendientes');
  const [pendientes, setPendientes] = useState<Fundacion[]>([]);
  const [aprobadas, setAprobadas] = useState<Fundacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Carga en paralelo de pendientes y aprobadas desde Supabase
      const [{ data: dbPendientes }, { data: dbAprobadas }] = await Promise.all([
        supabase
          .from('fundaciones')
          .select('*')
          .or('estado.eq.pendiente,estado.is.null')
          .order('fecha_solicitud', { ascending: false }),
        supabase
          .from('fundaciones')
          .select('*')
          .eq('estado', 'aprobada')
          .order('fecha_aprobacion', { ascending: false })
      ]);

      // Nombre real del administrador que aprobó cada fundación
      const idsAprobadores = [...new Set((dbAprobadas || []).map(f => f.aprobado_por).filter(Boolean))];
      const nombres = new Map<string, string>();
      if (idsAprobadores.length) {
        const { data: admins } = await supabase.from('administradores').select('id, nombre_completo').in('id', idsAprobadores);
        (admins || []).forEach(a => nombres.set(a.id, a.nombre_completo));
      }

      setPendientes(dbPendientes || []);
      setAprobadas((dbAprobadas || []).map(f => ({ ...f, aprobado_por_nombre: f.aprobado_por ? nombres.get(f.aprobado_por) || null : null })));
    } catch (error) {
      console.error('Error al cargar fundaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aprobar Fundación en Supabase
  const handleAprobar = async (id: string) => {
    setProcessingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase
        .from('fundaciones')
        .update({
          estado: 'aprobada',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: session?.user?.id || null
        })
        .eq('id', id);

      if (error) {
        setAviso({ title: 'No se pudo aprobar', message: 'Error al aprobar la fundación: ' + error.message });
      } else {
        await cargarDatos();
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setAviso({ title: 'Error de conexión', message: 'No se pudo contactar al servidor. Intenta de nuevo.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Rechazar Fundación en Supabase (se confirma primero en un modal)
  const handleRechazar = (id: string) => setRechazoPendiente(id);

  const ejecutarRechazo = async () => {
    const id = rechazoPendiente;
    if (!id) return;
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('fundaciones')
        .update({ estado: 'rechazada' })
        .eq('id', id);

      if (error) {
        setAviso({ title: 'No se pudo rechazar', message: 'Error al rechazar la fundación: ' + error.message });
      } else {
        await cargarDatos();
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setAviso({ title: 'Error de conexión', message: 'No se pudo contactar al servidor. Intenta de nuevo.' });
    } finally {
      setProcessingId(null);
      setRechazoPendiente(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'FN';
    const words = name.trim().split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatFecha = (fechaStr?: string | null, fallback: string = 'Reciente') => {
    if (!fechaStr) return fallback;
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return fechaStr;
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#005684] font-bold flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando solicitudes desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rechazoPendiente && (
        <DialogModal
          variant="confirmar"
          danger
          title="Rechazar solicitud"
          message="La fundación quedará como rechazada y no será visible en la plataforma. ¿Deseas continuar?"
          confirmLabel="Sí, rechazar"
          loading={processingId === rechazoPendiente}
          onClose={() => setRechazoPendiente(null)}
          onConfirm={ejecutarRechazo}
        />
      )}
      {aviso && <DialogModal title={aviso.title} message={aviso.message} onClose={() => setAviso(null)} />}

      
      {/* CABECERA PRINCIPAL SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#eef6ff] text-[#005684] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              COMITÉ DE VERIFICACIÓN
            </span>
            <span className="text-[11px] text-[#64748b]">• Flujo Oficial 7:34 AM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-1 leading-tight">
            Gestión de Aprobaciones
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1.5 max-w-2xl">
            Revisa y autoriza las solicitudes de ingreso de fundaciones a la plataforma comunitaria 7:34 AM con total transparencia y rapidez.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm cursor-pointer">
            <span><Icon name="reloj" size="1.1em" /></span> Historial General
          </button>
          <button className="bg-[#eef6ff] text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-2 border border-[#dbeafe] cursor-pointer">
            <span><Icon name="descargar" size="1.1em" /></span> Descargar Acta
          </button>
        </div>
      </div>

      {/* TABS (Pendientes / Aprobadas) */}
      <div className="flex gap-4">
        <button 
          onClick={() => setTabActiva('pendientes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold transition shadow-sm border cursor-pointer ${
            tabActiva === 'pendientes' 
              ? 'bg-white border-[#e2e8f0] text-[#071d37]' 
              : 'bg-transparent border-transparent text-[#64748b] hover:bg-white/50'
          }`}
        >
          <span><Icon name="necesidad" size="1.1em" /></span> Pendientes por Aprobar
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${tabActiva === 'pendientes' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
            {pendientes.length}
          </span>
        </button>
        <button 
          onClick={() => setTabActiva('aprobadas')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold transition shadow-sm border cursor-pointer ${
            tabActiva === 'aprobadas' 
              ? 'bg-white border-[#e2e8f0] text-[#071d37]' 
              : 'bg-transparent border-transparent text-[#64748b] hover:bg-white/50'
          }`}
        >
          <span><Icon name="check" size="1.1em" /></span> Fundaciones Aprobadas
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${tabActiva === 'aprobadas' ? 'bg-[#e2e8f0] text-[#475569]' : 'bg-gray-200 text-gray-600'}`}>
            {aprobadas.length}
          </span>
        </button>
      </div>

      {/* MENSAJE DE INFORMACIÓN */}
      {tabActiva === 'pendientes' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#0284c7] font-bold"><Icon name="info" size="1.1em" /></span>
            <p className="text-[11px] text-[#475569]">Hay <span className="font-bold text-[#071d37]">{pendientes.length} solicitudes</span> que requieren dictamen para habilitar sus convocatorias de voluntariado matutino.</p>
          </div>
          <span className="text-[11px] text-[#64748b] hidden sm:block">Tiempo promedio de respuesta: 4.2 h</span>
        </div>
      )}

      {/* LISTA DE PENDIENTES */}
      {tabActiva === 'pendientes' && (
        <div className="flex flex-col gap-4">
          {pendientes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-sm">
              <p className="text-sm font-bold text-[#059669]"><Icon name="celebracion" size="1.1em" /> ¡Excelente! No hay solicitudes pendientes por aprobar en la base de datos.</p>
            </div>
          ) : (
            pendientes.map((fund, idx) => (
              <div key={fund.id} className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex gap-4 items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                    idx % 3 === 0 ? 'bg-[#e0f2fe] text-[#0284c7]' :
                    idx % 3 === 1 ? 'bg-[#ede9fe] text-[#7c3aed]' :
                    'bg-[#dcfce7] text-[#166534]'
                  }`}>
                    {getInitials(fund.nombre_legal)}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-extrabold text-[#071d37]">{fund.nombre_legal}</h3>
                      <span className="bg-[#f1f5f9] text-[#475569] text-[9px] font-bold px-2 py-0.5 rounded-md">
                        {fund.area_enfoque || 'Comedores e Infancia'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] text-[#64748b]">
                        {formatFecha(fund.fecha_solicitud, 'Recibido recientemente')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#475569] mb-3">
                      <span><span className="font-semibold">NIT:</span> {fund.nit}</span>
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <span>{fund.ciudad || fund.ubicacion || 'Bogotá D.C.'}</span>
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <span><span className="font-semibold">Coord:</span> {fund.coordinador || 'Dra. Patricia Alarcón'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Icon name="check" size="1.1em" /> RUT 2025
                      </span>
                      <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Icon name="check" size="1.1em" /> {idx % 2 === 0 ? 'Estados Financieros' : 'Cámara de Comercio'}
                      </span>
                      <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Icon name="check" size="1.1em" /> {idx % 2 === 0 ? 'Antecedentes Representante' : 'Personería Jurídica'}
                      </span>
                      <span className="text-[10px] text-[#94a3b8] flex items-center gap-1 mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto">
                        <Icon name="documento" size="1.1em" /> Archivos PDF Adjuntos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-[#e2e8f0] pt-4 md:pt-0 md:pl-6">
                   <button className="bg-[#e2e8f0] text-[#334155] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#cbd5e1] transition w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer">
                     <span><Icon name="ver" size="1.1em" /></span> Inspeccionar
                   </button>
                   <button 
                     onClick={() => handleRechazar(fund.id)}
                     disabled={processingId === fund.id}
                     className="text-red-600 font-bold text-xs hover:underline w-full sm:w-auto text-center order-last sm:order-none mt-2 sm:mt-0 cursor-pointer disabled:opacity-50"
                   >
                     Rechazar
                   </button>
                   <button 
                     onClick={() => handleAprobar(fund.id)}
                     disabled={processingId === fund.id}
                     className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                   >
                     {processingId === fund.id ? (
                       <span>Cargando...</span>
                     ) : (
                       <>
                         <span><Icon name="check" size="1.1em" /></span> Aprobar Fundación
                       </>
                     )}
                   </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* SECCIÓN DE APROBADAS */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-extrabold text-[#071d37]">Fundaciones Recientemente Aprobadas</h2>
          <span className="bg-[#86efac] text-[#166534] text-[10px] font-bold px-2 py-0.5 rounded-full">Últimos registros</span>
        </div>
        <button className="text-[11px] font-bold text-[#005684] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap">
          Ver todas ({aprobadas.length}) →
        </button>
      </div>

      <div className="flex flex-col gap-0 border border-[#e2e8f0] rounded-2xl bg-white overflow-hidden shadow-sm">
        {aprobadas.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748b]">
            No hay fundaciones aprobadas registradas aún.
          </div>
        ) : (
          aprobadas.map((fund, index) => (
            <div key={fund.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 ${index !== aprobadas.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}>
               
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    index % 3 === 0 ? 'bg-[#a7f3d0] text-[#065f46]' :
                    index % 3 === 1 ? 'bg-[#bae6fd] text-[#0369a1]' :
                    'bg-[#ddd6fe] text-[#5b21b6]'
                  }`}>
                    {getInitials(fund.nombre_legal)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-extrabold text-[#071d37]">{fund.nombre_legal}</h4>
                      <span className="bg-[#bbf7d0] text-[#166534] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Icon name="check" size="1.1em" /> Aprobada</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      NIT: {fund.nit} • {fund.ciudad || fund.ubicacion || 'Colombia'}
                    </p>
                  </div>
               </div>

               <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-semibold text-[#071d37]">Aprobado por {fund.aprobado_por_nombre || 'un administrador'}</p>
                    <p className="text-[10px] text-[#64748b]">{formatFecha(fund.fecha_aprobacion, 'Fecha no registrada')}</p>
                  </div>
                  <Link
                    to={`/fundacion/${fund.id}`}
                    className="bg-[#f1f5f9] text-[#475569] px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#e2e8f0] transition shrink-0 inline-flex items-center gap-1"
                  >
                    Ver Ficha <Icon name="externo" size={12} />
                  </Link>
               </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}