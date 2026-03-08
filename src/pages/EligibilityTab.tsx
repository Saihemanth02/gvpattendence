import { useMemo, useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SUBJECT_THRESHOLD = 65;
const OVERALL_THRESHOLD = 75;

const EligibilityTab = () => {
  const { data: students } = useStudents();
  const { data: records } = useAttendanceRecords();
  const recordIds = useMemo(() => records?.map(r => r.id), [records]);
  const { data: entries } = useAttendanceEntries(recordIds);
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'not-eligible'>('all');

  const eligibilityData = useMemo(() => {
    if (!students?.length || !records?.length || !entries?.length) return [];

    return students.map(student => {
      const subjectMap: Record<string, { total: number; present: number }> = {};
      let totalClasses = 0;
      let totalPresent = 0;

      records.forEach(record => {
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
  }, [students, records, entries]);

  const withData = useMemo(() => eligibilityData.filter(s => s.totalClasses > 0), [eligibilityData]);

  const filtered = useMemo(() => {
    if (filterStatus === 'eligible') return withData.filter(s => s.isEligible);
    if (filterStatus === 'not-eligible') return withData.filter(s => !s.isEligible);
    return withData;
  }, [withData, filterStatus]);

  const eligibleCount = withData.filter(s => s.isEligible).length;
  const notEligibleCount = withData.length - eligibleCount;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-muted-foreground text-sm font-cormorant">Total Students</p>
          <p className="text-3xl font-bold font-cinzel text-primary">{withData.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-muted-foreground text-sm font-cormorant">Eligible</p>
          <p className="text-3xl font-bold font-cinzel text-green-500">{eligibleCount}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-muted-foreground text-sm font-cormorant">Not Eligible</p>
          <p className="text-3xl font-bold font-cinzel text-red-400">{notEligibleCount}</p>
        </div>
      </div>

      {/* Criteria Info */}
      <div className="glass-card p-4 rounded-lg">
        <h3 className="font-cinzel text-sm text-primary mb-2">Eligibility Criteria</h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>• Each subject ≥ <strong className="text-foreground">{SUBJECT_THRESHOLD}%</strong></span>
          <span>• Overall attendance ≥ <strong className="text-foreground">{OVERALL_THRESHOLD}%</strong></span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'eligible' | 'not-eligible')}>
          <SelectTrigger className="w-48 glass-card border-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="eligible">Eligible Only</SelectItem>
            <SelectItem value="not-eligible">Not Eligible Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-card p-8 rounded-lg text-center text-muted-foreground">
            No attendance data available yet.
          </div>
        )}
        {filtered.map(student => (
          <div key={student.id} className="glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-cinzel font-semibold text-foreground">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.reg_number} · Suffix: {student.suffix}</p>
              </div>
              <Badge
                variant={student.isEligible ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {student.isEligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {student.isEligible ? 'Eligible' : 'Not Eligible'}
              </Badge>
            </div>

            {/* Overall */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground w-16">Overall</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${student.overallMet ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(student.overallPercent, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium w-12 text-right ${student.overallMet ? 'text-green-500' : 'text-red-400'}`}>
                {student.overallPercent.toFixed(1)}%
              </span>
            </div>

            {/* Per Subject */}
            {student.subjects.map(sub => (
              <div key={sub.name} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground w-16 truncate" title={sub.name}>{sub.name}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${sub.meetsThreshold ? 'bg-green-500/70' : 'bg-red-400/70'}`}
                    style={{ width: `${Math.min(sub.percent, 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium w-12 text-right ${sub.meetsThreshold ? 'text-green-500' : 'text-red-400'}`}>
                  {sub.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EligibilityTab;
