
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  incident_id: string;
  incident_number: string;
  customer_id?: string; // Made optional since it's not in v_incident_sla_details
  customer_name: string;
  workspace_name: string;
  analyst_code: string | null;
  analyst_name: string | null;
  analyst_email?: string | null; // Made optional since it's not in v_incident_sla_details
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
  entities?: string[];
  tags?: string[];
  comments?: string[];
}

interface UseIncidentsOptions {
  userRole?: string | null;
  analystCode?: string | null;
}

export const useIncidents = ({ userRole, analystCode }: UseIncidentsOptions = {}) => {
  return useQuery({
    queryKey: ['incidents', { userRole, analystCode }],
    queryFn: async () => {
      let query = supabase
        .from('v_incident_sla_details')
        .select('*');
      
      // For L1 users, only show their assigned incidents
      if (userRole === 'L1' && analystCode) {
        query = query.eq('analyst_code', analystCode);
      }
      
      // For L2 and L3, show all incidents (no additional filtering needed)
      // L1 without analyst code will see no incidents
      
      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }

      return data as unknown as Incident[];
    },
  });
};

export const useIncidentById = (incidentId: string) => {
  return useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      // First try to get from the view with all details
      const { data: viewData, error: viewError } = await supabase
        .from('v_incident_sla_details')
        .select('*')
        .eq('incident_id', incidentId)
        .single();

      if (!viewError) {
        return viewData as unknown as Incident;
      }

      // If not found in the view, try the base table as fallback
      console.warn('Incident not found in view, trying base table...');
      const { data: tableData, error: tableError } = await supabase
        .from('incidents')
        .select('*')
        .eq('incident_id', incidentId)
        .single();

      if (tableError) {
        console.error('Error fetching incident:', tableError);
        throw tableError;
      }

      return tableData as unknown as Incident;
    },
    enabled: !!incidentId,
    retry: 1, // Retry once in case of network errors
    refetchOnWindowFocus: false,
  });
};
