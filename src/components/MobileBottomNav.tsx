import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardCheck, Users, History, CalendarDays, ShieldCheck, FileText } from 'lucide-react';
import type { TabId } from '@/components/NavigationTabs';

interface MobileBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType; facultyOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'mark', label: 'Mark', icon: ClipboardCheck, facultyOnly: true },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'history', label: 'History', icon: History },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays },
  { id: 'eligibility', label: 'Eligible', icon: ShieldCheck },
];

const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const { user } = useAuth();
  const visibleTabs = tabs.filter(t => !t.facultyOnly || user?.role === 'faculty');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-primary/20 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[3rem] transition-all duration-300',
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300',
                isActive && 'bg-primary/15'
              )}>
                <Icon className={cn(
                  'w-[1.15rem] h-[1.15rem] transition-all duration-300',
                  isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]'
                )} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={cn(
                'text-[0.55rem] font-cinzel tracking-wider leading-none transition-all duration-300',
                isActive ? 'font-bold' : 'font-normal'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
