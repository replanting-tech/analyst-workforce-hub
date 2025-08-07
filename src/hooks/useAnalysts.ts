
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Analyst {
  id: string;
  code: string;
  name: string;
  email: string;
  availability: string;
  current_active_incidents: number;
  today_closed_incidents: number;
  today_total_incidents: number;
  workload_updated_at: string | null;
  isRegisteredUser?: boolean; // Add this new field
}

export const useAnalysts = () => {
  return useQuery({
    queryKey: ['analysts'],
    queryFn: async () => {
      const { data: analystsData, error } = await supabase
        .from('v_analyst_workload_summary')
        .select('*')
        .order('current_active_incidents', { ascending: false });

      if (error) {
        console.error('Error fetching analysts:', error);
        throw error;
      }

      // For each analyst, check if they are registered in Supabase Auth
      const analystsWithAuthStatus = await Promise.all(
        analystsData.map(async (analyst) => {
          try {
            const response = await fetch('https://xmozpbewjkeisvpfzeca.supabase.co/functions/v1/check-user-exists', { // Assuming a proxy or direct call to Edge Function
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA`, // SUPABASE_PUBLISHABLE_KEY
              },
              body: JSON.stringify({ email: analyst.email }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Error checking user existence for ${analyst.email}:`, errorData.error);
              return { ...analyst, isRegisteredUser: false }; // Assume not registered on error
            }

            const { userExists } = await response.json();
            return { ...analyst, isRegisteredUser: userExists };
          } catch (fetchError) {
            console.error(`Network error checking user existence for ${analyst.email}:`, fetchError);
            return { ...analyst, isRegisteredUser: false }; // Assume not registered on network error
          }
        })
      );

      return analystsWithAuthStatus as Analyst[];
    },
  });
};
