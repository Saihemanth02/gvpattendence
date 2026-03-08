import { useEffect, useRef, useCallback } from 'react';

interface Sparkle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  color: string;
  twinkleSpeed: number;
}

const SPARKLE_COUNT = 55;

const SparkleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animRef = useRef<number>(0);

  const initSparkles = useCallback(() => {
    const sparkles: Sparkle[] = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      sparkles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.4 + 0.15,
        drift: (Math.random() - 0.5) * 0.4,
        color: Math.random() > 0.5 ? '#c9a84c' : Math.random() > 0.5 ? '#ffffff' : '#8a9bc0',
        twinkleSpeed: Math.random() * 0.003 + 0.001,
      });
    }
    sparklesRef.current = sparkles;
  }, []);

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
        s.opacity = 0.15 + Math.abs(Math.sin(Date.now() * s.twinkleSpeed + s.x)) * 0.75;

        if (s.y < -10) { s.y = canvas.height + 10; s.x = Math.random() * canvas.width; }
        if (s.x < -10) s.x = canvas.width + 10;
        if (s.x > canvas.width + 10) s.x = -10;

        // Core dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.fill();

        // Glow
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = s.opacity * 0.25;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initSparkles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default SparkleCanvas;
