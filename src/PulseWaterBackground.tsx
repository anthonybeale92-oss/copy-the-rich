import { useEffect, useRef } from "react";

// Computed once. Phones pay a heavy GPU/compositing cost for 180px blurs and mix-blend
// overlays during scroll, so we dial those back on small/touch screens.
const IS_MOBILE =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;

function ConstellationCanvas({ lite, animate }: { lite?: boolean; animate?: boolean }) {
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

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Mobile devices choke on the full effect (O(n²) links + per-particle radial-gradient
    // halos every frame). On phones we run a much lighter version so the main thread stays
    // free for React to render content fast — the heavy version was making the whole landing
    // page crawl on mobile Safari.
    const isMobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    // `lite` (admin panel) runs the SAME reduced work as mobile — fewer nodes, 30fps cap, no
    // per-particle halos — so the heavy constellation never competes with React for the main
    // thread and the admin screens feel snappy.
    const light = isMobile || !!lite;

    let width = 0;
    let height = 0;
    let dpr = Math.max(1, Math.min(light ? 2 : 3, window.devicePixelRatio || 1));
    let lastFrame = 0;
    const minFrameMs = light ? 33 : 0; // cap light/mobile to ~30fps

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      seed: number;
      hue: number;
    };

    let particles: Particle[] = [];

    const COUNT_BASE = light ? 34 : 90;
    const LINK_DIST = light ? 110 : 150;
    const MOUSE_DIST = 200;
    const MOUSE_ATTRACT = 0.018;
    const MAX_PARTICLES = light ? 40 : 240;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const target = Math.min(MAX_PARTICLES, Math.max(light ? 22 : 60, Math.round((area / (1280 * 800)) * COUNT_BASE)));
      while (particles.length < target) particles.push(spawn());
      particles.length = target;
    }

    function spawn(): Particle {
      const h = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: 1.2 + Math.random() * 1.9,
        seed: Math.random() * Math.PI * 2,
        hue: h < 0.62 ? 0 : h < 0.88 ? 1 : 2,
      };
    }

    // The three node tints. These are channel literals rather than an rgba() string,
    // which is why they outlived the palette sweep and left cyan and violet nodes
    // drifting over a gold page. They then outlived the SECOND sweep the same way and
    // left gold specks over a white one — the comment was here and the numbers still
    // got missed, so: any colour written as separate r/g/b fields is invisible to every
    // search for a colour, and this is the only place in the app that does it.
    //
    // Same three-step spread as before, bright to deep, now in the brand blues. They sit
    // deeper than the blues used for type because the draw code fades them to 55% alpha
    // and below; picked any lighter, they vanish into the white.
    function nodeColor(hue: number) {
      if (hue === 0) return { r: 49, g: 129, b: 185 };
      if (hue === 1) return { r: 46, g: 122, b: 180 };
      return { r: 29, g: 102, b: 148 };
    }

    function step(t: number) {
      if (!ctx) return;
      // Throttle mobile to ~30fps — halves per-second canvas work without a visible difference.
      if (minFrameMs && t - lastFrame < minFrameMs) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      lastFrame = t;
      ctx.clearRect(0, 0, width, height);

      // Pulse-brand sweep — a slow cyan→violet glow band drifting across, echoing the waveform
      // identity so the field reads as "Pulse" rather than a generic constellation. Cheap (one
      // gradient fill per frame) and full-mode only so mobile/admin stay light.
      if (!light) {
        const bandW = 300;
        const travel = width + bandW * 2;
        const sweepX = ((t * 0.024) % travel) - bandW;
        const sg = ctx.createLinearGradient(sweepX - bandW, 0, sweepX + bandW, 0);
        sg.addColorStop(0, "rgba(29,102,148,0)");
        sg.addColorStop(0.5, "rgba(49,129,185,0.055)");
        sg.addColorStop(1, "rgba(48,127,187,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sweepX - bandW, 0, bandW * 2, height);
      }

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
            const alpha = (1 - d / LINK_DIST) * 0.22;
            ctx.strokeStyle = `rgba(130,196,236,${alpha * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (m.active) {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, MOUSE_DIST);
        grad.addColorStop(0, "rgba(19,85,125,0.07)");
        grad.addColorStop(0.6, "rgba(35,111,159,0.04)");
        grad.addColorStop(1, "rgba(19,85,125,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(m.x - MOUSE_DIST, m.y - MOUSE_DIST, MOUSE_DIST * 2, MOUSE_DIST * 2);

        for (const p of particles) {
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_DIST * MOUSE_DIST) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / MOUSE_DIST) * 0.5;
            const c = nodeColor(p.hue);
            ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const pulse = 0.55 + 0.25 * Math.sin(t * 0.0014 + p.seed);
        const c = nodeColor(p.hue);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${pulse * 0.55})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        // The per-particle radial-gradient halo is the single most expensive op in this loop.
        // Skip it on mobile AND in lite/admin mode — a cheap dot keeps the main thread free.
        if (!light) {
          const halo = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, p.r * 3.4);
          halo.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${pulse * 0.12})`);
          halo.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }
    function onTouch(e: TouchEvent) {
      if (e.touches.length === 0) return;
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
      mouseRef.current.active = true;
    }

    resize();
    // On mobile (or reduced-motion) render a SINGLE static frame and never start the rAF loop.
    // The continuous animation starves the main thread on throttled phones (Low Power Mode caps
    // CPU), which was making the page take minutes to finish loading. Static still looks great.
    // On desktop, defer the loop slightly so the hero paints/reveals before animation steals time.
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    step(0);
    cancelAnimationFrame(rafRef.current); // step() self-schedules; stop it so we control the start
    if (!reduced && (!isMobile || animate)) {
      startTimer = setTimeout(() => {
        rafRef.current = requestAnimationFrame(step);
      }, 120);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else if (!reduced && (!isMobile || animate)) rafRef.current = requestAnimationFrame(step);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (startTimer) clearTimeout(startTimer);
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouch);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ display: "block" }}
    />
  );
}

function AuroraBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute h-[760px] w-[760px] rounded-full opacity-60 ${IS_MOBILE ? "blur-[90px]" : "blur-[180px]"}`}
        style={{
          left: "5%",
          top: "-12%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(19,85,125,0.18), rgba(19,85,125,0.04) 50%, transparent 80%)",
          animation: "dashAurora1 32s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute h-[820px] w-[820px] rounded-full opacity-60 ${IS_MOBILE ? "blur-[100px]" : "blur-[200px]"}`}
        style={{
          right: "-8%",
          top: "35%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(35,111,159,0.18), rgba(35,111,159,0.04) 55%, transparent 82%)",
          animation: "dashAurora2 36s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute h-[680px] w-[680px] rounded-full opacity-55 ${IS_MOBILE ? "blur-[85px]" : "blur-[170px]"}`}
        style={{
          left: "30%",
          bottom: "-18%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(48,127,187,0.16), rgba(48,127,187,0.03) 55%, transparent 82%)",
          animation: "dashAurora1 30s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

function GrainOverlay() {
  // mix-blend-overlay on a full-screen fixed layer is expensive to composite on mobile Safari
  // during scroll — skip it on phones.
  if (IS_MOBILE) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.03 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`;
  const dataUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-35"
      style={{ backgroundImage: dataUri, backgroundSize: "220px 220px" }}
    />
  );
}

export function PulseWaterBackground({ lite, animate }: { lite?: boolean; animate?: boolean } = {}) {
  return (
    <div
      aria-hidden
      className="rbwater pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(19,85,125,0.08) 0%, transparent 65%), " +
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(35,111,159,0.1) 0%, transparent 65%), " +
          "linear-gradient(180deg, #fdfdfe 0%, #fdfdfd 50%, #fdfdfd 100%)",
      }}
    >
      {/* lite (admin) skips the 180px animated aurora blobs + grain overlay — the most expensive
          GPU compositing — and runs the lighter constellation. */}
      {!lite && <AuroraBlobs />}
      <div className="absolute inset-0">
        <ConstellationCanvas lite={lite} animate={animate} />
      </div>
      {!lite && <GrainOverlay />}
      <style>{`
        @keyframes dashAurora1 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(50px, 30px, 0) scale(1.06); }
        }
        @keyframes dashAurora2 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-60px, -20px, 0) scale(0.96); }
        }
      `}</style>
    </div>
  );
}
