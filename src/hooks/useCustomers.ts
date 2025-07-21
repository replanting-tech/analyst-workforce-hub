
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  workspace_name: string;
  customer_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('customer_name');

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      return data as Customer[];
    },
  });
};
