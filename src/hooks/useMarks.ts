import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Mark {
  id: string;
  student_suffix: string;
  section: string;
  subject: string;
  mid1: number | null;
  mid2: number | null;
  internal: number | null;
  created_at: string;
  updated_at: string;
}

export const useMarks = (section?: string, subject?: string) => {
  return useQuery({
    queryKey: ['marks', section, subject],
    queryFn: async () => {
      let query = supabase.from('marks').select('*').order('student_suffix', { ascending: true });
      if (section) query = query.eq('section', section);
      if (subject) query = query.eq('subject', subject);
      const { data, error } = await query;
      if (error) throw error;
      return data as Mark[];
    },
  });
};

export const useStudentMarks = (suffix?: string) => {
  return useQuery({
    queryKey: ['marks', 'student', suffix],
    queryFn: async () => {
      if (!suffix) return [];
      const { data, error } = await supabase
        .from('marks')
        .select('*')
        .eq('student_suffix', suffix)
        .order('subject', { ascending: true });
      if (error) throw error;
      return data as Mark[];
    },
    enabled: !!suffix,
  });
};

export const useUpsertMark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mark: { student_suffix: string; section: string; subject: string; mid1?: number | null; mid2?: number | null }) => {
      const { error } = await supabase.from('marks').upsert(
        { ...mark, updated_at: new Date().toISOString() },
        { onConflict: 'student_suffix,section,subject' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marks'] });
      toast.success('Mark saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useBulkUpsertMarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (marks: { student_suffix: string; section: string; subject: string; mid1?: number | null; mid2?: number | null }[]) => {
      const withTimestamp = marks.map(m => ({ ...m, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from('marks').upsert(withTimestamp, { onConflict: 'student_suffix,section,subject' });
      if (error) throw error;
      return marks.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['marks'] });
      toast.success(`${count} marks uploaded successfully`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteMark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marks'] });
      toast.success('Mark deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
