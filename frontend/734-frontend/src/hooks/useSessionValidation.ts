import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SesionUsuario {
  id: string;
  es_actual: boolean;
}

export function useSessionValidation(isUserLoggedIn: boolean = true) {
  const navigate = useNavigate();
  const [modalExpulsion, setModalExpulsion] = useState(false);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    const dbSessionId = localStorage.getItem('db_session_id');
    if (!dbSessionId) return;

    const ejecutarExpulsion = () => {
      localStorage.removeItem('db_session_id');
      setModalExpulsion(true);
    };

    const verificarSesionInicial = async () => {
      const { data, error } = await supabase
        .from('sesiones_usuario')
        .select('id, es_actual')
        .eq('id', dbSessionId)
        .maybeSingle();

      if (error || !data || data.es_actual === false) {
        ejecutarExpulsion();
      }
    };

    verificarSesionInicial();

    const channel: RealtimeChannel = supabase
      .channel(`sesion_val_${dbSessionId}`)
      .on<SesionUsuario>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sesiones_usuario',
          filter: `id=eq.${dbSessionId}`
        },
        async (payload) => {
          const fueDesactivada = payload.new && 'es_actual' in payload.new && payload.new.es_actual === false;
          const fueEliminada = payload.eventType === 'DELETE';

          if (fueDesactivada || fueEliminada) {
            ejecutarExpulsion();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUserLoggedIn]);

  const handleAceptarExpulsion = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setModalExpulsion(false);
    navigate('/login', { replace: true });
  };

  return { modalExpulsion, handleAceptarExpulsion };
}