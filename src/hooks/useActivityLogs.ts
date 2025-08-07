import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: number;
  analyst_email: string | null;
  info: string | null;
  created_at: string;
}

export const useActivityLogs = (analystEmail?: string, date?: string) => {
  return useQuery({
    queryKey: ['activity-logs', analystEmail, date],
    queryFn: async () => {
      let query = supabase
        .from('analyst_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // if (analystEmail) {
      //   query = query.eq('analyst_email', analystEmail);
      // }

      if (date) {
        // Filter by date (created_at starts with the date)
        query = query.gte('created_at', `${date}T00:00:00`)
                   .lt('created_at', `${date}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      return data as ActivityLog[];
    },
    enabled: !!analystEmail || !!date, // Only run query if we have an analyst email or date
  });
}; 