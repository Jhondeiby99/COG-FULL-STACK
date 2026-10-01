import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notificacion {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  icono?: string;
  bg_icono?: string;
  text_icono?: string;
  accion_texto?: string | null;
  leido: boolean;
  created_at: string;
}

interface UseNotificationsOptions {
  limit?: number;
}

export function useNotifications(userId?: string | null, options: UseNotificationsOptions = {}) {
  const { limit } = options;
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
 
  // Cargar notificaciones iniciales desde Supabase
  const cargarNotificaciones = useCallback(async () => {
    if (!userId) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotificaciones(data as Notificacion[]);
    }
    setLoading(false);
  }, [userId, limit]);

  // Suscripci�n Realtime y ciclo de vida
  useEffect(() => {
  cargarNotificaciones();

  if (!userId) return;

  // Sufijo �nico por instancia para evitar reutilizar canales activos durante re-renders
  const channelName = `notificaciones_realtime_${userId}_${Date.now()}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on<Notificacion>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const nuevaNotif = payload.new as Notificacion;
          setNotificaciones((prev) => {
            const existe = prev.some((n) => n.id === nuevaNotif.id);
            if (existe) return prev;
            const lista = [nuevaNotif, ...prev];
            return limit ? lista.slice(0, limit) : lista;
          });
        } else if (payload.eventType === 'UPDATE') {
          const notifActualizada = payload.new as Notificacion;
          setNotificaciones((prev) =>
            prev.map((n) => (n.id === notifActualizada.id ? notifActualizada : n))
          );
        } else if (payload.eventType === 'DELETE') {
          const idEliminado = payload.old.id;
          setNotificaciones((prev) => prev.filter((n) => n.id !== idEliminado));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId, cargarNotificaciones, limit]);

  // Funci�n para marcar como le�das (actualizaci�n optimista + sync con la BD)
  const marcarComoLeidas = useCallback(async (ids?: string[]) => {
    if (!userId) return;

    const idsAActualizar = ids || notificaciones.filter((n) => !n.leido).map((n) => n.id);
    if (idsAActualizar.length === 0) return;

    setNotificaciones((prev) =>
      prev.map((n) => (idsAActualizar.includes(n.id) ? { ...n, leido: true } : n))
    );

    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .in('id', idsAActualizar);

    if (error) {
      console.error('Error al actualizar notificaciones:', error);
      cargarNotificaciones();
    }
  }, [userId, notificaciones, cargarNotificaciones]);

  const unreadCount = notificaciones.filter((n) => !n.leido).length;

  return {
    notificaciones,
    unreadCount,
    loading,
    refetch: cargarNotificaciones,
    marcarComoLeidas
  };
}