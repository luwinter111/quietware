import { useEffect, useState } from "react";
import type { FeedItem, FeedSource, AiEnrichment } from "@quietware/core";
import { api } from "./api.js";

export function App() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [activeSource, setActiveSource] = useState<string | undefined>();
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh(sourceId?: string) {
    setLoading(true);
    const [s, it] = await Promise.all([api.sources(), api.items({ sourceId })]);
    setSources(s);
    setItems(it);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setLoading(true);
    try {
      await api.addSource(newUrl.trim());
      setNewUrl("");
      await refresh(activeSource);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function pick(sourceId?: string) {
    setActiveSource(sourceId);
    refresh(sourceId);
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const { items } = await api.refresh();
      await refresh(activeSource);
      console.log(`刷新完成,共 ${items} 条`);
    } finally {
      setLoading(false);
    }
  }

  async function onOpml(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { added } = await api.importOpml(await file.text());
      alert(`导入了 ${added} 个源`);
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function removeSource(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("取消订阅这个源?")) return;
    await api.removeSource(id);
    if (activeSource === id) setActiveSource(undefined);
    await refresh(activeSource === id ? undefined : activeSource);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">Quietware<span>Reader</span></h1>
        <p className="tagline">干净 · AI 降噪 · 无广告</p>

        <form onSubmit={addSource} className="add-form">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="粘贴 RSS / Atom 地址…"
          />
          <button disabled={loading}>＋</button>
        </form>

        <div className="toolbar">
          <button onClick={refreshAll} disabled={loading}>↻ 刷新</button>
          <label className="opml">
            导入 OPML
            <input type="file" accept=".opml,.xml" onChange={onOpml} hidden />
          </label>
        </div>

        <nav>
          <button className={!activeSource ? "src active" : "src"} onClick={() => pick(undefined)}>
            全部
          </button>
          {sources.map((s) => (
            <button
              key={s.id}
              className={activeSource === s.id ? "src active" : "src"}
              onClick={() => pick(s.id)}
            >
              <span className="src-title">{s.title}</span>
              <span className="src-del" onClick={(e) => removeSource(s.id, e)}>×</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="feed">
        {loading && <p className="hint">加载中…</p>}
        {!loading && items.length === 0 && <p className="hint">还没有内容,左侧添加一个源试试。</p>}
        {items.map((it) => (
          <Article key={it.id} item={it} onRead={() => api.markRead(it.id, true)} />
        ))}
      </main>
    </div>
  );
}

function Article({ item, onRead }: { item: FeedItem; onRead: () => void }) {
  const [ai, setAi] = useState<AiEnrichment | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function denoise() {
    setBusy(true);
    setErr(null);
    try {
      setAi(await api.enrich(item.id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card">
      <a className="title" href={item.link} target="_blank" rel="noreferrer" onClick={onRead}>
        {item.title}
      </a>
      <div className="meta">
        {item.author && <span>{item.author}</span>}
        {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleString()}</span>}
      </div>
      {item.snippet && !ai && <p className="snippet">{item.snippet.slice(0, 200)}</p>}

      {ai && (
        <div className="ai">
          <div className="score" data-high={ai.signalScore >= 60}>
            信噪比 {ai.signalScore}
          </div>
          <p className="tldr">{ai.tldr}</p>
          <ul>
            {ai.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="reason">{ai.reason}</p>
        </div>
      )}

      {!ai && (
        <button className="denoise" onClick={denoise} disabled={busy}>
          {busy ? "降噪中…" : "🤖 AI 降噪"}
        </button>
      )}
      {err && <p className="err">{err}</p>}
    </article>
  );
}
