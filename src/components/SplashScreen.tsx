import { useState, useEffect, useRef, useCallback } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  color: string;
}

const SPARKLE_COUNT = 55;
const DURATION = 3000;

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'active' | 'exit' | 'done'>('active');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animFrameRef = useRef<number>(0);

  // Initialize sparkles
  const initSparkles = useCallback(() => {
    const sparkles: Sparkle[] = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      sparkles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.2,
        drift: (Math.random() - 0.5) * 0.5,
        color: Math.random() > 0.4 ? '#f0b429' : '#ffffff',
      });
    }
    sparklesRef.current = sparkles;
  }, []);

  // Animate sparkles on canvas
  useEffect(() => {
    initSparkles();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparklesRef.current.forEach((s) => {
        s.y -= s.speed;
        s.x += s.drift;
        s.opacity = 0.2 + Math.abs(Math.sin(Date.now() * 0.002 + s.id)) * 0.8;

        if (s.y < -10) s.y = canvas.height + 10;
        if (s.x < -10) s.x = canvas.width + 10;
        if (s.x > canvas.width + 10) s.x = -10;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.fill();

        // Add glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2.5);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = s.opacity * 0.3;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initSparkles]);

  // Timing: 3s active → 0.6s exit → done
  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), DURATION);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, DURATION + 600);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-all duration-600 ${
        phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Sparkle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Concentric Gold Rings */}
      <div className="relative z-10 mb-8 flex items-center justify-center">
        <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border border-primary/10 splash-ring-1" />
        <div className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full border border-primary/8 splash-ring-2" />
        <div className="absolute w-64 h-64 md:w-72 md:h-72 rounded-full border border-primary/5 splash-ring-3" />
        
        {/* Rotating inner ring */}
        <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-primary/30 animate-rotate-ring" />

        {/* Logo with spring bounce */}
        <div className="splash-logo-bounce">
          <img
            src="/gvplogo.jpg"
            alt="GVP Logo"
            className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover splash-glow"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML =
                '<span class="text-6xl text-primary animate-pulse-gold">⚜</span>';
            }}
          />
        </div>
      </div>

      {/* Title - fade + rise */}
      <h1 className="relative z-10 font-cinzel text-3xl md:text-5xl font-bold text-primary mb-2 tracking-widest text-center splash-title">
        Gayatri Vidya Parishad
      </h1>

      {/* Subtitle - spaced silver caps */}
      <p className="relative z-10 text-[11px] md:text-sm tracking-[0.35em] text-muted-foreground mb-8 font-cormorant text-center splash-subtitle">
        ATTENDANCE MANAGEMENT SYSTEM
      </p>

      {/* Animated gold divider */}
      <div className="relative z-10 w-64 md:w-80 h-px bg-border/20 mb-8 overflow-hidden">
        <div className="splash-divider h-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      {/* Gold gradient progress bar - exactly 3s */}
      <div className="relative z-10 w-64 md:w-80 h-1 bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-dark via-primary to-gold-light rounded-full splash-progress"
          style={{ animationDuration: `${DURATION}ms` }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
