import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/pages/LoginPage';
import FloatingOrbs from '@/components/FloatingOrbs';
import SparkleCanvas from '@/components/SparkleCanvas';
import AppHeader from '@/components/AppHeader';
import NavigationTabs, { type TabId } from '@/components/NavigationTabs';
import DashboardTab from '@/pages/DashboardTab';
import MarkAttendanceTab from '@/pages/MarkAttendanceTab';
import StudentsTab from '@/pages/StudentsTab';
import HistoryTab from '@/pages/HistoryTab';
import WeeklyViewTab from '@/pages/WeeklyViewTab';
import EligibilityTab from '@/pages/EligibilityTab';

const Index = () => {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

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

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'mark': return <MarkAttendanceTab />;
      case 'students': return <StudentsTab />;
      case 'history': return <HistoryTab />;
      case 'weekly': return <WeeklyViewTab />;
      case 'eligibility': return <EligibilityTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen gold-grid-bg relative">
      <FloatingOrbs />
      <SparkleCanvas />
      <div className="relative z-10">
        <AppHeader />
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="pb-8 animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

export default Index;
