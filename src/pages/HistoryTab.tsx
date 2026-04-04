import { useAttendanceRecords, useAttendanceEntries, useDeleteAttendance } from '@/hooks/useAttendance';
import { useStudents, COURSE_SECTIONS } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { Trash2, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type MonthFilter = 'all' | 'current' | 'previous';

const HistoryTab = () => {
  const { user } = useAuth();
  const { data: records, isLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);
  const { data: students } = useStudents();
  const deleteMutation = useDeleteAttendance();
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const filterLabel = monthFilter === 'current'
    ? format(now, 'MMMM yyyy')
    : monthFilter === 'previous'
      ? format(subMonths(now, 1), 'MMMM yyyy')
      : 'All Time';

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students?.forEach(s => { map[s.suffix] = s.name; });
    return map;
  }, [students]);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    let filtered = records;
    if (sectionFilter) {
      filtered = filtered.filter(r => r.section === sectionFilter);
    }
    if (monthFilter === 'all') return filtered;
    const start = monthFilter === 'current' ? currentMonthStart : prevMonthStart;
    const end = monthFilter === 'current' ? currentMonthEnd : prevMonthEnd;
    return filtered.filter(r => isWithinInterval(parseISO(r.date), { start, end }));
  }, [records, monthFilter, sectionFilter]);

  const exportCSV = () => {
    if (!filteredRecords.length) {
      toast.error('No records to export');
      return;
    }

    const header = 'Date,Subject,Section,Period,Suffix,Student Name,Status';
    const rows: string[] = [];

    filteredRecords.forEach(rec => {
      const recEntries = entries?.filter(e => e.record_id === rec.id) || [];
      recEntries.forEach(entry => {
        rows.push(
          `${rec.date},${rec.subject},${rec.section},${rec.period},${entry.student_suffix},${studentMap[entry.student_suffix] || 'Unknown'},${entry.status}`
        );
      });
    });

    // Summary
    const totalEntries = filteredRecords.reduce((sum, rec) => {
      return sum + (entries?.filter(e => e.record_id === rec.id).length || 0);
    }, 0);
    const presentCount = filteredRecords.reduce((sum, rec) => {
      return sum + (entries?.filter(e => e.record_id === rec.id && e.status === 'present').length || 0);
    }, 0);
    const absentCount = totalEntries - presentCount;

    rows.push('');
    rows.push(`Summary for ${filterLabel}`);
    rows.push(`Total Entries,${totalEntries}`);
    rows.push(`Present,${presentCount}`);
    rows.push(`Absent,${absentCount}`);
    rows.push(`Records,${filteredRecords.length}`);

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${filterLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/15 border border-primary/30">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] uppercase">History</h2>
            <p className="text-[0.6rem] text-muted-foreground tracking-[0.15em] uppercase">
              {filteredRecords.length} records · {filterLabel}
            </p>
          </div>
        </div>

        {/* Month filter + Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary/30 rounded-lg border border-primary/15 p-0.5">
            <button
              onClick={() => setMonthFilter('previous')}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-[0.65rem] font-cinzel tracking-wider transition-all duration-200",
                monthFilter === 'previous'
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronLeft className="w-3 h-3 inline-block mr-0.5" />
              Prev
            </button>
            <button
              onClick={() => setMonthFilter('current')}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-[0.65rem] font-cinzel tracking-wider transition-all duration-200",
                monthFilter === 'current'
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setMonthFilter('all')}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-[0.65rem] font-cinzel tracking-wider transition-all duration-200",
                monthFilter === 'all'
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
              <ChevronRight className="w-3 h-3 inline-block ml-0.5" />
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/30 text-primary text-[0.65rem] font-cinzel tracking-wider hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 && (
        <div className="glass-card p-10 text-center">
          <p className="text-muted-foreground font-cinzel text-sm tracking-wider">No attendance records for {filterLabel}.</p>
        </div>
      )}

      {filteredRecords.map(rec => {
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
