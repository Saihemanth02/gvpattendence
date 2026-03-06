import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  section: string;
  period: number;
  submitted_by: string;
  created_at: string;
}

export interface AttendanceEntry {
  id: string;
  record_id: string;
  student_suffix: string;
  status: string;
}

export const useAttendanceRecords = () => {
  return useQuery({
    queryKey: ['attendance_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: false })
        .order('period', { ascending: true });
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
};

export const useAttendanceEntries = (recordIds?: string[]) => {
  return useQuery({
    queryKey: ['attendance_entries', recordIds],
    queryFn: async () => {
      if (!recordIds?.length) return [];
      const { data, error } = await supabase
        .from('attendance_entries')
        .select('*')
        .in('record_id', recordIds);
      if (error) throw error;
      return data as AttendanceEntry[];
    },
    enabled: !!recordIds?.length,
  });
};

export const useSubmitAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      date, subject, section, period, absentSuffixes, allSuffixes,
    }: {
      date: string;
      subject: string;
      section: string;
      period: number;
      absentSuffixes: string[];
      allSuffixes: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert record
      const { data: record, error: recError } = await supabase
        .from('attendance_records')
        .insert({ date, subject, section, period, submitted_by: user.id })
        .select()
        .single();
      if (recError) throw recError;

      // Insert entries for all students
      const entries = allSuffixes.map(suffix => ({
        record_id: record.id,
        student_suffix: suffix,
        status: absentSuffixes.includes(suffix) ? 'absent' : 'present',
      }));

      const { error: entError } = await supabase
        .from('attendance_entries')
        .insert(entries);
      if (entError) throw entError;

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance_entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      toast.success('Attendance submitted successfully!');
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Attendance already exists for this subject, section, date, and period.');
      } else {
        toast.error('Failed to submit attendance: ' + error.message);
      }
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance_entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      toast.success('Record deleted');
    },
  });
};
