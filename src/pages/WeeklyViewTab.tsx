import { useAttendanceRecords } from '@/hooks/useAttendance';
import { COURSE_SECTIONS } from '@/hooks/useStudents';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const WeeklyViewTab = ({ selectedSection: sectionFilter }: { selectedSection: string }) => {
  const { data: records, isLoading } = useAttendanceRecords();

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 5);
  }, []);

  const filteredRecords = useMemo(() => {
    if (!sectionFilter) return records;
    return records?.filter(r => r.section === sectionFilter);
  }, [records, sectionFilter]);

  const getRecord = (day: Date, period: number) => {
    return filteredRecords?.find(r => isSameDay(new Date(r.date), day) && r.period === period);
  };

  const totalSlots = weekDays.length * PERIODS.length;
  const filledSlots = useMemo(() => {
    let count = 0;
    weekDays.forEach(day => {
      PERIODS.forEach(p => {
        if (getRecord(day, p)) count++;
      });
    });
    return count;
  }, [filteredRecords, weekDays]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-20 bg-card/70 rounded-xl" />
        <Skeleton className="h-64 bg-card/70 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-cinzel text-xs tracking-[0.2em] text-primary font-semibold">
              WEEKLY VIEW
            </h2>
            <p className="text-xs text-muted-foreground font-raleway">
              {format(weekDays[0], 'dd MMM')} — {format(weekDays[4], 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="glass-card px-3 py-1.5 rounded-lg">
          <span className="text-xs text-muted-foreground font-raleway">
            <span className="text-primary font-semibold">{filledSlots}</span> / {totalSlots} slots filled
          </span>
        </div>
      </div>



      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-raleway">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.4)]" />
          <span>Class held</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary/40" />
          <span>No class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30 ring-1 ring-primary/50" />
          <span>Today</span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-card/50">
                <th className="text-left py-3.5 px-4 text-[0.65rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Day</th>
                {PERIODS.map(p => (
                  <th key={p} className="text-center py-3.5 px-2 text-[0.65rem] font-cinzel text-muted-foreground tracking-[0.15em]">
                    <div className="flex flex-col items-center gap-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      <span>P{p}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day, idx) => (
                <tr
                  key={day.toISOString()}
                  className={cn(
                    "border-b border-border/10 transition-colors duration-200",
                    isToday(day) && "bg-primary/5",
                    idx % 2 === 0 && !isToday(day) && "bg-card/20",
                    "hover:bg-primary/[0.03]"
                  )}
                >
                  <td className={cn(
                    "py-3.5 px-4 font-cinzel text-xs whitespace-nowrap",
                    isToday(day) ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    <div className="flex items-center gap-2">
                      {isToday(day) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                      <span>{format(day, 'EEE dd')}</span>
                      {isToday(day) && (
                        <span className="text-[9px] text-primary/60 font-raleway tracking-wider">(TODAY)</span>
                      )}
                    </div>
                  </td>
                  {PERIODS.map(p => {
                    const rec = getRecord(day, p);
                    return (
                      <td key={p} className="py-3.5 px-2 text-center">
                        {rec ? (
                          <div className="flex flex-col items-center gap-1 group cursor-default">
                            <div className="w-3.5 h-3.5 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.4)] group-hover:shadow-[0_0_12px_hsl(var(--accent)/0.6)] transition-shadow" />
                            <span className="text-[9px] text-foreground/70 font-raleway font-semibold tracking-wider">
                              {rec.subject.slice(0, 4).toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-secondary/30 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-5 gap-2">
        {weekDays.map(day => {
          const dayCount = PERIODS.filter(p => getRecord(day, p)).length;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "glass-card rounded-lg p-2.5 text-center transition-all duration-200",
                isToday(day) && "border-primary/30 bg-primary/5"
              )}
            >
              <p className="text-[0.6rem] font-cinzel text-muted-foreground tracking-wider mb-1">
                {format(day, 'EEE')}
              </p>
              <p className={cn(
                "text-lg font-cinzel font-bold",
                dayCount > 0 ? "text-accent" : "text-muted-foreground/40"
              )}>
                {dayCount}
              </p>
              <p className="text-[9px] text-muted-foreground font-raleway">classes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyViewTab;
