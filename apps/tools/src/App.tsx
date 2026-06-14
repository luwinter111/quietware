import { useEffect, useState } from "react";

interface Note {
  id: string;
  text: string;
  createdAt: string;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [aiOut, setAiOut] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setNotes(await fetch("/api/notes").then(json));
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!text.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    }).then(json);
    setText("");
    setAiOut("");
    load();
  }

  async function ai(kind: "summarize" | "organize") {
    if (!text.trim()) return;
    setBusy(true);
    setAiOut("");
    try {
      const r = await fetch(`/api/ai/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      }).then(json);
      setAiOut(kind === "summarize" ? `${r.tldr}\n\n• ${r.bullets.join("\n• ")}` : r.result);
    } catch (e) {
      setAiOut("⚠️ " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" }).then(json);
    load();
  }

  return (
    <div className="wrap">
      <h1>Quietware<span>Tools</span></h1>
      <p className="sub">本地速记 + AI 文本助手 · 数据只在你机器上 · 无广告</p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="写点什么,或粘贴一段文字…" />
      <div className="actions">
        <button className="primary" onClick={add}>保存速记</button>
        <button onClick={() => ai("summarize")} disabled={busy}>🤖 摘要</button>
        <button onClick={() => ai("organize")} disabled={busy}>✨ 整理</button>
      </div>

      {busy && <p className="hint">AI 处理中…</p>}
      {aiOut && <pre className="aiout">{aiOut}</pre>}

      <h2>速记 ({notes.length})</h2>
      <ul className="notes">
        {notes.map((n) => (
          <li key={n.id}>
            <pre>{n.text}</pre>
            <div className="row">
              <time>{new Date(n.createdAt).toLocaleString()}</time>
              <button onClick={() => del(n.id)}>删除</button>
            </div>
          </li>
        ))}
        {notes.length === 0 && <p className="hint">还没有速记。</p>}
      </ul>
    </div>
  );
}
