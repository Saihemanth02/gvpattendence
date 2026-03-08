import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardCheck, Users, History, CalendarDays, ShieldCheck } from 'lucide-react';

export type TabId = 'dashboard' | 'mark' | 'students' | 'history' | 'weekly' | 'eligibility';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  const { user } = useAuth();

  const tabs: { id: TabId; label: string; icon: React.ReactNode; facultyOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'mark', label: 'Mark Attendance', icon: <ClipboardCheck className="w-4 h-4" />, facultyOnly: true },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'weekly', label: 'Weekly View', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'eligibility', label: 'Eligibility', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const visibleTabs = tabs.filter(t => !t.facultyOnly || user?.role === 'faculty');

  return (
    <nav className="bg-background/90 backdrop-blur-sm border-b-2 border-primary px-4 md:px-6 overflow-x-auto">
      <div className="flex gap-1 py-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[0.8rem] font-cinzel transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-gradient-to-br from-secondary to-primary/15 text-primary border border-primary/40 font-semibold shadow-[0_0_15px_hsla(42,88%,55%,0.08)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
            )}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationTabs;
