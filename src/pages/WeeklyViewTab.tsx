import { useAttendanceRecords } from '@/hooks/useAttendance';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const WeeklyViewTab = () => {
  const { data: records, isLoading } = useAttendanceRecords();

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 5); // Mon-Fri
  }, []);

  const getRecord = (day: Date, period: number) => {
    return records?.find(r => isSameDay(new Date(r.date), day) && r.period === period);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-64 bg-secondary/30 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in-up">
      <div className="glass-card p-5 overflow-x-auto">
        <h2 className="font-cinzel text-sm text-primary tracking-wider mb-4">
          WEEKLY VIEW — {format(weekDays[0], 'dd MMM')} to {format(weekDays[4], 'dd MMM yyyy')}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">DAY</th>
              {PERIODS.map(p => (
                <th key={p} className="text-center py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">P{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map(day => (
              <tr
                key={day.toISOString()}
                className={cn(
                  "border-b border-border/10",
                  isToday(day) && "bg-primary/5"
                )}
              >
                <td className={cn(
                  "py-3 px-2 font-cinzel text-xs",
                  isToday(day) ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE dd')}
                  {isToday(day) && <span className="ml-1 text-[9px] text-primary/60">(Today)</span>}
                </td>
                {PERIODS.map(p => {
                  const rec = getRecord(day, p);
                  return (
                    <td key={p} className="py-3 px-2 text-center">
                      {rec ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_6px_hsla(152,69%,50%,0.4)]" />
                          <span className="text-[9px] text-muted-foreground font-mono-num">
                            {rec.subject.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-secondary/30 mx-auto" />
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
  );
};

export default WeeklyViewTab;
