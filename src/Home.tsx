// Copy the Rich Trades brand HOME — leads with FREE education + PASSIVE income, then the two ways to earn
// (signals or the PAMM), then funding up for 10× leverage at the bottom. The 10X landing lives at /signup.
import { useState } from "react";
import ConstellationBackground from "./ConstellationBackground";
import { getStoredRef, HOUSE_REF } from "./api";
export const LOGIN_URL = "/login";

// Every "Get Started" / "Start free" / "Start learning free" CTA lands on Pulse's register form
// directly. They used to stop at /signup — the 10X leverage landing — which is a pitch, not a
// form: somebody who has already decided had to read a second sales page before they could type
// an email. The 10X page is still at /signup and still reachable; it just isn't in the way.
const REGISTER_BASE = "https://www.pulsemarketstrade.com/register";
// The house code now lives in api.ts as HOUSE_REF, so the promo pages resolve to the same link.

// An affiliate's ?ref= is captured into localStorage the moment anyone lands (see captureRef in
// main.tsx) precisely so it can ride along to signup. Hardcoding the house code here would throw
// that away and credit every affiliate's traffic to the default plan, so a real code always wins.
//
// The URL is read BEFORE localStorage, and that order matters: captureRef runs in App's mount
// effect, but this module is evaluated at boot — earlier. A first-time visitor arriving on
// copytherichtrades.com?ref=THEIRS would still have an empty localStorage at this point, and reading
// only the store would silently credit them to the house.
export function signupUrl(): string {
  let ref = "";
  try { ref = (new URLSearchParams(window.location.search).get("ref") || "").trim(); } catch {}
  if (!ref) ref = getStoredRef();
  return `${REGISTER_BASE}?ref=${encodeURIComponent(ref || HOUSE_REF)}&b=pulse`;
}

// Named export because InfoPages and the rest of the site already import it.
export const SIGNUP_PATH = signupUrl();
// Top-nav destinations — each opens a dedicated page.
export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/learn", label: "Learn" },
  { href: "/goldrock", label: "GoldRock PAMM" },
  { href: "/tap-to-trade", label: "Tap to Trade" },
  { href: "/calculator", label: "Calculator" },
];

const eduPoints = [
  { ic: "🎓", t: "Free Trading Academy", d: "Step-by-step lessons from your very first chart to funded-account risk management. Zero experience needed — learn at your own pace, 100% free." },
  { ic: "🗓️", t: "Daily live breakdowns", d: "The desk explains every play — why the entry, where the risk, when to bank profit. You learn by watching real trades, live." },
  { ic: "💬", t: "1-on-1 in the group", d: "Stuck on something? Ask. Real people, real answers, every single day. Nobody gets left behind." },
];

const testimonials = [
  { n: "Priya S.", h: "@priyacapital", q: "GoldRock does the work while I sleep — I just watch my balance grow. And the free academy taught me enough to start taking signals myself.", r: 5 },
  { n: "Aisha K.", h: "@aishafx", q: "I knew nothing about trading. The free lessons + daily calls got me from zero to actually understanding the market. Now I earn passively AND trade.", r: 5 },
  { n: "Devon R.", h: "@devonpips", q: "Started passive with the fund, learned the game for free, then funded up for 10×. Pulled my deposit and profits, no hassle. This community is different.", r: 5 },
];

export const RB_CSS = `
.rb *{box-sizing:border-box}
.rb{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;background:#05070d;color:#fff;min-height:100vh;position:relative;overflow-x:clip;-webkit-font-smoothing:antialiased}
.rb a{text-decoration:none;color:inherit}
.rb .wrap{max-width:1120px;margin:0 auto;padding:0 20px}
@keyframes rbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes rbGlow{0%,100%{opacity:.45}50%{opacity:.9}}
@keyframes rbGrad{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes rbTwinkle{0%,100%{opacity:.12}50%{opacity:.5}}
@keyframes rbSheen{0%{transform:translateX(-160%) skewX(-18deg)}100%{transform:translateX(280%) skewX(-18deg)}}
.rb .stars{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(1100px 650px at 70% -10%,rgba(107,180,226,.08),transparent 60%),radial-gradient(900px 600px at 10% 110%,rgba(46,122,180,.08),transparent 60%)}
.rb .dot{position:absolute;width:3px;height:3px;border-radius:50%;background:#6bb4e2;animation:rbTwinkle 4s ease-in-out infinite}
/* viewport-fit=cover hands the page the full screen, home indicator included. The backdrop
   wants that (it's why the bottom strip is lit now); the CONTENT does not, or the last line
   of the footer sits under the indicator. */
.rb main{position:relative;z-index:1;padding-bottom:env(safe-area-inset-bottom)}
/* NAV */
.rb .nav{position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(18px);background:rgba(5,7,13,.82);transform:translateZ(0);will-change:transform;backface-visibility:hidden}
.rb .navin{display:flex;align-items:center;justify-content:space-between;height:60px;gap:10px}
.rb .brand{display:flex;align-items:center;gap:9px;min-width:0}
.rb .brand img{height:34px;width:34px;border-radius:9px;object-fit:contain;box-shadow:0 6px 20px -8px rgba(63,146,204,.55);flex:none}
.rb .brand span{font-size:16px;font-weight:900;letter-spacing:-.01em;white-space:nowrap}
.rb .navr{display:flex;align-items:center;gap:8px;flex:none}
.rb .navlinks{display:none}
@media(min-width:900px){.rb .navlinks{display:flex;align-items:center;gap:6px;position:absolute;left:50%;transform:translateX(-50%)}}
.rb .navlinks a{position:relative;font-size:13px;font-weight:700;color:rgba(255,255,255,.72);padding:8px 12px;border-radius:10px;transition:.15s}
.rb .navlinks a:hover{color:#fff;background:rgba(255,255,255,.06)}
.rb .navlinks a::after{content:"";position:absolute;left:12px;right:12px;bottom:4px;height:2px;border-radius:2px;background:linear-gradient(90deg,#6bb4e2,#2a72a8);transform:scaleX(0);transform-origin:left;transition:transform .2s}
.rb .navlinks a:hover::after{transform:scaleX(1)}
.rb .navlinks a.on{color:#fff;background:rgba(107,180,226,.08)}
.rb .navlinks a.on::after{transform:scaleX(1)}
.rb .brand{cursor:pointer}
.rb .navin{position:relative}
.rb section{scroll-margin-top:74px}
.rb .btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:13px;font-weight:800;color:#0d1420;background:linear-gradient(90deg,#6bb4e2,#2e7ab4,#2a72a8);box-shadow:0 12px 34px -16px rgba(107,180,226,.7);transition:transform .15s;white-space:nowrap}
.rb .btn:hover{transform:scale(1.03)}
.rb .btn::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);transform:translateX(-160%) skewX(-18deg);animation:rbSheen 4.5s ease-in-out infinite}
.rb .btn.gold{background:linear-gradient(90deg,#3f92cc,#7cbde6)}
.rb .btn.sm{height:38px;padding:0 15px;font-size:13px}
.rb .btn.lg{height:54px;padding:0 28px;font-size:16px}
.rb .ghost{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 15px;border-radius:13px;font-size:13px;font-weight:700;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.15);transition:.15s;white-space:nowrap}
.rb .ghost.lg{height:54px;padding:0 26px;font-size:15px}
.rb .ghost:hover{border-color:rgba(255,255,255,.3);color:#fff}
@media(max-width:420px){.rb .brand span{font-size:14px}.rb .btn.sm,.rb .ghost{height:34px;padding:0 12px;font-size:12px}}
/* HERO */
.rb .hero{text-align:center;padding:46px 0 30px}
.rb .logo-hero{position:relative;width:186px;height:186px;margin:0 auto 4px;max-width:54vw}
.rb .logo-hero .halo{position:absolute;inset:-16px;border-radius:50%;filter:blur(30px);background:radial-gradient(circle,rgba(63,146,204,.28),rgba(107,180,226,.2) 55%,transparent 72%);animation:rbGlow 4.5s infinite}
.rb .logo-hero img{position:relative;width:100%;height:100%;object-fit:contain;border-radius:26px;animation:rbFloat 6s ease-in-out infinite}
.rb h1{font-size:40px;line-height:1.03;font-weight:900;letter-spacing:-.02em;margin:14px 0 0}
@media(min-width:860px){.rb h1{font-size:60px}}
.rb h1 .g{background:linear-gradient(135deg,#c5e5fa 0%,#54ace6 28%,#1c75b0 55%,#80c2ee 78%,#fff8e1 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:rbGrad 8s linear infinite}
.rb .lede{color:rgba(255,255,255,.62);font-size:16px;line-height:1.62;max-width:42rem;margin:20px auto 0}
.rb .cta-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:30px}
.rb .stat-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px}
.rb .stat{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);border-radius:12px;padding:10px 18px;text-align:center}
.rb .stat .v{font-size:18px;font-weight:900;background:linear-gradient(135deg,#c5e5fa 0%,#54ace6 28%,#1c75b0 55%,#80c2ee 78%,#fff8e1 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:rbGrad 8s linear infinite}
.rb .stat .l{font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-top:3px}
/* SECTIONS */
.rb section{padding:44px 0}
.rb .sec-k{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:rgba(107,180,226,.8);margin-bottom:8px;text-align:center}
.rb h2{font-size:28px;font-weight:900;letter-spacing:-.02em;text-align:center}
@media(min-width:860px){.rb h2{font-size:37px}}
.rb .sub{color:rgba(255,255,255,.55);text-align:center;max-width:40rem;margin:12px auto 0;line-height:1.6}
/* EDU banner */
.rb .edu{border:1px solid rgba(107,180,226,.2);border-radius:24px;padding:34px 24px;background:radial-gradient(700px 320px at 50% 0%,rgba(107,180,226,.1),transparent 60%)}
.rb .free{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0d1420;background:linear-gradient(90deg,#6bb4e2,#2a72a8);border-radius:99px;padding:5px 12px;margin-bottom:14px}
.rb .edu-grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:26px}
@media(min-width:820px){.rb .edu-grid{grid-template-columns:1fr 1fr 1fr}}
.rb .ecard{text-align:left;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);border-radius:16px;padding:20px}
.rb .ecard .ic{font-size:22px}
.rb .ecard h4{font-weight:800;margin-top:10px}
.rb .ecard p{color:rgba(255,255,255,.55);font-size:13.5px;line-height:1.6;margin-top:7px}
/* TWO WAYS TO EARN */
.rb .grid2{display:grid;grid-template-columns:1fr;gap:18px;margin-top:34px}
@media(min-width:820px){.rb .grid2{grid-template-columns:1fr 1fr}}
.rb .opt{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:30px;display:flex;flex-direction:column;background:#0b0c12}
.rb .opt.gold{border-color:rgba(63,146,204,.28);background:radial-gradient(520px 260px at 15% 0%,rgba(63,146,204,.12),transparent 60%),#0b0c12}
.rb .opt.cyan{border-color:rgba(107,180,226,.28);background:radial-gradient(520px 260px at 15% 0%,rgba(107,180,226,.12),transparent 60%),#0b0c12}
.rb .opt .oic{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:26px;border:1px solid rgba(255,255,255,.14)}
.rb .opt.gold .oic{background:rgba(63,146,204,.14);border-color:rgba(63,146,204,.32)}
.rb .opt.cyan .oic{background:rgba(107,180,226,.14);border-color:rgba(107,180,226,.32)}
.rb .opt .tag{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-top:16px}
.rb .opt.gold .tag{color:#7cbde6}.rb .opt.cyan .tag{color:#b3daf4}
.rb .opt h3{font-size:23px;font-weight:900;margin-top:6px;letter-spacing:-.01em}
.rb .opt p{color:rgba(255,255,255,.62);font-size:14.5px;line-height:1.62;margin-top:11px}
.rb .opt ul{list-style:none;padding:0;margin:16px 0 0;flex:1}
.rb .opt li{font-size:14px;color:rgba(255,255,255,.78);padding:5px 0 5px 24px;position:relative}
/* Gold, not green. These ticks are decoration on a marketing list — "zero trading
   required", "the pros trade it for you" — not a profit/loss signal, so they are
   the one green on this page with no meaning to protect. Green stays where it
   means money: P/L figures, buy buttons, the chart's candles. */
.rb .opt li::before{content:"✓";position:absolute;left:0;color:#6bb4e2;font-weight:900}
.rb .opt .go{margin-top:22px}
.rb .opt{transition:transform .25s ease,box-shadow .25s ease}
/* PAMM card — the gold-ringed one. */
.rb .opt.blue{border-color:rgba(46,122,180,.32);background:radial-gradient(520px 260px at 15% 0%,rgba(107,180,226,.12),transparent 55%),radial-gradient(520px 260px at 90% 10%,rgba(46,122,180,.12),transparent 55%),#0b0c12;box-shadow:0 24px 60px -34px rgba(107,180,226,.4)}
.rb .opt.blue .tag{color:#b3daf4}
.rb .opt.blue:hover{transform:translateY(-3px);box-shadow:0 30px 70px -30px rgba(107,180,226,.5)}
/* animated gold gradient ring (bright gold → amber → bronze) */
.rb .opt.blue::after{content:"";position:absolute;inset:0;border-radius:22px;padding:1.4px;background:linear-gradient(120deg,rgba(107,180,226,.75),rgba(46,122,180,.6),rgba(46,122,180,.7),rgba(107,180,226,.75));background-size:300% 300%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:gborder 9s linear infinite;pointer-events:none}
@keyframes gborder{0%{background-position:0% 50%}100%{background-position:300% 50%}}
/* Gold flame + waveform mark */
.rb .gr-ic{width:58px;height:58px}
.rb .gr-ic svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 3px 12px rgba(42,114,168,.55))}
.rb .fl{transform-box:fill-box;transform-origin:center bottom;animation:flick 1.4s ease-in-out infinite}
.rb .fl.b{animation-duration:1.05s;animation-delay:-.3s}
.rb .fl.c{animation-duration:1.7s;animation-delay:-.6s}
@keyframes flick{0%,100%{transform:scaleY(1) scaleX(1);opacity:.95}50%{transform:scaleY(1.16) scaleX(.9);opacity:.66}}
.rb .gr-ic .wave{stroke-dasharray:120;stroke-dashoffset:120;animation:wdraw 2.2s ease-out forwards,wpulse 2.6s ease-in-out 2.2s infinite}
@keyframes wdraw{to{stroke-dashoffset:0}}
@keyframes wpulse{0%,100%{opacity:1;filter:drop-shadow(0 0 0 rgba(107,180,226,0))}50%{opacity:.85;filter:drop-shadow(0 0 5px rgba(107,180,226,.8))}}
/* growth track-record sparkline */
.rb .track{margin-top:16px;border:1px solid rgba(107,180,226,.22);background:linear-gradient(180deg,rgba(107,180,226,.06),rgba(46,122,180,.04));border-radius:14px;padding:12px 14px}
.rb .track .tl{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.rb .track .tl b{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#b3daf4}
.rb .track .tl em{font-style:normal;font-size:12px;color:rgba(255,255,255,.6)}
.rb .track .tl em i{font-style:normal;color:#56a4d8;font-weight:900}
.rb .spark{width:100%;height:46px;display:block}
.rb .spark .sdraw{stroke-dasharray:520;stroke-dashoffset:520;animation:sdraw 2.6s ease-out forwards}
@keyframes sdraw{to{stroke-dashoffset:0}}
.rb .spark .sdot{animation:sdot 1.8s ease-in-out .4s infinite}
@keyframes sdot{0%,100%{opacity:1}50%{opacity:.45}}
@media(prefers-reduced-motion:reduce){.rb .fl,.rb .opt.blue::after,.rb .spark .sdraw,.rb .spark .sdot,.rb .gr-ic .wave{animation:none}.rb .spark .sdraw,.rb .gr-ic .wave{stroke-dashoffset:0}}
/* 10X FUND-UP */
.rb .tenx{border:1px solid rgba(46,122,180,.24);border-radius:26px;padding:38px 26px;text-align:center;background:radial-gradient(680px 300px at 50% 0%,rgba(46,122,180,.14),transparent 60%)}
.rb .tenx .stat-row{margin-top:26px}
/* CARDS (community) */
.rb .grid3{display:grid;grid-template-columns:1fr;gap:16px;margin-top:34px}
@media(min-width:640px){.rb .grid3{grid-template-columns:1fr 1fr}}
@media(min-width:980px){.rb .grid3{grid-template-columns:1fr 1fr 1fr}}
.rb .card{border:1px solid rgba(255,255,255,.08);background:#0b0c12;border-radius:18px;padding:24px;display:flex;flex-direction:column}
.rb .card .ic{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:rgba(63,146,204,.12);border:1px solid rgba(63,146,204,.3)}
.rb .card.cyan .ic{background:rgba(107,180,226,.12);border-color:rgba(107,180,226,.3)}
.rb .card h3{font-size:17.5px;font-weight:800;margin-top:15px}
.rb .card p{color:rgba(255,255,255,.6);font-size:14px;line-height:1.6;margin-top:9px;flex:1}
/* TESTIMONIALS */
.rb .tcard{border:1px solid rgba(255,255,255,.08);background:#0b0c12;border-radius:18px;padding:22px}
.rb .tcard .stars-row{color:#7cbde6;font-size:14px;letter-spacing:2px}
.rb .tcard .q{color:rgba(255,255,255,.82);font-size:14.5px;line-height:1.65;margin-top:12px}
.rb .tcard .who{display:flex;align-items:center;gap:10px;margin-top:16px}
.rb .tcard .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#0d1420;background:linear-gradient(135deg,#3f92cc,#6bb4e2)}
.rb .tcard .nm{font-size:14px;font-weight:800}
.rb .tcard .hd{font-size:12px;color:rgba(255,255,255,.4)}
/* FINAL */
.rb .final{text-align:center;border:1px solid rgba(63,146,204,.22);border-radius:26px;padding:46px 22px;background:radial-gradient(600px 300px at 50% 0%,rgba(63,146,204,.12),transparent 60%)}
.rb .about{max-width:720px;margin:20px auto 0;text-align:center;color:rgba(255,255,255,.65);font-size:16px;line-height:1.75}
.rb footer{text-align:center;color:rgba(255,255,255,.35);font-size:12px;padding:32px 22px 50px;line-height:1.7}
/* PROOF GALLERY */
.rb .proofgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:22px}
@media(min-width:560px){.rb .proofgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:920px){.rb .proofgrid{grid-template-columns:repeat(4,1fr)}}
.rb .proofcard{position:relative;padding:0;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:#0a1018;aspect-ratio:3/4;cursor:pointer;transition:transform .22s,border-color .22s,box-shadow .22s}
.rb .proofcard img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;transition:transform .35s}
.rb .proofcard::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.4));opacity:.5;transition:opacity .22s}
.rb .proofcard:hover{transform:translateY(-4px);border-color:rgba(107,180,226,.5);box-shadow:0 20px 44px -22px rgba(107,180,226,.55)}
.rb .proofcard:hover img{transform:scale(1.06)}
.rb .proofcard:hover::after{opacity:0}
.rb .proofcard .pfz{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:9px;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:grid;place-items:center;font-size:14px;color:#fff;opacity:0;transform:scale(.8);transition:.2s;z-index:1}
.rb .proofcard:hover .pfz{opacity:1;transform:scale(1)}
/* GROWTH CALCULATOR */
.rb .calc{border:1px solid rgba(107,180,226,.2);border-radius:24px;padding:32px 24px;background:radial-gradient(680px 320px at 50% 0%,rgba(107,180,226,.1),transparent 60%),radial-gradient(560px 300px at 90% 100%,rgba(46,122,180,.08),transparent 60%)}
.rb .calcgrid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:26px}
@media(min-width:820px){.rb .calcgrid{grid-template-columns:1fr 1.1fr;align-items:center}}
.rb .calcin{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.02);border-radius:16px;padding:20px}
.rb .calcin label{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.55);margin:14px 0 8px}
.rb .calcin label:first-child{margin-top:0}
.rb .calcin label span{font-size:15px;font-weight:900;color:#b3daf4;letter-spacing:0;text-transform:none}
.rb .calcin input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;background:linear-gradient(90deg,#6bb4e2,#2a72a8);outline:none}
.rb .calcin input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #6bb4e2;box-shadow:0 3px 10px rgba(107,180,226,.6);cursor:pointer}
.rb .calcin input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #6bb4e2;cursor:pointer}
.rb .calcout{border:1px solid rgba(46,122,180,.28);background:linear-gradient(180deg,rgba(107,180,226,.06),rgba(46,122,180,.04));border-radius:16px;padding:18px}
.rb .calcspark{width:100%;height:120px;display:block}
.rb .calcres{display:flex;gap:12px;margin-top:12px}
.rb .calcres div{flex:1;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25);border-radius:12px;padding:12px 14px}
.rb .calcres span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.rb .calcres b{display:block;font-size:22px;font-weight:900;margin-top:4px;font-variant-numeric:tabular-nums}
.rb .calcres b.pos{color:#56a4d8}
@media(prefers-reduced-motion:reduce){.rb *{animation:none!important}}
`;

// Site backdrop — shared across the home + every info page.
//
// Was 42 dots pinned to a modulo grid on a CSS twinkle: pretty, but the same
// specks in the same places on every page, every load. It's the forexbrokercrm
// constellation now — particles drifting, wired to each other when they come
// close and to the cursor when it's near. The members panel and the admin desk
// already ran it, so the public site was the odd one out.
//
// Drawn in the brand's gold rather than forexbrokercrm's white — the same call
// goldrocktrades.com makes, and on a site where every heading, button and rule
// is gold, white stars read as a backdrop borrowed from somewhere else.
export function Stars() {
  return (
    <>
      <ConstellationBackground tint="63,146,204" />
      {/* rbglow: the class is what the 100lvh rule in ConstellationBackground reaches for — without
          it this layer stops where the browser toolbar starts and the strip below reads flat black. */}
      <div
        aria-hidden
        className="rbglow"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(1100px 650px at 70% -10%, rgba(107,180,226,.10), transparent 60%), radial-gradient(900px 600px at 10% 110%, rgba(46,122,180,.10), transparent 60%)",
        }}
      />
    </>
  );
}

// Shared top nav. `active` highlights the current info page.
export function SiteNav({ active }: { active?: string }) {
  return (
    <header className="nav">
      <div className="wrap navin">
        <a className="brand" href="/"><img src="/logo.svg" alt="Copy the Rich Trades" /><span>Copy the Rich Trades</span></a>
        <nav className="navlinks">
          {NAV_LINKS.map((l) => (<a key={l.href} href={l.href} className={active === l.href ? "on" : ""}>{l.label}</a>))}
        </nav>
        <div className="navr">
          <a className="ghost" href={LOGIN_URL}>Log in</a>
          <a className="btn sm" href={SIGNUP_PATH}>Get Started →</a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div>© Copy the Rich Trades · Learn free. Earn passively. Win together.</div>
      <p style={{ marginTop: 8, color: "rgba(255,255,255,.28)" }}>Trading leveraged products carries a substantial risk of loss. Only trade with capital you can afford to lose. Past performance is not indicative of future results.</p>
    </footer>
  );
}

export default function Home() {
  const [proofOpen, setProofOpen] = useState<number | null>(null);
  const PROOF = Array.from({ length: 12 }, (_, i) => `/proof/proof-${i + 1}.jpg`);
  return (
    <div className="rb">
      <style>{RB_CSS}</style>
      <Stars />
      <main>
        <SiteNav />

        <div className="wrap">
          {/* HERO — learn free + earn passively */}
          <div className="hero">
            <div className="logo-hero"><div className="halo" /><img src="/logo.svg" alt="Copy the Rich Trades" /></div>
            <h1>Learn While You Earn.<br /><span className="g">Passive Income From Day One.</span></h1>
            <p className="lede">Come in with zero experience. <b>Learn the markets for free</b>, earn <b>passive income</b> alongside a real community — then, when you're ready, fund up and trade with <b>10× leverage</b>. No challenge. No upfront fees. Keep 100% of your profits.</p>
            <div className="cta-row"><a className="btn lg" href={SIGNUP_PATH}>Start free →</a><a className="ghost lg" href={LOGIN_URL}>Log in</a></div>
            <div className="stat-row">
              <div className="stat"><div className="v">Free</div><div className="l">Education</div></div>
              <div className="stat"><div className="v">Passive</div><div className="l">Income</div></div>
              <div className="stat"><div className="v">100%</div><div className="l">Profits kept</div></div>
              <div className="stat"><div className="v">10×</div><div className="l">Leverage</div></div>
            </div>
          </div>

          {/* 1 · FREE EDUCATION (primary) */}
          <section id="education">
            <div className="edu">
              <div style={{ textAlign: "center" }}>
                <span className="free">100% Free</span>
                <h2>Learn the game — it costs nothing</h2>
                <p className="sub">Never traded before? Perfect. Come in, learn everything for free, and grow alongside people doing the exact same thing. No fees, no catch.</p>
              </div>
              <div className="edu-grid">
                {eduPoints.map((e, i) => (
                  <div key={i} className="ecard"><div className="ic">{e.ic}</div><h4>{e.t}</h4><p>{e.d}</p></div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 26 }}><a className="btn lg" href={SIGNUP_PATH}>Start learning free →</a></div>
            </div>
          </section>

          {/* 2 · TWO WAYS TO EARN — signals or the PAMM */}
          <section id="earn">
            <div className="sec-k">Earn while you learn</div>
            <h2>Two ways to make money</h2>
            <p className="sub">Want it hands-off, or want to take the plays yourself? Pick your lane — do one, or do both.</p>
            <div className="grid2">
              {/* PAMM — passive */}
              <div className="opt blue" id="goldrock">
                <div className="gr-ic" aria-label="GoldRock PAMM">
                  <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="grflame" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stopColor="#1f618d" /><stop offset=".55" stopColor="#2d86c1" /><stop offset="1" stopColor="#94caee" />
                      </linearGradient>
                      <linearGradient id="grwave" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#6bb4e2" /><stop offset=".5" stopColor="#2e7ab4" /><stop offset="1" stopColor="#2a72a8" />
                      </linearGradient>
                    </defs>
                    {/* animated blue flames */}
                    <path className="fl b" d="M12 40 C 14 33 10 31 11 26 C 13 29 15 29 15 33 C 16 30 16 28 15 26 C 18 29 19 34 18 38 C 17.5 40 15 41 12 40 Z" fill="url(#grflame)" opacity=".8" />
                    <path className="fl" d="M24 40 C 27 28 21 25 23 17 C 25 22 28 23 27 29 C 29 25 29 21 28 18 C 32 23 33 31 31 37 C 30 40 27 41 24 40 Z" fill="url(#grflame)" />
                    <path className="fl c" d="M36 40 C 38 33 34 31 35 26 C 37 29 39 29 39 33 C 40 30 40 28 39 26 C 42 29 43 34 42 38 C 41.5 40 39 41 36 40 Z" fill="url(#grflame)" opacity=".8" />
                    {/* Pulse waveform — the brand mark, riding on the blue flames */}
                    <path className="wave" d="M4 24 H14 l2.5 -11 l4.5 21 l4 -15 l2.5 5 H44" stroke="url(#grwave)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="tag">Fully passive</div>
                <h3>Join the GoldRock PAMM</h3>
                <p>Not ready to trade? Back the managed fund targeting <b>15%+ a month</b>. The desk trades, you compound — completely hands-off while you learn.</p>
                <div className="track">
                  <div className="tl"><b>GoldRock trajectory</b><em>compounding <i>15%+ / mo</i> target</em></div>
                  <svg className="spark" viewBox="0 0 260 46" preserveAspectRatio="none" fill="none">
                    <defs>
                      <linearGradient id="grsp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6bb4e2" /><stop offset=".5" stopColor="#2e7ab4" /><stop offset="1" stopColor="#2a72a8" /></linearGradient>
                      <linearGradient id="grfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(107,180,226,.28)" /><stop offset="1" stopColor="rgba(107,180,226,0)" /></linearGradient>
                    </defs>
                    <path d="M4,42 C40,40 58,36 92,31 C126,26 150,19 186,12 C214,7 238,5 256,3 L256,46 L4,46 Z" fill="url(#grfill)" />
                    <path className="sdraw" d="M4,42 C40,40 58,36 92,31 C126,26 150,19 186,12 C214,7 238,5 256,3" stroke="url(#grsp)" strokeWidth="2.4" strokeLinecap="round" />
                    <circle className="sdot" cx="256" cy="3" r="3.4" fill="#6bb4e2" />
                  </svg>
                </div>
                <ul>
                  <li>Zero trading required</li>
                  <li>The pros trade it for you</li>
                  <li>Withdraw your profits anytime</li>
                </ul>
                <a className="btn go" href={SIGNUP_PATH}>Join the PAMM →</a>
              </div>
              {/* SIGNALS — guided active */}
              <div className="opt cyan" id="taptotrade">
                <div className="oic">🎯</div>
                <div className="tag">Guided &amp; live</div>
                <h3>Join the Live Signals</h3>
                <p>Take the desk's daily plays — <b>entry, stop, target</b> spelled out. Tap once and it fires on your account, sized for you. Learn by doing, earn as you go.</p>
                <ul>
                  <li>Daily setups with the inner circle</li>
                  <li>One-tap execution — no charting</li>
                  <li>Real accountability, real momentum</li>
                </ul>
                <a className="btn go" href={SIGNUP_PATH}>Join the signals →</a>
              </div>
            </div>
          </section>

          {/* 2.5 · GROWTH CALCULATOR */}
          <section id="calculator"><GrowthCalc /></section>

          {/* 3 · FUND UP — 10X leverage (bottom) */}
          <section id="tenx">
            <div className="tenx">
              <div className="sec-k">When you're ready to size up</div>
              <h2>Fund up. Trade with 10× leverage.</h2>
              <p className="sub">Ready to trade your own size? Deposit and instantly trade with <b>10× the buying power</b> — keep 100% of your profits and pull your deposit out anytime. No challenge, no upfront fees.</p>
              <div className="stat-row">
                <div className="stat"><div className="v">10×</div><div className="l">Buying power</div></div>
                <div className="stat"><div className="v">$0</div><div className="l">Upfront fees</div></div>
                <div className="stat"><div className="v">100%</div><div className="l">Profits kept</div></div>
                <div className="stat"><div className="v">Anytime</div><div className="l">Withdrawals</div></div>
              </div>
              <div className="cta-row" style={{ marginTop: 26 }}><a className="btn lg" href={SIGNUP_PATH}>Get 10X Funded →</a></div>
            </div>
          </section>

          {/* COMMUNITY */}
          <section id="community">
            <div className="sec-k">The Community</div>
            <h2>You don't do it alone</h2>
            <p className="sub">The whole point. Come in, learn it all, earn together, and win as a team.</p>
            <div className="grid3">
              <div className="card"><div className="ic">⚡</div><h3>Live signals</h3><p>The desk posts setups — symbol, direction, entry. Tap to trade and it fires on your account, sized for you.</p></div>
              <div className="card cyan"><div className="ic">🗓️</div><h3>Daily calls</h3><p>Trade and learn together every day. Real setups, real accountability — not a course collecting dust.</p></div>
              <div className="card"><div className="ic">👑</div><h3>VIP access</h3><p>Once you're in, you're in — the private group where the plays happen and the wins get posted.</p></div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section id="testimonials">
            <div className="sec-k">Real members</div>
            <h2>Learning &amp; earning together</h2>
            <p className="sub">Passive income, free lessons, and wins stacked with the community.</p>
            <div className="grid3">
              {testimonials.map((t, i) => (
                <div key={i} className="tcard">
                  <div className="stars-row">{"★".repeat(t.r)}</div>
                  <div className="q">"{t.q}"</div>
                  <div className="who"><div className="av">{t.n.charAt(0)}</div><div><div className="nm">{t.n}</div><div className="hd">{t.h}</div></div></div>
                </div>
              ))}
            </div>

            {/* Real proof — screenshots straight from members' accounts */}
            <div style={{ marginTop: 40 }}>
              <div className="sec-k">Real proof</div>
              <h2 style={{ marginTop: 4 }}>Wins from the desk</h2>
              <p className="sub">Actual trades and P&amp;L from the signals — tap any to enlarge.</p>
              <div className="proofgrid">
                {PROOF.map((src, i) => (
                  <button key={i} className="proofcard" onClick={() => setProofOpen(i)} aria-label={`Proof ${i + 1}`}>
                    <img src={src} alt={`Proof ${i + 1}`} loading="lazy" />
                    <span className="pfz">⤢</span>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.3)", textAlign: "center" }}>Real results. Trading involves risk — past performance is not indicative of future results.</p>
            </div>
          </section>

          {/* FINAL */}
          <section id="about">
            <div className="final">
              <div className="sec-k">Your shot</div>
              <h2>Start free. Earn passively. Win together.</h2>
              <p className="about">Most people never learn the game or trade with enough size to change anything. Copy the Rich Trades flips that — <b style={{ color: "#7cbde6" }}>learn for free</b>, earn passive income with the fund and signals, and size up to <b style={{ color: "#7cbde6" }}>10× leverage</b> when you're ready. It's not a prop-firm challenge. It's your shot.</p>
              <div className="cta-row" style={{ marginTop: 26 }}><a className="btn lg" href={SIGNUP_PATH}>Start free →</a><a className="ghost lg" href={LOGIN_URL}>Log in</a></div>
            </div>
          </section>
        </div>

        <SiteFooter />
      </main>
      {proofOpen != null && (
        <div onClick={() => setProofOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 16, background: "rgba(6,8,14,.92)", backdropFilter: "blur(6px)" }}>
          <button onClick={() => setProofOpen(null)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 999, border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 20, cursor: "pointer" }}>✕</button>
          <button onClick={(e) => { e.stopPropagation(); setProofOpen((p) => (p == null ? p : (p - 1 + PROOF.length) % PROOF.length)); }} style={{ position: "absolute", left: 12, width: 44, height: 44, borderRadius: 999, border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 26, cursor: "pointer" }}>‹</button>
          <img src={PROOF[proofOpen]} alt="Proof" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "88vh", maxWidth: "92vw", borderRadius: 16, border: "1px solid rgba(255,255,255,.15)" }} />
          <button onClick={(e) => { e.stopPropagation(); setProofOpen((p) => (p == null ? p : (p + 1) % PROOF.length)); }} style={{ position: "absolute", right: 12, width: 44, height: 44, borderRadius: 999, border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 26, cursor: "pointer" }}>›</button>
        </div>
      )}
    </div>
  );
}

// Interactive compound-growth calculator — shows what the GoldRock PAMM's monthly compounding can do.
export function GrowthCalc() {
  const [start, setStart] = useState(1000);
  const [rate, setRate] = useState(15);
  const [months, setMonths] = useState(12);
  const r = Math.max(0, Math.min(100, rate)) / 100;
  const m = Math.max(1, Math.min(60, Math.round(months)));
  const s = Math.max(0, start) || 0;
  const series: number[] = [s];
  for (let i = 1; i <= m; i++) series.push(series[i - 1] * (1 + r));
  const final = series[m];
  const profit = final - s;
  const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const max = Math.max(...series), min = Math.min(...series);
  const pts = series.map((v, i) => {
    const x = (i / m) * 260;
    const y = 90 - ((v - min) / (max - min || 1)) * 84 - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div className="calc">
      <div className="sec-k" style={{ textAlign: "center" }}>Run the numbers</div>
      <h2 style={{ textAlign: "center" }}>The compounding calculator</h2>
      <p className="sub" style={{ textAlign: "center" }}>See what steady monthly growth does over time — the whole point of the GoldRock PAMM.</p>
      <div className="calcgrid">
        <div className="calcin">
          <label>Starting amount<span>{usd(s)}</span></label>
          <input type="range" min={100} max={50000} step={100} value={s} onChange={(e) => setStart(Number(e.target.value))} />
          <label>Monthly return<span>{rate}%</span></label>
          <input type="range" min={1} max={30} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          <label>Months<span>{m}</span></label>
          <input type="range" min={1} max={36} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
        </div>
        <div className="calcout">
          <svg className="calcspark" viewBox="0 0 260 92" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="cln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6bb4e2" /><stop offset="1" stopColor="#2a72a8" /></linearGradient>
              <linearGradient id="cfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(107,180,226,.3)" /><stop offset="1" stopColor="rgba(107,180,226,0)" /></linearGradient>
            </defs>
            <polygon points={`0,92 ${pts} 260,92`} fill="url(#cfl)" />
            <polyline points={pts} stroke="url(#cln)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="calcres">
            <div><span>Total growth</span><b className="pos">+{usd(profit)}</b></div>
            <div><span>Projected balance</span><b>{usd(final)}</b></div>
          </div>
          <a className="btn go" href={SIGNUP_PATH} style={{ width: "100%", marginTop: 4 }}>Start compounding →</a>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 14 }}>Illustration only — a projection at a chosen rate, not a guarantee. Returns vary and capital is at risk.</p>
    </div>
  );
}
