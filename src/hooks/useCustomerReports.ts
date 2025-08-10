
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerReport {
  id: string;
  customer_id: string;
  report_name: string;
  report_type: string;
  report_data: any;
  generated_at: string;
  generated_by: string | null;
  file_path: string | null;
  status: string;
}

export const useCustomerReports = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-reports', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('customer_reports')
        .select('*')
        .eq('customer_id', customerId)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer reports:', error);
        throw error;
      }

      return data as CustomerReport[];
    },
    enabled: !!customerId,
  });
};
