import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { login, googleLogin, fetchGoogleClientId } from "./api";

declare global { interface Window { google?: any; } }

const CSS = `
.lg *{box-sizing:border-box}
.lg{position:relative;min-height:100vh;overflow:hidden;background:radial-gradient(1200px 760px at 50% 18%,#fcfcfb 0%,#fcfcfd 55%,#fefefe 100%);color:#141414;display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif}
.lg::after{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(60% 50% at 50% 42%,transparent 0%,rgba(254,254,254,.55) 100%)}
.lg .card{position:relative;z-index:2;width:100%;max-width:400px;border:1px solid rgba(21,79,115,.16);border-radius:22px;background:linear-gradient(160deg,rgba(251,250,250,.72),rgba(251,252,252,.62));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:30px 26px;box-shadow:0 30px 90px -28px rgba(0,0,0,0.136),0 0 60px -30px rgba(39,117,169,.35),inset 0 1px 0 rgba(20,20,20,.05)}
.lg .logo{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:22px}
.lg .logo img{width:76px;height:76px;border-radius:18px;object-fit:contain;box-shadow:0 10px 30px -10px rgba(49,129,185,.5)}
.lg h1{font-size:22px;font-weight:900;text-align:center}
.lg .sub{font-size:13px;color:rgba(20,20,20,.5);text-align:center;margin-top:6px}
.lg label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(20,20,20,.5);margin:16px 0 6px}
.lg input{width:100%;height:48px;border-radius:12px;border:1px solid rgba(20,20,20,.12);background:rgba(0,0,0,0.056);color:#141414;padding:0 14px;font-size:15px;outline:none}
.lg input:focus{border-color:rgba(29,102,148,.6)}
.lg .btn{width:100%;height:50px;margin-top:22px;border:none;border-radius:13px;font-weight:800;font-size:15px;color:#f9f9fa;cursor:pointer;background:linear-gradient(90deg,#1d6694,#307fbb,#2f7fbc);box-shadow:0 14px 40px -16px rgba(29,102,148,.7)}
.lg .btn:disabled{opacity:.6;cursor:default}
.lg .err{margin-top:14px;font-size:13px;color:#4c3131;text-align:center}
.lg .foot{margin-top:20px;text-align:center;font-size:13px;color:rgba(20,20,20,.5)}
.lg .foot a{color:#1d6694;font-weight:700}
.lg .or{display:flex;align-items:center;gap:12px;margin:20px 0 16px;color:rgba(20,20,20,.35);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.lg .or::before,.lg .or::after{content:"";flex:1;height:1px;background:rgba(20,20,20,.1)}
/* Google button, dressed up: a slowly-sweeping gold→blue gradient border with a soft glow around it. */
.lg .goog{position:relative;border-radius:24px;padding:1.6px;background:linear-gradient(90deg,var(--g1,#3181b9),#257eba,#1d6694,#3181b9);background-size:300% 100%;animation:googflow 6s linear infinite;box-shadow:0 12px 34px -14px rgba(39,117,169,.55),0 0 0 1px rgba(20,20,20,.03)}
@keyframes googflow{to{background-position:300% 0}}
@media(prefers-reduced-motion:reduce){.lg .goog{animation:none}}
.lg .goog::before{content:"";position:absolute;inset:-2px;border-radius:26px;background:inherit;filter:blur(11px);opacity:.5;z-index:-1}
.lg .gwrap{display:flex;justify-content:center;align-items:center;min-height:46px;border-radius:22px;background:#fafbfb;color-scheme:light;overflow:hidden}
.lg .gwrap > div{width:100%!important}
.lg .gfallback{width:100%;height:46px;border-radius:22px;border:none;background:linear-gradient(180deg,#f7f7f8,#fafafb);color:#171b24;font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:11px;cursor:pointer;font-family:"Google Sans",Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;transition:background .2s ease}
.lg .gfallback:hover{background:linear-gradient(180deg,#f5f5f6,#f9fafa)}
.lg .gfallback .gg{display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#141414;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.056)}
`;

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const gbtnRef = useRef<HTMLDivElement>(null);
  const clientIdRef = useRef<string>("");
  const [gReady, setGReady] = useState(false); // the official GSI button actually rendered

  // The login page is plain white. It used to carry its own drifting-particle canvas, which was
  // depth on a near-black card and is litter on a white one — faint blue scratches behind a form,
  // competing with the only thing on the page the visitor came here to use.

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await login(email.trim(), password); navigate("/members"); }
    catch (e: any) { setErr(e?.message || "Login failed"); }
    finally { setBusy(false); }
  };

  // Load Google Identity Services and render the "Continue with Google" button.
  useEffect(() => {
    let cancelled = false;
    const onCredential = async (resp: any) => {
      setErr("");
      if (!resp?.credential) { setErr("Google didn't return a sign-in. Try again, or use your email and password."); return; }
      try { await googleLogin(resp.credential); navigate("/members"); }
      catch (e: any) { if (!cancelled) setErr(e?.message || "Google sign-in failed"); }
    };
    const init = (clientId: string) => {
      if (cancelled || !clientId || !window.google?.accounts?.id || !gbtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId, callback: onCredential,
        use_fedcm_for_prompt: true, itp_support: true, auto_select: false,
      });
      window.google.accounts.id.renderButton(gbtnRef.current, {
        theme: "filled_black", size: "large", shape: "pill", text: "continue_with",
        logo_alignment: "center", width: 344,
      });
      // renderButton draws nothing when the script/origin is blocked — only reveal the official
      // button once it actually painted; otherwise our always-visible fallback stays in place.
      const check = () => { if (!cancelled && gbtnRef.current && gbtnRef.current.childElementCount > 0) setGReady(true); };
      [300, 900, 1800, 3000].forEach((t) => setTimeout(check, t));
    };
    (async () => {
      const clientId = await fetchGoogleClientId();
      if (!clientId || cancelled) return;
      clientIdRef.current = clientId;
      if (window.google?.accounts?.id) { init(clientId); return; }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = () => init(clientId);
      document.head.appendChild(s);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback "Continue with Google" — always visible. If GSI is loaded we trigger One Tap; otherwise
  // we tell the member why (blocked/loading) and to use email + password.
  const onGoogleFallback = () => {
    setErr("");
    const gid = window.google?.accounts?.id;
    if (gid && clientIdRef.current) {
      try {
        gid.prompt((n: any) => {
          if (n?.isNotDisplayed?.() || n?.isSkippedMoment?.())
            setErr("Google sign-in isn't available in this browser right now — please log in with your email and password.");
        });
        return;
      } catch { /* fall through */ }
    }
    setErr("Google sign-in is still loading or blocked by your browser. Refresh the page (or disable your ad-blocker), or log in with your email and password.");
  };

  return (
    <div className="lg">
      <style>{CSS}</style>
      <div className="card">
        <div className="logo">
          <img src="/logo.svg" alt="Copy the Rich Trades" />
          <div>
            <h1>Member Log In</h1>
          </div>
        </div>
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          <label>Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          <button className="btn" type="submit" disabled={busy || !email || !password}>{busy ? "Signing in…" : "Log in →"}</button>
        </form>
        <div className="or">or</div>
        <div className="goog">
        {/* Official GSI button (revealed only once it actually renders) */}
        <div className="gwrap" ref={gbtnRef} style={{ display: gReady ? "flex" : "none" }} />
        {/* Always-visible fallback so the button never just disappears for a member */}
        {!gReady && (
          <button type="button" className="gfallback" onClick={onGoogleFallback}>
            <span className="gg" aria-hidden>
              <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#ca2315" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#0b4ebd" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#37b359" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            </span>
            Continue with Google
          </button>
        )}
        </div>
        {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
        <div className="foot">New here? <a href="/signup">Get 10X funded →</a></div>
      </div>
    </div>
  );
}
