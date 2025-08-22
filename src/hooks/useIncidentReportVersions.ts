import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface IncidentReportVersion {
  id: string;
  incident_id: string;
  version_number: number;
  content: string; // This will store the combined JSON of reportDisplayData and enrichmentData
  content_html: string; // New field for storing the HTML content of the report
  template_id: string | null;
  created_by: string | null;
  created_at: string;
  is_current: boolean;
  change_summary: string | null;
}

// Hook to fetch the current incident report version
export const useCurrentIncidentReportVersion = (incidentId: string) => {
  return useQuery<IncidentReportVersion | null, Error>({
    queryKey: ['incidentReportVersion', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_report_versions')
        .select('*, content_html') // Explicitly select content_html
        .eq('incident_id', incidentId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw new Error(`Error fetching current incident report version: ${error.message}`);
      }
      return data || null;
    },
    enabled: !!incidentId,
  });
};

// Hook to save or update an incident report version
export const useSaveIncidentReportVersion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<IncidentReportVersion, Error, { incidentId: string; content: string; content_html: string; templateId?: string | null; createdBy?: string | null; changeSummary?: string | null }>({
    mutationFn: async ({ incidentId, content, content_html, templateId = null, createdBy = null, changeSummary = null }) => {
      // First, set the current version (if any) to is_current = false
      await supabase
        .from('incident_report_versions')
        .update({ is_current: false })
        .eq('incident_id', incidentId)
        .eq('is_current', true);

      // Get the latest version number for this incident
      const { data: latestVersionData, error: latestVersionError } = await supabase
        .from('incident_report_versions')
        .select('version_number')
        .eq('incident_id', incidentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (latestVersionError && latestVersionError.code !== 'PGRST116') {
        throw new Error(`Error fetching latest version number: ${latestVersionError.message}`);
      }

      const newVersionNumber = (latestVersionData?.version_number || 0) + 1;

      // Insert the new current version
      const { data, error } = await supabase
        .from('incident_report_versions')
        .insert({
          incident_id: incidentId,
          version_number: newVersionNumber,
          content,
          content_html,
          template_id: templateId,
          created_by: createdBy,
          change_summary: changeSummary,
          is_current: true,
        })
        .select('*, content_html') // Explicitly select content_html
        .single();

      if (error) {
        throw new Error(`Error saving incident report version: ${error.message}`);
      }
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidentReportVersion', variables.incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incident', variables.incidentId] }); // Invalidate incident query to refetch updated data
      toast({
        title: "Success",
        description: `Report version ${data.version_number} saved successfully.`,
      });
    },
    onError: (error) => {
      console.error("Error saving report version:", error);
      toast({
        title: "Error",
        description: `Failed to save report version: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};