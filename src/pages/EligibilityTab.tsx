import { useMemo, useState } from 'react';
import { useStudents, COURSE_SECTIONS } from '@/hooks/useStudents';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Filter, Download, Search, Shield, Users, UserCheck, UserX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SUBJECT_THRESHOLD = 65;
const OVERALL_THRESHOLD = 75;

const EligibilityTab = () => {
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const { data: students } = useStudents(sectionFilter || undefined);
  const { data: records } = useAttendanceRecords();
  const recordIds = useMemo(() => records?.map(r => r.id), [records]);
  const { data: entries } = useAttendanceEntries(recordIds);
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'not-eligible'>('all');
  const [search, setSearch] = useState('');

  // Filter records by section too
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!sectionFilter) return records;
    return records.filter(r => r.section === sectionFilter);
  }, [records, sectionFilter]);

  const eligibilityData = useMemo(() => {
    if (!students?.length || !filteredRecords?.length || !entries?.length) return [];

    return students.map(student => {
      const subjectMap: Record<string, { total: number; present: number }> = {};
      let totalClasses = 0;
      let totalPresent = 0;

      filteredRecords.forEach(record => {
        const entry = entries.find(
          e => e.record_id === record.id && e.student_suffix === student.suffix
        );
        if (!entry) return;

        if (!subjectMap[record.subject]) {
          subjectMap[record.subject] = { total: 0, present: 0 };
        }
        subjectMap[record.subject].total += 1;
        totalClasses += 1;

        if (entry.status === 'present') {
          subjectMap[record.subject].present += 1;
          totalPresent += 1;
        }
      });

      const overallPercent = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

      const subjects = Object.entries(subjectMap).map(([name, data]) => ({
        name,
        percent: data.total > 0 ? (data.present / data.total) * 100 : 0,
        total: data.total,
        present: data.present,
        meetsThreshold: data.total > 0 ? (data.present / data.total) * 100 >= SUBJECT_THRESHOLD : false,
      }));

      const allSubjectsMet = subjects.length > 0 && subjects.every(s => s.meetsThreshold);
      const overallMet = overallPercent >= OVERALL_THRESHOLD;
      const isEligible = allSubjectsMet && overallMet;

      return {
        ...student,
        subjects,
        overallPercent,
        overallMet,
        allSubjectsMet,
        isEligible,
        totalClasses,
        totalPresent,
      };
    });
  }, [students, filteredRecords, entries]);

  const withData = useMemo(() => eligibilityData.filter(s => s.totalClasses > 0), [eligibilityData]);

  const filtered = useMemo(() => {
    let list = withData;
    if (filterStatus === 'eligible') list = list.filter(s => s.isEligible);
    if (filterStatus === 'not-eligible') list = list.filter(s => !s.isEligible);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.reg_number.toLowerCase().includes(q) || s.suffix.includes(q));
    }
    return list;
  }, [withData, filterStatus, search]);

  const eligibleCount = withData.filter(s => s.isEligible).length;
  const notEligibleCount = withData.length - eligibleCount;

  const exportCSV = () => {
    if (!filtered.length) return;
    const subjects = [...new Set(filtered.flatMap(s => s.subjects.map(sub => sub.name)))].sort();
    const headers = ['Reg Number', 'Name', 'Suffix', 'Overall %', ...subjects.map(s => `${s} %`), 'Status'];
    const rows = filtered.map(s => [
      s.reg_number,
      s.name,
      s.suffix,
      s.overallPercent.toFixed(1),
      ...subjects.map(subName => {
        const sub = s.subjects.find(x => x.name === subName);
        return sub ? sub.percent.toFixed(1) : '0.0';
      }),
      s.isEligible ? 'Eligible' : 'Not Eligible',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eligibility-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      icon: Users,
      label: 'TOTAL STUDENTS',
      value: withData.length,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/15',
      borderClass: 'border-primary/30',
    },
    {
      icon: UserCheck,
      label: 'ELIGIBLE',
      value: eligibleCount,
      colorClass: 'text-accent',
      bgClass: 'bg-accent/15',
      borderClass: 'border-accent/30',
    },
    {
      icon: UserX,
      label: 'NOT ELIGIBLE',
      value: notEligibleCount,
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/15',
      borderClass: 'border-destructive/30',
    },
  ];

  return (
    <div className="p-4 md:p-6 animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-cinzel text-xs tracking-[0.2em] text-primary font-semibold">
            ELIGIBILITY REPORT
          </h2>
          <p className="text-xs text-muted-foreground font-raleway">
            Subject threshold: {SUBJECT_THRESHOLD}% · Overall threshold: {OVERALL_THRESHOLD}%
          </p>
        </div>
      </div>

      {/* Section Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setSectionFilter('')}
          className={cn(
            "px-3 py-1 rounded-[8px] text-[0.65rem] font-cinzel border transition-all duration-200",
            !sectionFilter
              ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40"
              : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
          )}
        >
          ALL
        </button>
        <span className="text-[0.5rem] text-muted-foreground/50 font-cinzel tracking-wider">PG:</span>
        {COURSE_SECTIONS.PG.map(sec => (
          <button
            key={sec}
            onClick={() => setSectionFilter(sec)}
            className={cn(
              "px-3 py-1 rounded-[8px] text-[0.65rem] font-cinzel border transition-all duration-200",
              sectionFilter === sec
                ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40"
                : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
            )}
          >
            {sec}
          </button>
        ))}
        <span className="text-[0.5rem] text-muted-foreground/50 font-cinzel tracking-wider">UG:</span>
        {COURSE_SECTIONS.UG.map(sec => (
          <button
            key={sec}
            onClick={() => setSectionFilter(sec)}
            className={cn(
              "px-3 py-1 rounded-[8px] text-[0.65rem] font-cinzel border transition-all duration-200",
              sectionFilter === sec
                ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40"
                : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
            )}
          >
            {sec}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map(card => (
          <div
            key={card.label}
            className="glass-card p-4 rounded-xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-200"
          >
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center border",
              card.bgClass,
              card.borderClass
            )}>
              <card.icon className={cn("w-5 h-5", card.colorClass)} />
            </div>
            <div>
              <p className="text-[0.6rem] font-cinzel tracking-[0.2em] text-muted-foreground uppercase">
                {card.label}
              </p>
              <p className={cn("text-2xl font-cinzel font-bold", card.colorClass)}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Criteria Info */}
      <div className="glass-card p-4 rounded-xl border-primary/20">
        <h3 className="font-cinzel text-[0.65rem] tracking-[0.2em] text-primary mb-2 uppercase font-semibold">
          Eligibility Criteria
        </h3>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-raleway">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Each subject ≥ <strong className="text-foreground">{SUBJECT_THRESHOLD}%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Overall attendance ≥ <strong className="text-foreground">{OVERALL_THRESHOLD}%</strong>
          </span>
        </div>
      </div>

      {/* Search & Filter & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name or reg number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 bg-card/70 border-primary/20 text-sm font-raleway focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'eligible' | 'not-eligible')}>
              <SelectTrigger className="w-48 bg-card/70 border-primary/20 font-raleway text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="eligible">Eligible Only</SelectItem>
                <SelectItem value="not-eligible">Not Eligible Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          size="sm"
          className="border-primary/30 text-primary hover:bg-primary/10 font-cinzel text-xs tracking-wider"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          EXPORT CSV
        </Button>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-card p-10 rounded-xl text-center">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-raleway text-sm">No attendance data available yet.</p>
          </div>
        )}
        {filtered.map(student => (
          <div
            key={student.id}
            className="glass-card p-4 rounded-xl glass-card-hover transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-cinzel font-semibold text-foreground text-sm">{student.name}</p>
                <p className="text-[0.65rem] text-muted-foreground font-raleway tracking-wider">
                  {student.reg_number} · Suffix: {student.suffix}
                </p>
              </div>
              <Badge
                variant={student.isEligible ? 'default' : 'destructive'}
                className={cn(
                  "flex items-center gap-1 font-cinzel text-[0.6rem] tracking-wider px-2.5 py-1",
                  student.isEligible
                    ? "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
                )}
              >
                {student.isEligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {student.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </Badge>
            </div>

            {/* Overall */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[0.6rem] text-muted-foreground w-16 font-cinzel tracking-wider">OVERALL</span>
              <div className="flex-1 h-2.5 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    student.overallMet ? "bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.3)]" : "bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.3)]"
                  )}
                  style={{ width: `${Math.min(student.overallPercent, 100)}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-bold w-14 text-right font-cinzel",
                student.overallMet ? "text-accent" : "text-destructive"
              )}>
                {student.overallPercent.toFixed(1)}%
              </span>
            </div>

            {/* Per Subject */}
            <div className="space-y-1.5">
              {student.subjects.map(sub => (
                <div key={sub.name} className="flex items-center gap-2">
                  <span className="text-[0.6rem] text-muted-foreground w-16 truncate font-raleway" title={sub.name}>
                    {sub.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        sub.meetsThreshold ? "bg-accent/70" : "bg-destructive/70"
                      )}
                      style={{ width: `${Math.min(sub.percent, 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium w-14 text-right font-raleway",
                    sub.meetsThreshold ? "text-accent" : "text-destructive"
                  )}>
                    {sub.present}/{sub.total} ({sub.percent.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EligibilityTab;
