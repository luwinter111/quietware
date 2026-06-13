/**
 * Quietware Tools —— 后端。
 * 本地速记(持久化到 ~/.quietware)+ AI 文本助手(摘要/整理,复用 core.ai)。
 * 数据全在本地,不上传、无广告。
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { summarizeText, organizeText } from "@quietware/core";

const FILE = join(homedir(), ".quietware", "tools-notes.json");

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

async function load(): Promise<Note[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}
async function save(notes: Note[]) {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(notes, null, 2));
}

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ai: !!process.env.ANTHROPIC_API_KEY }));

app.get("/api/notes", async (c) => c.json(await load()));

app.post("/api/notes", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text?.trim()) return c.json({ error: "空内容" }, 400);
  const notes = await load();
  const note: Note = { id: Math.random().toString(36).slice(2, 10), text, createdAt: new Date().toISOString() };
  notes.unshift(note);
  await save(notes);
  return c.json(note);
});

app.delete("/api/notes/:id", async (c) => {
  const notes = (await load()).filter((n) => n.id !== c.req.param("id"));
  await save(notes);
  return c.json({ ok: true });
});

/** AI:摘要一段文本。 */
app.post("/api/ai/summarize", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "未配置 ANTHROPIC_API_KEY" }, 400);
  try {
    return c.json(await summarizeText(text));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

/** AI:整理杂乱文本。 */
app.post("/api/ai/organize", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "未配置 ANTHROPIC_API_KEY" }, 400);
  try {
    return c.json({ result: await organizeText(text) });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

const port = Number(process.env.API_PORT ?? 8789);
serve({ fetch: app.fetch, port });
console.log(`🧰 Tools API 已启动:http://localhost:${port}`);
