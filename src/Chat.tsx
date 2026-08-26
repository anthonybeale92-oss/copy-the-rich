import { useEffect, useRef, useState } from "react";
import { fetchChat, sendChat, type ChatMsg, type MeStatus } from "./api";

const CSS = `
.rtchat{--gold:#3f92cc;--cy:#6bb4e2}
.rtchat *{box-sizing:border-box}
.rtchat{display:flex;flex-direction:column;height:min(72vh,660px);border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#0a1018;overflow:hidden}
.rtchat .ch{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(63,146,204,.04)}
.rtchat .ch .dot{width:9px;height:9px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399}
.rtchat .ch b{font-size:14.5px;font-weight:900;color:#fff}
.rtchat .ch span{font-size:11.5px;color:rgba(255,255,255,.45)}
.rtchat .body{flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px}
.rtchat .m{display:flex;gap:9px;align-items:flex-start;max-width:88%}
.rtchat .m.me{align-self:flex-end;flex-direction:row-reverse}
.rtchat .av{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#0d1420;background:linear-gradient(135deg,#6bb4e2,#2a72a8)}
.rtchat .av.host{background:linear-gradient(135deg,#3f92cc,#3f92cc)}
.rtchat .bub{min-width:0}
.rtchat .nm{font-size:11.5px;font-weight:800;color:rgba(255,255,255,.6);margin:0 4px 3px;display:flex;align-items:center;gap:6px}
.rtchat .m.me .nm{justify-content:flex-end}
.rtchat .hb{font-size:9px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#1a1400;background:linear-gradient(90deg,#3f92cc,#d8ecfb);border-radius:5px;padding:1px 6px}
.rtchat .tx{font-size:14px;line-height:1.5;color:#fff;background:rgba(255,255,255,.06);border-radius:14px;padding:8px 13px;white-space:pre-wrap;word-break:break-word}
.rtchat .m.me .tx{background:linear-gradient(90deg,#6bb4e2,#2e7ab4);color:#0d1420;font-weight:600}
.rtchat .m.host .tx{background:rgba(63,146,204,.12);border:1px solid rgba(63,146,204,.25)}
.rtchat .comp{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.07)}
.rtchat .comp input{flex:1;height:42px;border:1px solid rgba(255,255,255,.12);background:#05070d;border-radius:21px;padding:0 16px;color:#fff;font-size:14px;outline:none}
.rtchat .comp input:focus{border-color:rgba(107,180,226,.4)}
.rtchat .comp button{height:42px;padding:0 18px;border:none;border-radius:21px;font-weight:800;font-size:13.5px;color:#0d1420;background:linear-gradient(90deg,#6bb4e2,#2e7ab4);cursor:pointer}
.rtchat .comp button:disabled{opacity:.5}
.rtchat .empty{margin:auto;text-align:center;color:rgba(255,255,255,.45);font-size:13.5px;padding:24px}
.rtchat-locked{border:1px dashed rgba(255,255,255,.14);border-radius:16px;padding:30px 20px;text-align:center;color:rgba(255,255,255,.55);font-size:14px}
`;
const initial = (n?: string) => (n || "M").trim().charAt(0).toUpperCase();
function ago(iso: string) { try { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return "now"; const m = s / 60; if (m < 60) return `${Math.floor(m)}m`; const h = m / 60; if (h < 24) return `${Math.floor(h)}h`; return `${Math.floor(h / 24)}d`; } catch { return ""; } }

export default function Chat({ me }: { me: MeStatus | null }) {
  const unlocked = !!me?.isAdmin || !!me?.signalsUnlocked;
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string>("");
  const nearBottom = useRef(true);

  useEffect(() => {
    if (!unlocked) { setLoading(false); return; }
    let alive = true;
    const first = async () => { const d = await fetchChat(); if (alive && d) { setMsgs(d.messages); lastId.current = d.messages.length ? d.messages[d.messages.length - 1].id : ""; } setLoading(false); };
    const poll = async () => { if (!lastId.current) return; const d = await fetchChat(lastId.current); if (alive && d && d.messages.length) { setMsgs((m) => [...m, ...d.messages]); lastId.current = d.messages[d.messages.length - 1].id; } };
    first(); const iv = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(iv); };
  }, [unlocked]);

  useEffect(() => { if (nearBottom.current) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; };

  const send = async () => {
    const b = text.trim(); if (!b || sending) return; setSending(true);
    try { const m = await sendChat(b); setMsgs((x) => [...x, m]); lastId.current = m.id; setText(""); nearBottom.current = true; }
    catch (e: any) { alert(e?.message || "Couldn't send"); }
    finally { setSending(false); }
  };

  if (!unlocked) {
    return <div className="rtchat-locked"><style>{CSS}</style>🔒 <b style={{ color: "#fff" }}>The chat is for funded members.</b><br />Fund a live account or allocate to GoldRock to join the room and talk trades with the circle.</div>;
  }

  return (
    <div className="rtchat">
      <style>{CSS}</style>
      <div className="ch"><span className="dot" /><b>Members' chat</b><span>· everyone funded, one room</span></div>
      <div className="body" onScroll={onScroll}>
        {loading ? <div className="empty">Loading the room…</div>
          : msgs.length === 0 ? <div className="empty">No messages yet — say hey to the circle 👋</div>
          : msgs.map((m) => (
            <div key={m.id} className={`m ${m.mine ? "me" : ""} ${m.isHost ? "host" : ""}`}>
              <div className={`av ${m.isHost ? "host" : ""}`}>{m.isHost ? "🔥" : initial(m.authorName)}</div>
              <div className="bub">
                {!m.mine && <div className="nm">{m.authorName}{m.isHost && <span className="hb">Host</span>} · {ago(m.createdAt)}</div>}
                <div className="tx">{m.body}</div>
              </div>
            </div>
          ))}
        <div ref={endRef} />
      </div>
      <div className="comp">
        <input placeholder="Message the circle…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button onClick={send} disabled={sending || !text.trim()}>Send</button>
      </div>
    </div>
  );
}
