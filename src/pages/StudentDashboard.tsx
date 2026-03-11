import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrendingUp, BookOpen, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import FloatingOrbs from '@/components/FloatingOrbs';
import SparkleCanvas from '@/components/SparkleCanvas';
import AppHeader from '@/components/AppHeader';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: records, isLoading: recordsLoading } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries, isLoading: entriesLoading } = useAttendanceEntries(recordIds);

  const isLoading = recordsLoading || entriesLoading;
  const suffix = user?.suffix;

  // Filter entries for this student
  const myEntries = entries?.filter(e => e.student_suffix === suffix) || [];
  const totalClasses = myEntries.length;
  const presentCount = myEntries.filter(e => e.status === 'present').length;
  const absentCount = myEntries.filter(e => e.status === 'absent').length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  const isEligible = percentage >= 75;

  // Build per-record detail (most recent first)
  const myRecordDetails = records
    ?.map(rec => {
      const entry = myEntries.find(e => e.record_id === rec.id);
      if (!entry) return null;
      return { ...rec, status: entry.status };
    })
    .filter(Boolean) || [];

  // Subject-wise breakdown
  const subjectMap = new Map<string, { present: number; total: number }>();
  myEntries.forEach(entry => {
    const rec = records?.find(r => r.id === entry.record_id);
    if (!rec) return;
    const existing = subjectMap.get(rec.subject) || { present: 0, total: 0 };
    existing.total++;
    if (entry.status === 'present') existing.present++;
    subjectMap.set(rec.subject, existing);
  });
  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
    subject,
    ...stats,
    percentage: Math.round((stats.present / stats.total) * 100),
  }));

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

          {/* Recent Attendance Log */}
          <div className="glass-card p-5 md:p-6">
            <h3 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] mb-4 uppercase">
              Attendance Log
            </h3>
            {myRecordDetails.length === 0 ? (
              <p className="text-muted-foreground text-sm font-cormorant">No attendance records found.</p>
            ) : (
              <div className="space-y-2">
                {myRecordDetails.slice(0, 20).map((rec: any) => (
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
