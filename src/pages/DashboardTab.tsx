import { useMemo } from 'react';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { useMarks } from '@/hooks/useMarks';
import { Users, BookOpen, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconBorder: string;
}

const StatCard = ({ icon, label, value, iconBg, iconBorder }: StatCardProps) => (
  <div className="glass-card p-5 md:p-6 transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_25px_hsla(42,88%,55%,0.1)] cursor-default">
    <div className="flex items-center gap-3 mb-3">
      <div className={cn('w-11 h-11 rounded-full flex items-center justify-center border', iconBg, iconBorder)}>
        {icon}
      </div>
      <p className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] uppercase">
        {label}
      </p>
    </div>
    <p className="text-[2.8rem] leading-none font-bold font-cinzel text-foreground">{value}</p>
  </div>
);

const DashboardTab = () => {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: records, isLoading: recordsLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);
  const { data: allMarks, isLoading: marksLoading } = useMarks();

  const isLoading = studentsLoading || recordsLoading || marksLoading;

  const totalStudents = students?.length || 0;
  const classesHeld = records?.length || 0;

  let avgAttendance = 0;
  let below75 = 0;
  if (students && records && entries && records.length > 0) {
    const studentStats = students.map(s => {
      const studentEntries = entries.filter(e => e.student_suffix === s.suffix);
      const present = studentEntries.filter(e => e.status === 'present').length;
      return studentEntries.length > 0 ? (present / studentEntries.length) * 100 : 100;
    });
    avgAttendance = studentStats.length > 0
      ? Math.round(studentStats.reduce((a, b) => a + b, 0) / studentStats.length)
      : 0;
    below75 = studentStats.filter(p => p < 75).length;
  }

  const subjectMarksSummary = useMemo(() => {
    if (!allMarks || allMarks.length === 0) return [];
    const map = new Map<string, { sum: number; count: number; section: string }>();
    allMarks.forEach(m => {
      if (m.internal === null) return;
      const key = `${m.subject}||${m.section}`;
      const existing = map.get(key) || { sum: 0, count: 0, section: m.section };
      existing.sum += Number(m.internal);
      existing.count++;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([key, stats]) => ({
        subject: key.split('||')[0],
        section: stats.section,
        avg: Math.round((stats.sum / stats.count) * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [allMarks]);

  const recentRecords = records?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1200px] mx-auto animate-fade-in-up">
      {/* Stat Cards — 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Students"
          value={totalStudents}
          iconBg="bg-primary/15"
          iconBorder="border-primary/30"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-[hsl(205,55%,55%)]" />}
          label="Classes Held"
          value={classesHeld}
          iconBg="bg-[hsla(205,55%,55%,0.15)]"
          iconBorder="border-[hsla(205,55%,55%,0.3)]"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-[hsl(150,50%,48%)]" />}
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          iconBg="bg-[hsla(150,50%,48%,0.15)]"
          iconBorder="border-[hsla(150,50%,48%,0.3)]"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          label="Below 75%"
          value={below75}
          iconBg="bg-destructive/15"
          iconBorder="border-destructive/30"
        />
      </div>

      {/* Recent Records */}
      <div className="glass-card p-5 md:p-6">
        <h3 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] mb-4 uppercase">
          Recent Records
        </h3>
        {recentRecords.length === 0 ? (
          <p className="text-muted-foreground text-sm font-cormorant">No attendance records yet.</p>
        ) : (
          <div className="space-y-2.5">
            {recentRecords.map(rec => {
              const recEntries = entries?.filter(e => e.record_id === rec.id) || [];
              const present = recEntries.filter(e => e.status === 'present').length;
              const absent = recEntries.filter(e => e.status === 'absent').length;
              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 md:p-4 rounded-[10px] bg-card/70 border border-primary/10 hover:border-primary/30 hover:bg-primary/[0.04] transition-all duration-200"
                >
                  <div>
                    <p className="text-[0.95rem] font-semibold text-foreground">{rec.subject}</p>
                    <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                      {format(new Date(rec.date), 'dd MMM yyyy')} · {rec.section} · P{rec.period}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="font-mono-num text-[0.9rem] font-semibold text-[hsl(150,50%,48%)]">
                      {present}P
                    </span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="font-mono-num text-[0.9rem] font-semibold text-destructive">
                      {absent}A
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;
