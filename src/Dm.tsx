import { useEffect, useRef, useState } from "react";
import { fetchDm, sendDm, fetchDmThreads, fetchDmThread, replyDm, type DmMsg, type DmThread } from "./api";

const CSS = `
.rtbdm-scrim{position:fixed;inset:0;z-index:80;background:rgba(253,253,254,.7);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding:0}
@media(min-width:640px){.rtbdm-scrim{align-items:center;padding:20px}}
.rtbdm{width:100%;max-width:460px;height:82vh;max-height:640px;background:#fbfbfc;border:1px solid rgba(20,20,20,.1);border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden}
@media(min-width:640px){.rtbdm{border-radius:18px;height:min(640px,82vh)}}
.rtbdm .dh{display:flex;align-items:center;gap:11px;padding:14px 16px;border-bottom:1px solid rgba(20,20,20,.07);background:rgba(49,129,185,.05)}
.rtbdm .dav{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:linear-gradient(135deg,#3181b9,#3181b9)}
.rtbdm .dav.m{background:linear-gradient(135deg,#1d6694,#2f7fbc);font-size:14px;font-weight:900;color:#f9f9fa}
.rtbdm .dt{flex:1;min-width:0}
.rtbdm .dt b{font-size:14.5px;font-weight:900;display:block}
.rtbdm .dt span{font-size:11.5px;color:rgba(20,20,20,.45)}
.rtbdm .dx{width:32px;height:32px;border-radius:9px;border:1px solid rgba(20,20,20,.12);background:none;color:#141414;cursor:pointer;font-size:15px}
.rtbdm .back{background:none;border:none;color:#2e3e49;font-size:13px;font-weight:800;cursor:pointer;padding:0;margin-right:2px}
.rtbdm .body{flex:1;overflow-y:auto;padding:14px 14px 6px;display:flex;flex-direction:column;gap:8px}
.rtbdm .msg{max-width:78%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.rtbdm .msg.me{align-self:flex-end;background:linear-gradient(90deg,#1d6694,#307fbb);color:#f9f9fa;border-bottom-right-radius:5px;font-weight:600}
.rtbdm .msg.them{align-self:flex-start;background:rgba(20,20,20,.07);color:#141414;border-bottom-left-radius:5px}
.rtbdm .mt{font-size:10px;opacity:.55;margin-top:3px}
.rtbdm .empty{margin:auto;text-align:center;color:rgba(20,20,20,.45);font-size:13.5px;padding:20px}
.rtbdm .comp{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(20,20,20,.07)}
.rtbdm .comp input{flex:1;height:42px;border:1px solid rgba(20,20,20,.12);background:#fdfdfd;border-radius:21px;padding:0 16px;color:#141414;font-size:14px;outline:none}
.rtbdm .comp input:focus{border-color:rgba(29,102,148,.4)}
.rtbdm .comp button{height:42px;padding:0 18px;border:none;border-radius:21px;font-weight:800;font-size:13.5px;color:#f9f9fa;background:linear-gradient(90deg,#1d6694,#307fbb);cursor:pointer}
.rtbdm .comp button:disabled{opacity:.5}
.rtbdm .thread{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(20,20,20,.05);cursor:pointer;text-align:left;background:none;border-left:none;border-right:none;border-top:none;width:100%;color:#141414}
.rtbdm .thread:hover{background:rgba(20,20,20,.03)}
.rtbdm .thread .tn{flex:1;min-width:0}
.rtbdm .thread .tn b{font-size:13.5px;font-weight:800;display:block}
.rtbdm .thread .tn span{font-size:12px;color:rgba(20,20,20,.45);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
.rtbdm .unread{flex:none;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#c00b2a;color:#141414;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center}
`;

const initial = (n?: string) => (n || "M").trim().charAt(0).toUpperCase();
function ago(iso?: string): string {
  if (!iso) return "";
  try {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "now"; const m = s / 60; if (m < 60) return `${Math.floor(m)}m`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h`; const d = h / 24; if (d < 7) return `${Math.floor(d)}d`;
    return new Date(iso).toLocaleDateString();
  } catch { return ""; }
}

function Chat({ messages, onSend, sending }: { messages: DmMsg[]; onSend: (b: string) => void; sending: boolean }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages.length]);
  const go = () => { const b = text.trim(); if (!b || sending) return; onSend(b); setText(""); };
  return (
    <>
      <div className="body">
        {messages.length === 0 ? (
          <div className="empty">Send a message to start the conversation 👋</div>
        ) : messages.map((m) => (
          <div key={m.id} className={`msg ${m.mine ? "me" : "them"}`}>{m.body}<div className="mt">{ago(m.createdAt)}</div></div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="comp">
        <input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} />
        <button onClick={go} disabled={sending || !text.trim()}>Send</button>
      </div>
    </>
  );
}

export default function Dm({ isHost, hostName, onClose }: { isHost: boolean; hostName: string; onClose: () => void }) {
  // Member: single thread with the host. Host: list of member threads → open one.
  const [messages, setMessages] = useState<DmMsg[]>([]);
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [active, setActive] = useState<{ memberId: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      if (isHost) { setThreads(await fetchDmThreads()); }
      else { const d = await fetchDm(); setMessages(d?.messages || []); }
      setLoading(false);
    })();
  }, [isHost]);

  const openThread = async (t: DmThread) => {
    setActive({ memberId: t.memberId, name: t.name }); setLoading(true);
    const d = await fetchDmThread(t.memberId);
    setMessages(d?.messages || []); setLoading(false);
    setThreads((ts) => ts.map((x) => (x.memberId === t.memberId ? { ...x, unread: 0 } : x)));
  };
  const send = async (body: string) => {
    setSending(true);
    try {
      const msg = isHost && active ? await replyDm(active.memberId, body) : await sendDm(body);
      setMessages((m) => [...m, msg]);
    } catch (e: any) { alert(e?.message || "Couldn't send"); }
    finally { setSending(false); }
  };

  const showList = isHost && !active;
  const title = isHost ? (active ? active.name : "Member messages") : hostName;
  const sub = isHost ? (active ? "Replying as " + hostName : `${threads.length} conversation${threads.length === 1 ? "" : "s"}`) : "Usually replies within a day";

  return (
    <div className="rtbdm-scrim" onClick={onClose}>
      <style>{CSS}</style>
      <div className="rtbdm" onClick={(e) => e.stopPropagation()}>
        <div className="dh">
          {isHost && active && <button className="back" onClick={() => { setActive(null); setMessages([]); }}>‹ Back</button>}
          <div className={`dav ${isHost && active ? "m" : ""}`}>{isHost && active ? initial(active.name) : "🔥"}</div>
          <div className="dt"><b>{title}</b><span>{sub}</span></div>
          <button className="dx" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="empty">Loading…</div>
        ) : showList ? (
          <div className="body" style={{ padding: 0 }}>
            {threads.length === 0 ? (
              <div className="empty">No messages yet. Members' DMs will show up here.</div>
            ) : threads.map((t) => (
              <button className="thread" key={t.memberId} onClick={() => openThread(t)}>
                <div className="dav m">{initial(t.name)}</div>
                <div className="tn"><b>{t.name}</b><span>{t.lastBody || ""}</span></div>
                <span style={{ fontSize: 10.5, color: "rgba(20,20,20,.35)" }}>{ago(t.lastAt)}</span>
                {t.unread > 0 && <span className="unread">{t.unread}</span>}
              </button>
            ))}
          </div>
        ) : (
          <Chat messages={messages} onSend={send} sending={sending} />
        )}
      </div>
    </div>
  );
}
