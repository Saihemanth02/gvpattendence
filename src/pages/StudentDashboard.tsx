import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { useStudentMarks } from '@/hooks/useMarks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrendingUp, BookOpen, CheckCircle, XCircle, User, Calendar, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import FloatingOrbs from '@/components/FloatingOrbs';
import SparkleCanvas from '@/components/SparkleCanvas';
import AppHeader from '@/components/AppHeader';
import { toast } from 'sonner';

type MonthFilter = 'all' | 'current' | 'previous';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: records, isLoading: recordsLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries, isLoading: entriesLoading } = useAttendanceEntries(recordIds);
  const { data: myMarks, isLoading: marksLoading } = useStudentMarks(user?.suffix);
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');

  const isLoading = recordsLoading || entriesLoading || marksLoading;
  const suffix = user?.suffix;

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

  // Filter records by month
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (monthFilter === 'all') return records;
    const start = monthFilter === 'current' ? currentMonthStart : prevMonthStart;
    const end = monthFilter === 'current' ? currentMonthEnd : prevMonthEnd;
    return records.filter(r => isWithinInterval(parseISO(r.date), { start, end }));
  }, [records, monthFilter]);

  const filteredRecordIds = new Set(filteredRecords.map(r => r.id));

  // Filter entries for this student within filtered records
  const myEntries = useMemo(() => {
    return (entries?.filter(e => e.student_suffix === suffix && filteredRecordIds.has(e.record_id)) || []);
  }, [entries, suffix, filteredRecordIds]);

  const totalClasses = myEntries.length;
  const presentCount = myEntries.filter(e => e.status === 'present').length;
  const absentCount = myEntries.filter(e => e.status === 'absent').length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  const isEligible = percentage >= 75;

  // Build per-record detail
  const myRecordDetails = useMemo(() => {
    return filteredRecords
      .map(rec => {
        const entry = myEntries.find(e => e.record_id === rec.id);
        if (!entry) return null;
        return { ...rec, status: entry.status };
      })
      .filter(Boolean) as (typeof filteredRecords[number] & { status: string })[];
  }, [filteredRecords, myEntries]);

  // Subject-wise breakdown
  const subjectBreakdown = useMemo(() => {
    const subjectMap = new Map<string, { present: number; total: number }>();
    myEntries.forEach(entry => {
      const rec = filteredRecords.find(r => r.id === entry.record_id);
      if (!rec) return;
      const existing = subjectMap.get(rec.subject) || { present: 0, total: 0 };
      existing.total++;
      if (entry.status === 'present') existing.present++;
      subjectMap.set(rec.subject, existing);
    });
    return Array.from(subjectMap.entries()).map(([subject, stats]) => ({
      subject,
      ...stats,
      percentage: Math.round((stats.present / stats.total) * 100),
    }));
  }, [myEntries, filteredRecords]);

  // Export CSV
  const exportCSV = () => {
    if (myRecordDetails.length === 0) {
      toast.error('No records to export');
      return;
    }

    const header = 'Date,Subject,Section,Period,Status';
    const rows = myRecordDetails.map(rec =>
      `${rec.date},${rec.subject},${rec.section},${rec.period},${rec.status}`
    );

    // Add summary rows
    const summary = [
      '',
      `Filter,${filterLabel}`,
      `Student,${user?.displayName} (${suffix})`,
      `Total Classes,${totalClasses}`,
      `Present,${presentCount}`,
      `Absent,${absentCount}`,
      `Attendance %,${percentage}%`,
      `Eligibility,${isEligible ? 'Eligible' : 'Not Eligible'}`,
      '',
      'Subject-wise Breakdown',
      'Subject,Present,Total,Percentage',
      ...subjectBreakdown.map(s => `${s.subject},${s.present},${s.total},${s.percentage}%`),
    ];

    const csv = [header, ...rows, ...summary].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${suffix}_${filterLabel.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${myRecordDetails.length} records`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gold-grid-bg relative">
        <FloatingOrbs />
        <SparkleCanvas />
        <div className="relative z-10">
          <AppHeader />
          <div className="space-y-6 p-4 md:p-6 max-w-[900px] mx-auto">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-secondary/30" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gold-grid-bg relative">
      <FloatingOrbs />
      <SparkleCanvas />
      <div className="relative z-10">
        <AppHeader />
        <div className="space-y-6 p-4 md:p-6 max-w-[900px] mx-auto pb-24 animate-fade-in-up">
          {/* Welcome & Profile Card */}
          <div className="glass-card p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-cinzel font-bold text-foreground">
                  Welcome, {user?.displayName}
                </h1>
                <p className="text-sm text-muted-foreground font-cormorant">
                  Suffix: {suffix} · Student Self-Service Portal
                </p>
              </div>
            </div>
          </div>

          {/* Month Filter & Export */}
          <div className="glass-card p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-cinzel tracking-[0.15em] uppercase text-muted-foreground">View:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant={monthFilter === 'previous' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setMonthFilter(f => f === 'previous' ? 'all' : 'previous')}
                >
                  <ChevronLeft className="w-3 h-3" />
                  {format(subMonths(now, 1), 'MMM')}
                </Button>
                <Button
                  variant={monthFilter === 'current' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setMonthFilter(f => f === 'current' ? 'all' : 'current')}
                >
                  {format(now, 'MMM')}
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  variant={monthFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setMonthFilter('all')}
                >
                  All
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              onClick={exportCSV}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>

          {/* Period Label */}
          <div className="text-center">
            <span className="text-xs font-cinzel tracking-[0.2em] uppercase text-muted-foreground">
              Showing: {filterLabel}
            </span>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <StatMini
              icon={<BookOpen className="w-5 h-5 text-[hsl(205,55%,55%)]" />}
              label="Total Classes"
              value={totalClasses}
              iconBg="bg-[hsla(205,55%,55%,0.15)]"
            />
            <StatMini
              icon={<CheckCircle className="w-5 h-5 text-[hsl(150,50%,48%)]" />}
              label="Present"
              value={presentCount}
              iconBg="bg-[hsla(150,50%,48%,0.15)]"
            />
            <StatMini
              icon={<XCircle className="w-5 h-5 text-destructive" />}
              label="Absent"
              value={absentCount}
              iconBg="bg-destructive/15"
            />
            <StatMini
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
              label="Attendance"
              value={`${percentage}%`}
              iconBg="bg-primary/15"
            />
          </div>

          {/* Eligibility Banner */}
          <div
            className={cn(
              'glass-card p-4 md:p-5 border-l-4 flex items-center gap-3',
              isEligible
                ? 'border-l-[hsl(150,50%,48%)] bg-[hsla(150,50%,48%,0.05)]'
                : 'border-l-destructive bg-destructive/5'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isEligible ? 'bg-[hsla(150,50%,48%,0.2)]' : 'bg-destructive/20'
            )}>
              {isEligible
                ? <CheckCircle className="w-5 h-5 text-[hsl(150,50%,48%)]" />
                : <XCircle className="w-5 h-5 text-destructive" />
              }
            </div>
            <div>
              <p className={cn(
                'text-sm font-semibold',
                isEligible ? 'text-[hsl(150,50%,48%)]' : 'text-destructive'
              )}>
                {isEligible ? 'Eligible' : 'Not Eligible'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEligible
                  ? 'Your attendance is above 75%. Keep it up!'
                  : `You need ${Math.ceil((0.75 * totalClasses - presentCount) / (1 - 0.75))} more classes to reach 75%.`
                }
              </p>
            </div>
          </div>

          {/* Subject-wise Breakdown */}
          {subjectBreakdown.length > 0 && (
            <div className="glass-card p-5 md:p-6">
              <h3 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] mb-4 uppercase">
                Subject-wise Breakdown
              </h3>
              <div className="space-y-3">
                {subjectBreakdown.map(sub => (
                  <div key={sub.subject} className="flex items-center justify-between p-3 rounded-[10px] bg-card/70 border border-primary/10">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{sub.subject}</p>
                      <p className="text-xs text-muted-foreground">{sub.present}/{sub.total} classes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            sub.percentage >= 75 ? 'bg-[hsl(150,50%,48%)]' : 'bg-destructive'
                          )}
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-xs font-mono-num font-semibold min-w-[3ch] text-right',
                        sub.percentage >= 75 ? 'text-[hsl(150,50%,48%)]' : 'text-destructive'
                      )}>
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Marks */}
          {myMarks && myMarks.length > 0 && (
            <div className="glass-card p-5 md:p-6">
              <h3 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] mb-4 uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Internal Marks
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="text-left py-2 px-2 text-xs font-cinzel text-muted-foreground">Subject</th>
                      <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Mid-1 (20)</th>
                      <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Mid-2 (20)</th>
                      <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Internal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myMarks.map(m => (
                      <tr key={m.id} className="border-b border-primary/5 hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-2 text-sm font-semibold text-foreground">{m.subject}</td>
                        <td className="py-2 px-2 text-center text-sm">{m.mid1 ?? '—'}</td>
                        <td className="py-2 px-2 text-center text-sm">{m.mid2 ?? '—'}</td>
                        <td className={cn(
                          'py-2 px-2 text-center text-sm font-bold',
                          m.internal !== null && m.internal >= 10 ? 'text-[hsl(150,50%,48%)]' : 'text-destructive'
                        )}>
                          {m.internal ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Log */}
          <div className="glass-card p-5 md:p-6">
            <h3 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] mb-4 uppercase">
              Attendance Log
            </h3>
            {myRecordDetails.length === 0 ? (
              <p className="text-muted-foreground text-sm font-cormorant">No attendance records found for {filterLabel}.</p>
            ) : (
              <div className="space-y-2">
                {myRecordDetails.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 rounded-[10px] bg-card/70 border border-primary/10 hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{rec.subject}</p>
                        <p className="text-[0.7rem] text-muted-foreground">
                          {format(new Date(rec.date), 'dd MMM yyyy')} · {rec.section} · P{rec.period}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      rec.status === 'present'
                        ? 'bg-[hsla(150,50%,48%,0.15)] text-[hsl(150,50%,48%)]'
                        : 'bg-destructive/15 text-destructive'
                    )}>
                      {rec.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ icon, label, value, iconBg }: { icon: React.ReactNode; label: string; value: string | number; iconBg: string }) => (
  <div className="glass-card p-4 text-center">
    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2', iconBg)}>
      {icon}
    </div>
    <p className="text-2xl font-bold font-cinzel text-foreground">{value}</p>
    <p className="text-[0.6rem] text-muted-foreground font-cinzel tracking-[0.15em] uppercase mt-1">{label}</p>
  </div>
);

export default StudentDashboard;
