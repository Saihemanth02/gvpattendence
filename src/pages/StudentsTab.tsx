import { useState, useMemo, useRef } from 'react';
import { useStudents, useSections, useAddStudent, useRemoveStudent, useBulkAddStudents, COURSE_SECTIONS, ALL_SECTIONS } from '@/hooks/useStudents';
import { useAttendanceRecords, useAttendanceEntries } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, ChevronDown, ChevronUp, Plus, Trash2, X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const StudentsTab = ({ selectedSection: globalSection }: { selectedSection: string }) => {
  const { user } = useAuth();
  const { data: sections } = useSections();
  const selectedSection = globalSection;
  const { data: students, isLoading: studentsLoading } = useStudents(selectedSection || undefined);
  const { data: records } = useAttendanceRecords();
  const recordIds = records?.map(r => r.id) || [];
  const { data: entries } = useAttendanceEntries(recordIds);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'pct'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ suffix: string; reg_number: string; name: string; section: string }[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState({ suffix: '', reg_number: '', name: '', section: 'MCA' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = useAddStudent();
  const removeMutation = useRemoveStudent();
  const bulkAddMutation = useBulkAddStudents();

  const isFaculty = user?.role === 'faculty';

  const studentStats = useMemo(() => {
    if (!students || !entries) return [];
    const list = students
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
    list.sort((a, b) => {
      const val = sortField === 'name' ? a.name.localeCompare(b.name) : a.pct - b.pct;
      return sortAsc ? val : -val;
    });
    return list;
  }, [students, entries, search, user, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'pct') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: 'name' | 'pct' }) => (
    sortField === field
      ? (sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1 text-primary" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-primary" />)
      : null
  );

  const handleAdd = () => {
    if (!newStudent.suffix || !newStudent.reg_number || !newStudent.name || !newStudent.section) return;
    addMutation.mutate(newStudent, {
      onSuccess: () => {
        setNewStudent({ suffix: '', reg_number: '', name: '', section: selectedSection || 'MCA' });
        setShowAddForm(false);
      }
    });
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      setCsvErrors(['CSV must have a header row and at least one data row']);
      return;
    }
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const suffixIdx = header.findIndex(h => h === 'suffix');
    const regIdx = header.findIndex(h => h === 'reg_number' || h === 'registration number' || h === 'reg number' || h === 'regnumber');
    const nameIdx = header.findIndex(h => h === 'name' || h === 'student name' || h === 'full name');
    const sectionIdx = header.findIndex(h => h === 'section' || h === 'course');

    const missing: string[] = [];
    if (suffixIdx === -1) missing.push('suffix');
    if (regIdx === -1) missing.push('reg_number');
    if (nameIdx === -1) missing.push('name');
    if (missing.length > 0) {
      setCsvErrors([`Missing required columns: ${missing.join(', ')}. Required: suffix, reg_number, name. Optional: section`]);
      return;
    }

    const errors: string[] = [];
    const parsed: { suffix: string; reg_number: string; name: string; section: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const suffix = cols[suffixIdx] || '';
      const reg_number = cols[regIdx] || '';
      const name = cols[nameIdx] || '';
      const section = sectionIdx !== -1 ? (cols[sectionIdx] || 'MCA') : 'MCA';

      if (!suffix || !reg_number || !name) {
        errors.push(`Row ${i + 1}: missing required fields`);
        continue;
      }
      if (suffix.length > 10 || reg_number.length > 50 || name.length > 255) {
        errors.push(`Row ${i + 1}: field too long`);
        continue;
      }
      parsed.push({ suffix, reg_number, name, section });
    }

    setCsvErrors(errors);
    setCsvPreview(parsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('File too large (max 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBulkImport = () => {
    if (csvPreview.length === 0) return;
    bulkAddMutation.mutate(csvPreview, {
      onSuccess: () => {
        setCsvPreview([]);
        setCsvErrors([]);
        setShowCsvImport(false);
      }
    });
  };

  if (studentsLoading) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-[1200px] mx-auto">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 bg-secondary/30 rounded-[10px]" />)}
      </div>
    );
  }

  

  return (
    <div className="p-4 md:p-6 animate-fade-in-up max-w-[1200px] mx-auto">
      <div className="glass-card p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/15 border border-primary/30">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-cinzel text-[0.85rem] font-semibold text-primary tracking-[0.2em] uppercase">Students</h2>
              <p className="text-[0.6rem] text-muted-foreground tracking-[0.15em] uppercase">{studentStats.length} records{selectedSection ? ` · ${selectedSection}` : ''}</p>
            </div>
          </div>
          {isFaculty && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowCsvImport(!showCsvImport); if (showAddForm) setShowAddForm(false); setCsvPreview([]); setCsvErrors([]); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                  showCsvImport
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-accent/10 border-accent/30 text-accent-foreground hover:bg-accent/20"
                )}
              >
                {showCsvImport ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                {showCsvImport ? 'Cancel' : 'Import CSV'}
              </button>
              <button
                onClick={() => { setShowAddForm(!showAddForm); if (showCsvImport) setShowCsvImport(false); setNewStudent(s => ({ ...s, section: selectedSection || 'MCA' })); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                  showAddForm
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                )}
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? 'Cancel' : 'Add'}
              </button>
            </div>
          )}
        </div>

        {/* Section Filter */}
        <div className="mb-4 space-y-3">
          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedSection('')}
              className={cn(
                "px-4 py-1.5 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                !selectedSection
                  ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                  : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
              )}
            >
              ALL
            </button>
          </div>

          {/* PG Section */}
          <div>
            <p className="text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase mb-1.5">Postgraduate (PG)</p>
            <div className="flex gap-2 flex-wrap">
              {COURSE_SECTIONS.PG.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={cn(
                    "px-4 py-1.5 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                    selectedSection === sec
                      ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                      : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
                  )}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* UG Section */}
          <div>
            <p className="text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase mb-1.5">Undergraduate (UG)</p>
            <div className="flex gap-2 flex-wrap">
              {COURSE_SECTIONS.UG.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={cn(
                    "px-4 py-1.5 rounded-[10px] text-xs font-cinzel border transition-all duration-200",
                    selectedSection === sec
                      ? "bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
                      : "bg-card/70 text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/25"
                  )}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Student Form */}
        {showAddForm && isFaculty && (
          <div className="mb-5 p-4 rounded-[10px] bg-card/70 border border-primary/15 space-y-3 animate-fade-in-up">
            <h3 className="font-cinzel text-[0.7rem] text-primary tracking-[0.15em] uppercase font-semibold">Add New Student</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newStudent.suffix}
                onChange={e => setNewStudent(s => ({ ...s, suffix: e.target.value }))}
                placeholder="Suffix (e.g. 060)"
                className="bg-background/50 border border-primary/10 rounded-[8px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all font-mono-num"
              />
              <input
                type="text"
                value={newStudent.reg_number}
                onChange={e => setNewStudent(s => ({ ...s, reg_number: e.target.value }))}
                placeholder="Reg Number"
                className="bg-background/50 border border-primary/10 rounded-[8px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all font-mono-num"
              />
              <input
                type="text"
                value={newStudent.name}
                onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
                placeholder="Full Name"
                className="bg-background/50 border border-primary/10 rounded-[8px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all"
              />
              <select
                value={newStudent.section}
                onChange={e => setNewStudent(s => ({ ...s, section: e.target.value }))}
                className="bg-background/50 border border-primary/10 rounded-[8px] px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-all"
              >
                <optgroup label="Postgraduate (PG)">
                  {COURSE_SECTIONS.PG.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </optgroup>
                <optgroup label="Undergraduate (UG)">
                  {COURSE_SECTIONS.UG.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </optgroup>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newStudent.suffix || !newStudent.name || !newStudent.reg_number || !newStudent.section}
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-gold-dark via-primary to-gold-light text-primary-foreground font-cinzel text-xs tracking-[0.15em] font-bold hover:shadow-[0_0_20px_hsla(42,88%,55%,0.25)] transition-all disabled:opacity-40"
            >
              {addMutation.isPending ? 'Adding...' : 'ADD STUDENT'}
            </button>
          </div>
        )}

        {/* CSV Import Panel */}
        {showCsvImport && isFaculty && (
          <div className="mb-5 p-4 rounded-[10px] bg-card/70 border border-primary/15 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-[0.7rem] text-primary tracking-[0.15em] uppercase font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Bulk Import from CSV
              </h3>
            </div>
            
            <div className="text-[0.7rem] text-muted-foreground space-y-1">
              <p>CSV format: <span className="font-mono-num text-foreground/70">suffix, reg_number, name, section</span></p>
              <p>The <span className="text-foreground/70">section</span> column is optional (defaults to MCA).</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-dashed border-primary/25 bg-primary/5 text-sm text-primary hover:bg-primary/10 hover:border-primary/40 transition-all w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Choose CSV File
            </button>

            {csvErrors.length > 0 && (
              <div className="space-y-1">
                {csvErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {err}
                  </p>
                ))}
              </div>
            )}

            {csvPreview.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(150,50%,48%)]" />
                  <span><span className="text-foreground font-semibold">{csvPreview.length}</span> students ready to import</span>
                </p>
                <div className="max-h-[200px] overflow-y-auto rounded-[8px] border border-primary/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-primary/15 bg-card/50">
                        <th className="text-left py-2 px-3 text-muted-foreground font-cinzel tracking-wider">Suffix</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-cinzel tracking-wider">Reg Number</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-cinzel tracking-wider">Name</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-cinzel tracking-wider">Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((s, i) => (
                        <tr key={i} className="border-b border-primary/5">
                          <td className="py-1.5 px-3 font-mono-num">{s.suffix}</td>
                          <td className="py-1.5 px-3 font-mono-num">{s.reg_number}</td>
                          <td className="py-1.5 px-3">{s.name}</td>
                          <td className="py-1.5 px-3 font-cinzel">{s.section}</td>
                        </tr>
                      ))}
                      {csvPreview.length > 10 && (
                        <tr><td colSpan={4} className="py-1.5 px-3 text-center text-muted-foreground">...and {csvPreview.length - 10} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleBulkImport}
                  disabled={bulkAddMutation.isPending}
                  className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-gold-dark via-primary to-gold-light text-primary-foreground font-cinzel text-xs tracking-[0.15em] font-bold hover:shadow-[0_0_20px_hsla(42,88%,55%,0.25)] transition-all disabled:opacity-40"
                >
                  {bulkAddMutation.isPending ? 'Importing...' : `IMPORT ${csvPreview.length} STUDENTS`}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reg number, or suffix..."
            className="w-full bg-card/70 border border-primary/10 rounded-[10px] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_hsla(42,88%,55%,0.08)] transition-all duration-200"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/15">
                <th className="text-left py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">#</th>
                <th className="text-left py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Reg Number</th>
                <th
                  className="text-left py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase cursor-pointer hover:text-primary transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  Name <SortIcon field="name" />
                </th>
                {!selectedSection && <th className="text-center py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Section</th>}
                <th className="text-center py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Classes</th>
                <th className="text-center py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Present</th>
                <th
                  className="text-left py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase min-w-[140px] cursor-pointer hover:text-primary transition-colors"
                  onClick={() => toggleSort('pct')}
                >
                  Attendance <SortIcon field="pct" />
                </th>
                <th className="text-center py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase">Status</th>
                {isFaculty && <th className="text-center py-3 px-3 text-[0.6rem] font-cinzel text-muted-foreground tracking-[0.2em] uppercase"></th>}
              </tr>
            </thead>
            <tbody>
              {studentStats.map((s) => (
                <tr key={s.id} className="border-b border-primary/5 hover:bg-primary/[0.03] transition-all duration-200">
                  <td className="py-3.5 px-3 font-mono-num text-muted-foreground text-xs">{s.suffix}</td>
                  <td className="py-3.5 px-3 font-mono-num text-xs text-foreground/80">{s.reg_number}</td>
                  <td className="py-3.5 px-3 text-foreground font-medium">{s.name}</td>
                  {!selectedSection && <td className="py-3.5 px-3 text-center text-xs font-cinzel text-muted-foreground">{s.section}</td>}
                  <td className="py-3.5 px-3 text-center font-mono-num text-muted-foreground">{s.total}</td>
                  <td className="py-3.5 px-3 text-center font-mono-num text-[hsl(150,50%,48%)]">{s.present}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            s.pct >= 75 ? "bg-[hsl(150,50%,48%)]" : s.pct >= 60 ? "bg-[hsl(40,80%,55%)]" : "bg-destructive"
                          )}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-xs w-10 text-right text-muted-foreground">{s.pct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={cn(
                      "text-[0.65rem] px-2.5 py-1 rounded-full font-cinzel tracking-wider",
                      s.pct >= 75
                        ? "bg-[hsla(150,50%,48%,0.1)] text-[hsl(150,50%,48%)] border border-[hsla(150,50%,48%,0.2)]"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}>
                      {s.pct >= 75 ? '✓ GOOD' : '⚠ LOW'}
                    </span>
                  </td>
                  {isFaculty && (
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => removeMutation.mutate(s.id)}
                        disabled={removeMutation.isPending}
                        className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Remove student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {studentStats.length === 0 && (
            <p className="text-center text-muted-foreground py-10 font-cinzel text-sm tracking-wider">No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsTab;
