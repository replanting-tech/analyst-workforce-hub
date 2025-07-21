
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Analyst {
  code: string;
  name: string;
  email: string;
  availability: string;
  current_active_incidents: number;
  today_closed_incidents: number;
  today_total_incidents: number;
  workload_updated_at: string | null;
}

export const useAnalysts = () => {
  return useQuery({
    queryKey: ['analysts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_analyst_workload_summary')
        .select('*')
        .order('current_active_incidents', { ascending: false });

      if (error) {
        console.error('Error fetching analysts:', error);
        throw error;
      }

      return data as Analyst[];
    },
  });
};
