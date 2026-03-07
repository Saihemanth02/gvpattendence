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
  ];

  const visibleTabs = tabs.filter(t => !t.facultyOnly || user?.role === 'faculty');

  return (
    <nav className="flex gap-1 p-1 glass-card mx-4 md:mx-6 mt-4 rounded-lg overflow-x-auto">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-cinzel transition-all whitespace-nowrap",
            activeTab === tab.id
              ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_hsla(42,88%,55%,0.1)]"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          {tab.icon}
          <span className="hidden md:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default NavigationTabs;
