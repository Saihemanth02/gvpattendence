import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardCheck, Users, History, CalendarDays, ShieldCheck, FileText } from 'lucide-react';

export type TabId = 'dashboard' | 'mark' | 'students' | 'history' | 'weekly' | 'eligibility' | 'marks';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  const { user } = useAuth();

  const tabs: { id: TabId; label: string; icon: React.ReactNode; facultyOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'mark', label: 'Attendance', icon: <ClipboardCheck className="w-3.5 h-3.5" />, facultyOnly: true },
    { id: 'students', label: 'Students', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'weekly', label: 'Weekly', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'eligibility', label: 'Eligibility', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'marks', label: 'Marks', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const visibleTabs = tabs.filter(t => !t.facultyOnly || user?.role === 'faculty');

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b-2 border-primary/25 px-2 md:px-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-center gap-0.5 py-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[0.65rem] font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationTabs;
