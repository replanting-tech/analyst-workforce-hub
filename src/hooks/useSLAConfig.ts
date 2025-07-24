
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SLAConfig {
  id: string;
  customer_id: string;
  customer_name: string;
  workspace_name: string;
  priority: string;
  resolution_minutes: number;
  created_at: string;
  updated_at: string;
}

export const useSLAConfig = () => {
  return useQuery({
    queryKey: ['sla-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_config')
        .select(`
          id,
          customer_id,
          priority,
          resolution_minutes,
          created_at,
          updated_at,
          customers!inner (
            customer_name,
            workspace_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SLA config:', error);
        throw error;
      }

      return data.map(config => ({
        id: config.id,
        customer_id: config.customer_id,
        customer_name: config.customers.customer_name,
        workspace_name: config.customers.workspace_name,
        priority: config.priority,
        resolution_minutes: config.resolution_minutes,
        created_at: config.created_at,
        updated_at: config.updated_at
      })) as SLAConfig[];
    },
  });
};
