import { useEffect, useState, useRef, type ReactNode, type CSSProperties } from "react";
import { fetchSignals, postSignal, patchSignal, deleteSignal, fetchSessions, createSession, patchSession, deleteSession, fetchTapAccounts, tapExecute, tapLogin, fetchPositions, closePosition, modifyPosition, fetchNews, postNews, deleteNews, fetchTgFeed, enterUrl, type RtbSignal, type RtbSession, type MeStatus, type TapAccount, type TapPosition, type RtbNews, type RtbTgMsg } from "./api";

export const CSS = `
.rtd{--gold:#3f9fe0;--gold-hi:#d6efff;--blue:#459eda;--cy:#5ec8ff;--ink:#f6f1e4;--mut:#a8a49a}
.rtd *{box-sizing:border-box}
.rtd .h2{font-size:20px;font-weight:900;letter-spacing:-.01em;color:#fff}
.rtd .sub{color:var(--mut);font-size:13.5px;margin-top:4px}
.rtd .dchip{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ink);border:1px solid rgba(52,211,153,.25);background:rgba(52,211,153,.07);border-radius:12px;padding:9px 13px}
.rtd .dchip b{color:#fff;font-weight:900;font-variant-numeric:tabular-nums}
.rtd .dchip span{color:var(--mut)}
.rtd .dchip.pamm{border-color:rgba(63,159,224,.32);background:rgba(63,159,224,.08)}
/* -- Desk news & results ------------------------------------------------------
   A week the desk won is the most persuasive thing a member can be shown, so
   this card is built to be looked at rather than read: a brand edge that keeps
   moving, the headline pip count rolling up from zero, and each day's bar
   growing in sequence so the week lands as a shape before it lands as numbers.
   Every animation is switched off under prefers-reduced-motion at the end of
   this block, and the card stays fully legible without a single one. */
.rtd .newscard{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:radial-gradient(760px 230px at 10% -40%,rgba(63,159,224,.16),transparent 62%),linear-gradient(180deg,#090a11,#080910);border-radius:16px;padding:17px 18px;margin-bottom:12px;transition:transform .25s ease,box-shadow .25s ease}
.rtd .newscard:hover{transform:translateY(-2px);box-shadow:0 20px 50px -24px rgba(63,159,224,.55)}
/* Animated brand edge -- the mask-composite idiom the Tap-to-Trade modal uses:
   a gradient painted into the 1px padding ring only, so it reads as a lit border. */
.rtd .newscard::before{content:"";position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(130deg,rgba(63,159,224,.9),rgba(52,211,153,.3) 38%,rgba(214,239,255,.14) 58%,rgba(63,159,224,.85));background-size:240% 240%;animation:nedge 7s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes nedge{0%{background-position:0% 50%}100%{background-position:240% 50%}}
.rtd .newscard .nhead{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px}
.rtd .newscard .nt{font-weight:900;font-size:15.5px;color:#fff;letter-spacing:-.01em}
/* The headline figure. Tabular numerals so the roll-up cannot jitter the layout. */
.rtd .newscard .npips{position:relative;overflow:hidden;font-weight:900;font-size:13.5px;font-variant-numeric:tabular-nums;padding:5px 13px;border-radius:999px;white-space:nowrap;flex:none}
.rtd .newscard .npips.up{color:#04231a;background:linear-gradient(100deg,#34d399,#4fb5ee 55%,#94caee);box-shadow:0 0 0 1px rgba(79,181,238,.35),0 8px 26px -10px rgba(52,211,153,.9);animation:npulse 2.8s ease-in-out infinite}
.rtd .newscard .npips.dn{color:#fff;background:linear-gradient(100deg,#f43f5e,#fb7185);box-shadow:0 8px 26px -12px rgba(244,63,94,.9)}
.rtd .newscard .npips::after{content:"";position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:nshine 3.4s ease-in-out infinite;pointer-events:none}
@keyframes npulse{0%,100%{box-shadow:0 0 0 1px rgba(79,181,238,.35),0 8px 26px -10px rgba(52,211,153,.9)}50%{box-shadow:0 0 0 1px rgba(79,181,238,.62),0 10px 34px -8px rgba(52,211,153,1)}}
@keyframes nshine{0%{left:-70%}55%,100%{left:130%}}
.rtd .newscard .nbody{margin:10px 0 0;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.6;color:var(--ink);background:none;border:none;padding:0}
/* Structured weekly recap — compact rows instead of a full-page monospace dump. */
.rtd .newscard .nrecap{position:relative;margin:14px 0 0;display:flex;flex-direction:column;gap:3px}
/* Every row arrives on one stagger; --i is set inline from the row's index. */
.rtd .newscard .nrow,.rtd .newscard .ncday{animation:nrise .5s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*65ms)}
@keyframes nrise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.rtd .newscard .nrow{font-size:12.5px;line-height:1.45;padding:5px 9px;border-radius:7px;color:rgba(255,255,255,.72)}
.rtd .newscard .nrow.day{margin-top:8px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#d6efff;background:none;padding:2px 0 1px}
.rtd .newscard .nrow.day:first-child{margin-top:0}
.rtd .newscard .nrow.win{background:rgba(52,211,153,.08);border-left:2px solid rgba(52,211,153,.6);color:#aad3ee;font-weight:700}
.rtd .newscard .nrow.loss{background:rgba(248,113,113,.07);border-left:2px solid rgba(248,113,113,.5);color:#fecaca}
.rtd .newscard .nrow.sum{position:relative;overflow:hidden;margin-top:8px;background:linear-gradient(100deg,rgba(214,239,255,.14),rgba(52,211,153,.08));border:1px solid rgba(214,239,255,.28);font-weight:800;color:#fff}
.rtd .newscard .nrow.sum::after{content:"";position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);transform:skewX(-20deg);animation:nshine 5.5s ease-in-out infinite;pointer-events:none}
.rtd .newscard .nrow.text{color:rgba(255,255,255,.45);font-size:12px;padding:2px 0}
/* Compact one-line-per-day view: label, bar, result chip. The bar is the point --
   it turns five near-identical lines of text into the shape of the week. */
.rtd .newscard .ncday{display:grid;grid-template-columns:34px minmax(48px,1fr) auto;align-items:center;gap:11px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.rtd .newscard .ncd{font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#d6efff}
.rtd .newscard .nctrack{height:7px;border-radius:999px;background:rgba(255,255,255,.055);overflow:hidden}
.rtd .newscard .ncfill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(52,211,153,.75),#4fb5ee);box-shadow:0 0 14px -2px rgba(52,211,153,.8);width:0;transition:width .85s cubic-bezier(.22,1,.36,1);transition-delay:calc(var(--i,0)*65ms + 120ms)}
.rtd .newscard .ncfill.loss{background:linear-gradient(90deg,rgba(244,63,94,.7),#fb7185);box-shadow:0 0 14px -2px rgba(244,63,94,.75)}
.rtd .newscard .ncr{display:flex;flex-wrap:wrap;gap:6px;min-width:0;justify-content:flex-end}
.rtd .newscard .ncchip{font-size:12px;font-weight:800;padding:4px 11px;border-radius:999px;background:linear-gradient(100deg,rgba(52,211,153,.18),rgba(79,181,238,.1));border:1px solid rgba(52,211,153,.26);color:#aad3ee;white-space:nowrap;transition:transform .18s ease,border-color .18s ease}
.rtd .newscard .ncday:hover .ncchip{transform:translateX(-2px);border-color:rgba(79,181,238,.5)}
.rtd .newscard .ncchip.loss{background:linear-gradient(100deg,rgba(248,113,113,.18),rgba(244,63,94,.09));border-color:rgba(248,113,113,.28);color:#fecaca}
.rtd .newscard .ncchip.flat{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);color:rgba(255,255,255,.35)}
.rtd .newscard .nmore{margin-top:12px;align-self:flex-start;background:none;border:1px solid rgba(255,255,255,.14);border-radius:9px;color:rgba(255,255,255,.7);font-size:12px;font-weight:700;padding:7px 12px;cursor:pointer;transition:.18s}
.rtd .newscard .nmore:hover{color:#fff;border-color:rgba(214,239,255,.45);background:rgba(214,239,255,.07)}
.rtd .newscard .nfoot{position:relative;display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.06)}
@media(max-width:520px){.rtd .newscard .nctrack{display:none}.rtd .newscard .ncday{grid-template-columns:34px 1fr}}
@media(prefers-reduced-motion:reduce){
  .rtd .newscard::before,.rtd .newscard .npips,.rtd .newscard .npips::after,.rtd .newscard .nrow.sum::after{animation:none}
  .rtd .newscard .nrow,.rtd .newscard .ncday{animation:none}
  .rtd .newscard .ncfill{transition:none}
  .rtd .newscard:hover{transform:none}
}
.rtd .ticker{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#080910;margin-bottom:18px}
.rtd .tktrack{display:flex;width:max-content;animation:tkscroll 38s linear infinite}
.rtd .ticker:hover .tktrack{animation-play-state:paused}
@keyframes tkscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.rtd .tktrack{animation:none}}
.rtd .tk{flex:0 0 auto;padding:10px 16px;border-right:1px solid rgba(255,255,255,.05);display:flex;gap:8px;align-items:baseline;white-space:nowrap}
.rtd .tk .s{font-weight:800;font-size:12px;color:rgba(255,255,255,.55);letter-spacing:.04em}
.rtd .tk .p{font-weight:800;font-size:13px;color:#fff;font-variant-numeric:tabular-nums}
.rtd .tk .c{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums}
.rtd .up{color:#4fb5ee}.rtd .dn{color:#fb7185}
.rtd .sectlabel{display:flex;align-items:center;justify-content:space-between;margin:22px 0 12px}
.rtd .sectlabel .l{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:8px}
.rtd .live-dot{width:8px;height:8px;border-radius:50%;background:#fb7185;box-shadow:0 0 8px #fb7185;animation:pz 1.4s infinite}
@keyframes pz{0%,100%{opacity:1}50%{opacity:.35}}
.rtd .addbtn{height:32px;padding:0 13px;border:1px solid rgba(63,159,224,.35);background:rgba(63,159,224,.1);color:var(--gold-hi);border-radius:9px;font-weight:800;font-size:12px;cursor:pointer}
.rtd .grid{display:grid;gap:12px}
.rtd .sig{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.rtd .card{border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,#090a11,#080910);border-radius:16px;padding:16px;position:relative;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease}
.rtd .card:hover{transform:translateY(-3px);box-shadow:0 20px 44px -22px rgba(79,181,238,.45)}
/* LIVE card: a slowly-rotating gold gradient border (padding-box/border-box trick) + glow. */
.rtd .card.live{border:1.5px solid transparent;border-radius:16px;
  background:linear-gradient(180deg,#13100a,#080910) padding-box,linear-gradient(120deg,var(--gold),var(--blue),var(--cy),var(--gold-hi),var(--gold)) border-box;
  background-size:100% 100%,300% 100%;animation:rtbBorder 7s linear infinite;
  box-shadow:0 0 30px -10px rgba(63,159,224,.28),0 18px 46px -22px rgba(79,181,238,.5)}
@keyframes rtbBorder{to{background-position:0 0,300% 0}}
.rtd .card.live::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.05) 46%,rgba(214,239,255,.14) 50%,rgba(79,181,238,.08) 54%,transparent 68%);transform:translateX(-130%);animation:rtbSheen 5s ease-in-out infinite}
@keyframes rtbSheen{0%,58%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
.rtd .card.live>*{position:relative;z-index:1}
@media(prefers-reduced-motion:reduce){.rtd .card.live,.rtd .card.live::after{animation:none}}
.rtd .sighead{display:flex;align-items:center;justify-content:space-between;gap:8px}
.rtd .pair{font-family:ui-monospace,Menlo,monospace;font-weight:900;font-size:20px;letter-spacing:.01em;background:linear-gradient(92deg,#fff 30%,var(--gold-hi));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;text-shadow:0 0 22px rgba(63,159,224,.18)}
.rtd .side{font-size:10px;font-weight:900;letter-spacing:.06em;padding:3px 9px;border-radius:7px}
.rtd .side.BUY{color:#052e1a;background:linear-gradient(90deg,#34d399,#4fb5ee)}
.rtd .side.SELL{color:#2a0a10;background:linear-gradient(90deg,#fb7185,#f43f5e)}
.rtd .lvl{display:flex;gap:14px;margin-top:12px;font-size:12.5px}
.rtd .lvl div span{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.rtd .lvl div b{font-family:ui-monospace,Menlo,monospace;font-weight:800;color:var(--ink)}
.rtd .st{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.rtd .badge{font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:7px}
.rtd .badge.live{color:var(--gold-hi);background:rgba(63,159,224,.14);border:1px solid rgba(63,159,224,.38);animation:badgePulse 1.9s ease-out infinite}
@keyframes badgePulse{0%{box-shadow:0 0 0 0 rgba(63,159,224,.5)}70%{box-shadow:0 0 0 7px rgba(63,159,224,0)}100%{box-shadow:0 0 0 0 rgba(63,159,224,0)}}
@media(prefers-reduced-motion:reduce){.rtd .badge.live{animation:none}}
.rtd .badge.hit{color:#052e1a;background:linear-gradient(90deg,#34d399,#4fb5ee)}
.rtd .badge.sl{color:#fff;background:rgba(244,63,94,.7)}
.rtd .badge.closed{color:var(--mut);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
/* The desk's call is still LIVE, but THIS member is already in it — their card says so. */
.rtd .badge.inprog{color:#0b0d12;background:linear-gradient(90deg,#5ec8ff,#2a80bd);border:1px solid rgba(94,200,255,.5)}
.rtd .badge.expired{color:rgba(255,255,255,.55);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14)}
.rtd .card.expired{opacity:.66}
.rtd .expnote{font-size:12px;font-weight:700;line-height:1.5;color:#fda4af;background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.22);border-radius:9px;padding:9px 11px}
.rtd .ago{font-size:11px;color:var(--mut)}
.rtd .audbadge{font-size:9.5px;font-weight:900;letter-spacing:.04em;padding:3px 8px;border-radius:7px;margin-left:auto;margin-right:8px}
.rtd .audbadge.all{color:#4fb5ee;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.28)}
.rtd .audbadge.adm{color:#fda4af;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3)}
.rtd .hostrow{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
.rtd .mini{height:26px;padding:0 9px;border:1px solid rgba(255,255,255,.12);background:none;border-radius:7px;color:rgba(255,255,255,.6);font-size:11px;font-weight:800;cursor:pointer}
.rtd .mini:hover{color:#fff}.rtd .mini.del:hover{color:#fda4af;border-color:rgba(244,63,94,.4)}
.rtd .mini.navb{width:26px;padding:0;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center}
.rtd .mini.navb:disabled{opacity:.3;cursor:default}
.rtd .mini.navb:not(:disabled):hover{color:#d6efff;border-color:rgba(63,159,224,.45)}
.rtd .ndot{font-size:11px;font-weight:800;color:rgba(255,255,255,.45);font-variant-numeric:tabular-nums;min-width:26px;text-align:center}
.rtd .ses{border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,#090a11,#080910);border-radius:14px;padding:14px;display:flex;gap:13px;align-items:center;margin-bottom:10px}
.rtd .ses.live{border-color:rgba(251,113,133,.4)}
.rtd .savatar{flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#3f9fe0,#3f9fe0);display:flex;align-items:center;justify-content:center;font-size:19px}
.rtd .sinfo{flex:1;min-width:0}
.rtd .sinfo .t{font-weight:800;font-size:14.5px;color:#fff}
.rtd .sinfo .m{font-size:12px;color:var(--mut);margin-top:2px}
.rtd .join{height:36px;padding:0 16px;border:none;border-radius:10px;font-weight:800;font-size:13px;color:#0b0d12;background:linear-gradient(90deg,var(--gold),var(--gold-hi));cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.rtd .join.ghost{background:rgba(255,255,255,.05);color:var(--ink);border:1px solid rgba(255,255,255,.12)}
.rtd .tap{margin-top:22px;border:1px solid rgba(79,181,238,.3);background:linear-gradient(120deg,rgba(79,181,238,.08),rgba(42,128,189,.05));border-radius:16px;padding:22px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.rtd .tap .ico{font-size:34px}
.rtd .tap h3{margin:0;font-size:18px;font-weight:900;color:#fff}
.rtd .tap p{margin:5px 0 0;color:var(--mut);font-size:13.5px;max-width:52ch}
.rtd .tap a,.rtd .tap .tapcta{margin-left:auto;height:44px;padding:0 22px;border:none;border-radius:12px;font-weight:800;font-size:14px;color:#0b0d12;background:linear-gradient(90deg,var(--cy),#2a80bd);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;font-family:inherit}
.rtd .empty{color:var(--mut);font-size:13px;border:1px dashed rgba(255,255,255,.12);border-radius:12px;padding:22px;text-align:center}
.rtd .sigperf{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 14px}
.rtd .sigperf .pf{border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(63,159,224,.06),rgba(255,255,255,.015));border-radius:12px;padding:13px 12px;text-align:center}
.rtd .sigperf .pf b{display:block;font-size:23px;font-weight:900;color:#fff;line-height:1;font-variant-numeric:tabular-nums}
.rtd .sigperf .pf b.win{color:#4fb5ee}
.rtd .sigperf .pf b.gold{color:var(--gold-hi)}
.rtd .sigperf .pf b.livec{color:#fb7185}
.rtd .sigperf .pf span{display:block;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);margin-top:7px}
@media(max-width:560px){.rtd .sigperf{grid-template-columns:repeat(2,1fr)}}
.rtd .scrim{position:fixed;inset:0;z-index:70;background:rgba(3,3,5,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px}
.rtd .modal{width:100%;max-width:400px;background:#0b0e17;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:20px}
.rtd .modal h3{margin:0 0 14px;font-size:16px;font-weight:900;color:#fff}
.rtd .modal label{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin:12px 0 5px}
.rtd .modal input,.rtd .modal textarea,.rtd .modal select{width:100%;height:40px;border:1px solid rgba(255,255,255,.14);background:#050608;border-radius:10px;padding:0 12px;color:#fff;font-size:14px;outline:none;font-family:inherit}
.rtd .modal textarea{height:64px;padding:9px 12px;resize:vertical}
.rtd .modal input:focus,.rtd .modal textarea:focus{border-color:rgba(94,200,255,.4)}
.rtd .modal .two{display:flex;gap:10px}
.rtd .modal .two>*{flex:1}
.rtd .modal .actions{display:flex;gap:10px;margin-top:18px}
.rtd .modal .save{flex:1;height:42px;border:none;border-radius:11px;font-weight:800;color:#0b0d12;background:linear-gradient(90deg,var(--gold),var(--gold-hi));cursor:pointer}
.rtd .modal .cancel{height:42px;padding:0 16px;border:1px solid rgba(255,255,255,.14);background:none;border-radius:11px;color:var(--ink);cursor:pointer;font-weight:700}
.rtd .modal.confirm{max-width:360px;text-align:center}
.rtd .modal.confirm .cf-ico{font-size:36px;line-height:1;margin-bottom:6px}
.rtd .modal.confirm .cf-sub{color:var(--mut);font-size:13px;line-height:1.55;margin:6px 0 2px}
.rtd .modal.confirm .actions{margin-top:16px}
.rtd .modal .save.danger{background:linear-gradient(90deg,#fb7185,#f43f5e);color:#fff}
.rtd .modal .save:disabled,.rtd .modal .cancel:disabled{opacity:.6;cursor:default}
.rtd .segbtns{display:flex;gap:6px}
.rtd .segbtns button{flex:1;height:40px;border:1px solid rgba(255,255,255,.14);background:#050608;border-radius:10px;color:var(--mut);font-weight:800;cursor:pointer}
.rtd .segbtns button.on.buy{border-color:#34d399;color:#4fb5ee;background:rgba(52,211,153,.1)}
.rtd .segbtns button.on.sell{border-color:#fb7185;color:#fda4af;background:rgba(251,113,133,.1)}
.rtd .tapline{margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.06)}
.rtd .tradebtn{position:relative;overflow:hidden;width:100%;height:42px;border:none;border-radius:12px;font-weight:900;font-size:13.5px;color:#0b0d12;background:linear-gradient(90deg,#3f9fe0,#d6efff,#3f9fe0);background-size:200% 100%;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 10px 26px -12px rgba(63,159,224,.75);animation:tbFlow 5s linear infinite}
@keyframes tbFlow{to{background-position:200% 0}}
.rtd .tradebtn::after{content:"";position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg) translateX(-260%);animation:tbShine 3.6s ease-in-out infinite}
@keyframes tbShine{0%,55%{transform:skewX(-18deg) translateX(-260%)}100%{transform:skewX(-18deg) translateX(330%)}}
.rtd .tradebtn:hover{filter:brightness(1.05)}
.rtd .tradebtn:disabled{opacity:.5;animation:none;box-shadow:none}
.rtd .tradebtn:disabled::after{display:none}
@media(prefers-reduced-motion:reduce){.rtd .tradebtn{animation:none}.rtd .tradebtn::after{display:none}}
.rtd .modal .accpick{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.rtd .modal .acc{display:flex;align-items:center;justify-content:space-between;gap:10px;height:46px;padding:0 14px;border:1px solid rgba(255,255,255,.14);background:#050608;border-radius:11px;cursor:pointer;color:var(--ink)}
.rtd .modal .acc.on{border-color:rgba(63,159,224,.5);background:rgba(63,159,224,.08)}
.rtd .modal .acc .b{font-variant-numeric:tabular-nums;color:var(--mut);font-size:12.5px}
.rtd .modal .note2{font-size:12px;color:var(--mut);margin-top:12px;line-height:1.5}
.rtd .modal .res{margin-top:12px;padding:11px 13px;border-radius:10px;font-size:13px;font-weight:700}
.rtd .modal .res.ok{color:#6ee7b7;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3)}
.rtd .modal .res.err{color:#fda4af;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3)}
.rtd .acctbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid rgba(255,255,255,.09);background:#0b0f1a;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.rtd .addacct{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.rtd .addbtn2{height:34px;padding:0 14px;border-radius:10px;border:1px solid rgba(94,200,255,.35);background:rgba(94,200,255,.1);color:var(--cy);font-weight:800;font-size:12.5px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;font-family:inherit}
.rtd .addbtn2:hover{background:rgba(94,200,255,.16)}
.rtd .addbtn2:disabled{opacity:.6;cursor:default}
.rtd .addbtn2.ghost{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:var(--ink)}
.rtd .acctbar .lab{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.rtd .acctsel{height:36px;border:1px solid rgba(255,255,255,.14);background:#050608;border-radius:10px;color:#fff;padding:0 10px;font-size:13px;font-family:inherit}
.rtd .acctbar .bal{margin-left:auto;font-weight:900;font-variant-numeric:tabular-nums;color:#fff;font-size:16px}
.rtd .acctbar .bal span{font-size:11px;color:var(--mut);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-right:6px}
.rtd .poshead{display:flex;align-items:center;justify-content:space-between;margin:6px 0 10px}
.rtd .poshead .l{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--cy)}
.rtd .closeall{height:30px;padding:0 12px;border:1px solid rgba(244,63,94,.35);background:rgba(244,63,94,.08);color:#fda4af;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer}
.rtd .poswrap{border:1px solid rgba(255,255,255,.09);background:#080910;border-radius:14px;overflow:hidden}
.rtd .posrow{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05)}
.rtd .posrow:last-child{border-bottom:none}
.rtd .pos-sym{font-family:ui-monospace,Menlo,monospace;font-weight:900;color:#fff;min-width:74px}
.rtd .pos-side{font-size:10px;font-weight:900;letter-spacing:.05em;padding:2px 7px;border-radius:6px}
.rtd .pos-side.buy{color:#052e1a;background:linear-gradient(90deg,#34d399,#4fb5ee)}
.rtd .pos-side.sell{color:#2a0a10;background:linear-gradient(90deg,#fb7185,#f43f5e)}
.rtd .pos-lots{font-size:12.5px;color:var(--mut);font-variant-numeric:tabular-nums}
.rtd .pnl{margin-left:auto;font-weight:900;font-variant-numeric:tabular-nums}
.rtd .closebtn{height:30px;padding:0 12px;border:1px solid rgba(244,63,94,.35);background:rgba(244,63,94,.08);color:#fda4af;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer}
.rtd .tpladder{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
.rtd .tpchip{display:inline-flex;align-items:center;gap:5px;font-family:ui-monospace,Menlo,monospace;font-weight:800;font-size:12px;color:var(--ink);background:linear-gradient(180deg,rgba(52,211,153,.14),rgba(94,200,255,.06));border:1px solid rgba(79,181,238,.3);border-radius:8px;padding:3px 9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.rtd .tpchip i{font-style:normal;font-size:9px;font-weight:900;letter-spacing:.06em;color:#4fb5ee;opacity:.95}
.rtd .deskcard{border:1px solid rgba(63,159,224,.28);background:linear-gradient(120deg,rgba(63,159,224,.07),rgba(63,159,224,.02));border-radius:16px;padding:16px 18px;margin-bottom:18px}
.rtd .deskcard .dh{font-weight:900;font-size:13.5px;color:var(--gold-hi);margin-bottom:10px}
.rtd .deskcard ul{margin:0;padding-left:18px;display:grid;gap:6px}
.rtd .deskcard li{color:var(--mut);font-size:13px;line-height:1.5}
.rtd .deskcard li b{color:#fff}
.rtd .deskrules{border:1px solid rgba(63,159,224,.3);background:rgba(63,159,224,.08);border-radius:11px;padding:11px 13px;font-size:12.5px;line-height:1.55;color:var(--ink);margin-bottom:6px}
.rtd .deskrules b{color:var(--gold-hi)}
.rtd .lvlrow{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding:9px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#050608}
.rtd .lvlrow span{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.rtd .lvlrow b{font-family:ui-monospace,Menlo,monospace;font-weight:800;color:#fff}
.rtd .lvlrow.sl{border-color:rgba(244,63,94,.35);background:rgba(244,63,94,.06)}
.rtd .lvlrow.sl b{color:#fda4af}
.rtd .tppick{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.rtd .tpc{display:flex;flex-direction:column;align-items:center;gap:2px;height:46px;border:1px solid rgba(255,255,255,.14);background:#050608;border-radius:10px;color:var(--mut);font-size:11px;font-weight:900;letter-spacing:.05em;cursor:pointer;font-family:inherit}
.rtd .tpc span{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;font-weight:800;color:var(--ink)}
.rtd .tpc.on{border-color:#34d399;background:rgba(52,211,153,.1);color:#4fb5ee}
.rtd .tpc.on span{color:#fff}
.rtd .tpgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.rtd .tpin{display:flex;flex-direction:column;gap:3px}
.rtd .tpin span{font-size:10px;font-weight:900;letter-spacing:.06em;color:var(--mut)}
.rtd .tpin input{height:38px}
.rtd .modal.wide{max-width:440px}
.rtd .placing{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:26px 10px 20px}
.rtd .placing b{color:#fff;font-size:15px;font-weight:900}
.rtd .placing span{color:var(--mut);font-size:12.5px}
.rtd .pspin{width:38px;height:38px;border-radius:50%;border:3px solid rgba(94,200,255,.18);border-top-color:var(--cy);animation:pspin .8s linear infinite}
.rtd .pspin.sm{width:15px;height:15px;border-width:2px;display:inline-block;vertical-align:-2px;margin-right:6px}
@keyframes pspin{to{transform:rotate(360deg)}}
.rtd .tlopen{margin-top:12px;font-size:12.5px;color:var(--mut);line-height:1.55;text-align:center}
.rtd .tlwait{color:var(--cy);font-weight:700}
.rtd .tlbtn{display:inline-flex;align-items:center;justify-content:center;margin-top:10px;height:40px;padding:0 18px;border-radius:11px;font-weight:800;font-size:13.5px;color:#0b0d12;background:linear-gradient(90deg,var(--cy),#2a80bd);text-decoration:none}
.rtd .modal .pastebox{height:96px;padding:10px 12px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.5;resize:vertical}
/* ---- Tap to Trade: premium glam pass (scoped to the tap modal via :has) ---- */
.rtd .modal:has(.taphd){max-width:424px;background:radial-gradient(130% 80% at 50% -12%,rgba(94,200,255,.16),transparent 62%),radial-gradient(120% 90% at 100% 110%,rgba(42,131,190,.12),transparent 60%),#080910;border:1px solid transparent;position:relative;box-shadow:0 32px 90px -20px rgba(0,0,0,.88),0 0 60px -30px rgba(94,200,255,.5)}
.rtd .modal:has(.taphd)::before{content:"";position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(130deg,rgba(94,200,255,.75),rgba(42,131,190,.35) 42%,rgba(42,128,189,.2) 62%,rgba(94,200,255,.7));background-size:200% 200%;animation:tapedge 6s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes tapedge{0%{background-position:0% 0%}100%{background-position:200% 200%}}
.rtd .taphd{margin:0 0 16px}
.rtd .taphd-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;background:linear-gradient(90deg,var(--cy),#2a80bd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.rtd .taphd .bolt{color:var(--cy);filter:drop-shadow(0 0 7px rgba(94,200,255,.85))}
.rtd .taphd-main{display:flex;align-items:center;gap:11px;margin-top:8px}
.rtd .taphd-pair{font-size:25px;font-weight:900;letter-spacing:-.01em;color:#fff;font-family:ui-monospace,Menlo,monospace;text-shadow:0 2px 20px rgba(94,200,255,.28)}
.rtd .sidepill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:900;letter-spacing:.08em;padding:5px 11px 5px 9px;border-radius:999px}
.rtd .sidepill i{width:7px;height:7px;border-radius:50%;animation:sidep 1.6s ease-in-out infinite}
.rtd .sidepill.buy{color:#6ee7b7;background:rgba(52,211,153,.13);border:1px solid rgba(52,211,153,.42)}
.rtd .sidepill.buy i{background:#34d399;box-shadow:0 0 9px #34d399}
.rtd .sidepill.sell{color:#fda4af;background:rgba(244,63,94,.13);border:1px solid rgba(244,63,94,.42)}
.rtd .sidepill.sell i{background:#f43f5e;box-shadow:0 0 9px #f43f5e}
@keyframes sidep{0%,100%{opacity:1}50%{opacity:.35}}
.rtd .modal:has(.taphd) .lvlrow{padding:11px 14px;border-radius:12px}
.rtd .modal:has(.taphd) .lvlrow b{font-size:16px}
.rtd .modal:has(.taphd) .lvlrow.sl{animation:slpulse 2.6s ease-in-out infinite}
@keyframes slpulse{0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0)}50%{box-shadow:0 0 18px -3px rgba(244,63,94,.4)}}
.rtd .modal:has(.taphd) .tpc.on{box-shadow:0 0 15px -3px rgba(52,211,153,.5)}
.rtd .modal:has(.taphd) .acc.on{box-shadow:0 0 15px -4px rgba(94,200,255,.5)}
.rtd .modal:has(.taphd) .save{height:52px;font-size:15px;letter-spacing:.02em;color:#0b0d12;background:linear-gradient(92deg,var(--cy),#2a80bd 55%,#2d86c1);background-size:180% 100%;position:relative;overflow:hidden;box-shadow:0 12px 34px -8px rgba(94,200,255,.65),inset 0 1px 0 rgba(255,255,255,.45);transition:transform .12s ease,box-shadow .2s ease;animation:tbFlow 5s linear infinite}
.rtd .modal:has(.taphd) .save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 20px 48px -8px rgba(94,200,255,.85),inset 0 1px 0 rgba(255,255,255,.55)}
.rtd .modal:has(.taphd) .save:active:not(:disabled){transform:translateY(0)}
.rtd .modal:has(.taphd) .save:disabled{opacity:.5;box-shadow:none}
.rtd .modal:has(.taphd) .save::after{content:"";position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);animation:shimmer 2.8s ease-in-out infinite}
@keyframes shimmer{0%{left:-60%}55%,100%{left:135%}}
@media (prefers-reduced-motion:reduce){.rtd .sidepill i,.rtd .modal:has(.taphd) .lvlrow.sl,.rtd .modal:has(.taphd) .save::after{animation:none}}
.rtd .pasteok{margin-top:8px;font-size:12px;font-weight:700;color:#4fb5ee;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);border-radius:9px;padding:8px 11px}
.rtd .modeseg{display:flex;gap:6px;margin:4px 0 14px;background:#050608;border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:4px}
.rtd .modeseg button{flex:1;height:38px;border:none;background:transparent;border-radius:8px;color:var(--mut);font-weight:800;font-size:12.5px;cursor:pointer;transition:.15s}
.rtd .modeseg button.on{background:linear-gradient(90deg,var(--cy),#2a80bd);color:#0b0d12}
.rtd .presethint{font-size:12.5px;line-height:1.55;color:#a3cbe5;background:rgba(94,200,255,.07);border:1px solid rgba(94,200,255,.25);border-radius:11px;padding:11px 13px;margin:2px 0 14px}
.rtd .presetprev{margin-top:12px;font-size:12.5px;color:var(--mut);background:#090a11;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px}
.rtd .presetprev b{color:#fff;font-family:ui-monospace,Menlo,monospace}
.rtd .rrow{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 2px}
.rtd .rchip{padding:8px 13px;border-radius:9px;font-size:12.5px;font-weight:800;cursor:pointer;background:#090a11;border:1px solid rgba(255,255,255,.12);color:#ded9cf}
.rtd .rchip.on{background:rgba(94,200,255,.14);border-color:rgba(94,200,255,.5);color:var(--cy)}
.rtd .presetbadge{margin-left:auto;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--cy);background:rgba(94,200,255,.12);border:1px solid rgba(94,200,255,.35);border-radius:999px;padding:3px 8px}
.rtd .tgbadge{margin-left:auto;font-size:10px;font-weight:900;letter-spacing:.04em;color:#8fc8ee;background:rgba(42,128,189,.14);border:1px solid rgba(42,128,189,.4);border-radius:999px;padding:3px 8px}
.rtd .tgbadge + .presetbadge{margin-left:6px}
.rtd .card.fromtg{border-color:rgba(42,128,189,.4);background:radial-gradient(340px 120px at 100% 0,rgba(42,128,189,.1),transparent 60%),#0a0b10;box-shadow:0 18px 44px -30px rgba(42,128,189,.6)}
/* ---- Telegram desk feed (live from the channel) ---- */
.rtd .tgdesk{position:relative;border-radius:18px;padding:1.4px;background:linear-gradient(120deg,rgba(42,128,189,.6),rgba(94,200,255,.5),rgba(42,128,189,.55));background-size:300% 300%;animation:tgedge 8s linear infinite;box-shadow:0 20px 50px -30px rgba(42,128,189,.6);margin-bottom:18px}
@keyframes tgedge{0%{background-position:0 50%}100%{background-position:300% 50%}}
.rtd .tgdesk-in{background:#080910;border-radius:17px;overflow:hidden}
.rtd .tgdesk-hd{display:flex;align-items:center;gap:9px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(90deg,rgba(42,128,189,.1),transparent)}
.rtd .tgdesk-hd .tgi{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#3e9ad8,#175a8c);display:flex;align-items:center;justify-content:center;font-size:14px}
.rtd .tgdesk-hd b{font-size:14px;color:#fff;font-weight:900}
.rtd .tgdesk-hd .live-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;animation:badgePulse 1.9s ease-out infinite;margin-left:auto}
.rtd .tgdesk-hd .lt{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6ee7b7}
.rtd .tgdesk-body{max-height:300px;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:7px}
.rtd .tgmsg{background:#13100a;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:9px 12px}
.rtd .tgmsg.sig{border-color:rgba(42,128,189,.35);background:radial-gradient(260px 80px at 0 0,rgba(42,128,189,.1),transparent 60%),#13100a}
.rtd .tgmsg .tgtop{display:flex;align-items:center;gap:7px;margin-bottom:3px}
.rtd .tgmsg .tgtop .nm{font-size:11.5px;font-weight:800;color:#8fc8ee}
.rtd .tgmsg .tgtop .sg{font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#6ee7b7;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:999px;padding:2px 6px}
.rtd .tgmsg.trg{border-color:rgba(52,211,153,.5);background:radial-gradient(280px 90px at 0 0,rgba(52,211,153,.12),transparent 60%),#13100a;box-shadow:0 0 0 1px rgba(52,211,153,.2) inset}
.rtd .tgmsg .tgtop .sg.trg{color:#0b0d12;background:linear-gradient(90deg,#34d399,#4fb5ee);border-color:transparent}
.rtd .tgmsg .tgtrg{margin-top:7px;font-size:11px;font-weight:700;color:#6ee7b7;border-top:1px dashed rgba(52,211,153,.25);padding-top:6px}
.rtd .tgmsg .tgtop .ago{margin-left:auto;font-size:10px;color:var(--mut)}
.rtd .tgmsg .tgtext{font-size:12.5px;line-height:1.5;color:#dfe6f2;white-space:pre-wrap;word-break:break-word}
.rtd .tgdesk-foot{padding:9px 14px;border-top:1px solid rgba(255,255,255,.06);text-align:center}
.rtd .tgdesk-foot a{font-size:12px;font-weight:800;color:#8fc8ee}
.rtd .tgdesk-empty{padding:22px;text-align:center;color:var(--mut);font-size:13px}
.rtd .presetline{margin:10px 0 0;font-size:12.5px;line-height:1.5;color:var(--mut)}
.rtd .presetline b{color:#fff;font-family:ui-monospace,Menlo,monospace}
.rtd .pastediv{display:flex;align-items:center;gap:10px;margin:16px 0 2px}
.rtd .pastediv::before,.rtd .pastediv::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.1)}
.rtd .pastediv span{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
/* ---- Signal card: "in progress" state (member already fired this call) ---- */
.rtd .tapline.inprog{display:flex;flex-direction:column;gap:8px}
.rtd .ipbar{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;color:var(--cy);letter-spacing:.02em}
.rtd .ipdot{width:8px;height:8px;border-radius:50%;background:var(--cy);box-shadow:0 0 9px var(--cy);animation:sidep 1.6s ease-in-out infinite}
.rtd .ipsize{color:var(--mut);font-weight:700}
.rtd .ippnl{margin-left:auto;font-weight:900;font-family:ui-monospace,Menlo,monospace}
.rtd .ippnl.up{color:#6ee7b7}.rtd .ippnl.dn{color:#fca5a5}
.rtd .iprow{display:flex;gap:8px}
.rtd .ipbtn{flex:1;height:38px;border-radius:11px;font-weight:800;font-size:12.5px;cursor:pointer;border:1px solid transparent;transition:.15s}
.rtd .ipbtn.mod{color:#0b0d12;background:linear-gradient(90deg,var(--cy),#2a80bd)}
.rtd .ipbtn.mod:hover{filter:brightness(1.06)}
.rtd .ipbtn.close{background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.4);color:#fca5a5}
.rtd .ipbtn.close:hover{background:rgba(244,63,94,.18)}
.rtd .mgstat{display:flex;gap:10px;margin:6px 0 14px}
.rtd .mgstat>div{flex:1;background:#090a11;border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:9px 11px}
.rtd .mgstat span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin-bottom:3px}
.rtd .mgstat b{font-size:15px;color:#fff;font-family:ui-monospace,Menlo,monospace}
.rtd .mgstat b.up{color:#6ee7b7}.rtd .mgstat b.dn{color:#fca5a5}
.rtd .tppick{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}
.rtd .tppick .tpc{padding:7px 11px;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;background:#090a11;border:1px solid rgba(255,255,255,.12);color:#ded9cf}
.rtd .tppick .tpc.on{background:rgba(94,200,255,.14);border-color:rgba(94,200,255,.5);color:var(--cy)}
.rtd .cancel.danger{color:#fca5a5;border-color:rgba(244,63,94,.4)}
`;

const TICK = [
  { id: "bitcoin", s: "BTC" }, { id: "ethereum", s: "ETH" }, { id: "solana", s: "SOL" },
  { id: "ripple", s: "XRP" }, { id: "binancecoin", s: "BNB" }, { id: "cardano", s: "ADA" }, { id: "dogecoin", s: "DOGE" },
];
function ago(iso: string): string {
  try { const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now"; const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`; return `${Math.floor(h / 24)}d ago`;
  } catch { return ""; }
}
function whenLabel(iso?: string | null): string {
  if (!iso) return "Time TBA";
  try { return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return ""; }
}

export function Ticker() {
  const [px, setPx] = useState<Record<string, { p: number; c: number }>>({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const ids = TICK.map((t) => t.id).join(",");
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (!r.ok) return; const d = await r.json();
        if (!alive) return;
        const m: Record<string, { p: number; c: number }> = {};
        for (const t of TICK) if (d[t.id]) m[t.s] = { p: d[t.id].usd, c: d[t.id].usd_24h_change || 0 };
        setPx(m);
      } catch {}
    };
    load(); const iv = setInterval(load, 45000); return () => { alive = false; clearInterval(iv); };
  }, []);
  // Duplicate the row so the marquee loops seamlessly (translateX -50%).
  const row = (dup: boolean) => TICK.map((t) => { const v = px[t.s]; const up = (v?.c ?? 0) >= 0;
    return (
      <div className="tk" key={(dup ? "b" : "a") + t.s} aria-hidden={dup}>
        <span className="s">{t.s}</span>
        <span className="p">{v ? "$" + v.p.toLocaleString(undefined, { maximumFractionDigits: v.p < 5 ? 4 : 2 }) : "—"}</span>
        {v && <span className={`c ${up ? "up" : "dn"}`}>{up ? "▲" : "▼"} {Math.abs(v.c).toFixed(2)}%</span>}
      </div>
    );
  });
  return <div className="ticker"><div className="tktrack">{row(false)}{row(true)}</div></div>;
}

const STATUS_LABEL: Record<string, string> = { live: "Live", tp1: "TP1 Hit", tp2: "TP2 Hit", tp3: "TP3 Hit", tp4: "TP4 Hit", tp5: "TP5 Hit", tp6: "TP6 Hit", running: "Running", sl: "SL", be: "Break-even", closed: "Closed" };
function statusClass(s: string) { return s === "live" ? "live" : s === "sl" ? "sl" : s === "closed" || s === "be" ? "closed" : "hit"; }
/* A live call is only valid to enter for a short window after it drops. After that the price has moved — entering late is a losing setup. */
const SIGNAL_ENTRY_WINDOW_MIN = 20;
function isSignalExpired(iso: string): boolean {
  try { const t = new Date(iso).getTime(); return isFinite(t) && (Date.now() - t) > SIGNAL_ENTRY_WINDOW_MIN * 60 * 1000; } catch { return false; }
}

const SIG_SYMBOLS = ["XAUUSD", "XAGUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "EURJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "US30", "NAS100", "SPX500", "GER40", "USOIL", "BTCUSD", "ETHUSD"];

// Parse a raw Telegram-style Gold Pulse signal, e.g.:
//   XAUUSD BUY 4019/4009
//   TP1. @ 4013 … TP6. @ 4300
//   SL @ 3999
// Fills whatever it can recognise; leaves unmatched fields untouched.
type ParsedSignal = { pair?: string; side?: "BUY" | "SELL"; ez1?: string; ez2?: string; tps?: string[]; sl?: string };
function parseSignalText(text: string): ParsedSignal {
  const NUM = "([0-9]+(?:\\.[0-9]+)?)";
  const out: ParsedSignal = {};
  const tps = ["", "", "", "", "", ""];
  let gotTp = false;
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim(); if (!line) continue;
    const up = line.toUpperCase();
    // Stop loss (must not be a TP line). Separator class includes \s so "SL   @ 3999" parses.
    let m = up.match(new RegExp(`\\bSL\\b[\\s:@=.-]*${NUM}`));
    if (m && !/\bTP/.test(up)) { out.sl = m[1]; continue; }
    // Take-profit rung: "TP3. @ 4021" — separator class includes \s so ". @ " is consumed.
    m = up.match(new RegExp(`\\bTP\\s*([1-6])\\b[\\s.:@=)-]*${NUM}`));
    if (m) { tps[Number(m[1]) - 1] = m[2]; gotTp = true; continue; }
    // Header line carrying BUY/SELL: pair (before) + entry zone (after)
    const sm = up.match(/\b(BUY|SELL)\b/);
    if (sm && sm.index != null) {
      out.side = sm[1] as "BUY" | "SELL";
      const before = up.slice(0, sm.index);
      const known = SIG_SYMBOLS.find((s) => before.replace(/[^A-Z0-9]/g, "").includes(s));
      const pm = before.match(/([A-Z]{3,10}(?:\/[A-Z]{2,6})?|[A-Z]+[0-9]{2,3})/);
      out.pair = known || (pm ? pm[1].replace(/\//g, "") : undefined);
      // Entry zone = the first one or two numbers after BUY/SELL, whatever separates them (/ - space).
      const after = line.slice(sm.index + sm[0].length);
      const nums = after.match(/[0-9]+(?:\.[0-9]+)?/g) || [];
      if (nums[0]) out.ez1 = nums[0];
      if (nums[1]) out.ez2 = nums[1];
    }
  }
  if (gotTp) out.tps = tps;
  return out;
}

export function SignalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pair, setPair] = useState("XAUUSD"); const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [ez1, setEz1] = useState(""); const [ez2, setEz2] = useState("");
  const [tps, setTps] = useState<string[]>(["", "", "", "", "", ""]);
  const [sl, setSl] = useState(""); const [lots, setLots] = useState("0.01"); const [note, setNote] = useState("");
  const [raw, setRaw] = useState(""); const [pasted, setPasted] = useState(false);
  const [audience, setAudience] = useState<"all" | "admins">("all");
  const [mode, setMode] = useState<"levels" | "preset">("levels");
  const [risk, setRisk] = useState(""); const [tpStep, setTpStep] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const setTpAt = (i: number, v: string) => setTps((a) => a.map((x, j) => (j === i ? v : x)));
  // Paste a raw Telegram signal → auto-fill every field it can recognise.
  const applyPaste = (text: string) => {
    setRaw(text);
    const p = parseSignalText(text);
    const hit = !!(p.pair || p.side || p.ez1 || p.sl || p.tps);
    if (p.pair && SIG_SYMBOLS.includes(p.pair)) setPair(p.pair);
    if (p.side) setSide(p.side);
    if (p.ez1 != null) setEz1(p.ez1);
    if (p.ez2 != null) setEz2(p.ez2);
    if (p.sl) setSl(p.sl);
    if (p.tps) setTps(p.tps);
    setPasted(text.trim().length > 0 && hit);
  };
  const save = async () => {
    if (!pair.trim() || busy) return;
    if (mode === "preset") {
      if (!(Number(risk) > 0)) { setErr("Set the risk (stop distance in points) — that's what the auto-stop uses."); return; }
      setErr(""); setBusy(true);
      const ok = await postSignal({ pair, side, lots, note, audience, preset: true, riskPts: Number(risk), tpPts: Number(tpStep) > 0 ? Number(tpStep) : null } as any);
      setBusy(false);
      if (ok) { onSaved(); onClose(); } else setErr("Couldn't post signal");
      return;
    }
    if (!sl.trim()) { setErr("SL is required — the desk rule is every call ships with a stop."); return; }
    setErr(""); setBusy(true);
    // Entry zone posts as "hi / lo" (matches the Telegram "4051/4041" format); TP ladder posts as an array.
    const entry = [ez1.trim(), ez2.trim()].filter(Boolean).join(" / ");
    const cleanTps = tps.map((t) => t.trim()).filter(Boolean);
    const ok = await postSignal({ pair, side, entry, tps: cleanTps, sl, lots, note, audience }); setBusy(false);
    if (ok) { onSaved(); onClose(); } else setErr("Couldn't post signal");
  };
  return (
    <div className="scrim" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h3>Post a Gold Pulse signal</h3>
      <div className="modeseg">
        <button className={mode === "levels" ? "on" : ""} onClick={() => setMode("levels")}>Levels (entry / TP / SL)</button>
        <button className={mode === "preset" ? "on" : ""} onClick={() => setMode("preset")}>⚡ Preset · auto SL/TP</button>
      </div>
      {mode === "levels" && <>
        <label>Paste a signal <span style={{ color: "var(--mut)", letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>— copy it straight from Telegram and we'll fill it in</span></label>
        <textarea className="pastebox" value={raw} onChange={(e) => applyPaste(e.target.value)} placeholder={"XAUUSD BUY 4019/4009\nTP1. @ 4013\nTP2. @ 4017\n…\nSL @ 3999"} />
        {pasted && <div className="pasteok">✓ Filled from your paste — tweak anything below, then post.</div>}
        <div className="pastediv"><span>or enter it manually</span></div>
      </>}
      <div className="two"><div><label>Pair</label><select value={pair} onChange={(e) => setPair(e.target.value)}>{SIG_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <div><label>Side</label><div className="segbtns"><button className={`buy ${side === "BUY" ? "on" : ""}`} onClick={() => setSide("BUY")}>BUY</button><button className={`sell ${side === "SELL" ? "on" : ""}`} onClick={() => setSide("SELL")}>SELL</button></div></div></div>
      {mode === "levels" ? <>
        <label>Entry zone</label>
        <div className="two"><input value={ez1} onChange={(e) => setEz1(e.target.value)} placeholder="4051" /><input value={ez2} onChange={(e) => setEz2(e.target.value)} placeholder="4041" /></div>
        <label>Take-profit ladder (TP1 → TP6)</label>
        <div className="tpgrid">{tps.map((v, i) => (
          <div className="tpin" key={i}><span>TP{i + 1}</span><input value={v} onChange={(e) => setTpAt(i, e.target.value)} placeholder={i === 0 ? "4046" : ""} /></div>
        ))}</div>
        <div className="two">
          <div><label>Stop loss <b style={{ color: "#fda4af" }}>· required</b></label><input value={sl} onChange={(e) => setSl(e.target.value)} placeholder="4022" /></div>
          <div><label>Suggested lot size</label><input type="number" step="0.01" min="0.01" value={lots} onChange={(e) => setLots(e.target.value)} placeholder="0.01" /></div>
        </div>
      </> : <>
        <div className="presethint">⚡ Set the risk once. When a member taps it, we fire at market and auto-place the stop &amp; target off their actual fill — always valid, no matter where price is.</div>
        <div className="two">
          <div><label>Risk · stop distance <b style={{ color: "#fda4af" }}>· required</b></label><input inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="e.g. 30 (points)" /></div>
          <div><label>TP step per R <span style={{ color: "var(--mut)", textTransform: "none", fontWeight: 600 }}>· optional</span></label><input inputMode="decimal" value={tpStep} onChange={(e) => setTpStep(e.target.value)} placeholder={risk ? `defaults to ${risk} (1R)` : "defaults to your risk"} /></div>
        </div>
        <label>Suggested lot size</label><input type="number" step="0.01" min="0.01" value={lots} onChange={(e) => setLots(e.target.value)} placeholder="0.01" />
        {Number(risk) > 0 && (() => { const st = Number(tpStep) > 0 ? Number(tpStep) : Number(risk); return (
          <div className="presetprev">Stop <b>{risk}</b> pts from fill · TP ladder <b>{[1,2,3,4,5,6].map((n) => st * n).join(" / ")}</b> pts ({side})</div>
        ); })()}
      </>}
      <label>Who sees this call?</label>
      <div className="segbtns">
        <button className={audience === "all" ? "on buy" : ""} onClick={() => setAudience("all")}>📣 Everyone</button>
        <button className={audience === "admins" ? "on sell" : ""} onClick={() => setAudience("admins")}>🔒 Admins only</button>
      </div>
      {audience === "admins" && <div className="note2" style={{ marginTop: 6 }}>Only the desk (you &amp; Emery) will see this — perfect for testing a call before broadcasting.</div>}
      <label>Note / status (optional)</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Manually buy — running 210+ pips…" />
      {err && <div className="res err" style={{ marginTop: 12 }}>{err}</div>}
      <div className="actions"><button className="save" onClick={save} disabled={busy || !pair.trim()}>{busy ? "Posting…" : "Post signal"}</button><button className="cancel" onClick={onClose}>Cancel</button></div>
    </div></div>
  );
}

// The member's chosen tap-to-trade account is shared across the page (positions panel + fire modal),
// so once it's set they aren't asked to pick again.
const savedTapAcct = (): string => { try { return localStorage.getItem("rtbTapAcct") || ""; } catch { return ""; } };
const saveTapAcct = (id: string) => { try { if (id) localStorage.setItem("rtbTapAcct", id); } catch {} };

function signalTps(s: RtbSignal): string[] {
  if (s.tps && s.tps.length) return s.tps;
  return (s.tp ? String(s.tp).split(/[,\n]+/).map((x) => x.trim()).filter(Boolean) : []);
}

function TapModal({ signal, onClose, onPlaced }: { signal: RtbSignal; onClose: () => void; onPlaced?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [accounts, setAccounts] = useState<TapAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [acct, setAcct] = useState<string>(savedTapAcct());
  const [acctSearch, setAcctSearch] = useState("");
  const [changeAcct, setChangeAcct] = useState(false);
  const [lots, setLots] = useState(signal.lots && Number(signal.lots) > 0 ? String(signal.lots) : "0.01");
  const ladder = signalTps(signal);
  const [tp, setTp] = useState<string>(ladder[0] || "");
  const [rung, setRung] = useState(1); // preset: how many R's to target
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tlBusy, setTlBusy] = useState(false);
  const [tlUrl, setTlUrl] = useState<string | null>(null);
  const acctLabel = accounts.find((a) => a.accountId === acct);
  useEffect(() => {
    // Persist the auto-picked account too, not just a manual "Change". The signals list reads
    // savedTapAcct() to fetch open positions — if this never wrote, it stayed empty, no positions were
    // ever loaded, and a fired call could never flip its card to "In progress".
    (async () => { const d = await fetchTapAccounts(); if (d) { setEnabled(d.enabled); setAccounts(d.accounts); const st = savedTapAcct(); const pick = d.accounts.find((a) => a.accountId === st) ? st : (d.accounts[0]?.accountId || ""); if (pick) { setAcct(pick); saveTapAcct(pick); } } setLoading(false); })();
  }, []);
  const fire = async () => {
    if (isSignalExpired(signal.createdAt)) { setRes({ ok: false, msg: `This call expired — the ${SIGNAL_ENTRY_WINDOW_MIN}-min entry window has closed and price has moved. It's no longer valid to enter.` }); return; }
    const n = Number(lots); if (!acct || !(n > 0) || busy) return;
    saveTapAcct(acct);   // the signals list polls positions on THIS account to show "In progress"
    setBusy(true); setRes(null); setTlUrl(null);
    const r = await tapExecute(signal.id, acct, n, tp || undefined, signal.preset ? rung : undefined);
    if (r.fallback) { setRes({ ok: false, msg: r.reason || "In-app execution isn't switched on yet." }); setBusy(false); return; }
    if (!r.success) { setRes({ ok: false, msg: r.error || "Couldn't place the order." }); setBusy(false); return; }
    const fmt = (v: any) => (v == null ? "—" : (Math.round(Number(v) * 100) / 100));
    setRes({ ok: true, msg: signal.preset
      ? `Order live — ${signal.side} ${signal.pair} · ${n} lots.${r.fill != null ? ` Filled ${fmt(r.fill)}.` : ""} Auto stop ${fmt(r.sl)} · auto target ${fmt(r.tp)} (${rung}R).${!r.autoPlaced ? " ⚠️ Filled, but couldn't auto-place the stop — set it in your positions now." : ""}`
      : `Order live — ${signal.side} ${signal.pair} · ${n} lots. SL ${r.sl ?? signal.sl ?? "—"}${r.tp ? ` · TP ${r.tp}` : ""}.${r.tpDropped ? " (TP was already past market — fired with your stop; scale out at the ladder manually.)" : ""}` });
    setBusy(false);
    onPlaced?.();   // the card flips to "In progress" straight away, not on the next poll
    // Warm the TradeLocker login link in the background so it's ready the instant they tap through.
    // We deliberately do NOT open a tab here: the confirmation has to land first. Opening happens on
    // their next tap, which is a real user gesture, so a pop-up blocker can never swallow it either.
    setTlBusy(true);
    const url = await tapLogin(acct).catch(() => null);
    setTlUrl(url);
    setTlBusy(false);
  };
  // Fired from the confirmation screen — a direct click, so the new tab always opens.
  const openTl = () => {
    try { window.open(tlUrl || enterUrl("/accounts"), "_blank", "noopener"); } catch {}
    onClose();
  };
  return (
    <div className="scrim" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="taphd">
        <span className="taphd-eyebrow"><svg className="bolt" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg> Tap to Trade</span>
        <div className="taphd-main">
          <span className="taphd-pair">{signal.pair}</span>
          <span className={`sidepill ${signal.side === "SELL" ? "sell" : "buy"}`}><i /> {signal.side}</span>
        </div>
      </div>
      {loading ? <p style={{ color: "var(--mut)", fontSize: 13 }}>Loading your accounts…</p>
        : accounts.length === 0 ? (
          <>
            <p style={{ color: "var(--mut)", fontSize: 13.5, lineHeight: 1.6 }}>You don't have a live account connected yet. Fund a live account, then come back and fire calls in one tap — right here.</p>
            <div className="actions"><a className="save" href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>Fund a live account →</a><button className="cancel" onClick={onClose}>Close</button></div>
          </>
        ) : busy ? (
          <div className="placing">
            <div className="pspin" />
            <b>Placing your {signal.side} {signal.pair}…</b>
            <span>{Number(lots)} lots{acctLabel ? ` on ${acctLabel.number}` : ""} · sending to TradeLocker</span>
          </div>
        ) : res ? (
          <>
            <div className={`res ${res.ok ? "ok" : "err"}`}>{res.msg}</div>
            {res.ok && (
              <div className="tlopen">
                {tlBusy ? <span className="tlwait"><span className="pspin sm" /> Getting your TradeLocker link…</span>
                  : <>It's showing in your positions below — open TradeLocker to watch it land.</>}
              </div>
            )}
            <div className="actions">
              {res.ok && <button className="save" onClick={openTl} disabled={tlBusy}>Open TradeLocker →</button>}
              <button className={res.ok ? "cancel" : "save"} onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div className="deskrules">
              <b>Desk rules</b> — the SL is <u>mandatory</u> and rides with every tap. Scale out at each TP. Never hold against your stop.
            </div>
            {(() => {
              const sel = accounts.find((a) => a.accountId === acct);
              // Already have an account set on the page → don't ask again; show it with a "Change" option.
              if (sel && !changeAcct) return (
                <>
                  <label>Firing on</label>
                  <div className="acc on" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{sel.number}{sel.demo ? " · DEMO" : sel.marketing ? " · MARKETING" : ""}{sel.label ? ` · ${sel.label}` : ""}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="b">${sel.balance.toLocaleString()}</span>{accounts.length > 1 && <span onClick={() => setChangeAcct(true)} style={{ color: "var(--cy)", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Change</span>}</span>
                  </div>
                </>
              );
              return (
                <>
                  <label>{accounts.length > 6 ? `Account · ${accounts.length} available` : "Your account"}</label>
                  {accounts.length > 6 && <input placeholder="Search by account # or name…" value={acctSearch} onChange={(e) => setAcctSearch(e.target.value)} style={{ marginBottom: 8 }} />}
                  <div className="accpick">
                    {accounts.filter((a) => !acctSearch.trim() || `${a.number} ${a.label || ""}`.toLowerCase().includes(acctSearch.trim().toLowerCase())).slice(0, 60).map((a) => (
                      <button key={a.accountId} className={`acc ${acct === a.accountId ? "on" : ""}`} onClick={() => { setAcct(a.accountId); saveTapAcct(a.accountId); setChangeAcct(false); }}>
                        <span>{a.number}{a.demo ? " · DEMO" : a.marketing ? " · MARKETING" : ""}{a.label ? ` · ${a.label}` : ""}</span><span className="b">${a.balance.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
            {signal.preset ? (
              <>
                <div className="presethint">⚡ Auto SL/TP — we fire at market and place your stop <b style={{ color: "#fff" }}>{signal.riskPts}</b> pts from the fill, target below. Always valid.</div>
                <label>Target · how far to aim (R multiple)</label>
                <div className="rrow">
                  {[1, 2, 3, 4, 5, 6].map((n) => <button key={n} type="button" className={`rchip ${rung === n ? "on" : ""}`} onClick={() => setRung(n)}>{n}R{signal.riskPts ? <span style={{ opacity: .6, marginLeft: 5 }}>{(Number(signal.tpPts) > 0 ? Number(signal.tpPts) : Number(signal.riskPts)) * n} pts</span> : null}</button>)}
                </div>
              </>
            ) : (
              <>
                {signal.entry && <div className="lvlrow"><span>Entry zone</span><b>{signal.entry}</b></div>}
                <div className="lvlrow sl"><span>Stop loss · locked</span><b>{signal.sl || "—"}</b></div>
                {ladder.length > 0 && (
                  <>
                    <label>Target (from the ladder)</label>
                    <div className="tppick">
                      {ladder.map((t, i) => (
                        <button key={i} className={`tpc ${tp === t ? "on" : ""}`} onClick={() => setTp(t)}>TP{i + 1}<span>{t}</span></button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            <label>Lot size{signal.lots && Number(signal.lots) > 0 ? <b style={{ color: "var(--cy)" }}> · desk suggests {signal.lots}</b> : ""}</label>
            <input type="number" step="0.01" min="0.01" value={lots} onChange={(e) => setLots(e.target.value)} />
            <div className="note2">Fires a market order on <b style={{ color: "#fff" }}>your</b> account with the signal's stop &amp; your chosen target. Only risk what you can afford — manage or close it right here in your positions.</div>
            <div className="actions"><button className="save" onClick={fire} disabled={busy || !(Number(lots) > 0) || !enabled}>{busy ? "Placing…" : enabled ? `Fire ${signal.side} ${signal.pair}` : "Execution offline"}</button><button className="cancel" onClick={onClose}>Cancel</button></div>
          </>
        )}
    </div></div>
  );
}

// Live feed of the Gold Pulse Telegram channel — the latest calls & desk chatter, straight in-app.
export function TelegramDeskFeed({ signalsUrl }: { signalsUrl?: string | null }) {
  const [msgs, setMsgs] = useState<RtbTgMsg[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => { const m = await fetchTgFeed(); if (alive) setMsgs(m); };
    load(); const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (msgs && msgs.length === 0) return null; // nothing yet — don't show an empty shell
  return (
    <div className="rtd"><style>{CSS}</style>
    <div className="tgdesk">
      <div className="tgdesk-in">
        <div className="tgdesk-hd">
          <span className="tgi">✈️</span>
          <b>Live from the Gold Pulse desk</b>
          <span className="live-dot" /><span className="lt">Live</span>
        </div>
        <div className="tgdesk-body">
          {msgs == null ? <div className="tgdesk-empty">Loading the desk…</div> : msgs.map((m) => (
            <div key={m.id} className={`tgmsg ${m.triggered ? "trg" : m.isSignal ? "sig" : ""}`}>
              <div className="tgtop">
                <span className="nm">Gold Pulse Signals ⚡</span>
                {m.triggered && m.signal
                  ? <span className="sg trg">⚡ Fired: {m.signal.pair} {m.signal.side}</span>
                  : m.isSignal ? <span className="sg">Signal</span> : null}
                <span className="ago">{ago(m.at)}</span>
              </div>
              <div className="tgtext">{m.text}</div>
              {m.triggered && m.signal && <div className="tgtrg">✓ Auto-imported into the Tap-to-Trade feed{m.signal.audience === "admins" ? " · admins only" : ""}</div>}
            </div>
          ))}
        </div>
        {signalsUrl && <div className="tgdesk-foot"><a href={signalsUrl} target="_blank" rel="noopener noreferrer">Open the VIP Telegram →</a></div>}
      </div>
    </div>
    </div>
  );
}

// Normalise a symbol/side so a posted signal ("XAU/USD", "buy") matches an open TradeLocker position ("XAUUSD", "long").
const normSym = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normSide = (s: any) => { const v = String(s || "").toLowerCase(); return v === "sell" || v === "short" ? "sell" : "buy"; };
// TradeLocker calls it `instrument`; keep `symbol` as a fallback for any other position shape.
const posSym = (p: TapPosition) => normSym(p.instrument ?? p.symbol);

export function SignalsFeed({ isHost, limit }: { isHost: boolean; limit?: number }) {
  const [signals, setSignals] = useState<RtbSignal[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false); const [tapSig, setTapSig] = useState<RtbSignal | null>(null); const [delId, setDelId] = useState<string | null>(null); const [delBusy, setDelBusy] = useState(false);
  const [positions, setPositions] = useState<TapPosition[]>([]); const [posAcct, setPosAcct] = useState<string>(savedTapAcct()); const [manage, setManage] = useState<{ sig: RtbSignal; pos: TapPosition } | null>(null);
  const load = async () => { const d = await fetchSignals(); if (d) setSignals(d.signals); };
  // Which of the member's live signals are already working as an open position on their chosen account?
  // We can't just trust the saved id: it's empty for anyone who never opened the fire modal, and it's a
  // single localStorage key shared with any member an admin is impersonating — so it can point at an
  // account this session can't even see. Either way we'd fetch nothing and a working trade would never
  // show as "In progress". Resolve it against the accounts this session actually has, once, then cache.
  const acctRef = useRef<string>("");
  const resolveAcct = async (): Promise<string> => {
    if (acctRef.current) return acctRef.current;
    let id = savedTapAcct();
    const list = (await fetchTapAccounts().catch(() => null))?.accounts || [];
    if (list.length && !list.some((a) => a.accountId === id)) { id = list[0].accountId; saveTapAcct(id); }
    acctRef.current = id || "";
    return acctRef.current;
  };
  const loadPositions = async () => {
    const id = await resolveAcct();
    setPosAcct(id);
    if (!id) { setPositions([]); return; }
    const p = await fetchPositions(id).catch(() => []);
    setPositions(p || []);
  };
  // A just-placed order takes a moment to show up on the broker, so one fetch loses the race — chase it
  // for ~20s, then fall back to the steady poll below.
  const chasePositions = () => {
    acctRef.current = savedTapAcct() || acctRef.current;   // they may have fired on a different account
    [0, 1500, 4000, 8000, 14000, 20000].forEach((t) => setTimeout(loadPositions, t));
  };
  useEffect(() => {
    load().finally(() => setLoading(false));
    loadPositions();
    // Keep "In progress" honest without a page reload: a position closed in TradeLocker should drop the
    // card back to Tap-to-Trade, and one opened elsewhere should light it up. Paused in a hidden tab.
    const id = setInterval(() => { if (!document.hidden) loadPositions(); }, 25000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A signal is "in progress" for this member when an open position matches its symbol + side.
  // The API names this field `instrument`; matching on `symbol` alone read undefined every time, so a
  // fired call could never be recognised as in progress no matter which account was loaded.
  const posFor = (s: RtbSignal): TapPosition | null => positions.find((p) => posSym(p) === normSym(s.pair) && normSide(p.side) === normSide(s.side)) || null;
  const setStatus = async (id: string, s: string) => { await patchSignal(id, s); load(); };
  const remove = (id: string) => setDelId(id);
  const confirmDelete = async () => { const id = delId; if (!id || delBusy) return; setDelBusy(true); const ok = await deleteSignal(id); setDelBusy(false); setDelId(null); if (ok) setSignals((x) => x.filter((s) => s.id !== id)); else alert("Couldn't delete that signal — please try again."); };
  const shown = limit ? signals.slice(0, limit) : signals;
  return (
    <div>
      <div className="sectlabel">
        <span className="l"><span className="live-dot" /> Live Gold Pulse Signals</span>
        {isHost && <button className="addbtn" onClick={() => setModal(true)}>+ Post signal</button>}
      </div>
      {!loading && signals.length > 0 && (() => {
        // Track record from the desk's past calls (TP hits vs stop-outs), shown as a live performance strip.
        const wins = signals.filter((s) => /^tp[1-6]$/.test(s.status)).length;
        const losses = signals.filter((s) => s.status === "sl").length;
        const decided = wins + losses;
        const hitRate = decided > 0 ? Math.round((wins / decided) * 100) : null;
        const liveNow = signals.filter((s) => s.status === "live" && !isSignalExpired(s.createdAt)).length;
        return (
          <div className="sigperf">
            <div className="pf"><b>{signals.length}</b><span>Calls posted</span></div>
            <div className="pf"><b className="win">{wins}</b><span>Targets hit</span></div>
            <div className="pf"><b className="gold">{hitRate != null ? hitRate + "%" : "—"}</b><span>Hit rate</span></div>
            <div className="pf"><b className="livec">{liveNow}</b><span>Live now</span></div>
          </div>
        );
      })()}
      {loading ? <div className="empty">Loading signals…</div>
        : shown.length === 0 ? <div className="empty">No signals posted yet. {isHost ? "Tap “Post signal” to drop the first call." : "The desk's live calls will show here."}</div>
        : (
          <div className="grid sig">
            {shown.map((s) => { const expired = s.status === "live" && isSignalExpired(s.createdAt); return (
              <div key={s.id} className={`card ${s.status === "live" && !expired ? "live" : ""} ${expired ? "expired" : ""} ${s.fromTelegram ? "fromtg" : ""}`}>
                <div className="sighead"><span className="pair">{s.pair}</span><span className={`side ${s.side}`}>{s.side}</span>{s.fromTelegram && <span className="tgbadge">✈️ From Telegram</span>}{s.preset && <span className="presetbadge">⚡ Auto SL/TP</span>}</div>
                {s.preset ? (
                  <div className="presetline">Market entry · stop <b>{s.riskPts}</b> pts · TP ladder <b>{[1,2,3].map((n) => (Number(s.tpPts) > 0 ? Number(s.tpPts) : Number(s.riskPts)) * n).join(" / ")}…</b> pts from fill</div>
                ) : (
                  <>
                    <div className="lvl">
                      {s.entry && <div><span>Entry zone</span><b>{s.entry}</b></div>}
                      {s.sl && <div><span>SL</span><b style={{ color: "#fda4af" }}>{s.sl}</b></div>}
                    </div>
                    {(() => { const tps = signalTps(s); return tps.length > 0 && (
                      <div className="tpladder">{tps.map((t, i) => <span key={i} className="tpchip"><i>TP{i + 1}</i>{t}</span>)}</div>
                    ); })()}
                  </>
                )}
                {s.note && <p style={{ margin: "10px 0 0", color: "var(--mut)", fontSize: 12.5 }}>{s.note}</p>}
                <div className="st">{(() => { const ip = s.status === "live" && !!posFor(s); return (
                  <span className={`badge ${ip ? "inprog" : expired ? "expired" : statusClass(s.status)}`}>{ip ? "In progress" : expired ? "Expired" : (STATUS_LABEL[s.status] || s.status)}</span>
                ); })()}{isHost && <span className={`audbadge ${s.audience === "admins" ? "adm" : "all"}`}>{s.audience === "admins" ? "🔒 Admins only" : "📣 Everyone"}</span>}<span className="ago">{ago(s.createdAt)}</span></div>
                {s.status === "live" && (() => {
                  const pos = posFor(s);
                  if (pos) {
                    const pnl = Number(pos.unrealizedPnl ?? pos.pnl ?? NaN);
                    const size = pos.lots ?? pos.qty;
                    return (
                      <div className="tapline inprog">
                        <div className="ipbar">
                          <span className="ipdot" /> In progress
                          {size != null && <span className="ipsize">{size} lot{Number(size) === 1 ? "" : "s"}</span>}
                          {isFinite(pnl) && <span className={`ippnl ${pnl >= 0 ? "up" : "dn"}`}>{pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}</span>}
                        </div>
                        <div className="iprow">
                          <button className="ipbtn mod" onClick={() => setManage({ sig: s, pos })}>Modify SL / TP</button>
                          <button className="ipbtn close" onClick={() => setManage({ sig: s, pos })}>Close</button>
                        </div>
                      </div>
                    );
                  }
                  if (expired) return <div className="tapline"><div className="expnote">⌛ Signal expired — the {SIGNAL_ENTRY_WINDOW_MIN}-min entry window has closed. Price has moved; this call is no longer valid to enter.</div></div>;
                  return <div className="tapline"><button className="tradebtn" onClick={() => setTapSig(s)}>⚡ Tap to Trade</button></div>;
                })()}
                {isHost && (
                  <div className="hostrow">
                    {["tp1", "tp2", "tp3", "tp4", "tp5", "tp6", "sl", "closed"].map((st) => <button key={st} className="mini" onClick={() => setStatus(s.id, st)}>{STATUS_LABEL[st]}</button>)}
                    <button className="mini del" onClick={() => remove(s.id)}>Delete</button>
                  </div>
                )}
              </div>
            ); })}
          </div>
        )}
      {modal && <SignalModal onClose={() => setModal(false)} onSaved={load} />}
      {tapSig && <TapModal signal={tapSig} onPlaced={chasePositions} onClose={() => { setTapSig(null); chasePositions(); }} />}
      {manage && <ManagePositionModal sig={manage.sig} pos={manage.pos} acct={posAcct} onClose={() => setManage(null)} onChanged={loadPositions} />}
      {delId && (() => { const sig = signals.find((x) => x.id === delId); return (
        <div className="scrim" onClick={() => !delBusy && setDelId(null)}><div className="modal confirm" onClick={(e) => e.stopPropagation()}>
          <div className="cf-ico">🗑️</div>
          <h3 style={{ textAlign: "center" }}>Delete this signal?</h3>
          <p className="cf-sub">{sig ? `${sig.side} ${sig.pair}${sig.entry ? ` · ${sig.entry}` : ""}` : "This call"} will be pulled from every member’s feed. This can’t be undone.</p>
          <div className="actions"><button className="save danger" onClick={confirmDelete} disabled={delBusy}>{delBusy ? "Deleting…" : "Delete signal"}</button><button className="cancel" onClick={() => setDelId(null)} disabled={delBusy}>Keep it</button></div>
        </div></div>
      ); })()}
    </div>
  );
}

// Manage an already-fired signal: adjust its stop / take-profit, or close it out.
function ManagePositionModal({ sig, pos, acct, onClose, onChanged }: { sig: RtbSignal; pos: TapPosition; acct: string; onClose: () => void; onChanged: () => void }) {
  const tps = signalTps(sig);
  const [sl, setSl] = useState<string>(sig.sl ? String(sig.sl) : "");
  const [tp, setTp] = useState<string>(tps[0] ? String(tps[0]) : "");
  const [busy, setBusy] = useState<"" | "mod" | "close">(""); const [msg, setMsg] = useState<string>("");
  const pnl = Number(pos.unrealizedPnl ?? pos.pnl ?? NaN);
  const size = pos.lots ?? pos.qty;
  const save = async () => {
    setBusy("mod"); setMsg("");
    const r = await modifyPosition(acct, pos.positionId, sl ? Number(sl) : null, tp ? Number(tp) : null);
    setBusy("");
    if (r.error) setMsg("⚠️ " + r.error); else { setMsg("✅ Stop / target updated."); onChanged(); setTimeout(onClose, 900); }
  };
  const close = async () => {
    if (!confirm("Close this position at market?")) return;
    setBusy("close"); setMsg("");
    const r = await closePosition(acct, pos.positionId);
    setBusy("");
    if (r.error) setMsg("⚠️ " + r.error); else { setMsg("✅ Position closed."); onChanged(); setTimeout(onClose, 900); }
  };
  return (
    <div className="scrim" onClick={() => !busy && onClose()}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="taphd">
        <span className="taphd-eyebrow"><svg className="bolt" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg> In progress · Manage</span>
        <div className="taphd-main"><span className="taphd-pair">{sig.pair}</span><span className={`sidepill ${normSide(sig.side)}`}><i />{normSide(sig.side).toUpperCase()}</span></div>
      </div>
      <div className="mgstat">
        {size != null && <div><span>Size</span><b>{size} lot{Number(size) === 1 ? "" : "s"}</b></div>}
        {(pos.avgPrice ?? pos.openPrice) != null && <div><span>Entry</span><b>{pos.avgPrice ?? pos.openPrice}</b></div>}
        {isFinite(pnl) && <div><span>P/L</span><b className={pnl >= 0 ? "up" : "dn"}>{pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}</b></div>}
      </div>
      <label>Stop loss</label><input inputMode="decimal" placeholder="e.g. 3999" value={sl} onChange={(e) => setSl(e.target.value)} />
      <label>Take profit</label>
      {tps.length > 0 && <div className="tppick">{tps.map((t, i) => <button key={i} type="button" className={`tpc ${String(tp) === String(t) ? "on" : ""}`} onClick={() => setTp(String(t))}>TP{i + 1} · {t}</button>)}</div>}
      <input inputMode="decimal" placeholder="target price" value={tp} onChange={(e) => setTp(e.target.value)} />
      {msg && <div className="note" style={{ color: msg.startsWith("⚠️") ? "#fca5a5" : "#6ee7b7", marginTop: 10 }}>{msg}</div>}
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="save" onClick={save} disabled={!!busy}>{busy === "mod" ? "Saving…" : "Update stop / target"}</button>
        <button className="cancel danger" onClick={close} disabled={!!busy}>{busy === "close" ? "Closing…" : "Close position"}</button>
      </div>
    </div></div>
  );
}

function SessionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(""); const [host, setHost] = useState("Anthony Beale"); const [startAt, setStartAt] = useState(""); const [meetingUrl, setMeetingUrl] = useState(""); const [description, setDescription] = useState(""); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim() || busy) return; setBusy(true);
    const ok = await createSession({ title, host, startAt: startAt || null, meetingUrl, description }); setBusy(false);
    if (ok) { onSaved(); onClose(); } else alert("Couldn't create session");
  };
  return (
    <div className="scrim" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <h3>Schedule a live session</h3>
      <label>Title</label><input placeholder="NY Session live w/ Anthony Beale" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label>Host</label><input value={host} onChange={(e) => setHost(e.target.value)} />
      <label>Start time</label><input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      <label>Zoom / meeting link</label><input placeholder="https://zoom.us/j/…" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
      <label>Description (optional)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="actions"><button className="save" onClick={save} disabled={busy || !title.trim()}>{busy ? "Saving…" : "Schedule"}</button><button className="cancel" onClick={onClose}>Cancel</button></div>
    </div></div>
  );
}

export function SessionsFeed({ isHost, limit }: { isHost: boolean; limit?: number }) {
  const [sessions, setSessions] = useState<RtbSession[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false);
  const load = async () => { const d = await fetchSessions(); if (d) setSessions(d.sessions); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const toggleLive = async (s: RtbSession) => { await patchSession(s.id, { isLive: !s.isLive }); load(); };
  const remove = async (id: string) => { if (confirm("Delete this session?")) { await deleteSession(id); setSessions((x) => x.filter((s) => s.id !== id)); } };
  const shown = limit ? sessions.slice(0, limit) : sessions;
  return (
    <div>
      <div className="sectlabel">
        <span className="l">📅 Live Sessions</span>
        {isHost && <button className="addbtn" onClick={() => setModal(true)}>+ Host a session</button>}
      </div>
      {loading ? <div className="empty">Loading sessions…</div>
        : shown.length === 0 ? <div className="empty">No sessions scheduled. {isHost ? "Tap “Host a session” to schedule one." : "Upcoming live sessions with the desk will appear here."}</div>
        : shown.map((s) => (
          <div key={s.id} className={`ses ${s.isLive ? "live" : ""}`}>
            <div className="savatar">{s.isLive ? "🔴" : "🎥"}</div>
            <div className="sinfo">
              <div className="t">{s.title}{s.isLive && <span style={{ color: "#fb7185", marginLeft: 8, fontSize: 11, fontWeight: 900 }}>● LIVE NOW</span>}</div>
              <div className="m">{s.host || "Anthony Beale"} · {s.isLive ? "Happening now" : whenLabel(s.startAt)}{s.description ? " · " + s.description : ""}</div>
              {isHost && (
                <div className="hostrow">
                  <button className="mini" onClick={() => toggleLive(s)}>{s.isLive ? "End live" : "Go live"}</button>
                  <button className="mini del" onClick={() => remove(s.id)}>Delete</button>
                </div>
              )}
            </div>
            {s.meetingUrl
              ? <a className={`join ${s.isLive ? "" : "ghost"}`} href={s.meetingUrl} target="_blank" rel="noopener noreferrer">{s.isLive ? "Join live →" : "Meeting link"}</a>
              : <span className="ago" style={{ whiteSpace: "nowrap" }}>Link soon</span>}
          </div>
        ))}
      {modal && <SessionModal onClose={() => setModal(false)} onSaved={load} />}
    </div>
  );
}

export function TapToTrade({ onOpen }: { onOpen?: () => void }) {
  return (
    <div className="rtd"><style>{CSS}</style>
      <div className="tap">
        <span className="ico">⚡</span>
        <div>
          <h3>Tap to Trade</h3>
          <p>See a Gold Pulse call you like? Fire it on your own live account in one tap — the SL rides with it and you manage every trade right here.</p>
        </div>
        <button className="tapcta" onClick={() => (onOpen ? onOpen() : window.open(enterUrl("/accounts"), "_blank"))}>Open Tap to Trade →</button>
      </div>
    </div>
  );
}

// The desk's standing rules, pinned from the Gold Pulse channel — always in view on the trade page.
function DeskRules() {
  return (
    <div className="deskcard">
      <div className="dh">📌 Gold Pulse desk rules</div>
      <ul>
        <li><b>Always use the SL</b> exactly as posted — every tap ships with the signal's stop attached.</li>
        <li><b>Scale out at each TP.</b> The ladder (TP1 → TP6) is where you bank; take partials as they hit.</li>
        <li><b>Never hold against your stop.</b> No averaging into a loser, no removing the SL.</li>
        <li><b>Enter in the zone.</b> Fill inside the posted entry range, not chasing far above it.</li>
      </ul>
    </div>
  );
}

// A member's own live positions, read from their account — close one or close all, right here.
function AccountPositions() {
  const [accounts, setAccounts] = useState<TapAccount[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [acct, setAcct] = useState(savedTapAcct());
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<TapPosition[]>([]);
  const [busyId, setBusyId] = useState<string>("");
  useEffect(() => { if (acct) saveTapAcct(acct); }, [acct]); // share the choice with the fire modal
  const loadAccounts = async (selectId?: string) => {
    const d = await fetchTapAccounts();
    if (d) { setEnabled(d.enabled); setAccounts(d.accounts); const st = savedTapAcct(); const pick = selectId || (d.accounts.find((a) => a.accountId === st) ? st : d.accounts[0]?.accountId); if (pick) setAcct(pick); }
  };
  useEffect(() => { loadAccounts().finally(() => setLoading(false)); }, []);
  const refresh = async (id: string) => { if (!id) return; const p = await fetchPositions(id); setPositions(p); };
  useEffect(() => {
    if (!acct) return; refresh(acct);
    const t = setInterval(() => refresh(acct), 9000);
    return () => clearInterval(t);
  }, [acct]);
  const close = async (positionId: string) => {
    if (busyId) return; setBusyId(positionId);
    await closePosition(acct, positionId); await refresh(acct); setBusyId("");
  };
  const closeAll = async () => {
    if (busyId || !positions.length || !confirm("Close ALL open positions on this account?")) return;
    setBusyId("__all__"); await closePosition(acct, undefined, true); await refresh(acct); setBusyId("");
  };
  const cur = accounts.find((a) => a.accountId === acct);
  if (loading) return <div className="empty">Loading your account…</div>;
  if (accounts.length === 0) return (
    <div className="empty" style={{ padding: 22 }}>
      No TradeLocker account to connect yet. Open or fund one on Pulse, then it'll show up here to trade.{" "}
      <a href={enterUrl("/accounts")} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cy)", fontWeight: 800 }}>Manage accounts on Pulse →</a>
    </div>
  );
  const pnlOf = (p: TapPosition) => Number(p.unrealizedPnl ?? p.pnl ?? 0);
  const lotsOf = (p: TapPosition) => Number(p.lots ?? p.qty ?? 0);
  const sideOf = (p: TapPosition) => String(p.side || "").toLowerCase().startsWith("s") ? "SELL" : "BUY";
  return (
    <div>
      <div className="acctbar">
        <span className="lab">Account</span>
        <select className="acctsel" value={acct} onChange={(e) => setAcct(e.target.value)}>{accounts.map((a) => <option key={a.accountId} value={a.accountId}>{a.number}{a.demo ? " · DEMO" : a.marketing ? " · MARKETING" : ""}{a.label ? ` · ${a.label}` : ""}{a.balance ? ` — $${a.balance.toLocaleString()}` : ""}</option>)}</select>
        <span className="bal"><span>Balance</span>${(cur?.balance ?? 0).toLocaleString()}</span>
      </div>
      <div className="poshead">
        <span className="l">Open positions {positions.length ? `· ${positions.length}` : ""}</span>
        {positions.length > 0 && <button className="closeall" onClick={closeAll} disabled={!!busyId}>{busyId === "__all__" ? "Closing…" : "Close all"}</button>}
      </div>
      {positions.length === 0
        ? <div className="empty">No open positions. Fire a Gold Pulse call below and it'll show up here.</div>
        : (
          <div className="poswrap">
            {positions.map((p) => {
              const pnl = pnlOf(p); const side = sideOf(p);
              return (
                <div className="posrow" key={p.positionId}>
                  <span className="pos-sym">{p.instrument || p.symbol || "—"}</span>
                  <span className={`pos-side ${side === "SELL" ? "sell" : "buy"}`}>{side}</span>
                  <span className="pos-lots">{lotsOf(p) ? `${lotsOf(p)} lot` : ""}{p.openPrice || p.avgPrice ? ` @ ${p.openPrice ?? p.avgPrice}` : ""}</span>
                  <span className="pnl" style={{ color: pnl >= 0 ? "#4fb5ee" : "#fb7185" }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</span>
                  <button className="closebtn" onClick={() => close(String(p.positionId))} disabled={!!busyId}>{busyId === String(p.positionId) ? "…" : "Close"}</button>
                </div>
              );
            })}
          </div>
        )}
      {!enabled && <div className="note2" style={{ marginTop: 10 }}>In-app execution is being switched on. Positions are read-only for now.</div>}
    </div>
  );
}

// The dedicated Tap-to-Trade page — desk rules, your live account & positions, and every Gold Pulse call ready to fire in-app.
export function TapTradePage({ me }: { me: MeStatus | null }) {
  const isHost = !!me?.isAdmin;
  const unlocked = isHost || !!me?.signalsUnlocked;
  return (
    <div className="rtd"><style>{CSS}</style>
      <div className="h2">Tap to Trade</div>
      <div className="sub">Your live account, your open trades, and every Gold Pulse call — fire and manage them right here. No platform-hopping.</div>
      <div style={{ height: 16 }} />
      {unlocked ? (
        <>
          <DeskRules />
          <div className="sectlabel"><span className="l">💼 Your account &amp; positions</span></div>
          <AccountPositions />
          <div style={{ height: 8 }} />
          <SignalsFeed isHost={isHost} />
        </>
      ) : <LockedSignals min={me?.signalsMin ?? 250} />}
    </div>
  );
}

function LockedSignals({ min }: { min: number }) {
  return (
    <div>
      <div className="sectlabel"><span className="l"><span className="live-dot" /> Live Gold Pulse Signals</span></div>
      <div className="empty" style={{ padding: 26 }}>
        🔒 <b style={{ color: "#fff" }}>Locked.</b> Fund a live account with ${min}+ (or allocate to GoldRock) to unlock the desk's live calls — entries, TPs and stops, in real time.
      </div>
    </div>
  );
}

function NewsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [pips, setPips] = useState(""); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim() || !body.trim() || busy) return; setBusy(true);
    const ok = await postNews({ title, body, pips }); setBusy(false);
    if (ok) { onSaved(); onClose(); } else alert("Couldn't post that update");
  };
  return (
    <div className="scrim" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h3>Post a results update</h3>
      <label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monday's Results ✅ — +1370 PIPS" />
      <label>Total pips (optional)</label><input value={pips} onChange={(e) => setPips(e.target.value)} placeholder="1370" />
      <label>Body</label><textarea style={{ height: 150, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12.5 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"GOLD BUY 500+ PIPS ✅\nGOLD SELL 180+ PIPS ✅\n…\nOverall +1370 PIPS"} />
      <div className="actions"><button className="save" onClick={save} disabled={busy || !title.trim() || !body.trim()}>{busy ? "Posting…" : "Post update"}</button><button className="cancel" onClick={onClose}>Cancel</button></div>
    </div></div>
  );
}

// Desk results / news feed — "Monday's Results — +1370 PIPS" style recaps. Host can post + delete.
// The desk pastes recaps straight from Telegram, so the body is a raw block with day headers,
// per-trade result lines and a total — previously dumped into a <pre>, which ate the whole screen.
// This gives it structure WITHOUT parsing anything it can get wrong: every line still renders, it's
// only tagged for styling, and anything unrecognised falls through as plain text.
const NEWS_DAY = /^#?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
type NewsRow = { kind: "day" | "win" | "loss" | "sum" | "text"; text: string };
function parseRecap(body: string): NewsRow[] {
  const rows: NewsRow[] = [];
  for (const raw of String(body || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;                                   // collapse the blank-line padding
    if (NEWS_DAY.test(line)) { rows.push({ kind: "day", text: line.replace(/^#/, "").replace(/[✅❌]/g, "").trim() }); continue; }
    if (/^(total|overall|result)/i.test(line)) { rows.push({ kind: "sum", text: line }); continue; }
    if (/\blost\b|\bloss\b|\bsl\b[^a-z]*-/i.test(line)) { rows.push({ kind: "loss", text: line }); continue; }
    if (/\bwon\b|\bwin\b/i.test(line)) { rows.push({ kind: "win", text: line }); continue; }
    rows.push({ kind: "text", text: line });
  }
  return rows;
}
// First pip figure on a line: "3 : WON 1050+PIPS" -> 1050. Sign comes from the row's kind, not
// from the text, because the desk writes losses as "-00 PIPS LOST" as often as "-200".
const pipsIn = (s: string) => {
  const m = String(s).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return m ? Math.abs(parseFloat(m[0])) : 0;
};
// The stagger index, as a CSS variable the stylesheet turns into an animation-delay.
const rowVar = (i: number) => ({ "--i": i } as CSSProperties);

function NewsBody({ body }: { body: string }) {
  const [open, setOpen] = useState(false);
  // Bars grow from zero on the frame after mount — a width set during the first paint is just a
  // static bar, so the transition needs a second frame to have something to animate from.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = parseRecap(body);
  // Nothing recognisable (a plain prose update) — keep the original formatting rather than
  // shredding someone's paragraph into rows.
  if (!rows.some((r) => r.kind !== "text")) return <pre className="nbody">{body}</pre>;
  // Default view is one line per day plus the totals — a week of results in six rows instead of
  // twenty. "( NO SL )" and the header line are detail, not headline, so they only appear on expand.
  const days: { day: string; results: NewsRow[] }[] = [];
  const sums: NewsRow[] = [];
  // Once TOTAL/Overall appears we're in the summary block — result lines after it belong there, not
  // to the last weekday. Without this, "-200 PIPS LOST" got filed under Friday.
  let seenSum = false;
  for (const r of rows) {
    if (r.kind === "day") { days.push({ day: r.text, results: [] }); continue; }
    if (r.kind === "sum") { seenSum = true; sums.push(r); continue; }
    if (r.kind === "win" || r.kind === "loss") {
      if (seenSum) sums.push(r);
      else if (days.length) days[days.length - 1].results.push(r);
    }
  }
  // Drop the numbering, brackets and tick/cross — the chip's colour already says won or lost.
  const strip = (s: string) => s.replace(/^\d+\s*:?\s*/, "").replace(/[()✅❌]/g, "").trim();
  const canCompact = days.length > 0;
  if (!canCompact || open) {
    return (
      <div className="nrecap">
        {rows.map((r, i) => <div key={i} className={`nrow ${r.kind}`} style={rowVar(i)}>{r.text}</div>)}
        {canCompact && <button className="nmore" onClick={() => setOpen(false)}>Show less</button>}
      </div>
    );
  }
  // Each day's bar is drawn from the pip figure inside its own result lines, so the week reads as a
  // shape. Anything that isn't a number falls through as a zero-width bar and the chip still shows —
  // the recap is pasted by hand from Telegram, so nothing here may depend on it parsing.
  const dayValue = (rs: NewsRow[]) => rs.reduce((a, r) => a + (r.kind === "loss" ? -pipsIn(r.text) : pipsIn(r.text)), 0);
  const values = days.map((d) => dayValue(d.results));
  const peak = Math.max(1, ...values.map((v) => Math.abs(v)));
  return (
    <div className="nrecap">
      {days.map((d, i) => (
        <div key={i} className="ncday" style={rowVar(i)}>
          <span className="ncd">{d.day.slice(0, 3)}</span>
          <span className="nctrack">
            <i
              className={`ncfill ${values[i] < 0 ? "loss" : ""}`}
              style={{ width: grown && values[i] ? `${Math.max(6, (Math.abs(values[i]) / peak) * 100)}%` : "0%" }}
            />
          </span>
          <span className="ncr">
            {d.results.length
              ? d.results.map((r, j) => <span key={j} className={`ncchip ${r.kind}`}>{strip(r.text)}</span>)
              : <span className="ncchip flat">—</span>}
          </span>
        </div>
      ))}
      {sums.map((s, i) => <div key={`s${i}`} className={`nrow ${s.kind === "loss" ? "loss" : "sum"}`} style={rowVar(days.length + i)}>{s.text}</div>)}
      <button className="nmore" onClick={() => setOpen(true)}>Show the full recap</button>
    </div>
  );
}

// The headline figure rolls up from zero. It is the same number either way — but a figure that
// climbs is read, and a figure that is simply printed is skimmed. Keyed on the post id above, so
// paging to another recap replays it rather than jumping to the new total.
function PipBadge({ pips }: { pips: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce || !pips) { setShown(pips); return; }
    const from = performance.now(), ms = 950;
    let raf = requestAnimationFrame(function tick(t: number) {
      const p = Math.min(1, (t - from) / ms);
      setShown(Math.round(pips * (1 - Math.pow(1 - p, 3))));   // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [pips]);
  return <span className={`npips ${pips >= 0 ? "up" : "dn"}`}>{pips >= 0 ? "+" : ""}{shown.toLocaleString()} pips</span>;
}

export function NewsFeed({ isHost, limit }: { isHost: boolean; limit?: number }) {
  const [news, setNews] = useState<RtbNews[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false); const [idx, setIdx] = useState(0);
  const load = async () => { const d = await fetchNews(); if (d) setNews(d.news); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const remove = async (id: string) => { if (!confirm("Delete this update?")) return; if (await deleteNews(id)) { setNews((x) => x.filter((n) => n.id !== id)); setIdx(0); } };
  const shown = limit ? news.slice(0, limit) : news;
  const safeIdx = Math.min(idx, Math.max(0, shown.length - 1));
  const n = shown[safeIdx];
  return (
    <div className="rtd"><style>{CSS}</style>
      <div className="sectlabel"><span className="l">📰 Desk News &amp; Results</span>{isHost && <button className="addbtn" onClick={() => setModal(true)}>+ Post update</button>}</div>
      {loading ? <div className="empty">Loading…</div>
        : shown.length === 0 ? <div className="empty">No updates yet. {isHost ? "Post the desk's latest results." : "The desk's results recaps will show here."}</div>
        : (
          <div className="newscard" key={n.id}>
            <div className="nhead">
              <div className="nt">{n.title}</div>
              {n.pips != null && <PipBadge pips={n.pips} />}
            </div>
            <NewsBody body={n.body} />
            <div className="nfoot">
              <span className="ago">{ago(n.createdAt)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                {isHost && <button className="mini del" onClick={() => remove(n.id)}>Delete</button>}
                {shown.length > 1 && (<>
                  <button className="mini navb" disabled={safeIdx >= shown.length - 1} onClick={() => setIdx((i) => Math.min(shown.length - 1, i + 1))} title="Older">‹</button>
                  <span className="ndot">{safeIdx + 1}/{shown.length}</span>
                  <button className="mini navb" disabled={safeIdx <= 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} title="Newer">›</button>
                </>)}
              </div>
            </div>
          </div>
        )}
      {modal && <NewsModal onClose={() => setModal(false)} onSaved={load} />}
    </div>
  );
}

export default function Dash({ me, name, setup, fundCta }: { me: MeStatus | null; name?: string; setup?: ReactNode; fundCta?: ReactNode; onTapTrade?: () => void }) {
  const isHost = !!me?.isAdmin;
  const unlocked = isHost || !!me?.signalsUnlocked;
  const usd = (n: number) => `$${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return (
    <div className="rtd">
      <style>{CSS}</style>
      <Ticker />
      <div className="h2" style={{ fontSize: 24 }}>Welcome{name ? ", " : ""}<span style={{ color: "var(--cy)" }}>{name}</span> 👋</div>
      <div className="sub">Your Gold Pulse signals, live sessions and one-tap trading — all in one place.</div>
      {((me?.walletBalance ?? 0) > 0 || (me?.pammBalance ?? 0) > 0) && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {(me?.pammBalance ?? 0) > 0 && (
            <div className="dchip pamm">🏦 <b>{usd(me!.pammBalance!)}</b> <span>in your GoldRock PAMM — earning hands-free.</span></div>
          )}
          {(me?.walletBalance ?? 0) > 0 && (
            <div className="dchip">💰 <b>{usd(me!.walletBalance!)}</b> <span>in your wallet — ready to invest or fund up.</span></div>
          )}
        </div>
      )}
      {/* Sits above the news feed on purpose: for an unfunded member this is the first thing in the
          content column, not something they have to scroll past the week's results to find. */}
      {fundCta && <div style={{ marginTop: 16 }}>{fundCta}</div>}
      <div style={{ height: 18 }} />
      <NewsFeed isHost={isHost} limit={12} />
      {setup && <div style={{ marginTop: 18 }}>{setup}</div>}
      {unlocked ? <SignalsFeed isHost={isHost} limit={6} /> : <LockedSignals min={me?.signalsMin ?? 250} />}
      <SessionsFeed isHost={isHost} limit={4} />
    </div>
  );
}
