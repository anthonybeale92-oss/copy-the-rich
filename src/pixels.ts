// Injects the admin-configured tracking pixels (Google Analytics, Meta Pixel, TikTok Pixel) on every
// page of the marketing site — including the /signup landing. IDs are fetched from our backend (which
// sanitizes them to [A-Za-z0-9_.-]) so interpolating them into the vendor snippets is safe.
import { fetchTracking } from "./api";

let installed = false;

function addScript(text?: string, src?: string, id?: string) {
  if (id && document.getElementById(id)) return;
  const s = document.createElement("script");
  if (id) s.id = id;
  if (src) { s.async = true; s.src = src; }
  if (text) s.text = text;
  document.head.appendChild(s);
}

export async function installPixels() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  const t = await fetchTracking();

  // Google Analytics (GA4 / gtag)
  if (t.googleAnalytics) {
    addScript(undefined, `https://www.googletagmanager.com/gtag/js?id=${t.googleAnalytics}`, "rtb-ga-src");
    addScript(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${t.googleAnalytics}');`, undefined, "rtb-ga-init");
  }

  // Meta (Facebook) Pixel
  if (t.metaPixel) {
    addScript(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${t.metaPixel}');fbq('track','PageView');`, undefined, "rtb-meta");
  }

  // TikTok Pixel
  if (t.tiktokPixel) {
    addScript(`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${t.tiktokPixel}');ttq.page();}(window,document,'ttq');`, undefined, "rtb-tiktok");
  }
}

// Fire a virtual pageview on SPA route changes (base snippets already fire the first one on load).
export function pixelPageview() {
  const w = window as any;
  try { if (w.gtag) w.gtag("event", "page_view"); } catch {}
  try { if (w.fbq) w.fbq("track", "PageView"); } catch {}
  try { if (w.ttq) w.ttq.page(); } catch {}
}
