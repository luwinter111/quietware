/**
 * Quietware Shop —— 后端(诚实版)。
 *
 * ⚠️ 不扒电商、不做竞价排名、不接导购佣金。就是一个干净的「想买清单」:
 * 你手动记录想买的东西(标题/链接/心理价位/备注),本地持久化,不被推广打扰。
 * 这是这个品类在"无广告/不打扰"定位下站得住的最小形态。
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const FILE = join(homedir(), ".quietware", "shop.json");

interface Wish {
  id: string;
  title: string;
  url?: string;
  targetPrice?: number;
  note?: string;
  got: boolean;
  createdAt: string;
}

async function load(): Promise<Wish[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}
async function save(items: Wish[]) {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(items, null, 2));
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/items", async (c) => c.json(await load()));

app.post("/api/items", async (c) => {
  const b = await c.req.json<Partial<Wish>>();
  if (!b.title?.trim()) return c.json({ error: "缺少标题" }, 400);
  const items = await load();
  const wish: Wish = {
    id: Math.random().toString(36).slice(2, 10),
    title: b.title,
    url: b.url,
    targetPrice: b.targetPrice,
    note: b.note,
    got: false,
    createdAt: new Date().toISOString(),
  };
  items.unshift(wish);
  await save(items);
  return c.json(wish);
});

app.patch("/api/items/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await c.req.json<Partial<Wish>>();
  const items = await load();
  const i = items.findIndex((w) => w.id === id);
  if (i < 0) return c.json({ error: "未找到" }, 404);
  items[i] = { ...items[i], ...patch, id };
  await save(items);
  return c.json(items[i]);
});

app.delete("/api/items/:id", async (c) => {
  await save((await load()).filter((w) => w.id !== c.req.param("id")));
  return c.json({ ok: true });
});

const port = Number(process.env.API_PORT ?? 8794);
serve({ fetch: app.fetch, port });
console.log(`🛍️  Shop API 已启动:http://localhost:${port}`);
