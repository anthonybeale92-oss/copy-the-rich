import { useEffect, useRef, useState } from "react";
const PAUSED_KEY = "ctr_music_paused";
export default function MusicPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = audio.current!;
    el.volume = 0.25;
    let paused = false;
    try { paused = localStorage.getItem(PAUSED_KEY) === "yes"; } catch {}
    if (!paused) void el.play().catch(() => setPlaying(false));
    return () => el.pause();
  }, []);
  async function toggle() {
    const el = audio.current!;
    if (!el.paused) {
      el.pause();
      try { localStorage.setItem(PAUSED_KEY, "yes"); } catch {}
    } else {
      try {
        await el.play();
        setFailed(false);
        try { localStorage.removeItem(PAUSED_KEY); } catch {}
      } catch { setPlaying(false); }
    }
  }
  return <>
    <style>{`
      .ctr-music{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;gap:9px;padding:5px 12px 5px 5px;border:1px solid rgba(94,200,255,.35);border-radius:99px;background:rgba(8,15,20,.95);color:#c6eaff;box-shadow:0 4px 18px #0005;font-family:inherit}
      .ctr-music button{width:34px;height:34px;border:0;border-radius:50%;background:#5ec8ff;color:#061018;display:grid;place-items:center;cursor:pointer;font-size:14px}
      .ctr-music button:focus-visible{outline:2px solid white;outline-offset:3px}
      .ctr-music span{font-size:11px;line-height:1.4;letter-spacing:.04em}
      .lvp{bottom:calc(68px + env(safe-area-inset-bottom))!important}
    `}</style>
    <audio ref={audio} src="/racks.mp3" loop preload="metadata" playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => {setFailed(true);setPlaying(false);}} />
    <div className="ctr-music" role="group" aria-label="Background music: Racks by YC featuring Future">
      <button type="button" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"} title={playing ? "Pause music" : "Play music"}>{playing ? "Ⅱ" : "▶"}</button>
      <span>{failed ? "Music unavailable" : playing ? "RACKS ♪" : "Play music"}</span>
    </div>
  </>;
}
