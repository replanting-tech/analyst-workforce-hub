
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  template_content: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportVersion {
  id: string;
  incident_id: string;
  version_number: number;
  content: string;
  template_id?: string;
  created_by?: string;
  created_at: string;
  is_current: boolean;
  change_summary?: string;
}

export const useReportTemplates = () => {
  return useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_report_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching report templates:', error);
        throw error;
      }

      return data as ReportTemplate[];
    },
  });
};

export const useReportVersions = (incidentId: string) => {
  return useQuery({
    queryKey: ['report-versions', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_report_versions')
        .select('*')
        .eq('incident_id', incidentId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching report versions:', error);
        throw error;
      }

      return data as ReportVersion[];
    },
    enabled: !!incidentId,
  });
};

export const useCurrentReportVersion = (incidentId: string) => {
  return useQuery({
    queryKey: ['current-report-version', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_report_versions')
        .select('*')
        .eq('incident_id', incidentId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current report version:', error);
        throw error;
      }

      return data as ReportVersion | null;
    },
    enabled: !!incidentId,
  });
};

export const useSaveReportVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      content,
      templateId,
      changeSummary,
      createdBy = 'analyst'
    }: {
      incidentId: string;
      content: string;
      templateId?: string;
      changeSummary?: string;
      createdBy?: string;
    }) => {
      // First, get the current version number
      const { data: versions } = await supabase
        .from('incident_report_versions')
        .select('version_number')
        .eq('incident_id', incidentId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      // Mark all previous versions as not current
      await supabase
        .from('incident_report_versions')
        .update({ is_current: false })
        .eq('incident_id', incidentId);

      // Create new version
      const { data, error } = await supabase
        .from('incident_report_versions')
        .insert({
          incident_id: incidentId,
          version_number: nextVersion,
          content,
          template_id: templateId,
          created_by: createdBy,
          change_summary: changeSummary,
          is_current: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving report version:', error);
        throw error;
      }

      return data as ReportVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-versions', variables.incidentId] });
      queryClient.invalidateQueries({ queryKey: ['current-report-version', variables.incidentId] });
    },
  });
};

export const useRestoreReportVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ incidentId, versionId }: { incidentId: string; versionId: string }) => {
      // Get the version to restore
      const { data: versionToRestore, error: fetchError } = await supabase
        .from('incident_report_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError) {
        console.error('Error fetching version to restore:', fetchError);
        throw fetchError;
      }

      // Mark all versions as not current
      await supabase
        .from('incident_report_versions')
        .update({ is_current: false })
        .eq('incident_id', incidentId);

      // Mark the selected version as current
      const { data, error } = await supabase
        .from('incident_report_versions')
        .update({ is_current: true })
        .eq('id', versionId)
        .select()
        .single();

      if (error) {
        console.error('Error restoring version:', error);
        throw error;
      }

      return data as ReportVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-versions', variables.incidentId] });
      queryClient.invalidateQueries({ queryKey: ['current-report-version', variables.incidentId] });
    },
  });
};
