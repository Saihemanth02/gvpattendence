import { useAttendanceRecords, useAttendanceEntries, useDeleteAttendance } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const HistoryTab = () => {
  const { user } = useAuth();
  const { data: records, isLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);
  const { data: students } = useStudents();
  const deleteMutation = useDeleteAttendance();

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students?.forEach(s => { map[s.suffix] = s.name; });
    return map;
  }, [students]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 bg-secondary/30 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in-up space-y-4">
      {(!records || records.length === 0) && (
        <div className="glass-card p-8 text-center text-muted-foreground">No attendance records yet.</div>
      )}
      {records?.map(rec => {
        const recEntries = entries?.filter(e => e.record_id === rec.id) || [];
        const absent = recEntries.filter(e => e.status === 'absent');
        const present = recEntries.filter(e => e.status === 'present').length;
        return (
          <div key={rec.id} className="glass-card glass-card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-cinzel text-base text-foreground">{rec.subject}</h3>
                <p className="text-xs text-muted-foreground font-mono-num mt-1">
                  {format(new Date(rec.date), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-secondary/30 border border-border/30 text-muted-foreground font-cinzel">
                    {rec.section}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-primary/10 border border-primary/20 text-primary font-mono-num">
                    P{rec.period}
                  </span>
                </div>
                {user?.role === 'faculty' && (
                  <button
                    onClick={() => deleteMutation.mutate(rec.id)}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono-num text-sm text-emerald-400">{present} present</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="font-mono-num text-sm text-red-400">{absent.length} absent</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="font-mono-num text-sm text-muted-foreground">{recEntries.length} total</span>
            </div>
            {absent.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {absent.map(a => (
                  <span key={a.id} className="text-[11px] px-2 py-0.5 rounded bg-red-400/5 border border-red-400/15 text-red-300 font-cormorant">
                    {a.student_suffix} — {studentMap[a.student_suffix] || 'Unknown'}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTab;
