/**
 * Quietware Reader —— 后端 API。
 * 用 @quietware/core 抓取/解析 feed,并(可选)用 Claude 做 AI 降噪。
 * 同步层用内存实现;接入云端只需替换为实现了 SyncStore 的类。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  fetchFeed,
  fetchMany,
  parseOpml,
  enrichItem,
  MemoryStore,
  type AiEnrichment,
} from "@quietware/core";

const store = new MemoryStore();
const enrichmentCache = new Map<string, AiEnrichment>();

// 首次启动塞几个默认源,开箱即用。
const SEED = ["https://hnrss.org/frontpage", "https://www.ruanyifeng.com/blog/atom.xml"];

async function seed() {
  const { ok } = await fetchMany(SEED);
  for (const { source, items } of ok) {
    await store.addSource(source);
    await store.upsertItems(items);
  }
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

/** 列出所有订阅源。 */
app.get("/api/sources", async (c) => c.json(await store.listSources()));

/** 添加一个订阅源。 */
app.post("/api/sources", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "缺少 url" }, 400);
  try {
    const { source, items } = await fetchFeed(url);
    await store.addSource(source);
    await store.upsertItems(items);
    return c.json(source);
  } catch (e) {
    return c.json({ error: `抓取失败:${(e as Error).message}` }, 502);
  }
});

/** 导入 OPML。 */
app.post("/api/opml", async (c) => {
  const opml = await c.req.text();
  const urls = parseOpml(opml);
  const { ok, failed } = await fetchMany(urls);
  for (const { source, items } of ok) {
    await store.addSource(source);
    await store.upsertItems(items);
  }
  return c.json({ added: ok.length, failed });
});

/** 列出文章(可按源、未读过滤)。 */
app.get("/api/items", async (c) => {
  const sourceId = c.req.query("sourceId");
  const unreadOnly = c.req.query("unread") === "1";
  return c.json(await store.listItems({ sourceId, unreadOnly }));
});

/** 标记已读/未读。 */
app.post("/api/items/:id/read", async (c) => {
  const id = c.req.param("id");
  const { read } = await c.req.json<{ read: boolean }>();
  await store.markRead(id, read);
  return c.json({ ok: true });
});

/** 对一条做 AI 降噪(带缓存,省 token)。 */
app.post("/api/items/:id/enrich", async (c) => {
  const id = c.req.param("id");
  if (enrichmentCache.has(id)) return c.json(enrichmentCache.get(id));
  const items = await store.listItems();
  const item = items.find((i) => i.id === id);
  if (!item) return c.json({ error: "未找到" }, 404);
  if (!process.env.ANTHROPIC_API_KEY) {
    return c.json({ error: "未配置 ANTHROPIC_API_KEY,AI 降噪不可用" }, 400);
  }
  try {
    const e = await enrichItem(item);
    enrichmentCache.set(id, e);
    return c.json(e);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

const port = Number(process.env.API_PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`📡 Reader API 已启动:http://localhost:${port}`);
// 先监听再后台填充默认源,避免启动阻塞。
seed().then(() => console.log("🌱 默认源已就绪")).catch((e) => console.error("seed 失败", e));
