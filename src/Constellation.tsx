import { useEffect, useRef } from "react";

// Animated constellation backdrop — drifting nodes on black, wired with gold/blue lines (RTB palette).
// Reusable across pages (login, admin, …). Renders a fixed full-viewport canvas behind the content.
export default function Constellation({ className }: { className?: string }) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = bgRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, w = 0, h = 0;
    let pts: { x: number; y: number; vx: number; vy: number; c: string }[] = [];
    const COLORS = ["rgba(63,159,224,", "rgba(79,181,238,", "rgba(94,200,255,", "rgba(240,232,210,"];
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(140, Math.floor((w * h) / 15000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.26, vy: (Math.random() - 0.5) * 0.26,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      }));
    };
    const LINK = 140;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const al = (1 - Math.sqrt(d2) / LINK) * 0.32;
            ctx.strokeStyle = `rgba(147,215,255,${al})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 6.283);
        ctx.fillStyle = p.c + "0.85)";
        ctx.shadowColor = p.c + "0.9)"; ctx.shadowBlur = 6;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    if (reduce) { draw(); cancelAnimationFrame(raf); } else draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={bgRef} className={className} aria-hidden />;
}
