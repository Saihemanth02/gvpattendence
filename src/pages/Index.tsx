import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/pages/LoginPage';
import FloatingOrbs from '@/components/FloatingOrbs';
import SparkleCanvas from '@/components/SparkleCanvas';
import AppHeader from '@/components/AppHeader';
import NavigationTabs, { type TabId } from '@/components/NavigationTabs';
import MobileBottomNav from '@/components/MobileBottomNav';
import DashboardTab from '@/pages/DashboardTab';
import MarkAttendanceTab from '@/pages/MarkAttendanceTab';
import StudentsTab from '@/pages/StudentsTab';
import HistoryTab from '@/pages/HistoryTab';
import WeeklyViewTab from '@/pages/WeeklyViewTab';
import EligibilityTab from '@/pages/EligibilityTab';
import StudentDashboard from '@/pages/StudentDashboard';

const tabComponent: Record<TabId, React.FC> = {
  dashboard: DashboardTab,
  mark: MarkAttendanceTab,
  students: StudentsTab,
  history: HistoryTab,
  weekly: WeeklyViewTab,
  eligibility: EligibilityTab,
};

const Index = () => {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [displayedTab, setDisplayedTab] = useState<TabId>('dashboard');
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab === activeTab) return;
    setTransitioning(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveTab(tab);
      setDisplayedTab(tab);
      // Small delay to let React render new content before fading in
      requestAnimationFrame(() => setTransitioning(false));
    }, 200); // matches fade-out duration
  }, [activeTab]);

  // Keyboard shortcuts: 1-6 to switch tabs
  useEffect(() => {
    const tabOrder: TabId[] = ['dashboard', 'mark', 'students', 'history', 'weekly', 'eligibility'];
    const tabLabels: Record<TabId, string> = {
      dashboard: 'Dashboard',
      mark: 'Mark Attendance',
      students: 'Students',
      history: 'History',
      weekly: 'Weekly View',
      eligibility: 'Eligibility',
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6) {
        const tab = tabOrder[num - 1];
        if (tab) {
          handleTabChange(tab);
          toast(`Switched to ${tabLabels[tab]}`, {
            description: `Keyboard shortcut: ${num}`,
            duration: 1500,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Students get their own self-service dashboard
  if (user.role === 'student') {
    return <StudentDashboard />;
  }

  const ActiveComponent = tabComponent[displayedTab];

  return (
    <div className="min-h-screen gold-grid-bg relative">
      <FloatingOrbs />
      <SparkleCanvas />
      <div className="relative z-10">
        <AppHeader />
        <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <main
          className="pb-24 md:pb-8"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          <ActiveComponent />
        </main>
      </div>
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
