import { useState, useMemo } from 'react';
import { useStudents, COURSE_SECTIONS } from '@/hooks/useStudents';
import { useSubmitAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send, CheckCircle, XCircle } from 'lucide-react';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const MarkAttendanceTab = ({ selectedSection }: { selectedSection: string }) => {
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState(selectedSection);
  const [date, setDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<number | null>(null);
  const [absentText, setAbsentText] = useState('');

  const { data: students } = useStudents(section || undefined);
  const submitMutation = useSubmitAttendance();

  const allSuffixes = useMemo(() => (students || []).map(s => s.suffix), [students]);
  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (students || []).forEach(s => { map[s.suffix] = s.name; });
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
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/15 border border-primary/30">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-cinzel text-base font-semibold text-primary tracking-[0.2em]">MARK ATTENDANCE</h2>
            <p className="text-[0.6rem] text-muted-foreground tracking-[0.15em] uppercase">Fill in the details below</p>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] mb-2 block uppercase">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            className="w-full bg-card/70 border border-primary/10 rounded-[10px] px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_hsla(42,88%,55%,0.08)] transition-all duration-200"
          />
        </div>

        {/* Section */}
        <div>
          <label className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] mb-2 block uppercase">Course / Section</label>
          
          {/* PG */}
          <p className="text-[0.55rem] text-muted-foreground/70 font-cinzel tracking-[0.15em] uppercase mb-1.5 mt-1">Postgraduate (PG)</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {COURSE_SECTIONS.PG.map(s => (
              <button
                key={s}
                onClick={() => { setSection(s); setAbsentText(''); }}
                className={cn(
                  "px-4 py-2 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                  section === s
                    ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                    : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* UG */}
          <p className="text-[0.55rem] text-muted-foreground/70 font-cinzel tracking-[0.15em] uppercase mb-1.5">Undergraduate (UG)</p>
          <div className="flex gap-2 flex-wrap">
            {COURSE_SECTIONS.UG.map(s => (
              <button
                key={s}
                onClick={() => { setSection(s); setAbsentText(''); }}
                className={cn(
                  "px-4 py-2 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                  section === s
                    ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                    : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] mb-2 block uppercase">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 bg-card/70 border border-primary/10 rounded-[10px] px-4 py-3 text-foreground hover:border-primary/30 transition-all duration-200">
                <CalendarIcon className="w-4 h-4 text-primary/60" />
                <span className="font-mono-num text-sm">{format(date, 'dd MMM yyyy')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Period */}
        <div>
          <label className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] mb-2 block uppercase">Period</label>
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "w-11 h-11 rounded-[10px] text-sm font-mono-num border transition-all duration-200",
                  period === p
                    ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                    : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
                )}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>

        {/* Absent suffixes */}
        <div>
          <label className="text-[0.65rem] text-muted-foreground font-cinzel tracking-[0.2em] mb-2 block uppercase">
            Absent Roll Suffixes
          </label>
          <p className="text-[0.6rem] text-muted-foreground/60 mb-2">
            {section ? `${allSuffixes.length} students in ${section} · Comma or space separated` : 'Select a course first'}
          </p>
          <textarea
            value={absentText}
            onChange={e => setAbsentText(e.target.value)}
            placeholder={section ? "e.g. 002, 015, 033" : "Select a course/section first..."}
            disabled={!section}
            rows={3}
            className="w-full bg-card/70 border border-primary/10 rounded-[10px] px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_hsla(42,88%,55%,0.08)] transition-all duration-200 font-mono-num resize-none disabled:opacity-40"
          />
        </div>

        {/* Preview chips */}
        {parsedAbsent.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parsedAbsent.map(suffix => (
              <span key={suffix} className="px-3 py-1 text-[0.7rem] rounded-[8px] bg-destructive/10 border border-destructive/20 text-destructive font-mono-num flex items-center gap-1.5">
                <XCircle className="w-3 h-3" />
                {suffix} — {studentMap[suffix]}
              </span>
            ))}
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center gap-4 p-3 rounded-[10px] bg-card/50 border border-primary/10">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="font-mono-num text-sm text-destructive font-semibold">{parsedAbsent.length}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">absent</span>
          </div>
          <span className="text-muted-foreground/20">|</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,50%,48%)]" />
            <span className="font-mono-num text-sm text-[hsl(150,50%,48%)] font-semibold">{presentCount}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">present</span>
          </div>
          <span className="text-muted-foreground/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-num text-sm text-muted-foreground">{allSuffixes.length}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">total</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-[10px] bg-gradient-to-r from-gold-dark via-primary to-gold-light text-primary-foreground font-cinzel font-bold tracking-[0.15em] text-sm hover:shadow-[0_0_25px_hsla(42,88%,55%,0.3)] transition-all duration-300 disabled:opacity-40 disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              SUBMIT ATTENDANCE
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarkAttendanceTab;
