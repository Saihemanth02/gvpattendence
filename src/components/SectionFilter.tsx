import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COURSE_SECTIONS } from '@/hooks/useStudents';

interface SectionFilterProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
}

const SectionFilter = ({ selectedSection, onSectionChange }: SectionFilterProps) => {
  const btnClass = (active: boolean) =>
    cn(
      'px-2 py-1 rounded-md text-[0.65rem] font-cinzel transition-all border',
      active
        ? 'bg-gradient-to-br from-secondary to-primary/15 text-primary border-primary/40 font-semibold shadow-[0_0_15px_hsla(42,88%,55%,0.08)]'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent'
    );

  return (
    <div className="flex items-center gap-2 flex-wrap px-3 md:px-5 py-1.5 bg-background/60 backdrop-blur-sm border-b border-primary/10">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-[0.6rem] font-cinzel tracking-[0.12em] uppercase">Course</span>
      </div>
      <div className="flex gap-1 flex-wrap items-center">
        <button onClick={() => onSectionChange('all')} className={btnClass(selectedSection === 'all')}>
          All
        </button>
        <span className="text-[0.5rem] text-muted-foreground/40 font-cinzel tracking-wider">PG:</span>
        {COURSE_SECTIONS.PG.map(sec => (
          <button key={sec} onClick={() => onSectionChange(sec)} className={btnClass(selectedSection === sec)}>
            {sec}
          </button>
        ))}
        <span className="text-[0.5rem] text-muted-foreground/40 font-cinzel tracking-wider ml-0.5">UG:</span>
        {COURSE_SECTIONS.UG.map(sec => (
          <button key={sec} onClick={() => onSectionChange(sec)} className={btnClass(selectedSection === sec)}>
            {sec}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SectionFilter;
