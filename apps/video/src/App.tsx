import { useEffect, useState } from "react";

interface Video {
  id: string;
  title: string;
  link?: string;
  channel: string;
  publishedAt?: string;
  thumb?: string;
}
interface Channel {
  id: string;
  title: string;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));

export function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [url, setUrl] = useState("");
  const [active, setActive] = useState<string | undefined>();

  async function load(channelId?: string) {
    const q = channelId ? `?channelId=${channelId}` : "";
    const [c, v] = await Promise.all([fetch("/api/channels").then(json), fetch(`/api/videos${q}`).then(json)]);
    setChannels(c);
    setVideos(v);
  }
  useEffect(() => {
    load();
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }).then(json);
      setUrl("");
      load(active);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>Quietware<span>Video</span></h1>
        <p className="sub">只看你订阅频道的新视频 · 无推荐算法 · 无广告 · 不刷信息流</p>
        <form onSubmit={subscribe}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="频道 RSS,如 youtube.com/feeds/videos.xml?channel_id=…" />
          <button>订阅</button>
        </form>
        <p className="tip">提示:YouTube 频道 feed = <code>https://www.youtube.com/feeds/videos.xml?channel_id=频道ID</code></p>
      </header>

      <div className="chips">
        <button className={!active ? "chip on" : "chip"} onClick={() => { setActive(undefined); load(); }}>全部</button>
        {channels.map((c) => (
          <button key={c.id} className={active === c.id ? "chip on" : "chip"} onClick={() => { setActive(c.id); load(c.id); }}>
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid">
        {videos.map((v) => (
          <a key={v.id} className="card" href={v.link} target="_blank" rel="noreferrer">
            {v.thumb ? <img src={v.thumb} alt="" /> : <div className="noimg">▶</div>}
            <div className="info">
              <span className="t">{v.title}</span>
              <span className="c">{v.channel}{v.publishedAt ? ` · ${new Date(v.publishedAt).toLocaleDateString()}` : ""}</span>
            </div>
          </a>
        ))}
        {videos.length === 0 && <p className="hint">还没有视频。订阅一个频道 RSS 试试。</p>}
      </div>
    </div>
  );
}
