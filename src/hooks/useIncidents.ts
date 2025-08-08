
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  incident_id: string;
  incident_number: string;
  customer_id: string;
  customer_name: string;
  workspace_name: string;
  analyst_code: string | null;
  analyst_name: string | null;
  analyst_email: string | null;
  priority: string;
  creation_time: string;
  sla_target_time: string | null;
  status: string;
  sla_status: string;
  sla_remaining_seconds: number;
  sla_remaining_formatted: string;
  closed_time: string | null;
  jira_ticket_id: string | null;
  customer_notification: string;
  resolution_minutes: number;
  created_at: string;
  updated_at: string;
  incident_url?: string;
  raw_logs?: string;
  incident_classification?: string | null;
}

export const useIncidents = () => {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_incident_sla_details')
        .select('*')
        .limit(10)
        .order('creation_time', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }

      return data as Incident[];
    },
  });
};

export const useIncidentById = (incidentId: string) => {
  return useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_incident_sla_details')
        .select('*')
        .limit(10)
        .eq('incident_id', incidentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching incident:', error);
        throw error;
      }

      return data as Incident | null;
    },
    enabled: !!incidentId,
  });
};
