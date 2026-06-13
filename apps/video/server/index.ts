/**
 * Quietware Video —— 后端。
 * 干净的"订阅更新流":用频道公开 RSS(YouTube 频道 feed:
 *   https://www.youtube.com/feeds/videos.xml?channel_id=XXXX )
 * 只聚合你订阅频道的新视频,无算法推荐、无广告。点击跳转到原平台观看。
 * 复用 @quietware/core 的 feed 引擎(视频 feed 本质也是 RSS)。
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchFeed, fetchMany, FileStore } from "@quietware/core";

const store = new FileStore(join(homedir(), ".quietware", "video.json"));

/** 把 YouTube 视频链接转成缩略图 URL。 */
function thumb(link?: string): string | undefined {
  const id = link?.match(/[?&]v=([\w-]+)/)?.[1] ?? link?.match(/youtu\.be\/([\w-]+)/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : undefined;
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/channels", async (c) => c.json(await store.listSources()));

app.post("/api/channels", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "缺少频道 feed url" }, 400);
  try {
    const { source, items } = await fetchFeed(url);
    await store.addSource(source);
    await store.upsertItems(items);
    return c.json(source);
  } catch (e) {
    return c.json({ error: `订阅失败:${(e as Error).message}` }, 502);
  }
});

app.delete("/api/channels/:id", async (c) => {
  await store.removeSource(c.req.param("id"));
  return c.json({ ok: true });
});

app.post("/api/refresh", async (c) => {
  const sources = await store.listSources();
  const { ok } = await fetchMany(sources.map((s) => s.url));
  for (const { source, items } of ok) {
    await store.addSource(source);
    await store.upsertItems(items);
  }
  return c.json({ ok: true });
});

/** 最新视频流(跨所有订阅,按时间倒序)。 */
app.get("/api/videos", async (c) => {
  const channelId = c.req.query("channelId");
  const items = await store.listItems({ sourceId: channelId });
  const sources = await store.listSources();
  const nameOf = new Map(sources.map((s) => [s.id, s.title]));
  return c.json(
    items.map((it) => ({
      id: it.id,
      title: it.title,
      link: it.link,
      channel: nameOf.get(it.sourceId) ?? "",
      publishedAt: it.publishedAt,
      thumb: thumb(it.link),
    })),
  );
});

const port = Number(process.env.API_PORT ?? 8791);
serve({ fetch: app.fetch, port });
console.log(`📺 Video API 已启动:http://localhost:${port}`);
