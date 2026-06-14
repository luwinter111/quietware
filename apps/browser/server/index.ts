/**
 * Quietware Read —— 后端。
 * 给一个网页 URL,抓回来提取干净正文(去广告/去杂物),可选 AI 摘要。
 * 这是"用户侧干净前端层"的最小形态:不重建别人后端,只在你请求时净化单页。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { extractArticle, summarizeText } from "@quietware/core";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ai: !!process.env.ANTHROPIC_API_KEY }));

/** 抓取并提取正文。 */
app.post("/api/read", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "缺少 url" }, 400);
  try {
    const article = await extractArticle(url);
    return c.json(article);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

/** 对正文做 AI 摘要。 */
app.post("/api/summarize", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "未配置 ANTHROPIC_API_KEY" }, 400);
  try {
    return c.json(await summarizeText(text));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

const port = Number(process.env.API_PORT ?? 8790);
serve({ fetch: app.fetch, port });
console.log(`📖 Read API 已启动:http://localhost:${port}`);
