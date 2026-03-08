import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const AppHeader = () => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.displayName?.
  split(' ').
  map((n) => n[0]).
  join('').
  slice(0, 2).
  toUpperCase() || '?';

  return (
    <header className="glass-card border-b border-border/50 px-4 md:px-6 py-3 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3">
        <img
          src="/gvplogo.jpg"
          alt="GVP Logo"
          className="w-10 h-10 rounded-full object-cover border border-primary/30 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        
        <div className="flex flex-col justify-center">
          <h1 className="font-cinzel text-lg md:text-xl font-bold text-primary leading-none">
            GVP DASHBOARD  
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground hidden md:block leading-none mt-1">
            ATTENDANCE MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-muted-foreground text-sm font-cormorant">
        <Clock className="w-4 h-4 text-primary/60" />
        <span className="font-mono-num text-xs">
          {format(time, "EEEE, dd MMMM yyyy · hh:mm:ss a")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-xs font-cinzel font-bold text-primary">{initials}</span>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight">{user?.displayName}</p>
            <p className="text-[10px] text-primary/70 uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-primary/30 text-primary text-xs hover:bg-primary/10 transition-colors font-cinzel">
          
          <LogOut className="w-3 h-3" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>);

};

export default AppHeader;