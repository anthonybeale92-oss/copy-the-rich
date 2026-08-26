import { useEffect, useRef } from "react";

// Animated constellation backdrop — ported from forexbrokercrm.com's cabinet /
// landing background so the members panel reads as cards floating over the
// same animation. Drifting particle constellation + two soft aurora blobs +
// film grain, white on black.
//
// Self-contained (inline styles only, no Tailwind) so it can drop into any
// page. Renders fixed + full viewport behind the content; give the page
// wrapper a stacking context and put content at z-index >= 1.
//
// Performance:
// - Pauses on document.hidden and prefers-reduced-motion (one static frame
//   for reduced-motion users).
// - DPR-aware so it stays crisp on retina.
// - Density scales with viewport area, capped.
// - Resize via ResizeObserver so the canvas reflows on layout changes.

function ConstellationCanvas({ tint }: { tint: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; seed: number };

    let particles: Particle[] = [];

    // Density is tuned to how forexbrokercrm.com actually *reads*: there the
    // canvas spans the whole tall landing page, so ~220 particles thin out to
    // a sparse, long-lined web in any one viewport. This canvas is
    // fixed-viewport, so the per-screen count is dialled down to match instead
    // of copying the raw constant (which packed 220 nodes into one screen).
    // Ambient, not a diagram. At 46 nodes linked out to 190px the field drew a visible web across
    // the headline — on the Pulse site the equivalent layer is a starfield you only notice once,
    // with the drama carried by a single bolt instead of by the mesh. Fewer nodes, shorter links
    // and a much fainter line put the emphasis back on the type.
    const COUNT_BASE = 30;
    const LINK_DIST = 150;
    const MOUSE_DIST = 200;
    const MOUSE_ATTRACT = 0.016;

    function spawn(): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.2 + Math.random() * 2.0,
        seed: Math.random() * Math.PI * 2,
      };
    }

    // Any collapse/expand of mobile browser chrome is under this. A real rotation or window
    // resize is well over it.
    const CHROME_JITTER = 160;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const nextDpr = Math.max(1, window.devicePixelRatio || 1);

      const isJitter =
        width > 0 && w === width && nextDpr === dpr && Math.abs(h - height) < CHROME_JITTER;
      if (isJitter) {
        // Track the new bound so particles still wrap at the edge of what you can see, but leave
        // the canvas and the particle set exactly as they are — no wipe, no respawn, no flash.
        height = h;
        return;
      }

      width = w;
      height = h;
      dpr = nextDpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const target = Math.min(80, Math.max(20, Math.round((area / (1280 * 800)) * COUNT_BASE)));
      while (particles.length < target) particles.push(spawn());
      particles.length = target;
    }

    function step(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const m = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (m.active) {
          const dx = m.x - p.x;
          const dy = m.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_DIST * MOUSE_DIST) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / MOUSE_DIST) * MOUSE_ATTRACT;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        const minSpeed = 0.07;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed < minSpeed) {
          const a = Math.atan2(p.vy || 0.0001, p.vx || 0.0001);
          p.vx = Math.cos(a) * minSpeed;
          p.vy = Math.sin(a) * minSpeed;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / LINK_DIST) * 0.20;
            ctx.strokeStyle = `rgba(${tint},${alpha})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (m.active) {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, MOUSE_DIST);
        grad.addColorStop(0, `rgba(${tint},0.05)`);
        grad.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(m.x - MOUSE_DIST, m.y - MOUSE_DIST, MOUSE_DIST * 2, MOUSE_DIST * 2);

        for (const p of particles) {
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_DIST * MOUSE_DIST) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / MOUSE_DIST) * 0.45;
            ctx.strokeStyle = `rgba(${tint},${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.0014 + p.seed);
        ctx.fillStyle = `rgba(${tint},${pulse * 0.95})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        const halo = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, p.r * 4);
        halo.addColorStop(0, `rgba(${tint},${pulse * 0.25})`);
        halo.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(step);
    }

    const canHover = window.matchMedia?.("(hover: hover)").matches ?? true;

    function onMouseMove(e: MouseEvent) {
      if (!canHover) return;
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }

    // Touch pulls the constellation the same way a cursor does — drag a finger across it and the
    // stars come with you. The bug this replaces was not that touch attracted, it was that touch
    // never LET GO: the old handler set active = true on every touchmove and nothing ever set it
    // back, so a scroll gesture left the whole field pinned wherever the finger last was, piling
    // into a corner. Releasing on touchend/touchcancel is the whole fix — the velocity damping
    // and the minimum-speed floor already drift the field back apart on their own.
    function trackTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onTouchEnd(e: TouchEvent) {
      // Multi-finger gestures keep pulling from whichever finger is still down.
      if (e.touches.length > 0) { trackTouch(e); return; }
      mouseRef.current.active = false;
    }
    resize();
    if (!reduced) rafRef.current = requestAnimationFrame(step);
    else step(0);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });
    window.addEventListener("touchstart", trackTouch, { passive: true });
    window.addEventListener("touchmove", trackTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    function onVisibility() {
      cancelAnimationFrame(rafRef.current);
      if (!document.hidden && !reduced) rafRef.current = requestAnimationFrame(step);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchstart", trackTouch);
      window.removeEventListener("touchmove", trackTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}

const GRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.04 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`;

export default function ConstellationBackground({
  base = "#050608",
  // "R,G,B" — the colour the stars, their links and the aurora pools are drawn in. White is the
  // forexbrokercrm original; Copy the Rich Trades passes its blue so the backdrop belongs to the brand
  // instead of sitting under it.
  tint = "255,255,255",
}: { base?: string; tint?: string }) {
  return (
    <div
      aria-hidden
      className="rtb-constellation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: base,
      }}
    >
      {/* aurora blobs */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          top: "-8%",
          width: 680,
          height: 680,
          borderRadius: "50%",
          filter: "blur(140px)",
          opacity: 0.5,
          background:
            `radial-gradient(circle at 50% 50%, rgba(${tint},0.10), rgba(${tint},0.03) 45%, transparent 75%)`,
          animation: "rtbAurora1 32s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-5%",
          top: "40%",
          width: 760,
          height: 760,
          borderRadius: "50%",
          filter: "blur(160px)",
          opacity: 0.5,
          background:
            `radial-gradient(circle at 50% 50%, rgba(${tint},0.08), rgba(${tint},0.02) 50%, transparent 80%)`,
          animation: "rtbAurora2 36s ease-in-out infinite",
        }}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        <ConstellationCanvas tint={tint} />
      </div>
      {/* film grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "overlay",
          opacity: 0.4,
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`,
          backgroundSize: "220px 220px",
        }}
      />
      <style>{`
        /* The full-screen rule for this layer lives in index.css alongside the other backdrops —
           they all have to reach the bottom of the screen together or the seam just moves. */
        @keyframes rtbAurora1 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(50px, 30px, 0) scale(1.06); }
        }
        @keyframes rtbAurora2 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-60px, -20px, 0) scale(0.96); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="rtbAurora"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
