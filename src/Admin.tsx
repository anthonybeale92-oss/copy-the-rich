import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { fetchMe, fetchAnalytics, fetchAdminUsers, saveTracking, adminLoginAsUrl, setMemberUnlock, approveMemberKyc, fetchTelegram, verifyTelegram, removeTelegram, fetchAutopost, setAutopost, fetchBrands, createBrand, patchBrand, deleteBrand, fetchBrandStats, getToken, logout, hasAdminScope, requestAdminCode, verifyAdminCode, googleLogin, fetchGoogleClientId, type Analytics, type AdminUsers, type MeStatus, type Tracking, type TgData, type RtbBrand, type BrandStats } from "./api";
import { SignalModal, SignalsFeed, TelegramDeskFeed, CSS as DASH_CSS } from "./Dash";
import Constellation from "./Constellation";

const PAGE_LABEL: Record<string, string> = {
  "/": "Home", "/signup": "10X Landing", "/login": "Login", "/members": "Members", "/admin": "Admin",
};
const label = (p: string) => PAGE_LABEL[p] || p;
const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const num = (n: any) => Number(n) || 0;
const shortDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return "—"; } };

const CSS = `
.ad *{box-sizing:border-box}
.ad{min-height:100vh;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow-x:clip;background:radial-gradient(1100px 650px at 78% -10%,rgba(107,180,226,.10),transparent 60%),radial-gradient(900px 600px at 8% 110%,rgba(46,122,180,.09),transparent 60%),#05070d}
.ad .top,.ad .wrap,.ad main{position:relative;z-index:1}
/* animated constellation backdrop (canvas), fixed behind all content */
.ad .adconst{position:fixed;inset:0;z-index:0;width:100%;height:100%;pointer-events:none;display:block}
.ad .top{position:sticky;top:0;z-index:20;background:rgba(5,7,13,.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06)}
.ad .topin{max-width:1080px;margin:0 auto;padding:0 18px;display:flex;align-items:center;justify-content:space-between;height:60px;gap:10px}
.ad .brand{display:flex;align-items:center;gap:9px}
.ad .brand img{height:32px;width:32px;border-radius:8px;object-fit:contain}
.ad .brand b{font-weight:900;font-size:15px}
.ad .brand .tag{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7cbde6;border:1px solid rgba(63,146,204,.35);border-radius:99px;padding:3px 8px;margin-left:4px}
.ad .who{display:flex;align-items:center;gap:10px}
.ad .who .em{font-size:12px;color:rgba(255,255,255,.6)}
.ad .lo{height:32px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:none;color:rgba(255,255,255,.8);font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.ad .wrap{max-width:1080px;margin:0 auto;padding:22px 18px 60px}
.ad h1{font-size:24px;font-weight:900;letter-spacing:-.02em}
.ad .lead{color:rgba(255,255,255,.55);font-size:14px;margin-top:4px}
.ad .adlayout{display:grid;grid-template-columns:1fr;gap:18px;margin-top:20px}
@media(min-width:860px){.ad .adlayout{grid-template-columns:210px 1fr;align-items:start}}
.ad .adside{display:flex;flex-direction:row;gap:8px;overflow-x:auto;position:sticky;top:12px;padding-bottom:4px}
@media(min-width:860px){.ad .adside{flex-direction:column;overflow:visible}}
.ad .adtab{display:flex;align-items:center;gap:10px;height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);color:rgba(255,255,255,.7);font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;transition:.15s;font-family:inherit;flex:none}
@media(min-width:860px){.ad .adtab{width:100%}}
.ad .adtab .tic{font-size:16px}
.ad .adtab:hover{color:#fff;border-color:rgba(255,255,255,.16)}
.ad .adtab.on{color:#0d1420;background:linear-gradient(90deg,#6bb4e2,#2e7ab4);border-color:transparent;box-shadow:0 10px 26px -14px rgba(107,180,226,.7)}
.ad .adbody{min-width:0}
.ad .adbody .kick:first-child{margin-top:0}
.ad .broadcast{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:0;border:1px solid rgba(63,146,204,.32);background:linear-gradient(120deg,rgba(63,146,204,.09),rgba(86,164,216,.05));border-radius:16px;padding:18px 20px}
.ad .broadcast .bico{font-size:30px;line-height:1}
.ad .broadcast .btxt{display:flex;flex-direction:column;gap:3px;min-width:220px;flex:1}
.ad .broadcast .btxt b{color:#fff;font-size:15px;font-weight:900}
.ad .broadcast .btxt span{color:rgba(255,255,255,.55);font-size:12.5px;line-height:1.5;max-width:60ch}
.ad .broadcast .bbtn{margin-left:auto;height:44px;padding:0 20px;border:none;border-radius:12px;font-weight:900;font-size:13.5px;color:#0d1420;background:linear-gradient(90deg,#3f92cc,#cfe7fa);cursor:pointer;white-space:nowrap}
.ad .broadcast .bbtn:hover{filter:brightness(1.06)}
.ad .autopost{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:12px;border:1px solid rgba(86,164,216,.28);background:linear-gradient(120deg,rgba(86,164,216,.08),rgba(46,122,180,.05));border-radius:16px;padding:14px 18px}
.ad .autopost .aptxt{display:flex;flex-direction:column;gap:3px;min-width:220px;flex:1}
.ad .autopost .aptxt b{color:#fff;font-size:14px;font-weight:900}
.ad .autopost .aptxt span{color:rgba(255,255,255,.55);font-size:12px;line-height:1.5;max-width:56ch}
.ad .autopost .apseg{display:flex;gap:6px;margin-left:auto;background:#05070d;border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:4px}
.ad .autopost .apseg button{height:34px;padding:0 13px;border:none;background:transparent;border-radius:8px;color:rgba(255,255,255,.6);font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap}
.ad .autopost .apseg button.on{background:linear-gradient(90deg,#6bb4e2,#2e7ab4);color:#0d1420}
.ad .kick{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(107,180,226,.8);margin:26px 0 12px}
.ad .kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(min-width:720px){.ad .kpis{grid-template-columns:repeat(4,1fr)}}
.ad .kpi{border:1px solid rgba(255,255,255,.09);background:#0b0c12;border-radius:16px;padding:18px}
.ad .kpi .l{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.ad .kpi .v{font-size:28px;font-weight:900;margin-top:6px;font-variant-numeric:tabular-nums;background:linear-gradient(90deg,#6bb4e2,#2a72a8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ad .kpi .s{font-size:12px;color:rgba(255,255,255,.4);margin-top:4px}
.ad .panel{border:1px solid rgba(255,255,255,.09);background:#0b0c12;border-radius:18px;padding:20px;min-width:0}
.ad .cols{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:820px){.ad .cols{grid-template-columns:1fr 1fr}}
.ad .ph{font-size:14px;font-weight:800;margin-bottom:14px}
/* 14-day chart */
.ad .chart{display:flex;align-items:flex-end;gap:6px;height:150px;padding-top:8px}
.ad .bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.ad .bar .col{width:100%;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#6bb4e2,#2e7ab4);min-height:3px;transition:.2s}
.ad .bar .dd{font-size:9px;color:rgba(255,255,255,.35);white-space:nowrap}
/* rows */
.ad .row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid rgba(255,255,255,.05)}
.ad .row:first-child{border-top:none}
.ad .row .nm{font-size:13.5px;color:rgba(255,255,255,.85);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ad .row .nm.land{color:#b3daf4;font-weight:700}
/* users table */
.ad .utable{padding:0;overflow:hidden}
.ad .scrollx{overflow-x:auto}
.ad table{width:100%;border-collapse:collapse;min-width:640px}
.ad th{text-align:left;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.4);padding:11px 10px;border-bottom:1px solid rgba(255,255,255,.07);white-space:nowrap}
.ad th.r,.ad td.r{text-align:right}
.ad td{padding:10px 10px;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;vertical-align:middle;white-space:nowrap}
.ad tbody tr:hover{background:rgba(255,255,255,.02)}
.ad .uname{font-weight:700;color:#fff}
.ad .deskpill{margin-left:8px;font-size:9.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:6px;color:#85c8f4;background:rgba(63,146,204,.13);border:1px solid rgba(63,146,204,.32);white-space:nowrap}
.ad .uemail2{font-size:11.5px;color:rgba(255,255,255,.45)}
.ad td.dim{color:rgba(255,255,255,.5)}
.ad td.mono{font-family:ui-monospace,monospace;font-weight:700;color:#d8ecfb}
.ad .ref{font-size:12px;font-weight:700;color:#8fc3e6;background:rgba(46,122,180,.12);border:1px solid rgba(46,122,180,.25);border-radius:99px;padding:2px 9px;white-space:nowrap}
.ad .usort{display:flex;align-items:center;gap:8px;margin:14px 0 6px;font-size:12px;color:rgba(255,255,255,.45)}
.ad .us{height:30px;padding:0 12px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:none;color:rgba(255,255,255,.7);font-size:12px;font-weight:700;cursor:pointer}
.ad .us.on{border-color:rgba(107,180,226,.4);background:rgba(107,180,226,.1);color:#d8ecfb}
.ad .ufilters{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0 4px}
.ad .usearch{flex:1;min-width:200px;height:38px;padding:0 14px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#fff;font-size:13px;outline:none}
.ad .usearch:focus{border-color:rgba(107,180,226,.4);background:rgba(107,180,226,.05)}
.ad .usearch::placeholder{color:rgba(255,255,255,.35)}
.ad .uchips{display:flex;flex-wrap:wrap;gap:6px}
.ad .ucount{padding:10px 14px 0;font-size:11.5px;font-weight:700;color:rgba(255,255,255,.4)}
.ad .loginas{font-size:12px;font-weight:800;color:#b3daf4;white-space:nowrap;text-decoration:none}
.ad .loginas:hover{color:#d8ecfb;text-decoration:underline}
.ad tr.urow{cursor:pointer;transition:background .12s}
.ad tr.urow:hover{background:rgba(255,255,255,.035)}
.ad .mdlbg{position:fixed;inset:0;z-index:60;background:rgba(3,5,10,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;animation:mfade .16s ease}
@keyframes mfade{from{opacity:0}to{opacity:1}}
.ad .mdl{position:relative;width:100%;max-width:440px;background:#0a1018;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:22px;box-shadow:0 40px 120px -30px rgba(0,0,0,.9);animation:mpop .18s cubic-bezier(.2,.8,.2,1)}
@keyframes mpop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.ad .mdlx{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:13px;cursor:pointer}
.ad .mdlx:hover{background:rgba(255,255,255,.12);color:#fff}
.ad .mdlhead{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.ad .mav{flex:none;width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#3e9ad8,#24638f);color:#fff;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center}
.ad .mnm{font-weight:800;color:#fff;font-size:17px}
.ad .mem{color:rgba(255,255,255,.55);font-size:13px;word-break:break-all}
.ad .mtags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.ad .mgrid{border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}
.ad .mrow{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
.ad .mrow:last-child{border-bottom:none}
.ad .mk{color:rgba(255,255,255,.5);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.ad .mv{color:#fff;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;text-align:right}
.ad .mact{display:flex;gap:10px;margin-top:16px}
.ad .mbtn{flex:1;text-align:center;padding:11px;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none;background:linear-gradient(90deg,#3e9ad8,#24638f);color:#fff;border:none}
.ad .mbtn:hover{filter:brightness(1.07)}
.ad .mbtn.ghost{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#bfdff4}
.ad .mbtn:disabled{opacity:.5;cursor:default}
.ad .row .vv{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;flex:none}
.ad .row .vv small{color:rgba(255,255,255,.4);font-weight:600;margin-left:6px}
/* tracking codes */
.ad .track{display:grid;grid-template-columns:1fr;gap:10px;margin-top:2px}
@media(min-width:640px){.ad .track{grid-template-columns:1fr 1fr 1fr}}
.ad .tc{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;background:rgba(255,255,255,.02)}
.ad .tc .t{font-size:12px;font-weight:800;color:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:space-between;gap:8px}
.ad .tc .tin{width:100%;margin-top:10px;height:38px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#b3daf4;font-family:ui-monospace,monospace;font-size:12.5px;padding:0 11px;outline:none}
.ad .tc .tin:focus{border-color:rgba(107,180,226,.55)}
.ad .saverow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
.ad .save{height:40px;padding:0 20px;border:none;border-radius:11px;font-weight:800;font-size:13.5px;color:#0d1420;cursor:pointer;background:linear-gradient(90deg,#6bb4e2,#2e7ab4,#2a72a8)}
.ad .save:disabled{opacity:.6;cursor:default}
.ad .ok{font-size:13px;color:#6ee7b7;font-weight:700}
.ad .pill{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:99px;padding:3px 8px}
.ad .pill.on{color:#6ee7b7;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3)}
.ad .pill.no{color:rgba(255,255,255,.5);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}
.ad button.pill{cursor:pointer;font-family:inherit;line-height:1.4}
.ad button.pill.siglock:hover{background:rgba(244,63,94,.12);border-color:rgba(244,63,94,.35);color:#fda4af}
.ad .pill.unlockbtn{color:#d8ecfb;background:rgba(107,180,226,.10);border:1px solid rgba(107,180,226,.35)}
.ad .pill.unlockbtn:hover{background:rgba(107,180,226,.18);color:#d2ebfb}
.ad .pill.kycbtn{cursor:pointer;color:#6ee7b7;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.35)}
.ad .pill.kycbtn:hover{background:rgba(52,211,153,.2);color:#aad3ee}
.ad .kycsub{opacity:.55;font-weight:700;text-transform:capitalize;margin-left:3px}
.ad .note{font-size:12.5px;color:rgba(255,255,255,.45);margin-top:12px;line-height:1.6}
.ad .center{min-height:100vh;display:grid;place-items:center;color:rgba(255,255,255,.5)}
`;

/* "Continue with Google" ON THE CODE SCREEN.
   Arriving at /admin with an existing member session never re-triggers Google, so the token in hand
   has no admin scope and the code screen is all that can be offered — even though signing in with
   Google would prove the same mailbox instantly. This lets them do exactly that without signing out
   first. Hidden until Google actually paints, so a blocked origin or an ad-blocker leaves the code
   path standing rather than a dead button. */
function GoogleUnlock({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const slot = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let dead = false;
    const cb = async (resp: any) => {
      if (!resp?.credential) { onError("Google didn't return a sign-in."); return; }
      try {
        await googleLogin(resp.credential);
        if (hasAdminScope()) onDone();
        else onError("Signed in, but this account still needs the emailed code.");
      } catch (e: any) { if (!dead) onError(e?.message || "Google sign-in failed"); }
    };
    const init = (id: string) => {
      if (dead || !id || !(window as any).google?.accounts?.id || !slot.current) return;
      (window as any).google.accounts.id.initialize({ client_id: id, callback: cb, itp_support: true, auto_select: false });
      (window as any).google.accounts.id.renderButton(slot.current, {
        theme: "filled_black", size: "large", shape: "pill", text: "continue_with", logo_alignment: "center", width: 340,
      });
      const check = () => { if (!dead && slot.current && slot.current.childElementCount > 0) setReady(true); };
      [300, 900, 1800, 3000].forEach((t) => setTimeout(check, t));
    };
    (async () => {
      const id = await fetchGoogleClientId();
      if (!id || dead) return;
      if ((window as any).google?.accounts?.id) return init(id);
      const sc = document.createElement("script");
      sc.src = "https://accounts.google.com/gsi/client";
      sc.async = true; sc.defer = true;
      sc.onload = () => init(id);
      document.head.appendChild(sc);
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div ref={slot} style={{ display: ready ? "flex" : "none", justifyContent: "center", marginBottom: 14 }} />
      {ready && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>OR USE A CODE</span>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
        </div>
      )}
    </>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [me, setMe] = useState<MeStatus | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [usersData, setUsersData] = useState<AdminUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<Tracking>({ googleAnalytics: "", metaPixel: "", tiktokPixel: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userSort, setUserSort] = useState<"new" | "wallet" | "funded">("new");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "funded" | "unfunded" | "allocating" | "trading" | "signals" | "verified">("all");
  const [busyUnlock, setBusyUnlock] = useState<string | null>(null);
  const [busyKyc, setBusyKyc] = useState<string | null>(null);
  const [autopost, setAutopostMode] = useState<"all" | "admins" | "off">("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSignal, setShowSignal] = useState(false);
  const [signalsKey, setSignalsKey] = useState(0); // bump to reload the posted-signals list after posting
  const [adTab, setAdTab] = useState<"signals" | "telegram" | "brands" | "members" | "analytics" | "tracking">("signals");
  // Emailed-code step-up. The console stays sealed until the code is verified — the password alone
  // no longer opens it. Kept above the early returns below, like every other hook here.
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const toggleUnlock = async (u: { id: string; name?: string; email?: string; signalsUnlocked?: boolean }) => {
    const lock = !!u.signalsUnlocked;
    if (lock && !confirm(`Re-lock ${u.name || u.email}? They'll need to fund to unlock again (unless their balance still qualifies).`)) return;
    setBusyUnlock(u.id);
    const ok = await setMemberUnlock(u.id, lock);
    if (ok) setUsersData((d) => (d ? { ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, signalsUnlocked: !lock } : x)) } : d));
    setBusyUnlock(null);
  };

  const approveKyc = async (u: { id: string; name?: string; email?: string }) => {
    setBusyKyc(u.id);
    const ok = await approveMemberKyc(u.id);
    if (ok) setUsersData((d) => (d ? { ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, kyc: "verified" } : x)) } : d));
    setBusyKyc(null);
  };

  useEffect(() => {
    if (!getToken()) { navigate("/login"); return; }
    (async () => {
      const m = await fetchMe();
      if (!m) { navigate("/login"); return; }
      if (!m.isAdmin) { navigate("/members"); return; }
      setMe(m);
      // On the allowlist, but this browser hasn't passed the emailed code (or the 12h unlock ran
      // out). Send one and hold at the code screen — no admin data is fetched until it's verified.
      if (!hasAdminScope()) {
        setNeedCode(true);
        const sent = await requestAdminCode();
        setCodeSent(sent);
        return;
      }
      const [a, u, ap] = await Promise.all([fetchAnalytics(), fetchAdminUsers(), fetchAutopost()]);
      setData(a);
      setUsersData(u);
      setAutopostMode(ap);
      if (a?.tracking) setCodes(a.tracking);
    })().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    setSaving(true); setSaved(false);
    try { const t = await saveTracking(codes); if (t) { setCodes(t); setSaved(true); setTimeout(() => setSaved(false), 2500); } }
    catch { /* keep values */ }
    finally { setSaving(false); }
  };

  const doLogout = () => { logout(); navigate("/login"); };

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setCodeErr("Enter the 6-digit code from your email."); return; }
    setCodeBusy(true); setCodeErr("");
    const r = await verifyAdminCode(code.trim());
    if (!r.ok) { setCodeErr(r.error || "That code isn't right."); setCodeBusy(false); return; }
    // Verified — reload so the console fetches everything with the admin-scope token.
    window.location.reload();
  };

  if (loading) return <div className="ad"><style>{CSS}</style><div className="center">Loading analytics…</div></div>;
  if (!me?.isAdmin) return null;
  if (needCode) return (
    <div className="ad"><style>{CSS}</style>
      <div className="center">
        <div style={{ width: "min(420px,92vw)", background: "#16130c", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Verify it's you</div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", lineHeight: 1.6, marginBottom: 18 }}>
            {codeSent
              ? <>We emailed a 6-digit code to <b style={{ color: "#cfe7fa" }}>{me.email}</b>. It expires in 10 minutes.</>
              : <>We couldn't send the code. Check your connection and try again.</>}
          </div>
          <GoogleUnlock onDone={() => window.location.reload()} onError={(m) => setCodeErr(m)} />
          <input
            value={code} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submitCode(); }}
            placeholder="000000"
            style={{ width: "100%", background: "#0a1018", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: ".26em", textAlign: "center", padding: "12px 14px", outline: "none" }}
          />
          {codeErr && <div style={{ color: "#ffb4b4", fontSize: 12.5, marginTop: 10 }}>{codeErr}</div>}
          <button
            onClick={submitCode} disabled={codeBusy}
            style={{ width: "100%", marginTop: 16, padding: "12px 14px", borderRadius: 10, border: "none", cursor: codeBusy ? "default" : "pointer", background: "linear-gradient(135deg,#3e9ad8,#24638f)", color: "#fff", fontSize: 14.5, fontWeight: 800, opacity: codeBusy ? 0.6 : 1 }}
          >{codeBusy ? "Checking…" : "Unlock admin console"}</button>
          <button
            onClick={async () => { setCodeErr(""); setCodeSent(await requestAdminCode()); }}
            style={{ width: "100%", marginTop: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,.65)", fontSize: 13, fontWeight: 700 }}
          >Send a new code</button>
          <div className="note">Didn't request this? Someone has your password — change it now.</div>
        </div>
      </div>
    </div>
  );

  const maxDay = Math.max(1, ...((data?.byDay || []).map((d) => d.views)));
  const fields: { key: keyof Tracking; label: string; ph: string }[] = [
    { key: "googleAnalytics", label: "Google Analytics", ph: "G-XXXXXXXXXX" },
    { key: "metaPixel", label: "Meta (Facebook) Pixel", ph: "1234567890" },
    { key: "tiktokPixel", label: "TikTok Pixel", ph: "CXXXXXXXXXXXXXXXXX" },
  ];

  return (
    <div className="ad">
      <style>{CSS}</style>
      <Constellation className="adconst" />
      <div className="top"><div className="topin">
        <div className="brand"><img src="/logo.svg" alt="Copy the Rich Trades" /><b>Copy the Rich Trades</b><span className="tag">Admin</span></div>
        <div className="who">
          <span className="em">{me.email}</span>
          <a className="lo" href="/members?demo=1" title="Preview the new-member experience">👁 Demo view</a>
          <a className="lo" href="/members">Members</a>
          <button className="lo" onClick={doLogout}>Log out</button>
        </div>
      </div></div>

      <div className="wrap">
        <h1>Admin</h1>
        <div className="lead">Signals, the Telegram channel, members and site analytics — pick a section.</div>

        <div className="adlayout">
          <aside className="adside">
            {([["signals", "⚡", "Signals"], ["telegram", "✈️", "Telegram"], ["brands", "🏷️", "Brands"], ["members", "👥", "Members"], ["analytics", "📊", "Analytics"], ["tracking", "🎯", "Tracking"]] as const).map(([k, ic, lb]) => (
              <button key={k} className={`adtab ${adTab === k ? "on" : ""}`} onClick={() => setAdTab(k)}><span className="tic">{ic}</span>{lb}</button>
            ))}
          </aside>
          <div className="adbody">

        {adTab === "signals" && (<>
        {/* Broadcast a Gold Pulse / Tap-to-Trade signal to every member's feed in one click. */}
        <div className="broadcast">
          <span className="bico">⚡</span>
          <div className="btxt">
            <b>Send a Tap to Trade signal</b>
            <span>Post a Gold Pulse call — entry zone, TP1–6 ladder and stop. It goes straight to every member's feed, ready to tap on their own account.</span>
          </div>
          <button className="bbtn" onClick={() => setShowSignal(true)}>＋ Send signal to everyone</button>
        </div>

        {/* Auto-import: signals posted in the Gold Pulse Telegram channel flow straight into the feed. */}
        <div className="autopost">
          <div className="aptxt"><b>✈️ Auto-post from Telegram</b><span>When a call is posted in the Gold Pulse channel, it's parsed and dropped into the Tap-to-Trade feed automatically.</span></div>
          <div className="apseg">
            {([["all", "📣 Everyone"], ["admins", "🔒 Admins only"], ["off", "⏸ Off"]] as const).map(([m, lb]) => (
              <button key={m} className={autopost === m ? "on" : ""} onClick={async () => { const prev = autopost; setAutopostMode(m); const ok = await setAutopost(m); if (!ok) setAutopostMode(prev); }}>{lb}</button>
            ))}
          </div>
        </div>

        {/* Live channel chat — the raw Telegram calls that get parsed into the signals below. */}
        <div style={{ marginTop: 18 }}><TelegramDeskFeed /></div>

        {/* The live signals you've posted — so you can see, track and manage them right here. */}
        <div className="rtd" style={{ marginTop: 18 }}>
          <style>{DASH_CSS}</style>
          <SignalsFeed key={signalsKey} isHost />
        </div>
        </>)}

        {adTab === "telegram" && <TelegramManager />}

        {adTab === "brands" && <BrandsManager />}

        {adTab === "analytics" && (<>
        <div className="kick" style={{ marginTop: 0 }}>Overview</div>
        <div className="kpis">
          <div className="kpi"><div className="l">Total views</div><div className="v">{(data?.totals.views ?? 0).toLocaleString()}</div><div className="s">All time</div></div>
          <div className="kpi"><div className="l">Unique visitors</div><div className="v">{(data?.totals.visitors ?? 0).toLocaleString()}</div><div className="s">By IP, all time</div></div>
          <div className="kpi"><div className="l">Views today</div><div className="v">{(data?.today.views ?? 0).toLocaleString()}</div><div className="s">{data?.today.visitors ?? 0} visitors</div></div>
          <div className="kpi"><div className="l">10X landing views</div><div className="v">{(data?.signupViews ?? 0).toLocaleString()}</div><div className="s">/signup all time</div></div>
        </div>

        {/* CRYPTO DEPOSITS — Emery's network alone */}
        {data?.cryptoDeposits && (
          <>
            <div className="kick">Crypto deposits · your network</div>
            <div className="kpis">
              <div className="kpi"><div className="l">Lifetime crypto in</div><div className="v">{money(data.cryptoDeposits.totalUsd)}</div><div className="s">on-chain, all time</div></div>
              <div className="kpi"><div className="l">Deposits</div><div className="v">{data.cryptoDeposits.deposits.toLocaleString()}</div><div className="s">completed</div></div>
              <div className="kpi"><div className="l">Depositors</div><div className="v">{data.cryptoDeposits.depositors.toLocaleString()}</div><div className="s">unique members</div></div>
              <div className="kpi"><div className="l">Today</div><div className="v">{money(data.cryptoDeposits.todayUsd)}</div><div className="s">crypto in today</div></div>
            </div>
          </>
        )}
        </>)}

        {/* USERS */}
        {adTab === "members" && usersData && (
          <>
            <div className="kick">Users</div>
            <div className="kpis">
              {/* Every figure here is members only — the desk's own accounts are excluded, so Anthony's
                  personal balance never inflates the network numbers. Said out loud on each tile,
                  because his row sits in the list below showing a balance that ISN'T in these totals. */}
              <div className="kpi"><div className="l">Total signups</div><div className="v">{usersData.summary.total.toLocaleString()}</div><div className="s">members · excl. desk</div></div>
              <div className="kpi"><div className="l">Funded / allocating</div><div className="v">{usersData.summary.funded.toLocaleString()}</div><div className="s">trading or in the PAMM</div></div>
              <div className="kpi"><div className="l">Total in wallets</div><div className="v">{money(usersData.summary.totalWallet)}</div><div className="s">members · excl. desk</div></div>
              <div className="kpi"><div className="l">Total funded</div><div className="v">{money(usersData.summary.totalFunded)}</div><div className="s">live + PAMM · excl. desk</div></div>
            </div>
            <div className="ufilters">
              <input
                className="usearch"
                placeholder="Search name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <div className="uchips">
                {([
                  ["all", "All"], ["funded", "Funded"], ["unfunded", "Unfunded"],
                  ["allocating", "PAMM"], ["trading", "Trading"], ["signals", "Signals"], ["verified", "Verified"],
                ] as const).map(([k, label]) => (
                  <button key={k} className={`us ${userFilter === k ? "on" : ""}`} onClick={() => setUserFilter(k)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="usort">
              <span>Sort:</span>
              {(["new", "wallet", "funded"] as const).map((k) => (
                <button key={k} className={`us ${userSort === k ? "on" : ""}`} onClick={() => setUserSort(k)}>{k === "new" ? "Newest" : k === "wallet" ? "Top wallet" : "Top funded"}</button>
              ))}
            </div>
            {(() => {
              const q = userSearch.trim().toLowerCase();
              const visible = usersData.users.filter((u) => {
                if (q && !(`${u.name || ""} ${u.email || ""}`.toLowerCase().includes(q))) return false;
                const funded = num(u.liveBalance) + num(u.pammBalance) > 0;
                const kyc = (u.kyc || "").toLowerCase();
                switch (userFilter) {
                  case "funded": return funded;
                  case "unfunded": return !funded;
                  case "allocating": return !!u.allocating;
                  case "trading": return !!u.trading;
                  case "signals": return !!u.signalsUnlocked;
                  case "verified": return kyc === "verified" || kyc === "approved";
                  default: return true;
                }
              }).sort((a, b) =>
                userSort === "wallet" ? num(b.walletBalance) - num(a.walletBalance)
                  : userSort === "funded" ? (num(b.liveBalance) + num(b.pammBalance)) - (num(a.liveBalance) + num(a.pammBalance))
                    : 0
              );
              return (
                <div className="panel utable">
                  <div className="ucount">{visible.length} of {usersData.users.length} members</div>
                  <div className="scrollx">
                    <table>
                      <thead><tr><th>User</th><th>Joined</th><th className="r">Wallet</th><th className="r">Funded</th><th>Activity</th><th>Signals</th><th>KYC</th><th></th></tr></thead>
                      <tbody>
                        {visible.map((u) => (
                      <tr key={u.id} className="urow" onClick={() => setDetailId(u.id)} title="View member details">
                        <td><div className="uname">{u.name || "—"}{u.isDesk && <span className="deskpill" title="The desk's own account — its balance is NOT counted in the totals above">Desk · not in totals</span>}</div><div className="uemail2">{u.email}</div></td>
                        <td className="dim">{shortDate(u.joined)}</td>
                        <td className="r mono">{money(u.walletBalance)}</td>
                        <td className="r mono">{money(num(u.liveBalance) + num(u.pammBalance))}</td>
                        <td>
                          {u.allocating && <span className="pill on">PAMM</span>}
                          {u.trading && <span className="pill on" style={{ marginLeft: u.allocating ? 4 : 0 }}>Trading</span>}
                          {!u.allocating && !u.trading && <span className="dim">—</span>}
                        </td>
                        <td>
                          {busyUnlock === u.id
                            ? <span className="pill">…</span>
                            : u.signalsUnlocked
                              ? <button className="pill on siglock" onClick={(e) => { e.stopPropagation(); toggleUnlock(u); }} title="Unlocked — click to re-lock">Unlocked</button>
                              : <button className="pill unlockbtn" onClick={(e) => { e.stopPropagation(); toggleUnlock(u); }} title="Click to unlock this member">🔓 Unlock</button>}
                        </td>
                        <td>
                          {String(u.kyc).toLowerCase() === "verified"
                            ? <span className="pill on">Verified</span>
                            : busyKyc === u.id
                              ? <span className="pill">…</span>
                              : <button className="pill kycbtn" onClick={(e) => { e.stopPropagation(); approveKyc(u); }} title={`KYC ${u.kyc} — click to approve on Pulse`}>✓ Approve</button>}
                        </td>
                        <td><a className="loginas" href={adminLoginAsUrl(u.id)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Open their account in Pulse">Log in as →</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                  {usersData.users.length === 0 && <div className="note" style={{ padding: "16px" }}>No signups yet.</div>}
                  {usersData.users.length > 0 && visible.length === 0 && <div className="note" style={{ padding: "16px" }}>No members match this filter.</div>}
                  </div>
                );
              })()}
          </>
        )}

        {(() => {
          const du = detailId ? usersData?.users.find((x) => x.id === detailId) : null;
          if (!du) return null;
          const totalFunded = num(du.liveBalance) + num(du.pammBalance);
          const rows: [string, any][] = [
            ["Member #", du.displayId],
            ["Joined", (() => { try { return new Date(du.joined).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); } catch { return "—"; } })()],
            ["KYC", <span style={{ textTransform: "capitalize" }}>{du.kyc || "—"}</span>],
            ["Wallet balance", money(du.walletBalance)],
            ["Live trading", money(du.liveBalance)],
            ["In the PAMM", money(du.pammBalance)],
            ["Total funded", money(totalFunded)],
            ["Referred by", du.referredBy || "—"],
          ];
          return (
            <div className="mdlbg" onClick={() => setDetailId(null)}>
              <div className="mdl" onClick={(e) => e.stopPropagation()}>
                <button className="mdlx" onClick={() => setDetailId(null)} aria-label="Close">✕</button>
                <div className="mdlhead">
                  <div className="mav">{(du.name || du.email || "?").trim().charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="mnm">{du.name || "—"}</div>
                    <div className="mem">{du.email}</div>
                  </div>
                </div>
                <div className="mtags">
                  {du.allocating && <span className="pill on">PAMM</span>}
                  {du.trading && <span className="pill on">Trading</span>}
                  {du.signalsUnlocked ? <span className="pill on">🔓 Signals unlocked</span> : <span className="pill">🔒 Signals locked</span>}
                  {!du.allocating && !du.trading && <span className="pill">Not funded yet</span>}
                </div>
                <div className="mgrid">
                  {rows.map(([k, v]) => (
                    <div className="mrow" key={k}><span className="mk">{k}</span><span className="mv">{v}</span></div>
                  ))}
                </div>
                {String(du.kyc).toLowerCase() !== "verified" && (
                  <div className="mact" style={{ marginTop: 12 }}>
                    {busyKyc === du.id
                      ? <button className="mbtn" disabled>Approving…</button>
                      : <button className="mbtn" onClick={() => approveKyc(du)}>✓ Approve KYC (Pulse + here)</button>}
                  </div>
                )}
                <div className="mact">
                  {busyUnlock === du.id
                    ? <button className="mbtn" disabled>Working…</button>
                    : du.signalsUnlocked
                      ? <button className="mbtn ghost" onClick={() => toggleUnlock(du)}>Re-lock signals</button>
                      : <button className="mbtn" onClick={() => toggleUnlock(du)}>🔓 Unlock signals</button>}
                  <a className="mbtn ghost" href={adminLoginAsUrl(du.id)} target="_blank" rel="noopener noreferrer">Log in as →</a>
                </div>
              </div>
            </div>
          );
        })()}

        {adTab === "analytics" && (<>
        <div className="kick">Last 14 days</div>
        <div className="panel">
          {data?.byDay && data.byDay.length > 0 ? (
            <div className="chart">
              {data.byDay.map((d) => (
                <div className="bar" key={d.day} title={`${d.day}: ${d.views} views · ${d.visitors} visitors`}>
                  <div className="col" style={{ height: `${Math.round((d.views / maxDay) * 130)}px` }} />
                  <div className="dd">{d.day.slice(5)}</div>
                </div>
              ))}
            </div>
          ) : <div className="note">No pageviews recorded yet — data appears as visitors land on the site.</div>}
        </div>

        <div className="cols" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="ph">Top pages</div>
            {(data?.byPath || []).map((p) => (
              <div className="row" key={p.path}>
                <span className={`nm ${p.path === "/signup" ? "land" : ""}`} title={p.path}>{label(p.path)} <span style={{ color: "rgba(255,255,255,.3)", fontWeight: 400 }}>{p.path}</span></span>
                <span className="vv">{p.views.toLocaleString()}<small>{p.visitors} vis</small></span>
              </div>
            ))}
            {(!data?.byPath || data.byPath.length === 0) && <div className="note">No page data yet.</div>}
          </div>
          <div className="panel">
            <div className="ph">Top referrers</div>
            {(data?.referrers || []).map((r, i) => (
              <div className="row" key={i}>
                <span className="nm" title={r.referrer}>{r.referrer}</span>
                <span className="vv">{r.views.toLocaleString()}</span>
              </div>
            ))}
            {(!data?.referrers || data.referrers.length === 0) && <div className="note">No referrer data yet.</div>}
          </div>
        </div>
        </>)}

        {adTab === "tracking" && (<>
        <div className="kick" style={{ marginTop: 0 }}>Tracking codes</div>
        <div className="panel">
          <div className="track">
            {fields.map((f) => {
              const val = codes[f.key];
              return (
                <div className="tc" key={f.key}>
                  <div className="t">{f.label}<span className={`pill ${val ? "on" : "no"}`}>{val ? "Active" : "Off"}</span></div>
                  <input
                    className="tin"
                    value={val}
                    placeholder={f.ph}
                    spellCheck={false}
                    onChange={(e) => setCodes({ ...codes, [f.key]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
          <div className="saverow">
            <button className="save" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save tracking codes"}</button>
            {saved && <span className="ok">✓ Saved — live on every page, including the 10X landing.</span>}
          </div>
          <div className="note">
            Paste each ID and hit save — the pixels fire on the whole site (home, login, members) <b>and the /signup landing</b>. Leave a field blank to remove it.
            Admins: {(data?.admins || []).join(", ")}.
          </div>
        </div>
        </>)}

          </div>
        </div>
      </div>

      {showSignal && (
        <div className="rtd"><style>{DASH_CSS}</style>
          <SignalModal onClose={() => setShowSignal(false)} onSaved={() => { setShowSignal(false); setSignalsKey((k) => k + 1); }} />
        </div>
      )}
    </div>
  );
}

// Brands — white-label partners in the network. Each gets its own domain and skin, but runs on the same
// Copy the Rich Trades plumbing (members, signals, Tap-to-Trade), and its signups roll up under its ref code.
const usd0 = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const BRAND_BLANK: Partial<RtbBrand> ={ name: "", slug: "", domain: "", status: "setup", ownerEmail: "", refCode: "", logoUrl: "", accent: "#6bb4e2", tagline: "", telegramUrl: "", notes: "" };
const BRAND_STATUS: { k: RtbBrand["status"]; lb: string }[] = [
  { k: "setup", lb: "🛠 In setup" }, { k: "live", lb: "🟢 Live" }, { k: "paused", lb: "⏸ Paused" },
];

function BrandsManager() {
  const [brands, setBrands] = useState<RtbBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<RtbBrand> | null>(null);   // null = form closed
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [delId, setDelId] = useState<string | null>(null);
  // Clicking a brand opens its numbers inline: signups attributed to its code, the downline under
  // them, and how much of that is actually funded. One brand open at a time keeps the list readable.
  const [openId, setOpenId] = useState<string | null>(null);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [statsBusy, setStatsBusy] = useState(false);

  const toggleStats = async (b: RtbBrand) => {
    if (openId === b.id) { setOpenId(null); setStats(null); return; }
    setOpenId(b.id); setStats(null); setStatsBusy(true);
    try { setStats(await fetchBrandStats(b.id)); }
    finally { setStatsBusy(false); }
  };

  const load = async () => setBrands(await fetchBrands());
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const set = (k: keyof RtbBrand, v: string) => setEdit((e) => ({ ...(e || {}), [k]: v }));
  const save = async () => {
    if (!edit?.name?.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      if (edit.id) await patchBrand(edit.id, edit); else await createBrand(edit);
      setEdit(null); await load();
    } catch (e: any) { setErr(e?.message || "Couldn't save"); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => { setDelId(null); await deleteBrand(id); load(); };

  const field = (k: keyof RtbBrand, label: string, ph: string, wide = false) => (
    <label className={`bfield ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <input value={String(edit?.[k] ?? "")} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
    </label>
  );

  return (
    <>
      <style>{BRANDS_CSS}</style>
      <div className="broadcast">
        <span className="bico">🏷️</span>
        <div className="btxt">
          <b>Brands in the network</b>
          <span>Partner brands running on Copy the Rich Trades tech — their own domain and look, the same signals, members and Tap-to-Trade underneath.</span>
        </div>
        <button className="bbtn" onClick={() => { setErr(""); setEdit({ ...BRAND_BLANK }); }}>＋ Add a brand</button>
      </div>

      {edit && (
        <div className="bform">
          <div className="bfhd">{edit.id ? `Edit ${edit.name || "brand"}` : "New brand"}</div>
          <div className="bgrid">
            {field("name", "Brand name", "Gold Pulse Capital")}
            {field("slug", "Handle", "auto from the name")}
            {field("domain", "Domain", "goldpulsecapital.com")}
            <label className="bfield">
              <span>Status</span>
              <select value={edit.status || "setup"} onChange={(e) => set("status", e.target.value)}>
                {BRAND_STATUS.map((s) => <option key={s.k} value={s.k}>{s.lb}</option>)}
              </select>
            </label>
            {field("ownerEmail", "Owner email", "them@brand.com")}
            {field("refCode", "Referral code", "signups here attribute to this code")}
            {field("logoUrl", "Logo URL", "https://…/logo.png", true)}
            <label className="bfield">
              <span>Accent colour</span>
              <span className="bcolor">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(String(edit.accent || "")) ? String(edit.accent) : "#6bb4e2"} onChange={(e) => set("accent", e.target.value)} />
                <input value={String(edit.accent ?? "")} onChange={(e) => set("accent", e.target.value)} placeholder="#6bb4e2" />
              </span>
            </label>
            {field("telegramUrl", "Telegram / signals link", "https://t.me/…")}
            {field("tagline", "Tagline", "What this brand says on the tin", true)}
            <label className="bfield wide">
              <span>Notes</span>
              <textarea value={String(edit.notes ?? "")} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Deal terms, who owns the domain, what's left to set up…" />
            </label>
          </div>
          {err && <div className="berr">{err}</div>}
          <div className="bactions">
            <button className="bsave" onClick={save} disabled={busy || !edit.name?.trim()}>{busy ? "Saving…" : edit.id ? "Save changes" : "Create brand"}</button>
            <button className="bcancel" onClick={() => { setEdit(null); setErr(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="bempty">Loading brands…</div>
        : brands.length === 0 ? <div className="bempty">No brands yet. Add the first partner brand — give it a domain, a look and a referral code, and it runs on everything you've already built.</div>
        : (
          <div className="bcards">
            {brands.map((b) => (
              <div key={b.id} className="bcard" style={{ ["--bx" as any]: /^#[0-9a-f]{6}$/i.test(b.accent) ? b.accent : "#6bb4e2" }}>
                <div className={`bcHead open${openId === b.id ? " on" : ""}`} role="button" tabIndex={0}
                  title={`See ${b.name}'s signups and network`}
                  onClick={() => toggleStats(b)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStats(b); } }}>
                  {b.logoUrl ? <img className="blogo" src={b.logoUrl} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <span className="blogo ph">{(b.name || "?").slice(0, 1).toUpperCase()}</span>}
                  <div className="bcName">
                    <b>{b.name}</b>
                    <span>{b.domain ? <a href={`https://${b.domain}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{b.domain}</a> : <i>no domain yet</i>}</span>
                  </div>
                  <span className={`bstatus ${b.status}`}>{BRAND_STATUS.find((s) => s.k === b.status)?.lb || b.status}</span>
                  <span className="bchev" aria-hidden>{openId === b.id ? "▲" : "▼"}</span>
                </div>
                {b.tagline && <p className="btag">{b.tagline}</p>}
                <div className="bmeta">
                  {b.ownerEmail && <span title="Owner">👤 {b.ownerEmail}</span>}
                  {b.refCode && <span title="Signups here attribute to this code">🔗 {b.refCode}</span>}
                  {b.telegramUrl && <a href={b.telegramUrl} target="_blank" rel="noopener noreferrer">✈️ Telegram</a>}
                </div>
                {b.notes && <p className="bnotes">{b.notes}</p>}
                <div className="bcRow">
                  <button className="bmini" onClick={() => { setErr(""); setEdit(b); }}>Edit</button>
                  {b.domain && <a className="bmini" href={`https://${b.domain}`} target="_blank" rel="noopener noreferrer">Visit →</a>}
                  <button className="bmini del" onClick={() => setDelId(b.id)}>Remove</button>
                </div>
                {delId === b.id && (
                  <div className="bconfirm">
                    Remove <b>{b.name}</b> from the network? Their site stops being listed here — members and trades are untouched.
                    <span><button className="bmini del" onClick={() => remove(b.id)}>Yes, remove</button><button className="bmini" onClick={() => setDelId(null)}>Keep</button></span>
                  </div>
                )}
                {openId === b.id && (
                  <div className="bstats">
                    {statsBusy ? <div className="bsnote">Pulling {b.name}'s numbers…</div>
                      : !stats ? <div className="bsnote">Couldn't load the numbers for {b.name}.</div>
                      : !stats.resolved ? (
                        <div className="bsnote">
                          Nothing attributes here yet — the referral code {b.refCode ? <b>{b.refCode}</b> : <i>(not set)</i>} doesn't match any affiliate on Pulse.
                          Set it to the owner's affiliate code and signups on {b.domain || "the domain"} will roll up to them.
                        </div>
                      ) : (
                        <>
                          <div className="bsgrid">
                            <div className="bstile"><b>{stats.summary.network}</b><span>in the network</span></div>
                            <div className="bstile"><b>{stats.summary.direct}</b><span>direct signups</span></div>
                            <div className="bstile"><b>{stats.summary.funded}</b><span>funded</span></div>
                            <div className="bstile"><b>{stats.summary.signalsUnlocked}</b><span>signals unlocked</span></div>
                            <div className="bstile"><b>{usd0(stats.summary.totalFunded)}</b><span>on the desk</span></div>
                            <div className="bstile"><b>{usd0(stats.summary.totalDeposits)}</b><span>deposited</span></div>
                          </div>
                          {stats.signups.length === 0 ? (
                            <div className="bsnote">No signups on this brand yet.</div>
                          ) : (
                            <div className="bswrap">
                              <table className="bstable">
                                <thead><tr><th>Member</th><th>Joined</th><th>Level</th><th className="num">Desk</th><th className="num">Wallet</th><th>Status</th></tr></thead>
                                <tbody>
                                  {stats.signups.map((s) => (
                                    <tr key={s.id}>
                                      <td><b>{s.name || "—"}</b><i>{s.email}</i></td>
                                      <td>{new Date(s.joined).toLocaleDateString()}</td>
                                      <td>{s.direct ? <span className="bpill direct">Direct</span> : <span className="bpill">Network</span>}</td>
                                      <td className="num">{usd0(s.liveBalance + s.pammBalance)}</td>
                                      <td className="num">{usd0(s.walletBalance)}</td>
                                      <td>{s.signalsUnlocked ? <span className="bpill on">Unlocked</span> : <span className="bpill">Locked</span>}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </>
  );
}

const BRANDS_CSS = `
.bform{margin-top:16px;border:1px solid rgba(140,198,234,.2);border-radius:16px;background:#0a1018;padding:18px}
.bfhd{font-size:14px;font-weight:900;color:#fff;margin-bottom:14px}
.bgrid{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:760px){.bgrid{grid-template-columns:1fr 1fr}}
.bfield{display:flex;flex-direction:column;gap:6px}
.bfield.wide{grid-column:1/-1}
.bfield>span{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.bfield input,.bfield select,.bfield textarea{width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);color:#fff;padding:10px 12px;font-size:14px;outline:none;font-family:inherit}
.bfield input:focus,.bfield select:focus,.bfield textarea:focus{border-color:rgba(107,180,226,.6)}
.bcolor{display:flex;gap:8px;align-items:center}
.bcolor input[type=color]{width:44px;height:40px;padding:2px;flex:none;cursor:pointer}
.berr{margin-top:12px;font-size:13px;color:#fca5a5}
.bactions{display:flex;gap:10px;margin-top:16px}
.bsave{border:none;border-radius:11px;padding:11px 20px;font-weight:800;font-size:14px;color:#0d1420;cursor:pointer;background:linear-gradient(90deg,#6bb4e2,#2e7ab4)}
.bsave:disabled{opacity:.5;cursor:default}
.bcancel{border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:11px 20px;font-weight:700;font-size:14px;color:rgba(255,255,255,.7);background:transparent;cursor:pointer}
.bempty{margin-top:16px;border:1px dashed rgba(255,255,255,.14);border-radius:16px;padding:26px;text-align:center;color:rgba(255,255,255,.5);font-size:13.5px;line-height:1.6}
.bcards{margin-top:16px;display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:820px){.bcards{grid-template-columns:1fr 1fr}}
.bcard{position:relative;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:#0a1018;padding:16px;overflow:hidden}
.bcard::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--bx),transparent)}
.bcHead{display:flex;align-items:center;gap:12px}
.blogo{width:40px;height:40px;border-radius:11px;object-fit:contain;background:rgba(255,255,255,.06);flex:none}
.blogo.ph{display:grid;place-items:center;font-weight:900;font-size:17px;color:#0d1420;background:var(--bx)}
.bcName{flex:1;min-width:0}
.bcName b{display:block;font-size:15px;color:#fff}
.bcName span{font-size:12.5px;color:rgba(255,255,255,.45)}
.bcName a{color:var(--bx);text-decoration:none}
.bcName a:hover{text-decoration:underline}
.bstatus{font-size:10px;font-weight:900;letter-spacing:.05em;padding:4px 9px;border-radius:7px;white-space:nowrap}
.bstatus.live{color:#052e1a;background:linear-gradient(90deg,#34d399,#56a4d8)}
.bstatus.setup{color:#85c8f4;background:rgba(63,146,204,.14);border:1px solid rgba(63,146,204,.35)}
.bstatus.paused{color:rgba(255,255,255,.6);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}
.btag{margin:12px 0 0;font-size:13px;color:rgba(255,255,255,.6);line-height:1.55}
.bmeta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.bmeta span,.bmeta a{font-size:11.5px;color:rgba(255,255,255,.55);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:4px 8px;text-decoration:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bmeta a:hover{color:#fff}
.bnotes{margin:12px 0 0;font-size:12.5px;color:rgba(255,255,255,.42);line-height:1.55;white-space:pre-wrap}
.bcRow{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.bmini{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:rgba(255,255,255,.75);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none}
.bmini:hover{color:#fff;border-color:rgba(255,255,255,.3)}
.bmini.del{color:#fca5a5;border-color:rgba(244,63,94,.3)}
.bconfirm{margin-top:12px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);border-radius:11px;padding:12px;font-size:12.5px;color:rgba(255,255,255,.8);line-height:1.55}
.bconfirm span{display:flex;gap:8px;margin-top:10px}
/* Brand drill-down: the header is the toggle, the panel below carries the numbers. */
.bcHead.open{cursor:pointer;border-radius:11px;margin:-4px;padding:4px;transition:background .15s}
.bcHead.open:hover{background:rgba(255,255,255,.04)}
.bchev{font-size:10px;color:rgba(255,255,255,.4);flex:none;margin-left:2px}
.bstats{margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px}
.bsnote{font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.6)}
.bsgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
@media(min-width:560px){.bsgrid{grid-template-columns:repeat(3,1fr)}}
.bstile{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);border-radius:11px;padding:10px 12px}
.bstile b{display:block;font-size:17px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums}
.bstile span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:rgba(255,255,255,.42);margin-top:3px}
.bswrap{margin-top:12px;max-height:340px;overflow:auto;border:1px solid rgba(255,255,255,.07);border-radius:11px}
.bstable{width:100%;border-collapse:collapse;font-size:12.5px}
.bstable th{position:sticky;top:0;background:#0a1018;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.42);padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.bstable td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.05);color:rgba(255,255,255,.78);vertical-align:top}
.bstable tr:last-child td{border-bottom:0}
.bstable td b{display:block;color:#fff;font-weight:700}
.bstable td i{display:block;font-style:normal;font-size:11px;color:rgba(255,255,255,.42);margin-top:1px}
.bstable .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.bpill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.6)}
.bpill.direct{border-color:rgba(107,180,226,.35);color:#b3daf4}
.bpill.on{border-color:rgba(110,231,183,.35);color:#6ee7b7}
`;

// Telegram bot management (Gold Pulse signals chat) — stats, pre-approve by email, remove a member.
function TelegramManager() {
  const [data, setData] = useState<TgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const load = async () => { const d = await fetchTelegram(); setData(d); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const verify = async () => {
    const e = email.trim(); if (!e || busy) return; setBusy(true); setMsg("");
    const r = await verifyTelegram(e); setBusy(false);
    if (r.error) setMsg("⚠️ " + r.error);
    else { setMsg(r.admitted ? `✅ ${e} admitted to the channel.` : `✅ ${e} pre-approved — they're let in the moment they open the bot.`); setEmail(""); load(); }
  };
  const remove = async (id: string, who: string) => {
    if (!confirm(`Remove ${who} from the signals Telegram?`)) return;
    if (await removeTelegram(id)) load();
  };
  const members = (data?.members || []).filter((m) => {
    const s = q.trim().toLowerCase(); if (!s) return true;
    return `${m.name || ""} ${m.username || ""} ${m.email || ""}`.toLowerCase().includes(s);
  });
  const chip = (c: string): any => ({ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, color: c });
  return (
    <>
      <div className="kick">Signals Telegram · @FreeGoldPulseBot</div>
      <div className="panel">
        {loading ? <div className="note">Loading Telegram members…</div> : (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <div className="kpi" style={{ flex: 1, minWidth: 120 }}><div className="l">In the chat</div><div className="v">{data?.stats.total ?? 0}</div><div className="s">linked members</div></div>
              <div className="kpi" style={{ flex: 1, minWidth: 120 }}><div className="l">Verified</div><div className="v">{data?.stats.verified ?? 0}</div><div className="s">have access</div></div>
              <div className="kpi" style={{ flex: 1, minWidth: 120 }}><div className="l">Pending</div><div className="v">{data?.stats.pending ?? 0}</div><div className="s">not yet in</div></div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
              <input className="usearch" style={{ flex: 2, minWidth: 200 }} placeholder="Pre-approve / force-admit by email…" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verify()} />
              <button className="bbtn" style={{ height: 38 }} onClick={verify} disabled={busy || !email.trim()}>{busy ? "…" : "✅ Verify / admit"}</button>
            </div>
            {msg && <div className="note" style={{ color: msg.startsWith("⚠️") ? "#fca5a5" : "#6ee7b7" }}>{msg}</div>}
            <input className="usearch" style={{ marginTop: 10 }} placeholder="Search members…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="ucount" style={{ marginTop: 12 }}>{members.length} member{members.length === 1 ? "" : "s"}</div>
            <div style={{ marginTop: 4, maxHeight: "72vh", overflowY: "auto", paddingRight: 8 }}>
              {members.length === 0 ? <div className="note">No members match.</div> : members.map((m) => (
                <div key={m.id} className="row" style={{ alignItems: "center", gap: 8 }}>
                  <span className="nm" style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ color: "#fff" }}>{m.name || m.username || m.email || m.id}</b>
                    {m.username && <span style={{ color: "rgba(255,255,255,.4)", marginLeft: 6 }}>@{m.username}</span>}
                    {m.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>}
                  </span>
                  {m.isAdmin && <span style={chip("#cfe7fa")}>Admin</span>}
                  <span style={chip(m.status === "verified" ? "#6ee7b7" : m.status === "removed" ? "#fca5a5" : "rgba(255,255,255,.45)")}>{m.status}</span>
                  {m.funded > 0 && <span className="vv" style={{ minWidth: 78, textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>{money(m.funded)}</span>}
                  {!m.isAdmin
                    ? <button className="us" onClick={() => remove(m.id, m.name || m.email || m.id)} style={{ borderColor: "rgba(244,63,94,.4)", color: "#fca5a5", flexShrink: 0 }}>Remove</button>
                    : <span style={{ width: 62, flexShrink: 0 }} aria-hidden />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
