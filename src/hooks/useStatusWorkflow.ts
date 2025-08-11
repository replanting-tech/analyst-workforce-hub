
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusTransition {
  to_status: string;
  transition_name: string;
  requires_approval: boolean;
}

export const useStatusWorkflow = (currentStatus: string) => {
  return useQuery({
    queryKey: ['status-workflow', currentStatus],
    queryFn: async () => {
      // For now, return hardcoded transitions since the table might not exist yet
      const transitions: StatusTransition[] = [
        { to_status: 'incident', transition_name: 'Reopen as Incident', requires_approval: false },
        { to_status: 'incident_closed', transition_name: 'Close Incident', requires_approval: true },
        { to_status: 'false_positive_closed', transition_name: 'Close as False Positive', requires_approval: false },
      ];

      // Filter based on current status
      if (currentStatus === 'open') {
        return transitions.filter(t => t.to_status === 'incident');
      } else if (currentStatus === 'incident') {
        return transitions.filter(t => ['incident_closed', 'false_positive_closed'].includes(t.to_status));
      } else {
        return transitions.filter(t => t.to_status === 'incident');
      }
    },
    enabled: !!currentStatus,
  });
};

export const useUpdateIncidentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ incidentId, newStatus }: { incidentId: string; newStatus: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus.includes('closed') ? { closed_time: new Date().toISOString() } : {})
        })
        .eq('incident_id', incidentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident'] });
    },
  });
};
