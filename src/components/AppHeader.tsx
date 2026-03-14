import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Clock, Sun, Moon, Keyboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const shortcuts = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Mark Attendance' },
  { key: '3', label: 'Students' },
  { key: '4', label: 'History' },
  { key: '5', label: 'Weekly View' },
  { key: '6', label: 'Eligibility' },
];

const AppHeader = () => {
  const { user, logout, sessionRemaining } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!showShortcuts) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowShortcuts(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShortcuts]);

  // Close on Escape
  useEffect(() => {
    if (!showShortcuts) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShortcuts(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showShortcuts]);

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const minutes = Math.floor(sessionRemaining / 60);
  const seconds = sessionRemaining % 60;
  const isUrgent = sessionRemaining <= 60;

  const sessionProgress = sessionRemaining / (10 * 60);
  const circumference = 2 * Math.PI * 13;
  const strokeDashoffset = circumference * (1 - sessionProgress);

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

      {/* RIGHT: Session timer + Shortcuts + Theme toggle + Avatar + Logout */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Session countdown */}
        <div
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono-num transition-all duration-300",
            isUrgent
              ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
              : "border-primary/25 bg-secondary/40 text-muted-foreground"
          )}
          title="Session time remaining"
        >
          <svg width="28" height="28" className="flex-shrink-0 -rotate-90">
            <circle cx="14" cy="14" r="13" fill="none" strokeWidth="2" className={cn(isUrgent ? "stroke-destructive/20" : "stroke-primary/15")} />
            <circle cx="14" cy="14" r="13" fill="none" strokeWidth="2.5" strokeLinecap="round"
              className={cn("transition-all duration-1000", isUrgent ? "stroke-destructive" : "stroke-primary/70")}
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
            <text x="14" y="14" textAnchor="middle" dominantBaseline="central"
              className={cn("fill-current text-[6px] font-bold rotate-90 origin-center", isUrgent ? "fill-destructive" : "fill-primary/70")}>
              {minutes}m
            </text>
          </svg>
          <span className={cn("tabular-nums", isUrgent && "font-semibold")}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        {/* Shortcuts button (desktop only) */}
        <div className="relative hidden md:block" ref={popoverRef}>
          <button
            onClick={() => setShowShortcuts(s => !s)}
            className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300",
              showShortcuts
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-primary/30 text-primary hover:bg-primary/10"
            )}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {showShortcuts && (
            <div className="absolute right-0 top-full mt-2 glass-card rounded-xl p-4 w-56 animate-fade-in-up shadow-lg z-50"
              style={{ animationDuration: '0.2s' }}
            >
              <h3 className="font-cinzel text-[0.6rem] tracking-[0.2em] text-primary font-semibold mb-3 uppercase">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2">
                {shortcuts.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-raleway">{s.label}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-secondary/60 border border-primary/20 text-[0.65rem] font-mono-num text-primary font-bold min-w-[1.5rem] text-center">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-primary/10">
                <p className="text-[0.55rem] text-muted-foreground/60 font-raleway">
                  Press <kbd className="px-1 py-0.5 rounded bg-secondary/40 border border-primary/15 text-[0.55rem] font-mono-num">?</kbd> to toggle this panel
                </p>
              </div>
            </div>
          )}
        </div>

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
