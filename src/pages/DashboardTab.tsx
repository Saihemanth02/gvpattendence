import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { Users, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
  <div className="glass-card glass-card-hover p-5 animate-fade-in-up">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground font-cinzel tracking-wider">{label}</p>
    </div>
    <p className="text-3xl font-bold font-mono-num text-foreground">{value}</p>
  </div>
);

const DashboardTab = () => {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: records, isLoading: recordsLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);

  const isLoading = studentsLoading || recordsLoading;

  const totalStudents = students?.length || 0;
  const classesHeld = records?.length || 0;

  // Calculate avg attendance
  let avgAttendance = 0;
  let below75 = 0;
  if (students && records && entries && records.length > 0) {
    const studentStats = students.map(s => {
      const studentEntries = entries.filter(e => e.student_suffix === s.suffix);
      const present = studentEntries.filter(e => e.status === 'present').length;
      const pct = studentEntries.length > 0 ? (present / studentEntries.length) * 100 : 100;
      return pct;
    });
    avgAttendance = studentStats.length > 0
      ? Math.round(studentStats.reduce((a, b) => a + b, 0) / studentStats.length)
      : 0;
    below75 = studentStats.filter(p => p < 75).length;
  }

  const recentRecords = records?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-secondary/30" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="TOTAL STUDENTS" value={totalStudents} color="bg-primary/10" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-blue-400" />} label="CLASSES HELD" value={classesHeld} color="bg-blue-400/10" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="AVG ATTENDANCE" value={`${avgAttendance}%`} color="bg-emerald-400/10" />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="BELOW 75%" value={below75} color="bg-red-400/10" />
      </div>

      <div className="glass-card p-5">
        <h3 className="font-cinzel text-sm text-primary tracking-wider mb-4">RECENT RECORDS</h3>
        {recentRecords.length === 0 ? (
          <p className="text-muted-foreground text-sm">No attendance records yet.</p>
        ) : (
          <div className="space-y-3">
            {recentRecords.map(rec => {
              const recEntries = entries?.filter(e => e.record_id === rec.id) || [];
              const present = recEntries.filter(e => e.status === 'present').length;
              const absent = recEntries.filter(e => e.status === 'absent').length;
              return (
                <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div>
                    <p className="text-sm font-medium">{rec.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rec.date), 'dd MMM yyyy')} · {rec.section} · P{rec.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-num text-sm text-emerald-400">{present}P</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="font-mono-num text-sm text-red-400">{absent}A</span>
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
