import { useEffect, useRef } from "react";

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const trailPositions = useRef(Array.from({ length: 5 }, () => ({ x: -100, y: -100 })));

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    let raf: number;
    const animate = () => {
      // Dot follows instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 4}px, ${mouse.current.y - 4}px)`;
      }

      // Ring follows with delay
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`;
      }

      // Trail particles follow with increasing delay
      for (let i = 0; i < trailPositions.current.length; i++) {
        const target = i === 0 ? ring.current : trailPositions.current[i - 1];
        const speed = 0.08 - i * 0.01;
        trailPositions.current[i].x += (target.x - trailPositions.current[i].x) * speed;
        trailPositions.current[i].y += (target.y - trailPositions.current[i].y) * speed;
        const el = trailRefs.current[i];
        if (el) {
          const size = 6 - i;
          el.style.transform = `translate(${trailPositions.current[i].x - size / 2}px, ${trailPositions.current[i].y - size / 2}px)`;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.opacity = `${0.4 - i * 0.07}`;
        }
      }

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block" style={{ cursor: "none" }}>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 w-2 h-2 rounded-full"
        style={{ background: "hsl(var(--gold))" }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 w-9 h-9 rounded-full border-2 animate-rotate-ring"
        style={{ borderColor: "hsla(42, 88%, 55%, 0.5)" }}
      />
      {/* Trail dots */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) trailRefs.current[i] = el; }}
          className="absolute top-0 left-0 rounded-full"
          style={{ background: "hsl(var(--gold))" }}
        />
      ))}
    </div>
  );
};

export default CustomCursor;
