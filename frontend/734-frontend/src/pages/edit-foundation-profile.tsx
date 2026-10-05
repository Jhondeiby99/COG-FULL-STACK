import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeedFormModal } from '../components/NeedFormModal';
import { subirImagen, eliminarImagen } from '../lib/imagenes';
import { DocumentosFundacion } from '../components/DocumentosFundacion';
import {
  type Necesidad,
  porcentajeRecaudo,
  marcarNecesidadResuelta,
  sincronizarNecesidadesResueltas,
  PRIORIDAD_ESTILOS,
} from '../lib/necesidades';

import { Icon } from '../components/Icon';
import { iconoDesdeEmoji } from '../lib/iconos';
interface CanalRecaudo {
  id: string;
  tipo: string;
  icono?: string;
  detalles: string;
  titular_nota: string;
  estado_texto?: string;
  estado_color?: string;
}

interface FotoGaleria {
  id: string;
  fundacion_id: string;
  imagen_url: string;
  alt_texto?: string | null;
}

interface FundacionData {
  id: string;
  nombre_legal?: string | null;
  sigla?: string | null;
  nit?: string | null;
  personeria_juridica?: string | null;
  ano_fundacion?: string | null;
  descripcion?: string | null;
  mision?: string | null;
  vision?: string | null;
  departamento?: string | null;
  ciudad?: string | null;
  localidad?: string | null;
  direccion_fisica?: string | null;
  telefono_whatsapp?: string | null;
  telefono?: string | null;
  email_contacto?: string | null;
  email_institucional?: string | null;
  instagram?: string | null;
  sitio_web?: string | null;
  portada_url?: string | null;
  foto_portada_url?: string | null;
  logo_url?: string | null;
  estado?: string | null;
  canales_recaudo?: CanalRecaudo[] | null;
  areas_impacto?: string[] | string | null;
  anos_operacion?: number | string | null;
  familias_acompanadas?: number | string | null;
}

// Valores editables del formulario. Se serializan para comparar contra lo guardado en BD.
interface FormValues {
  razonSocial: string;
  sigla: string;
  nit: string;
  personeria: string;
  anoFundacion: string;
  descripcion: string;
  mision: string;
  vision: string;
  areasImpacto: string[];
  anosOperacion: string;
  familiasAcompanadas: string;
  departamento: string;
  ciudad: string;
  localidad: string;
  direccionEntrega: string;
  whatsapp: string;
  telFijo: string;
  email: string;
  instagram: string;
  sitioWeb: string;
  portadaUrl: string;
  logoUrl: string | null;
  canalesRecaudo: CanalRecaudo[];
}

const serializarFormulario = (v: FormValues) => JSON.stringify(v);

const MAX_ANOS_OPERACION = 200;
const MAX_BENEFICIARIOS = 9_999_999;
const MAX_FOTOS_GALERIA = 12;
const MAX_ARCHIVO_MB = 5;

// Postgres puede devolver arreglos como array, JSON o literal "{a,b}"
function parsearAreas(valor: FundacionData['areas_impacto']): string[] {
  if (Array.isArray(valor)) return valor.filter(Boolean).map(String);
  if (typeof valor !== 'string' || valor.trim() === '') return [];
  try {
    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [valor];
  } catch {
    return valor.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
}

const numeroATexto = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined ? '' : String(valor);

// Solo dígitos, sin puntos, comas ni signos
const soloDigitos = (valor: string, maxLength: number) => valor.replace(/\D/g, '').slice(0, maxLength);

export function EditFoundationProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Estados de carga y feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basica' | 'causas' | 'recaudo' | 'documentos'>('basica');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ID de la fundación
  const [foundationId, setFoundationId] = useState<string | null>(id || null);

  // Formulario de datos
  const [razonSocial, setRazonSocial] = useState('');
  const [sigla, setSigla] = useState('');
  const [nit, setNit] = useState('');
  const [personeria, setPersoneria] = useState('');
  const [anoFundacion, setAnoFundacion] = useState('');

  const [descripcion, setDescripcion] = useState('');
  const [mision, setMision] = useState('');
  const [vision, setVision] = useState('');

  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');

  const [whatsapp, setWhatsapp] = useState('');
  const [telFijo, setTelFijo] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');

  const [portadaUrl, setPortadaUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [procesandoImagen, setProcesandoImagen] = useState<'portada' | 'logo' | 'galeria' | null>(null);

  // Impacto social (campos obligatorios)
  const [areasImpacto, setAreasImpacto] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState('');
  const [areaInputError, setAreaInputError] = useState<string | null>(null);
  const [anosOperacion, setAnosOperacion] = useState('');
  const [familiasAcompanadas, setFamiliasAcompanadas] = useState('');
  const [camposTocados, setCamposTocados] = useState<{ areas?: boolean; anos?: boolean; beneficiarios?: boolean }>({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const [mapQuery, setMapQuery] = useState('Colombia');

  const [canalesRecaudo, setCanalesRecaudo] = useState<CanalRecaudo[]>([]);
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);

  // Snapshot serializado de lo que está guardado en BD (null mientras carga)
  const [originalSnapshot, setOriginalSnapshot] = useState<string | null>(null);

  // Modales
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({ isOpen: false, title: '', message: '', confirmLabel: '', tone: 'danger', onConfirm: () => {} });
  const [confirmando, setConfirmando] = useState(false);

  const [canalModal, setCanalModal] = useState({ isOpen: false, isEdit: false, editIndex: -1, tipo: '', detalles: '', titular_nota: '' });
  const [necesidadModalAbierto, setNecesidadModalAbierto] = useState(false);

  const mostrarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const mostrarError = (title: string, message: string) =>
    setAlertModal({ isOpen: true, title, message, isError: true });

  const abrirConfirmacion = (opciones: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: opciones.title,
      message: opciones.message,
      confirmLabel: opciones.confirmLabel || 'Sí, Continuar',
      tone: opciones.tone || 'danger',
      onConfirm: opciones.onConfirm,
    });
  };

  const cerrarConfirmacion = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const ejecutarConfirmacion = async () => {
    setConfirmando(true);
    try {
      await confirmModal.onConfirm();
    } finally {
      setConfirmando(false);
      cerrarConfirmacion();
    }
  };

  // ==================== DETECCIÓN REAL DE CAMBIOS ====================
  const valoresActuales: FormValues = {
    razonSocial, sigla, nit, personeria, anoFundacion,
    descripcion, mision, vision,
    areasImpacto, anosOperacion, familiasAcompanadas,
    departamento, ciudad, localidad, direccionEntrega,
    whatsapp, telFijo, email, instagram, sitioWeb,
    portadaUrl, logoUrl, canalesRecaudo,
  };
  const snapshotActual = serializarFormulario(valoresActuales);
  const hasUnsavedChanges = originalSnapshot !== null && snapshotActual !== originalSnapshot;

  // Qué campos de impacto cambiaron respecto a lo guardado (para resaltarlos)
  const impactoOriginal = useMemo(() => {
    if (!originalSnapshot) return null;
    const v: FormValues = JSON.parse(originalSnapshot);
    return { areas: JSON.stringify(v.areasImpacto), anos: v.anosOperacion, beneficiarios: v.familiasAcompanadas };
  }, [originalSnapshot]);

  const impactoModificado = {
    areas: impactoOriginal !== null && JSON.stringify(areasImpacto) !== impactoOriginal.areas,
    anos: impactoOriginal !== null && anosOperacion !== impactoOriginal.anos,
    beneficiarios: impactoOriginal !== null && familiasAcompanadas !== impactoOriginal.beneficiarios,
  };

  // ==================== VALIDACIÓN DE CAMPOS DE IMPACTO ====================
  const erroresImpacto = useMemo(() => {
    const errores: { areas?: string; anos?: string; beneficiarios?: string } = {};

    if (areasImpacto.length === 0) {
      errores.areas = 'Agrega al menos un área de impacto.';
    }

    if (anosOperacion.trim() === '') {
      errores.anos = 'Indica los años de funcionamiento.';
    } else if (Number(anosOperacion) > MAX_ANOS_OPERACION) {
      errores.anos = `El valor máximo permitido es ${MAX_ANOS_OPERACION} años.`;
    } else if (/^\d{4}$/.test(anoFundacion) && Number(anosOperacion) > new Date().getFullYear() - Number(anoFundacion) + 1) {
      errores.anos = `No coincide con el año de fundación legal (${anoFundacion}).`;
    }

    if (familiasAcompanadas.trim() === '') {
      errores.beneficiarios = 'Indica la cantidad de beneficiarios.';
    } else if (Number(familiasAcompanadas) > MAX_BENEFICIARIOS) {
      errores.beneficiarios = 'La cantidad ingresada no es válida.';
    }

    return errores;
  }, [areasImpacto, anosOperacion, familiasAcompanadas, anoFundacion]);

  const mostrarErrorCampo = (campo: 'areas' | 'anos' | 'beneficiarios') =>
    (intentoGuardar || camposTocados[campo]) ? erroresImpacto[campo] : undefined;

  const tocarCampo = (campo: 'areas' | 'anos' | 'beneficiarios') =>
    setCamposTocados(prev => ({ ...prev, [campo]: true }));

  const handleAddArea = () => {
    const nueva = areaInput.trim().replace(/\s+/g, ' ');
    tocarCampo('areas');
    if (!nueva) {
      setAreaInputError('Escribe un área antes de agregarla.');
      return;
    }
    if (nueva.length > 40) {
      setAreaInputError('Máximo 40 caracteres por área.');
      return;
    }
    if (areasImpacto.some(a => a.toLowerCase() === nueva.toLowerCase())) {
      setAreaInputError(`"${nueva}" ya está agregada.`);
      return;
    }
    if (areasImpacto.length >= 8) {
      setAreaInputError('Puedes registrar máximo 8 áreas de impacto.');
      return;
    }
    setAreasImpacto([...areasImpacto, nueva]);
    setAreaInput('');
    setAreaInputError(null);
  };

  const handleRemoveArea = (tagToRemove: string) => {
    tocarCampo('areas');
    setAreasImpacto(areasImpacto.filter(tag => tag !== tagToRemove));
  };

  // Aviso del navegador al cerrar/recargar con cambios pendientes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // ==================== CARGA DE DATOS ====================
  const aplicarValores = (v: FormValues) => {
    setRazonSocial(v.razonSocial);
    setSigla(v.sigla);
    setNit(v.nit);
    setPersoneria(v.personeria);
    setAnoFundacion(v.anoFundacion);
    setDescripcion(v.descripcion);
    setMision(v.mision);
    setVision(v.vision);
    setAreasImpacto(v.areasImpacto);
    setAnosOperacion(v.anosOperacion);
    setFamiliasAcompanadas(v.familiasAcompanadas);
    setDepartamento(v.departamento);
    setCiudad(v.ciudad);
    setLocalidad(v.localidad);
    setDireccionEntrega(v.direccionEntrega);
    setWhatsapp(v.whatsapp);
    setTelFijo(v.telFijo);
    setEmail(v.email);
    setInstagram(v.instagram);
    setSitioWeb(v.sitioWeb);
    setPortadaUrl(v.portadaUrl);
    setLogoUrl(v.logoUrl);
    setCanalesRecaudo(v.canalesRecaudo);

    const queryUbicacion = [v.direccionEntrega, v.localidad, v.ciudad, v.departamento, 'Colombia']
      .filter(Boolean)
      .join(', ');
    setMapQuery(queryUbicacion);
  };

  const cargarDatosFundacion = async () => {
    setLoading(true);
    try {
      let query = supabase.from('fundaciones').select('*');

      // Sin id en la URL se edita la fundación del usuario logueado (fundaciones.id = auth.uid())
      const { data: { session } } = await supabase.auth.getSession();
      const idObjetivo = id || session?.user?.id;
      if (!idObjetivo) {
        setLoading(false);
        return;
      }
      query = query.eq('id', idObjetivo);

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener datos de Supabase:', error.message);
      } else if (data && data.length > 0) {
        const fund: FundacionData = data[0];
        const currentId = fund.id;
        setFoundationId(currentId);

        const valores: FormValues = {
          razonSocial: fund.nombre_legal || '',
          sigla: fund.sigla || '',
          nit: fund.nit || '',
          personeria: fund.personeria_juridica || '',
          anoFundacion: fund.ano_fundacion ? String(fund.ano_fundacion) : '',
          descripcion: fund.descripcion || '',
          mision: fund.mision || '',
          vision: fund.vision || '',
          areasImpacto: parsearAreas(fund.areas_impacto),
          anosOperacion: numeroATexto(fund.anos_operacion),
          familiasAcompanadas: numeroATexto(fund.familias_acompanadas),
          departamento: fund.departamento || '',
          ciudad: fund.ciudad || '',
          localidad: fund.localidad || '',
          direccionEntrega: fund.direccion_fisica || '',
          whatsapp: fund.telefono_whatsapp || '',
          telFijo: fund.telefono || '',
          email: fund.email_contacto || fund.email_institucional || '',
          instagram: fund.instagram || '',
          sitioWeb: fund.sitio_web || '',
          portadaUrl: fund.portada_url || fund.foto_portada_url || '',
          logoUrl: fund.logo_url || null,
          canalesRecaudo: Array.isArray(fund.canales_recaudo) ? fund.canales_recaudo : [],
        };

        aplicarValores(valores);
        setOriginalSnapshot(serializarFormulario(valores));
        setCamposTocados({});
        setIntentoGuardar(false);
        setAreaInput('');
        setAreaInputError(null);

        const [necRes, galRes] = await Promise.all([
          supabase
            .from('necesidades')
            .select('*')
            .eq('fundacion_id', currentId)
            .order('created_at', { ascending: false }),
          supabase
            .from('galeria_fundaciones')
            .select('*')
            .eq('fundacion_id', currentId),
        ]);

        if (necRes.error) {
          console.error('Error al obtener necesidades:', necRes.error.message);
        } else if (necRes.data) {
          setNecesidades(necRes.data);
        }

        if (galRes.error) {
          console.error('Error al obtener galería:', galRes.error.message);
        } else if (galRes.data) {
          setGaleria(galRes.data);
        }
      }
    } catch (err) {
      console.error('Error inesperado al conectar con Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // La carga asigna foundationId con el registro real
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga/sincronización con Supabase al montar o al cambiar el parámetro
    cargarDatosFundacion();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- debe ejecutarse solo al montar o al cambiar el id, no en cada render
  }, [id]);

  const handleUpdateMap = () => {
    const query = [direccionEntrega, localidad, ciudad, departamento, 'Colombia']
      .filter(item => item && item.trim() !== '')
      .join(', ');
    setMapQuery(query);
  };

  // ==================== IMÁGENES (PORTADA, LOGO Y GALERÍA) ====================
  const validarArchivoImagen = (file: File) => {
    if (!file.type.startsWith('image/')) {
      mostrarError('Formato no válido', `"${file.name}" no es una imagen. Usa archivos JPG, PNG o WEBP.`);
      return false;
    }
    if (file.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      mostrarError('Archivo muy grande', `"${file.name}" supera los ${MAX_ARCHIVO_MB}MB permitidos.`);
      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'portada' | 'logo') => {
    const file = e.target.files?.[0];
    // Permite volver a seleccionar el mismo archivo
    e.target.value = '';
    if (!file || !validarArchivoImagen(file)) return;

    const duenoId = foundationId || id;
    if (!duenoId) return;
    setProcesandoImagen(type);
    try {
      const imagen = type === 'portada'
        ? await subirImagen(duenoId, 'portada', file, 1920, 0.85)
        : await subirImagen(duenoId, 'logo', file, 600, 0.9);
      if (type === 'portada') {
        setPortadaUrl(imagen);
      } else {
        setLogoUrl(imagen);
      }
    } catch (e) {
      const err = e as { message?: string };
      mostrarError('No se pudo procesar la imagen', err.message || 'Intenta con otro archivo.');
    } finally {
      setProcesandoImagen(null);
    }
  };

  const handleGaleriaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const targetId = foundationId || id;
    if (!targetId) {
      mostrarError('Error', 'No hay una fundación vinculada para publicar fotografías.');
      return;
    }

    const disponibles = MAX_FOTOS_GALERIA - galeria.length;
    if (disponibles <= 0) {
      mostrarError('Galería completa', `Puedes publicar máximo ${MAX_FOTOS_GALERIA} fotografías. Elimina alguna para subir nuevas.`);
      return;
    }

    const validos = files.filter(validarArchivoImagen);
    if (validos.length === 0) return;
    const aSubir = validos.slice(0, disponibles);

    setProcesandoImagen('galeria');
    try {
      const filas = await Promise.all(aSubir.map(async (file) => ({
        fundacion_id: targetId,
        imagen_url: await subirImagen(targetId, 'galeria', file, 1600, 0.82),
        alt_texto: `Actividad de ${sigla || razonSocial || 'la fundación'}`,
      })));

      const { data, error } = await supabase.from('galeria_fundaciones').insert(filas).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No tienes permisos para publicar en la galería. Verifica las políticas RLS de galeria_fundaciones.');
      }

      setGaleria(prev => [...prev, ...data]);
      const omitidas = validos.length - aSubir.length;
      mostrarToast(omitidas > 0
        ? `Se publicaron ${data.length} fotos. ${omitidas} no se subieron por el límite de ${MAX_FOTOS_GALERIA}.`
        : `¡${data.length === 1 ? 'Fotografía publicada' : `${data.length} fotografías publicadas`} en tu perfil!`);
    } catch (e) {
      const err = e as { message?: string };
      mostrarError('Error al publicar fotografías', err.message || 'Error de conexión');
    } finally {
      setProcesandoImagen(null);
    }
  };

  const handleDeleteFoto = (foto: FotoGaleria) => {
    abrirConfirmacion({
      title: 'Eliminar fotografía',
      message: 'La fotografía dejará de mostrarse en tu perfil público. ¿Deseas eliminarla?',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        const { error } = await supabase.from('galeria_fundaciones').delete().eq('id', foto.id);
        if (error) {
          mostrarError('Error', 'No se pudo eliminar la fotografía: ' + error.message);
          return;
        }
        setGaleria(prev => prev.filter(f => f.id !== foto.id));
        await eliminarImagen(foto.imagen_url);
        mostrarToast('Fotografía eliminada.');
      },
    });
  };

  // ==================== GUARDADO ====================
  const handleSave = async () => {
    if (!hasUnsavedChanges || saving) return;

    setIntentoGuardar(true);
    const faltantes = [
      erroresImpacto.areas && '• Áreas de impacto',
      erroresImpacto.anos && '• Años de funcionamiento',
      erroresImpacto.beneficiarios && '• Cantidad de beneficiarios',
    ].filter(Boolean);

    if (faltantes.length > 0) {
      setActiveTab('causas');
      mostrarError(
        'Revisa los datos de impacto',
        `Corrige los siguientes campos en la pestaña "Causas & Misión" antes de guardar:\n${faltantes.join('\n')}`
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre_legal: razonSocial,
        sigla: sigla,
        nit: nit,
        personeria_juridica: personeria,
        ano_fundacion: anoFundacion,
        descripcion: descripcion,
        mision: mision,
        vision: vision,
        areas_impacto: areasImpacto,
        anos_operacion: Number(anosOperacion),
        familias_acompanadas: Number(familiasAcompanadas),
        departamento: departamento,
        ciudad: ciudad,
        localidad: localidad,
        direccion_fisica: direccionEntrega,
        telefono_whatsapp: whatsapp,
        telefono: telFijo,
        email_contacto: email,
        email_institucional: email,
        instagram: instagram,
        sitio_web: sitioWeb,
        portada_url: portadaUrl,
        foto_portada_url: portadaUrl,
        logo_url: logoUrl,
        canales_recaudo: canalesRecaudo
      };

      const targetId = foundationId || id;

      if (targetId) {
        const { data, error } = await supabase
          .from('fundaciones')
          .update(payload)
          .eq('id', targetId)
          .select('id');

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('La base de datos no aplicó los cambios. Verifica los permisos RLS de la tabla fundaciones.');
        }
      } else {
        const { data, error } = await supabase
          .from('fundaciones')
          .insert([payload])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setFoundationId(data[0].id);
        }
      }

      // Lo guardado pasa a ser la nueva referencia para detectar cambios
      setOriginalSnapshot(snapshotActual);
      setCamposTocados({});
      setIntentoGuardar(false);
      mostrarToast('¡Perfil actualizado con éxito en la base de datos!');
    } catch (e) {
      const err = e as { message?: string };
      console.error('Error al guardar en Supabase:', err);
      mostrarError('Error', 'Ocurrió un problema al guardar los cambios: ' + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    abrirConfirmacion({
      title: 'Descartar cambios',
      message: 'Se perderán todas las modificaciones que no has guardado. ¿Deseas continuar?',
      confirmLabel: 'Sí, descartar',
      onConfirm: async () => {
        await cargarDatosFundacion();
        mostrarToast('Cambios descartados. Se restauraron los datos originales.');
      },
    });
  };

  const handleVerPerfilPublico = () => {
    if (!hasUnsavedChanges) {
      navigate(`/fundacion/${foundationId}`);
      return;
    }
    abrirConfirmacion({
      title: 'Cambios sin guardar',
      message: 'Tienes cambios pendientes que no se verán en el perfil público hasta que los guardes. ¿Deseas salir sin guardar?',
      confirmLabel: 'Salir sin guardar',
      onConfirm: () => navigate(`/fundacion/${foundationId}`),
    });
  };

  // ==================== CANALES DE RECAUDO ====================
  const saveCanalFromModal = () => {
    if (!canalModal.tipo.trim() || !canalModal.detalles.trim()) {
      setAlertModal({ isOpen: true, title: 'Atención', message: 'Tipo de canal y detalles son obligatorios.', isError: true });
      return;
    }

    if (canalModal.isEdit && canalModal.editIndex >= 0) {
      const actualizados = [...canalesRecaudo];
      actualizados[canalModal.editIndex] = {
        ...actualizados[canalModal.editIndex],
        tipo: canalModal.tipo,
        detalles: canalModal.detalles,
        titular_nota: canalModal.titular_nota
      };
      setCanalesRecaudo(actualizados);
    } else {
      const nuevoCanal: CanalRecaudo = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        tipo: canalModal.tipo,
        icono: canalModal.tipo.toLowerCase().includes('nequi') ? 'movil' : canalModal.tipo.toLowerCase().includes('wompi') || canalModal.tipo.toLowerCase().includes('pse') ? 'computador' : 'banco',
        detalles: canalModal.detalles,
        titular_nota: canalModal.titular_nota,
        estado_texto: 'Activa',
        estado_color: 'text-[#047857]'
      };
      setCanalesRecaudo(prev => [...prev, nuevoCanal]);
    }

    setCanalModal({ isOpen: false, isEdit: false, editIndex: -1, tipo: '', detalles: '', titular_nota: '' });
  };

  const handleEditCanal = (index: number) => {
    const canal = canalesRecaudo[index];
    setCanalModal({ isOpen: true, isEdit: true, editIndex: index, tipo: canal.tipo, detalles: canal.detalles, titular_nota: canal.titular_nota });
  };

  // ==================== NECESIDADES ====================
  const handleNecesidadCreada = (nueva: Necesidad) => {
    setNecesidadModalAbierto(false);
    setNecesidades(prev => [nueva, ...prev]);
    mostrarToast('¡Necesidad publicada en tu perfil!');
  };

  const handleDeleteNecesidad = (nec: Necesidad) => {
    abrirConfirmacion({
      title: 'Eliminar necesidad',
      message: `¿Deseas eliminar la necesidad "${nec.titulo}"? Dejará de mostrarse en tu perfil público.`,
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('necesidades').delete().eq('id', nec.id);
          if (error) throw error;
          setNecesidades(prev => prev.filter(n => n.id !== nec.id));
          if (nec.completada && foundationId) await sincronizarNecesidadesResueltas(foundationId);
          mostrarToast('Necesidad eliminada.');
        } catch (e) {
      const err = e as { message?: string };
          mostrarError('Error', 'Error al eliminar: ' + err.message);
        }
      },
    });
  };

  const handleResolveNecesidad = (nec: Necesidad) => {
    const targetId = foundationId || id;
    if (!targetId) return;
    abrirConfirmacion({
      title: 'Marcar como resuelta',
      message: `"${nec.titulo}" quedará como resuelta con el 100% de recaudo y sumará a tus necesidades resueltas en el perfil público.`,
      confirmLabel: 'Sí, marcar resuelta',
      tone: 'primary',
      onConfirm: async () => {
        try {
          const actualizada = await marcarNecesidadResuelta(nec.id, targetId);
          setNecesidades(prev => prev.map(n => n.id === nec.id ? { ...n, ...actualizada } : n));
          mostrarToast('¡Necesidad marcada como resuelta!');
        } catch (e) {
      const err = e as { message?: string };
          mostrarError('Error', 'No se pudo actualizar el estado: ' + err.message);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#f8fafc] text-[#005684] font-bold gap-3">
        <div className="w-9 h-9 border-4 border-[#005684] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Cargando datos institucionales desde Supabase...</span>
      </div>
    );
  }

  // Garantizar que renderAreas sea siempre un array al momento de dibujar la vista
  const renderAreas = Array.isArray(areasImpacto) ? areasImpacto : [];

  return (
    <div className="flex min-h-svh w-full bg-[#f8fafc] text-[#2d3748] font-sans pb-24 relative">    
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-[#047857] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#6ee7b7] animate-bounce">
            <span className="text-lg"><Icon name="check" size="1.1em" /></span>
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-[#bbf7d0] flex items-center gap-1">
                  <Icon name="check" size="1.1em" /> Entidad Verificada
                </span>
                <span className="text-[11px] font-bold text-[#94a3b8]">
                  ID: {foundationId ? `FDN-${foundationId.substring(0, 40).toUpperCase()}` : 'SIN ID'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#071d37] mt-1 mb-1">
                Editar Perfil Institucional — <span className="text-[#005684]">{sigla || razonSocial || 'Sin Registro'}</span>
              </h1>
              <p className="text-[13px] text-[#64748b] max-w-3xl">
                Gestiona la identidad pública, datos bancarios autorizados y necesidades operativas mostradas a la comunidad.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
              <button 
                onClick={handleVerPerfilPublico}
                className="bg-white text-[#005684] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#eef6ff] transition flex items-center gap-2 border border-[#dbeafe] cursor-pointer"
              >
                Ver Perfil Público <Icon name="externo" size="1.1em" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                title={!hasUnsavedChanges ? 'No hay cambios por guardar' : undefined}
                className="bg-[#005684] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <span>Guardando...</span> : hasUnsavedChanges ? <><span><Icon name="check" size="1.1em" /></span> Guardar Cambios</> : <><span><Icon name="check" size="1.1em" /></span> Sin cambios</>}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-4">
             <button onClick={() => setActiveTab('basica')} className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === 'basica' ? 'bg-[#005684] text-white shadow-sm' : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
               <span><Icon name="carpeta" size="1.1em" /></span> Información Básica & Contacto
             </button>
             <button onClick={() => setActiveTab('causas')} className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === 'causas' ? 'bg-[#005684] text-white shadow-sm' : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
               <span><Icon name="objetivo" size="1.1em" /></span> Causas & Misión
               {intentoGuardar && Object.keys(erroresImpacto).length > 0 && (
                 <span className="w-2 h-2 rounded-full bg-red-500" title="Hay campos obligatorios por completar" />
               )}
             </button>
             <button onClick={() => setActiveTab('recaudo')} className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === 'recaudo' ? 'bg-[#005684] text-white shadow-sm' : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
               <span><Icon name="pago" size="1.1em" /></span> Canales de Recaudo & Donación
             </button>
             <button onClick={() => setActiveTab('documentos')} className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${activeTab === 'documentos' ? 'bg-[#005684] text-white shadow-sm' : 'bg-white text-[#64748b] hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
               <span><Icon name="seguridad" size="1.1em" />️</span> Documentación & Sellos
             </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
            <div className="flex flex-col gap-6">
              
              {activeTab === 'basica' && (
                <>
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base"><Icon name="imagen" size="1.1em" /></span> Identidad Gráfica Institucional
                      </h3>
                      <span className="text-[10px] text-[#64748b] font-bold">Aspect ratio 16:9 y 1:1</span>
                    </div>
                    
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-6 h-48 border border-[#e2e8f0]">
                      {portadaUrl ? (
                        <img src={portadaUrl} className="w-full h-full object-cover" alt="Portada" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400 font-bold">Sin foto de portada cargada</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <p className="text-white text-xs font-bold">Foto de Portada Principal</p>
                            <p className="text-white/80 text-[10px]">Resolución sugerida: 1920×1080px (Max 5MB)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {portadaUrl && (
                              <button type="button" onClick={() => setPortadaUrl('')} className="bg-black/40 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-black/60 transition cursor-pointer">
                                Quitar
                              </button>
                            )}
                            <input type="file" accept="image/png,image/jpeg,image/webp" id="portada-upload" className="hidden" disabled={procesandoImagen !== null} onChange={(e) => handleImageUpload(e, 'portada')} />
                            <label htmlFor="portada-upload" className="bg-white/90 text-[#071d37] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white transition cursor-pointer">
                              {procesandoImagen === 'portada' ? 'Procesando...' : <><Icon name="camara" size={14} /> {portadaUrl ? 'Cambiar Portada' : 'Subir Portada'}</>}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0] mb-6">
                      <div className="w-20 h-20 bg-white border border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center p-2 shadow-sm shrink-0 overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <>
                              <span className="text-2xl text-[#005684]"><Icon name="manana" size="1.1em" /></span>
                              <span className="text-[6px] font-bold text-[#071d37] mt-1 text-center leading-tight uppercase">{sigla || razonSocial || 'SIN LOGO'}</span>
                            </>
                          )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#071d37]">Logo Oficial / Emblema</h4>
                        <p className="text-[10px] text-[#64748b] mt-0.5 mb-2">Imagen de perfil visible en tu perfil público. PNG o JPG, mínimo 400x400 px (máx. {MAX_ARCHIVO_MB}MB).</p>
                        <div className="flex gap-3 items-center">
                          <input type="file" accept="image/png,image/jpeg,image/webp" id="logo-upload" className="hidden" disabled={procesandoImagen !== null} onChange={(e) => handleImageUpload(e, 'logo')} />
                          <label htmlFor="logo-upload" className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer">
                            {procesandoImagen === 'logo' ? 'Procesando...' : logoUrl ? 'Cambiar Logo' : 'Subir Nuevo Logo'}
                          </label>
                          {logoUrl && (
                            <button type="button" onClick={() => { setLogoUrl(null); }} className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer">
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Descripción Fundación</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-3 py-1.5 flex items-center gap-3">
                            <span className="text-[10px] text-[#94a3b8] ml-auto">{descripcion.length} / 600 caracteres</span>
                          </div>
                          <textarea 
                            value={descripcion} 
                            onChange={(e) => { setDescripcion(e.target.value); }} 
                            rows={4} 
                            placeholder="Escriba aquí la descripción institucional..."
                            className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-white leading-relaxed"
                          />
                        </div>
                    </div>
                  </section>

                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                          <span className="text-base"><Icon name="camara" size="1.1em" /></span> Galería de Actividades
                        </h3>
                        <p className="text-[10px] text-[#64748b] mt-1">
                          Las fotos se publican de inmediato en tu perfil público. {galeria.length}/{MAX_FOTOS_GALERIA} fotografías.
                        </p>
                      </div>
                      <div className="shrink-0">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          id="galeria-upload"
                          className="hidden"
                          disabled={procesandoImagen !== null || galeria.length >= MAX_FOTOS_GALERIA}
                          onChange={handleGaleriaUpload}
                        />
                        <label
                          htmlFor="galeria-upload"
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                            galeria.length >= MAX_FOTOS_GALERIA
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-[#eef6ff] text-[#005684] border-[#dbeafe] hover:bg-[#d4e7fe] cursor-pointer'
                          }`}
                        >
                          {procesandoImagen === 'galeria' ? 'Publicando...' : <><span>⊕</span> Subir Fotografías</>}
                        </label>
                      </div>
                    </div>

                    {galeria.length === 0 ? (
                      <label
                        htmlFor="galeria-upload"
                        className="border-2 border-dashed border-[#e2e8f0] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#f8fafc] cursor-pointer hover:border-[#005684] transition"
                      >
                        <span className="text-3xl mb-2"><Icon name="imagen" size="1.1em" /></span>
                        <p className="text-xs font-bold text-[#071d37]">Aún no has publicado fotografías</p>
                        <p className="text-[10px] text-[#64748b] mt-1">Selecciona una o varias imágenes desde tu dispositivo (JPG, PNG o WEBP, máx. {MAX_ARCHIVO_MB}MB c/u).</p>
                      </label>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {galeria.map((foto) => (
                          <div key={foto.id} className="group relative rounded-xl overflow-hidden bg-gray-100 border border-[#e2e8f0] aspect-[4/3]">
                            <img src={foto.imagen_url} alt={foto.alt_texto || 'Actividad en terreno'} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeleteFoto(foto)}
                              title="Eliminar fotografía"
                              className="absolute top-2 right-2 bg-white/90 text-red-600 w-7 h-7 rounded-lg text-xs font-bold shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                            >
                              <Icon name="eliminar" size="1.1em" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base"><Icon name="ubicacion" className="text-[#006194]" size="1.1em" /></span> Ubicación y Recepción de Ayudas
                      </h3>
                      <button onClick={handleUpdateMap} className="text-[10px] text-[#005684] font-bold bg-[#eef6ff] px-2 py-1 rounded-full flex items-center gap-1 hover:bg-[#dbeafe] transition cursor-pointer">
                        <span>⊕</span> Refrescar Mapa
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Departamento / Región</label>
                        <input type="text" value={departamento} onChange={(e) => { setDepartamento(e.target.value); }} onBlur={handleUpdateMap} placeholder="Ej: Cundinamarca" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Ciudad / Municipio</label>
                        <input type="text" value={ciudad} onChange={(e) => { setCiudad(e.target.value); }} onBlur={handleUpdateMap} placeholder="Ej: Bogotá D.C." className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Localidad / Sector</label>
                        <input type="text" value={localidad} onChange={(e) => { setLocalidad(e.target.value); }} onBlur={handleUpdateMap} placeholder="Ej: Ciudad Bolívar" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Dirección de Entrega</label>
                        <input type="text" value={direccionEntrega} onChange={(e) => { setDireccionEntrega(e.target.value); }} onBlur={handleUpdateMap} placeholder="Ej: Carrera 27B Bis # 71H - 14 Sur" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-64 border border-[#e2e8f0]">
                      <iframe title="Ubicación" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}></iframe>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'causas' && (
                <>
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base"><Icon name="objetivo" size="1.1em" /></span> Misión, Visión e Impacto Social
                      </h3>
                    </div>
                    
                    <div className="mb-5 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-bold text-[#071d37]">Datos de impacto visibles en tu perfil público</p>
                        <span className="text-[10px] text-[#94a3b8]"><span className="text-red-500">*</span> Obligatorios</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ÁREAS DE IMPACTO */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase mb-2 flex items-center gap-2">
                            <span>Áreas de impacto <span className="text-red-500">*</span></span>
                            {impactoModificado.areas && <span className="normal-case text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Modificado</span>}
                          </label>

                          <div className="flex gap-2 mb-1">
                            <input
                              type="text"
                              value={areaInput}
                              maxLength={40}
                              onChange={(e) => { setAreaInput(e.target.value); setAreaInputError(null); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddArea();
                                }
                              }}
                              placeholder="Ej: Educación, Salud... (Enter para agregar)"
                              className={`flex-1 bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#071d37] outline-none transition ${
                                areaInputError || mostrarErrorCampo('areas') ? 'border-red-400 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#005684]'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddArea}
                              className="bg-[#eef6ff] text-[#005684] px-4 py-2 rounded-xl text-xs font-bold border border-[#dbeafe] hover:bg-[#d4e7fe] transition cursor-pointer shrink-0"
                            >
                              Agregar
                            </button>
                          </div>
                          {areaInputError && <p className="text-[10px] font-semibold text-red-500 mb-1">{areaInputError}</p>}
                          {areaInput.trim() !== '' && !areaInputError && (
                            <p className="text-[10px] text-amber-600 mb-1">Presiona "Agregar" o Enter para incluir "{areaInput.trim()}".</p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {renderAreas.map((tag: string) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#e8f4fd] px-4 py-1.5 text-xs font-bold text-[#005684] flex items-center gap-2 group"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArea(tag)}
                                  className="text-[#005684] hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer font-bold"
                                  title="Quitar área"
                                >
                                  <Icon name="cerrar" size="1.1em" />
                                </button>
                              </span>
                            ))}
                            {renderAreas.length === 0 && !mostrarErrorCampo('areas') && (
                              <span className="text-[10px] text-[#94a3b8] italic">Agrega al menos un área de impacto.</span>
                            )}
                          </div>
                          {mostrarErrorCampo('areas') && <p className="text-[10px] font-semibold text-red-500 mt-2">{mostrarErrorCampo('areas')}</p>}
                        </div>

                        {/* AÑOS DE FUNCIONAMIENTO */}
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase mb-1 flex items-center gap-2">
                            <span>Años de funcionamiento <span className="text-red-500">*</span></span>
                            {impactoModificado.anos && <span className="normal-case text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Modificado</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={anosOperacion}
                              onChange={(e) => setAnosOperacion(soloDigitos(e.target.value, 3))}
                              onBlur={() => tocarCampo('anos')}
                              placeholder="Ej: 5"
                              className={`w-full bg-white border rounded-xl pl-3 pr-14 py-2 text-xs font-semibold text-[#071d37] outline-none transition ${
                                mostrarErrorCampo('anos') ? 'border-red-400 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#005684]'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#94a3b8]">años</span>
                          </div>
                          {mostrarErrorCampo('anos')
                            ? <p className="text-[10px] font-semibold text-red-500 mt-1">{mostrarErrorCampo('anos')}</p>
                            : <p className="text-[10px] text-[#94a3b8] mt-1">Se muestra como "Trayectoria" en el perfil público.</p>}
                        </div>

                        {/* CANTIDAD DE BENEFICIARIOS */}
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase mb-1 flex items-center gap-2">
                            <span>Cantidad de beneficiarios <span className="text-red-500">*</span></span>
                            {impactoModificado.beneficiarios && <span className="normal-case text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Modificado</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={familiasAcompanadas}
                              onChange={(e) => setFamiliasAcompanadas(soloDigitos(e.target.value, 7))}
                              onBlur={() => tocarCampo('beneficiarios')}
                              placeholder="Ej: 1200"
                              className={`w-full bg-white border rounded-xl pl-3 pr-24 py-2 text-xs font-semibold text-[#071d37] outline-none transition ${
                                mostrarErrorCampo('beneficiarios') ? 'border-red-400 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#005684]'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#94a3b8]">beneficiarios</span>
                          </div>
                          {mostrarErrorCampo('beneficiarios')
                            ? <p className="text-[10px] font-semibold text-red-500 mt-1">{mostrarErrorCampo('beneficiarios')}</p>
                            : <p className="text-[10px] text-[#94a3b8] mt-1">Se muestra como "Población Activa". Solo números, sin puntos.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Misión Institucional</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                          <textarea value={mision} onChange={(e) => { setMision(e.target.value); }} rows={4} placeholder="Escriba aquí la misión institucional..." className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-[#f8fafc] leading-relaxed" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-2">Visión 2030</label>
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden focus-within:border-[#005684] transition">
                          <textarea value={vision} onChange={(e) => { setVision(e.target.value); }} rows={3} placeholder="Escriba aquí la visión..." className="w-full p-3 text-xs text-[#071d37] outline-none resize-none bg-[#f8fafc] leading-relaxed" />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'recaudo' && (
                <>
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-[#005684]"><Icon name="pago" size="1.1em" /></span>
                        <h3 className="text-sm font-bold text-[#071d37] leading-tight">Canales de Recaudo Certificados</h3>
                      </div>
                      <span className="bg-[#eef6ff] text-[#005684] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-[#dbeafe] flex flex-col text-center leading-tight">
                        <span className="text-xs">{canalesRecaudo.length}</span> Canales
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3 mt-4">
                      {canalesRecaudo.length === 0 ? (
                        <p className="text-[11px] text-[#94a3b8] italic p-3 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">No hay cuentas o canales de recaudo vinculados.</p>
                      ) : (
                        canalesRecaudo.map((canal, idx) => (
                          <div key={canal.id || idx} className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base"><Icon name={iconoDesdeEmoji(canal.icono, 'pago')} size="1.1em" /></span>
                                <h4 className="text-[13px] font-bold text-[#071d37]">{canal.tipo}</h4>
                              </div>
                            </div>
                            <p className="text-xs text-[#64748b] ml-8">{canal.detalles}</p>
                            <div className="flex justify-between items-center mt-3 ml-8">
                              <p className="text-[10px] font-semibold text-[#94a3b8]">{canal.titular_nota}</p>
                              <button onClick={() => handleEditCanal(idx)} className="text-[11px] font-bold text-[#005684] hover:underline cursor-pointer bg-white px-3 py-1 rounded-lg border border-gray-200">
                                Editar Datos
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button onClick={() => setCanalModal({ isOpen: true, isEdit: false, editIndex: -1, tipo: '', detalles: '', titular_nota: '' })} className="w-full bg-[#eef6ff] text-[#005684] text-xs font-bold py-3 rounded-xl mt-5 hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2 border border-[#dbeafe] cursor-pointer">
                      <span>⊕</span> Vincular Otra Cuenta Bancaria o Pasarela
                    </button>
                  </section>
                </>
              )}

              {activeTab === 'documentos' && (
                <>
                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Icon name="documento" size={16} /> Documentos legales
                    </h3>
                    <p className="text-xs text-[#64748b] mb-4">
                      Son obligatorios para la aprobación. Se guardan al instante, no necesitas pulsar “Guardar cambios”.
                    </p>
                    {(foundationId || id) && <DocumentosFundacion fundacionId={foundationId || id} />}
                  </section>

                  <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm mb-6">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-5">
                      <span className="text-base"><Icon name="legal" size="1.1em" /></span> Datos Legales y Registro
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Razón Social Completa</label>
                        <input type="text" value={razonSocial} onChange={(e) => { setRazonSocial(e.target.value); }} placeholder="Ingrese la Razón Social" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sigla o Nombre Corto</label>
                          <input type="text" value={sigla} onChange={(e) => { setSigla(e.target.value); }} placeholder="Ej: Huellas" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1 flex items-center justify-between">
                            NIT / Registro Tributario
                            <span className="text-[#047857] flex items-center gap-1 normal-case"><span className="text-sm"><Icon name="check" size="1.1em" /></span> Validado DIAN</span>
                          </label>
                          <input type="text" value={nit} readOnly placeholder="No especificado" className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#64748b] outline-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Personería Jurídica</label>
                          <input type="text" value={personeria} onChange={(e) => { setPersoneria(e.target.value); }} placeholder="Ej: Res. 3844" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Año de Fundación Legal</label>
                          <input type="text" value={anoFundacion} onChange={(e) => { setAnoFundacion(e.target.value); }} placeholder="Ej: 2018" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="flex flex-col gap-6">
              
              {activeTab === 'basica' && (
                <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2 mb-4">
                        <span className="text-base"><Icon name="mensaje" size="1.1em" /></span> Contacto & Redes
                    </h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">WhatsApp Solidario</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><Icon name="mensaje" size="1.1em" /></span>
                            <input type="text" value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); }} placeholder="+57 300 000 0000" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Teléfono Fijo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><Icon name="telefono" size="1.1em" /></span>
                            <input type="text" value={telFijo} onChange={(e) => { setTelFijo(e.target.value); }} placeholder="601 000 0000" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Correo Donaciones</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon name="correo" size="1.1em" /></span>
                            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); }} placeholder="contacto@fundacion.org" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#071d37] outline-none transition" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Instagram</label>
                          <input type="text" value={instagram} onChange={(e) => { setInstagram(e.target.value); }} placeholder="@usuario" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase block mb-1">Sitio Web</label>
                          <input type="text" value={sitioWeb} onChange={(e) => { setSitioWeb(e.target.value); }} placeholder="https://..." className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#071d37] outline-none transition" />
                        </div>
                      </div>
                    </div>
                </section>
              )}

              {activeTab === 'causas' && (
                <section className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-[#005684] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-base"><Icon name="necesidad" size="1.1em" /></span> Necesidades
                    </h3>
                    <button onClick={() => setNecesidadModalAbierto(true)} className="text-[10px] font-bold text-[#005684] hover:bg-[#eef6ff] px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer">
                      <span>+</span> Añadir
                    </button>
                  </div>
                  <p className="text-[10px] text-[#64748b]">
                    {necesidades.filter(n => !n.completada).length} activas · {necesidades.filter(n => n.completada).length} resueltas
                  </p>

                  <div className="flex flex-col gap-3 mt-4">
                    {necesidades.length === 0 ? (
                      <p className="text-[11px] text-[#94a3b8] italic p-3 text-center bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">No hay necesidades registradas.</p>
                    ) : (
                      necesidades.slice(0, 5).map((nec) => {
                        const pct = porcentajeRecaudo(nec);
                        const isCompleted = !!nec.completada;
                        const estiloPrioridad = PRIORIDAD_ESTILOS[nec.prioridad || 'media'];
                        return (
                          <div key={nec.id} className={`p-3 rounded-xl flex flex-col gap-2 ${isCompleted ? 'bg-white border border-[#e2e8f0] opacity-70' : 'bg-[#f8fafc] border border-[#e2e8f0]'}`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-bold flex items-center gap-1 ${isCompleted ? 'text-[#64748b] line-through' : 'text-[#071d37]'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? 'bg-[#10b981]' : estiloPrioridad.barra}`}></span>
                                  <span className="truncate">{nec.titulo}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {!isCompleted && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${estiloPrioridad.chip}`}>{estiloPrioridad.label}</span>
                                  )}
                                  <span className="text-[9px] text-[#64748b] truncate">{nec.meta_texto || 'Sin meta especificada'}</span>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteNecesidad(nec)} title="Eliminar necesidad" className="text-[#94a3b8] hover:text-red-500 text-xs cursor-pointer"><Icon name="eliminar" size="1.1em" /></button>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isCompleted ? 'bg-[#10b981]' : estiloPrioridad.barra}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[9px] font-bold text-[#475569] w-8 text-right">{pct}%</span>
                            </div>

                            {!isCompleted ? (
                              <button onClick={() => handleResolveNecesidad(nec)} className="w-full mt-1 py-1.5 bg-[#dcfce7] text-[#166534] text-[9px] font-bold rounded-lg border border-[#bbf7d0] hover:bg-[#bbf7d0] transition cursor-pointer">
                                <Icon name="check" size="1.1em" /> Marcar como Resuelta
                              </button>
                            ) : (
                              <span className="w-full text-center bg-[#dcfce7] text-[#166534] text-[9px] font-bold px-2 py-1 mt-1 rounded-md">
                                <Icon name="check" size="1.1em" /> Resuelta{nec.fecha_resolucion ? ` el ${new Date(nec.fecha_resolucion).toLocaleDateString('es-CO')}` : ''}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <Link
                    to={`/dashboard/fundacion/necesidades/${foundationId ?? ''}`}
                    className="w-full mt-4 py-2.5 rounded-xl bg-[#eef6ff] text-[#005684] text-xs font-bold border border-[#dbeafe] hover:bg-[#d4e7fe] transition flex justify-center items-center gap-2"
                  >
                    Gestionar necesidades{necesidades.length > 5 ? ` (${necesidades.length})` : ''} →
                  </Link>
                </section>
              )}

              {(activeTab === 'recaudo' || activeTab === 'documentos') && (
                <div className="bg-gradient-to-br from-[#f8fafc] to-[#eef6ff] p-6 rounded-3xl border border-[#dbeafe] text-center shadow-sm">
                    <span className="text-3xl mb-2 block"><Icon name="idea" size="1.1em" /></span>
                    <h4 className="text-[13px] font-bold text-[#071d37] mt-2">Transparencia</h4>
                    <p className="text-[11px] text-[#64748b] mt-2 leading-relaxed">
                      Mantener la documentación legal y los canales actualizados aumenta el <strong>nivel de confianza</strong> en un 80% frente a los donantes.
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SNACKBAR FLOTANTE (CAMBIOS SIN GUARDAR) */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up px-4 w-full max-w-2xl">
            <div className="bg-[#0f2a3f] text-white rounded-2xl p-4 pr-5 shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border border-[#1e3a8a] w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-full bg-[#0284c7]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <span className="text-lg"><Icon name="formulario" size="1.1em" /></span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tienes cambios pendientes de publicación</p>
                  <p className="text-[11px] text-[#94a3b8]">Las actualizaciones impactarán inmediatamente tu ficha institucional pública.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto shrink-0 w-full sm:w-auto justify-end">
              <button 
                onClick={handleDiscard}
                className="text-xs font-bold text-[#cbd5e1] hover:text-white px-3 py-2 transition cursor-pointer"
              >
                Descartar
              </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#005684] hover:bg-[#00456a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 border border-[#0284c7] cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= MODALES GLOBALES ======================= */}

        {/* MODAL: Alertas / Errores */}
        {alertModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
              <span className={`text-4xl mb-3 ${alertModal.isError ? 'text-red-500' : 'text-blue-500'}`}>
                <Icon name={alertModal.isError ? 'advertencia' : 'info'} size={40} />
              </span>
              <h3 className="text-lg font-bold text-[#071d37] mb-2">{alertModal.title}</h3>
              <p className="text-xs text-[#64748b] mb-6 whitespace-pre-line text-left">{alertModal.message}</p>
              <button onClick={() => setAlertModal({ ...alertModal, isOpen: false })} className="w-full bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition cursor-pointer">
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* MODAL: Confirmaciones */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
              <span className="text-4xl mb-3 text-orange-500"><Icon name={confirmModal.tone === 'primary' ? 'completado' : 'ayuda'} size={40} /></span>
              <h3 className="text-lg font-bold text-[#071d37] mb-2">{confirmModal.title || 'Confirmar Acción'}</h3>
              <p className="text-xs text-[#64748b] mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 w-full">
                <button onClick={cerrarConfirmacion} disabled={confirmando} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  onClick={ejecutarConfirmacion}
                  disabled={confirmando}
                  className={`flex-1 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${confirmModal.tone === 'primary' ? 'bg-[#047857] hover:bg-[#065f46]' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {confirmando ? 'Procesando...' : confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Crear/Editar Canal de Recaudo */}
        {canalModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold text-[#071d37] mb-4">{canalModal.isEdit ? 'Editar Canal de Recaudo' : 'Añadir Nuevo Canal'}</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Tipo de Canal / Banco *</label>
                  <input type="text" value={canalModal.tipo} onChange={e => setCanalModal({...canalModal, tipo: e.target.value})} placeholder="Ej: Bancolombia, Nequi..." className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Detalles de la cuenta *</label>
                  <input type="text" value={canalModal.detalles} onChange={e => setCanalModal({...canalModal, detalles: e.target.value})} placeholder="Ej: Cuenta de Ahorros #12345678" className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase block mb-1">Titular / Nota Adicional</label>
                  <input type="text" value={canalModal.titular_nota} onChange={e => setCanalModal({...canalModal, titular_nota: e.target.value})} placeholder="Ej: A nombre de la Fundación..." className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#005684] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
                </div>
              </div>
              <div className="flex gap-3 w-full mt-6">
                <button onClick={() => setCanalModal({ ...canalModal, isOpen: false })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition">Cancelar</button>
                <button onClick={saveCanalFromModal} className="flex-1 bg-[#005684] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#00456a] transition">Guardar Canal</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Crear Necesidad (mismo formulario que Gestionar necesidades) */}
        {necesidadModalAbierto && (foundationId || id) && (
          <NeedFormModal
            fundacionId={(foundationId || id) as string}
            onClose={() => setNecesidadModalAbierto(false)}
            onSaved={handleNecesidadCreada}
          />
        )}
    </div>
  );
}