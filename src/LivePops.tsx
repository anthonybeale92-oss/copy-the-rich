// Social-proof pops — the little cards that jump up bottom-left on the public pages.
//
// The names and amounts below are a showcase reel, not a live feed: they are written here, they
// cycle on a timer, and they are the same for every visitor. Nothing reads the database. If this
// ever needs to show genuine activity, swap `pickEvent` for a fetch against a Pulse endpoint and
// render nothing when the feed is empty — the component already handles having no card to show.
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// The reel
// ---------------------------------------------------------------------------
const NAMES = [
  "Amanda M.", "Devon R.", "Priya S.", "Marcus T.", "Aisha K.", "Tyler B.",
  "Sofia L.", "Jamal W.", "Chloe D.", "Andre P.", "Nadia H.", "Ryan C.",
  "Zara N.", "Ethan G.", "Layla F.", "Kwame A.", "Bianca V.", "Noah J.",
  "Imani O.", "Lucas E.", "Farah Q.", "Diego S.", "Keisha R.", "Owen M.",
  "Yuki T.", "Samir B.", "Grace I.", "Malik D.", "Elena K.", "Trevor N.",
];

// Deposit sizes that read like real tickets rather than round marketing numbers.
const DEPOSITS = [250, 250, 300, 500, 500, 750, 1000, 1000, 1500, 2000, 2500, 3000, 5000];
const PAMM = [500, 1000, 1000, 2000, 2500, 5000, 7500, 10000];
const PAYOUTS = [180, 240, 320, 415, 560, 720, 940, 1250, 1680, 2100];

// The sentence is assembled per event rather than from one template: "funded up for" and "just
// joined" don't take an amount, and only a deposit reads naturally as "…with Copy the Rich Trades".
// `pre` runs before the amount, `post` after it, and `hi` is the gold phrase that closes the line.
type Ev = { name: string; pre: string; amount?: number; post?: string; hi: string; tag: string; ic: string };

const usd = (n: number) => "$" + n.toLocaleString("en-US");
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

// Weighted so deposits lead — that's the action the page is asking for — with joins, allocations
// and payouts mixed in so the reel doesn't read as one message on repeat.
function pickEvent(): Ev {
  const n = pick(NAMES);
  const r = Math.random();
  if (r < 0.36) return { name: n, pre: "just deposited", amount: pick(DEPOSITS), post: "with", hi: "Copy the Rich Trades", tag: "New deposit", ic: "↗" };
  if (r < 0.58) return { name: n, pre: "just joined the", hi: "Free Academy", tag: "New member", ic: "🎓" };
  if (r < 0.76) return { name: n, pre: "allocated", amount: pick(PAMM), post: "to", hi: "GoldRock PAMM", tag: "PAMM allocation", ic: "◈" };
  if (r < 0.90) return { name: n, pre: "withdrew", amount: pick(PAYOUTS), post: "from", hi: "Copy the Rich Trades", tag: "Withdrawal paid", ic: "✓" };
  return { name: n, pre: "funded up and unlocked", hi: "10× leverage", tag: "10X Funded", ic: "⚡" };
}

const AGO = ["just now", "1 min ago", "2 min ago", "4 min ago", "7 min ago", "12 min ago", "18 min ago", "26 min ago"];

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
const FIRST_DELAY = 5200;   // let the hero land before anything jumps in
const VISIBLE = 5400;       // how long a card stays up
const GAP_MIN = 7000;       // quiet stretch between cards
const GAP_MAX = 14000;
const DISMISS_KEY = "rtb_pops_off";

export default function LivePops() {
  const [ev, setEv] = useState<Ev | null>(null);
  const [ago, setAgo] = useState("just now");
  const [shown, setShown] = useState(false);   // drives the enter/exit animation
  const [dead, setDead] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try { if (sessionStorage.getItem(DISMISS_KEY)) { setDead(true); return; } } catch {}
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDead(true); return; }

    let alive = true;
    const at = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

    const cycle = () => {
      if (!alive) return;
      setEv(pickEvent());
      setAgo(pick(AGO));
      setShown(true);
      at(() => {
        setShown(false);
        at(cycle, GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN));
      }, VISIBLE);
    };
    at(cycle, FIRST_DELAY);

    return () => { alive = false; timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  const dismiss = () => {
    setShown(false);
    setDead(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  if (dead || !ev) return null;

  return (
    <>
      <style>{POP_CSS}</style>
      <div className={"lvp" + (shown ? " in" : "")} role="status" aria-live="polite">
        <div className="lvp-glow" />
        <div className="lvp-av"><span>{ev.name.charAt(0)}</span></div>
        <div className="lvp-body">
          <div className="lvp-nm">{ev.name}</div>
          <div className="lvp-ln">
            {ev.pre}{ev.amount != null && <> <b>{usd(ev.amount)}</b></>}{ev.post ? ` ${ev.post}` : ""} <b className="lvp-brand">{ev.hi}</b>
          </div>
          <div className="lvp-tag"><span className="lvp-ic">{ev.ic}</span>{ev.tag}<i className="lvp-dot" />{ago}</div>
        </div>
        <button className="lvp-x" onClick={dismiss} aria-label="Hide notifications">✕</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles — self-contained, no dependency on the .rb page wrapper
// ---------------------------------------------------------------------------
const POP_CSS = `
@keyframes lvpJump{
  0%{transform:translateY(120%) scale(.86);opacity:0}
  46%{transform:translateY(-16px) scale(1.05);opacity:1}
  66%{transform:translateY(5px) scale(.985)}
  82%{transform:translateY(-4px) scale(1.005)}
  100%{transform:translateY(0) scale(1);opacity:1}
}
@keyframes lvpNudge{
  0%,88%,100%{transform:translateY(0) rotate(0deg)}
  91%{transform:translateY(-5px) rotate(-.7deg)}
  94%{transform:translateY(0) rotate(.5deg)}
  97%{transform:translateY(-2px) rotate(0deg)}
}
@keyframes lvpHalo{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.8;transform:scale(1.06)}}
@keyframes lvpSheen{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(320%) skewX(-18deg)}}
@keyframes lvpPing{0%{box-shadow:0 0 0 0 rgba(29,102,148,.5)}70%{box-shadow:0 0 0 12px rgba(29,102,148,0)}100%{box-shadow:0 0 0 0 rgba(29,102,148,0)}}

.lvp{
  position:fixed;z-index:80;
  left:max(14px,env(safe-area-inset-left));
  bottom:calc(16px + env(safe-area-inset-bottom));
  width:min(340px,calc(100vw - 28px));
  display:flex;align-items:center;gap:12px;
  padding:12px 34px 12px 12px;
  border-radius:16px;
  border:1px solid rgba(29,102,148,.34);
  background:linear-gradient(140deg,rgba(252,251,251,.97),rgba(252,252,252,.97));
  box-shadow:0 22px 50px -18px rgba(0,0,0,0.144),0 0 34px -14px rgba(29,102,148,.45),inset 0 1px 0 rgba(20,20,20,.06);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;
  color:#141414;
  overflow:hidden;
  opacity:0;transform:translateY(120%) scale(.86);
  pointer-events:none;
  transition:opacity .32s ease,transform .32s cubic-bezier(.4,0,.6,1);
}
.lvp.in{
  opacity:1;pointer-events:auto;
  animation:lvpJump .78s cubic-bezier(.18,.9,.32,1.2) both,lvpNudge 5.4s ease-in-out .8s 1;
}
/* the sheen that runs across the card as it lands */
.lvp.in::after{
  content:"";position:absolute;top:0;bottom:0;width:60px;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(9,61,96,.16),transparent);
  animation:lvpSheen 1.1s ease-out .5s 1 both;
}
.lvp-glow{position:absolute;left:-30px;top:-40px;width:150px;height:150px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(29,102,148,.22),transparent 68%);animation:lvpHalo 2.6s ease-in-out infinite}

.lvp-av{position:relative;flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;
  background:linear-gradient(140deg,rgba(29,102,148,.26),rgba(48,127,187,.1));
  border:1px solid rgba(29,102,148,.5);animation:lvpPing 2.4s ease-out infinite}
.lvp-av span{font-size:16px;font-weight:900;color:#154f73;letter-spacing:-.01em}

.lvp-body{position:relative;min-width:0;flex:1}
.lvp-nm{font-size:14px;font-weight:800;letter-spacing:-.01em;line-height:1.25}
.lvp-ln{margin-top:2px;font-size:12.5px;line-height:1.35;color:rgba(20,20,20,.72)}
.lvp-ln b{color:#1d6694;font-weight:800}
.lvp-brand{white-space:nowrap}
.lvp-tag{margin-top:5px;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;
  letter-spacing:.09em;text-transform:uppercase;color:rgba(29,102,148,.85)}
.lvp-ic{font-size:11px;line-height:1}
.lvp-dot{width:3px;height:3px;border-radius:50%;background:rgba(29,102,148,.45);flex:none}

.lvp-x{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:none;cursor:pointer;
  background:transparent;color:rgba(20,20,20,.32);font-size:11px;line-height:1;transition:.15s;z-index:2}
.lvp-x:hover{background:rgba(20,20,20,.09);color:#141414}

@media(max-width:560px){
  .lvp{width:calc(100vw - 24px);left:12px;padding:11px 30px 11px 11px;border-radius:14px}
  .lvp-av{width:38px;height:38px}
  .lvp-nm{font-size:13.5px}
  .lvp-ln{font-size:12px}
}
@media(prefers-reduced-motion:reduce){
  .lvp,.lvp.in,.lvp.in::after,.lvp-glow,.lvp-av{animation:none!important;transition:opacity .2s ease}
  .lvp.in{transform:none}
}
`;
