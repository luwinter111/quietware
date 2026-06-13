import { useEffect, useState } from "react";

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  category?: string;
  tldr?: string;
  needsReply?: boolean;
}
const json = (r: Response) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))));
const CATS = ["重要", "通知", "营销", "社交", "其他"];
const catColor: Record<string, string> = { 重要: "#c0392b", 通知: "#2980b9", 营销: "#999", 社交: "#27ae60", 其他: "#777" };

export function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [triaged, setTriaged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/emails").then(json).then(setEmails);
  }, []);

  async function triage() {
    setBusy(true);
    setErr("");
    try {
      setEmails(await fetch("/api/triage", { method: "POST" }).then(json));
      setTriaged(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>Quietware<span>Mail</span></h1>
        <p className="sub">AI 收件箱降噪 · 自动分流 + 一句话摘要 ·
          <em> 演示用本地示例数据(未接真实邮箱)</em></p>
        {!triaged && <button className="triage" onClick={triage} disabled={busy}>{busy ? "AI 整理中…" : "🤖 让 AI 整理收件箱"}</button>}
        {err && <p className="err">⚠️ {err}</p>}
      </header>

      {!triaged ? (
        <ul className="inbox raw">
          {emails.map((e) => (
            <li key={e.id}>
              <span className="from">{e.from}</span>
              <span className="subj">{e.subject}</span>
            </li>
          ))}
        </ul>
      ) : (
        CATS.filter((cat) => emails.some((e) => e.category === cat)).map((cat) => (
          <section key={cat}>
            <h2 style={{ color: catColor[cat] }}>{cat}</h2>
            <ul className="inbox">
              {emails.filter((e) => e.category === cat).map((e) => (
                <li key={e.id}>
                  <div className="line">
                    <span className="from">{e.from}</span>
                    {e.needsReply && <span className="reply">待回复</span>}
                  </div>
                  <span className="subj">{e.subject}</span>
                  <span className="tldr">{e.tldr}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
