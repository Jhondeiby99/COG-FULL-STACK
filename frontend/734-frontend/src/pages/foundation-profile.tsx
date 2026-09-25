import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import IconVerify from '../assets/icons/IconVerify.svg';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';
import  ManoIcon from '../assets/icons/ManoIcon2.svg'
import  MensajeIcon from '../assets/icons/MensajeIcon.svg'
import  CompartirIcon from '../assets/icons/CompartirIcon.svg'
import  EnviarIcon from '../assets/icons/EnviarIcon.svg'
import  EnviarIconWhite from '../assets/icons/EnviarIconWhite.svg'

const CAUSE_TAGS = ['Primera infancia', 'Nutrición comunitaria', 'Educación', 'Salud preventiva'];
const CHANNELS = ['Nutrición', 'Salud', 'Educación', 'Infraestructura'];
const VOLUNTEER_TYPES = ['Presencial', 'Profesional', 'Fines de semana', 'Donación en especie'];

const NEEDS = [
  {
    id: 'alimentos',
    priority: 'alta' as const,
    timeAgo: 'Hace 2 horas',
    title: 'Alimentos no perecederos para 45 adultos mayores',
    description:
      'Requerimos granos secos (arroz, lentejas, avena), aceite vegetal y complementos nutricionales para el comedor comunitario de Chapinero.',
    category: 'Alimentos',
    progress: 30,
    goal: 'Meta: 200 kg',
  },
  {
    id: 'utiles',
    priority: 'media' as const,
    timeAgo: 'Hace 1 día',
    title: 'Kits de útiles escolares para inicio de clases',
    description:
      'Campaña escolar para beneficiar a 110 niños y niñas del sector con cuadernos, lápices, colores y morral básico.',
    category: 'Útiles escolares',
    progress: 60,
    goal: 'Meta: 110 kits',
  },
  {
    id: 'talleres',
    priority: 'baja' as const,
    timeAgo: 'Hace 4 días',
    title: 'Acompañamiento para talleres de nutrición en Bogotá',
    description:
      'Buscamos profesionales o estudiantes de nutrición y pedagogía para sesiones comunitarias de 2 horas cada sábado.',
    category: 'Voluntariado',
    progress: 10,
    goal: 'Meta: 20 hrs',
  },
];

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    alt: 'Voluntarios sirviendo alimentos a niños',
  },
  {
    src: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
    alt: 'Taller comunitario con familias',
  },
  {
    src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
    alt: 'Jornada de donación de víveres',
  },
  {
    src: 'https://images.unsplash.com/photo-1542810634-71277d95bc41?auto=format&fit=crop&w=800&q=80',
    alt: 'Actividad educativa con niños',
  },
];

const REVIEWS = [
  {
    name: 'María Isabel Gómez',
    role: 'Donante recurrente',
    date: 'Hace 3 semanas',
    rating: 5,
    text: 'La rendición de cuentas es clara. Pude ver cómo se usó mi donación de alimentos en el comedor de Chapinero.',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    name: 'Andrés Felipe Castro',
    role: 'Voluntario profesional',
    date: 'Hace 1 mes',
    rating: 5,
    text: 'El equipo coordina muy bien los sábados. Llegué como nutricionista y sentí que el tiempo realmente impactó.',
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    name: 'Liliana Vargas',
    role: 'Vecina de la comunidad',
    date: 'Hace 2 meses',
    rating: 4,
    text: 'Mi hijo recibió el kit escolar a tiempo. Ojalá abran más cupos de talleres en la tarde.',
    avatar: 'https://i.pravatar.cc/80?img=32',
  },
];

const PRIORITY_STYLES = {
  alta: {
    label: 'Alta Prioridad',
    className: 'bg-[#fee2e2] text-[#991b1b]',
    bar: 'bg-[#e53e3e]',
    dot: 'bg-[#e53e3e]',
  },
  media: {
    label: 'Media Prioridad',
    className: 'bg-[#e0e7ff] text-[#3730a3]',
    bar: 'bg-[#553c9a]',
    dot: 'bg-[#3182ce]',
  },
  baja: {
    label: 'Baja Prioridad',
    className: 'bg-[#dcfce7] text-[#166534]',
    bar: 'bg-[#38a169]',
    dot: 'bg-[#047857]',
  },
};

type PriorityFilter = 'todas' | 'alta' | 'media' | 'baja';

export function FoundationProfile() {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');

  const visibleNeeds = useMemo(
    () => (priorityFilter === 'todas' ? NEEDS : NEEDS.filter((need) => need.priority === priorityFilter)),
    [priorityFilter],
  );

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#f8fafc] text-left text-[15px] leading-normal text-[#2d3748] font-sans">
      <SiteHeader />

      <main className="flex-1 pb-12">
        {/* Hero Section */}
        <section className="relative h-[280px] overflow-hidden md:h-[360px]">
          <img
              src=""
              alt="Equipo de la fundación en jornada de cocina comunitaria"
              className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </section>

        {/* Contenedor Principal */}
        <div className="relative w-full flex justify-center px-4 md:px-8">
          <div className="w-full max-w-[1240px]">
            
            {/* Tarjeta Perfil Header */}
            <section style={{ marginBottom: '2.5rem' }} className="relative z-20 -mt-16 md:-mt-24 mb-[40px] rounded-3xl bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-gray-100 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
                
                {/* Contenedor Izquierdo: Logo e Información */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  
                  {/* Contenedor del Avatar/Logo (Recuadro blanco con sombra limpia) */}
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2 shadow-md md:size-28">
                    {/* Aquí puedes mantener tus iniciales o una etiqueta img si no deseas importar nada aún */}
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#e6f0ff] text-2xl font-bold text-[#005684] md:text-3xl">
                      HE
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    {/* Título y Badge de Verificado */}
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h1 className="!m-0 !text-3xl !font-bold !text-[#071d37] !md:text-3xl !tracking-tight">
                        Fundación Huellas de Esperanza
                      </h1>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6ff] px-2.5 py-0.5 text-xs font-bold text-[#005684]">
                        <img src={IconVerify} alt="Verificado" className="size-3.5" />
                        Verificada Oficial
                      </span>
                    </div>

                    {/* Línea de Metadatos (NIT, Ubicación, RUT) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#64748b] md:text-sm">
                      <span className="flex items-center gap-1">
                        <span className="opacity-60">🪪</span> NIT: 901.432.889-4
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-blue-500">📍</span> Bogotá D.C., Localidad Chapinero
                      </span>
                      <span className="flex items-center gap-1 text-[#047857] font-bold">
                        <span>✓</span> RUT y Personería Vigente
                      </span>
                    </div>

                    {/* Etiquetas / Causas */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {CAUSE_TAGS.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#e8f4fd] px-4 py-1.5 text-xs font-bold text-[#005684]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contenedor de Botones de Acción (Alineación a la derecha en Desktop) */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                  
                  {/* Botón Contactar (Fondo azul claro con texto azul oscuro) */}
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#e8f2ff] px-5 py-2.5 text-sm font-bold text-[#005684] transition hover:bg-[#d4e7fe] flex-1 sm:flex-none"
                  >
                    <span>
                      <img src={MensajeIcon} alt='Contacto'></img>
                    </span> Contactar
                  </button>

                  {/* Botón Compartir (Cuadrado con bordes redondeados) */}
                  <button
                    type="button"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#005684] transition hover:bg-[#d4e7fe]"
                    aria-label="Compartir"
                  >
                    <span className="text-sm"><img src={CompartirIcon} alt='Compartir'></img></span>
                  </button>

                  {/* Botón Donar ahora (Fondo azul marino continuo) */}
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#005684] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#00456a] flex-1 sm:flex-none"
                  >
                    <span>
                      <img src={ManoIcon} alt='Donar'></img>
                      </span> Donar ahora
                  </button>
                </div>
              </div>

            </section>
           {/* Fila Inferior de Estadísticas */}
            <div style={{ marginBottom: '2.5rem' }}  className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat 
                label="Trayectoria" 
                value="8" 
                unit="años continuos" 
                hint="Desde marzo de 2017" 
                icon="📈" // Reemplaza por tu icono o SVG de trayectoria
              />
              <Stat 
                label="Población Activa" 
                value="450+" 
                unit="beneficiarios directos" 
                hint="Adultos mayores en Chapinero" 
                hintColor="text-[#10b981]" // Color verde para el mockup
                icon="👥" // Reemplaza por tu icono o SVG de usuarios
              />
              <Stat 
                label="Reputación Social" 
                value="4.9" 
                unit="⭐⭐⭐⭐⭐" // Aquí puedes mapear tus estrellas fijas
                hint="124 opiniones auditadas" 
                icon="⭐" // Reemplaza por tu icono o SVG de estrella
              />
              <Stat 
                label="Efectividad" 
                value="18" 
                unit="necesidades resueltas" 
                hint="100% rendición verificada" 
                hintColor="text-[#005684] font-bold" // Color azul destacado
                icon="🛡️" // Reemplaza por tu icono o SVG de verificación
              />
            </div>




            {/* Grid Layout Principal */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              
              {/* Columna Izquierda (Contenido Principal) */}
              <div className="flex flex-col gap-8">
                
                {/* Sobre Nosotros */}
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏢</span>
                    <h2 className="m-0 text-xl font-extrabold !text-[#0B1C30]">Sobre nosotros y Territorio</h2>
                  </div>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4a5568]">
                    Trabajamos en Chapinero y barrios aledaños para garantizar nutrición, primera infancia y
                    acompañamiento comunitario. Articulamos donantes, voluntarios profesionales y vecinos para
                    que cada aporte llegue de forma verificable a comedores, jardines y talleres de salud
                    preventiva.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <InfoChip icon="📄" title="Tipo de entidad" value="Fundación sin ánimo de lucro" />
                    <InfoChip icon="⚖️" title="Cobertura legal" value="Registro Cámara de Comercio" />
                    <InfoChip icon="🛡️" title="Confianza" value="Comité de transparencia 7:34 AM" />
                  </div>

                  <div className="mt-8 flex items-center gap-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                    <TransparencyRing value={85} />
                    <div>
                      <p className="m-0 text-[15px] font-extrabold text-[#0f2a3f]">85% Índice de transparencia</p>
                      <p className="mt-1 mb-0 text-sm text-[#718096] leading-snug">
                        Reportes de rendición publicados cada trimestre y necesidades auditadas por el comité.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Necesidades */}
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] md:p-8">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#e2e8f0] pb-4">
                    <div>
                      <h2 className="m-0 text-xl font-extrabold !text-[#0B1C30]">Necesidades publicadas</h2>
                      <p className="mt-1 mb-0 text-sm font-medium text-[#718096]">
                        Requerimientos verificados para esta fundación en territorio.
                      </p>
                    </div>
                    <div className="!flex !flex-wrap !gap-2 !rounded-lg !bg-[#f0f4f8] !p-1.5">
                      {([
                        ['todas', 'Todas'],
                        ['alta', 'Alta'],
                        ['media', 'Media'],
                        ['baja', 'Baja'],
                      ] as const).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPriorityFilter(id)}
                          className={`!rounded-md !px-4 !py-1.5 !text-xs !font-bold !transition ${
                            priorityFilter === id
                              ? '!bg-white !text-[#005684] !shadow-sm'
                              : '!text-[#64748b] !hover:text-[#0f2a3f]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="!flex !flex-col !gap-5">
                    {visibleNeeds.map((need) => (
                      <NeedCard key={need.id} need={need} />
                    ))}
                  </div>
                </section>

                {/* Galería */}
                <section className="!rounded-2xl !bg-white !p-6 !shadow-sm !border !border-[#e2e8f0] !md:p-8">
                  <h2 className="!m-0 !text-xl !font-extrabold !text-[#0f2a3f] !mb-1">Galería de actividades en terreno</h2>
                  <p className="!mb-6 !text-sm !font-medium !text-[#718096]">
                    Jornadas recientes de nutrición, educación y acompañamiento familiar.
                  </p>
                  <div className="!grid !grid-cols-2 !gap-4 !md:grid-cols-4">
                    {GALLERY.map((photo) => (
                      <div key={photo.src} className="!group !relative !overflow-hidden !rounded-xl">
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="!h-32 !w-full !object-cover !transition-transform !duration-300 !group-hover:scale-110 !md:h-36"
                        />
                        <div className="!absolute !inset-0 !bg-black/10 !transition-opacity !group-hover:opacity-0" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Reseñas */}
                <section className="!rounded-2xl !bg-white !p-6 !shadow-sm !border !border-[#e2e8f0] !md:p-8">
                  <div className="!mb-6 !flex !items-center !justify-between !border-b !border-[#e2e8f0] !pb-4">
                    <h2 className="!m-0 !text-xl !font-extrabold !text-[#0f2a3f]">Calificaciones y comentarios</h2>
                    <div className="!flex !items-center !gap-2">
                      <span className="!text-xl !font-black !text-[#005684]">4.9</span>
                      <span className="!text-[#f59e0b] text-lg">★</span>
                    </div>
                  </div>
                  <div className="!flex !flex-col !gap-6">
                    {REVIEWS.map((review) => (
                      <article key={review.name} className="!flex !gap-4 !border-b !border-[#f1f5f9] !pb-6 !last:border-0 !last:pb-0">
                        <img src={review.avatar} alt="" className="!size-12 !rounded-full !object-cover !shadow-sm" />
                        <div className="!min-w-0 !flex-1">
                          <div className="!flex !flex-wrap !items-center !justify-between !gap-2">
                            <h3 className="!m-0 !text-[15px] !font-bold !text-[#0f2a3f]">{review.name}</h3>
                            <span className="!text-xs !font-medium !text-[#94a3b8]">{review.date}</span>
                          </div>
                          <p className="!mt-0.5 !mb-1.5 !text-xs !font-bold !text-[#005684] !uppercase !tracking-wide">{review.role}</p>
                          <p className="!m-0 !text-sm !text-[#f59e0b] !tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                          <p className="!mt-2.5 !mb-0 !text-sm !leading-relaxed !text-[#4a5568]">{review.text}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              {/* Columna Derecha (Sidebar Sticky) */}
              <aside className="flex flex-col gap-6 top-24 h-fit">
              {/* Tarjeta Unificada de Contacto e Información */}
              <section className="rounded-3xl bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col gap-5">
                
                {/* Encabezado del Formulario */}
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]">
                    {/* Icono de avión de papel / enviar */}
                    <span className="text-lg"><img src={EnviarIcon}></img></span> 
                  </div>
                  <div>
                    <h3 className="m-0 text-[15px] font-bold text-[#071d37]">Contacto Directo</h3>
                    <p className="m-0 text-xs text-[#64748b] mt-0.5">Respuesta promedio en menos de 4 horas</p>
                  </div>
                </div>

                {/* Formulario */}
                <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
                  
                  {/* Campo: Nombre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Nombre completo</label>
                    <input 
                      type="text" 
                      placeholder="Ej. María Fernanda Ospina" 
                      className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] placeholder:text-[#a0aec0] text-[#2d3748] font-medium transition-all"
                    />
                  </div>

                  {/* Campo: Correo */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Correo electrónico</label>
                    <input 
                      type="email" 
                      placeholder="maria@ejemplo.com" 
                      className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] placeholder:text-[#a0aec0] text-[#2d3748] font-medium transition-all"
                    />
                  </div>

                  {/* Campo: Tipo de Consulta */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Tipo de consulta</label>
                    <div className="relative">
                      <select 
                        className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] text-[#2d3748] font-medium appearance-none cursor-pointer transition-all"
                        defaultValue="donaciones"
                      >
                        <option value="donaciones">Quiero entregar donaciones físicas</option>
                        <option value="voluntariado">Quiero ser voluntario</option>
                        <option value="informacion">Solicitar información institucional</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                    </div>
                  </div>

                  {/* Campo: Mensaje */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Mensaje</label>
                    <textarea 
                      placeholder="¿Cómo te gustaría colaborar con la fundación?" 
                      rows={3} 
                      className="w-full text-xs px-3.5 py-3 bg-[#f4f7fc] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#005684] placeholder:text-[#a0aec0] text-[#2d3748] font-medium resize-none transition-all"
                    />
                  </div>

                  {/* Botón Enviar */}
                  <button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#005684] py-3 rounded-xl hover:bg-[#00456a] transition-all shadow-sm mt-1"
                  >
                    <span><img src={EnviarIconWhite}></img></span> Enviar mensaje a coordinación
                  </button>

                </form>

                {/* Divisor sutil intermedio */}
                <div className="border-t border-gray-100/80 my-1" />

                {/* Datos de Contacto Institucional */}
                <div className="flex flex-col gap-4">
                  
                  {/* Teléfono */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]">
                      <span className="text-xs">📞</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Línea Verificada</span>
                      <span className="text-xs font-bold text-[#071d37] mt-0.5">+57 (601) 345 8820 · PBX</span>
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]">
                      <span className="text-xs">✉️</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Correo Institucional</span>
                      <span className="text-xs font-bold text-[#071d37] mt-0.5 truncate">direccion@huellasdeesperanza.org.co</span>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f0ff] text-[#005684]">
                      <span className="text-xs">📍</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#a0aec0] tracking-wide uppercase">Sede de Acopio y Atención</span>
                      <span className="text-xs font-bold text-[#475569] mt-0.5 leading-normal">Carrera 7 # 58-34, Chapinero, Bogotá</span>
                    </div>
                  </div>

                </div>

                {/* Divisor del Footer */}
                <div className="border-t border-gray-100/80 mt-1" />

                {/* Footer: Canales Digitales */}
                <div className="flex items-center justify-between w-full pt-1">
                  <span className="text-xs font-bold text-[#475569]">Canales digitales:</span>
                  <div className="flex items-center gap-2">
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs transition-colors">📸</button>
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs transition-colors">🌐</button>
                    <button className="flex size-8 items-center justify-center rounded-lg bg-[#f4f7fc] text-[#005684] hover:bg-[#e6f0ff] text-xs transition-colors">📢</button>
                  </div>
                </div>

              </section>

                <SidebarCard title="Ubicación en territorio">
                  <div className="overflow-hidden rounded-xl border border-[#e2e8f0] shadow-sm">
                    <iframe
                      title="Mapa de Chapinero, Bogotá"
                      className="h-48 w-full border-0"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-74.075%2C4.630%2C-74.045%2C4.655&layer=mapnik&marker=4.643%2C-74.063"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-[#005684]">📍</span>
                    <p className="m-0 text-sm font-medium text-[#475569]">Chapinero, Bogotá D.C.<br/><span className="text-xs text-[#94a3b8]">Colombia</span></p>
                  </div>
                </SidebarCard>
                {/* Bloque de Validación y Transparencia */}
                <div className="rounded-3xl bg-[#f4f7fc] p-6 border border-transparent flex gap-4 items-start w-full max-w-[380px]">
                  
                  {/* Icono de Escudo Verificado */}
                  <div className="text-[#005684] shrink-0 mt-0.5 bg-transparent size-8 rounded-xl flex items-center justify-center">
                    {/* Escudo con check azul */}
                    <span className="text-base font-bold"><img className="w-[16px] h-[20px]" src={IconVerify}></img></span> 
                  </div>

                  {/* Contenido de Texto */}
                  <div className="flex flex-col gap-1">
                    <h4 className="m-0 text-[15px] font-bold text-[#071d37] tracking-tight">
                      Validado por 7:34 AM
                    </h4>
                    <p className="m-0 text-xs leading-relaxed text-[#475569] font-medium">
                      Esta organización fue auditada fiscal y territorialmente. Cumple con la trazabilidad digital de recursos y entrega reportes con corte matutino.
                    </p>
                  </div>

                </div>

              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Banner Call to Action */}
      <section className="bg-[#0f2a3f] px-10 py-10 text-white mt-auto">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="m-0 text-2xl font-extrabold text-white">¿Deseas convocar voluntarios o publicar una causa?</h2>
            <p className="mt-2 mb-0 text-[15px] text-[#cbd5e1]">
              Suma tu organización a la red nacional y visibiliza necesidades verificadas de forma transparente.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/login"
              className="rounded-lg bg-[#FFFFFF] px-6 py-3 text-center text-[15px] font-bold !text-black no-underline shadow-md transition whitespace-nowrap"
            >
              Registrarme ahora
            </Link>
            <Link
              to="/"
              className="rounded-lg bg-[#007BB9] border border-white/20 px-6 py-3 text-center text-[15px] font-bold !text-white no-underline transition  whitespace-nowrap"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return <Header />;
}

function SiteFooter() {
  return <Footer />;
}

interface StatProps {
  value: string;
  label: string;
  unit: string;
  hint: string;
  hintColor?: string;
  icon: React.ReactNode;
}

function Stat({ value, label, unit, hint, hintColor = "text-[#64748b]", icon }: StatProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-shadow hover:shadow-sm">
      
      {/* Línea Superior: Etiqueta e Icono */}
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs font-semibold text-[#64748b] tracking-tight">
          {label}
        </span>
        <div className="text-sm opacity-80 shrink-0">
          {icon}
        </div>
      </div>
      
      {/* Línea Central: Valor grande y Unidad secundaria */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-bold text-[#071d37] tracking-tight">
          {value}
        </span>
        <span className="text-xs font-medium text-[#475569]">
          {unit}
        </span>
      </div>
      
      {/* Línea Inferior: Texto de ayuda o aclaración */}
      <p className={`m-0 text-xs ${hintColor} tracking-normal`}>
        {hint}
      </p>

    </div>
  );
}


function InfoChip({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="m-0 text-[11px] font-extrabold tracking-wider text-[#005684] uppercase">{title}</p>
      </div>
      <p className="m-0 text-sm font-bold text-[#0f2a3f]">{value}</p>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0]">
      <h3 className="mt-0 mb-4 text-[15px] font-extrabold text-[#0f2a3f] border-b border-[#e2e8f0] pb-3">{title}</h3>
      {children}
    </section>
  );
}

function TransparencyRing({ value }: { value: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative size-[80px] shrink-0">
      <svg viewBox="0 0 80 80" className="size-[80px] -rotate-90 drop-shadow-sm">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#005684"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-black text-[#0f2a3f]">
        {value}%
      </span>
    </div>
  );
}

function NeedCard({ need }: { need: (typeof NEEDS)[number] }) {
  const style = PRIORITY_STYLES[need.priority];

  return (
    <article className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Barra superior de color */}
      <span className={`absolute inset-x-0 top-0 h-1.5 ${style.dot}`} />
      
      <div className="mb-3 mt-1 flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.className}`}>
          {style.label}
        </span>
        <span className="text-xs font-semibold text-[#94a3b8]">⏱️ {need.timeAgo}</span>
      </div>
      
      <h3 className="m-0 text-base font-extrabold text-[#0f2a3f] leading-snug">{need.title}</h3>
      <p className="mt-2 mb-4 text-sm leading-relaxed text-[#4a5568]">{need.description}</p>
      
      <div className="rounded-xl bg-[#f8fafc] border border-[#f1f5f9] p-4">
        <div className="mb-2.5 flex justify-between text-xs font-bold text-[#475569]">
          <span>
            Categoría: <span className="text-[#005684]">{need.category}</span>
          </span>
          <span>Recaudado: {need.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${need.progress}%` }} />
        </div>
        <p className="mt-2 mb-0 text-right text-xs font-semibold text-[#64748b]">{need.goal}</p>
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#047857]">
          <img src={IconVerify} alt="Verificado" className="size-3.5" /> Verificada
        </span>
        <button
          type="button"
          className="rounded-full bg-[#005684] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#00456a]"
        >
          Apoyar esta necesidad →
        </button>
      </div>
    </article>
  );
}