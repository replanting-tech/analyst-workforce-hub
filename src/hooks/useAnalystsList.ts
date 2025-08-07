import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Analyst {
  id: string;
  code: string;
  name: string;
  email: string;
}

export const useAnalystsList = () => {
  return useQuery({
    queryKey: ['analysts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysts')
        .select('id, code, name, email')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching analysts:', error);
        throw error;
      }

      return data as Analyst[];
    },
  });
};