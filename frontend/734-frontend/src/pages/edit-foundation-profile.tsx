import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

export function EditFoundationProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estados básicos del formulario
  const [razonSocial, setRazonSocial] = useState('Fundación Social y Comunitaria Huellas de Esperanza de Colombia');
  const [mision, setMision] = useState('Transformar realidades en comunidades vulnerables mediante comedores infantiles autosostenibles, programas de acompañamiento psicosocial y brigadas de educación básica temprana, garantizando un desarrollo digno para cada niño y niña.');
  const [vision, setVision] = useState('Consolidar 12 centros de acogida y nutrición infantil comunitaria en la zona andina, apalancados en transparencia operativa total y participación activa del voluntariado.');

  const markUnsaved = () => setHasUnsavedChanges(true);

  const handleSave = async () => {
    setLoading(true);
    // Simulación de guardado
    setTimeout(() => {
      setLoading(false);
      setHasUnsavedChanges(false);
    }, 800);
  };

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans pb-24">    
        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          {/* HEADER DE LA PÁGINA */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-[#bbf7d0] flex items-center gap-1">
                  ✓ Entidad Verificada
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">ID: FDN-2024-884</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mt-1 mb-1">
                Editar Perfil Institucional — <span className="text-[#005684]">Fundación Huellas de Esperanza</span>
              </h1>
              <p className="text-[13px] text-[#64748b] max-w-3xl">
                Gestiona la identidad pública, datos bancarios autorizados y necesidades operativas mostradas a la comunidad de 7:34 AM.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
              <button className="bg-white text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#eef6ff] transition flex items-center gap-2 border border-[#dbeafe]">
                Ver Perfil Público ↗
              </button>
              <button onClick={handleSave} className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm flex items-center gap-2 cursor-pointer">
                <span>✓</span> Guardar Cambios
              </button>
            </div>
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-4">
             <button className="bg-[#005684] text-white px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-sm">
               <span>📁</span> Información Básica & Contacto
             </button>
             <button className="bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition">
               <span>🎯</span> Causas & Misión
             </button>
             <button className="bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition">
               <span>💳</span> Canales de Recaudo & Donación
             </button>
             <button className="bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition">
               <span>🛡️</span> Documentación & Sellos
             </button>
          </div>

          {/* RETÍCULA DE EDICIÓN: 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA (Principal) */}
            <div className="flex flex-col gap-6">
              
              {/* 01. IDENTIDAD GRÁFICA */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🖼️</span> Identidad Gráfica Institucional
                  </h3>
                  <span className="text-[10px] text-[#64748b] font-bold">Aspect ratio 16:9 y 1:1</span>
                </div>
                
                {/* Portada */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-6 h-48 border border-[#e2e8f0]">
                  <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Portada" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                     <div className="flex justify-between items-center w-full">
                       <div>
                         <p className="text-white text-xs font-bold">Foto de Portada Principal</p>
                         <p className="text-white/80 text-[10px]">Resolución sugerida: 1920×1080px (Max 4MB)</p>
                       </div>
                       <button className="bg-white/90 text-[#071d37] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white transition">
                         📷 Cambiar Portada
                       </button>
                     </div>
                  </div>
                </div>

                {/* Logo */}
                <div className="flex items-center gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0]">
                   <div className="w-20 h-20 bg-white border border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center p-2 shadow-sm shrink-0">
                      <span className="text-2xl text-[#005684]">☀️</span>
                      <span className="text-[6px] font-bold text-[#071d37] mt-1 text-center leading-tight">HUELLAS DE<br/>ESPERANZA</span>
                   </div>
                   <div className="flex-1">
                     <h4 className="text-xs font-bold text-[#071d37]">Logo Oficial / Emblema</h4>
                     <p className="text-[10px] text-[#64748b] mt-0.5 mb-2">PNG o SVG con fondo transparente. Mínimo 400x400 px.</p>
                     <div className="flex gap-3">
                       <button className="text-[11px] font-bold text-[#005684] hover:underline">Subir Nuevo Logo</button>
                       <button className="text-[11px] font-bold text-red-500 hover:underline">Quitar</button>
                     </div>
                   </div>
                </div>
              </section>

              {/* 02. DATOS LEGALES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-5">
                  <span className="text-base">⚖️</span> Datos Legales y Registro
                </h3>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Razón Social Completa</label>
                    <input type="text" value={razonSocial} onChange={(e)=>{setRazonSocial(e.target.value); markUnsaved();}} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sigla o Nombre Corto</label>
                      <input type="text" defaultValue="Huellas de Esperanza" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1 flex items-center justify-between">
                        NIT / Registro Tributario
                        <span className="text-[#047857] flex items-center gap-1 normal-case"><span className="text-sm">✓</span> Validado DIAN</span>
                      </label>
                      <div className="relative">
                        <input type="text" defaultValue="901.482.391-4" readOnly className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#64748b] outline-none" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Personería Jurídica</label>
                      <input type="text" defaultValue="Resolución Alcaldía Mayor 3844" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Año de Fundación</label>
                      <input type="text" defaultValue="2018" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 03. MISIÓN, VISIÓN E IMPACTO SOCIAL */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🎯</span> Misión, Visión e Impacto Social
                  </h3>
                  <span className="text-[10px] text-[#64748b] font-bold">Edición enriquecida</span>
                </div>
                
                <div className="flex flex-col gap-5">
                  {/* Misión */}
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Misión Institucional</label>
                    <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                        <button className="text-xs font-bold text-[#475569] hover:text-[#071d37]">B</button>
                        <button className="text-xs font-serif italic text-[#475569] hover:text-[#071d37]">I</button>
                        <button className="text-xs text-[#475569] hover:text-[#071d37]">≡</button>
                        <button className="text-xs text-[#475569] hover:text-[#071d37]">🔗</button>
                        <span className="text-[10px] text-[#94a3b8] ml-auto">{mision.length} / 600 caracteres</span>
                      </div>
                      <textarea value={mision} onChange={(e)=>{setMision(e.target.value); markUnsaved();}} rows={4} className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"></textarea>
                    </div>
                  </div>

                  {/* Visión */}
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Visión 2030</label>
                    <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                        <button className="text-xs font-bold text-[#475569] hover:text-[#071d37]">B</button>
                        <button className="text-xs font-serif italic text-[#475569] hover:text-[#071d37]">I</button>
                        <button className="text-xs text-[#475569] hover:text-[#071d37]">≡</button>
                        <button className="text-xs text-[#475569] hover:text-[#071d37]">🔗</button>
                        <span className="text-[10px] text-[#94a3b8] ml-auto">{vision.length} / 600 caracteres</span>
                      </div>
                      <textarea value={vision} onChange={(e)=>{setVision(e.target.value); markUnsaved();}} rows={3} className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"></textarea>
                    </div>
                  </div>
                </div>
              </section>

              {/* 04. UBICACIÓN Y RECEPCIÓN DE AYUDAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                 <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">📍</span> Ubicación y Recepción de Ayudas
                  </h3>
                  <span className="text-[10px] text-[#005684] font-bold bg-[#eef6ff] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>⊕</span> GPS Actualizado
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Departamento / Región</label>
                    <input type="text" defaultValue="Cundinamarca" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Ciudad / Municipio</label>
                    <input type="text" defaultValue="Bogotá D.C." onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Localidad / Sector</label>
                    <input type="text" defaultValue="Ciudad Bolívar - Barrio Paraíso" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Dirección de Entrega</label>
                    <input type="text" defaultValue="Carrera 27B Bis # 71H - 14 Sur" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-48 border border-[#e2e8f0]">
                   <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-80" alt="Mapa Ubicación" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#0f2a3f]/90 text-white text-[11px] font-bold px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg flex flex-col items-center gap-1">
                        <span>📍 Sede Operativa Paraíso — Abierta Lun a Sáb 7:00 a 17:00</span>
                        <button className="bg-[#005684] text-white px-3 py-1 rounded-lg text-[9px] mt-1 hover:bg-[#00456a] transition">Ajustar Pin</button>
                      </div>
                   </div>
                </div>
              </section>

            </div>

            {/* COLUMNA DERECHA (Sidebar Interno) */}
            <div className="flex flex-col gap-6">
              
              {/* 05. CANALES DE RECAUDO */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <div className="flex items-start justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <span className="text-xl text-[#005684]">💳</span>
                     <h3 className="text-sm font-bold text-[#071d37] leading-tight">Canales de Recaudo Certificados</h3>
                   </div>
                   <span className="bg-[#eef6ff] text-[#005684] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-[#dbeafe] flex flex-col text-center leading-tight">
                     <span className="text-xs">3</span> Canales
                   </span>
                 </div>
                 <p className="text-[10px] text-[#64748b] mb-4">Estas cuentas son expuestas directamente a los donantes bajo validación de 7:34 AM para evitar suplantaciones.</p>

                 <div className="flex flex-col gap-3">
                   {/* Bancolombia */}
                   <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl">
                     <div className="flex justify-between items-start mb-1">
                       <div className="flex items-center gap-2">
                         <span className="text-base">🏦</span>
                         <h4 className="text-[11px] font-bold text-[#071d37]">Bancolombia — Cta. Corriente</h4>
                       </div>
                       <span className="text-[10px] font-bold text-[#047857] flex items-center gap-0.5"><span>✓</span> Activa</span>
                     </div>
                     <p className="text-[10px] text-[#64748b] ml-6">No. 209-185421-02</p>
                     <div className="flex justify-between items-center mt-2 ml-6">
                       <p className="text-[9px] font-semibold text-[#94a3b8]">Titular: Fundación Huellas de Esperanza</p>
                       <button className="text-[10px] font-bold text-[#005684] hover:underline">Editar</button>
                     </div>
                   </div>

                   {/* Nequi */}
                   <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl">
                     <div className="flex justify-between items-start mb-1">
                       <div className="flex items-center gap-2">
                         <span className="text-base">📱</span>
                         <h4 className="text-[11px] font-bold text-[#071d37]">Llave Nequi Institucional</h4>
                       </div>
                       <span className="text-[10px] font-bold text-[#047857] flex items-center gap-0.5"><span>✓</span> Activa</span>
                     </div>
                     <p className="text-[10px] text-[#64748b] ml-6">312 490 8820</p>
                     <div className="flex justify-between items-center mt-2 ml-6">
                       <p className="text-[9px] font-semibold text-[#94a3b8]">Vinculada a NIT 901.482.391-4</p>
                       <button className="text-[10px] font-bold text-[#005684] hover:underline">Editar</button>
                     </div>
                   </div>

                   {/* Wompi */}
                   <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl">
                     <div className="flex justify-between items-start mb-1">
                       <div className="flex items-center gap-2">
                         <span className="text-base">💻</span>
                         <h4 className="text-[11px] font-bold text-[#071d37]">Pasarela Digital Wompi / PSE</h4>
                       </div>
                       <span className="text-[10px] font-bold text-[#0284c7] flex items-center gap-0.5"><span>⚡</span> Integrado</span>
                     </div>
                     <p className="text-[10px] text-[#64748b] ml-6 truncate">wompi.co/collect-huellas...</p>
                   </div>
                 </div>

                 <button className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-2.5 rounded-xl mt-4 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe]">
                   <span>⊕</span> Vincular Otra Cuenta o Pasarela
                 </button>
              </section>

              {/* 06. CONTACTO & REDES OFICIALES */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-4">
                    <span className="text-base">💬</span> Contacto & Redes Oficiales
                 </h3>
                 
                 <div className="flex flex-col gap-4">
                   <div>
                     <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">WhatsApp de Enlace Solidario</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">💬</span>
                        <input type="text" defaultValue="+57 312 490 8820" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Correo Institucional Donaciones</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                        <input type="email" defaultValue="donaciones@huellasdeesperanza.org" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Instagram</label>
                       <input type="text" defaultValue="@huellas_esperanza" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" />
                     </div>
                     <div>
                       <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sitio Web</label>
                       <input type="text" defaultValue="https://huellas.org" onChange={markUnsaved} className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" />
                     </div>
                   </div>
                 </div>
              </section>

              {/* 07. NECESIDADES PUBLICADAS */}
              <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                      <span className="text-base">📋</span> Necesidades Publicadas
                   </h3>
                   <button className="text-[10px] font-bold text-[#005684] hover:bg-[#eef6ff] px-2 py-1 rounded-lg transition flex items-center gap-1">
                     <span>+</span> Añadir Demanda
                   </button>
                 </div>
                 <p className="text-[10px] text-[#64748b] mb-4 leading-tight">Prioridades en vivo vistas por voluntarios y donantes para la jornada matutina.</p>

                 <div className="flex flex-col gap-3">
                   {/* Item 1 */}
                   <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-2">
                     <div className="flex-1">
                       <p className="text-[11px] font-bold text-[#071d37] flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 300 Kits Nutricionales Desayuno
                       </p>
                       <p className="text-[9px] text-[#64748b] mt-0.5">Meta: $4.500.000 COP • Recaudado: 68%</p>
                       <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                         <div className="bg-[#0ea5e9] w-[68%] h-full rounded-full"></div>
                       </div>
                     </div>
                     <div className="flex flex-col gap-1 shrink-0">
                       <button className="text-[#94a3b8] hover:text-[#005684] text-xs">✏️</button>
                       <button className="text-[#94a3b8] hover:text-red-500 text-xs">🗑️</button>
                     </div>
                   </div>

                   {/* Item 2 */}
                   <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-2">
                     <div className="flex-1">
                       <p className="text-[11px] font-bold text-[#071d37] flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]"></span> 15 Voluntarios Tutores Pedagógicos
                       </p>
                       <p className="text-[9px] text-[#64748b] mt-0.5">Convocatoria Sábados 7:34 AM • 9 Postulados</p>
                       <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                         <div className="bg-[#8b5cf6] w-[60%] h-full rounded-full"></div>
                       </div>
                     </div>
                     <div className="flex flex-col gap-1 shrink-0">
                       <button className="text-[#94a3b8] hover:text-[#005684] text-xs">✏️</button>
                       <button className="text-[#94a3b8] hover:text-red-500 text-xs">🗑️</button>
                     </div>
                   </div>

                   {/* Item 3 */}
                   <div className="bg-white border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-2 opacity-60">
                     <div className="flex-1">
                       <p className="text-[11px] font-bold text-[#64748b] flex items-center gap-1 line-through">
                         <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Nevera Industrial para Alimentos
                       </p>
                       <p className="text-[9px] text-[#64748b] mt-0.5">Donada y en funcionamiento</p>
                     </div>
                     <span className="bg-[#dcfce7] text-[#166534] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#bbf7d0]">
                       Completada
                     </span>
                   </div>
                 </div>
              </section>

            </div>
          </div>
        </div>

        {/* SNACKBAR FLOTANTE (CAMBIOS SIN GUARDAR) */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="bg-[#0f2a3f] text-white rounded-2xl p-4 pr-5 shadow-2xl flex items-center gap-6 border border-[#1e3a8a] max-w-2xl w-full">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0284c7]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tienes cambios pendientes de publicación</p>
                  <p className="text-[11px] text-[#94a3b8]">Las actualizaciones impactarán inmediatamente tu ficha institucional pública.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto shrink-0">
                <button 
                  onClick={() => setHasUnsavedChanges(false)}
                  className="text-xs font-bold text-[#cbd5e1] hover:text-white px-3 py-2 transition cursor-pointer"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-[#005684] hover:bg-[#00456a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-[#0284c7] cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}