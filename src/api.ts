// Copy the Rich Trades ⇄ Pulse SSO client. Members authenticate against their Pulse account; the token
// authorizes status checks and bounces them into Pulse already logged in.
export const PULSE = "https://www.pulsemarketstrade.com";
const TOKEN_KEY = "rtb_token";
const PROFILE_KEY = "rtb_profile";

export type Profile = { firstName?: string; lastName?: string; email?: string };
export type MeStatus = {
  firstName?: string; lastName?: string; email?: string; isAdmin?: boolean;
  walletBalance?: number; liveFunded?: boolean;
  liveBalance: number; signalsMin: number; signalsUnlocked: boolean; signalsUrl: string | null;
  pammBalance: number; pammMin: number; pammInvested: boolean;
  communityUnlocked?: boolean; communityUrl?: string | null;
  refCode?: string; homeLink?: string | null; landingLink?: string | null;
};

// Referral capture: when a visitor lands on any page with ?ref=<code> (a member's shared link), stash it
// so it rides along to signup and attributes the new member to whoever referred them.
const REF_KEY = "rtb_ref";
export function captureRef() {
  try {
    const r = (new URLSearchParams(window.location.search).get("ref") || "").trim();
    if (r) localStorage.setItem(REF_KEY, r.slice(0, 120));
  } catch {}
}
export function getStoredRef(): string { try { return localStorage.getItem(REF_KEY) || ""; } catch { return ""; } }

// Broker referral code supplied by the site owner for signup links.
export const HOUSE_REF = "plan451-anthony-31o3";

export type Analytics = {
  totals: { views: number; visitors: number };
  today: { views: number; visitors: number };
  byPath: { path: string; views: number; visitors: number }[];
  byDay: { day: string; views: number; visitors: number }[];
  referrers: { referrer: string; views: number }[];
  signupViews: number;
  cryptoDeposits?: { totalUsd: number; todayUsd: number; deposits: number; depositors: number };
  tracking: { googleAnalytics: string; metaPixel: string; tiktokPixel: string };
  admins: string[];
};

// Fire-and-forget pageview beacon for our first-party analytics.
export function trackPageview(path: string) {
  try {
    fetch(`${PULSE}/api/sso/robthebankz/track`, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ path, referrer: typeof document !== "undefined" ? document.referrer : "" }),
    }).catch(() => {});
  } catch {}
}

export type Tracking = { googleAnalytics: string; metaPixel: string; tiktokPixel: string };

export async function fetchTracking(): Promise<Tracking> {
  try {
    const r = await fetch(`${PULSE}/api/sso/robthebankz/tracking`);
    if (!r.ok) return { googleAnalytics: "", metaPixel: "", tiktokPixel: "" };
    return await r.json();
  } catch { return { googleAnalytics: "", metaPixel: "", tiktokPixel: "" }; }
}

export async function saveTracking(codes: Tracking): Promise<Tracking | null> {
  const token = getToken();
  if (!token) return null;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/tracking`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(codes),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Failed to save");
  return d.tracking;
}

export async function fetchAnalytics(): Promise<Analytics | null> {
  const token = getToken();
  if (!token) return null;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return r.json();
}

// isDesk = one of the desk's own accounts (Anthony / owner). Shown in the list so it's reachable via
// "Log in as", but never included in any summary figure.
export type AdminUser = { id: string; displayId: number; name: string; email: string; joined: string; kyc: string; walletBalance: number; liveBalance: number; pammBalance: number; trading: boolean; allocating: boolean; referredBy: string | null; signalsUnlocked: boolean; isDesk?: boolean };
export type AdminUsers = { users: AdminUser[]; summary: { total: number; funded: number; signalsUnlocked: number; totalFunded: number; totalWallet: number } };

export function adminLoginAsUrl(userId: string): string {
  const token = getToken() || "";
  return `${PULSE}/api/sso/robthebankz/admin/login-as?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
}

export async function fetchAdminUsers(): Promise<AdminUsers | null> {
  const token = getToken();
  if (!token) return null;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return r.json();
}

// Admin: manually unlock (grandfather) a member into signals/community, or re-lock them.
export async function setMemberUnlock(userId: string, lock: boolean): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/unlock`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, lock }),
  });
  return r.ok;
}

// Telegram → Tap-to-Trade auto-post mode: 'all' (everyone), 'admins' (desk-only), or 'off'.
export async function fetchAutopost(): Promise<"all" | "admins" | "off"> {
  const t = getToken(); if (!t) return "all";
  try { const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/autopost`, { headers: { Authorization: `Bearer ${t}` } }); if (!r.ok) return "all"; const d = await r.json(); return d.mode || "all"; } catch { return "all"; }
}
export async function setAutopost(mode: "all" | "admins" | "off"): Promise<boolean> {
  const t = getToken(); if (!t) return false;
  try { const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/autopost`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ mode }) }); return r.ok; } catch { return false; }
}

// Approve a member's KYC — flips the same status Pulse uses, so they're verified everywhere.
export async function approveMemberKyc(userId: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/kyc-approve`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId }),
  });
  return r.ok;
}

// ---- Brands: white-label partners on their own domains, running Copy the Rich Trades tech ----
export type RtbBrand = {
  id: string; name: string; slug: string; domain: string;
  status: "setup" | "live" | "paused";
  ownerEmail: string; refCode: string; logoUrl: string; accent: string;
  tagline: string; telegramUrl: string; notes: string; createdAt: string;
};
const BBASE = `${PULSE}/api/sso/robthebankz/admin/brands`;
export async function fetchBrands(): Promise<RtbBrand[]> {
  const t = getToken(); if (!t) return [];
  const r = await fetch(BBASE, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return [];
  const d = await r.json().catch(() => ({})); return d.brands || [];
}
export async function createBrand(b: Partial<RtbBrand>): Promise<RtbBrand> {
  const r = await fetch(BBASE, { method: "POST", headers: chdr(), body: JSON.stringify(b) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Couldn't create the brand");
  return d;
}
export async function patchBrand(id: string, b: Partial<RtbBrand>): Promise<RtbBrand> {
  const r = await fetch(`${BBASE}/${encodeURIComponent(id)}`, { method: "PATCH", headers: chdr(), body: JSON.stringify(b) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Couldn't save the brand");
  return d;
}
export async function deleteBrand(id: string): Promise<boolean> {
  const r = await fetch(`${BBASE}/${encodeURIComponent(id)}`, { method: "DELETE", headers: chdr() });
  return r.ok;
}

// One brand's numbers: everyone attributed to its referral code, plus the downline beneath them.
export type BrandSignup = {
  id: string; displayId: number | null; name: string; email: string; joined: string;
  kyc: string; direct: boolean; walletBalance: number; liveBalance: number; pammBalance: number;
  deposits: number; trading: boolean; allocating: boolean; referredBy: string | null; signalsUnlocked: boolean;
};
export type BrandStats = {
  brand: RtbBrand;
  affiliateId: string | null;
  resolved: boolean;         // false = the brand's referral code doesn't match any affiliate yet
  summary: { direct: number; network: number; funded: number; signalsUnlocked: number; totalFunded: number; totalWallet: number; totalDeposits: number };
  signups: BrandSignup[];
};
export async function fetchBrandStats(id: string): Promise<BrandStats | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${BBASE}/${encodeURIComponent(id)}/stats`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return null;
  return await r.json().catch(() => null);
}

// ---- Telegram bot management (signals chat) ----
export type TgMember = { id: string; username: string | null; name: string | null; email: string | null; status: string; isAdmin: boolean; funded: number; joined: string };
export type TgData = { stats: { total: number; verified: number; pending: number }; members: TgMember[] };
export async function fetchTelegram(): Promise<TgData | null> {
  const token = getToken(); if (!token) return null;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/telegram`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}
export async function verifyTelegram(email: string): Promise<{ ok?: boolean; admitted?: boolean; error?: string }> {
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/telegram/verify`, { method: "POST", headers: chdr(), body: JSON.stringify({ email }) });
  const d = await r.json().catch(() => ({})); return r.ok ? d : { error: d?.error || "Failed" };
}
export async function removeTelegram(id: string): Promise<boolean> {
  const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/telegram/remove`, { method: "POST", headers: chdr(), body: JSON.stringify({ id }) });
  return r.ok;
}

// In-memory impersonation token (admin "Log in as" a member) — used in place of the stored token for
// this tab only, so the admin's own session in localStorage is never touched.
let _impersonate: string | null = null;
export function setImpersonateToken(t: string | null) { _impersonate = t; }
export function getToken(): string | null { if (_impersonate) return _impersonate; try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function getProfile(): Profile { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { return {}; } }
export function logout() { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(ADMIN_UNTIL_KEY); } catch {} }

// ---- Admin console step-up (emailed 6-digit code) ----
// Being on the admin allowlist is not enough: the console needs a token the server only mints after
// a code sent to the admin's mailbox is verified. That admin token replaces the stored one (it works
// for member routes too), so every existing admin call keeps working with no change. It lasts 12h,
// deliberately shorter than the 30-day member token — this timestamp tracks when to re-prompt.
const ADMIN_UNTIL_KEY = "rtb_admin_until";
export function hasAdminScope(): boolean {
  try { return Number(localStorage.getItem(ADMIN_UNTIL_KEY) || 0) > Date.now(); } catch { return false; }
}
export async function requestAdminCode(): Promise<boolean> {
  const t = getToken(); if (!t) return false;
  try {
    const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/request-code`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    });
    return r.ok;
  } catch { return false; }
}
export async function verifyAdminCode(code: string): Promise<{ ok: boolean; error?: string }> {
  const t = getToken(); if (!t) return { ok: false, error: "Not signed in" };
  try {
    const r = await fetch(`${PULSE}/api/sso/robthebankz/admin/verify-code`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ code }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d?.token) return { ok: false, error: d?.error || "Could not verify that code" };
    try {
      localStorage.setItem(TOKEN_KEY, d.token);
      localStorage.setItem(ADMIN_UNTIL_KEY, String(Date.now() + 12 * 60 * 60 * 1000));
    } catch {}
    return { ok: true };
  } catch { return { ok: false, error: "Network error — try again" }; }
}

export async function login(email: string, password: string): Promise<Profile> {
  const r = await fetch(`${PULSE}/api/sso/robthebankz/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Login failed");
  // A fresh sign-in issues a member-scope token, so any previous admin unlock is void.
  try { localStorage.setItem(TOKEN_KEY, d.token); localStorage.setItem(PROFILE_KEY, JSON.stringify({ firstName: d.firstName, lastName: d.lastName, email: d.email })); localStorage.removeItem(ADMIN_UNTIL_KEY); } catch {}
  return { firstName: d.firstName, lastName: d.lastName, email: d.email };
}

export async function fetchGoogleClientId(): Promise<string> {
  try {
    const r = await fetch(`${PULSE}/api/sso/robthebankz/google-client-id`);
    const d = await r.json().catch(() => ({}));
    return d?.clientId || "";
  } catch { return ""; }
}

export async function registerUser(input: { firstName: string; lastName: string; email: string; password: string; referralCode?: string }): Promise<Profile> {
  const r = await fetch(`${PULSE}/api/sso/robthebankz/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    // Falling through to HOUSE_REF rather than undefined: a signup on this site's own form is the
    // same unattributed visitor the front-page CTA would have sent to Pulse's register page, and
    // that CTA carries the $20-a-lot plan. Leaving it undefined handed the choice to whatever
    // default the SSO endpoint happens to hold, which is how the two doors drifted apart.
    body: JSON.stringify({ ...input, referralCode: input.referralCode || getStoredRef() || HOUSE_REF }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Sign up failed");
  // A fresh sign-in issues a member-scope token, so any previous admin unlock is void.
  try { localStorage.setItem(TOKEN_KEY, d.token); localStorage.setItem(PROFILE_KEY, JSON.stringify({ firstName: d.firstName, lastName: d.lastName, email: d.email })); localStorage.removeItem(ADMIN_UNTIL_KEY); } catch {}
  return { firstName: d.firstName, lastName: d.lastName, email: d.email };
}

export async function googleLogin(credential: string, referralCode?: string): Promise<Profile> {
  const r = await fetch(`${PULSE}/api/sso/robthebankz/google`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, referralCode: referralCode || getStoredRef() || HOUSE_REF }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Google sign-in failed");
  try {
    localStorage.setItem(TOKEN_KEY, d.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ firstName: d.firstName, lastName: d.lastName, email: d.email }));
    // GOOGLE SIGN-IN IS ITSELF THE STEP-UP, so an admin arriving this way is already unlocked.
    //
    // The emailed code proves the person can read that mailbox, because a password can be stolen and
    // replayed from anywhere. A Google assertion proves the same thing more strongly — it is a
    // signature from Google saying this session controls that account, and for a Google mailbox that
    // IS the inbox the code would have gone to. adminStepUp says the account CAN reach the console;
    // adminReady says the server already issued admin scope for this token, so honour it.
    if (d.adminReady) localStorage.setItem(ADMIN_UNTIL_KEY, String(Date.now() + 12 * 60 * 60 * 1000));
    else localStorage.removeItem(ADMIN_UNTIL_KEY);
  } catch {}
  return { firstName: d.firstName, lastName: d.lastName, email: d.email };
}

// The desk's own door into Gold Pulse Signals: the bot deep link carrying Anthony's affiliate code, so
// a member who walks through it from THIS site is booked to the desk. Pulse serves one shared
// `signalsUrl` to every brand site it powers, so the swap happens here rather than there — the other
// brands keep handing out the network's plain channel invite.
export const SIGNALS_URL = "https://t.me/FreeGoldPulseBot?start=ref_plan465";

export async function fetchMe(): Promise<MeStatus | null> {
  const token = getToken();
  if (!token) return null;
  const r = await fetch(`${PULSE}/api/sso/robthebankz/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) { logout(); return null; }
  if (!r.ok) return null;
  const me: MeStatus = await r.json();
  // Only the destination changes — whether there is a link at all still rides on Pulse's unlock gate,
  // so a member who hasn't funded sees no link here either.
  if (me?.signalsUrl) me.signalsUrl = SIGNALS_URL;
  if (me?.communityUrl) me.communityUrl = SIGNALS_URL;
  return me;
}

// A full-page link that logs the member into Pulse and lands them on `redirect`.
export function enterUrl(redirect = "/accounts"): string {
  const token = getToken() || "";
  // No token means the SSO hop can only land them on Pulse's login page, which reads as "the link
  // is broken". Go straight to the destination instead and let Pulse ask them to sign in there.
  if (!token) return `${PULSE}${redirect}`;
  return `${PULSE}/api/sso/robthebankz/enter?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;
}

// The deposit form, with the deposit tab already open:
// https://www.pulsemarketstrade.com/deposit-withdraw?tab=deposit
// Deliberately the plain URL, NOT the SSO hop. The hop was meant to land them already signed in,
// but in practice it was dropping members somewhere other than the deposit form, and a deposit
// button that doesn't reach the deposit page is worse than one that occasionally asks them to sign
// in. Pulse stashes the path and returns them here after login, so the destination survives either
// way. If the SSO hop is ever proven reliable, wrap this in enterUrl() again — nothing else changes.
export const DEPOSIT_PATH = "/deposit-withdraw?tab=deposit";
export function depositUrl(): string { return `${PULSE}${DEPOSIT_PATH}`; }

// ---- Community (in-site social feed; Anthony Beale = host) ----
export type RtbComment = { id: string; authorName: string; isHost: boolean; body: string; createdAt: string; mine?: boolean };
export type RtbPost = { id: string; authorName: string; isHost: boolean; body: string; imageUrl?: string | null; pinned: boolean; createdAt: string; likes: number; liked: boolean; mine: boolean; comments: RtbComment[] };
export type RtbFeed = { posts: RtbPost[]; isHost: boolean; hostName: string; me: string; memberCount?: number };

const CBASE = `${PULSE}/api/sso/robthebankz/community`;
const chdr = () => { const t = getToken(); return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

export async function fetchFeed(): Promise<RtbFeed | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/posts`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return null;
  return r.json();
}
export async function createPost(body: string, imageUrl?: string): Promise<RtbPost> {
  const r = await fetch(`${CBASE}/posts`, { method: "POST", headers: chdr(), body: JSON.stringify({ body, imageUrl }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Couldn't post");
  return d;
}
export async function togglePostLike(id: string): Promise<{ likes: number; liked: boolean } | null> {
  const r = await fetch(`${CBASE}/posts/${id}/like`, { method: "POST", headers: chdr() });
  return r.ok ? r.json() : null;
}
export async function togglePin(id: string): Promise<{ pinned: boolean } | null> {
  const r = await fetch(`${CBASE}/posts/${id}/pin`, { method: "POST", headers: chdr() });
  return r.ok ? r.json() : null;
}
export async function deletePost(id: string): Promise<boolean> {
  const r = await fetch(`${CBASE}/posts/${id}`, { method: "DELETE", headers: chdr() });
  return r.ok;
}
export async function addComment(id: string, body: string): Promise<RtbComment> {
  const r = await fetch(`${CBASE}/posts/${id}/comments`, { method: "POST", headers: chdr(), body: JSON.stringify({ body }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Couldn't comment");
  return d;
}

// ---- Direct messages with Anthony Beale (host) ----
export type DmMsg = { id: string; fromHost: boolean; mine: boolean; body: string; createdAt: string };
export type DmThread = { memberId: string; name: string; email?: string; lastBody?: string; lastAt?: string; unread: number };

export async function fetchDm(): Promise<{ hostName: string; messages: DmMsg[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/dm`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function sendDm(body: string): Promise<DmMsg> {
  const r = await fetch(`${CBASE}/dm`, { method: "POST", headers: chdr(), body: JSON.stringify({ body }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "Failed"); return d;
}
export async function fetchDmThreads(): Promise<DmThread[]> {
  const t = getToken(); if (!t) return [];
  const r = await fetch(`${CBASE}/dm/threads`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return []; const d = await r.json(); return d.threads || [];
}
export async function fetchDmThread(memberId: string): Promise<{ name: string; messages: DmMsg[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/dm/${encodeURIComponent(memberId)}`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function replyDm(memberId: string, body: string): Promise<DmMsg> {
  const r = await fetch(`${CBASE}/dm/${encodeURIComponent(memberId)}`, { method: "POST", headers: chdr(), body: JSON.stringify({ body }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "Failed"); return d;
}

// ---- Live Sessions (admin-hosted) ----
export type RtbSession = { id: string; title: string; host?: string; description?: string; startAt?: string | null; meetingUrl?: string | null; isLive: boolean };
export async function fetchSessions(): Promise<{ isHost: boolean; sessions: RtbSession[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/sessions`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function createSession(s: Partial<RtbSession>): Promise<boolean> {
  const r = await fetch(`${CBASE}/sessions`, { method: "POST", headers: chdr(), body: JSON.stringify(s) }); return r.ok;
}
export async function patchSession(id: string, s: Partial<RtbSession>): Promise<boolean> {
  const r = await fetch(`${CBASE}/sessions/${id}`, { method: "PATCH", headers: chdr(), body: JSON.stringify(s) }); return r.ok;
}
export async function deleteSession(id: string): Promise<boolean> {
  const r = await fetch(`${CBASE}/sessions/${id}`, { method: "DELETE", headers: chdr() }); return r.ok;
}

// ---- Gold Pulse Signals (admin-posted) ----
export type RtbSignal = { id: string; pair: string; side: string; entry?: string; tp?: string; tps?: string[]; sl?: string; lots?: string; audience?: "all" | "admins"; status: string; note?: string; createdAt: string; preset?: boolean; riskPts?: number | null; tpPts?: number | null; fromTelegram?: boolean };
// Recent posts from the Gold Pulse Telegram channel — powers the members' "live from the desk" box.
export type RtbTgMsg = { id: string; text: string; isSignal: boolean; at: string; triggered?: boolean; signal?: { id: string; pair: string; side: string; audience: string } | null };
export async function fetchTgFeed(): Promise<RtbTgMsg[]> {
  const t = getToken(); if (!t) return [];
  try { const r = await fetch(`${CBASE}/tg-feed`, { headers: { Authorization: `Bearer ${t}` } }); if (!r.ok) return []; const d = await r.json(); return d.messages || []; } catch { return []; }
}
export async function fetchSignals(): Promise<{ isHost: boolean; signals: RtbSignal[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/signals`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function postSignal(s: Partial<RtbSignal> & { tps?: string[] }): Promise<boolean> {
  try { const r = await fetch(`${CBASE}/signals`, { method: "POST", headers: chdr(), body: JSON.stringify(s) }); return r.ok; } catch { return false; }
}
export async function patchSignal(id: string, status: string): Promise<boolean> {
  try { const r = await fetch(`${CBASE}/signals/${id}`, { method: "PATCH", headers: chdr(), body: JSON.stringify({ status }) }); return r.ok; } catch { return false; }
}
export async function deleteSignal(id: string): Promise<boolean> {
  try { const r = await fetch(`${CBASE}/signals/${id}`, { method: "DELETE", headers: chdr() }); return r.ok; } catch { return false; }
}

// ---- News / desk results (e.g. "Monday's Results — +1370 PIPS") ----
export type RtbNews = { id: string; kind: string; title: string; body: string; pips?: number | null; createdAt: string };
export async function fetchNews(): Promise<{ isHost: boolean; news: RtbNews[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/news`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function postNews(n: { title: string; body: string; pips?: string | number; kind?: string }): Promise<boolean> {
  const r = await fetch(`${CBASE}/news`, { method: "POST", headers: chdr(), body: JSON.stringify(n) }); return r.ok;
}
export async function deleteNews(id: string): Promise<boolean> {
  const r = await fetch(`${CBASE}/news/${id}`, { method: "DELETE", headers: chdr() }); return r.ok;
}

// ---- Group chat (funded members' live room) ----
export type ChatMsg = { id: string; authorName: string; isHost: boolean; body: string; createdAt: string; mine?: boolean };
export async function fetchChat(after?: string): Promise<{ isHost: boolean; messages: ChatMsg[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${CBASE}/chat${after ? `?after=${after}` : ""}`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
export async function sendChat(body: string): Promise<ChatMsg> {
  const r = await fetch(`${CBASE}/chat`, { method: "POST", headers: chdr(), body: JSON.stringify({ body }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "Failed"); return d;
}

// ---- Tap to Trade (execute a signal on the member's own live account) ----
const TBASE = `${PULSE}/api/sso/robthebankz/tap`;
export type TapAccount = { accountId: string; number: string; balance: number; label?: string | null; demo?: boolean; marketing?: boolean };
export async function fetchTapAccounts(): Promise<{ enabled: boolean; isAdmin?: boolean; accounts: TapAccount[] } | null> {
  const t = getToken(); if (!t) return null;
  const r = await fetch(`${TBASE}/accounts`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? r.json() : null;
}
// Spin up a free demo TradeLocker account to practise one-tap trading.
export async function connectDemo(): Promise<{ accountId?: string; already?: boolean; error?: string }> {
  const r = await fetch(`${TBASE}/connect-demo`, { method: "POST", headers: chdr() });
  const d = await r.json().catch(() => ({})); return r.ok ? d : { error: d?.error || "Failed to add a demo account" };
}
export async function tapExecute(signalId: string, accountId: string, lots: number, tp?: string, tpRung?: number): Promise<{ success?: boolean; fallback?: boolean; reason?: string; order?: any; sl?: number | null; tp?: number | null; tpDropped?: boolean; preset?: boolean; fill?: number | null; autoPlaced?: boolean; error?: string }> {
  const r = await fetch(`${TBASE}/execute`, { method: "POST", headers: chdr(), body: JSON.stringify({ signalId, accountId, lots, tp, tpRung }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return { error: d?.error || "Failed to place order" };
  return d;
}
// One-tap login link into the TradeLocker web app for an account (opened after a placement).
export async function tapLogin(accountId: string): Promise<string | null> {
  const r = await fetch(`${TBASE}/login`, { method: "POST", headers: chdr(), body: JSON.stringify({ accountId }) });
  const d = await r.json().catch(() => ({}));
  return r.ok && d?.returnURL ? d.returnURL : null;
}
// NOTE: /tap/positions returns { positionId, instrument, side, lots, openPrice } — `instrument`, not
// `symbol`, and lots/openPrice come back as strings. `symbol`/`qty`/`avgPrice` are kept for other shapes.
export type TapPosition = { positionId: string; instrument?: string; symbol?: string; side?: string; qty?: number | string; lots?: number | string; unrealizedPnl?: number; pnl?: number; openPrice?: number | string; avgPrice?: number | string };
export async function fetchPositions(accountId: string): Promise<TapPosition[]> {
  const t = getToken(); if (!t) return [];
  const r = await fetch(`${TBASE}/positions?accountId=${encodeURIComponent(accountId)}`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return []; const d = await r.json(); return d.positions || [];
}
export async function closePosition(accountId: string, positionId?: string, all?: boolean): Promise<{ success?: boolean; fallback?: boolean; closedCount?: number; error?: string }> {
  const r = await fetch(`${TBASE}/close`, { method: "POST", headers: chdr(), body: JSON.stringify({ accountId, positionId, all }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) return { error: d?.error || "Failed to close" }; return d;
}
export async function modifyPosition(accountId: string, positionId: string, sl?: number | null, tp?: number | null): Promise<{ success?: boolean; fallback?: boolean; error?: string }> {
  const r = await fetch(`${TBASE}/modify`, { method: "POST", headers: chdr(), body: JSON.stringify({ accountId, positionId, sl, tp }) });
  const d = await r.json().catch(() => ({})); if (!r.ok) return { error: d?.error || "Failed to modify" }; return d;
}
