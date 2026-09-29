import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// import * as Icons from "../assets/icons/index.ts"; // Descomenta si usas iconos locales

interface FundacionPendiente {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad: string;
  area_enfoque: string;
  fecha_solicitud: string;
  coordinador: string;
}

interface FundacionAprobada {
  id: string;
  nombre_legal: string;
  nit: string;
  ciudad: string;
  fecha_aprobacion: string;
  aprobado_por_nombre: string;
}

export function AdminApproval() {
  const [tabActiva, setTabActiva] = useState<'pendientes' | 'aprobadas'>('pendientes');
  const [pendientes, setPendientes] = useState<FundacionPendiente[]>([]);
  const [aprobadas, setAprobadas] = useState<FundacionAprobada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDatos() {
      setLoading(true);
      
      // Simulación de datos para igualar el mockup visualmente
      const mockPendientes: FundacionPendiente[] = [
        { id: '1', nombre_legal: 'Fundación Pies Cálidos', nit: '901.442.891-3', ciudad: 'Bogotá D.C., Kennedy', area_enfoque: 'Comedores e Infancia', fecha_solicitud: 'Recibido hace 2 horas', coordinador: 'Dra. Patricia Alarcón' },
        { id: '2', nombre_legal: 'Asociación Sueños Vivos', nit: '830.119.504-1', ciudad: 'Medellín, Comuna 13', area_enfoque: 'Refuerzo Escolar y Arte', fecha_solicitud: 'Recibido hace 5 horas', coordinador: 'Lic. Mario Restrepo' },
        { id: '3', nombre_legal: 'Red Comunitaria del Sur', nit: '900.782.310-8', ciudad: 'Cali, Valle del Cauca', area_enfoque: 'Adulto Mayor y Salud', fecha_solicitud: 'Recibido ayer • 18:40', coordinador: 'Clara Inés Prado' },
      ];

      const mockAprobadas: FundacionAprobada[] = [
        { id: '10', nombre_legal: 'Semillas del Futuro', nit: '900.221.780-4', ciudad: 'Barranquilla, Atlántico', fecha_aprobacion: 'Hoy • 06:15 AM', aprobado_por_nombre: 'Elena R.' },
        { id: '11', nombre_legal: 'Alianza Hábitat Digno', nit: '860.334.901-5', ciudad: 'Manizales, Caldas', fecha_aprobacion: 'Ayer • 16:30 PM', aprobado_por_nombre: 'Elena R.' },
        { id: '12', nombre_legal: 'Voces del Bosque Nativo', nit: '901.092.112-9', ciudad: 'Bucaramanga, Santander', fecha_aprobacion: '13 Oct 2025 • 11:20 AM', aprobado_por_nombre: 'Camilo T.' },
      ];

      setPendientes(mockPendientes);
      setAprobadas(mockAprobadas);
      setLoading(false);
    }

    fetchDatos();
  }, []);

  const handleAprobar = (id: string) => {
    setPendientes(pendientes.filter(f => f.id !== id));
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="p-8 text-center text-[#005684] font-bold">Cargando solicitudes...</div>;

  return (
    <div className="flex flex-col gap-6">
      
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
            <span>⏱️</span> Historial General
          </button>
          <button className="bg-[#eef6ff] text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d4e7fe] transition flex items-center gap-2 border border-[#dbeafe] cursor-pointer">
            <span>📥</span> Descargar Acta
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
          <span>📋</span> Pendientes por Aprobar
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
          <span>✓</span> Fundaciones Aprobadas
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${tabActiva === 'aprobadas' ? 'bg-[#e2e8f0] text-[#475569]' : 'bg-gray-200 text-gray-600'}`}>
            139
          </span>
        </button>
      </div>

      {/* MENSAJE DE INFORMACIÓN */}
      {tabActiva === 'pendientes' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#0284c7] font-bold">ℹ️</span>
            <p className="text-[11px] text-[#475569]">Hay <span className="font-bold text-[#071d37]">{pendientes.length} solicitudes</span> requieren dictamen para habilitar sus convocatorias de voluntariado matutino.</p>
          </div>
          <span className="text-[11px] text-[#64748b] hidden sm:block">Tiempo promedio de respuesta: 4.2 h</span>
        </div>
      )}

      {/* LISTA DE PENDIENTES */}
      {tabActiva === 'pendientes' && (
        <div className="flex flex-col gap-4">
          {pendientes.map((fund) => (
            <div key={fund.id} className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  fund.id === '1' ? 'bg-[#e0f2fe] text-[#0284c7]' :
                  fund.id === '2' ? 'bg-[#ede9fe] text-[#7c3aed]' :
                  'bg-[#dcfce7] text-[#166534]'
                }`}>
                  {getInitials(fund.nombre_legal)}
                </div>
                
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-extrabold text-[#071d37]">{fund.nombre_legal}</h3>
                    <span className="bg-[#f1f5f9] text-[#475569] text-[9px] font-bold px-2 py-0.5 rounded-md">{fund.area_enfoque}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-[#64748b]">{fund.fecha_solicitud}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#475569] mb-3">
                    <span><span className="font-semibold">NIT:</span> {fund.nit}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span>{fund.ciudad}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span><span className="font-semibold">Coord:</span> {fund.coordinador}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      ✓ RUT 2025
                    </span>
                    <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      ✓ {fund.id === '3' ? 'Estados Financieros' : fund.id === '2' ? 'Certificado DIAN' : 'Cámara de Comercio'}
                    </span>
                    <span className="bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      ✓ {fund.id === '3' ? 'Antecedentes Representante' : 'Personería Jurídica'}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] flex items-center gap-1 mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto">
                      📄 {fund.id === '1' ? '3 Archivos PDF (4.8 MB)' : fund.id === '2' ? '4 Archivos PDF (6.2 MB)' : '5 Archivos PDF (8.1 MB)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-[#e2e8f0] pt-4 md:pt-0 md:pl-6">
                 <button className="bg-[#e2e8f0] text-[#334155] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#cbd5e1] transition w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer">
                   <span>👁️</span> Inspeccionar
                 </button>
                 <button className="text-red-600 font-bold text-xs hover:underline w-full sm:w-auto text-center order-last sm:order-none mt-2 sm:mt-0 cursor-pointer">
                   Rechazar
                 </button>
                 <button 
                   onClick={() => handleAprobar(fund.id)}
                   className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
                 >
                   <span>✓</span> Aprobar Fundación
                 </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SECCIÓN DE APROBADAS */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-extrabold text-[#071d37]">Fundaciones Recientemente Aprobadas</h2>
          <span className="bg-[#86efac] text-[#166534] text-[10px] font-bold px-2 py-0.5 rounded-full">Últimos registros</span>
        </div>
        <button className="text-[11px] font-bold text-[#005684] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap">
          Ver todas (139) →
        </button>
      </div>

      <div className="flex flex-col gap-0 border border-[#e2e8f0] rounded-2xl bg-white overflow-hidden shadow-sm">
        {aprobadas.map((fund, index) => (
          <div key={fund.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 ${index !== aprobadas.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}>
             
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  fund.id === '10' ? 'bg-[#a7f3d0] text-[#065f46]' :
                  fund.id === '11' ? 'bg-[#bae6fd] text-[#0369a1]' :
                  'bg-[#ddd6fe] text-[#5b21b6]'
                }`}>
                  {getInitials(fund.nombre_legal)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-extrabold text-[#071d37]">{fund.nombre_legal}</h4>
                    <span className="bg-[#bbf7d0] text-[#166534] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">✓ Aprobada</span>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    NIT: {fund.nit} • {fund.ciudad}
                  </p>
                </div>
             </div>

             <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-semibold text-[#071d37]">Aprobado por {fund.aprobado_por_nombre}</p>
                  <p className="text-[10px] text-[#64748b]">{fund.fecha_aprobacion}</p>
                </div>
                <button className="bg-[#f1f5f9] text-[#475569] px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#e2e8f0] transition cursor-pointer shrink-0">
                  Ver Ficha
                </button>
             </div>

          </div>
        ))}
      </div>

    </div>
  );
}