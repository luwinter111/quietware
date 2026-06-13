import { useEffect, useRef, useState } from "react";
import type { FeedItem, FeedSource } from "@quietware/core";

const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));

function fmt(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function App() {
  const [shows, setShows] = useState<FeedSource[]>([]);
  const [episodes, setEpisodes] = useState<FeedItem[]>([]);
  const [activeShow, setActiveShow] = useState<string | undefined>();
  const [playing, setPlaying] = useState<FeedItem | null>(null);
  const [url, setUrl] = useState("");
  const [rate, setRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function refresh(showId?: string) {
    const q = showId ? `?showId=${showId}` : "";
    const [s, e] = await Promise.all([
      fetch("/api/shows").then(json),
      fetch(`/api/episodes${q}`).then(json),
    ]);
    setShows(s);
    setEpisodes(e);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      await fetch("/api/shows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }).then(json);
      setUrl("");
      refresh(activeShow);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function play(ep: FeedItem) {
    setPlaying(ep);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
        audioRef.current.play();
      }
    }, 0);
  }

  function changeRate(r: number) {
    setRate(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }

  return (
    <div className="app">
      <header>
        <h1>Quietware<span>Podcast</span></h1>
        <form onSubmit={subscribe}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="粘贴播客 feed 地址…" />
          <button>订阅</button>
        </form>
      </header>

      <div className="shows">
        <button className={!activeShow ? "chip active" : "chip"} onClick={() => { setActiveShow(undefined); refresh(); }}>
          全部
        </button>
        {shows.map((s) => (
          <button
            key={s.id}
            className={activeShow === s.id ? "chip active" : "chip"}
            onClick={() => { setActiveShow(s.id); refresh(s.id); }}
          >
            {s.title}
          </button>
        ))}
      </div>

      <ul className="episodes">
        {episodes.map((ep) => (
          <li key={ep.id} className={playing?.id === ep.id ? "ep playing" : "ep"}>
            <button className="playbtn" onClick={() => play(ep)}>▶</button>
            <div className="epinfo">
              <span className="eptitle">{ep.title}</span>
              <span className="epmeta">
                {ep.publishedAt && new Date(ep.publishedAt).toLocaleDateString()}
                {ep.durationSec ? ` · ${fmt(ep.durationSec)}` : ""}
              </span>
            </div>
          </li>
        ))}
        {episodes.length === 0 && <p className="hint">没有单集。订阅一个播客 feed 试试。</p>}
      </ul>

      {playing && (
        <footer className="player">
          <div className="nowrow">
            <div className="nowtitle">🎧 {playing.title}</div>
            <div className="rates">
              {[1, 1.25, 1.5, 2].map((r) => (
                <button key={r} className={rate === r ? "rate on" : "rate"} onClick={() => changeRate(r)}>
                  {r}×
                </button>
              ))}
            </div>
          </div>
          <audio ref={audioRef} src={playing.audioUrl} controls />
        </footer>
      )}
    </div>
  );
}
