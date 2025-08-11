
import { useQuery } from '@tanstack/react-query';
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
      const { data, error } = await supabase
        .rpc('get_allowed_status_transitions', { current_status: currentStatus });

      if (error) {
        console.error('Error fetching status transitions:', error);
        throw error;
      }

      return data as StatusTransition[];
    },
    enabled: !!currentStatus,
  });
};

export const updateIncidentStatusWithValidation = async (
  incidentId: string,
  newStatus: string,
  analystCode?: string,
  changeReason?: string,
  changedBy?: string
) => {
  const { data, error } = await supabase
    .rpc('update_incident_status_with_validation', {
      p_incident_id: incidentId,
      p_new_status: newStatus,
      p_analyst_code: analystCode,
      p_change_reason: changeReason,
      p_changed_by: changedBy,
    });

  if (error) {
    console.error('Error updating incident status:', error);
    throw error;
  }

  return data;
};
