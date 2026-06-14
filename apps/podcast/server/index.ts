/**
 * Quietware Podcast —— 后端 API。
 * 复用 @quietware/core 的 feed 引擎(它会自动识别播客 feed 的音频 enclosure)。
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchFeed, fetchMany, FileStore } from "@quietware/core";

const store = new FileStore(join(homedir(), ".quietware", "podcast.json"));

// 几个公开播客 feed,开箱即用。
const SEED = [
  "https://feeds.simplecast.com/54nAGcIl", // The Daily (NYT)
  "https://changelog.com/podcast/feed",
];

async function seed() {
  if ((await store.listSources()).length > 0) return;
  const { ok } = await fetchMany(SEED);
  for (const { source, items } of ok) {
    await store.addSource(source);
    await store.upsertItems(items);
  }
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

/** 列出订阅的节目。 */
app.get("/api/shows", async (c) => c.json(await store.listSources()));

/** 订阅一个播客 feed。 */
app.post("/api/shows", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "缺少 url" }, 400);
  try {
    const { source, items } = await fetchFeed(url);
    if (source.kind !== "podcast") {
      return c.json({ error: "这不像是播客 feed(没找到音频)" }, 400);
    }
    await store.addSource(source);
    await store.upsertItems(items);
    return c.json(source);
  } catch (e) {
    return c.json({ error: `订阅失败:${(e as Error).message}` }, 502);
  }
});

/** 取消订阅。 */
app.delete("/api/shows/:id", async (c) => {
  await store.removeSource(c.req.param("id"));
  return c.json({ ok: true });
});

/** 刷新所有节目。 */
app.post("/api/refresh", async (c) => {
  const sources = await store.listSources();
  const { ok } = await fetchMany(sources.map((s) => s.url));
  for (const { source, items } of ok) {
    await store.addSource(source);
    await store.upsertItems(items);
  }
  return c.json({ ok: true });
});

/** 列出单集(只返回有音频的)。 */
app.get("/api/episodes", async (c) => {
  const sourceId = c.req.query("showId");
  const items = await store.listItems({ sourceId });
  return c.json(items.filter((i) => i.audioUrl));
});

const port = Number(process.env.API_PORT ?? 8788);
serve({ fetch: app.fetch, port });
console.log(`🎧 Podcast API 已启动:http://localhost:${port}`);
seed().then(() => console.log("🌱 默认节目已就绪")).catch((e) => console.error("seed 失败", e));
