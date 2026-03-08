import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Clock, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const AppHeader = () => {
  const { user, logout } = useAuth();
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

  return (
    <header className="h-[70px] bg-background/95 backdrop-blur-md border-b border-primary/20 px-4 md:px-6 flex items-center justify-between relative z-10">
      {/* LEFT: Logo + Title */}
      <div className="flex items-center gap-3">
        <img
          src="/gvplogo.jpg"
          alt="GVP Logo"
          className="w-10 h-10 rounded-full object-cover border border-primary/40 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col justify-center">
          <h1 className="font-cinzel text-[1.3rem] font-semibold text-primary leading-none">
            GVP DASHBOARD
          </h1>
          <p className="text-[0.6rem] tracking-[0.28em] text-muted-foreground hidden md:block leading-none mt-1 uppercase">
            ATTENDANCE MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* CENTER: Clock (desktop only) */}
      <div className="hidden lg:flex items-center gap-2 text-muted-foreground text-sm font-cormorant">
        <Clock className="w-4 h-4 text-primary/60" />
        <span className="font-mono-num text-xs">
          {format(time, "EEEE, dd MMMM yyyy · hh:mm:ss a")}
        </span>
      </div>

      {/* RIGHT: Theme toggle + Avatar + Logout */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleTheme}
          className="relative w-8 h-8 rounded-lg border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-all duration-300 overflow-hidden group"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="absolute inset-0 bg-primary/10 rounded-lg scale-0 group-active:scale-100 transition-transform duration-300" />
          <Sun className={`w-3.5 h-3.5 absolute transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
          <Moon className={`w-3.5 h-3.5 absolute transition-all duration-500 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent/30 border border-primary/40 flex items-center justify-center">
            <span className="text-xs font-cinzel font-bold text-primary">{initials}</span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[0.85rem] font-medium text-foreground leading-tight">{user?.displayName}</p>
            <p className="text-[0.6rem] text-primary/70 uppercase tracking-[0.2em]">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-primary/35 text-primary text-xs hover:bg-primary/10 hover:border-primary/50 transition-all font-cinzel ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
