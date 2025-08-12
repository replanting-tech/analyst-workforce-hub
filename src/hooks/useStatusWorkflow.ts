
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusTransition {
  to_status: string;
  transition_name: string;
  requires_approval: boolean;
}

export const useStatusTransitions = (currentStatus: string) => {
  return useQuery({
    queryKey: ['status-transitions', currentStatus],
    queryFn: async () => {
      // For now, return mock data since the RPC function doesn't exist yet
      const mockTransitions: StatusTransition[] = [
        { to_status: 'incident', transition_name: 'Mark as Incident', requires_approval: false },
        { to_status: 'false_positive_closed', transition_name: 'Close as False Positive', requires_approval: false },
        { to_status: 'incident_closed', transition_name: 'Close Incident', requires_approval: false },
      ];
      
      return mockTransitions.filter(t => t.to_status !== currentStatus);
    },
    enabled: !!currentStatus,
  });
};

export const updateIncidentStatusWithValidation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      newStatus,
      analystCode,
      jiraTicketId,
      customerNotification,
      changedBy,
      changeReason
    }: {
      incidentId: string;
      newStatus?: string;
      analystCode?: string;
      jiraTicketId?: string;
      customerNotification?: string;
      changedBy?: string;
      changeReason?: string;
    }) => {
      // For now, use direct table update since RPC function doesn't exist
      const updateData: any = {};
      
      if (newStatus) updateData.status = newStatus;
      if (jiraTicketId) updateData.jira_ticket_id = jiraTicketId;
      if (customerNotification) updateData.customer_notification = customerNotification;
      if (newStatus === 'incident_closed' || newStatus === 'false_positive_closed') {
        updateData.closed_time = new Date().toISOString();
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('incident_id', incidentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating incident status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident'] });
    },
  });
};
