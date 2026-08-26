import { useState } from "react";

const CSS = `
.rtac{--gold:#3f92cc;--gold-hi:#cfe7fa;--blue:#459eda;--cy:#6bb4e2;--ink:#f6f1e4;--mut:#a8a49a}
.rtac *{box-sizing:border-box}
.rtac .hero{border:1px solid rgba(63,146,204,.3);border-radius:18px;padding:24px;background:linear-gradient(120deg,rgba(63,146,204,.08),rgba(86,164,216,.05));display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-bottom:22px}
.rtac .hero .ic{font-size:38px}
.rtac .hero h3{margin:0;font-size:21px;font-weight:900;color:#fff}
.rtac .hero p{margin:6px 0 0;color:var(--mut);font-size:14px;max-width:58ch}
.rtac .hero .btns{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap}
.rtac .btn{height:44px;padding:0 20px;border:none;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.rtac .btn.gold{color:#1a1400;background:linear-gradient(90deg,var(--gold),var(--gold-hi))}
.rtac .btn.ghost{color:var(--ink);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14)}
.rtac .lbl{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:6px 0 12px}
.rtac .mod{border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,#0b1220,#0a1018);border-radius:14px;margin-bottom:12px;overflow:hidden}
.rtac .mhead{display:flex;align-items:center;gap:14px;padding:16px 18px;cursor:pointer;user-select:none}
.rtac .mnum{flex:0 0 40px;width:40px;height:40px;border-radius:11px;background:rgba(63,146,204,.1);border:1px solid rgba(63,146,204,.25);display:flex;align-items:center;justify-content:center;font-family:ui-monospace,Menlo,monospace;font-weight:900;color:var(--gold-hi)}
.rtac .mtitle{flex:1;min-width:0}
.rtac .mtitle .t{font-weight:800;font-size:15.5px;color:#fff}
.rtac .mtitle .s{font-size:12.5px;color:var(--mut);margin-top:2px}
.rtac .chev{transition:transform .2s;color:var(--mut);flex:0 0 auto}
.rtac .mod.open .chev{transform:rotate(90deg)}
.rtac .mbody{padding:0 18px 18px 72px;color:rgba(255,255,255,.82);font-size:14px;line-height:1.7}
.rtac .mbody p{margin:0 0 10px}
.rtac .mbody b{color:#fff}
.rtac .mbody ul{margin:6px 0 12px;padding-left:18px}
.rtac .mbody li{margin:5px 0}
.rtac .mbody .cta{margin-top:6px}
@media(max-width:640px){.rtac .hero .btns{margin-left:0;width:100%}.rtac .mbody{padding-left:18px}}
`;

type Enter = (r?: string) => string;
const MODULES = (enter: Enter, setTab: (t: any) => void) => [
  {
    t: "How Copy the Rich Trades works", s: "The whole model in 3 minutes — start here.",
    body: (
      <>
        <p>Copy the Rich Trades isn't a course you finish and forget. It's a <b>system</b> built to put money to work for you three ways — pick one, or stack all three:</p>
        <ul>
          <li><b>Earn hands-free</b> — allocate to the GoldRock PAMM. The desk trades, you compound.</li>
          <li><b>Take the signals</b> — fund a live account and trade the Gold Pulse calls yourself, one tap at a time.</li>
          <li><b>Grow the circle</b> — refer people with your two links and earn per-lot + PAMM profit-share, 10 levels deep.</li>
        </ul>
        <p>Complete one step and the inner circle opens — the chat, the community, and the live sessions. That's where momentum lives.</p>
      </>
    ),
  },
  {
    t: "The compound mindset", s: "Why patient money wins — the 8th wonder.",
    body: (
      <>
        <p>Einstein called compounding the 8th wonder of the world: <b>"He who understands it, earns it. He who doesn't, pays it."</b></p>
        <p>The GoldRock fund targets a <b>15%+ monthly floor</b> and has averaged far higher. The magic isn't any single month — it's letting the wins ride on top of each other. A balance that grows 15% a month doesn't add 15% a year; it multiplies.</p>
        <p>Three rules of the compound mindset:</p>
        <ul>
          <li><b>Don't touch it.</b> Every withdrawal resets the snowball.</li>
          <li><b>Add on the dips.</b> Topping up in slow months buys more compounding runway.</li>
          <li><b>Think in years, act today.</b> The best day to start was months ago. The second best is now.</li>
        </ul>
      </>
    ),
  },
  {
    t: "Reading Gold Pulse signals", s: "Entry, TP, SL — how to take a call cleanly.",
    body: (
      <>
        <p>Every Gold Pulse call gives you everything you need:</p>
        <ul>
          <li><b>Pair &amp; side</b> — e.g. <b>XAU/USD · SELL</b>.</li>
          <li><b>Entry</b> — the price to get in at (or near — don't chase more than a few pips).</li>
          <li><b>TP</b> — take-profit target(s). We update the card live as TP1/TP2/TP3 hit.</li>
          <li><b>SL</b> — the stop. This is non-negotiable — it's how you stay in the game.</li>
        </ul>
        <p><b>Risk small, stay consistent.</b> Never risk more than 1–2% of your account on a single call. Ten good calls at 2% beat one hero trade every time. When a call hits SL, that's the system working — protect the capital and take the next one.</p>
      </>
    ),
  },
  {
    t: "Tap to Trade 101", s: "Fire a signal on your live account in one tap.",
    body: (
      <>
        <p>You don't need to be glued to a chart. When a Gold Pulse call drops, open <b>Tap to Trade</b> — the signal is already loaded with the right side, entry, stop and target, sized for your balance.</p>
        <ul>
          <li>Fund a live account with ${"250"}+ so tap-to-trade is unlocked.</li>
          <li>Open the call → confirm your size → fire. That's it.</li>
          <li>The stop and target ride with the position — no babysitting.</li>
        </ul>
        <p className="cta"><a className="btn gold" onClick={() => setTab("taptotrade")} style={{ cursor: "pointer" }}>Open Tap to Trade →</a></p>
      </>
    ),
  },
  {
    t: "The GoldRock PAMM playbook", s: "Passive income, done right.",
    body: (
      <>
        <p>Don't want to trade at all? Put money into <b>GoldRock</b> — the #1 managed fund on the desk — and it trades for you.</p>
        <ul>
          <li><b>Minimum ${"250"}</b> to start. Allocate from your wallet in a couple taps.</li>
          <li>Your balance grows with the fund — check it any time in the Pulse dashboard.</li>
          <li>Withdraw between trade cycles; when trades are running, allocations are locked to protect everyone.</li>
        </ul>
        <p>This is the hands-free path — no screens, no stress. Combine it with the signals to run both engines at once.</p>
      </>
    ),
  },
  {
    t: "Build your bag — the affiliate play", s: "Turn your links into income.",
    body: (
      <>
        <p>Every member gets <b>two referral links</b> — a home-page link and a landing-page link. Share them anywhere.</p>
        <ul>
          <li>Anyone who joins through your link is credited to you.</li>
          <li>You earn <b>per-lot</b> on every trade your network makes — automatically, for as long as they trade.</li>
          <li>You earn a <b>PAMM profit-share</b> when your people invest in GoldRock.</li>
          <li>It pays <b>10 levels deep</b> — your network's network pays you too.</li>
        </ul>
        <p className="cta"><a className="btn ghost" onClick={() => setTab("affiliate")} style={{ cursor: "pointer" }}>Grab my links →</a></p>
      </>
    ),
  },
];

export default function Academy({ enter, setTab }: { enter: Enter; setTab: (t: any) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const mods = MODULES(enter, setTab);
  return (
    <div className="rtac">
      <style>{CSS}</style>
      <div className="hero">
        <span className="ic">🚀</span>
        <div>
          <h3>The Copy the Rich Trades Launch Playbook</h3>
          <p>Your complete getting-started guide — the model, the mindset, and the plays. Read the deck, then work the trainings below.</p>
        </div>
        <div className="btns">
          <a className="btn gold" href="/playbook.html" target="_blank" rel="noopener noreferrer">View the deck →</a>
          <a className="btn ghost" href="/rob-the-bankz-playbook.pdf" target="_blank" rel="noopener noreferrer">Download PDF</a>
        </div>
      </div>

      <div className="hero" style={{ borderColor: "rgba(86,164,216,.3)", background: "linear-gradient(120deg,rgba(86,164,216,.09),rgba(46,122,180,.05))" }}>
        <span className="ic">🎓</span>
        <div>
          <h3>Pulse University</h3>
          <p>The full trading education library on the Pulse platform — deep-dive courses on price action, risk, and the markets. Opens in your Pulse account, already logged in.</p>
        </div>
        <div className="btns">
          <a className="btn gold" href={enter("/academy")} target="_blank" rel="noopener noreferrer" style={{ background: "linear-gradient(90deg,#459eda,#6bb4e2)", color: "#0d1420" }}>Open Pulse University →</a>
        </div>
      </div>

      <div className="lbl">Copy the Rich Trades trainings</div>
      {mods.map((m, i) => (
        <div key={i} className={`mod ${open === i ? "open" : ""}`}>
          <div className="mhead" onClick={() => setOpen(open === i ? null : i)}>
            <div className="mnum">{String(i + 1).padStart(2, "0")}</div>
            <div className="mtitle"><div className="t">{m.t}</div><div className="s">{m.s}</div></div>
            <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </div>
          {open === i && <div className="mbody">{m.body}</div>}
        </div>
      ))}
    </div>
  );
}
