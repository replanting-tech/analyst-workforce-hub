
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SLADashboard {
  customer_name: string;
  workspace_name: string;
  priority: string;
  total_incidents: number;
  sla_met: number;
  sla_breach: number;
  sla_ongoing: number;
  sla_compliance_percentage: number;
}

export const useSLADashboard = () => {
  return useQuery({
    queryKey: ['sla-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sla_dashboard')
        .select('*')
        .order('customer_name');

      if (error) {
        console.error('Error fetching SLA dashboard:', error);
        throw error;
      }

      return data as SLADashboard[];
    },
  });
};
