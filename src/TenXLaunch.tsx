import { useMemo, useState } from "react";
import { ArrowRight, Wallet, BadgeDollarSign, TrendingUp, Smartphone, Gauge, Radio, Check, Zap } from "lucide-react";
import { PulseWaterBackground } from "./PulseWaterBackground";

// Pulse-branded SVG growth chart (area + line, cyan→violet). Used for the track record and the calculator.
function GrowthChart({ id, vals, height = 210 }: { id: string; vals: number[]; height?: number }) {
  const W = 760, H = height, padT = 16, padB = 8;
  const n = vals.length;
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const X = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const Y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H - padB} L0,${H - padB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`a-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ec8ff" stopOpacity="0.40" />
          <stop offset="55%" stopColor="#1f6fa8" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1f6fa8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`l-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5ec8ff" /><stop offset="55%" stopColor="#2a80bd" /><stop offset="100%" stopColor="#74cdfa" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#a-${id})`} />
      <path d={line} fill="none" stroke={`url(#l-${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {vals.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={i === n - 1 ? 5 : 3} fill={i === n - 1 ? "#74cdfa" : "#5ec8ff"} stroke="#050608" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// Copy the Rich Trades passive-income landing. Leads with the compound effect + GoldRock's real track record,
// a branded compound calculator, then the VIP signals, and 10X funding at the very bottom.
// Gold palette only (bright gold / amber / bronze); emerald still marks gains. Sign-up CTAs go to /register.
export default function TenXLaunch() {
  const params = useMemo(() => { try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); } }, []);
  const creator = params.get("name") || "Anthony Beale";
  const logo = params.get("logo") || (creator === "Anthony Beale" ? "/logo.svg" : null);
  const refParam = params.get("ref");
  const registerHref = refParam ? `/register?ref=${encodeURIComponent(refParam)}` : "/register";
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  // GoldRock PAMM — real figures (mirror the live /api/pamm/goldrock + fund stats page).
  const goldrock = {
    avgMonthlyReturn: 50.4,
    minMonthly: 15, // the fund aims for a 15%+ monthly minimum
    monthsCount: 7,
    totalReturnPct: 1482.43,
    aum: 1065445,
    totalPnl: 714798.4,
    profitFactor: 3.0,
    investors: 310, // "and counting"
    monthlyReturns: [
      { month: "Jan", pct: 75 }, { month: "Feb", pct: 64 }, { month: "Mar", pct: 91 },
      { month: "Apr", pct: 45.67 }, { month: "May", pct: 27.55 }, { month: "Jun", pct: 27.83 }, { month: "Jul", pct: 25.41 },
    ],
  };
  // Compounded growth of a $1,000 start, normalized so the final matches the verified +1482.43%.
  const START = 1000;
  const officialFinal = START * (1 + goldrock.totalReturnPct / 100);
  const growth = useMemo(() => {
    let v = START; const raw = [START];
    for (const m of goldrock.monthlyReturns) { v *= 1 + m.pct / 100; raw.push(v); }
    const rawFinal = raw[raw.length - 1];
    const k = (officialFinal - START) / (rawFinal - START);
    const labels = ["Start", ...goldrock.monthlyReturns.map((m) => m.month)];
    return raw.map((val, i) => ({ label: labels[i], val: START + (val - START) * k }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const finalVal = growth[growth.length - 1].val;
  const totalMult = finalVal / START;
  const maxGrowth = finalVal;

  // Branded compound calculator.
  const [amt, setAmt] = useState(1000);
  const [rate, setRate] = useState(15);
  const [months, setMonths] = useState(12);
  const projected = amt * Math.pow(1 + rate / 100, months);
  const profit = projected - amt;
  const apy = (Math.pow(1 + rate / 100, 12) - 1) * 100;
  const calcSeries = useMemo(() => {
    const arr = [amt]; let bal = amt;
    for (let i = 1; i <= months; i++) { bal *= 1 + rate / 100; arr.push(bal); }
    return arr;
  }, [amt, rate, months]);

  const stats = [
    { l: "All-time return", v: `+${goldrock.totalReturnPct.toLocaleString("en-US")}%`, c: "tenx-hue" },
    { l: "Assets managed", v: usd(goldrock.aum), c: "text-amber-300" },
    { l: "Total profit", v: `+${usd(goldrock.totalPnl)}`, c: "text-amber-200" },
    { l: "Profit factor", v: goldrock.profitFactor.toFixed(2), c: "text-white" },
    { l: "Investors", v: `${goldrock.investors.toLocaleString("en-US")}+`, c: "text-amber-300" },
  ];

  const CTA = ({ label = "Start earning", id, className = "" }: { label?: string; id: string; className?: string }) => (
    <a href={registerHref} data-testid={id} className={`tenx-sheen inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold text-[#0b0d12] transition-transform hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(90deg,#5ec8ff,#2a80bd,#1f6fa8)", boxShadow: "0 16px 44px -18px rgba(94,200,255,0.55)" }}>
      {label} <ArrowRight className="w-4 h-4" />
    </a>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050608" }} className="text-white relative overflow-clip">
      <style>{`
        @keyframes tenxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes tenxSheen{0%{transform:translateX(-160%) skewX(-18deg)}100%{transform:translateX(280%) skewX(-18deg)}}
        @keyframes tenxGrad{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes tenxGrow{from{transform:scaleY(.02)}to{transform:scaleY(1)}}
        @keyframes tenxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
        .tenx-hue{background:linear-gradient(135deg,#c5e5fa 0%,#54ace6 28%,#1c75b0 55%,#80c2ee 78%,#fff8e1 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:tenxGrad 8s linear infinite}
        .tenx-sheen{position:relative;overflow:hidden}
        .tenx-sheen::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.22),transparent);transform:translateX(-160%) skewX(-18deg);animation:tenxSheen 4.5s ease-in-out infinite;pointer-events:none}
        .gbar{transform-origin:bottom;animation:tenxGrow .7s ease-out both}
        /* glossy "statbook" month card — blue glass with a diagonal sheen */
        .grc{position:relative;overflow:hidden;border-radius:14px;border:1px solid rgba(53,147,210,.32);background:linear-gradient(155deg,rgba(38,106,152,.42),rgba(30,24,12,.55) 55%,rgba(22,18,10,.6));box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 10px 26px -16px rgba(45,137,199,.6)}
        .grc::before{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.14) 42%,rgba(255,255,255,.03) 50%,transparent 66%);pointer-events:none}
        .grc > *{position:relative;z-index:1}
        input[type=range].rng{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;background:rgba(255,255,255,.12);outline:none}
        input[type=range].rng::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#5ec8ff,#1f6fa8);cursor:pointer;box-shadow:0 4px 12px -2px rgba(94,200,255,.6)}
        input[type=range].rng::-moz-range-thumb{width:20px;height:20px;border:none;border-radius:50%;background:linear-gradient(135deg,#5ec8ff,#1f6fa8);cursor:pointer}
        @media (prefers-reduced-motion:reduce){.tenx-hue,.tenx-sheen::after,.gbar{animation:none}}
      `}</style>
      {/* Static on mobile (no rAF loop) — the continuous canvas repaint + backdrop-blur header was the
          source of scroll flicker on iOS. Desktop still animates. */}
      <PulseWaterBackground />

      {/* NAV — promoted to its own compositor layer so the blur doesn't re-rasterize the viewport on scroll */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: "rgba(5,6,8,0.82)", transform: "translateZ(0)", willChange: "transform", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo-icon.svg" alt="Pulse Markets" className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            <span className="text-[13px] sm:text-[15px] font-semibold tracking-tight whitespace-nowrap">Pulse Markets</span>
            <span className="text-white/30 text-sm shrink-0">×</span>
            {logo && <img src={logo} alt={creator} className="h-6 w-6 sm:h-7 sm:w-7 rounded-md object-contain shrink-0" />}
            <span className="text-[13px] font-semibold text-white/70 truncate">{creator}</span>
          </div>
          <a href={registerHref} data-testid="tenx-nav-cta" className="tenx-sheen shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl font-extrabold text-[13px] text-[#0b0d12]" style={{ background: "linear-gradient(90deg,#5ec8ff,#2a80bd,#1f6fa8)", boxShadow: "0 12px 30px -14px rgba(94,200,255,0.55)" }}>
            <span className="hidden sm:inline">Start earning</span><span className="sm:hidden">Start</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* HERO — full-screen top section; the rest sits below the fold with a smooth scroll cue. */}
        <section className="relative min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center text-center pt-4 pb-24">
          <img src="/logo.svg" alt="Copy the Rich Trades" className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-contain" style={{ boxShadow: "0 22px 55px -20px rgba(94,200,255,0.5)", animation: "tenxFloat 6s ease-in-out infinite" }} />
          <h1 className="mt-6 text-[34px] sm:text-[56px] font-black leading-[1.03] tracking-tight">
            Compounding is the<br /><span className="tenx-hue">8th Wonder of the World.</span>
          </h1>
          <p className="mt-5 text-[16px] sm:text-[18px] text-white/65 max-w-2xl mx-auto leading-relaxed">
            Put your money to work in the <b className="text-white">GoldRock managed fund</b> and let it compound — hands-off. No trading, no experience needed. Just deposit, and watch it grow month after month.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <CTA id="tenx-hero-cta" label="Start earning passively" className="h-14 px-8 text-[16px]" />
            <a href="/login" className="inline-flex items-center justify-center h-14 px-7 rounded-2xl border border-white/15 font-bold text-[15px] text-white/85 hover:border-white/30">Log in</a>
          </div>
          {/* smooth scroll cue */}
          <button
            onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex flex-col items-center gap-1.5 text-white/45 hover:text-white/80 transition"
            aria-label="See the platform"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">See the platform</span>
            <svg className="w-5 h-5" style={{ animation: "tenxBob 1.8s ease-in-out infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </section>

        {/* TRACK RECORD — flame + heading → chart → stats → monthly chips */}
        <section id="track" className="scroll-mt-20 pt-4 pb-10">
          <div className="text-center">
            <img src="/goldrock-flame-badge.png" alt="GoldRock" loading="lazy" className="block mx-auto mb-1 w-28 h-28 sm:w-32 sm:h-32 object-contain" style={{ mixBlendMode: "screen", WebkitMaskImage: "radial-gradient(circle at 50% 48%, #000 54%, transparent 78%)", maskImage: "radial-gradient(circle at 50% 48%, #000 54%, transparent 78%)", filter: "drop-shadow(0 0 26px rgba(31,111,168,0.5))" }} />
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">GoldRock · verified track record</div>
            <h2 className="mt-2 text-[28px] sm:text-[38px] font-black tracking-tight">7 months of compounding</h2>
            <p className="mt-3 text-white/55 max-w-xl mx-auto">Targeting a <b className="text-white">{goldrock.minMonthly}%+ monthly minimum</b> — and averaging <b className="text-white">{goldrock.avgMonthlyReturn.toFixed(1)}%</b> so far. Here's how a {usd(START)} allocation compounds.</p>
          </div>

          {/* compounded growth curve ($1,000 start) */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[12px] text-white/50">Compounded from <b className="text-white">{usd(START)}</b></div>
              <div className="text-[15px] sm:text-[17px] font-black tenx-hue tabular-nums">{usd(finalVal)}</div>
            </div>
            <GrowthChart id="tr" vals={growth.map((g) => g.val)} />
            <div className="flex justify-between mt-3">
              {growth.map((g, i) => (
                <div key={i} className="flex-1 text-center min-w-0">
                  <div className="text-[9px] sm:text-[11px] font-bold text-white/75 tabular-nums whitespace-nowrap">{usd(g.val)}</div>
                  <div className="text-[9px] sm:text-[11px] text-white/40">{g.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* verified fund stats — centered so the odd card doesn't hang left */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {stats.map((s, i) => (
              <div key={i} className="w-[46%] sm:w-[172px] rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3.5 text-center">
                <div className={`text-[16px] sm:text-[19px] font-black tabular-nums ${s.c}`}>{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-[11px] text-white/35">Investors growing daily · live on Pulse Markets</div>

          {/* monthly returns chips */}
          <div className="mt-6 grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {goldrock.monthlyReturns.map((m) => (
              <div key={m.month} className="grc px-2 py-3.5 text-center">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">{m.month}</div>
                <div className="text-[15px] sm:text-[18px] font-black text-white tabular-nums mt-0.5" style={{ textShadow: "0 0 16px rgba(53,147,210,0.55)" }}>+{m.pct}%</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-white/35 max-w-2xl mx-auto">Past performance is not a guarantee of future results. Figures reflect GoldRock's historical monthly returns.</p>
        </section>

        {/* COMPOUND CALCULATOR */}
        <section className="py-10">
          <div className="rounded-3xl border border-amber-400/20 p-6 sm:p-8" style={{ background: "radial-gradient(700px 320px at 50% 0%,rgba(94,200,255,0.10),transparent 60%)" }}>
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Compound calculator</div>
              <h2 className="mt-2 text-[26px] sm:text-[34px] font-black tracking-tight">See what your money could become</h2>
            </div>
            <div className="mt-7 grid md:grid-cols-2 gap-7 items-center">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-[13px] mb-2"><span className="text-white/60 font-semibold">Deposit</span><span className="font-black text-white tabular-nums">{usd(amt)}</span></div>
                  <input className="rng" type="range" min={100} max={50000} step={100} value={amt} onChange={(e) => setAmt(Number(e.target.value))} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[13px] mb-2"><span className="text-white/60 font-semibold">Monthly return</span><span className="font-black text-white tabular-nums">{rate}%</span></div>
                  <input className="rng" type="range" min={5} max={50} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                  <div className="text-[11px] text-white/35 mt-1.5">GoldRock aims for a {goldrock.minMonthly}%+ monthly minimum (averaging {goldrock.avgMonthlyReturn.toFixed(1)}%) — we default to the conservative {goldrock.minMonthly}% floor.</div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[13px] mb-2"><span className="text-white/60 font-semibold">Months</span><span className="font-black text-white tabular-nums">{months}</span></div>
                  <input className="rng" type="range" min={1} max={36} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
                <div className="text-[12px] uppercase tracking-[0.16em] text-white/45">Projected balance · {months} mo</div>
                <div className="mt-2 text-[38px] sm:text-[46px] font-black tabular-nums tenx-hue">{usd(projected)}</div>
                <div className="mt-1.5 text-[14px] text-amber-300 font-bold tabular-nums">+{usd(profit)} profit · {(projected / amt).toFixed(1)}×</div>
                <div className="mt-4 -mx-2"><GrowthChart id="calc" vals={calcSeries} height={130} /></div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] py-2"><div className="text-[15px] font-black text-white tabular-nums">{usd(amt)}</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-0.5">You put in</div></div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] py-2"><div className="text-[15px] font-black text-amber-300 tabular-nums">{apy >= 1000 ? `${(apy / 1000).toFixed(1)}k` : apy.toFixed(0)}%</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-0.5">Effective APY</div></div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] py-2"><div className="text-[15px] font-black text-amber-200 tabular-nums">{(projected / amt).toFixed(1)}×</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-0.5">Growth</div></div>
                </div>
                <div className="mt-4"><CTA id="tenx-calc-cta" label="Start compounding" className="h-12 px-6 text-[15px] w-full" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* VIP SIGNALS */}
        <section className="py-10">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Want to trade too?</div>
            <h2 className="mt-2 text-[26px] sm:text-[36px] font-black tracking-tight">Unlock the VIP live signals</h2>
            <p className="mt-3 text-white/55 max-w-xl mx-auto">Once you're funded, you get access to the desk's daily plays — entry, stop and target — right in Telegram. Tap to trade and it fires on your account, sized for you.</p>
          </div>
          <div className="mt-7 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Radio, t: "Daily live signals", d: "Real setups called by the desk every day — entry, SL, TP spelled out." },
              { icon: Zap, t: "Tap to Trade", d: "One tap fires the play on your account, auto-sized. No charting required." },
              { icon: Check, t: "Auto-unlock", d: "Fund your Pulse account and the Telegram signals unlock automatically." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="w-11 h-11 rounded-xl grid place-items-center bg-amber-400/12 border border-amber-400/30"><f.icon className="w-5 h-5 text-amber-300" /></div>
                <h3 className="mt-4 font-extrabold text-[17px]">{f.t}</h3>
                <p className="mt-2 text-[14px] text-white/60 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center"><CTA id="tenx-signals-cta" label="Get funded & unlock signals" className="h-12 px-6 text-[15px]" /></div>
        </section>

        {/* 10X — at the very bottom */}
        <section className="py-10">
          <div className="rounded-3xl border border-amber-500/20 p-6 sm:p-9 text-center" style={{ background: "radial-gradient(700px 320px at 50% 0%,rgba(42,128,189,0.12),transparent 60%)" }}>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/80">When you're ready to size up</div>
            <h2 className="mt-2 text-[28px] sm:text-[40px] font-black tracking-tight">Fund up and trade with 10× leverage</h2>
            <p className="mt-3 text-white/60 max-w-xl mx-auto">Deposit and instantly trade with 10× your capital — no challenge, no upfront fees. Keep 100% of your profits and pull your deposit out anytime.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {[
                { icon: Gauge, t: "10× buying power" },
                { icon: BadgeDollarSign, t: "$0 upfront fees" },
                { icon: TrendingUp, t: "100% profits kept" },
                { icon: Wallet, t: "Withdraw anytime" },
                { icon: Smartphone, t: "Pro TradeLocker platform" },
              ].map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-white/80"><p.icon className="w-4 h-4 text-amber-200" /> {p.t}</span>
              ))}
            </div>
            <div className="mt-7"><CTA id="tenx-10x-cta" label="Get 10X Funded" className="h-14 px-8 text-[16px]" /></div>
          </div>
        </section>

        {/* AFFILIATE / REFER & EARN */}
        <section className="py-10">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Refer &amp; earn</div>
            <h2 className="mt-2 text-[26px] sm:text-[36px] font-black tracking-tight">Get paid across your whole network</h2>
            <p className="mt-3 text-white/55 max-w-xl mx-auto">Bring people in and earn — up to <b className="text-white">10 levels</b> deep. Two ways to get paid, and you can stack both.</p>
          </div>
          <div className="mt-7 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-500/22 p-6" style={{ background: "radial-gradient(460px 220px at 15% 0%,rgba(42,128,189,0.12),transparent 60%),#0a0b10" }}>
              <div className="w-12 h-12 rounded-xl grid place-items-center bg-amber-500/12 border border-amber-500/30"><TrendingUp className="w-6 h-6 text-amber-200" /></div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200/90">GoldRock PAMM</div>
              <h3 className="mt-1 text-[20px] font-black">Profit-share on investors</h3>
              <p className="mt-2 text-[14.5px] text-white/62 leading-relaxed">Refer investors into the GoldRock fund and earn a <b className="text-white">share of the profit</b> it makes on their capital — paid as it performs, across up to 10 levels. Your rate climbs as you rank up.</p>
            </div>
            <div className="rounded-2xl border border-amber-400/22 p-6" style={{ background: "radial-gradient(460px 220px at 15% 0%,rgba(94,200,255,0.12),transparent 60%),#0a0b10" }}>
              <div className="w-12 h-12 rounded-xl grid place-items-center bg-amber-400/12 border border-amber-400/30"><Zap className="w-6 h-6 text-amber-300" /></div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300/90">Traders</div>
              <h3 className="mt-1 text-[20px] font-black">Per-lot on every trade</h3>
              <p className="mt-2 text-[14.5px] text-white/62 leading-relaxed">Refer traders taking the signals or trading themselves and earn a <b className="text-white">custom commission per lot</b> they trade — set by your plan, up to 10 levels deep. Paid as they trade.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {["Up to 10 levels", "Paid as it performs", "No cap · lifetime", "Rank up for more"].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-white/80"><Check className="w-4 h-4 text-amber-300" /> {t}</span>
            ))}
          </div>
          <div className="mt-6 text-center"><CTA id="tenx-aff-cta" label="Start earning as an affiliate" className="h-12 px-7 text-[15px]" /></div>
        </section>

        <footer className="py-10 text-center text-[12px] text-white/35 leading-relaxed">
          <div>© Copy the Rich Trades · powered by Pulse Markets</div>
          <p className="mt-2 max-w-2xl mx-auto">Trading leveraged products and investing carry a substantial risk of loss. Only invest capital you can afford to lose. Past performance is not indicative of future results.</p>
        </footer>
      </div>
    </div>
  );
}
