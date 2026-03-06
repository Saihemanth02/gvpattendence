import { useState, useMemo } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const StudentsTab = () => {
  const { user } = useAuth();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: records } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);
  const [search, setSearch] = useState('');

  const studentStats = useMemo(() => {
    if (!students || !entries) return [];
    return students
      .filter(s => {
        if (user?.role === 'student' && s.suffix !== user.suffix) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.reg_number.toLowerCase().includes(q) || s.suffix.includes(q);
      })
      .map(s => {
        const sEntries = entries.filter(e => e.student_suffix === s.suffix);
        const present = sEntries.filter(e => e.status === 'present').length;
        const total = sEntries.length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { ...s, present, total, pct };
      });
  }, [students, entries, search, user]);

  if (studentsLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 bg-secondary/30 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in-up">
      <div className="glass-card p-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reg number, or suffix..."
            className="w-full bg-input/50 border border-border/50 rounded-md pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">#</th>
                <th className="text-left py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">REG NUMBER</th>
                <th className="text-left py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">NAME</th>
                <th className="text-center py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">CLASSES</th>
                <th className="text-center py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">PRESENT</th>
                <th className="text-left py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider min-w-[120px]">ATTENDANCE</th>
                <th className="text-center py-3 px-2 text-xs font-cinzel text-muted-foreground tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((s, i) => (
                <tr key={s.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-2 font-mono-num text-muted-foreground">{s.suffix}</td>
                  <td className="py-3 px-2 font-mono-num text-xs">{s.reg_number}</td>
                  <td className="py-3 px-2 font-cormorant">{s.name}</td>
                  <td className="py-3 px-2 text-center font-mono-num">{s.total}</td>
                  <td className="py-3 px-2 text-center font-mono-num">{s.present}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            s.pct >= 75 ? "bg-emerald-400" : s.pct >= 60 ? "bg-yellow-400" : "bg-red-400"
                          )}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-xs w-10 text-right">{s.pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      s.pct >= 75 ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {s.pct >= 75 ? '✓ Good' : '⚠ Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {studentStats.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsTab;
