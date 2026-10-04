import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Leaflet se carga desde CDN con verificación de integridad (SRI) para no depender del bundle
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

// Tipos mínimos de la API de Leaflet que usamos
interface LeafletLayer { remove: () => void }
interface LeafletMarker extends LeafletLayer {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindTooltip: (html: string) => LeafletMarker;
  on: (evt: string, cb: () => void) => LeafletMarker;
}
interface LeafletMap {
  setView: (c: [number, number], z: number) => LeafletMap;
  fitBounds: (b: [number, number][], o?: { padding: [number, number]; maxZoom: number }) => void;
  remove: () => void;
  invalidateSize: () => void;
}
interface LeafletStatic {
  map: (el: HTMLElement, o?: { scrollWheelZoom?: boolean }) => LeafletMap;
  tileLayer: (url: string, o: { attribution: string; maxZoom: number }) => { addTo: (m: LeafletMap) => void };
  circleMarker: (c: [number, number], o: Record<string, unknown>) => LeafletMarker;
}
declare global { interface Window { L?: LeafletStatic } }

let leafletPromise: Promise<LeafletStatic> | null = null;
function cargarLeaflet(): Promise<LeafletStatic> {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    css.integrity = LEAFLET_CSS_SRI;
    css.crossOrigin = '';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.integrity = LEAFLET_JS_SRI;
    js.crossOrigin = '';
    js.onload = () => (window.L ? resolve(window.L) : reject(new Error('Leaflet no disponible')));
    js.onerror = () => { leafletPromise = null; reject(new Error('No se pudo cargar el mapa')); };
    document.body.appendChild(js);
  });
  return leafletPromise;
}

// Coordenadas de referencia por ciudad (ubicación aproximada, nunca la dirección exacta)
const CIUDADES: { claves: string[]; nombre: string; coords: [number, number] }[] = [
  { claves: ['bogota', 'teusaquillo', 'chapinero', 'suba', 'kennedy', 'usaquen'], nombre: 'Bogotá D.C.', coords: [4.711, -74.0721] },
  { claves: ['medellin'], nombre: 'Medellín', coords: [6.2442, -75.5812] },
  { claves: ['cali'], nombre: 'Cali', coords: [3.4516, -76.532] },
  { claves: ['barranquilla'], nombre: 'Barranquilla', coords: [10.9685, -74.7813] },
  { claves: ['cartagena'], nombre: 'Cartagena', coords: [10.391, -75.4794] },
  { claves: ['bucaramanga'], nombre: 'Bucaramanga', coords: [7.1193, -73.1227] },
  { claves: ['cucuta'], nombre: 'Cúcuta', coords: [7.8939, -72.5078] },
  { claves: ['pereira'], nombre: 'Pereira', coords: [4.8133, -75.6961] },
  { claves: ['manizales'], nombre: 'Manizales', coords: [5.0703, -75.5138] },
  { claves: ['armenia'], nombre: 'Armenia', coords: [4.5339, -75.6811] },
  { claves: ['ibague'], nombre: 'Ibagué', coords: [4.4389, -75.2322] },
  { claves: ['santa marta'], nombre: 'Santa Marta', coords: [11.2408, -74.199] },
  { claves: ['villavicencio'], nombre: 'Villavicencio', coords: [4.142, -73.6266] },
  { claves: ['pasto'], nombre: 'Pasto', coords: [1.2136, -77.2811] },
  { claves: ['monteria'], nombre: 'Montería', coords: [8.7479, -75.8814] },
  { claves: ['neiva'], nombre: 'Neiva', coords: [2.9273, -75.2819] },
  { claves: ['popayan'], nombre: 'Popayán', coords: [2.4448, -76.6147] },
  { claves: ['valledupar'], nombre: 'Valledupar', coords: [10.4631, -73.2532] },
  { claves: ['sincelejo'], nombre: 'Sincelejo', coords: [9.3047, -75.3978] },
  { claves: ['tunja'], nombre: 'Tunja', coords: [5.5353, -73.3678] },
  { claves: ['quibdo'], nombre: 'Quibdó', coords: [5.6947, -76.6611] },
  { claves: ['riohacha'], nombre: 'Riohacha', coords: [11.5444, -72.9072] },
  { claves: ['florencia'], nombre: 'Florencia', coords: [1.6144, -75.6062] },
  { claves: ['yopal'], nombre: 'Yopal', coords: [5.3378, -72.3959] },
  { claves: ['buenaventura'], nombre: 'Buenaventura', coords: [3.8801, -77.0312] },
  { claves: ['palmira'], nombre: 'Palmira', coords: [3.5394, -76.3036] },
  { claves: ['soacha'], nombre: 'Soacha', coords: [4.5794, -74.2168] },
  { claves: ['bello'], nombre: 'Bello', coords: [6.3373, -75.5579] },
  { claves: ['envigado'], nombre: 'Envigado', coords: [6.1759, -75.5917] },
  { claves: ['itagui'], nombre: 'Itagüí', coords: [6.1719, -75.6114] },
  { claves: ['soledad'], nombre: 'Soledad', coords: [10.9184, -74.7646] },
  { claves: ['leticia'], nombre: 'Leticia', coords: [-4.2153, -69.9406] },
  { claves: ['san andres'], nombre: 'San Andrés', coords: [12.5847, -81.7006] },
];

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function ubicarCiudad(texto: string | null | undefined) {
  if (!texto) return null;
  const t = normalizar(texto);
  return CIUDADES.find(c => c.claves.some(k => new RegExp(`\\b${k}\\b`).test(t))) || null;
}

const escapar = (t: string) => t.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

export interface VoluntarioMapa {
  id: string;
  nombre_completo: string | null;
  profesion: string | null;
  ciudad_base: string | null;
  ubicacion: string | null;
  disponibilidad_activa: boolean | null;
}

export function VolunteerMap({ voluntarios }: { voluntarios: VoluntarioMapa[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<LeafletMap | null>(null);
  const capas = useRef<LeafletLayer[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [soloActivos, setSoloActivos] = useState(true);
  const [ciudadSel, setCiudadSel] = useState<string | null>(null);

  const { grupos, sinUbicar } = useMemo(() => {
    const mapaGrupos = new Map<string, { nombre: string; coords: [number, number]; voluntarios: VoluntarioMapa[] }>();
    let sinUbicar = 0;
    voluntarios
      .filter(v => !soloActivos || v.disponibilidad_activa !== false)
      .forEach(v => {
        const ciudad = ubicarCiudad(v.ciudad_base) || ubicarCiudad(v.ubicacion);
        if (!ciudad) { sinUbicar++; return; }
        const g = mapaGrupos.get(ciudad.nombre) || { nombre: ciudad.nombre, coords: ciudad.coords, voluntarios: [] };
        g.voluntarios.push(v);
        mapaGrupos.set(ciudad.nombre, g);
      });
    return { grupos: [...mapaGrupos.values()].sort((a, b) => b.voluntarios.length - a.voluntarios.length), sinUbicar };
  }, [voluntarios, soloActivos]);

  // Inicializar mapa una sola vez
  useEffect(() => {
    let cancelado = false;
    cargarLeaflet()
      .then(L => {
        if (cancelado || !contenedor.current || mapa.current) return;
        mapa.current = L.map(contenedor.current, { scrollWheelZoom: false }).setView([4.6, -74.1], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(mapa.current);
        setEstado('listo');
      })
      .catch(() => !cancelado && setEstado('error'));
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  // Pintar marcadores cuando cambian los datos
  useEffect(() => {
    const L = window.L;
    if (estado !== 'listo' || !L || !mapa.current) return;
    capas.current.forEach(c => c.remove());
    capas.current = grupos.map(g => {
      const radio = Math.min(8 + g.voluntarios.length * 3, 28);
      return L.circleMarker(g.coords, {
        radius: radio, color: '#005684', weight: 2, fillColor: '#0ea5e9', fillOpacity: 0.55,
      })
        .bindTooltip(`<strong>${escapar(g.nombre)}</strong><br/>${g.voluntarios.length} voluntario${g.voluntarios.length === 1 ? '' : 's'}`)
        .on('click', () => setCiudadSel(g.nombre))
        .addTo(mapa.current as LeafletMap);
    });
    if (grupos.length > 0) {
      mapa.current.fitBounds(grupos.map(g => g.coords), { padding: [30, 30], maxZoom: 7 });
    }
    setTimeout(() => mapa.current?.invalidateSize(), 0);
  }, [estado, grupos]);

  const grupoSel = grupos.find(g => g.nombre === ciudadSel) || null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-[#f1f5f9] rounded-lg p-0.5 text-[10px] font-bold">
          <button type="button" onClick={() => setSoloActivos(true)} className={`px-3 py-1 rounded-md transition cursor-pointer ${soloActivos ? 'bg-white text-[#005684] shadow-sm' : 'text-[#64748b]'}`}>Activos</button>
          <button type="button" onClick={() => setSoloActivos(false)} className={`px-3 py-1 rounded-md transition cursor-pointer ${!soloActivos ? 'bg-white text-[#005684] shadow-sm' : 'text-[#64748b]'}`}>Todos</button>
        </div>
        {sinUbicar > 0 && (
          <span className="text-[10px] text-[#94a3b8]">{sinUbicar} sin ciudad reconocible</span>
        )}
      </div>

      <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#eef2f7] z-0">
        <div ref={contenedor} className="absolute inset-0" />
        {estado !== 'listo' && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#64748b] text-center px-4">
            {estado === 'cargando' ? 'Cargando mapa...' : 'No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.'}
          </div>
        )}
      </div>
      <p className="text-[10px] text-[#94a3b8]">Ubicación aproximada por ciudad según el perfil del voluntario; no se muestran direcciones exactas.</p>

      {grupoSel ? (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-[#071d37]">📍 {grupoSel.nombre} · {grupoSel.voluntarios.length}</p>
            <button type="button" onClick={() => setCiudadSel(null)} className="text-[10px] font-bold text-[#64748b] hover:text-[#071d37] cursor-pointer">Cerrar ✕</button>
          </div>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {grupoSel.voluntarios.map(v => (
              <Link key={v.id} to={`/voluntario/${v.id}`} className="flex justify-between items-center gap-2 text-[11px] py-1 border-b border-gray-100 last:border-0 hover:text-[#005684]">
                <span className="font-semibold text-[#334155] truncate">{v.nombre_completo || 'Voluntario'}</span>
                <span className="text-[10px] text-[#94a3b8] truncate">{v.profesion || ''}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : grupos.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {grupos.map(g => (
            <button key={g.nombre} type="button" onClick={() => setCiudadSel(g.nombre)} className="text-[10px] font-bold bg-[#eef6ff] text-[#005684] border border-[#dbeafe] px-2.5 py-1 rounded-full hover:bg-[#d4e7fe] transition cursor-pointer">
              {g.nombre} · {g.voluntarios.length}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#94a3b8]">No hay voluntarios con una ciudad reconocible.</p>
      )}
    </div>
  );
}
