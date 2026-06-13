import { useEffect, useState } from "react";

interface Wish {
  id: string;
  title: string;
  url?: string;
  targetPrice?: number;
  note?: string;
  got: boolean;
  createdAt: string;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));

export function App() {
  const [items, setItems] = useState<Wish[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setItems(await fetch("/api/items").then(json));
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, url: url || undefined, targetPrice: price ? Number(price) : undefined, note: note || undefined }),
    }).then(json);
    setTitle(""); setUrl(""); setPrice(""); setNote("");
    load();
  }

  async function toggle(w: Wish) {
    await fetch(`/api/items/${w.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ got: !w.got }),
    }).then(json);
    load();
  }
  async function del(id: string) {
    await fetch(`/api/items/${id}`, { method: "DELETE" }).then(json);
    load();
  }

  const active = items.filter((i) => !i.got);
  const done = items.filter((i) => i.got);

  return (
    <div className="wrap">
      <h1>Quietware<span>Shop</span></h1>
      <p className="sub">干净的想买清单 · 不扒电商 · 不推广 · 数据只在本地</p>

      <form onSubmit={add}>
        <input className="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="想买什么?(必填)" />
        <div className="row">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="链接(选填)" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="心理价位 ¥" type="number" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注(选填)" />
        <button>加入清单</button>
      </form>

      <ul className="list">
        {active.map((w) => (
          <li key={w.id}>
            <input type="checkbox" checked={w.got} onChange={() => toggle(w)} />
            <div className="body">
              <span className="t">{w.url ? <a href={w.url} target="_blank" rel="noreferrer">{w.title}</a> : w.title}</span>
              <span className="meta">{w.targetPrice ? `心理价 ¥${w.targetPrice}` : ""}{w.note ? ` · ${w.note}` : ""}</span>
            </div>
            <button className="del" onClick={() => del(w.id)}>×</button>
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <>
          <h2>已购 ({done.length})</h2>
          <ul className="list done">
            {done.map((w) => (
              <li key={w.id}>
                <input type="checkbox" checked={w.got} onChange={() => toggle(w)} />
                <span className="t">{w.title}</span>
                <button className="del" onClick={() => del(w.id)}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {items.length === 0 && <p className="hint">清单是空的。</p>}
    </div>
  );
}
