
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
  title?: string; // Added for report display
  description?: string; // Added for report display
  recommendation?: string; // Added for report display
  threat_type?: string | null; // Added for L3 dashboard
  action_taken?: string; // Added for report display
  log_source?: string; // Added for report display
  severity?: string; // Added for report display
  threat_indicator?: {
    ip?: {
      address?: string;
      details?: {
        isp?: string;
        country?: string;
        reputation?: string;
        total_reports?: number;
        reported_abuse?: string[];
        abuse_confidence?: string;
        detections_ratio?: string;
      };
      analysis?: string;
    };
    hash?: {
      value?: string;
      analysis?: string;
    };
    domain?: {
      name?: string;
      analysis?: string;
    };
  };
}

interface UseIncidentsOptions {
  userRole?: string | null;
  analystCode?: string | null;
  analystFilter?: string | null; // Add analystFilter option
  dateFilter?: string | null; // Add dateFilter option
}

export const useIncidents = ({ userRole, analystCode, analystFilter, dateFilter }: UseIncidentsOptions = {}) => {
  // Set default dateFilter to today if not provided
  const today = new Date().toISOString().split('T')[0];
  const effectiveDateFilter = dateFilter === undefined ? today : dateFilter;
  
  return useQuery({
    queryKey: ['incidents', { userRole, analystCode, analystFilter, dateFilter: effectiveDateFilter }], // Add analystFilter and dateFilter to queryKey
    queryFn: async () => {
      let query = supabase
        .from('v_incident_sla_details')
        .select('*');
      
      // For L1 users, only show their assigned incidents
      if (userRole === 'L1' && analystCode) {
        query = query.eq('analyst_code', analystCode);
      }
      
      // Apply analystFilter if provided and not 'all'
      if (analystFilter && analystFilter !== 'all') {
        query = query.eq('analyst_code', analystFilter);
      }
      
      // Apply date filter if provided
      if (effectiveDateFilter) {
        // Filter incidents created on the specified date
        const startDate = new Date(effectiveDateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(effectiveDateFilter);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.gte('creation_time', startDate.toISOString())
                 .lte('creation_time', endDate.toISOString());
      }
      
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
