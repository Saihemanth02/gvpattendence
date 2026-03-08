import { useAttendanceRecords, useAttendanceEntries, useDeleteAttendance } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 bg-secondary/30 rounded-[14px]" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in-up max-w-[1200px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/15 border border-primary/30">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] uppercase">History</h2>
          <p className="text-[0.6rem] text-muted-foreground tracking-[0.15em] uppercase">{records?.length || 0} records</p>
        </div>
      </div>

      {(!records || records.length === 0) && (
        <div className="glass-card p-10 text-center">
          <p className="text-muted-foreground font-cinzel text-sm tracking-wider">No attendance records yet.</p>
        </div>
      )}

      {records?.map(rec => {
        const recEntries = entries?.filter(e => e.record_id === rec.id) || [];
        const absent = recEntries.filter(e => e.status === 'absent');
        const present = recEntries.filter(e => e.status === 'present').length;
        return (
          <div key={rec.id} className="glass-card glass-card-hover p-5 md:p-6 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-cinzel text-[0.95rem] font-semibold text-foreground">{rec.subject}</h3>
                <p className="text-[0.7rem] text-muted-foreground font-mono-num mt-1">
                  {format(new Date(rec.date), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 text-[0.65rem] rounded-[8px] bg-secondary/30 border border-primary/10 text-muted-foreground font-cinzel tracking-wider">
                    {rec.section}
                  </span>
                  <span className="px-2.5 py-1 text-[0.65rem] rounded-[8px] bg-primary/10 border border-primary/20 text-primary font-mono-num">
                    P{rec.period}
                  </span>
                </div>
                {user?.role === 'faculty' && (
                  <button
                    onClick={() => deleteMutation.mutate(rec.id)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-destructive/20 text-destructive/50 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 p-3 rounded-[10px] bg-card/50 border border-primary/10 mb-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,50%,48%)]" />
                <span className="font-mono-num text-sm text-[hsl(150,50%,48%)] font-semibold">{present}</span>
                <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">present</span>
              </div>
              <span className="text-muted-foreground/20">|</span>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="font-mono-num text-sm text-destructive font-semibold">{absent.length}</span>
                <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">absent</span>
              </div>
              <span className="text-muted-foreground/20">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-num text-sm text-muted-foreground">{recEntries.length}</span>
                <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">total</span>
              </div>
            </div>

            {absent.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {absent.map(a => (
                  <span key={a.id} className="text-[0.65rem] px-2.5 py-1 rounded-[8px] bg-destructive/5 border border-destructive/15 text-destructive/80 font-mono-num flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" />
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
