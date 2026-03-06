import { useState, useMemo } from 'react';
import { useStudents, STUDENT_SEED_DATA } from '@/hooks/useStudents';
import { useSubmitAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send } from 'lucide-react';

const SECTIONS = ['A', 'B', 'CSE', 'MCA'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const MarkAttendanceTab = () => {
  const { data: students } = useStudents();
  const submitMutation = useSubmitAttendance();

  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<number | null>(null);
  const [absentText, setAbsentText] = useState('');

  const allSuffixes = useMemo(() => (students || STUDENT_SEED_DATA).map(s => s.suffix), [students]);
  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (students || STUDENT_SEED_DATA).forEach(s => { map[s.suffix] = s.name; });
    return map;
  }, [students]);

  const parsedAbsent = useMemo(() => {
    return absentText
      .split(/[\s,]+/)
      .map(s => s.trim().padStart(3, '0'))
      .filter(s => s.length === 3 && studentMap[s]);
  }, [absentText, studentMap]);

  const presentCount = allSuffixes.length - parsedAbsent.length;

  const handleSubmit = () => {
    if (!subject || !section || !period) return;
    submitMutation.mutate({
      date: format(date, 'yyyy-MM-dd'),
      subject,
      section,
      period,
      absentSuffixes: parsedAbsent,
      allSuffixes,
    });
  };

  const canSubmit = subject && section && period && !submitMutation.isPending;

  return (
    <div className="p-4 md:p-6 animate-fade-in-up max-w-3xl mx-auto">
      <div className="glass-card p-6 space-y-5">
        <h2 className="font-cinzel text-lg text-primary tracking-wider">MARK ATTENDANCE</h2>

        {/* Subject */}
        <div>
          <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">SUBJECT</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            className="w-full bg-input/50 border border-border/50 rounded-md px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Section */}
        <div>
          <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">SECTION</label>
          <div className="flex gap-2 flex-wrap">
            {SECTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-cinzel border transition-all",
                  section === s
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">DATE</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 bg-input/50 border border-border/50 rounded-md px-4 py-2.5 text-foreground hover:border-primary/30 transition-colors">
                <CalendarIcon className="w-4 h-4 text-primary/60" />
                {format(date, 'PPP')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Period */}
        <div>
          <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">PERIOD</label>
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-mono-num border transition-all",
                  period === p
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground"
                )}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>

        {/* Absent suffixes */}
        <div>
          <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">
            ABSENT ROLL SUFFIXES (comma or space separated)
          </label>
          <textarea
            value={absentText}
            onChange={e => setAbsentText(e.target.value)}
            placeholder="e.g. 002, 015, 033"
            rows={3}
            className="w-full bg-input/50 border border-border/50 rounded-md px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-mono-num"
          />
        </div>

        {/* Preview chips */}
        {parsedAbsent.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parsedAbsent.map(suffix => (
              <span key={suffix} className="px-2 py-1 text-xs rounded-md bg-primary/10 border border-primary/20 text-primary font-cormorant">
                {suffix} — {studentMap[suffix]}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="text-sm text-muted-foreground font-mono-num">
          <span className="text-red-400">{parsedAbsent.length} absent</span>
          <span className="mx-2">·</span>
          <span className="text-emerald-400">{presentCount} present</span>
          <span className="mx-2">out of</span>
          <span>{allSuffixes.length}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-md bg-gradient-to-r from-gold-dark via-primary to-gold-light text-primary-foreground font-cinzel font-bold tracking-wider hover:shadow-[0_0_20px_hsla(42,88%,55%,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Attendance
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarkAttendanceTab;
