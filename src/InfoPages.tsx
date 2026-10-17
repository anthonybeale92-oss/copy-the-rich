// Dedicated pages behind the home top-nav: Learn, GoldRock PAMM, Tap to Trade, Calculator.
// They share the same shell (starfield + nav + footer + CSS) as the home page.
import { useMemo, useState, type ReactNode } from "react";
import { Calculator, TrendingUp, Sparkles, Repeat, Info } from "lucide-react";
import { RB_CSS, Stars, SiteNav, SiteFooter, LOGIN_URL, SIGNUP_PATH } from "./Home";

const DISCORD_INVITE_URL = "https://discord.gg/kU7Z6ReJM";

// A little extra CSS for these pages (numbered steps, page hero spacing).
const INFO_CSS = `
.rb .phero{text-align:center;padding:52px 0 8px}
.rb .phero .sec-k{margin-bottom:10px}
.rb .phero h1{font-size:34px;line-height:1.05}
@media(min-width:860px){.rb .phero h1{font-size:52px}}
.rb .phero .lede{margin-top:18px}
.rb .steps{display:grid;grid-template-columns:1fr;gap:16px;margin-top:34px}
@media(min-width:760px){.rb .steps{grid-template-columns:1fr 1fr}}
.rb .step{position:relative;border:1px solid rgba(255,255,255,.08);background:#0a0b10;border-radius:18px;padding:22px 22px 22px 66px}
.rb .step .num{position:absolute;left:20px;top:22px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:900;color:#0b0d12;background:linear-gradient(135deg,#5ec8ff,#1f6fa8)}
.rb .step h4{font-size:16px;font-weight:800}
.rb .step p{color:rgba(255,255,255,.6);font-size:13.5px;line-height:1.6;margin-top:7px}
.rb .rules{list-style:none;padding:0;margin:26px auto 0;max-width:640px;text-align:left}
.rb .rules li{position:relative;padding:12px 12px 12px 44px;border:1px solid rgba(255,255,255,.08);background:#0a0b10;border-radius:14px;margin-bottom:10px;font-size:14.5px;color:rgba(255,255,255,.82);line-height:1.55}
.rb .rules li b{color:#fff}
/* Decorative tick, so gold — see the note on the same rule in Home. */
.rb .rules li::before{content:"✓";position:absolute;left:16px;top:12px;color:#5ec8ff;font-weight:900;font-size:16px}
.rb .ranks{display:grid;grid-template-columns:1fr;gap:12px;margin-top:26px}
@media(min-width:640px){.rb .ranks{grid-template-columns:1fr 1fr 1fr}}
.rb .rank{border:1px solid rgba(255,255,255,.1);background:#0a0b10;border-radius:16px;padding:20px;text-align:center}
.rb .rank .rn{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.rb .rank .rv{font-size:26px;font-weight:900;margin-top:6px;font-variant-numeric:tabular-nums}
.rb .rank .rd{font-size:12.5px;color:rgba(255,255,255,.5);margin-top:6px;line-height:1.5}
.rb .rank.s{border-color:rgba(168,164,154,.4)}.rb .rank.s .rn,.rb .rank.s .rv{color:#ded9cf}
.rb .rank.g{border-color:rgba(63,159,224,.4)}.rb .rank.g .rn,.rb .rank.g .rv{color:#7fd4ff}
.rb .rank.v{border-color:rgba(42,128,189,.45)}.rb .rank.v .rn,.rb .rank.v .rv{color:#8cc0e3}
.rb .lead-in{max-width:680px;margin:16px auto 0;text-align:center;color:rgba(255,255,255,.62);font-size:15.5px;line-height:1.7}
`;

function Page({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="rb">
      <style>{RB_CSS}{INFO_CSS}</style>
      <Stars />
      <main>
        <SiteNav active={active} />
        <div className="wrap">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}

/* ------------------------------- LEARN ------------------------------- */
const curriculum = [
  { ic: "📊", t: "Charts from scratch", d: "Candles, trend, support & resistance — read any chart with confidence, starting from absolute zero." },
  { ic: "🛡️", t: "Risk management", d: "Position sizing, stop placement, and how the pros protect capital. This is what actually keeps you in the game." },
  { ic: "🥇", t: "Trading gold (XAUUSD)", d: "The desk's bread and butter. Learn the exact strategy we run on gold every single day." },
  { ic: "⚡", t: "Taking live signals", d: "How to read a call — entry, stop, target — and fire it with one tap, sized for your account." },
  { ic: "🗓️", t: "Daily live breakdowns", d: "Sit in as the desk explains every play in real time. Why the entry, where the risk, when to bank." },
  { ic: "🎯", t: "Funded-account rules", d: "How 10× funding works, keeping 100% of profits, and trading with size the right way." },
];
export function LearnPage() {
  return (
    <Page active="/learn">
      <section className="phero">
        <span className="free">100% Free</span>
        <h1>Learn to Trade — <span className="g">Completely Free</span></h1>
        <p className="lede">Come in with zero experience. The Copy the Rich Trades academy takes you from your very first candle to trading a funded account — at your own pace, alongside a real community. No fees, no catch.</p>
        <div className="cta-row"><a className="btn lg" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">Join the Free Community →</a><a className="ghost lg" href={SIGNUP_PATH}>Open a Broker Account ↗</a></div>
        <p className="lead-in">Join Copy the Rich Trades on Discord. Broker registration is a separate step through our affiliate link.</p>
      </section>

      <section>
        <div className="sec-k">The curriculum</div>
        <h2>What you'll learn</h2>
        <p className="sub">A clear path from beginner to funded trader — every lesson is free, forever.</p>
        <div className="edu-grid">
          {curriculum.map((e, i) => (<div key={i} className="ecard"><div className="ic">{e.ic}</div><h4>{e.t}</h4><p>{e.d}</p></div>))}
        </div>
      </section>

      <section>
        <div className="sec-k">How it works</div>
        <h2>Learn by doing — with real people</h2>
        <div className="steps">
          <div className="step"><div className="num">1</div><h4>Join our free Discord community</h4><p>Meet the Copy the Rich Trades community on Discord and introduce yourself. Start here, at your own pace.</p></div>
          <div className="step"><div className="num">2</div><h4>Sit in on daily breakdowns</h4><p>The desk trades live and explains every decision. You learn the <i>why</i>, not just the setup.</p></div>
          <div className="step"><div className="num">3</div><h4>Ask anything in the group</h4><p>Stuck? Real members and the desk answer every day. Nobody gets left behind.</p></div>
          <div className="step"><div className="num">4</div><h4>Take your first live signal</h4><p>When you're ready, tap a call and fire it on your account — sized for you, stop attached.</p></div>
        </div>
        <div className="cta-row" style={{ marginTop: 30 }}><a className="btn lg" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">Join the Free Community →</a></div>
      </section>
    </Page>
  );
}

/* ---------------------------- GOLDROCK PAMM ---------------------------- */
export function GoldrockPage() {
  return (
    <Page active="/goldrock">
      <section className="phero">
        <span className="free" style={{ background: "linear-gradient(90deg,#5ec8ff,#1f6fa8)" }}>Fully passive</span>
        <h1>The <span className="g">GoldRock</span> PAMM</h1>
        <p className="lede">Not ready to trade yourself? Back the managed fund. The desk trades gold, you compound — completely hands-off while you learn. Targeting <b>15%+ a month</b>, withdraw your profits anytime.</p>
        <div className="cta-row"><a className="btn lg" href={SIGNUP_PATH}>Join the PAMM →</a><a className="ghost lg" href="/calculator">Run the numbers</a></div>
        <div className="stat-row">
          <div className="stat"><div className="v">15%+</div><div className="l">Monthly target</div></div>
          <div className="stat"><div className="v">Hands-off</div><div className="l">Fully managed</div></div>
          <div className="stat"><div className="v">100%</div><div className="l">Profits kept</div></div>
          <div className="stat"><div className="v">Anytime</div><div className="l">Withdrawals</div></div>
        </div>
      </section>

      <section>
        <div className="sec-k">What is a PAMM?</div>
        <h2>Your capital, traded by the pros</h2>
        <p className="lead-in">A PAMM (Percentage Allocation Management Module) pools your capital with other investors into one fund the desk trades. Your balance moves with the fund's performance — proportionally to what you put in. You never place a trade; you just watch it compound.</p>
        <div className="steps">
          <div className="step"><div className="num">1</div><h4>Allocate into the fund</h4><p>Fund your account and allocate to GoldRock. Start small — there's no lock-in and no experience needed.</p></div>
          <div className="step"><div className="num">2</div><h4>The desk trades gold</h4><p>Our team runs the strategy on XAUUSD daily. Your allocation earns its share of every winning day.</p></div>
          <div className="step"><div className="num">3</div><h4>You compound</h4><p>Profits roll back in and grow on themselves month after month — the real engine of long-term returns.</p></div>
          <div className="step"><div className="num">4</div><h4>Withdraw anytime</h4><p>Your money is yours. Pull profits (or your allocation) whenever you want — no hoops.</p></div>
        </div>
      </section>

      <section>
        <div className="sec-k">Leader ranks</div>
        <h2>Grow your allocation, unlock more</h2>
        <p className="sub">Hold these minimums in your GoldRock allocation to earn each leader rank.</p>
        <div className="ranks">
          <div className="rank s"><div className="rn">Silver</div><div className="rv">$500</div><div className="rd">Get started as a GoldRock leader.</div></div>
          <div className="rank g"><div className="rn">Gold</div><div className="rv">$2,500</div><div className="rd">Step up your standing and rewards.</div></div>
          <div className="rank v"><div className="rn">VIP Gold</div><div className="rv">$7,500</div><div className="rd">Top-tier status in the fund.</div></div>
        </div>
        <div className="cta-row" style={{ marginTop: 32 }}><a className="btn lg" href={SIGNUP_PATH}>Join the PAMM →</a></div>
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.32)", marginTop: 16 }}>Investing carries risk. Targets are not guarantees and capital is at risk.</p>
      </section>
    </Page>
  );
}

/* ---------------------------- TAP TO TRADE ---------------------------- */
export function TapToTradePage() {
  return (
    <Page active="/tap-to-trade">
      <section className="phero">
        <span className="free" style={{ background: "linear-gradient(90deg,#5ec8ff,#2a80bd)" }}>One-tap trading</span>
        <h1>Tap to Trade</h1>
        <p className="lede">The desk's daily plays — <b>entry, stop and target</b> spelled out — fired onto your own account in a single tap, sized for you. Learn by doing, earn as you go. No charting required.</p>
        <div className="cta-row"><a className="btn lg" href={SIGNUP_PATH}>Get access →</a><a className="ghost lg" href={LOGIN_URL}>Log in</a></div>
      </section>

      <section>
        <div className="sec-k">How it works</div>
        <h2>See a call you like? Tap it.</h2>
        <div className="steps">
          <div className="step"><div className="num">1</div><h4>The desk posts a signal</h4><p>Symbol, direction, entry zone, stop and a take-profit ladder — a complete plan, not a vague tip.</p></div>
          <div className="step"><div className="num">2</div><h4>Pick your account</h4><p>Choose the live account to fire on. The desk even suggests a lot size scaled to the call.</p></div>
          <div className="step"><div className="num">3</div><h4>Tap to fire</h4><p>One tap places a market order with the signal's <b>stop attached automatically</b>. Preset calls even auto-place your stop &amp; target off your real fill.</p></div>
          <div className="step"><div className="num">4</div><h4>Manage it right there</h4><p>Move your stop, adjust targets, or close — all in-app. Every position shows live P/L.</p></div>
        </div>
      </section>

      <section>
        <div className="sec-k">The desk rules</div>
        <h2>Trade like the pros</h2>
        <p className="sub">Every tapped trade follows the same discipline that keeps accounts alive.</p>
        <ul className="rules">
          <li><b>Every trade ships with a stop.</b> No SL, no trade — it's the difference between a bad day and a blown account.</li>
          <li><b>Scale out at the targets.</b> Bank partial profit up the ladder and move your stop to breakeven.</li>
          <li><b>Size for survival.</b> Risk a small, fixed amount per trade. You can't win if you're not in the game tomorrow.</li>
          <li><b>Never hold against your stop.</b> If it hits, it hits — moving stops to dodge a loss is how small losses become big ones.</li>
        </ul>
        <div className="cta-row" style={{ marginTop: 30 }}><a className="btn lg" href={SIGNUP_PATH}>Start free →</a></div>
      </section>
    </Page>
  );
}

/* ----------------------------- CALCULATOR ----------------------------- */
export function CalculatorPage() {
  return (
    <Page active="/calculator">
      <div style={{ padding: "8px 0 8px" }}><CompoundCalc /></div>
    </Page>
  );
}

const cmoney = (n: number) => "$" + Math.round(n).toLocaleString();
const cmoney2 = (n: number) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ckfmt = (n: number) => { const a = Math.abs(n); if (a >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M"; if (a >= 1000) return "$" + Math.round(n / 1000) + "k"; return "$" + Math.round(n); };
const GOLDROCK_MONTHLY = 15; // GoldRock's stated monthly target

// A faithful port of the Pulse Markets compound calculator (Tailwind + lucide), with the
// recharts chart swapped for a hand-drawn SVG (RTB doesn't ship recharts).
function CompoundCalc() {
  const [initial, setInitial] = useState(5000);
  const [rate, setRate] = useState(GOLDROCK_MONTHLY);
  const [months, setMonths] = useState(12);
  const [contribution, setContribution] = useState(0);
  const [ratePeriod, setRatePeriod] = useState<"month" | "year">("month");
  const [initialStr, setInitialStr] = useState(String(initial));
  const [rateStr, setRateStr] = useState(String(rate));
  const [monthsStr, setMonthsStr] = useState(String(months));
  const [contribStr, setContribStr] = useState(String(contribution));

  const calc = useMemo(() => {
    const rMonthly = ratePeriod === "year" ? Math.pow(1 + rate / 100, 1 / 12) - 1 : rate / 100;
    const rows: { m: number; label: string; balance: number; principal: number; interest: number; gain: number }[] = [];
    let bal = initial;
    rows.push({ m: 0, label: "Start", balance: Math.round(initial * 100) / 100, principal: initial, interest: 0, gain: 0 });
    for (let i = 1; i <= months; i++) {
      const gain = bal * rMonthly;
      bal = bal + gain + contribution;
      const principal = initial + contribution * i;
      rows.push({ m: i, label: `M${i}`, balance: Math.round(bal * 100) / 100, principal: Math.round(principal * 100) / 100, interest: Math.round((bal - principal) * 100) / 100, gain: Math.round(gain * 100) / 100 });
    }
    const final = bal;
    const principalTotal = initial + contribution * months;
    const interestTotal = final - principalTotal;
    const growthPct = principalTotal > 0 ? (interestTotal / principalTotal) * 100 : 0;
    const multiple = principalTotal > 0 ? final / principalTotal : 0;
    const simpleBalance = initial * (1 + rMonthly * months) + contribution * months;
    const compoundAdds = final - simpleBalance;
    const annualized = (Math.pow(1 + rMonthly, 12) - 1) * 100;
    return { rows, final, principalTotal, interestTotal, growthPct, multiple, simpleBalance, compoundAdds, annualized };
  }, [initial, rate, months, contribution, ratePeriod]);

  return (
    <div className="max-w-5xl mx-auto px-1 sm:px-2 space-y-6 pb-6">
      {/* header */}
      <div className="text-center pt-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/70"><Calculator className="w-3.5 h-3.5" /> Free tool · No signup</p>
        <h1 className="text-[26px] leading-[1.12] sm:text-5xl font-black tracking-tight mt-2 text-white">Compound Interest <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#bde7ff,#5ec8ff,#1f6fa8)" }}>Calculator</span></h1>
        <p className="text-[12.5px] sm:text-sm text-white/55 mt-3 max-w-2xl mx-auto leading-relaxed">Punch in a starting amount, your monthly return, and how long you let it run. Add recurring contributions if you keep funding — see the full month-by-month curve, the effective annual rate, and a compound-vs-simple comparison.</p>
      </div>

      {/* RESULT HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 p-5 sm:p-7" style={{ background: "radial-gradient(ellipse 80% 70% at 80% 0%, rgba(94,200,255,0.16), transparent 60%), radial-gradient(ellipse 60% 60% at 10% 110%, rgba(42,128,189,0.12), transparent 60%), linear-gradient(160deg,#0b1019,#070b12)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/60">Projected final balance · {months} mo</p>
            <p className="text-4xl sm:text-6xl font-black tabular-nums mt-1 bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#e2f4ff,#5ec8ff,#1f6fa8)" }}>{cmoney(calc.final)}</p>
            <p className="text-sm font-bold text-emerald-300 tabular-nums mt-1">+{cmoney(calc.interestTotal)} interest earned</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:gap-5 shrink-0">
            <HeroStat label="Total growth" value={`+${calc.growthPct.toFixed(0)}%`} sub={`${calc.multiple.toFixed(2)}×`} />
            <HeroStat label="Effective APY" value={`${calc.annualized.toFixed(0)}%`} sub="per year" />
            <HeroStat label="You put in" value={cmoney(calc.principalTotal)} sub="principal" />
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-full border border-white/10 bg-black/30">
            {(["month", "year"] as const).map((p) => (
              <button key={p} onClick={() => setRatePeriod(p)} className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition ${ratePeriod === p ? "text-[#050608]" : "text-white/55 hover:text-white"}`} style={ratePeriod === p ? { background: "linear-gradient(90deg,#5ec8ff,#1f6fa8)" } : undefined}>{p === "month" ? "Per month" : "Per year"}</button>
            ))}
          </div>
          <p className="text-[12px] text-white/50">Your <span className="text-white/80 font-semibold">{rate}%</span> {ratePeriod === "year" ? "annual" : "monthly"} return = <span className="font-bold text-amber-300 tabular-nums">{calc.annualized.toFixed(2)}%</span> effective APY</p>
        </div>
      </div>

      {/* INPUTS */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#080910] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4"><Calculator className="w-4 h-4 text-amber-300" /><h3 className="text-sm font-bold text-white">Your scenario</h3><span className="text-[11px] text-white/35 ml-1">— tap any value to edit</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InputBox label="Starting amount" hint="What you invest today" prefix="$">
            <input type="text" inputMode="decimal" value={initialStr} onChange={(e) => { const s = e.target.value.replace(/[^0-9.]/g, ""); setInitialStr(s); const n = parseFloat(s); if (!isNaN(n)) setInitial(n); }} onBlur={() => { const n = Math.max(1, Math.min(1e8, parseFloat(initialStr) || 0)); setInitial(n); setInitialStr(String(n)); }} className="w-full bg-transparent text-2xl font-black tabular-nums text-white outline-none focus:text-amber-200 transition-colors" />
          </InputBox>
          <InputBox label={ratePeriod === "year" ? "Annual return" : "Monthly return"} hint={`GoldRock target ≈ ${GOLDROCK_MONTHLY}%/mo`} suffix="%">
            <input type="text" inputMode="decimal" value={rateStr} onChange={(e) => { const s = e.target.value.replace(/[^0-9.]/g, ""); setRateStr(s); const n = parseFloat(s); if (!isNaN(n)) setRate(n); }} onBlur={() => { const n = Math.max(0, Math.min(1000, parseFloat(rateStr) || 0)); setRate(n); setRateStr(String(n)); }} className="w-full bg-transparent text-2xl font-black tabular-nums text-amber-300 outline-none transition-colors" />
          </InputBox>
          <InputBox label="Time horizon" hint="How long it runs" suffix="mo">
            <input type="text" inputMode="numeric" value={monthsStr} onChange={(e) => { const s = e.target.value.replace(/[^0-9]/g, ""); setMonthsStr(s); const n = parseInt(s, 10); if (!isNaN(n)) setMonths(n); }} onBlur={() => { const n = Math.max(1, Math.min(600, parseInt(monthsStr, 10) || 1)); setMonths(n); setMonthsStr(String(n)); }} className="w-full bg-transparent text-2xl font-black tabular-nums text-white outline-none focus:text-amber-200 transition-colors" />
          </InputBox>
          <InputBox label="Adding each month" hint="Optional recurring top-up" prefix="$">
            <input type="text" inputMode="decimal" value={contribStr} onChange={(e) => { const s = e.target.value.replace(/[^0-9.]/g, ""); setContribStr(s); const n = parseFloat(s); if (!isNaN(n)) setContribution(n); }} onBlur={() => { const n = Math.max(0, Math.min(1e8, parseFloat(contribStr) || 0)); setContribution(n); setContribStr(String(n)); }} className="w-full bg-transparent text-2xl font-black tabular-nums text-white outline-none focus:text-amber-200 transition-colors" />
          </InputBox>
        </div>
        <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/35 self-center mr-1">Quick start:</span>
          {[500, 1000, 5000, 10000, 25000].map((v) => (
            <button key={v} onClick={() => { setInitial(v); setInitialStr(String(v)); }} className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${initial === v ? "bg-amber-400/15 text-amber-200 border-amber-400/40" : "text-white/55 border-white/10 hover:border-white/25"}`}>{cmoney(v)}</button>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#080910] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-300" /><h3 className="text-sm font-bold text-white">Projected growth</h3></div>
          <div className="flex items-center gap-4 text-[11px] text-white/50">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(180deg,#bde7ff,#2271a5)" }} /> Monthly gain</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 rounded-full bg-amber-500" /> Running balance</span>
          </div>
        </div>
        <GrowthChart rows={calc.rows} />
        <div className="mt-4 rounded-2xl border border-amber-400/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "linear-gradient(90deg, rgba(94,200,255,0.10), rgba(42,128,189,0.06))" }}>
          <p className="text-[13px] text-white/85"><span className="font-bold text-amber-300">Compounding adds {cmoney(calc.compoundAdds)}</span> vs flat simple interest at the same rate.</p>
          <p className="text-[12px] text-white/45 tabular-nums">simple: {cmoney(calc.simpleBalance)}</p>
        </div>
      </div>

      {/* MONTH-BY-MONTH */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#080910] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 pt-5 flex-wrap">
          <div><h3 className="text-base font-bold text-white">Month-by-month projection</h3><p className="text-[12px] text-white/45 mt-0.5">The same compounding curve, laid out so you can scan every month.</p></div>
          <p className="text-[12px] text-white/40 tabular-nums">{months} months · {rate}% / {ratePeriod === "year" ? "yr" : "mo"}{contribution > 0 ? ` · +${cmoney(contribution)}/mo` : ""}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 px-5 py-4">
          {[0, 1].map((col) => {
            const rows = calc.rows.filter((r) => r.m > 0);
            const half = Math.ceil(rows.length / 2);
            const slice = col === 0 ? rows.slice(0, half) : rows.slice(half);
            if (slice.length === 0) return <div key={col} />;
            return (
              <div key={col} className="min-w-0">
                <div className="grid grid-cols-4 gap-2 pb-2 mb-1 border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/40 font-semibold"><span>Month</span><span className="text-right">Balance</span><span className="text-right">Principal</span><span className="text-right">Interest</span></div>
                {slice.map((r) => (
                  <div key={r.m} className="grid grid-cols-4 gap-2 py-1.5 border-b border-white/[0.04] text-[12px] tabular-nums"><span className="text-white/60 font-medium">Month {r.m}</span><span className="text-right font-bold text-white">{cmoney(r.balance)}</span><span className="text-right text-white/45">{cmoney(r.principal)}</span><span className="text-right font-semibold text-amber-300">+{cmoney(r.interest)}</span></div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPLAINERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Explainer icon={<Repeat className="w-4 h-4 text-amber-300" />} title="What compounding does">Each month's gain is added to your balance, so the next month earns a return on a bigger base. That snowball is why the curve bends upward instead of rising in a straight line.</Explainer>
        <Explainer icon={<TrendingUp className="w-4 h-4 text-amber-300" />} title="Compound vs simple">Simple interest pays the same flat amount every month on your original deposit. Compounding reinvests every gain — the gap widens the longer you stay invested.</Explainer>
        <Explainer icon={<Sparkles className="w-4 h-4 text-amber-300" />} title="Adding each month">Recurring contributions stack new principal on top of a compounding balance. Even small monthly top-ups meaningfully lift the final number over time.</Explainer>
      </div>

      {/* CTA */}
      <div className="rounded-3xl border border-amber-400/20 p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(94,200,255,0.10), rgba(42,128,189,0.07))" }}>
        <p className="text-base font-bold text-white flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 text-amber-300" /> Ready to put compounding to work?</p>
        <p className="text-[13px] text-white/55 mt-1.5">GoldRock's PAMM targets ≈ {GOLDROCK_MONTHLY}% / month. Invest and let it reinvest for you.</p>
        <a href={SIGNUP_PATH} className="mt-4 h-11 px-7 rounded-full font-bold text-[#050608] inline-flex items-center gap-2" style={{ background: "linear-gradient(90deg,#5ec8ff,#1f6fa8)" }}>Create your account →</a>
      </div>

      <p className="text-[11px] leading-relaxed text-white/35 px-1 text-center flex items-start gap-1.5 justify-center max-w-2xl mx-auto"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>This calculator is for illustration only. Projections assume a constant return and do not guarantee future results. Past performance is not indicative of future returns. Trading involves risk.</span></p>
    </div>
  );
}

// SVG bar (monthly gain) + line (running balance) chart — recharts replacement.
function GrowthChart({ rows }: { rows: { label: string; balance: number; gain: number }[] }) {
  const W = 640, H = 300, padL = 46, padR = 8, padT = 10, padB = 24;
  const iw = W - padL - padR, ih = H - padT - padB;
  const maxBal = Math.max(...rows.map((r) => r.balance), 1);
  const n = rows.length;
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => padT + ih - (v / maxBal) * ih;
  const bw = Math.max(2, Math.min(30, (iw / n) * 0.55));
  const linePts = rows.map((r, i) => `${x(i).toFixed(1)},${y(r.balance).toFixed(1)}`).join(" ");
  const areaPts = `${padL},${padT + ih} ${linePts} ${padL + iw},${padT + ih}`;
  const ticks = 4;
  const step = Math.max(1, Math.floor((n - 1) / 6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="300" preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ccBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bde7ff" /><stop offset="100%" stopColor="#2271a5" /></linearGradient>
        <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(88,190,246,.22)" /><stop offset="100%" stopColor="rgba(88,190,246,0)" /></linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }, (_, i) => { const gv = (maxBal / ticks) * i; const gy = y(gv); return (<g key={i}><line x1={padL} y1={gy} x2={padL + iw} y2={gy} stroke="rgba(255,255,255,.05)" strokeWidth="1" /><text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="10" fill="rgba(255,255,255,.4)">{ckfmt(gv)}</text></g>); })}
      {rows.map((r, i) => { const bh = (r.gain / maxBal) * ih; return <rect key={i} x={x(i) - bw / 2} y={padT + ih - bh} width={bw} height={Math.max(0, bh)} rx="3" fill="url(#ccBar)" />; })}
      <polygon points={areaPts} fill="url(#ccArea)" />
      <polyline points={linePts} fill="none" stroke="#4499d2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {rows.map((r, i) => (i % step === 0 || i === n - 1) ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.4)">{r.label === "Start" ? "Now" : r.label}</text> : null)}
    </svg>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (<div className="text-center lg:text-right min-w-0"><p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-white/40 font-semibold">{label}</p><p className="text-base sm:text-xl font-black tabular-nums text-white mt-1 leading-none">{value}</p>{sub && <p className="text-[10px] text-white/40 tabular-nums mt-0.5">{sub}</p>}</div>);
}
function InputBox({ label, hint, prefix, suffix, children }: { label: string; hint?: string; prefix?: string; suffix?: string; children: ReactNode }) {
  return (<div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-3.5 min-w-0 focus-within:border-amber-400/40 transition-colors"><p className="text-[10px] uppercase tracking-[0.12em] text-white/45 font-semibold leading-tight min-h-[1.6em]">{label}</p><div className="flex items-baseline gap-1 mt-1.5">{prefix && <span className="text-white/45 text-lg font-bold shrink-0">{prefix}</span>}{children}{suffix && <span className="text-white/45 text-sm font-semibold shrink-0">{suffix}</span>}</div>{hint && <p className="text-[10px] text-white/30 mt-1 truncate">{hint}</p>}</div>);
}
function Explainer({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (<div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center gap-2 mb-1.5">{icon}<h4 className="text-[13px] font-bold text-white">{title}</h4></div><p className="text-[12px] leading-relaxed text-white/50">{children}</p></div>);
}
