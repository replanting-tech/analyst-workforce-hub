
import { useQuery } from '@tanstack/react-query';
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

export const useRequestChanges = () => {
  return useQuery({
    queryKey: ['request-changes'],
    queryFn: async () => {
      // Get request changes
      const { data: requestChanges, error: requestError } = await supabase
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
          analysts!inner (
            name
          )
        `)
        .order('created_at', { ascending: false });

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
              ...request,
              analyst_name: request.analysts.name,
              indicators: []
            };
          }

          return {
            ...request,
            analyst_name: request.analysts.name,
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

      return requestChangesWithIndicators as RequestChange[];
    },
  });
};
