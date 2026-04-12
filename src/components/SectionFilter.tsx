import { cn } from '@/lib/utils';
import { COURSE_SECTIONS } from '@/hooks/useStudents';

interface SectionFilterProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
}

const SectionFilter = ({ selectedSection, onSectionChange }: SectionFilterProps) => {
  const allSections = [
    { label: 'All', value: 'all' },
    ...COURSE_SECTIONS.PG.map(s => ({ label: s, value: s })),
    ...COURSE_SECTIONS.UG.map(s => ({ label: s, value: s })),
  ];

  return (
    <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-muted/30 backdrop-blur-sm border-b border-border overflow-x-auto scrollbar-hide">
      {allSections.map(sec => (
        <button
          key={sec.value}
          onClick={() => onSectionChange(sec.value)}
          className={cn(
            'px-2 py-0.5 rounded text-[0.6rem] font-medium transition-all whitespace-nowrap',
            selectedSection === sec.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {sec.label}
        </button>
      ))}
    </div>
  );
};

export default SectionFilter;
