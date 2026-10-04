/**
 * Registro central de íconos de la plataforma (librería Lucide, la misma de los mockups de Stitch/Figma).
 *
 * Cada nombre representa un CONCEPTO de la app, no un dibujo. Para cambiar el ícono de un concepto
 * en toda la plataforma basta con cambiarlo aquí. Catálogo completo: https://lucide.dev/icons
 */
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Clock,
  Cloud,
  CloudSun,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FilePen,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  HandHeart,
  HandHelping,
  Handshake,
  Hash,
  Heart,
  Hospital,
  IdCard,
  Image,
  Info,
  KeyRound,
  Landmark,
  Laptop,
  LayoutGrid,
  Lightbulb,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  Package,
  PartyPopper,
  Pencil,
  Phone,
  Pin,
  Plane,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Scale,
  ScrollText,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Smartphone,
  Soup,
  Star,
  Stethoscope,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Undo2,
  Upload,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

export const ICONOS = {
  // Identidad y confianza
  verificado: BadgeCheck,
  completado: CircleCheck,
  check: Check,
  seguridad: Shield,
  auditoria: ShieldCheck,
  legal: Scale,
  nit: Hash,

  // Entidades
  fundacion: Building2,
  usuario: User,
  voluntarios: Users,
  beneficiarios: Users,

  // Contacto
  mensaje: MessageSquare,
  enviar: Send,
  telefono: Phone,
  correo: Mail,
  whatsapp: MessageCircle,
  sitioWeb: Globe,
  instagram: Camera, // Lucide no incluye logos de marcas
  compartir: Share2,
  ubicacion: MapPin,

  // Impacto y métricas
  donar: HandHeart,
  favorito: Heart,
  trayectoria: TrendingUp,
  calificacion: Star,
  necesidad: ClipboardList,
  paquete: Package,
  panel: LayoutGrid,
  convocatoria: Megaphone,

  // Tiempo
  reloj: Clock,
  calendario: Calendar,

  // Acciones
  editar: Pencil,
  agregar: Plus,
  eliminar: Trash2,
  ver: Eye,
  ocultar: EyeOff,
  buscar: Search,
  filtros: SlidersHorizontal,
  descargar: Download,
  subir: Upload,
  imprimir: Printer,
  actualizar: RefreshCw,
  cerrar: X,
  configuracion: Settings,
  cerrarSesion: LogOut,
  notificaciones: Bell,
  documento: FileText,

  // Navegación
  externo: ArrowUpRight,
  siguiente: ArrowRight,
  anterior: ArrowLeft,
  derecha: ChevronRight,
  abajo: ChevronDown,

  // Estado
  cargando: LoaderCircle,
  alerta: CircleAlert,
  advertencia: TriangleAlert,
  error: CircleX,
  info: Info,
  ayuda: CircleHelp,
  punto: Circle,
  celebracion: PartyPopper,
  idea: Lightbulb,

  // Gestión y documentos
  expedientes: FolderOpen,
  carpeta: Folder,
  certificado: ScrollText,
  formulario: FilePen,
  identificacion: IdCard,
  reporte: ChartColumn,
  guardar: Save,
  imagen: Image,
  camara: Camera,
  fijado: Pin,
  objetivo: Target,
  deshacer: Undo2,
  menu: Menu,

  // Seguridad y cuenta
  candado: Lock,
  llave: KeyRound,

  // Ayuda humanitaria y servicios
  emergencia: Siren,
  salud: Stethoscope,
  hospital: Hospital,
  alimentos: Soup,
  alianza: Handshake,
  voluntario: HandHelping,
  herramientas: Wrench,
  institucion: Landmark,
  banco: Landmark,
  pago: CreditCard,
  movil: Smartphone,
  computador: Laptop,
  viaje: Plane,
  rapido: Zap,

  // Franjas horarias
  manana: Sun,
  tarde: CloudSun,
  noche: Moon,
  nube: Cloud,
} as const;

export type NombreIcono = keyof typeof ICONOS;

/** Equivalencias de los emojis usados antes (y aún guardados en algunos datos de la BD) */
const EMOJI_A_ICONO: Record<string, NombreIcono> = {
  '✓': 'check', '✔': 'check', '📍': 'ubicacion', '⚠': 'advertencia', '✕': 'cerrar', '❌': 'error', '✅': 'completado',
  '🛡': 'seguridad', '📋': 'necesidad', '📄': 'documento', '✉': 'correo', '🏢': 'fundacion', '👁': 'ver',
  '★': 'calificacion', '⭐': 'calificacion', '☆': 'calificacion', '↗': 'externo', '🗑': 'eliminar', '🗂': 'expedientes',
  '🔴': 'punto', '🟢': 'punto', '🔵': 'punto', '🔹': 'punto', '🔒': 'candado', '🔍': 'buscar', '📅': 'calendario',
  '✏': 'editar', '🚨': 'emergencia', '🔔': 'notificaciones', '💳': 'pago', '💬': 'mensaje', '🗨': 'mensaje',
  '👥': 'voluntarios', '⚕': 'salud', '🤝': 'alianza', '🛠': 'herramientas', '🙋': 'voluntario', '🖼': 'imagen',
  '🔑': 'llave', '📷': 'camara', '📸': 'camara', '📱': 'movil', '📥': 'descargar', '📢': 'convocatoria',
  '📝': 'formulario', '📈': 'trayectoria', '📁': 'carpeta', '💻': 'computador', '👤': 'usuario', '👩': 'usuario',
  '🏛': 'institucion', '🎯': 'objetivo', '🎉': 'celebracion', '➔': 'siguiente', '❓': 'ayuda', '✈': 'viaje',
  '☀': 'manana', '🌤': 'tarde', '🌙': 'noche', '☁': 'nube', '🪪': 'identificacion', '🚪': 'cerrarSesion',
  '🖨': 'imprimir', '🕒': 'reloj', '⏱': 'reloj', '⏳': 'cargando', '📞': 'telefono', '📜': 'certificado', '📌': 'fijado',
  '📊': 'reporte', '💾': 'guardar', '💡': 'idea', '👈': 'anterior', '🏦': 'banco', '🏥': 'hospital', '🎛': 'filtros',
  '🍲': 'alimentos', '🌐': 'sitioWeb', '🌍': 'sitioWeb', '⚡': 'rapido', '⚙': 'configuracion', '⚖': 'legal',
  '☰': 'menu', '↻': 'actualizar', '↩': 'deshacer', 'ℹ': 'info', '📦': 'paquete', '💰': 'donar', '🎛️': 'filtros',
};

/** Convierte un emoji (p. ej. el campo `icono` guardado en la BD) en un concepto del registro */
export function iconoDesdeEmoji(valor: string | null | undefined, porDefecto: NombreIcono = 'info'): NombreIcono {
  if (!valor) return porDefecto;
  const limpio = valor.replace(/\uFE0F/g, '').trim();
  if (limpio in ICONOS) return limpio as NombreIcono;
  return EMOJI_A_ICONO[limpio] || EMOJI_A_ICONO[[...limpio][0]] || porDefecto;
}
