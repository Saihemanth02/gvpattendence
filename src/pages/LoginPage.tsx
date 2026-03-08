import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FloatingOrbs from '@/components/FloatingOrbs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(username, password, role);
      setSuccess(true);
      toast.success('Welcome to GVP!');
    } catch {
      toast.error('Invalid credentials. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['faculty', 'student'] as const;
  const activeIndex = roles.indexOf(role);

  return (
    <div className="min-h-screen flex items-center justify-center gold-grid-bg relative overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10 w-full max-w-md md:max-w-lg mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 md:mb-14 w-full pt-4 md:pt-10">
          <div className="relative mb-8 md:mb-10 animate-scale-in" style={{ animationDuration: '0.6s', animationFillMode: 'both' }}>
            {/* Gold glow behind logo */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-primary/30 animate-rotate-ring absolute -inset-2" />
            <img
              src="/gvplogo.jpg"
              alt="GVP Logo"
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover animate-pulse-gold"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                el.parentElement!.querySelector('.fallback-emblem')?.classList.remove('hidden');
              }}
            />
            <span className="fallback-emblem hidden text-5xl md:text-6xl text-primary animate-pulse-gold absolute inset-0 flex items-center justify-center">
              ⚜
            </span>
          </div>
          <h1
            className="font-cinzel text-3xl md:text-5xl font-bold text-primary tracking-wider text-center leading-tight mt-2 animate-fade-in"
            style={{ animationDelay: '0.3s', animationDuration: '0.5s', animationFillMode: 'both' }}
          >
            Gayatri Vidya Parishad
          </h1>
          <p
            className="text-[11px] md:text-sm tracking-[0.3em] text-muted-foreground mt-3 md:mt-4 text-center animate-fade-in"
            style={{ animationDelay: '0.5s', animationDuration: '0.5s', animationFillMode: 'both' }}
          >
            ROYAL ATTENDANCE MANAGEMENT
          </p>
        </div>

        {/* Login Card */}
        <div
          className="glass-card p-6 md:p-10 animate-fade-in"
          style={{ animationDelay: '0.7s', animationDuration: '0.6s', animationFillMode: 'both' }}
        >
          {/* Role Tabs with sliding indicator */}
          <div className="relative flex mb-6 bg-secondary/30 rounded-lg p-1">
            {/* Sliding background */}
            <div
              className="absolute top-1 bottom-1 rounded-md bg-primary/15 border border-primary/30 transition-all duration-300 ease-out"
              style={{
                width: `calc(50% - 4px)`,
                left: `calc(${activeIndex * 50}% + 4px)`,
              }}
            />
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setUsername('');
                }}
                className={cn(
                  'relative z-10 flex-1 py-2 rounded-md text-sm font-cinzel transition-colors duration-300 capitalize',
                  role === r ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={cn('space-y-4', shake && 'login-shake')}
          >
            <div>
              <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">
                {role === 'faculty' ? 'USERNAME' : 'ROLL SUFFIX (e.g. 002)'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'faculty' ? 'admin' : '002'}
                className="w-full bg-input/50 border border-border/50 rounded-md px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_15px_hsla(42,88%,55%,0.15)] transition-all duration-300"
              />
            </div>

            <div className="relative">
              <label className="text-xs text-muted-foreground font-cinzel tracking-wider mb-1 block">
                PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-input/50 border border-border/50 rounded-md px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_15px_hsla(42,88%,55%,0.15)] transition-all duration-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-md font-cinzel font-bold tracking-wider transition-all duration-500 flex items-center justify-center gap-2',
                success
                  ? 'bg-green-600 text-white shadow-[0_0_25px_hsla(140,60%,40%,0.4)]'
                  : 'bg-gradient-to-r from-gold-dark via-primary to-gold-light text-primary-foreground hover:shadow-[0_0_25px_hsla(42,88%,55%,0.35)]',
                loading && 'opacity-70'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Welcome!
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Enter the System
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-muted-foreground/60 text-center mt-4 font-cormorant leading-relaxed">
            Student: use Roll suffix, password: student123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
