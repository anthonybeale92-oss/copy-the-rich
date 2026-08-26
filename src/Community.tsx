import { useEffect, useState } from "react";
import { fetchFeed, createPost, togglePostLike, togglePin, deletePost, addComment, type RtbPost, type RtbFeed } from "./api";
import Dm from "./Dm";

const CSS = `
.rtbc{--gold:#3f9fe0;--cy:#5ec8ff}
.rtbc *{box-sizing:border-box}
.rtbc .ghead{border:1px solid rgba(255,255,255,.09);border-radius:18px;overflow:hidden;margin-bottom:16px;background:#0a0b10}
.rtbc .gcover{height:120px;position:relative;background:radial-gradient(120% 140% at 20% 0%,rgba(94,200,255,.28),transparent 55%),radial-gradient(120% 140% at 90% 20%,rgba(63,159,224,.28),transparent 55%),linear-gradient(120deg,#181309,#191308)}
.rtbc .gcover .glogo{position:absolute;left:20px;bottom:-26px;width:66px;height:66px;border-radius:16px;border:3px solid #0a0b10;object-fit:cover;background:#0a0b10}
.rtbc .gbody{padding:34px 20px 18px}
.rtbc .gname{font-size:19px;font-weight:900;letter-spacing:-.01em}
.rtbc .gmeta{font-size:12.5px;color:rgba(255,255,255,.5);margin-top:4px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rtbc .gmeta b{color:rgba(255,255,255,.8);font-weight:800}
.rtbc .gdot{opacity:.4}
.rtbc .gdesc{font-size:13.5px;color:rgba(255,255,255,.62);margin-top:10px;line-height:1.55}
.rtbc .dmbtn{margin-top:14px;height:40px;padding:0 18px;border:none;border-radius:11px;font-weight:800;font-size:13.5px;color:#1a1400;cursor:pointer;background:linear-gradient(90deg,#3f9fe0,#e2f4ff);display:inline-flex;align-items:center;gap:8px}
.rtbc .dmbtn.host{background:linear-gradient(90deg,#5ec8ff,#2a80bd);color:#0b0d12}
.rtbc .composer{border:1px solid rgba(255,255,255,.1);background:#0a0b10;border-radius:16px;padding:14px;margin-bottom:16px}
.rtbc .composer.host{border-color:rgba(63,159,224,.32)}
.rtbc .crow{display:flex;gap:11px;align-items:flex-start}
.rtbc .av{flex:0 0 40px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;color:#0b0d12;background:linear-gradient(135deg,#5ec8ff,#1f6fa8)}
.rtbc .av.host{background:linear-gradient(135deg,#3f9fe0,#3f9fe0);color:#1a1400}
.rtbc textarea{width:100%;min-height:46px;resize:vertical;border:none;background:none;color:#fff;font-size:15px;outline:none;font-family:inherit;line-height:1.5;padding-top:8px}
.rtbc textarea::placeholder{color:rgba(255,255,255,.42)}
.rtbc .cimg{margin-top:10px;width:100%;height:38px;border:1px solid rgba(255,255,255,.12);background:#050608;border-radius:10px;padding:0 12px;color:#fff;font-size:13px;outline:none}
.rtbc .cimg:focus{border-color:rgba(94,200,255,.4)}
.rtbc .cprev{margin-top:10px;border-radius:12px;max-height:220px;border:1px solid rgba(255,255,255,.1)}
.rtbc .cbar{display:flex;align-items:center;gap:10px;margin-top:11px;padding-top:11px;border-top:1px solid rgba(255,255,255,.06)}
.rtbc .photo{height:36px;padding:0 13px;border:1px solid rgba(255,255,255,.12);background:none;border-radius:10px;color:rgba(255,255,255,.7);font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.rtbc .photo.on{border-color:rgba(94,200,255,.4);color:#e2f4ff;background:rgba(94,200,255,.08)}
.rtbc .hint{font-size:11.5px;color:rgba(63,159,224,.9);font-weight:700}
.rtbc .postbtn{margin-left:auto;height:38px;padding:0 22px;border:none;border-radius:11px;font-weight:800;font-size:13.5px;color:#0b0d12;cursor:pointer;background:linear-gradient(90deg,#5ec8ff,#2a80bd,#1f6fa8)}
.rtbc .postbtn:disabled{opacity:.45;cursor:default}
.rtbc .post{border:1px solid rgba(255,255,255,.09);background:#0a0b10;border-radius:16px;padding:16px;margin-bottom:14px}
.rtbc .post.pin{border-color:rgba(63,159,224,.32);background:linear-gradient(180deg,rgba(63,159,224,.04),#0a0b10)}
.rtbc .pinlbl{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:5px;margin-bottom:10px}
.rtbc .phead{display:flex;align-items:center;gap:11px}
.rtbc .pmeta{min-width:0;flex:1}
.rtbc .pname{font-weight:800;font-size:14px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rtbc .hostbadge{font-size:9.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#1a1400;background:linear-gradient(90deg,#3f9fe0,#e2f4ff);border-radius:6px;padding:2px 7px}
.rtbc .ptime{font-size:11.5px;color:rgba(255,255,255,.4);margin-top:1px}
.rtbc .pbody{font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.92);white-space:pre-wrap;word-break:break-word;margin-top:11px}
.rtbc .pimg{margin-top:11px;border-radius:12px;max-width:100%;border:1px solid rgba(255,255,255,.08);display:block}
.rtbc .rsum{display:flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;color:rgba(255,255,255,.5)}
.rtbc .rsum .heart{width:19px;height:19px;border-radius:50%;background:linear-gradient(135deg,#fb7185,#f43f5e);display:inline-flex;align-items:center;justify-content:center;font-size:10px}
.rtbc .pactions{display:flex;align-items:center;gap:4px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)}
.rtbc .act{flex:1;height:38px;border:none;background:none;border-radius:9px;color:rgba(255,255,255,.6);font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px}
.rtbc .act:hover{background:rgba(255,255,255,.05);color:#fff}
.rtbc .act.on{color:#fb7185}
.rtbc .act.pinbtn.on{color:#7fd4ff}
.rtbc .modrow{display:flex;gap:8px;margin-top:8px}
.rtbc .mbtn{height:28px;padding:0 11px;border:1px solid rgba(255,255,255,.1);background:none;border-radius:8px;color:rgba(255,255,255,.5);font-size:11.5px;font-weight:700;cursor:pointer}
.rtbc .mbtn:hover{color:#fff}
.rtbc .mbtn.pin.on{border-color:rgba(63,159,224,.4);color:#7fd4ff;background:rgba(63,159,224,.1)}
.rtbc .mbtn.del:hover{color:#fda4af;border-color:rgba(244,63,94,.35)}
.rtbc .comments{margin-top:12px;display:flex;flex-direction:column;gap:9px}
.rtbc .cm{display:flex;gap:9px;align-items:flex-start}
.rtbc .cav{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#0b0d12;background:linear-gradient(135deg,#5ec8ff,#1f6fa8)}
.rtbc .cav.host{background:linear-gradient(135deg,#3f9fe0,#3f9fe0);color:#1a1400}
.rtbc .cbub{flex:1;min-width:0;background:rgba(255,255,255,.045);border-radius:14px;padding:8px 13px}
.rtbc .cname{font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:6px}
.rtbc .cbody{font-size:13px;color:rgba(255,255,255,.85);line-height:1.5;margin-top:2px;white-space:pre-wrap;word-break:break-word}
.rtbc .caddrow{display:flex;gap:8px;align-items:center;margin-top:2px}
.rtbc .cinput{flex:1;height:36px;border:none;background:rgba(255,255,255,.05);border-radius:18px;padding:0 14px;color:#fff;font-size:13px;outline:none}
.rtbc .cinput:focus{background:rgba(255,255,255,.08)}
.rtbc .csend{height:36px;padding:0 15px;border:none;border-radius:18px;font-weight:800;font-size:12.5px;color:#0b0d12;background:linear-gradient(90deg,#5ec8ff,#2a80bd);cursor:pointer}
.rtbc .csend:disabled{opacity:.5}
.rtbc .empty{text-align:center;color:rgba(255,255,255,.45);font-size:13.5px;padding:30px 16px;border:1px dashed rgba(255,255,255,.12);border-radius:16px}
`;

const initial = (name?: string) => (name || "M").trim().charAt(0).toUpperCase();
function ago(iso: string): string {
  try {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = s / 60; if (m < 60) return `${Math.floor(m)}m`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h`;
    const d = h / 24; if (d < 7) return `${Math.floor(d)}d`;
    return new Date(iso).toLocaleDateString();
  } catch { return ""; }
}

export default function Community({ onOpenChat }: { onOpenChat?: () => void }) {
  const [feed, setFeed] = useState<RtbFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [showImg, setShowImg] = useState(false);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [cDraft, setCDraft] = useState<Record<string, string>>({});
  const [cSending, setCSending] = useState<Record<string, boolean>>({});
  const [dmOpen, setDmOpen] = useState(false);

  const load = async () => { const f = await fetchFeed(); setFeed(f); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const isHost = !!feed?.isHost;
  const patch = (id: string, fn: (p: RtbPost) => RtbPost) =>
    setFeed((f) => (f ? { ...f, posts: f.posts.map((p) => (p.id === id ? fn(p) : p)) } : f));

  const submit = async () => {
    const body = draft.trim();
    const image = imgUrl.trim();
    if ((!body && !image) || posting) return;
    setPosting(true);
    try {
      const post = await createPost(body, image || undefined);
      setDraft(""); setImgUrl(""); setShowImg(false);
      setFeed((f) => (f ? { ...f, posts: [post, ...f.posts] } : f));
    } catch (e: any) { alert(e?.message || "Couldn't post"); }
    finally { setPosting(false); }
  };

  const like = async (id: string) => {
    patch(id, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }));
    const r = await togglePostLike(id);
    if (r) patch(id, (p) => ({ ...p, liked: r.liked, likes: r.likes }));
  };
  const pin = async (id: string) => { const r = await togglePin(id); if (r) await load(); };
  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    if (await deletePost(id)) setFeed((f) => (f ? { ...f, posts: f.posts.filter((p) => p.id !== id) } : f));
  };
  const comment = async (id: string) => {
    const body = (cDraft[id] || "").trim();
    if (!body || cSending[id]) return;
    setCSending((s) => ({ ...s, [id]: true }));
    try {
      const c = await addComment(id, body);
      patch(id, (p) => ({ ...p, comments: [...p.comments, c] }));
      setCDraft((d) => ({ ...d, [id]: "" }));
      setOpenComments((o) => ({ ...o, [id]: true }));
    } catch (e: any) { alert(e?.message || "Couldn't comment"); }
    finally { setCSending((s) => ({ ...s, [id]: false })); }
  };

  return (
    <div className="rtbc">
      <style>{CSS}</style>

      {/* Facebook-group-style header */}
      <div className="ghead">
        <div className="gcover"><img className="glogo" src="/logo.svg" alt="Copy the Rich Trades" /></div>
        <div className="gbody">
          <div className="gname">Copy the Rich Trades · Inner Circle</div>
          <div className="gmeta">
            <span>🔒 Private group</span><span className="gdot">·</span>
            <span><b>{(feed?.memberCount ?? 0).toLocaleString()}</b> members</span><span className="gdot">·</span>
            <span>Hosted by <b>{feed?.hostName || "Anthony Beale"}</b> 👑</span>
          </div>
          <div className="gdesc">Daily wins, live calls and real talk from the desk. Post your questions, share your W's, and grow with the circle. 🔥</div>
          <button className={`dmbtn ${isHost ? "host" : ""}`} onClick={() => (onOpenChat ? onOpenChat() : setDmOpen(true))}>
            {isHost ? "💬 Members' chat" : "💬 Open the members' chat"}
          </button>
        </div>
      </div>

      {dmOpen && <Dm isHost={isHost} hostName={feed?.hostName || "Anthony Beale"} onClose={() => setDmOpen(false)} />}

      {/* Composer */}
      <div className={`composer ${isHost ? "host" : ""}`}>
        <div className="crow">
          <div className={`av ${isHost ? "host" : ""}`}>{isHost ? "🔥" : initial(feed?.me)}</div>
          <textarea
            placeholder={isHost ? `What's the word, ${feed?.hostName || "Anthony Beale"}?` : `What's on your mind${feed?.me ? ", " + feed.me.split(" ")[0] : ""}?`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        {showImg && (
          <>
            <input className="cimg" placeholder="Paste an image link (https://…)" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
            {imgUrl.trim() && <img className="cprev" src={imgUrl.trim()} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
          </>
        )}
        <div className="cbar">
          <button className={`photo ${showImg ? "on" : ""}`} onClick={() => setShowImg((v) => !v)}>📷 Photo</button>
          {isHost && <span className="hint">Posting as {feed?.hostName || "Anthony Beale"}</span>}
          <button className="postbtn" onClick={submit} disabled={posting || (!draft.trim() && !imgUrl.trim())}>{posting ? "Posting…" : "Post"}</button>
        </div>
      </div>

      {loading ? (
        <div className="empty">Loading the community…</div>
      ) : !feed || feed.posts.length === 0 ? (
        <div className="empty">No posts yet — be the first to say something. 🔥</div>
      ) : (
        feed.posts.map((p) => {
          const cOpen = openComments[p.id] || p.comments.length > 0;
          return (
            <div key={p.id} className={`post ${p.pinned ? "pin" : ""}`}>
              {p.pinned && <div className="pinlbl">📌 Pinned by {feed.hostName}</div>}
              <div className="phead">
                <div className={`av ${p.isHost ? "host" : ""}`}>{p.isHost ? "🔥" : initial(p.authorName)}</div>
                <div className="pmeta">
                  <div className="pname">{p.authorName}{p.isHost && <span className="hostbadge">👑 Host</span>}</div>
                  <div className="ptime">{ago(p.createdAt)}</div>
                </div>
              </div>
              {p.body && <div className="pbody">{p.body}</div>}
              {p.imageUrl && <img className="pimg" src={p.imageUrl} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}

              {p.likes > 0 && (
                <div className="rsum"><span className="heart">❤️</span> {p.likes}</div>
              )}
              <div className="pactions">
                <button className={`act ${p.liked ? "on" : ""}`} onClick={() => like(p.id)}>{p.liked ? "❤️ Liked" : "🤍 Like"}</button>
                <button className="act" onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))}>💬 Comment{p.comments.length > 0 ? ` (${p.comments.length})` : ""}</button>
              </div>

              {(isHost || p.mine) && (
                <div className="modrow">
                  {isHost && <button className={`mbtn pin ${p.pinned ? "on" : ""}`} onClick={() => pin(p.id)}>{p.pinned ? "📌 Unpin" : "📌 Pin"}</button>}
                  {(p.mine || isHost) && <button className="mbtn del" onClick={() => remove(p.id)}>Delete</button>}
                </div>
              )}

              {cOpen && (
                <div className="comments">
                  {p.comments.map((c) => (
                    <div className="cm" key={c.id}>
                      <div className={`cav ${c.isHost ? "host" : ""}`}>{c.isHost ? "🔥" : initial(c.authorName)}</div>
                      <div className="cbub">
                        <div className="cname">{c.authorName}{c.isHost && <span className="hostbadge">Host</span>} <span className="ptime" style={{ marginTop: 0 }}>· {ago(c.createdAt)}</span></div>
                        <div className="cbody">{c.body}</div>
                      </div>
                    </div>
                  ))}
                  <div className="caddrow">
                    <div className={`cav ${isHost ? "host" : ""}`}>{isHost ? "🔥" : initial(feed?.me)}</div>
                    <input
                      className="cinput"
                      placeholder="Write a comment…"
                      value={cDraft[p.id] || ""}
                      onChange={(e) => setCDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") comment(p.id); }}
                    />
                    <button className="csend" onClick={() => comment(p.id)} disabled={cSending[p.id] || !(cDraft[p.id] || "").trim()}>Send</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
