import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { registerUser, googleLogin, fetchGoogleClientId } from "./api";

declare global { interface Window { google?: any; } }

const CSS = `
.lg *{box-sizing:border-box}
.lg{min-height:100vh;background:#05070d;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif}
.lg .card{width:100%;max-width:420px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.01));padding:30px 26px;box-shadow:0 30px 80px -30px rgba(0,0,0,.8)}
.lg .logo{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:18px}
.lg .logo img{width:72px;height:72px;border-radius:18px;object-fit:contain;box-shadow:0 10px 30px -10px rgba(63,146,204,.5)}
.lg h1{font-size:22px;font-weight:900;text-align:center}
.lg .sub{font-size:13px;color:rgba(255,255,255,.5);text-align:center;margin-top:6px;line-height:1.5}
.lg .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lg label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);margin:14px 0 6px}
.lg input{width:100%;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);color:#fff;padding:0 14px;font-size:15px;outline:none}
.lg input:focus{border-color:rgba(107,180,226,.6)}
.lg .hint{font-size:11px;color:rgba(255,255,255,.35);margin-top:6px}
.lg .btn{width:100%;height:50px;margin-top:20px;border:none;border-radius:13px;font-weight:800;font-size:15px;color:#0d1420;cursor:pointer;background:linear-gradient(90deg,#6bb4e2,#2e7ab4,#2a72a8);box-shadow:0 14px 40px -16px rgba(107,180,226,.7)}
.lg .btn:disabled{opacity:.6;cursor:default}
.lg .err{margin-top:14px;font-size:13px;color:#fca5a5;text-align:center}
.lg .foot{margin-top:18px;text-align:center;font-size:13px;color:rgba(255,255,255,.5)}
.lg .foot a{color:#6bb4e2;font-weight:700}
.lg .or{display:flex;align-items:center;gap:12px;margin:20px 0 16px;color:rgba(255,255,255,.35);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.lg .or::before,.lg .or::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.1)}
.lg .gwrap{display:flex;justify-content:center;min-height:44px;color-scheme:light}
.lg .gwrap > div{width:100%!important}
`;

export default function Register() {
  const [, navigate] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const gbtnRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const referralCode = new URLSearchParams(window.location.search).get("ref") || undefined;
    try { await registerUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, referralCode }); navigate("/members"); }
    catch (e: any) { setErr(e?.message || "Sign up failed"); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    const onCredential = async (resp: any) => {
      setErr("");
      try { await googleLogin(resp.credential); navigate("/members"); }
      catch (e: any) { if (!cancelled) setErr(e?.message || "Google sign-up failed"); }
    };
    const init = (clientId: string) => {
      if (cancelled || !clientId || !window.google?.accounts?.id || !gbtnRef.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: onCredential });
      window.google.accounts.id.renderButton(gbtnRef.current, { theme: "filled_black", size: "large", shape: "pill", text: "signup_with", logo_alignment: "center", width: 360 });
    };
    (async () => {
      const clientId = await fetchGoogleClientId();
      if (!clientId || cancelled) return;
      if (window.google?.accounts?.id) { init(clientId); return; }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
      s.onload = () => init(clientId);
      document.head.appendChild(s);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lg">
      <style>{CSS}</style>
      <div className="card">
        <div className="logo">
          <img src="/logo.svg" alt="Copy the Rich Trades" />
          <div>
            <h1>Create your account</h1>
            <p className="sub">Join Copy the Rich Trades — learn free, earn passively, unlock the signals.</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="row2">
            <div>
              <label>First name</label>
              <input autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" required />
            </div>
            <div>
              <label>Last name</label>
              <input autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" />
            </div>
          </div>
          <label>Email</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          <label>Password</label>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars, a letter & a number" required />
          <div className="hint">At least 8 characters, with a letter and a number.</div>
          <button className="btn" type="submit" disabled={busy || !firstName || !email || !password}>{busy ? "Creating your account…" : "Create account →"}</button>
          {err && <div className="err">{err}</div>}
        </form>
        <div className="or">or</div>
        <div className="gwrap" ref={gbtnRef} />
        <div className="foot">Already have an account? <a href="/login">Log in →</a></div>
      </div>
    </div>
  );
}
