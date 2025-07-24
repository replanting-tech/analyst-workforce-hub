
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Schedule {
  id: string;
  analyst_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  timezone: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  analyst_name: string;
  analyst_code: string;
}

export const useSchedule = (date?: string) => {
  return useQuery({
    queryKey: ['schedule', date],
    queryFn: async () => {
      let query = supabase
        .from('analyst_schedule')
        .select(`
          *,
          analysts:analyst_id (
            name,
            code
          )
        `)
        .order('shift_date', { ascending: true })
        .order('shift_start', { ascending: true });

      if (date) {
        query = query.eq('shift_date', date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schedule:', error);
        throw error;
      }

      return data.map(schedule => ({
        id: schedule.id,
        analyst_id: schedule.analyst_id,
        shift_date: schedule.shift_date,
        shift_start: schedule.shift_start,
        shift_end: schedule.shift_end,
        timezone: schedule.timezone,
        status: schedule.status,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
        analyst_name: schedule.analysts.name,
        analyst_code: schedule.analysts.code,
      })) as Schedule[];
    },
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: {
      analyst_id: string;
      shift_date: string;
      shift_start: string;
      shift_end: string;
      timezone?: string;
    }) => {
      const { data, error } = await supabase
        .from('analyst_schedule')
        .insert([scheduleData])
        .select()
        .single();

      if (error) {
        console.error('Error creating schedule:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Schedule>) => {
      const { data, error } = await supabase
        .from('analyst_schedule')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analyst_schedule')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};
