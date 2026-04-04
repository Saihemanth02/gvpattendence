import { useState, useMemo, useRef } from 'react';
import { useStudents, COURSE_SECTIONS } from '@/hooks/useStudents';
import { useMarks, useUpsertMark, useBulkUpsertMarks, useDeleteMark, useMarkSubjects, useAttendanceSubjects } from '@/hooks/useMarks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Trash2, Save, FileSpreadsheet, Plus } from 'lucide-react';

const MarksTab = () => {
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMid1, setEditMid1] = useState('');
  const [editMid2, setEditMid2] = useState('');
  const [newSuffix, setNewSuffix] = useState('');
  const [newMid1, setNewMid1] = useState('');
  const [newMid2, setNewMid2] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: students } = useStudents(section || undefined);
  const { data: marks, isLoading } = useMarks(section || undefined, subject || undefined);
  const { data: markSubjects } = useMarkSubjects(section || undefined);
  const { data: attendanceSubjects } = useAttendanceSubjects(section || undefined);
  const upsertMark = useUpsertMark();
  const bulkUpsert = useBulkUpsertMarks();
  const deleteMark = useDeleteMark();

  const subjectSuggestions = useMemo(() => {
    const all = new Set([...(markSubjects || []), ...(attendanceSubjects || [])]);
    const list = [...all].sort();
    if (!subject) return list;
    return list.filter(s => s.toLowerCase().includes(subject.toLowerCase()));
  }, [markSubjects, attendanceSubjects, subject]);

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (students || []).forEach(s => { map[s.suffix] = s.name; });
    return map;
  }, [students]);

  const handleSave = (suffix: string, mid1Val: string, mid2Val: string) => {
    if (!section || !subject) {
      toast.error('Select section and enter subject first');
      return;
    }
    const mid1 = mid1Val ? parseFloat(mid1Val) : null;
    const mid2 = mid2Val ? parseFloat(mid2Val) : null;
    if (mid1 !== null && (mid1 < 0 || mid1 > 20)) { toast.error('Mid-1 must be 0-20'); return; }
    if (mid2 !== null && (mid2 < 0 || mid2 > 20)) { toast.error('Mid-2 must be 0-20'); return; }
    upsertMark.mutate({ student_suffix: suffix, section, subject, mid1, mid2 });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newSuffix.trim()) { toast.error('Enter student suffix'); return; }
    handleSave(newSuffix.trim(), newMid1, newMid2);
    setNewSuffix('');
    setNewMid1('');
    setNewMid2('');
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !section || !subject) {
      toast.error('Select section and subject before uploading');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      // Expect: suffix,mid1,mid2
      const rows: { student_suffix: string; section: string; subject: string; mid1: number | null; mid2: number | null }[] = [];
      const startIdx = lines[0]?.toLowerCase().includes('suffix') ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 1) continue;
        const suffix = cols[0];
        const mid1 = cols[1] ? parseFloat(cols[1]) : null;
        const mid2 = cols[2] ? parseFloat(cols[2]) : null;
        if (mid1 !== null && (isNaN(mid1) || mid1 < 0 || mid1 > 20)) continue;
        if (mid2 !== null && (isNaN(mid2) || mid2 < 0 || mid2 > 20)) continue;
        rows.push({ student_suffix: suffix, section, subject, mid1, mid2 });
      }
      if (rows.length === 0) { toast.error('No valid rows found in CSV'); return; }
      bulkUpsert.mutate(rows);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-[1000px] mx-auto animate-fade-in-up">
      {/* Section Filter */}
      <div className="glass-card p-4">
        <h3 className="font-cinzel text-xs font-semibold text-primary tracking-[0.2em] uppercase mb-3">Select Course</h3>
        <div className="space-y-2">
          {Object.entries(COURSE_SECTIONS).map(([group, sections]) => (
            <div key={group} className="flex flex-wrap items-center gap-2">
              <span className="text-[0.65rem] font-cinzel tracking-[0.15em] uppercase text-muted-foreground w-8">{group}</span>
              {sections.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={section === s ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setSection(section === s ? '' : s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Subject Input & Actions */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center gap-2 flex-1 min-w-[200px]">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <Input
            placeholder="Subject name (e.g., DBMS)"
            value={subject}
            onChange={e => { setSubject(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="h-9 text-sm"
          />
          {showSuggestions && subjectSuggestions.length > 0 && (
            <div className="absolute top-full left-6 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-primary/20 bg-background shadow-lg">
              {subjectSuggestions.map(s => (
                <button
                  key={s}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSubject(s); setShowSuggestions(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
        <Button
          size="sm"
          variant="outline"
          className="h-9 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => fileRef.current?.click()}
          disabled={!section || !subject}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload CSV
        </Button>
      </div>

      {/* CSV Format Help */}
      <div className="glass-card p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">CSV Format:</span> suffix, mid1, mid2 — e.g. <code className="bg-secondary px-1 rounded">002,18,16</code> (header row optional)
      </div>

      {/* Marks Table */}
      {section && subject && (
        <div className="glass-card p-4 md:p-5">
          <h3 className="font-cinzel text-xs font-semibold text-primary tracking-[0.2em] uppercase mb-4">
            Marks — {section} · {subject}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-2 px-2 text-xs font-cinzel text-muted-foreground">Suffix</th>
                  <th className="text-left py-2 px-2 text-xs font-cinzel text-muted-foreground">Name</th>
                  <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Mid-1 (20)</th>
                  <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Mid-2 (20)</th>
                  <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Internal</th>
                  <th className="text-center py-2 px-2 text-xs font-cinzel text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : (marks || []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No marks entered yet</td></tr>
                ) : (
                  (marks || []).map(m => (
                    <tr key={m.id} className="border-b border-primary/5 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-2 font-mono text-xs">{m.student_suffix}</td>
                      <td className="py-2 px-2 text-xs">{studentMap[m.student_suffix] || '—'}</td>
                      {editingId === m.id ? (
                        <>
                          <td className="py-2 px-2 text-center">
                            <Input value={editMid1} onChange={e => setEditMid1(e.target.value)} className="h-7 w-16 mx-auto text-center text-xs" type="number" min={0} max={20} step={0.5} />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Input value={editMid2} onChange={e => setEditMid2(e.target.value)} className="h-7 w-16 mx-auto text-center text-xs" type="number" min={0} max={20} step={0.5} />
                          </td>
                          <td className="py-2 px-2 text-center text-xs text-muted-foreground">—</td>
                          <td className="py-2 px-2 text-center">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => handleSave(m.student_suffix, editMid1, editMid2)}>
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-2 text-center text-xs font-semibold">{m.mid1 ?? '—'}</td>
                          <td className="py-2 px-2 text-center text-xs font-semibold">{m.mid2 ?? '—'}</td>
                          <td className={cn(
                            'py-2 px-2 text-center text-xs font-bold',
                            m.internal !== null && m.internal >= 10 ? 'text-[hsl(150,50%,48%)]' : 'text-destructive'
                          )}>
                            {m.internal ?? '—'}
                          </td>
                          <td className="py-2 px-2 text-center flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => { setEditingId(m.id); setEditMid1(m.mid1?.toString() || ''); setEditMid2(m.mid2?.toString() || ''); }}
                            >
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMark.mutate(m.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
                {/* Add new row */}
                <tr className="border-t border-primary/20">
                  <td className="py-2 px-2">
                    <Input value={newSuffix} onChange={e => setNewSuffix(e.target.value)} placeholder="Suffix" className="h-7 w-16 text-xs" />
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">{newSuffix ? (studentMap[newSuffix] || '—') : ''}</td>
                  <td className="py-2 px-2 text-center">
                    <Input value={newMid1} onChange={e => setNewMid1(e.target.value)} className="h-7 w-16 mx-auto text-center text-xs" type="number" min={0} max={20} step={0.5} placeholder="Mid-1" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Input value={newMid2} onChange={e => setNewMid2(e.target.value)} className="h-7 w-16 mx-auto text-center text-xs" type="number" min={0} max={20} step={0.5} placeholder="Mid-2" />
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-muted-foreground">—</td>
                  <td className="py-2 px-2 text-center">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={handleAdd}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksTab;
