import { useAttendanceRecords } from '@/hooks/useAttendance';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const WeeklyViewTab = ({ selectedSection: sectionFilter }: { selectedSection: string }) => {
  const { data: records, isLoading } = useAttendanceRecords();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 6); // Mon-Sat
  }, [currentDate]);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    let filtered = records;
    if (sectionFilter && sectionFilter !== 'all') {
      filtered = filtered.filter(r => r.section === sectionFilter);
    }
    return filtered;
  }, [records, sectionFilter]);

  const getRecord = (day: Date, period: number) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return filteredRecords.find(r => r.date === dayStr && r.period === period);
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

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goNext = () => setCurrentDate(prev => addWeeks(prev, 1));

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const thisStart = startOfWeek(now, { weekStartsOn: 1 });
    const viewStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return format(thisStart, 'yyyy-MM-dd') === format(viewStart, 'yyyy-MM-dd');
  }, [currentDate]);

  // Month summary: count of classes per week in the current month
  const monthWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weeks: { start: Date; end: Date; count: number }[] = [];
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    while (weekStart <= monthEnd) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 6);
      let count = 0;
      days.forEach(day => {
        if (isSameMonth(day, currentDate)) {
          PERIODS.forEach(p => {
            if (getRecord(day, p)) count++;
          });
        }
      });
      weeks.push({ start: weekStart, end: weekEnd, count });
      weekStart = addWeeks(weekStart, 1);
    }
    return weeks;
  }, [currentDate, filteredRecords]);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-cinzel text-xs tracking-[0.2em] text-primary font-semibold">
              WEEKLY VIEW
            </h2>
            <p className="text-xs text-muted-foreground">
              {format(weekDays[0], 'dd MMM')} — {format(weekDays[weekDays.length - 1], 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="w-8 h-8 rounded-lg border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            disabled={isCurrentWeek}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-cinzel tracking-wider border transition-colors",
              isCurrentWeek
                ? "border-primary/30 bg-primary/10 text-primary cursor-default"
                : "border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40"
            )}
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="w-8 h-8 rounded-lg border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month label + slots */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-cinzel text-muted-foreground tracking-[0.15em]">
          {format(currentDate, 'MMMM yyyy').toUpperCase()}
        </span>
        <div className="glass-card px-3 py-1.5 rounded-lg">
          <span className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{filledSlots}</span> / {totalSlots} slots filled
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                        <span className="text-[9px] text-primary/60 tracking-wider">(TODAY)</span>
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
                            <span className="text-[9px] text-foreground/70 font-semibold tracking-wider">
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
      <div className="grid grid-cols-6 gap-2">
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
              <p className="text-[9px] text-muted-foreground">classes</p>
            </div>
          );
        })}
      </div>

      {/* Month Overview */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="font-cinzel text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
          {format(currentDate, 'MMMM')} Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {monthWeeks.map((w, i) => {
            const isActive = format(w.start, 'yyyy-MM-dd') === format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            return (
              <button
                key={i}
                onClick={() => setCurrentDate(w.start)}
                className={cn(
                  "rounded-lg p-2.5 text-center border transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/20 hover:border-primary/20 hover:bg-primary/5"
                )}
              >
                <p className="text-[0.6rem] font-cinzel text-muted-foreground tracking-wider">
                  {format(w.start, 'dd MMM')} – {format(w.end, 'dd')}
                </p>
                <p className={cn(
                  "text-base font-cinzel font-bold mt-0.5",
                  w.count > 0 ? "text-accent" : "text-muted-foreground/40"
                )}>
                  {w.count}
                </p>
                <p className="text-[8px] text-muted-foreground">classes</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyViewTab;
