import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchMe, enterUrl, depositUrl, getToken, getProfile, logout, setImpersonateToken, type MeStatus } from "./api";
import Community from "./Community";
import Chat from "./Chat";
import Academy from "./Academy";
import Dash, { SessionsFeed, TapToTrade, TapTradePage, NewsFeed, TelegramDeskFeed } from "./Dash";
import ConstellationBackground from "./ConstellationBackground";

const usd = (n: number) => `$${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// VIP Telegram button + the raw invite link shown alongside it, one-tap copyable.
function TgLink({ url, label = "Join the VIP Telegram →", style }: { url: string; label?: string; style?: any }) {
  const [copied, setCopied] = useState(false);
  const shown = url.replace(/^https?:\/\//, "");
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { try { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); } catch {} }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="tgrow" style={style}>
      <a className="btn tg" href={url} target="_blank" rel="noopener noreferrer">{label}</a>
      <div className="tglink" title={url}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="tgurl">{shown}</a>
        <button type="button" className="tgcopy" onClick={copy} aria-label="Copy link">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// Full walkthrough of TradeLocker — open it, place a trade, set stop/targets, manage the position.
// Fixed demo candles for the mock chart (slight uptrend into the entry); the last one tracks the live tick.
const TLG_CANDLES = [
  [30, 42, 26, 38], [38, 44, 33, 35], [35, 40, 28, 39], [39, 52, 37, 48], [48, 50, 40, 43],
  [43, 47, 34, 45], [45, 58, 43, 55], [55, 60, 50, 52], [52, 56, 44, 54], [54, 68, 52, 64],
  [64, 70, 60, 62], [62, 66, 55, 65], [65, 78, 63, 74], [74, 80, 70, 72], [72, 84, 70, 82], [82, 90, 78, 86],
];
const TLG_PX0 = 4013.2;          // the price the last candle closes at
const TLG_SPREAD = 0.18;
const TLG_UNIT = 1.6;            // chart units per $1 of price
const TLG_SL_D = 8, TLG_TP_D = 16; // demo stop / target distance in $ (a clean 2R)

type TlPos = { side: "buy" | "sell"; lots: number; entry: number; sl: number | null; tp: number | null; trail?: number };
type TlOrder = { side: "buy" | "sell"; kind: "limit" | "stop"; lots: number; price: number };
type TlClosed = { side: "buy" | "sell"; lots: number; entry: number; exit: number; pl: number };

// Gold: 1.00 lot = 100oz, so $1 of price = $100 per lot (0.01 lots ≈ $1 per $1 move).
const tlPl = (p: { side: "buy" | "sell"; lots: number; entry: number }, cur: number) =>
  (cur - p.entry) * (p.side === "buy" ? 1 : -1) * p.lots * 100;
const tlMoney = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;

// One numbering hierarchy across the guide, so nothing competes:
//   chapters  → "01 —" kicker, matching the nav cards at the top (this component)
//   callouts  → small outlined circles (.tlgnum), for unordered lists of parts
//   steps     → filled gradient chips, the only numbers that mean "do this in order"
function TlgHead({ id, n, title, sub }: { id: string; n: number; title: string; sub: string }) {
  return (
    <div id={id} className="mt-12 mb-4 scroll-mt-[80px] border-t border-black/[0.07] pt-7">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10.5px] font-black tracking-[0.22em] text-[#195a83]/75">PART {String(n).padStart(2, "0")}</span>
        <span className="flex-1 h-px bg-black/[0.035]" />
        <span className="text-[10.5px] font-bold tracking-[0.12em] text-[#141414]/25 tabular-nums">{n} / 5</span>
      </div>
      <h4 className="text-[19px] font-extrabold text-[#141414] leading-tight">{title}</h4>
      <p className="text-[13.5px] text-[#141414]/50 leading-relaxed mt-2 max-w-2xl">{sub}</p>
    </div>
  );
}

function TradeLockerGuide({ me }: { me: MeStatus | null }) {
  const openUrl = enterUrl("/accounts");
  const [step, setStep] = useState(1);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  // The real platform's order panel tabs: Market · Pending · Trailing Stop.
  const [otype, setOtype] = useState<"market" | "pending" | "trail">("market");
  const [lots, setLots] = useState(0.01);
  const [slOn, setSlOn] = useState(true);
  const [tpOn, setTpOn] = useState(true);
  const [slD, setSlD] = useState(TLG_SL_D);      // stop distance in $ — drives the SL&TP calculator
  const [tpD, setTpD] = useState(TLG_TP_D);
  const [px, setPx] = useState(TLG_PX0);
  const [limRef, setLimRef] = useState(TLG_PX0); // market price frozen when you picked the type
  const [limOff, setLimOff] = useState(3);       // how far from it the order rests
  const [pendAbove, setPendAbove] = useState(false); // above market = stop entry, below = limit entry
  const [trailTicks, setTrailTicks] = useState(400); // trailing-stop distance, in ticks (100 ticks = $1 on Gold)
  const [pos, setPos] = useState<TlPos | null>(null);
  const [order, setOrder] = useState<TlOrder | null>(null);
  const [hist, setHist] = useState<TlClosed[]>([]);
  const [tab, setTab] = useState<"positions" | "orders" | "history">("positions");
  const [manage, setManage] = useState(false);

  // Live tick — a bounded random walk so the demo breathes like the real platform.
  useEffect(() => {
    const id = setInterval(() => setPx((p) => {
      const n = p + (Math.random() - 0.47) * 0.4;
      return Math.round(Math.min(TLG_PX0 + 14, Math.max(TLG_PX0 - 14, n)) * 100) / 100;
    }), 900);
    return () => clearInterval(id);
  }, []);

  const bid = +(px - TLG_SPREAD).toFixed(2), ask = +(px + TLG_SPREAD).toFixed(2);
  const dir = side === "buy" ? 1 : -1;
  const slPrev = +(px - slD * dir).toFixed(2);   // where the stop would sit right now
  const tpPrev = +(px + tpD * dir).toFixed(2);

  // A resting order is priced off the market at the moment you picked the type — it must not tick under you.
  useEffect(() => { if (otype === "pending") { setLimRef(px); setLimOff(3); } }, [otype]); // eslint-disable-line react-hooks/exhaustive-deps
  // TradeLocker derives the type from where you park it: above the market is a stop entry, below is a limit.
  const restPrice = +(limRef + (pendAbove ? limOff : -limOff)).toFixed(2);
  const restKind: "limit" | "stop" = pendAbove ? "stop" : "limit";

  type Focus = "balance" | "symbol" | "type" | "lots" | "risk" | "place" | "positions";
  // Wording and labels follow the real platform: Market / Pending / Trailing Stop on the order
  // panel, the SL&TP calculator (Price · Ticks · P&L · Balance), and Positions / Pending /
  // Closed Positions in the Trades panel. See tradelocker.com/how-to.
  const steps: { n: number; title: string; body: JSX.Element; focus: Focus; enter?: () => void }[] = [
    { n: 1, focus: "balance", title: "Open your account in TradeLocker", enter: () => { setPos(null); setOrder(null); setHist([]); setManage(false); setOtype("market"); setTab("positions"); }, body: <>From your <b>Pulse dashboard</b>, open your live account and hit <b>“Open in TradeLocker.”</b> You land on the trading screen: the <b>Chart panel</b> in the middle, the <b>Markets panel</b> on the left, the <b>Order panel</b> for execution, and the <b>Trades panel</b> along the bottom with your <b>Balance, Equity and Margin</b>.</> },
    { n: 2, focus: "symbol", title: "Find the market (Gold / XAUUSD)", body: <>Search <b>XAUUSD</b> (Gold) in the Markets panel and tap it — it loads into the chart and the order panel. You'll see the <b>Sell</b> (bid) price on the left and the <b>Buy</b> (ask) on the right, ticking. The gap between them is the <b>spread</b>, the cost you pay the moment you enter.</> },
    { n: 3, focus: "type", title: "Market, Pending or Trailing Stop", enter: () => setOtype("market"), body: <>The order panel has three tabs. <b>Market</b> fills instantly at the price showing. <b>Pending</b> rests until price reaches your level — TradeLocker works out the type for you (<i>above</i> the market = a stop entry, <i>below</i> = a limit entry), so you can't pick the wrong one. <b>Trailing Stop</b> drags your stop along behind price. For a Gold Pulse call you usually fire <b>Market</b>.</> },
    { n: 4, focus: "lots", title: "Set your size (Lots)", body: <>Set <b>Size</b> in lots with the − / + stepper. Size <i>is</i> risk: on Gold, <b>0.01 lots ≈ $1 per $1 (100 pts) move</b>, so 0.10 lots is ten times the swing — same trade, ten times the damage. TradeLocker shows the <b>Margin</b> the trade will tie up right next to it, and its <b>Risk</b> toggle can size the lot <i>for</i> you from the amount you're willing to lose.</> },
    { n: 5, focus: "risk", title: "Set Stop Loss & Take Profit", enter: () => { setSlOn(true); setTpOn(true); }, body: <>Tick <b>Stop Loss</b> and <b>Take Profit</b>. The real calculator takes any of four inputs — <b>Price</b>, <b>Ticks</b>, <b>P&amp;L</b> in US$, or <b>Balance</b> % — and fills in the rest, so you can say “risk $20” and let it find the price. <b>The SL is non-negotiable.</b> Watch both levels draw on the chart: the gap between entry and stop is your <b>R</b>.</> },
    { n: 6, focus: "place", title: "Fire the trade", body: <>Hit the big green <b>BUY</b> or red <b>SELL</b> button — that's the trigger. A market order fills instantly and lands in the <b>Positions</b> tab with live P&amp;L. Go on — fire one in the demo.</> },
    { n: 7, focus: "positions", title: "Manage it — edit or close", enter: () => { setTab("positions"); setManage(true); }, body: <>In the Trades panel each position has <b>Edit position</b> (move your SL/TP — trail the stop to breakeven once you're up), <b>Partial close position</b> (bank half at a target, let the rest run) and <b>Close position</b>. You can also drag the SL and TP lines straight on the chart. Never pull your stop to “give it room.”</> },
  ];
  const active = steps[step - 1];
  const go = (n: number) => { const s = steps[n - 1]; if (!s) return; setStep(n); s.enter?.(); };
  const ring = (f: Focus) => active.focus === f ? "ring-2 ring-[#3181b9] shadow-[0_0_22px_-4px_rgba(29,102,148,.7)] relative z-10" : "";

  // Step 7 has nothing to manage unless something is open — put a demo position on the book.
  useEffect(() => {
    if (step === 7 && !pos) setPos({ side, lots, entry: side === "buy" ? ask : bid, sl: slOn ? slPrev : null, tp: tpOn ? tpPrev : null });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const fire = (s: "buy" | "sell") => {
    setSide(s);
    if (otype === "pending") {
      setOrder({ side: s, kind: restKind, lots, price: restPrice });
      setTab("orders");
      return;
    }
    const entry = s === "buy" ? ask : bid;
    const d = s === "buy" ? 1 : -1;
    const trail = otype === "trail" ? trailTicks / 100 : undefined; // 100 ticks = $1 on Gold
    setPos({
      side: s, lots, entry,
      sl: trail != null ? +(entry - trail * d).toFixed(2) : slOn ? +(entry - slD * d).toFixed(2) : null,
      tp: tpOn ? +(entry + tpD * d).toFixed(2) : null,
      trail,
    });
    setTab("positions");
    if (step === 6) go(7);
  };
  const closeSome = (frac: number) => {
    if (!pos) return;
    const cut = frac === 1 ? pos.lots : Math.max(0.01, Math.round(pos.lots * frac * 100) / 100);
    const exit = pos.side === "buy" ? bid : ask;
    setHist((h) => [{ side: pos.side, lots: cut, entry: pos.entry, exit, pl: tlPl({ ...pos, lots: cut }, exit) }, ...h].slice(0, 4));
    const left = Math.round((pos.lots - cut) * 100) / 100;
    if (left < 0.01) { setPos(null); setManage(false); setTab("history"); } else setPos({ ...pos, lots: left });
  };
  const nudge = (k: "sl" | "tp", d: number) => setPos((p) => p && ({ ...p, [k]: p[k] == null ? null : +(p[k]! + d).toFixed(2) }));

  // A trailing stop ratchets: it follows price in your favour and never moves back.
  useEffect(() => {
    setPos((p) => {
      if (!p || p.trail == null || p.sl == null) return p;
      const want = +(px - p.trail * (p.side === "buy" ? 1 : -1)).toFixed(2);
      const better = p.side === "buy" ? want > p.sl : want < p.sl;
      return better ? { ...p, sl: want } : p;
    });
  }, [px]);

  // Live P/L and R multiple on the open position — R is the whole language of the desk.
  const pl = pos ? tlPl(pos, pos.side === "buy" ? bid : ask) : 0;
  const rMult = pos && pos.sl != null ? (pos.side === "buy" ? px - pos.entry : pos.entry - px) / Math.abs(pos.entry - pos.sl) : null;
  // Account metrics the way the Trades panel shows them: Balance / P&L / Equity / Margin used / available / level.
  const balance = 2500 + hist.reduce((a, h) => a + h.pl, 0);
  const equity = balance + pl;
  const exposure = lots * 100 * px;              // 1.00 lot of Gold = 100 oz
  const margin = exposure / 100;                 // 1:100 leverage
  const marginUsed = pos ? (pos.lots * 100 * px) / 100 : 0;
  const marginLevel = marginUsed > 0 ? (equity / marginUsed) * 100 : 0;

  // Price → chart units, so the SL/TP/entry lines land where they really would.
  const u = (price: number) => 86 + (price - TLG_PX0) * TLG_UNIT;
  const yy = (v: number) => 122 - v * 0.95;
  const liveClose = u(px);
  const lineSl = pos ? pos.sl : slOn ? slPrev : null;
  const lineTp = pos ? pos.tp : tpOn ? tpPrev : null;
  const chartLines: [number | null, string, string][] = [[lineSl, "#ba0a21", "SL"], [lineTp, "#00eba9", "TP"], [pos ? pos.entry : null, "rgba(20,20,20,.55)", "ENTRY"]];

  // Lingo, using the platform's own labels (Ticks, Exposure, Margin level all appear in the Trades panel).
  const terms = [
    { t: "Tick / point", d: "The smallest price move. On Gold, 100 ticks = $1.00. The SL&TP calculator takes your stop in ticks as well as in price." },
    { t: "Lot", d: "Trade size, set in the order panel's Size box. 0.01 (micro) is the smallest — bigger lots mean bigger wins AND bigger losses." },
    { t: "Spread", d: "The gap between the Sell (bid) and Buy (ask) price. You pay it on entry, so every trade starts slightly negative." },
    { t: "Stop Loss (SL)", d: "An auto-exit that caps your loss. Mandatory on every desk call — set it before you're in, or drag it onto the chart after." },
    { t: "Take Profit (TP)", d: "An auto-exit that banks your profit. The desk posts a ladder (TP1→TP6) — partial-close at each." },
    { t: "Trailing stop", d: "Its own tab in the order panel. The stop follows price in your favour by a set distance and never moves back." },
    { t: "Margin / Exposure", d: "Margin is the deposit held to open the trade; exposure is the full contract value it controls. Over-leveraging is the #1 account-killer." },
    { t: "Margin level", d: "Equity ÷ margin used, as a %. It's in the Trades panel header — when it falls too far, positions get closed out for you." },
    { t: "R (risk multiple)", d: "1R = the distance to your stop. A 3R target aims for 3× what you're risking." },
  ];

  const chapters = [
    { id: "tlg-tour", n: 1, t: "The screen", d: "What every panel does" },
    { id: "tlg-trade", n: 2, t: "Place a trade", d: "Interactive — try it live" },
    { id: "tlg-manage", n: 3, t: "Manage it", d: "Edit, partial close, close" },
    { id: "tlg-lingo", n: 4, t: "The lingo", d: "Lots, ticks, margin, R" },
    { id: "tlg-rules", n: 5, t: "Desk rules", d: "How the desk trades it" },
  ];
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="max-w-5xl">
      {/* HERO */}
      <div className="rounded-2xl border border-black/[0.09] p-6 flex justify-between items-center gap-5 flex-wrap" style={{ background: "radial-gradient(120% 100% at 100% 0,rgba(39,117,169,.14),transparent 60%),#fafbfb" }}>
        <div className="min-w-[260px]">
          <div className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-[#195a83]">The platform your trades live on</div>
          <h3 className="text-[22px] font-extrabold text-[#141414] mt-1.5 mb-2">How to trade on TradeLocker</h3>
          <p className="text-[#141414]/60 text-sm leading-relaxed max-w-md">Real platform, real labels. Tour the screen, then step through a working demo of the order panel — prices tick, orders fill, P&amp;L moves. Nothing here touches your money.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <a className="btn tg" href={openUrl} target="_blank" rel="noopener noreferrer">Open my TradeLocker →</a>
          <span className="text-[11px] text-[#141414]/40">Opens your live account on Pulse</span>
        </div>
      </div>

      {/* CHAPTER NAV */}
      <div className="tlgnav mt-4 mb-8">
        {chapters.map((c) => (
          <button key={c.id} onClick={() => jump(c.id)} className="text-left rounded-xl border border-black/[0.08] bg-[#fafbfb] px-3.5 py-3 hover:border-[#3181b9]/40 transition">
            <div className="text-[10px] font-black text-[#195a83]/70 tracking-[0.22em]">PART {String(c.n).padStart(2, "0")}</div>
            <div className="text-[13.5px] font-extrabold text-[#141414] mt-1">{c.t}</div>
            <div className="text-[11.5px] text-[#141414]/45 mt-0.5 leading-snug">{c.d}</div>
          </button>
        ))}
      </div>

      {/* 1 · INTERFACE TOUR */}
      <TlgHead id="tlg-tour" n={1} title="The screen — what you're looking at" sub="TradeLocker splits into five panels. Learn these names once and every instruction below makes sense." />
      <div className="tlgtour">
        <figure className="rounded-2xl border border-black/[0.09] bg-[#fcfcfc] p-3 overflow-hidden">
          <img src="/tradelocker/platform.webp" alt="The TradeLocker trading screen with the floating order panel" className="w-full h-auto rounded-lg" loading="lazy" />
          <figcaption className="text-[11px] text-[#141414]/35 mt-2 px-1">The live platform, with the floating order panel pulled out. Screens: tradelocker.com</figcaption>
        </figure>
        <div className="flex flex-col gap-2 self-start">
          {[
            ["Chart panel", "TradingView charts with the full drawing toolset — trend lines, Fibs, indicators. Your SL and TP show here as draggable lines."],
            ["Markets panel", "Every instrument you can trade, searchable. Tap XAUUSD to load Gold into the chart and the ticket."],
            ["Order panel", "Where trades are fired. Market · Pending · Trailing Stop, the SL&TP calculator, size in lots, and the big BUY / SELL buttons."],
            ["Trades panel", "Along the bottom: Positions, Pending, Trades, Closed Positions — and your Balance, P&L, Equity, Margin used, Margin available and Margin level."],
            ["Sidebar", "Far right: show/hide panels, zoom, and your account switcher."],
          ].map(([t, d], i) => (
            <div key={t} className="flex gap-3 rounded-xl border border-black/[0.08] bg-[#fafbfb] px-3.5 py-3">
              <span className="tlgnum">{i + 1}</span>
              <span className="text-[13px] text-[#141414]/60 leading-relaxed"><b className="text-[#141414] block text-[13.5px] mb-0.5">{t}</b>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2 · INTERACTIVE WALKTHROUGH */}
      <TlgHead id="tlg-trade" n={2} title="Place a trade — try it live" sub="Step through it. The part of the platform being explained lights up, and the demo actually works: fire an order, watch the P&L tick." />
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="tlgchips">
          {steps.map((s) => (
            <button key={s.n} onClick={() => go(s.n)} title={s.title} className={`flex-none w-7 h-7 rounded-lg text-[12px] font-black transition ${step === s.n ? "text-[#f9f9fa]" : "text-[#141414]/45 border border-black/12 hover:border-black/20"}`} style={step === s.n ? { background: "linear-gradient(135deg,#1d6694,#307fbb)" } : undefined}>{s.n}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-none">
          <span className="text-[11px] font-bold text-[#141414]/40 tabular-nums max-[520px]:hidden">Step {step}/{steps.length}</span>
          <button onClick={() => go(step - 1)} disabled={step === 1} className="px-2.5 py-1 rounded-lg border border-black/15 text-[12px] font-bold text-[#141414]/70 disabled:opacity-30 hover:border-black/20">←</button>
          {step < steps.length
            ? <button onClick={() => go(step + 1)} className="px-3 py-1 rounded-lg text-[12px] font-black text-[#f9f9fa]" style={{ background: "linear-gradient(135deg,#1d6694,#307fbb)" }}>Next →</button>
            : <button onClick={() => go(1)} className="px-3 py-1 rounded-lg border border-black/15 text-[12px] font-bold text-[#141414]/70 hover:border-black/20">Restart</button>}
        </div>
      </div>
      <div className="h-1 rounded-full bg-black/[0.03] mb-3 overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%`, background: "linear-gradient(90deg,#1d6694,#307fbb)" }} /></div>
      <div className="rounded-xl border border-[#3181b9]/30 bg-[#3181b9]/[0.06] p-4 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex-none w-6 h-6 rounded-lg grid place-items-center text-[12px] font-black text-[#f9f9fa]" style={{ background: "linear-gradient(135deg,#1d6694,#307fbb)" }}>{active.n}</span>
          <span className="text-[14.5px] font-extrabold text-[#141414]">{active.title}</span>
        </div>
        <p className="text-[13px] text-[#141414]/65 leading-relaxed mt-2 pl-[34px]">{active.body}</p>
      </div>
      <div className="tlgwrap">
        {/* MOCK TRADELOCKER UI (styled to the real platform: teal brand, big Buy/Sell price buttons, positions tabs) */}
        <div className="rounded-2xl border border-black/[0.1] bg-[#fcfcfc] overflow-hidden self-start">
          {/* chart toolbar — mirrors the real one: timeframe, style, Indicators, market state, account */}
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-black/[0.07] bg-[#fbfbfb]">
            <div className="flex items-center gap-3 text-[10.5px] font-bold text-[#141414]/55 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-black/[0.03] text-[#141414]/80">5m</span>
              <span className="max-[520px]:hidden"><i>ƒ</i>x Indicators</span>
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Open</span>
            </div>
            <div className="text-[10.5px] font-bold text-[#141414]/45 truncate">{me?.firstName ? `${me.firstName}'s account` : "Live account"} ▾</div>
          </div>
          <div className="tlgbody">
            {/* markets panel */}
            <div className="border-r border-black/[0.07] py-1.5 max-[639px]:hidden">
              <div className="px-3 pb-1 text-[8px] uppercase tracking-wider text-[#141414]/35 font-bold">Markets</div>
              {([["XAUUSD", bid.toFixed(2), ask.toFixed(2), true], ["EURUSD", "1.0842", "1.0843", false], ["BTCUSD", "64,210", "64,238", false], ["US30", "38,940", "38,944", false]] as [string, string, string, boolean][]).map(([s, b, a, on]) => (
                <div key={s} className={`px-3 py-1.5 border-l-2 ${on ? `bg-[#2b85c0]/[0.08] border-[#2b85c0] ${ring("symbol")}` : "border-transparent"}`}>
                  <div className={`text-[11px] font-bold ${on ? "text-[#2775a9]" : "text-[#141414]/65"}`}>{s}</div>
                  <div className="flex gap-2 text-[9px] tabular-nums mt-0.5"><span className="text-rose-600">{b}</span><span className="text-emerald-600">{a}</span></div>
                </div>
              ))}
            </div>
            {/* chart */}
            <div className="p-3 min-w-0 flex flex-col">
              <div className={`flex items-center justify-between gap-2 mb-2 ${ring("symbol")} rounded-md`}>
                <div className="text-[13px] font-black text-[#141414] whitespace-nowrap">XAUUSD<span className="text-[10px] font-semibold text-[#141414]/40 ml-1.5">Gold · 5m</span></div>
                <div className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${px >= TLG_PX0 ? "text-emerald-600" : "text-rose-600"}`}>{px.toFixed(2)} <span className="text-[#141414]/35 font-semibold max-[820px]:hidden">({px >= TLG_PX0 ? "+" : "−"}{Math.abs(px - TLG_PX0).toFixed(2)})</span></div>
              </div>
              <svg viewBox="0 0 320 118" width="100%" preserveAspectRatio="none" className="block flex-1 min-h-[150px]">
                {TLG_CANDLES.map((c, i) => {
                  const last = i === TLG_CANDLES.length - 1;
                  const [o, h, l] = c; const cl = last ? liveClose : c[3];
                  const hi = last ? Math.max(h, cl) : h, lo = last ? Math.min(l, cl) : l;
                  const x = 8 + i * 19; const col = cl >= o ? "#2cbfb1" : "#af1310";
                  return (<g key={i}><line x1={x + 5} y1={yy(hi)} x2={x + 5} y2={yy(lo)} stroke={col} strokeWidth="1.3" /><rect x={x} y={yy(Math.max(o, cl))} width="10" height={Math.max(2, Math.abs(yy(o) - yy(cl)))} rx="1" fill={col} /></g>);
                })}
                {/* live price + the stop / target / entry levels, drawn where they really sit */}
                <line x1="0" y1={yy(liveClose)} x2="320" y2={yy(liveClose)} stroke="rgba(43,133,192,.55)" strokeWidth="1" strokeDasharray="3 3" />
                {chartLines.map(([p, col, label]) => p == null ? null : (
                  <g key={label}><line x1="0" y1={yy(u(p))} x2="320" y2={yy(u(p))} stroke={col} strokeWidth="1" strokeDasharray="4 4" opacity="0.85" /><text x="4" y={yy(u(p)) - 3} fill={col} fontSize="7" fontWeight="700">{label} {p.toFixed(2)}</text></g>
                ))}
              </svg>
            </div>
            {/* ORDER PANEL — modelled on the real one: Market · Pending · Trailing Stop, the
                SL&TP calculator (Price / Ticks / P&L / Balance), Size + Margin, then BUY / SELL. */}
            <div className="border-l border-black/[0.07] p-2.5 space-y-2 bg-[#fbfbfc] min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#141414]/80">
                <span className="text-[#141414]/25 tracking-[-2px]">⋮⋮</span> XAUUSD
              </div>
              <div className={`tlgtype text-[9.5px] ${ring("type")}`}>
                {([["market", "Market"], ["pending", "Pending"], ["trail", "Trailing"]] as const).map(([t, label]) => (
                  <button key={t} onClick={() => setOtype(t)} className={`py-1 rounded-md font-bold ${otype === t ? "bg-black/[0.05] text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]/70"}`}>{label}</button>
                ))}
              </div>

              {otype === "pending" && (
                <div className={`rounded-lg border border-black/[0.09] p-2 ${ring("type")}`}>
                  <div className="flex gap-1 mb-1.5 text-[9px] font-bold">
                    {([[false, "Below market"], [true, "Above market"]] as const).map(([v, label]) => (
                      <button key={label} onClick={() => setPendAbove(v)} className={`flex-1 py-1 rounded ${pendAbove === v ? "bg-[#2f82bb]/25 text-[#1a4c6d] border border-[#2f82bb]/50" : "border border-black/10 text-[#141414]/40"}`}>{label}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setLimOff((v) => Math.max(0.5, +(v - 0.5).toFixed(2)))} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">−</button>
                    <span className="text-[14px] font-black text-[#141414] tabular-nums">{restPrice.toFixed(2)}</span>
                    <button onClick={() => setLimOff((v) => +(v + 0.5).toFixed(2))} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">+</button>
                  </div>
                  <div className="text-[9px] text-[#141414]/40 mt-1.5 text-center leading-snug">Market {limRef.toFixed(2)} → this rests as a <b className="text-[#141414]/70 uppercase">{restKind}</b> entry.</div>
                </div>
              )}

              {otype === "trail" && (
                <div className={`rounded-lg border border-black/[0.09] p-2 ${ring("risk")}`}>
                  <div className="text-[9px] uppercase tracking-wide text-[#141414]/40 mb-1">Trail distance · ticks</div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setTrailTicks((v) => Math.max(100, v - 100))} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">−</button>
                    <span className="text-[14px] font-black text-[#141414] tabular-nums">{trailTicks}</span>
                    <button onClick={() => setTrailTicks((v) => v + 100)} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">+</button>
                  </div>
                  <div className="text-[9px] text-[#141414]/40 mt-1.5 text-center leading-snug">= ${(trailTicks / 100).toFixed(2)} behind price, ratcheting up — never back.</div>
                </div>
              )}

              {/* SL & TP calculator — four ways to say the same level */}
              {otype !== "trail" && (
                <div className={`rounded-lg border border-black/[0.09] overflow-hidden ${ring("risk")}`}>
                  <div className="grid grid-cols-2 text-[9.5px] font-bold">
                    <button onClick={() => setSlOn((v) => !v)} className={`flex items-center justify-center gap-1 py-1.5 ${slOn ? "bg-[#2f82bb] text-[#141414]" : "text-[#141414]/40"}`}>Stop Loss {slOn ? "✓" : "☐"}</button>
                    <button onClick={() => setTpOn((v) => !v)} className={`flex items-center justify-center gap-1 py-1.5 border-l border-black/[0.08] ${tpOn ? "bg-[#2f82bb] text-[#141414]" : "text-[#141414]/40"}`}>Take Profit {tpOn ? "✓" : "☐"}</button>
                  </div>
                  <div className="tlgcalc text-[9.5px] tabular-nums">
                    {([
                      ["Price", slPrev.toFixed(2), tpPrev.toFixed(2)],
                      ["Ticks", `${Math.round(slD * 100)}`, `${Math.round(tpD * 100)}`],
                      ["P&L", `$${(slD * lots * 100).toFixed(2)}`, `$${(tpD * lots * 100).toFixed(2)}`],
                      ["Balance", `${((slD * lots * 100 / equity) * 100).toFixed(2)}%`, `${((tpD * lots * 100 / equity) * 100).toFixed(2)}%`],
                    ] as [string, string, string][]).map(([label, s, t]) => (
                      <div key={label} className="contents">
                        <span className={`px-2 py-1 text-right ${slOn ? "text-rose-600" : "text-[#141414]/20"}`}>{slOn ? s : "—"}</span>
                        <span className="px-1 py-1 text-center text-[#141414]/35 font-bold">{label}</span>
                        <span className={`px-2 py-1 ${tpOn ? "text-emerald-600" : "text-[#141414]/20"}`}>{tpOn ? t : "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 px-2 pb-2 pt-0.5">
                    <button onClick={() => { setSlD((v) => Math.max(2, v - 2)); setTpD((v) => Math.max(4, v - 4)); }} className="flex-1 py-1 rounded bg-black/[0.03] text-[#141414]/60 text-[9px] font-bold">Tighter</button>
                    <button onClick={() => { setSlD((v) => v + 2); setTpD((v) => v + 4); }} className="flex-1 py-1 rounded bg-black/[0.03] text-[#141414]/60 text-[9px] font-bold">Wider</button>
                  </div>
                </div>
              )}

              {/* Size + margin */}
              <div className={`rounded-lg border border-black/[0.09] p-2 ${ring("lots")}`}>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wide text-[#141414]/40 mb-1"><span>Size</span><span className="text-[#2c72a0] normal-case tabular-nums">Margin: ${margin.toFixed(2)}</span></div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setLots((l) => Math.max(0.01, Math.round((l - 0.01) * 100) / 100))} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">−</button>
                  <span className="text-center leading-none"><b className="text-[15px] font-black text-[#141414] tabular-nums block">{lots.toFixed(2)}</b><span className="text-[8.5px] text-[#141414]/40">Lots</span></span>
                  <button onClick={() => setLots((l) => Math.round((l + 0.01) * 100) / 100)} className="w-6 h-6 rounded-md bg-black/[0.04] text-[#141414] text-sm leading-none">+</button>
                </div>
              </div>

              {/* BUY / SELL */}
              <div className={`tlgbs ${ring("place")}`}>
                {(["sell", "buy"] as const).map((s) => (
                  <button key={s} onClick={() => fire(s)} className={`rounded-lg py-2 text-center transition ${side === s ? "ring-2 ring-black/20" : "opacity-90 hover:opacity-100"}`} style={{ background: s === "buy" ? "linear-gradient(180deg,#00eba9,#00eba8)" : "linear-gradient(180deg,#a5000e,#c91f33)" }}>
                    <div className="text-[10px] font-black text-black/70 tracking-wide">{s === "buy" ? "BUY" : "SELL"}</div>
                    <div className="text-[14px] font-black text-black tabular-nums leading-none mt-0.5">{(otype === "pending" ? restPrice : s === "buy" ? ask : bid).toFixed(2)}</div>
                  </button>
                ))}
              </div>
              {!slOn && otype !== "trail" && <div className="text-[10px] text-[#1d6694]/90 leading-snug">⚠ Desk rule: always trade with a stop.</div>}
              <div className="text-[9px] text-[#141414]/35 text-center leading-snug">Tap <b className="text-[#141414]/60">BUY</b> / <b className="text-[#141414]/60">SELL</b> to {otype === "pending" ? `rest a ${restKind} order` : "fire a market order"}.</div>
            </div>
          </div>
          {/* TRADES PANEL — real tab names and the real account metrics strip */}
          <div className={`border-t border-black/[0.07] bg-[#fbfbfb] ${ring("positions")} ${ring("balance")}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap px-3 pt-2">
              <div className="flex gap-4 text-[10px] font-bold">
                {([["positions", `Positions (${pos ? 1 : 0})`], ["orders", `Pending (${order ? 1 : 0})`], ["history", `Closed Positions (${hist.length})`]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)} className={`pb-1.5 ${tab === k ? "text-[#2775a9] border-b-2 border-[#2b85c0]" : "text-[#141414]/40 hover:text-[#141414]/60"}`}>{label}</button>
                ))}
              </div>
              <div className="flex gap-3.5 pb-1.5 text-[8.5px] tabular-nums">
                {([["Balance", `$${balance.toFixed(2)}`, "text-[#141414]"], ["Profit & Loss", tlMoney(pl), pl >= 0 ? "text-emerald-600" : "text-rose-600"], ["Equity", `$${equity.toFixed(2)}`, "text-[#141414]"], ["Margin used", `$${marginUsed.toFixed(2)}`, "text-[#141414]"], ["Margin level", marginUsed ? `${marginLevel.toFixed(0)}%` : "—", "text-[#141414]"]] as [string, string, string][]).map(([l, v, c], i) => (
                  <div key={l} className={i > 2 ? "max-[760px]:hidden" : ""}><div className="uppercase tracking-wide text-[#141414]/35">{l}</div><div className={`text-[10.5px] font-black ${c}`}>{v}</div></div>
                ))}
              </div>
            </div>
            <div className="px-3 py-2 border-t border-black/[0.06]">
              {tab === "positions" && (pos ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11.5px] gap-2 flex-wrap">
                    <span className="font-bold text-[#141414]">XAUUSD <span className={pos.side === "buy" ? "text-emerald-600" : "text-rose-600"}>{pos.side === "buy" ? "BUY" : "SELL"}</span> · {pos.lots.toFixed(2)} <span className="text-[#141414]/40 font-normal tabular-nums">@ {pos.entry.toFixed(2)}</span></span>
                    <span className="flex items-center gap-2">
                      <span className={`tabular-nums font-bold ${pl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{tlMoney(pl)}</span>
                      {rMult != null && <span className={`tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded ${rMult >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-400/10"}`}>{rMult >= 0 ? "+" : "−"}{Math.abs(rMult).toFixed(2)}R</span>}
                      <button onClick={() => setManage((m) => !m)} className="px-2 py-0.5 rounded bg-black/[0.04] text-[#141414]/70 text-[10px] font-bold">{manage ? "Done" : "Edit"}</button>
                      <button onClick={() => closeSome(0.5)} disabled={pos.lots < 0.02} className="px-2 py-0.5 rounded bg-black/[0.04] text-[#141414]/70 text-[10px] font-bold disabled:opacity-35">Partial close</button>
                      <button onClick={() => closeSome(1)} className="px-2 py-0.5 rounded bg-black/[0.04] text-[#141414]/70 text-[10px] font-bold">Close</button>
                    </span>
                  </div>
                  {manage && (
                    <div className="rounded-lg border border-black/[0.09] bg-black/[0.03] p-2 space-y-1.5">
                      {(["sl", "tp"] as const).map((k) => (
                        <div key={k} className="flex items-center justify-between text-[10.5px]">
                          <span className={k === "sl" ? "text-rose-600 font-bold" : "text-[#1d6694] font-bold"}>{k === "sl" ? "Stop loss" : "Take profit"}</span>
                          <span className="flex items-center gap-1.5">
                            <button onClick={() => nudge(k, -1)} className="w-5 h-5 rounded bg-black/[0.04] text-[#141414] text-[11px] leading-none">−</button>
                            <span className="tabular-nums text-[#141414] font-bold w-[54px] text-center">{pos[k] == null ? "—" : pos[k]!.toFixed(2)}</span>
                            <button onClick={() => nudge(k, 1)} className="w-5 h-5 rounded bg-black/[0.04] text-[#141414] text-[11px] leading-none">+</button>
                          </span>
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-0.5">
                        <button onClick={() => setPos((p) => p && ({ ...p, sl: p.entry }))} className="flex-1 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-[10px] font-bold">Stop → breakeven</button>
                        <button onClick={() => closeSome(0.5)} disabled={pos.lots < 0.02} className="flex-1 py-1 rounded bg-black/[0.04] text-[#141414]/75 text-[10px] font-bold disabled:opacity-35">Close 50%</button>
                      </div>
                      {pos.lots < 0.02 && <div className="text-[9px] text-[#141414]/35 leading-snug">0.01 is the smallest lot — you need 0.02+ to scale out in halves.</div>}
                    </div>
                  )}
                </div>
              ) : <div className="text-[11px] text-[#141414]/30 py-0.5">No open positions — tap <b className="text-[#141414]/60">BUY</b> / <b className="text-[#141414]/60">SELL</b> to open one.</div>)}
              {tab === "orders" && (order ? (
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="font-bold text-[#141414]">XAUUSD <span className={order.side === "buy" ? "text-emerald-600" : "text-rose-600"}>{order.side.toUpperCase()} {order.kind.toUpperCase()}</span> · {order.lots.toFixed(2)} <span className="text-[#141414]/40 font-normal tabular-nums">@ {order.price.toFixed(2)}</span></span>
                  <span className="flex items-center gap-2"><span className="text-[10px] text-[#1d6694]/80 font-bold">Working</span><button onClick={() => setOrder(null)} className="px-2 py-0.5 rounded bg-black/[0.04] text-[#141414]/70 text-[10px] font-bold">Cancel</button></span>
                </div>
              ) : <div className="text-[11px] text-[#141414]/30 py-0.5">No working orders — a <b className="text-[#141414]/60">Limit</b> or <b className="text-[#141414]/60">Stop</b> order rests here until price reaches it.</div>)}
              {tab === "history" && (hist.length ? (
                <div className="space-y-1">
                  {hist.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#141414]/70">XAUUSD <span className={h.side === "buy" ? "text-emerald-600" : "text-rose-600"}>{h.side.toUpperCase()}</span> · {h.lots.toFixed(2)} <span className="text-[#141414]/35 tabular-nums">{h.entry.toFixed(2)} → {h.exit.toFixed(2)}</span></span>
                      <span className={`tabular-nums font-bold ${h.pl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{tlMoney(h.pl)}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-[11px] text-[#141414]/30 py-0.5">Nothing closed yet — every trade you close lands here with its realised P/L.</div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-[13px] text-emerald-700/90 leading-relaxed">💡 <b className="text-[#141414]">New to it?</b> Spin up a free <b>demo account</b> in Pulse and run these exact steps risk-free — same platform, fake money. When you're ready, do it live.</div>

      {/* 3 · MANAGE THE TRADE */}
      <TlgHead id="tlg-manage" n={3} title="Manage it — edit, partial close, close" sub="Once you're in, everything happens in the Trades panel or straight on the chart. These are real screens from the platform." />
      <div className="tlgmanage">
        <figure className="rounded-2xl border border-black/[0.09] bg-[#fcfcfc] p-3">
          <img src="/tradelocker/positions-table.webp" alt="TradeLocker Positions tab showing instrument, side, size, entry, stop loss, take profit, margin, exposure and P&L" className="w-full h-auto rounded-lg" loading="lazy" />
          <figcaption className="text-[12px] text-[#141414]/50 mt-2.5 px-1 leading-relaxed"><b className="text-[#141414]">The Positions tab.</b> Every open trade with its side, size, entry → current price, SL, TP, margin, exposure and live Profit &amp; Loss. The header carries your Balance, Equity, Margin used and Margin level.</figcaption>
        </figure>
        <figure className="rounded-2xl border border-black/[0.09] bg-[#fcfcfc] p-3">
          <img src="/tradelocker/position-menu.webp" alt="TradeLocker position right-click menu: copy position ID, edit position, partial close position, close position" className="w-full h-auto rounded-lg" loading="lazy" />
          <figcaption className="text-[12px] text-[#141414]/50 mt-2.5 px-1 leading-relaxed"><b className="text-[#141414]">Right-click any position</b> (or use the Actions icons) for <b className="text-[#141414]/80">Edit position</b>, <b className="text-[#141414]/80">Partial close</b> and <b className="text-[#141414]/80">Close position</b>. Full close asks you to confirm unless you've turned on one-click trading.</figcaption>
        </figure>
        <figure className="rounded-2xl border border-black/[0.09] bg-[#fcfcfc] p-3 tlgspan">
          <img src="/tradelocker/on-chart.webp" alt="TradeLocker on-chart stop loss and take profit lines, shown in dollars and percent" className="w-full h-auto rounded-lg" loading="lazy" />
          <figcaption className="text-[12px] text-[#141414]/50 mt-2.5 px-1 leading-relaxed"><b className="text-[#141414]">Or do it on the chart.</b> Click a position to drop into edit mode and your SL and TP appear as draggable lines, labelled in dollars <i>and</i> as a % of your balance. Drag the stop up to your entry once you're in profit — that's breakeven, and it's free.</figcaption>
        </figure>
      </div>
      <div className="mt-3 rounded-xl border border-black/[0.08] bg-[#fafbfb] px-4 py-3.5 text-[13px] text-[#141414]/65 leading-relaxed">
        <b className="text-[#141414]">The desk's routine on a Gold Pulse call:</b> fire the entry with the stop already set → at TP1, <b className="text-[#141414]/85">partial close</b> and drag the stop to breakeven → let the rest run to TP2/TP3. You're never risking your own money past the first target.
      </div>

      {/* 4 · LINGO */}
      <TlgHead id="tlg-lingo" n={4} title="Know the lingo" sub="The words the platform and the desk both use." />
      <div className="tlgterms">
        {terms.map((t) => (<div key={t.t} className="rounded-xl border border-black/[0.08] bg-[#fafbfb] p-3.5"><b className="block text-[#195a83] text-[13.5px] mb-1">{t.t}</b><span className="text-[#141414]/60 text-[13px] leading-relaxed">{t.d}</span></div>))}
      </div>

      {/* 5 · RULES */}
      <TlgHead id="tlg-rules" n={5} title="The desk rules — read this twice" sub="The platform will let you do anything. These are the four things that keep an account alive." />
      <div className="flex flex-col gap-2.5">
        {[["Every trade ships with a stop.", "No SL, no trade. It's the difference between a bad day and a blown account."], ["Scale out at the TPs.", "Take partial profit at TP1, move your stop to breakeven, and let the rest run."], ["Size for survival.", "Risk a small, fixed amount per trade. You can't win if you're not in it tomorrow."], ["Never hold against your stop.", "If it hits, it hits. Moving a stop to dodge a loss turns small losses into big ones."]].map(([h, d], i) => (
          <div key={i} className="flex gap-3 items-start rounded-xl border border-black/[0.08] bg-[#fafbfb] px-4 py-3.5 text-[13.5px] text-[#141414]/75 leading-relaxed"><span className="tlgnum">{i + 1}</span><span><b className="text-[#141414]">{h}</b> {d}</span></div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/[0.09] p-5 flex items-center gap-4 flex-wrap" style={{ background: "radial-gradient(120% 100% at 0 100%,rgba(39,117,169,.12),transparent 60%),#fafbfb" }}>
        <a className="btn tg" href={openUrl} target="_blank" rel="noopener noreferrer">Open TradeLocker →</a>
        <span className="text-[#141414]/60 text-[13.5px] flex-1 min-w-[220px] leading-relaxed">Want it done for you? Use <b className="text-[#141414]">Tap to Trade</b> on any Gold Pulse call — it fires the entry and auto-sets your stop.</span>
      </div>
    </div>
  );
}

// Fresh brand-new member — powers the admin "Demo view" (?demo=1).
const DEMO_ME: MeStatus = { firstName: "there", email: "new-member@copytherichtrades.com", isAdmin: false, liveBalance: 0, signalsMin: 250, signalsUnlocked: false, signalsUrl: null, pammBalance: 0, pammMin: 250, pammInvested: false, communityUnlocked: false, communityUrl: null, refCode: "plan1234", homeLink: "https://www.copytherichtrades.com/?ref=plan1234", landingLink: "https://www.copytherichtrades.com/signup?ref=plan1234" };

type TabKey = "dash" | "home" | "signals" | "sessions" | "university" | "community" | "affiliate" | "settings"
  | "replays" | "downloads" | "news" | "wins" | "following" | "support" | "chat" | "taptotrade" | "tlguide" | "howtofund";
type PathKey = "pamm" | "signals";

const ICONS: Record<string, JSX.Element> = {
  home: (<><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-6h4v6" /></>),
  signals: (<><path d="M5 12a11 11 0 0 1 14 0" /><path d="M8 15a6.5 6.5 0 0 1 8 0" /><circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" /></>),
  university: (<><path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" /><path d="M6 11v5c0 1.2 2.7 2.6 6 2.6s6-1.4 6-2.6v-5" /><path d="M21.5 9v5" /></>),
  community: (<><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 6.5a3 3 0 0 1 0 5.4" /><path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 18.5" /></>),
  affiliate: (<><circle cx="6.5" cy="12" r="2.4" /><circle cx="17.5" cy="6" r="2.4" /><circle cx="17.5" cy="18" r="2.4" /><path d="M8.7 10.9 15.3 7.1" /><path d="M8.7 13.1 15.3 16.9" /></>),
  dash: (<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>),
  sessions: (<><rect x="2.5" y="5" width="13" height="14" rx="2" /><path d="M15.5 9.5 21.5 6v12l-6-3.5" /></>),
  replays: (<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /><path d="M10.5 9v6l5-3z" fill="currentColor" stroke="none" /></>),
  downloads: (<><path d="M12 3v11" /><path d="M8 10l4 4 4-4" /><path d="M4 20h16" /></>),
  news: (<><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M7 9h6M7 13h10M7 16h7" /></>),
  wins: (<><path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><path d="M10 13v3M14 13v3M8 20h8" /></>),
  following: (<><path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 7a3.7 3.7 0 0 1 7 3.7C19 15.6 12 20 12 20Z" /></>),
  support: (<><circle cx="12" cy="12" r="8.5" /><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4 1c0 1.9-2.6 2-2.6 3.5" /><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" /></>),
  chat: (<><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5Z" /></>),
  taptotrade: (<><path d="M12 3v7" /><path d="m8.5 6.5 3.5-3.5 3.5 3.5" /><path d="M5 13.5 12 17l7-3.5" /><path d="M5 17.5 12 21l7-3.5" /></>),
  tlguide: (<><rect x="3.5" y="4.5" width="17" height="12" rx="2" /><path d="M3.5 13.5h17" /><path d="M8 20h8" /><path d="M12 16.5V20" /><path d="M7.5 8.5l2 2 2.2-2.4" /><path d="M13 9h4" /></>),
  dashboard: (<><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M8 14l3-3 2.2 2.2L17 9" /><path d="M3.5 9h17" /></>),
  admin: (<><path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z" /><path d="M9.2 12l1.9 1.9 3.7-3.8" /></>),
  pamm: (<><path d="M4 19h16" /><path d="M7 16v-4" /><path d="M12 16V8" /><path d="M17 16v-7" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
};
const TabIcon = ({ name }: { name: string }) => (
  <svg className="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[name]}</svg>
);

// Gold Pulse — animated gold heartbeat/waveform on black (the signals brand).
const GOLD_PULSE_PATH = "M2 15 H13 l3 -10 l4 20 l4 -15 l3 7 H50";
const GoldPulse = () => (
  <svg className="goldpulse" viewBox="0 0 52 30" fill="none" aria-hidden>
    <defs>
      <linearGradient id="gpGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3181b9" /><stop offset="50%" stopColor="#1f2930" /><stop offset="100%" stopColor="#3181b9" />
      </linearGradient>
    </defs>
    <path d={GOLD_PULSE_PATH} stroke="rgba(49,129,185,0.28)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path className="gpbeam" d={GOLD_PULSE_PATH} stroke="url(#gpGrad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// `ext` marks an item that leaves for Pulse (via SSO) instead of switching tabs. It renders as a
// link and is never locked — it's the route to depositing, so gating it would strand an unfunded
// member with no way to fix that.
const NAV: { group: string; items: { key: TabKey | "pulse"; label: string; ext?: string }[] }[] = [
  { group: "Core", items: [
    { key: "dash", label: "Home" },
    { key: "pulse", label: "Pulse dashboard", ext: "/accounts" },
    { key: "howtofund", label: "How funding works" },
    { key: "signals", label: "Gold Pulse Signals" },
    { key: "tlguide", label: "TradeLocker Guide" },
    { key: "community", label: "Community" },
    { key: "downloads", label: "Downloads" },
  ] },
  { group: "Learn", items: [
    { key: "university", label: "Academy" },
    { key: "news", label: "News" },
  ] },
  { group: "Grow", items: [
    { key: "wins", label: "Wins" },
    { key: "following", label: "Following" },
    { key: "affiliate", label: "Affiliate" },
  ] },
];

const CSS = `
.mb *{box-sizing:border-box}
.mb{position:relative;min-height:100vh;background:#fdfdfd;color:#141414;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
/* The animated constellation backdrop sits fixed at z-index 0 (see ConstellationBackground) —
   every page layer has to be explicitly lifted above it or it paints over the content. */
.mb .top{position:sticky;top:0;z-index:30;background:rgba(253,253,253,.72);backdrop-filter:blur(16px);border-bottom:1px solid rgba(20,20,20,.06);transform:translateZ(0);will-change:transform;backface-visibility:hidden}
.mb .shell,.mb .center{position:relative;z-index:1}
.mb .topin{max-width:1180px;margin:0 auto;padding:0 18px;display:flex;align-items:center;justify-content:space-between;height:60px;gap:10px}
.mb .brand{display:flex;align-items:center;gap:9px}
.mb .brand img{height:34px;width:34px;border-radius:9px;object-fit:contain}
.mb .brand span{font-weight:900;font-size:15px;white-space:nowrap}
.mb .burger{display:none;width:38px;height:38px;margin-right:2px;border-radius:10px;border:1px solid rgba(20,20,20,.12);background:rgba(20,20,20,.03);color:#141414;cursor:pointer;align-items:center;justify-content:center;flex:0 0 38px}
.mb .burger svg{width:20px;height:20px}
.mb .scrim{display:none}
.mb .lo{height:34px;padding:0 14px;border-radius:11px;border:1px solid rgba(20,20,20,.15);background:none;color:rgba(20,20,20,.8);font-size:12px;font-weight:700;cursor:pointer}
.mb .lo:hover{color:#141414;border-color:rgba(20,20,20,.3)}
.mb .topr{display:flex;align-items:center;gap:10px;min-width:0}
.mb .demobar{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:10px 18px;font-size:12.5px;color:#194d70;background:rgba(48,127,187,.10);border-bottom:1px solid rgba(48,127,187,.22);text-align:center}
.mb .demobar b{color:#141414}
.mb .uemail{font-size:12px;color:rgba(20,20,20,.55);max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:560px){.mb .uemail{display:none}}
/* Admin gets its own accent through the same variables the rail uses, so it stays distinct from
   the member nav without needing separate hover/active rules. */
.mb .tab.admin{--gr:167,139,250;--g2r:236,72,153;border-color:rgba(35,111,159,.3);color:#194d70}

.mb .shell{max-width:1180px;margin:0 auto;padding:18px;display:flex;gap:18px;align-items:flex-start}
.mb .rail{position:sticky;top:78px;flex:0 0 210px;display:flex;flex-direction:column;gap:6px}
/* Each nav group carries its own accent as RGB triplets, so one set of rules below tints the label,
   the icons, hover and the active pill. Triplets (not hex) so they can be used inside rgba(). */
.mb .rail{--gr:34,211,238;--g2r:129,140,248}
.mb .rail>div[data-g="learn"]{--gr:167,139,250;--g2r:240,171,252}
.mb .rail>div[data-g="grow"]{--gr:251,191,36;--g2r:52,211,153}
.mb .rail .rlabel{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgb(var(--gr));padding:6px 12px 8px;opacity:.9}
.mb .rail .rlabel::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(var(--gr),.45),transparent)}
.mb .rail>div:not(.railtop){display:flex;flex-direction:column;gap:6px}
.mb .rail>div+div{margin-top:12px}
.mb .railtop{display:none}
.mb .tab{position:relative;display:flex;align-items:center;gap:11px;height:44px;padding:0 13px;border-radius:12px;border:1px solid transparent;background:none;color:rgba(20,20,20,.72);font-size:14px;font-weight:700;cursor:pointer;text-align:left;width:100%;transition:.18s;text-decoration:none;overflow:hidden}
.mb .tab .ti{width:19px;height:19px;flex:0 0 19px;color:rgb(var(--gr));opacity:.62;transition:.18s}
.mb .tab:hover{background:linear-gradient(90deg,rgba(var(--gr),.12),rgba(var(--g2r),.05));border-color:rgba(var(--gr),.22);color:#141414;transform:translateX(2px)}
.mb .tab:hover .ti{opacity:1;filter:drop-shadow(0 0 6px rgba(var(--gr),.6))}
.mb .tab.on{background:linear-gradient(90deg,rgba(var(--gr),.24),rgba(var(--g2r),.12));border-color:rgba(var(--gr),.5);color:#141414;box-shadow:0 6px 22px -8px rgba(var(--gr),.55),inset 0 1px 0 rgba(20,20,20,.06)}
/* Left accent bar on the active item — the strongest single cue for "you are here". */
.mb .tab.on::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,rgb(var(--gr)),rgb(var(--g2r)));box-shadow:0 0 10px rgba(var(--gr),.8)}
.mb .tab.on .ti{opacity:1;filter:drop-shadow(0 0 7px rgba(var(--gr),.75))}
@media(prefers-reduced-motion:reduce){.mb .tab,.mb .tab:hover{transition:none;transform:none}}
/* Locked until funded. Still clickable on purpose — the click re-opens the deposit prompt, which is
   more useful than a dead button that leaves them guessing why nothing happened. */
.mb .tab.lk{color:rgba(20,20,20,.34)}
.mb .tab.lk .ti{opacity:.24;filter:none}
.mb .tab.lk .lkic{margin-left:auto;font-size:11px;opacity:.5;filter:grayscale(1)}
.mb .tab.lk:hover{background:rgba(20,20,20,.03);border-color:rgba(20,20,20,.09);color:rgba(20,20,20,.5);transform:none}
.mb .tab.lk:hover .ti{opacity:.4;filter:none}
.mb .tab.lk:hover .lkic{opacity:.9;filter:none}
/* Pulse dashboard — an outbound link, and the one Core item that is never locked. Tinted in Pulse
   cyan and marked with an arrow so it's obviously "leaves this site". */
.mb .tab.pulse{--gr:0,229,255;--g2r:42,157,244;color:rgba(20,20,20,.82);background:rgba(25,90,131,.06);border-color:rgba(25,90,131,.2)}
.mb .tab.pulse .ti{opacity:.95}
.mb .tab.pulse .extic{margin-left:auto;font-size:12px;font-weight:900;color:rgba(25,90,131,.7)}
.mb .tab.pulse:hover{background:rgba(25,90,131,.13);border-color:rgba(25,90,131,.42)}
.mb .railfoot{margin-top:12px;border-top:1px solid rgba(20,20,20,.07);padding-top:12px;display:flex;flex-direction:column;gap:6px}
.mb .content{flex:1;min-width:0}

.mb .hero{padding:2px 0 8px}
.mb .hi{font-size:26px;font-weight:900;letter-spacing:-.02em}
.mb .hi .g{background:linear-gradient(90deg,#1d6694,#2f7fbc);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.mb .hisub{color:rgba(20,20,20,.55);font-size:14.5px;margin-top:6px;max-width:560px}
.mb .walletchip{display:inline-flex;align-items:center;gap:8px;margin-top:14px;border:1px solid rgba(42,193,138,.3);background:rgba(42,193,138,.08);border-radius:12px;padding:9px 14px;font-size:13.5px;color:rgba(20,20,20,.8)}
.mb .walletchip b{color:#189161;font-variant-numeric:tabular-nums}
.mb .kick{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(29,102,148,.8);margin:26px 0 12px;display:flex;align-items:center;gap:8px}
.mb .kick .opt{color:rgba(20,20,20,.35);font-weight:700}
.mb .h2{font-size:20px;font-weight:900;letter-spacing:-.01em}
.mb .lead{color:rgba(20,20,20,.55);font-size:14px;margin-top:6px;max-width:600px;line-height:1.55}

.mb .grid{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:720px){.mb .grid{grid-template-columns:1fr 1fr}}

/* TradeLocker Guide layout — own classes, because ".mb .grid" above outranks Tailwind's grid-cols-* utilities. */
.mb .tlgwrap{display:block}
.mb .tlgnav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(min-width:720px){.mb .tlgnav{grid-template-columns:repeat(5,minmax(0,1fr))}}
.mb .tlgchips{display:flex;gap:6px;flex-wrap:wrap;min-width:0}
/* Callout numeral — outlined, deliberately quieter than the filled step chips so the two
   numbering systems never read as the same list. */
.mb .tlgnum{flex:none;width:22px;height:22px;margin-top:1px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;color:#185781;border:1px solid rgba(25,90,131,.4);background:rgba(25,90,131,.07);font-variant-numeric:tabular-nums}
.mb .tlgtour{display:grid;grid-template-columns:1fr;gap:16px;align-items:start}
@media(min-width:900px){.mb .tlgtour{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}}
.mb .tlgmanage{display:grid;grid-template-columns:1fr;gap:14px;align-items:start}
@media(min-width:820px){.mb .tlgmanage{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.mb .tlgspan{grid-column:1/-1}}
.mb .tlgbody{display:grid;grid-template-columns:1fr}
@media(min-width:640px){.mb .tlgbody{grid-template-columns:112px minmax(0,1fr) 196px}}
.mb .tlgbs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mb .tlgtype{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;background:rgba(20,20,20,.05);border-radius:9px;padding:3px}
.mb .tlgcalc{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);border-top:1px solid rgba(20,20,20,.07)}
.mb .tlgterms{display:grid;grid-template-columns:1fr;gap:10px}
@media(min-width:640px){.mb .tlgterms{grid-template-columns:1fr 1fr}}
.mb .card{border:1px solid rgba(20,20,20,.09);background:#fbfbfc;border-radius:18px;padding:22px;display:flex;flex-direction:column}
.mb .card .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:21px;background:rgba(29,102,148,.12);border:1px solid rgba(29,102,148,.28)}
.mb .card h3{font-size:17px;font-weight:800;margin-top:14px}
.mb .card p{color:rgba(20,20,20,.6);font-size:14px;line-height:1.55;margin-top:8px;flex:1}

.mb .btn{margin-top:16px;height:44px;border:none;border-radius:12px;font-weight:800;font-size:14px;color:#f9f9fa;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;background:linear-gradient(90deg,#1d6694,#307fbb,#2f7fbc);box-shadow:0 12px 34px -16px rgba(29,102,148,.7);align-self:flex-start;padding:0 20px;text-decoration:none}
.mb .btn.tg{background:linear-gradient(90deg,#2783c1,#2f82bb);color:#141414;box-shadow:0 12px 34px -16px rgba(39,117,169,.8)}
.mb .btn:hover{filter:brightness(1.06)}
.mb .tgrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.mb .tglink{display:inline-flex;align-items:center;gap:8px;background:rgba(39,117,169,.08);border:1px solid rgba(39,117,169,.28);border-radius:10px;padding:7px 8px 7px 12px;max-width:100%}
.mb .tgurl{color:#114a70;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.mb .tgurl:hover{text-decoration:underline}
.mb .tgcopy{flex:none;background:rgba(39,117,169,.16);border:1px solid rgba(39,117,169,.35);color:#25323a;font-size:12px;font-weight:700;border-radius:7px;padding:5px 10px;cursor:pointer;transition:.15s}
.mb .tgcopy:hover{background:rgba(39,117,169,.28);color:#141414}
.mb .btn.ghost{background:none;border:1px solid rgba(20,20,20,.16);color:#141414;box-shadow:none}
.mb .btn.link{background:none;box-shadow:none;color:rgba(20,20,20,.5);padding:0 6px;height:auto;text-decoration:underline;font-weight:700;font-size:13px}
.mb .btn.link:hover{color:#141414;filter:none}

/* PICK YOUR PATH */
.mb .pick2{display:grid;grid-template-columns:1fr;gap:16px;margin-top:6px}
@media(min-width:760px){.mb .pick2{grid-template-columns:1fr 1fr}}
.mb .pcard{position:relative;overflow:hidden;border-radius:20px;padding:26px;cursor:pointer;border:1px solid rgba(20,20,20,.1);background:#fbfbfc;transition:.18s;text-align:left}
.mb .pcard:hover{transform:translateY(-3px);border-color:rgba(29,102,148,.4)}
.mb .pcard.gold{background:radial-gradient(520px 260px at 15% 0%,rgba(48,127,187,.14),transparent 60%),#fbfbfc;border-color:rgba(48,127,187,.3)}
.mb .pcard.cyan{background:radial-gradient(520px 260px at 15% 0%,rgba(29,102,148,.14),transparent 60%),#fbfbfc;border-color:rgba(29,102,148,.3)}
.mb .pcard .pic{width:50px;height:50px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(20,20,20,.14)}
.mb .pcard .pic svg{width:24px;height:24px}
.mb .pcard.gold .pic{background:rgba(48,127,187,.14);border-color:rgba(48,127,187,.32);color:#194d70}
.mb .pcard.cyan .pic{background:rgba(29,102,148,.14);border-color:rgba(29,102,148,.32);color:#2e3e49}
.mb .pcard .ptag{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-top:16px}
.mb .pcard.gold .ptag{color:#1c5073}.mb .pcard.cyan .ptag{color:#2e3e49}
.mb .pcard h3{font-size:20px;font-weight:900;margin-top:5px}
.mb .pcard p{color:rgba(20,20,20,.6);font-size:14px;line-height:1.6;margin-top:9px}
.mb .pcard .go{margin-top:16px;display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:14px}
.mb .pcard.gold .go{color:#194d70}.mb .pcard.cyan .go{color:#2e3e49}
/* GoldRock flame badge (PAMM) + Gold Pulse animated badge (signals) */
.mb .pcard .pic.flame{background:none;border:none;width:62px;height:62px;overflow:visible}
.mb .pcard .pic.flame img{width:62px;height:62px;object-fit:contain;mix-blend-mode:screen;filter:drop-shadow(0 0 16px rgba(47,127,188,.55));-webkit-mask-image:radial-gradient(circle at 50% 48%,#ffffff 55%,transparent 78%);mask-image:radial-gradient(circle at 50% 48%,#ffffff 55%,transparent 78%)}
/* Gold Pulse signals — gold on black, no ring around the logo */
.mb .pcard.gpsig{background:radial-gradient(520px 260px at 15% 0%,rgba(49,129,185,.10),transparent 60%),#fcfcfd;border-color:rgba(49,129,185,.30)}
.mb .pcard.gpsig:hover{border-color:rgba(49,129,185,.5);transform:translateY(-3px)}
.mb .pcard.gpsig .ptag{color:#195a83}
.mb .pcard.gpsig .go{color:#195a83}
.mb .pcard .pic.gp{background:#fcfcfc;border:none;box-shadow:none;width:56px;height:56px}
.mb .pcard .pic.gp svg{width:36px;height:auto}
.mb .goldpulse .gpbeam{stroke-dasharray:9 62;animation:gpBeam 1.5s linear infinite;filter:drop-shadow(0 0 5px rgba(49,129,185,.85))}
@keyframes gpBeam{to{stroke-dashoffset:-71}}
@media(prefers-reduced-motion:reduce){.mb .goldpulse .gpbeam{animation:none;stroke-dasharray:none}}
.mb .unlocknote{margin:-4px 0 14px;border:1px solid rgba(29,102,148,.22);background:rgba(29,102,148,.06);border-radius:12px;padding:12px 14px;font-size:13px;color:rgba(20,20,20,.75);line-height:1.5}
.mb .unlocknote b{color:#141414}

/* STEP GATE */
.mb .gate{position:relative;overflow:hidden;border:1px solid rgba(29,102,148,.26);border-radius:20px;padding:24px;background:radial-gradient(600px 260px at 15% 0%,rgba(29,102,148,.10),transparent 60%),#fbfbfc}
.mb .gate.gold{border-color:rgba(48,127,187,.28);background:radial-gradient(600px 260px at 15% 0%,rgba(48,127,187,.12),transparent 60%),#fbfbfc}
.mb .gate.on{border-color:rgba(42,193,138,.4);background:radial-gradient(600px 260px at 15% 0%,rgba(42,193,138,.10),transparent 60%),#fbfbfc}
.mb .gate .glbl{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#2e3e49}
.mb .gate.gold .glbl{color:#194d70}.mb .gate.on .glbl{color:#189161}
.mb .gate h3{font-size:20px;font-weight:900;margin-top:8px}
.mb .gate p{color:rgba(20,20,20,.62);font-size:14px;line-height:1.6;margin-top:8px}
.mb .bar{height:10px;border-radius:99px;background:rgba(20,20,20,.08);overflow:hidden;margin-top:16px}
.mb .bar>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#1d6694,#2f7fbc);transition:width .5s ease}
.mb .gate.gold .bar>i{background:linear-gradient(90deg,#2f7fbc,#1b5f8b)}
.mb .barlab{display:flex;justify-content:space-between;font-size:12px;color:rgba(20,20,20,.5);margin-top:7px;font-variant-numeric:tabular-nums}
.mb .row{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;align-items:center}
.mb .row .btn{margin-top:0}
.mb .note{font-size:13px;color:rgba(20,20,20,.5)}
.mb .lnkbox{margin-top:16px;display:flex;align-items:center;gap:8px;border:1px solid rgba(20,20,20,.12);background:#fdfdfd;border-radius:11px;padding:6px 6px 6px 12px}
.mb .lnk{flex:1;min-width:0;font-size:12.5px;color:rgba(20,20,20,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.mb .cpy{flex:none;height:34px;padding:0 14px;border:none;border-radius:9px;font-weight:800;font-size:12.5px;color:#f9f9fa;cursor:pointer;background:linear-gradient(90deg,#1d6694,#307fbb);white-space:nowrap}
.mb .reenable{margin-top:14px;border:1px dashed rgba(20,20,20,.14);border-radius:14px;padding:16px;font-size:13.5px;color:rgba(20,20,20,.6);line-height:1.6}
.mb .reenable button{background:none;border:none;color:#2e3e49;font-weight:800;cursor:pointer;font-size:13.5px}

/* settings */
.mb .srow{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid rgba(20,20,20,.09);background:#fbfbfc;border-radius:14px;padding:16px 18px;margin-top:12px}
.mb .srow .st{font-weight:800;font-size:14.5px}
.mb .srow .ss{font-size:12.5px;color:rgba(20,20,20,.5);margin-top:3px}
.mb .sbtn{height:38px;padding:0 16px;border-radius:11px;border:1px solid rgba(29,102,148,.35);background:rgba(29,102,148,.08);color:#1f2930;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;flex:none}
.mb .sbtn.ghost{border-color:rgba(20,20,20,.15);background:none;color:rgba(20,20,20,.75)}

.mb .center{min-height:100vh;display:grid;place-items:center;color:rgba(20,20,20,.5)}
@media(max-width:760px){
  .mb .burger{display:flex}
  .mb .shell{gap:0;padding:14px}
  .mb .rail{position:fixed;left:0;top:0;bottom:0;z-index:60;flex:0 0 auto;width:270px;max-width:84vw;padding:14px 14px 22px;background:radial-gradient(420px 300px at 0% 0%,rgba(29,102,148,.10),transparent 60%),linear-gradient(180deg,#fafbfb,#fcfcfc 65%);border-right:1px solid rgba(20,20,20,.09);box-shadow:24px 0 70px -20px rgba(0,0,0,0.12),inset -1px 0 0 rgba(29,102,148,.06);transform:translateX(-100%);transition:transform .24s ease;overflow-y:auto}
  .mb .rail.open{transform:translateX(0)}
  .mb .railtop{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 4px 16px;margin-bottom:6px;border-bottom:1px solid rgba(20,20,20,.08)}
  .mb .raillogo{display:flex;align-items:center;gap:11px;min-width:0}
  .mb .raillogo img{height:40px;width:40px;border-radius:11px;object-fit:contain;box-shadow:0 10px 26px -10px rgba(29,102,148,.55),0 0 0 1px rgba(20,20,20,.06)}
  .mb .raillogo span{font-weight:900;font-size:16.5px;letter-spacing:-.01em;white-space:nowrap;background:linear-gradient(90deg,#141414,#1f2930);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .mb .railx{width:34px;height:34px;flex:none;border-radius:10px;border:1px solid rgba(20,20,20,.12);background:rgba(20,20,20,.04);color:rgba(20,20,20,.7);display:grid;place-items:center;cursor:pointer}
  .mb .railx:hover{color:#141414;border-color:rgba(20,20,20,.25)}
  .mb .railx svg{width:18px;height:18px}
  .mb .rail .tab{height:48px}
  .mb .scrim{display:block;position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.088);backdrop-filter:blur(2px)}
  .mb .content{width:100%}
  .mb .hi{font-size:22px}
}

/* ── Constellation-aware surfaces ───────────────────────────────────────────
   The panel now floats over the animated constellation, so the big opaque
   card surfaces go translucent + blurred — same treatment the cabinet on
   forexbrokercrm.com uses. Overrides live at the end so they win without
   having to touch every rule above. */
.mb .card,.mb .srow,.mb .pcard{background:rgba(251,251,252,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mb .pcard.gold{background:radial-gradient(520px 260px at 15% 0%,rgba(48,127,187,.16),transparent 60%),rgba(251,251,252,.62)}
.mb .pcard.cyan{background:radial-gradient(520px 260px at 15% 0%,rgba(29,102,148,.16),transparent 60%),rgba(251,251,252,.62)}
.mb .pcard.gpsig{background:radial-gradient(520px 260px at 15% 0%,rgba(49,129,185,.13),transparent 60%),rgba(252,252,253,.62)}
.mb .gate{background:radial-gradient(600px 260px at 15% 0%,rgba(29,102,148,.12),transparent 60%),rgba(251,251,252,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mb .gate.gold{background:radial-gradient(600px 260px at 15% 0%,rgba(48,127,187,.14),transparent 60%),rgba(251,251,252,.62)}
.mb .gate.on{background:radial-gradient(600px 260px at 15% 0%,rgba(42,193,138,.12),transparent 60%),rgba(251,251,252,.62)}
/* Dash surfaces (news feed, ticker, positions) render inside .content */
.mb .rtd .newscard{background:radial-gradient(760px 230px at 10% -40%,rgba(49,129,185,.17),transparent 62%),linear-gradient(180deg,rgba(250,250,251,.7),rgba(251,251,252,.7));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mb .rtd .ticker,.mb .rtd .poswrap{background:rgba(251,251,251,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mb .rtd .acctbar{background:rgba(250,250,251,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
/* "Add money" first-run prompt — deliberately the loudest thing on the page for an unfunded member */
.mb .fundwrap{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:18px;background:rgba(253,253,253,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto;animation:fundIn .22s ease-out}
@keyframes fundIn{from{opacity:0}to{opacity:1}}
/* Pulse brand surface: deep navy + the electric cyan from Pulse's own logo-primary.svg
   (#1d6694 -> #0d5788 -> #144e74), so this reads as Pulse the moment it opens. */
.mb .fundbox{position:relative;width:min(540px,100%);margin:auto;background:radial-gradient(620px 300px at 50% -10%,rgba(25,90,131,.16),transparent 62%),linear-gradient(180deg,#fcfbfb,#fafbfb);border-radius:22px;padding:26px 24px 22px;box-shadow:0 30px 90px rgba(0,0,0,0.106),0 0 60px -20px rgba(25,90,131,.35);text-align:center}
/* Animated brand edge — same mask-composite idiom as the Tap-to-Trade modal in Dash.tsx. */
.mb .fundbox::before{content:"";position:absolute;inset:0;border-radius:22px;padding:1.5px;background:linear-gradient(130deg,rgba(19,85,125,.9),rgba(13,87,136,.25) 42%,rgba(20,78,116,.18) 62%,rgba(19,85,125,.85));background-size:220% 220%;animation:fedge 6s linear infinite;-webkit-mask:linear-gradient(#ffffff 0 0) content-box,linear-gradient(#ffffff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes fedge{0%{background-position:0% 50%}100%{background-position:220% 50%}}
/* The collab lockup: Copy the Rich Trades x Pulse Markets */
.mb .fduo{display:flex;align-items:center;justify-content:center;gap:15px;margin-bottom:14px}
.mb .fduo .fl{position:relative;animation:ffloat 3.6s ease-in-out infinite}
.mb .fduo .fl:last-child{animation-delay:.6s}
.mb .fduo .fl img{display:block;width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fbfbfc;box-shadow:0 8px 26px -8px rgba(25,90,131,.6),0 0 0 1px rgba(20,20,20,.08)}
.mb .fduo .fl::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(19,85,125,.45);animation:fring 2.8s ease-out infinite;pointer-events:none}
.mb .fduo .fl:last-child::after{animation-delay:.6s}
.mb .fduo .fx{font-size:15px;font-weight:900;color:rgba(20,20,20,.32)}
@keyframes ffloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes fring{0%{transform:scale(.86);opacity:.85}100%{transform:scale(1.3);opacity:0}}
.mb .fbadge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(25,90,131,.12);border:1px solid rgba(25,90,131,.32);color:#093e61;font-size:10.5px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;margin-bottom:12px}
.mb .fundbox h2{font-size:25px;font-weight:900;color:#141414;margin:0 0 8px;letter-spacing:-.015em}
.mb .fundbox .sub{font-size:14.5px;color:rgba(20,20,20,.66);line-height:1.6;margin:0 0 16px}
/* The two reasons to fund — trade it yourself, or let GoldRock compound it for you. */
.mb .fways{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 16px;text-align:left}
.mb .fway{background:rgba(25,90,131,.06);border:1px solid rgba(25,90,131,.2);border-radius:13px;padding:12px 13px}
.mb .fway b{display:block;font-size:13.5px;color:#141414;margin-bottom:3px}
.mb .fway span{font-size:12.5px;color:rgba(20,20,20,.62);line-height:1.45}
@media(max-width:520px){.mb .fways{grid-template-columns:1fr}}
/* Callouts in the "how it works" panel — the answers to the two questions someone new to crypto
   always asks next: "what if I don't have any?" and "how do I get it back?" */
.mb .fhnote{text-align:left;background:rgba(25,90,131,.06);border:1px solid rgba(25,90,131,.2);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:13px;color:rgba(20,20,20,.66);line-height:1.55}
.mb .fhnote b{color:#093e61}
/* Same content as the old modal panel, laid out as a page: wider, left-aligned body, room to read. */
.mb .fundpage{max-width:720px;background:radial-gradient(700px 320px at 50% -10%,rgba(25,90,131,.14),transparent 62%),linear-gradient(180deg,rgba(251,251,250,.85),rgba(250,251,251,.85));border:1px solid rgba(25,90,131,.24);border-radius:20px;padding:30px 28px;text-align:center}
.mb .fundpage h2{font-size:27px;font-weight:900;color:#141414;margin:0 0 8px;letter-spacing:-.02em}
.mb .fundpage .sub{font-size:14.5px;color:rgba(20,20,20,.66);line-height:1.6;margin:0 0 18px}
.mb .fundpage .fundbtn{max-width:420px;margin-left:auto;margin-right:auto}
.mb .fundpage .fundalt{max-width:420px;margin-left:auto;margin-right:auto}
@media(max-width:640px){.mb .fundpage{padding:22px 16px}.mb .fundpage h2{font-size:22px}}
.mb .fhnote+.fundbtn{margin-top:16px}
/* Benefits list — what the deposit actually buys, above the mechanics of making it. */
.mb .fbens{display:grid;gap:9px;text-align:left;margin:0 0 18px}
.mb .fben{display:flex;gap:12px;align-items:flex-start;background:rgba(25,90,131,.05);border:1px solid rgba(25,90,131,.16);border-radius:13px;padding:12px 13px}
.mb .fben .fbi{flex:0 0 30px;height:30px;border-radius:9px;background:rgba(25,90,131,.12);display:grid;place-items:center;font-size:15px}
.mb .fben b{display:block;font-size:14px;color:#141414;margin-bottom:2px}
.mb .fben span{font-size:12.5px;color:rgba(20,20,20,.62);line-height:1.5}
.mb .fsec{display:flex;align-items:center;gap:9px;font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#093e61;margin:0 0 8px;text-align:left}
.mb .fsec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(25,90,131,.4),transparent)}
.mb .fundsteps{display:grid;gap:10px;text-align:left;margin:0 0 18px}
.mb .fundstep{display:flex;align-items:center;gap:12px;background:rgba(20,20,20,.04);border:1px solid rgba(20,20,20,.07);border-radius:12px;padding:11px 13px}
/* .sn, not a bare b — the step copy contains its own <b>, which would inherit the badge styling */
.mb .fundstep .sn{flex:0 0 26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#2783c1,#2f82bb);color:#141414;font-size:13px;font-weight:900;display:grid;place-items:center}
.mb .fundstep span{font-size:14px;color:rgba(20,20,20,.82);line-height:1.45}
/* Pulse cyan with deep-navy text — bright cyan needs dark text to stay legible. */
.mb .fundbtn{position:relative;overflow:hidden;display:block;width:100%;padding:16px 18px;border-radius:14px;border:none;cursor:pointer;text-decoration:none;background:linear-gradient(135deg,#1d6694,#3181b9);color:#fcfcfb;font-size:17px;font-weight:900;box-shadow:0 10px 32px rgba(25,90,131,.4)}
.mb .fundbtn:hover{filter:brightness(1.08)}
.mb .fundbtn::after{content:"";position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(90deg,transparent,rgba(20,20,20,.55),transparent);transform:skewX(-20deg);animation:fshine 3s ease-in-out infinite;pointer-events:none}
@keyframes fshine{0%{left:-60%}55%{left:130%}100%{left:130%}}
@media(prefers-reduced-motion:reduce){.mb .fundbox::before,.mb .fduo .fl,.mb .fduo .fl::after,.mb .fundbtn::after{animation:none}}
.mb .fundalt{display:block;width:100%;margin-top:10px;padding:12px 16px;border-radius:12px;border:1px solid rgba(20,20,20,.12);background:transparent;color:rgba(20,20,20,.72);font-size:14px;font-weight:700;cursor:pointer;text-decoration:none}
.mb .fundlater{margin-top:12px;background:none;border:none;color:rgba(20,20,20,.4);font-size:13px;cursor:pointer;text-decoration:underline}
.mb .fundnote{font-size:12.5px;color:rgba(20,20,20,.42);margin-top:14px;line-height:1.55}
@media(max-width:520px){.mb .fundbox{padding:22px 18px 18px}.mb .fundbox h2{font-size:21px}}
/* Permanent in-page version of the same call to action. Unlike the pop-up this can't be dismissed,
   so an unfunded member always has the deposit button in front of them. */
.mb .fundbar{position:relative;overflow:hidden;border-radius:22px;padding:40px 32px;background:radial-gradient(760px 340px at 50% -10%,rgba(25,90,131,.2),transparent 62%),linear-gradient(135deg,rgba(251,251,250,.92),rgba(250,251,251,.92));border:1px solid rgba(25,90,131,.32);box-shadow:0 18px 56px -20px rgba(25,90,131,.5)}
.mb .fundbar::after{content:"";position:absolute;inset:-40% -10% auto auto;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(25,90,131,.16),transparent 65%);pointer-events:none}
/* Stacked, centred hero rather than a side-by-side strip — a full-width row reads as a dismissible
   banner, a centred column reads as the point of the page. */
.mb .fundbar .fbin{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px}
.mb .fundbar .fblogo{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:12px}
.mb .fundbar .fblogo img{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fbfbfc;box-shadow:0 8px 26px -8px rgba(25,90,131,.6),0 0 0 1px rgba(20,20,20,.08)}
.mb .fundbar .fblogo span{font-size:15px;font-weight:900;color:rgba(20,20,20,.3)}
.mb .fundbar .fbtx{flex:none;width:100%;max-width:620px}
.mb .fundbar .fbk{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#093e61;margin-bottom:8px}
.mb .fundbar h3{font-size:34px;font-weight:900;color:#141414;margin:0 0 10px;letter-spacing:-.025em;line-height:1.12}
.mb .fundbar p{font-size:15px;color:rgba(20,20,20,.7);margin:0;line-height:1.6}
.mb .fundbar .fbgo{position:relative;overflow:hidden;flex:0 0 auto;display:block;width:100%;max-width:420px;text-align:center;padding:21px 34px;border-radius:16px;background:linear-gradient(135deg,#1d6694,#3181b9);color:#fcfcfb;font-size:19px;font-weight:900;text-decoration:none;white-space:nowrap;box-shadow:0 14px 38px rgba(25,90,131,.5);animation:fbpulse 2.6s ease-in-out infinite}
.mb .fundbar .fbgo:hover{filter:brightness(1.08)}
.mb .fundbar .fbgo::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(20,20,20,.5),transparent);transform:skewX(-20deg);animation:fshine 3s ease-in-out infinite;pointer-events:none}
@keyframes fbpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@media(prefers-reduced-motion:reduce){.mb .fundbar .fbgo,.mb .fundbar .fbgo::after{animation:none}}
@media(max-width:640px){.mb .fundbar{padding:30px 18px}.mb .fundbar h3{font-size:26px}.mb .fundbar p{font-size:14.5px}.mb .fundbar .fbgo{max-width:none;padding:18px 24px;font-size:17.5px}}
`;

export default function Members() {
  const [, navigate] = useLocation();
  const isDemo = (() => { try { return new URLSearchParams(window.location.search).get("demo") === "1"; } catch { return false; } })();
  const impersonateTok = (() => { try { return new URLSearchParams(window.location.search).get("impersonate"); } catch { return null; } })();
  if (impersonateTok) setImpersonateToken(impersonateTok); // use the member's token for this tab only
  const [me, setMe] = useState<MeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("dash");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false); // members' chat as a pop-up overlay
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    try { navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800); } catch {}
  };
  // Which path the member is focused on, and whether they dismissed the other step.
  const [focus, setFocus] = useState<PathKey | null>(() => { if (isDemo) return null; try { return (localStorage.getItem("rtb_focus") as PathKey) || null; } catch { return null; } });
  const [hideSecond, setHideSecond] = useState<boolean>(() => { if (isDemo) return false; try { return localStorage.getItem("rtb_hide2") === "1"; } catch { return false; } });
  // The "add money" prompt for members who haven't funded yet. Dismissing it only buys quiet for
  // FUND_NAG_MS — it comes back until they actually fund, at which point it never shows again.
  // Tune the interval here; it's the only thing controlling how often an unfunded member sees it.
  const FUND_NAG_MS = 60 * 1000;
  const [fundDismissed, setFundDismissed] = useState(false);
  // "Show me how it works" opens the howtofund PAGE rather than a second panel in this dialog or
  // Pulse's guide in a new tab — it is too much to read in a box, and they came here to be told
  // what to do, so losing them to another site at that moment is the worst outcome.
  const dismissFund = () => setFundDismissed(true);
  const profile = getProfile();

  const load = async () => { const d = await fetchMe(); if (!d) { navigate("/login"); return; } setMe(d); };
  useEffect(() => {
    if (isDemo) { setMe(DEMO_ME); setLoading(false); return; }
    if (!getToken()) { navigate("/login"); return; }
    load().finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);
  // Bring the prompt back FUND_NAG_MS after it's dismissed, for as long as they're still unfunded.
  // Skipped entirely for funded members and admins, so it only ever nags someone who has a reason
  // to see it. Not a repeating interval: the timer restarts each time they dismiss.
  useEffect(() => {
    if (!fundDismissed) return;
    if (me?.signalsUnlocked || me?.pammInvested || me?.isAdmin) return;
    const t = setTimeout(() => setFundDismissed(false), FUND_NAG_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [fundDismissed, me?.signalsUnlocked, me?.pammInvested, me?.isAdmin]);
  const refresh = async () => { if (isDemo) return; setRefreshing(true); await load(); setRefreshing(false); };
  const doLogout = () => { logout(); navigate("/login"); };
  // Until they fund, the only things they can open are the dashboard (which tells them to fund) and
  // the two places they'd need if they get stuck doing it. Locking Support or the Pulse link too
  // would trap someone mid-deposit with no way to ask for help or reach the deposit page.
  const ALWAYS_OPEN: TabKey[] = ["dash", "settings", "support", "howtofund"];
  const tabLocked = (t: TabKey) =>
    !ALWAYS_OPEN.includes(t) && !!me && !me.signalsUnlocked && !me.pammInvested && !me.isAdmin;
  // Every route into a tab goes through here, so a locked section can't be reached from the rail,
  // from a card inside the dashboard, or from a stale tab left over before they were locked.
  const pick = (t: TabKey) => {
    setMenuOpen(false);
    if (tabLocked(t)) { setFundDismissed(false); setTab("dash"); return; }
    if (t === "chat") { setChatOpen(true); return; }
    setTab(t);
  };

  const chooseFocus = (p: PathKey) => { setFocus(p); if (!isDemo) { try { localStorage.setItem("rtb_focus", p); } catch {} } };
  const optOut = () => { setHideSecond(true); if (!isDemo) { try { localStorage.setItem("rtb_hide2", "1"); } catch {} } };
  const reEnable = () => { setHideSecond(false); if (!isDemo) { try { localStorage.removeItem("rtb_hide2"); } catch {} } };
  const resetFocus = () => { setFocus(null); setHideSecond(false); try { localStorage.removeItem("rtb_focus"); localStorage.removeItem("rtb_hide2"); } catch {} };

  if (loading) return <div className="mb"><style>{CSS}</style><ConstellationBackground /><div className="center">Loading your panel…</div></div>;

  const name = me?.firstName || profile.firstName || "trader";
  const PATH_LABEL: Record<PathKey, string> = { pamm: "Passive income", signals: "VIP signals" };

  // A path's fund/unlock panel.
  const PathPanel = ({ path, showOptOut = false }: { path: PathKey; showOptOut?: boolean }) => {
    const isPamm = path === "pamm";
    const bal = isPamm ? (me?.pammBalance ?? 0) : (me?.liveBalance ?? 0);
    const min = isPamm ? (me?.pammMin ?? 250) : (me?.signalsMin ?? 250);
    const done = isPamm ? !!me?.pammInvested : !!me?.signalsUnlocked;
    const pct = Math.min(100, Math.round((bal / min) * 100));
    return (
      <div className={`gate ${isPamm ? "gold" : ""} ${done ? "on" : ""}`}>
        {done ? (
          <>
            <div className="glbl">✓ Done</div>
            <h3>{isPamm ? "You're invested — earning passively 📈" : "VIP Signals unlocked 🎯"}</h3>
            <p>{isPamm
              ? "Your GoldRock allocation is compounding — the desk trades, you earn. Check in anytime to watch it grow."
              : (me?.liveFunded
                  ? "You're funded — jump into the desk's daily plays on Telegram and take today's setups with the inner circle."
                  : "You're in — your GoldRock allocation unlocked the signals. Jump into the desk's daily plays on Telegram.")}</p>
            {!isPamm && !me?.liveFunded && (
              <p className="note" style={{ marginTop: 8 }}>💡 Not trading a live account yet? Spin up a <b style={{ color: "#141414" }}>free demo account</b> and practice today's signals risk-free — then fund live when you're ready to trade them for real.</p>
            )}
            <div className="row">
              {isPamm
                ? <a className="btn" href={enterUrl("/pamm")} target="_blank" rel="noopener noreferrer">View my investment →</a>
                : (me?.signalsUrl
                    ? <TgLink url={me.signalsUrl} label="Join the VIP Signals →" />
                    : <span className="note">Telegram signals link is being set up — check back shortly.</span>)}
              {!isPamm && !me?.liveFunded && <a className="btn ghost" href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer">Create a demo account →</a>}
            </div>
          </>
        ) : (
          <>
            <div className="glbl">{isPamm ? "Passive income" : "VIP signals"}</div>
            <h3>{isPamm ? `Put ${usd(min)} to work in GoldRock` : `Fund ${usd(min)} to unlock the signals`}</h3>
            <p>{isPamm
              ? `Invest ${usd(min)}+ into the GoldRock managed fund and earn passively — the desk trades, you compound. No experience needed.`
              : `Fund a Pulse trading account with ${usd(min)}+ and the live VIP signals unlock automatically — no manual approval. Come back and refresh after you fund.`}</p>
            <div className="bar"><i style={{ width: pct + "%" }} /></div>
            <div className="barlab"><span>{usd(bal)} of {usd(min)}</span><span>{pct}%</span></div>
            <div className="row">
              {isPamm
                // Sending someone to the invest screen with an empty wallet is a dead end — they
                // can't allocate money they haven't deposited. Deposit first, invest second.
                ? ((me?.walletBalance ?? 0) < min
                    ? <a className="btn" href={fundUrl} target="_blank" rel="noopener noreferrer">Add money first →</a>
                    : <a className="btn" href={enterUrl("/copy/goldrock")} target="_blank" rel="noopener noreferrer">Invest in GoldRock →</a>)
                : <a className="btn" href={fundUrl} target="_blank" rel="noopener noreferrer">Add money to my account →</a>}
              <button className="btn ghost" onClick={refresh} disabled={refreshing}>{refreshing ? "Checking…" : "I've done it — refresh"}</button>
              {showOptOut && <button className="btn link" onClick={optOut}>Not right now</button>}
            </div>
          </>
        )}
      </div>
    );
  };

  const other: PathKey | null = focus ? (focus === "pamm" ? "signals" : "pamm") : null;

  // Onboarding (pick a path / fund) — merged into the Dashboard. Shown until the member completes a step.
  const needsSetup = !me?.signalsUnlocked && !me?.pammInvested && !me?.isAdmin;
  // Straight to the deposit form on Pulse, already signed in — not the accounts list they'd then
  // have to navigate out of. One tap from here to typing an amount.
  const fundUrl = depositUrl();
  const fundMin = usd(me?.pammMin ?? 250);
  const showFund = needsSetup && !fundDismissed;
  const fundBanner = needsSetup ? (
    <div className="fundbar">
      <div className="fbin">
        <div className="fblogo">
          <img src="/logo.svg" alt="Copy the Rich Trades" />
          <span>✕</span>
          <img src="/logo-icon.svg" alt="Pulse Markets" />
        </div>
        <div className="fbtx">
          <div className="fbk">⚡ Our recommended broker</div>
          <h3>Fund your Pulse account</h3>
          <p>Pulse Markets is the broker we run on — fast withdrawals and instant tap-to-trade. Put in {fundMin}+ to trade the signals yourself, or compound it passively in GoldRock.</p>
        </div>
        <a className="fbgo" href={fundUrl} target="_blank" rel="noopener noreferrer">Deposit on Pulse →</a>
      </div>
    </div>
  ) : null;
  const setupNode = !focus ? (
    <>
      <div className="kick">Get started · choose where to begin</div>
      <div className="unlocknote">🔓 Complete <b>at least one</b> of these to unlock the <b>signals</b> and the <b>inner community</b> — daily calls, wins and guidance.</div>
      <div className="pick2">
        <button className="pcard gold" onClick={() => chooseFocus("pamm")}>
          <span className="pic flame"><img src="/goldrock-flame-badge.png" alt="GoldRock" /></span>
          <div className="ptag">Passive income</div>
          <h3>GoldRock PAMM</h3>
          <p>Put {usd(me?.pammMin ?? 250)}+ into the managed fund and earn passively — hands-off. No trading, no experience needed.</p>
          <span className="go">Choose this →</span>
        </button>
        <button className="pcard gpsig" onClick={() => chooseFocus("signals")}>
          <span className="pic gp"><GoldPulse /></span>
          <div className="ptag">Gold Pulse signals</div>
          <h3>Gold Pulse Signals</h3>
          <p>Fund {usd(me?.signalsMin ?? 250)}+ in a trading account and unlock the desk's live signals — tap to trade, sized for you.</p>
          <span className="go">Choose this →</span>
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="kick">Step 1 · {PATH_LABEL[focus]}</div>
      <PathPanel path={focus} />
      {other && (hideSecond ? (
        <div className="reenable">You're focused on <b style={{ color: "#141414" }}>{PATH_LABEL[focus]}</b>. Want to add <b style={{ color: "#141414" }}>{PATH_LABEL[other]}</b> too? <button onClick={() => setTab("settings")}>Re-enable in Settings →</button></div>
      ) : (
        <>
          <div className="kick">Step 2 · {PATH_LABEL[other]} <span className="opt">· optional</span></div>
          <PathPanel path={other} showOptOut />
        </>
      ))}
    </>
  );

  return (
    <div className="mb">
      <style>{CSS}</style>
      <ConstellationBackground />

      {showFund && (
        <div className="fundwrap" role="dialog" aria-modal="true" aria-labelledby="fundttl">
          <div className="fundbox">
            <div className="fduo">
              <span className="fl"><img src="/logo.svg" alt="Copy the Rich Trades" /></span>
              <span className="fx">✕</span>
              <span className="fl"><img src="/logo-icon.svg" alt="Pulse Markets" /></span>
            </div>
            <div className="fbadge">⚡ Our recommended broker</div>
            {(
              <>
                <h2 id="fundttl">One step left, {name}</h2>
                <p className="sub">Copy the Rich Trades runs on <b style={{ color: "#093e61" }}>Pulse Markets</b> — fast withdrawals, tight spreads and instant tap-to-trade. Add <b style={{ color: "#141414" }}>{fundMin}</b> or more to your Pulse account and everything unlocks automatically.</p>
                <div className="fways">
                  <div className="fway"><b>📈 Trade it yourself</b><span>Tap-to-trade the desk's Gold Pulse calls, sized for your account.</span></div>
                  <div className="fway"><b>🏦 Or compound it</b><span>Put it in GoldRock and earn passively — the desk trades, you compound.</span></div>
                </div>
                <div className="fundsteps">
                  <div className="fundstep"><span className="sn">1</span><span>Tap <b style={{ color: "#141414" }}>Deposit on Pulse</b> below — it opens your Pulse account, already signed in.</span></div>
                  <div className="fundstep"><span className="sn">2</span><span>Pick your coin, send to the address it shows you.</span></div>
                  <div className="fundstep"><span className="sn">3</span><span>Come back here and tap <b style={{ color: "#141414" }}>“I've done it”</b>. That's it.</span></div>
                </div>
                <a className="fundbtn" href={fundUrl} target="_blank" rel="noopener noreferrer" onClick={dismissFund}>Deposit on Pulse →</a>
                {/* Closes the modal and opens the real page rather than stacking a second panel
                    inside a dialog — it's far too much to read in a box, especially on a phone. */}
                <button className="fundalt" onClick={() => { dismissFund(); setTab("howtofund"); }}>Show me how it works first</button>
                <button className="fundlater" onClick={dismissFund}>I'll do this later</button>
                <div className="fundnote">Takes about 2 minutes, and withdrawals are fast when you want it back. The money sits in your own Pulse account; nobody at Copy the Rich Trades can move it.</div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="top"><div className="topin">
        <div className="brand">
          <button className="burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{menuOpen ? <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}</svg>
          </button>
          <img src="/logo.svg" alt="Copy the Rich Trades" /><span>Copy the Rich Trades</span>
        </div>
        <div className="topr">
          {impersonateTok && me?.email && <span className="uemail" title={me.email}>as {me.email}</span>}
          {!isDemo && !impersonateTok && me?.email && <span className="uemail" title={me.email}>{me.email}</span>}
          {!isDemo && !impersonateTok && me?.isAdmin && <a className="lo" href="/members?demo=1" title="Preview the new-member experience">👁 Demo</a>}
          {impersonateTok
            ? <button className="lo" onClick={() => { setImpersonateToken(null); navigate("/admin"); }}>← Return to admin</button>
            : isDemo ? <a className="lo" href="/members">Exit demo</a>
              : <button className="lo" onClick={doLogout}>Log out</button>}
        </div>
      </div></div>

      {impersonateTok && me && (
        <div className="demobar">👁 <b>Viewing as {me.email}</b> — this is their live members panel. You're in as an admin.</div>
      )}
      {isDemo && (
        <div className="demobar">👁 <b>Demo view</b> — this is exactly what a member sees right after signing up for free. Nothing here is saved.</div>
      )}

      <div className="shell">
        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
        <nav className={`rail ${menuOpen ? "open" : ""}`}>
          <div className="railtop">
            <div className="raillogo"><img src="/logo.svg" alt="Copy the Rich Trades" /><span>Copy the Rich Trades</span></div>
            <button className="railx" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          {NAV.map((g) => (
            <div key={g.group} data-g={g.group.toLowerCase()}>
              <div className="rlabel">{g.group}</div>
              {g.items.map((t) => {
                if (t.ext) return (
                  <a key={t.key} className="tab pulse" href={enterUrl(t.ext)} target="_blank" rel="noopener noreferrer">
                    <TabIcon name="dashboard" /><span className="tl">{t.label}</span>
                    <span className="extic" aria-hidden="true">↗</span>
                  </a>
                );
                const lk = tabLocked(t.key as TabKey);
                return (
                  <button
                    key={t.key}
                    className={`tab ${tab === t.key ? "on" : ""} ${lk ? "lk" : ""}`}
                    onClick={() => pick(t.key)}
                    title={lk ? `Unlocks when you add ${fundMin} to your Pulse account` : undefined}
                  >
                    <TabIcon name={t.key} /><span className="tl">{t.label}</span>
                    {lk && <span className="lkic" aria-label="Locked">🔒</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="railfoot">
            <button className={`tab ${tab === "settings" ? "on" : ""}`} onClick={() => pick("settings")}>
              <TabIcon name="settings" /><span className="tl">Settings</span>
            </button>
            <button className={`tab ${tab === "support" ? "on" : ""}`} onClick={() => pick("support")}>
              <TabIcon name="support" /><span className="tl">Support</span>
            </button>
            {/* Pulse dashboard now sits directly under Home at the top of Core, not buried down here. */}
            {me?.isAdmin && (
              <button className="tab admin" onClick={() => { setMenuOpen(false); navigate("/admin"); }}>
                <TabIcon name="admin" /><span className="tl">Admin panel</span>
              </button>
            )}
          </div>
        </nav>

        <div className="content">
          {tab === "dash" && <Dash me={me} name={name} setup={needsSetup ? setupNode : null} fundCta={fundBanner} onTapTrade={() => pick("taptotrade")} />}

          {tab === "taptotrade" && <TapTradePage me={me} />}
          {/* A real page, not a dialog — this is too much to read in a box, and a member who wants
              to understand funding before committing money should be able to sit with it. */}
          {tab === "howtofund" && (
            <div className="fundpage">
              <div className="fduo">
                <span className="fl"><img src="/logo.svg" alt="Copy the Rich Trades" /></span>
                <span className="fx">✕</span>
                <span className="fl"><img src="/logo-icon.svg" alt="Pulse Markets" /></span>
              </div>
              <div className="fbadge">⚡ Our recommended broker</div>
              <h2>What being funded gets you</h2>
              <p className="sub">A funded Pulse account is the key to the whole desk — the calls, the compounding, and everything we add next.</p>
              <div className="fbens">
                <div className="fben"><span className="fbi">🎯</span><div><b>Gold Pulse Signals</b><span>Every call the desk takes — entry, take-profits and stop, in real time as it drops.</span></div></div>
                <div className="fben"><span className="fbi">⚡</span><div><b>Tap to Trade</b><span>Take a call on your own account in one tap, sized for your balance. No copying numbers by hand, no missing the entry window.</span></div></div>
                <div className="fben"><span className="fbi">🏦</span><div><b>Compound it in GoldRock</b><span>Don't want to trade? Allocate instead — the desk trades the fund, your allocation compounds hands-free.</span></div></div>
                <div className="fben"><span className="fbi">💬</span><div><b>The inner circle</b><span>Private community, live sessions with the desk, replays and the Academy.</span></div></div>
                <div className="fben"><span className="fbi">💸</span><div><b>Fast withdrawals</b><span>It stays your money in your own account — take it out whenever you want.</span></div></div>
                <div className="fben"><span className="fbi">🚀</span><div><b>And more coming</b><span>The desk keeps shipping — funded members get everything we add, first.</span></div></div>
              </div>
              <div className="fsec">Now — how to fund it</div>
              <p className="sub" style={{ marginBottom: 14 }}>Pulse funds by crypto. If you've never done it, this is the whole thing — it's easier than it sounds.</p>
              <div className="fundsteps">
                <div className="fundstep"><span className="sn">1</span><span><b style={{ color: "#141414" }}>Pick a coin.</b> Bitcoin, Ethereum, USDT, USDC, SOL, TRX or XRP. Most people use <b style={{ color: "#141414" }}>USDT</b> — it's a dollar, so {fundMin} of USDT is {fundMin}.</span></div>
                <div className="fundstep"><span className="sn">2</span><span><b style={{ color: "#141414" }}>Pulse shows you an address.</b> It's yours alone. Copy it.</span></div>
                <div className="fundstep"><span className="sn">3</span><span><b style={{ color: "#141414" }}>Send that amount</b> to the address from wherever you hold crypto — Coinbase, Binance, Kraken, or your own wallet. Match the network Pulse shows you.</span></div>
                <div className="fundstep"><span className="sn">4</span><span><b style={{ color: "#141414" }}>It lands by itself.</b> Once the network confirms, your Pulse balance updates — no approval, no waiting on anyone.</span></div>
                <div className="fundstep"><span className="sn">5</span><span><b style={{ color: "#141414" }}>Then choose:</b> trade the signals yourself, or put it in GoldRock and let the desk compound it.</span></div>
              </div>
              <div className="fhnote"><b>No crypto yet?</b> Buy USDT on Coinbase, Binance or any major exchange with your card or bank, then send it over using the steps above. That's the only extra step.</div>
              <div className="fhnote"><b>Getting it back out.</b> Withdraw from the same screen to your own wallet — Pulse is our recommended broker precisely because withdrawals are quick.</div>
              <a className="fundbtn" href={fundUrl} target="_blank" rel="noopener noreferrer">Deposit on Pulse →</a>
              <button className="fundalt" onClick={() => setTab("dash")}>← Back to home</button>
            </div>
          )}

          {tab === "chat" && (
            <>
              <div className="h2">Chat</div>
              <p className="lead">The live members' room — everyone funded, talking trades, setups and wins in real time with Anthony Beale and the desk.</p>
              <div style={{ height: 16 }} />
              <Chat me={me} />
            </>
          )}

          {tab === "signals" && (
            <>
              <div className="h2">Gold Pulse Signals</div>
              <p className="lead">Live entries, exits and risk called by the desk. Fund {usd(me?.signalsMin ?? 250)}+ on Pulse and your Telegram access unlocks automatically.</p>
              <div style={{ height: 18 }} />
              {(me?.signalsUnlocked || me?.isAdmin) ? (
                <>
                  {me?.signalsUrl && <TgLink url={me.signalsUrl} style={{ marginBottom: 18 }} />}
                  <TelegramDeskFeed signalsUrl={me?.signalsUrl} />
                  <TapToTrade onOpen={() => setTab("taptotrade")} />
                </>
              ) : (
                <>
                  <PathPanel path="signals" />
                  <div style={{ height: 6 }} />
                  <TapToTrade onOpen={() => setTab("taptotrade")} />
                </>
              )}
            </>
          )}

          {tab === "tlguide" && (
            <>
              <div className="h2">TradeLocker Guide</div>
              <p className="lead">Your account lives in <b style={{ color: "#141414" }}>TradeLocker</b> — the platform the Gold Pulse calls fire onto. Here's everything: opening it, placing a trade, setting your stop &amp; targets, and managing it like the desk.</p>
              <div style={{ height: 18 }} />
              <TradeLockerGuide me={me} />
            </>
          )}

          {tab === "sessions" && (
            <>
              <div className="h2">Live Sessions</div>
              <p className="lead">Live trading sessions and chart breakdowns with Anthony Beale and the desk. Join by tap when a session goes live.</p>
              <div style={{ height: 18 }} />
              <SessionsFeed isHost={!!me?.isAdmin} />
            </>
          )}

          {tab === "replays" && (
            <>
              <div className="h2">Replays</div>
              <p className="lead">Missed a live session? Recordings land here so you can catch up any time.</p>
              <div style={{ height: 18 }} />
              <div className="gate"><div className="glbl">Coming soon</div><h3>Session replays 🎬</h3><p>Once a live session wraps, its recording will show up here for the whole circle to re-watch.</p></div>
            </>
          )}

          {tab === "downloads" && (
            <>
              <div className="h2">Downloads</div>
              <p className="lead">Everything you need to get set up and trade with the desk.</p>
              <div style={{ height: 18 }} />
              <div className="grid">
                <div className="card"><div className="ic">📱</div><h3>Get the Pulse app</h3><p>Trade, fund and manage your account from your phone — tap-to-trade the signals on the go.</p><a className="btn" href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer">Open Pulse →</a></div>
                <div className="card"><div className="ic">📄</div><h3>The playbook (PDF)</h3><p>The Copy the Rich Trades getting-started guide — how to fund, allocate and take the signals.</p><a className="btn ghost" href="/signup" target="_blank" rel="noopener noreferrer">View the pitch →</a></div>
              </div>
            </>
          )}

          {tab === "news" && (
            <>
              <div className="h2">News &amp; Results</div>
              <p className="lead">The desk's daily results recaps, plus market news and the calendar it trades around.</p>
              <div style={{ height: 18 }} />
              <NewsFeed isHost={!!me?.isAdmin} />
              <div style={{ height: 10 }} />
              <div className="grid">
                <div className="card"><div className="ic">🗞️</div><h3>Market news</h3><p>Live financial headlines — jump into the Pulse platform for the full feed and calendar.</p><a className="btn" href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer">Open on Pulse →</a></div>
              </div>
            </>
          )}

          {tab === "wins" && (
            <>
              <div className="h2">Wins</div>
              <p className="lead">The circle's biggest wins — signals that hit, funded payouts, and members stacking. Share yours in the community.</p>
              <div style={{ height: 18 }} />
              <div className="gate on"><div className="glbl">🏆 Winning circle</div><h3>Post your wins in the community</h3><p>Screenshots of your GoldRock gains, signal hits and payouts belong in the community feed — drop them in and get hyped with the circle.</p><div className="row"><button className="btn" onClick={() => setTab("community")}>Open the community →</button></div></div>
            </>
          )}

          {tab === "following" && (
            <>
              <div className="h2">Following</div>
              <p className="lead">Stay close to the desk. Right now that's <b style={{ color: "#141414" }}>Anthony Beale</b> and the Gold Pulse desk — message the host or jump into the community any time.</p>
              <div style={{ height: 18 }} />
              <div className="srow"><div><div className="st">Anthony Beale</div><div className="ss">Host of the inner circle · Gold Pulse desk</div></div><button className="sbtn" onClick={() => setTab("community")}>Open community →</button></div>
            </>
          )}

          {tab === "support" && (
            <>
              <div className="h2">Support</div>
              <p className="lead">Stuck on something? We've got you. Reach the team the fastest way for what you need.</p>
              <div style={{ height: 18 }} />
              <div className="grid">
                <div className="card"><div className="ic">💬</div><h3>Message Anthony Beale</h3><p>Questions about signals, funding or the circle — DM the host straight from the community.</p><button className="btn" onClick={() => setTab("community")}>Message the desk →</button></div>
                <div className="card"><div className="ic">🛟</div><h3>Pulse support</h3><p>Deposits, withdrawals, KYC and account help — the Pulse support desk handles it.</p><a className="btn ghost" href={enterUrl("/support")} target="_blank" rel="noopener noreferrer">Open Pulse support →</a></div>
              </div>
            </>
          )}

          {tab === "university" && (
            <>
              <div className="h2">Academy</div>
              <p className="lead">The Copy the Rich Trades playbook — how it works, the mindset, and the exact plays. Read the deck, then work the trainings.</p>
              <div style={{ height: 18 }} />
              <Academy enter={enterUrl} setTab={setTab} />
            </>
          )}

          {tab === "community" && (
            <>
              <div className="h2">The Inner Community</div>
              {me?.communityUnlocked ? (
                <>
                  <p className="lead">Daily wins, calls and guidance — straight from Anthony Beale and the inner circle. Post, react and jump into the conversation. 🔥</p>
                  <div style={{ height: 16 }} />
                  <Community onOpenChat={() => setChatOpen(true)} />
                </>
              ) : (
                <>
                  <p className="lead">Daily calls, wins, and guidance from the desk. Complete <b style={{ color: "#141414" }}>at least one step</b> — fund the GoldRock PAMM or fund {usd(me?.signalsMin ?? 250)} for the signals — and you're in.</p>
                  <div style={{ height: 18 }} />
                  <div className="gate">
                    <div className="glbl">🔒 Locked</div>
                    <h3>Complete a step to join</h3>
                    <p>The inner community opens the moment you complete either step — invest {usd(me?.pammMin ?? 250)}+ in GoldRock, or fund {usd(me?.signalsMin ?? 250)}+ for the signals. Do one, and you're in.</p>
                    <div className="row"><button className="btn" onClick={() => setTab("home")}>Choose a step →</button></div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "affiliate" && (
            <>
              <div className="h2">Refer &amp; Earn</div>
              <p className="lead">Share Copy the Rich Trades with your own links. Anyone who signs up through them is credited to you — and you earn on their trading and GoldRock investments.</p>
              <div style={{ height: 18 }} />
              {me?.homeLink || me?.landingLink ? (
                <div className="grid">
                  <div className="card">
                    <div className="ic">🏠</div>
                    <h3>Your home page link</h3>
                    <p>Sends people to the main Copy the Rich Trades site. Best for socials, bios, and DMs.</p>
                    <div className="lnkbox">
                      <span className="lnk">{me?.homeLink}</span>
                      <button className="cpy" onClick={() => copy("home", me!.homeLink!)}>{copiedKey === "home" ? "Copied ✓" : "Copy"}</button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="ic">🚀</div>
                    <h3>Your landing page link</h3>
                    <p>Goes straight to the passive-income landing page — track record, calculator, and sign-up. Best for ads &amp; direct promos.</p>
                    <div className="lnkbox">
                      <span className="lnk">{me?.landingLink}</span>
                      <button className="cpy" onClick={() => copy("landing", me!.landingLink!)}>{copiedKey === "landing" ? "Copied ✓" : "Copy"}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="note" style={{ padding: 16 }}>Your referral links are being set up — refresh in a moment.</div>
              )}
              <div style={{ height: 14 }} />
              <div className="srow">
                <div><div className="st">Your referral code</div><div className="ss">{me?.refCode || "—"}</div></div>
                <a className="sbtn ghost" href={enterUrl("/affiliates/trading")} target="_blank" rel="noopener noreferrer">See earnings →</a>
              </div>
            </>
          )}

          {tab === "settings" && (
            <>
              <div className="h2">Settings</div>
              <p className="lead">Manage your focus and steps. Nothing is locked in — switch it up whenever.</p>

              <div className="srow">
                <div><div className="st">Your focus</div><div className="ss">{focus ? PATH_LABEL[focus] : "Not chosen yet — pick on the Home tab."}</div></div>
                {focus && <button className="sbtn ghost" onClick={() => { resetFocus(); setTab("home"); }}>Re-choose</button>}
              </div>

              {other && (
                <div className="srow">
                  <div><div className="st">{PATH_LABEL[other]} step</div><div className="ss">{hideSecond ? "Hidden from your Home panel." : "Showing as Step 2 on Home."}</div></div>
                  {hideSecond
                    ? <button className="sbtn" onClick={() => { reEnable(); setTab("home"); }}>Re-enable</button>
                    : <button className="sbtn ghost" onClick={optOut}>Hide it</button>}
                </div>
              )}

              <div className="srow">
                <div><div className="st">Pulse dashboard</div><div className="ss">Your balance, accounts, deposits & withdrawals — already logged in.</div></div>
                <a className="sbtn ghost" href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer">Open →</a>
              </div>
            </>
          )}
        </div>
      </div>

      {chatOpen && (
        <div onClick={() => setChatOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(253,253,254,.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, position: "relative" }}>
            <button onClick={() => setChatOpen(false)} aria-label="Close chat" style={{ position: "absolute", top: -13, right: -6, zIndex: 3, width: 36, height: 36, borderRadius: 999, border: "1px solid rgba(20,20,20,.18)", background: "#fafbfb", color: "#141414", cursor: "pointer", fontSize: 16, fontWeight: 800, boxShadow: "0 10px 30px rgba(0,0,0,0.112)" }}>✕</button>
            <Chat me={me} />
          </div>
        </div>
      )}
    </div>
  );
}
