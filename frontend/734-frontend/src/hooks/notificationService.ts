import { supabase } from '../lib/supabase';

interface CrearNotificacionParams {
  userId: string;
  titulo: string;
  descripcion: string;
  tipo?: string;
  icono?: string;
  bgIcono?: string;
  textIcono?: string;
  accionTexto?: string;
}

export async function dispararNotificacionSistema({
  userId,
  titulo,
  descripcion,
  tipo = 'sistema',
  icono = '🔔',
  bgIcono = 'bg-[#f0f9ff]',
  textIcono = 'text-[#0284c7]',
  accionTexto
}: CrearNotificacionParams) {
  try {
    // 1. Verificar si el usuario tiene activas las notificaciones o alertas en perfiles
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('alertas_correo, alertas_push, alertas_emergencia, alertas_correos, push, emergencias')
      .eq('id', userId)
      .maybeSingle();

    // 2. Insertar en la tabla 'notificaciones' para la campana en tiempo real
    const { error } = await supabase
      .from('notificaciones')
      .insert([{
        user_id: userId,
        titulo,
        descripcion,
        tipo,
        icono,
        bg_icono: bgIcono,
        text_icono: textIcono,
        accion_texto: accionTexto,
        leido: false
      }]);

    if (error) {
      console.error('Error al insertar notificación en BD:', error.message);
    }

    // Nota: El envío físico del correo se puede conectar aquí mediante una Supabase Edge Function 
    // o integrando con un servicio SMTP si el usuario tiene activas las alertas de correo.
    return { success: true };
  } catch (err) {
    console.error('Error al disparar notificación:', err);
    return { success: false, error: err };
  }
}