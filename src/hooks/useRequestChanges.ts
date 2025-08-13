
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RequestChangeIndicator {
  id: string;
  type: string;
  value: string;
  description: string;
  status: string;
  created_at: string;
}

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
  indicators: RequestChangeIndicator[];
}

export const useRequestChanges = (incidentNumber?: string) => {
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

      const { data: requestChanges, error: requestError } = await query;

      if (requestError) {
        console.error('Error fetching request changes:', requestError);
        throw requestError;
      }

      // Get indicators for each request change
      const requestChangesWithIndicators = await Promise.all(
        requestChanges.map(async (request) => {
          const { data: indicators, error: indicatorsError } = await supabase
            .from('request_changes_indicators')
            .select('*')
            .eq('request_changes_id', request.id);

          if (indicatorsError) {
            console.error('Error fetching indicators:', indicatorsError);
            return {
              id: request.id.toString(),
              incident_number: request.incident_number,
              jira_ticket_id: request.jira_ticket_id,
              analyst_id: request.analyst_id,
              analyst_name: request.analysts.name,
              assets: request.assets,
              status: request.status,
              created_at: request.created_at,
              updated_at: request.updated_at,
              indicators: []
            };
          }

          return {
            id: request.id.toString(),
            incident_number: request.incident_number,
            jira_ticket_id: request.jira_ticket_id,
            analyst_id: request.analyst_id,
            analyst_name: request.analysts.name,
            assets: request.assets,
            status: request.status,
            created_at: request.created_at,
            updated_at: request.updated_at,
            indicators: indicators.map(indicator => ({
              id: indicator.id.toString(),
              type: indicator.type,
              value: indicator.value,
              description: indicator.description || '',
              status: indicator.status,
              created_at: indicator.created_at
            }))
          };
        })
      );

      return requestChangesWithIndicators || [];
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
