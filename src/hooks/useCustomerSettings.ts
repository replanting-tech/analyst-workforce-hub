
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerSetting {
  id: string;
  customer_id: string;
  setting_key: string;
  setting_value: any;
  updated_by: string | null;
  updated_at: string;
}

export const useCustomerSettings = (customerId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customer-settings', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('customer_settings')
        .select('*')
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error fetching customer settings:', error);
        throw error;
      }

      return data as CustomerSetting[];
    },
    enabled: !!customerId,
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from('customer_settings')
        .upsert({
          customer_id: customerId!,
          setting_key: key,
          setting_value: value
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-settings', customerId] });
    },
  });

  return {
    ...query,
    updateSetting
  };
};
