
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIncidentsRealtime = () => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('New incident inserted:', payload);
          const incidentNumber = payload.new?.incident_number || 'Unknown';
          toast({
            title: "Info",
            description: `${incidentNumber} just added`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('Incident updated:', payload);
          const incidentNumber = payload.new?.incident_number || 'Unknown';
          toast({
            title: "Info",
            description: `${incidentNumber} just updated`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('Incident deleted:', payload);
          const incidentNumber = payload.old?.incident_number || 'Unknown';
          toast({
            title: "Info",
            description: `${incidentNumber} just deleted`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
};
