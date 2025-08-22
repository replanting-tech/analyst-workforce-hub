
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IncidentReportVersion } from '@/hooks/useIncidentReportVersions'; // Import IncidentReportVersion

export const useCustomerReports = (incidentID?: string) => {
  return useQuery<IncidentReportVersion[], Error>({
    queryKey: ['customer-reports', incidentID],
    queryFn: async () => {
      if (!incidentID) return [];
      
      const { data, error } = await supabase
        .from('incident_report_versions')
        .select(`
          id,
          incident_id,
          version_number,
          content,
          content_html,
          template_id,
          created_by,
          created_at,
          is_current,
          change_summary
        `)
        .eq('incident_id', incidentID)
        .eq('is_current', true)
        .order('created_at', { ascending: false });

        console.log('Fetched customer reports:', data);

      if (error) {
        console.error('Error fetching customer reports:', error);
        throw error;
      }

      return data as unknown as IncidentReportVersion[];
    },
    enabled: !!incidentID,
  });
};
