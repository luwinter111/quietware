import { useState } from "react";

interface Article {
  url: string;
  title: string;
  byline?: string;
  text: string;
  wordCount: number;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));

export function App() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [summary, setSummary] = useState<{ tldr: string; bullets: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function read(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setErr("");
    setArticle(null);
    setSummary(null);
    try {
      setArticle(await fetch("/api/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }).then(json));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function summarize() {
    if (!article) return;
    setLoading(true);
    try {
      setSummary(await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: article.text }),
      }).then(json));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>Quietware<span>Read</span></h1>
        <p className="sub">粘贴任意链接 → 干净正文,无广告、无弹窗、无信息流</p>
        <form onSubmit={read}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <button disabled={loading}>{loading ? "…" : "净化"}</button>
        </form>
      </header>

      {err && <p className="err">⚠️ {err}</p>}

      {article && (
        <article>
          <h2>{article.title}</h2>
          <div className="meta">
            {article.byline && <span>{article.byline}</span>}
            <span>{article.wordCount} 词</span>
            <a href={article.url} target="_blank" rel="noreferrer">原文 ↗</a>
          </div>
          {!summary && (
            <button className="sum" onClick={summarize} disabled={loading}>🤖 AI 摘要</button>
          )}
          {summary && (
            <div className="summary">
              <p className="tldr">{summary.tldr}</p>
              <ul>{summary.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          )}
          <div className="body">
            {article.text.split(/(?<=。|\.)\s+/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      )}
    </div>
  );
}
