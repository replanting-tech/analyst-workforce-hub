
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RequestChange {
  id: string;
  incident_number: string;
  jira_ticket_id: string;
  analyst_id: string;
  analyst_name: string;
  assets: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useRequestChanges = (incidentNumber?: string, userRole?: string, analystID?: string) => {
  return useQuery({
    queryKey: ['request-changes', incidentNumber],
    queryFn: async () => {
      let query = supabase
        .from('request_changes')
        .select(`
          id,
          incident_number,
          jira_ticket_id,
          analyst_id,
          assets,
          status,
          created_at,
          updated_at,
          analysts (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (incidentNumber) {
        query = query.eq('incident_number', incidentNumber);
      }

      if (userRole === 'L1') {
        query = query.eq('analyst_id', analystID);
      }

      const { data: requestChanges, error: requestError } = await query;

      if (requestError) {
        console.error('Error fetching request changes:', requestError);
        throw requestError;
      }

      return requestChanges.map(request => ({
        id: request.id.toString(),
        incident_number: request.incident_number,
        jira_ticket_id: request.jira_ticket_id,
        analyst_id: request.analyst_id,
        analyst_name: request.analysts.name,
        assets: request.assets,
        status: request.status,
        created_at: request.created_at,
        updated_at: request.updated_at,
      })) || [];
    },
  });
};

export const useUpdateRequestChangeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('request_changes')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', Number(id)) // Ensure ID is treated as a number
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['request-changes', data.incident_number] });
    },
  });
};
