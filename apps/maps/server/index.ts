/**
 * Quietware Maps —— 后端。
 * 基于 OpenStreetMap Nominatim 的地点搜索:无竞价排名、无推广、按相关性返回。
 * 后端代理是为了:1) 带上 Nominatim 要求的 User-Agent;2) 不在前端暴露请求。
 * 遵守 Nominatim 使用政策(低频、注明来源)。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

/** 地点搜索。 */
app.get("/api/search", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "缺少查询 q" }, 400);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=10&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Quietware-Maps/0.1 (open-source ad-free maps; https://github.com/luwinter111/quietware)",
        Accept: "application/json",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return c.json({ error: `Nominatim HTTP ${res.status}` }, 502);
    const raw = (await res.json()) as any[];
    return c.json(
      raw.map((r) => ({
        name: r.display_name as string,
        category: (r.category ?? r.type) as string,
        lat: Number(r.lat),
        lon: Number(r.lon),
      })),
    );
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

const port = Number(process.env.API_PORT ?? 8792);
serve({ fetch: app.fetch, port });
console.log(`🗺️  Maps API 已启动:http://localhost:${port}`);
