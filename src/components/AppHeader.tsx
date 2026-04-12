import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const AppHeader = () => {
  const { user, logout, sessionRemaining } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const minutes = Math.floor(sessionRemaining / 60);
  const seconds = sessionRemaining % 60;
  const isUrgent = sessionRemaining <= 60;

  return (
    <header className="h-14 bg-background/95 backdrop-blur-md border-b border-primary/15 px-3 md:px-5 flex items-center justify-between relative z-10">
      {/* LEFT: Logo + Title */}
      <div className="flex items-center gap-2.5">
        <img
          src="/gvplogo.jpg"
          alt="GVP Logo"
          className="w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col justify-center">
          <h1 className="font-cinzel text-sm font-semibold text-primary leading-none">
            GVP DASHBOARD
          </h1>
          <p className="text-[0.5rem] tracking-[0.2em] text-muted-foreground hidden md:block leading-none mt-0.5 uppercase">
            Attendance Management System
          </p>
        </div>
      </div>

      {/* CENTER: Date/Time */}
      <div className="hidden lg:flex items-center text-muted-foreground text-[0.7rem] font-mono">
        {format(time, "EEE, dd MMM yyyy · hh:mm a")}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Session */}
        <div
          className={cn(
            "px-2 py-1 rounded-md border text-[0.65rem] font-mono tabular-nums transition-all",
            isUrgent
              ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
              : "border-border text-muted-foreground"
          )}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* User */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-border ml-0.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <span className="text-[0.55rem] font-cinzel font-bold text-primary">{initials}</span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[0.7rem] font-medium text-foreground leading-tight">{user?.displayName}</p>
            <p className="text-[0.5rem] text-primary/60 uppercase tracking-[0.15em]">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-muted-foreground text-[0.65rem] hover:text-destructive hover:border-destructive/30 transition-colors font-cinzel"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
