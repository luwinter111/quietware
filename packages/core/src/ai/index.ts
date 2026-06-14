import Anthropic from "@anthropic-ai/sdk";
import type { AiEnrichment, FeedItem } from "../types.js";

/**
 * Quietware 的 AI 层 —— 这是产品的差异化核心:
 * 不只是给你 feed,而是帮你「降噪」——告诉你哪些值得读、一句话讲清楚。
 * 这部分有真实算力成本,是天然的收费点。
 */

const DEFAULT_MODEL = process.env.QUIETWARE_AI_MODEL ?? "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "缺少 ANTHROPIC_API_KEY。复制 .env.example 为 .env 并填入,或设置环境变量。",
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYSTEM = `你是一个信息降噪助手。用户被信息流和广告淹没,你帮他快速判断一条内容值不值得读。
针对给定文章,返回严格的 JSON,字段:
- tldr: 一句话摘要(中文,不超过 40 字)
- bullets: 2-4 条要点(中文,每条不超过 25 字)
- signalScore: 0-100 整数,这条内容的「信噪比/价值」,营销软文/标题党/空洞内容给低分
- reason: 一句话说明为什么给这个分(中文)
只返回 JSON,不要任何额外文字。`;

/** 对单条内容做 AI 摘要 + 降噪打分。 */
export async function enrichItem(item: FeedItem, model = DEFAULT_MODEL): Promise<AiEnrichment> {
  const body = stripHtml(item.content) || item.snippet || "";
  const text = `标题:${item.title}\n\n正文:${body.slice(0, 6000)}`;

  const resp = await getClient().messages.create({
    model,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
  });

  const raw = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const parsed = JSON.parse(json) as Omit<AiEnrichment, "itemId">;

  return {
    itemId: item.id,
    tldr: parsed.tldr,
    bullets: parsed.bullets ?? [],
    signalScore: Math.max(0, Math.min(100, Math.round(parsed.signalScore))),
    reason: parsed.reason ?? "",
  };
}

/** 通用:对任意文本做一次结构化 JSON 调用。 */
async function jsonCall<T>(system: string, user: string, model = DEFAULT_MODEL, maxTokens = 500): Promise<T> {
  const resp = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const raw = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json) as T;
}

export interface TextSummary {
  tldr: string;
  bullets: string[];
}

/** 对任意一段文本(网页正文、笔记等)做摘要。 */
export function summarizeText(text: string, model = DEFAULT_MODEL): Promise<TextSummary> {
  return jsonCall<TextSummary>(
    `你帮用户把长文压缩成要点。返回严格 JSON:{ "tldr": "一句话(中文,≤40字)", "bullets": ["要点(中文,≤25字)", ...2-5条] }。只返回 JSON。`,
    stripHtml(text).slice(0, 8000),
    model,
  );
}

export interface EmailTriage {
  category: "重要" | "通知" | "营销" | "社交" | "其他";
  tldr: string;
  needsReply: boolean;
}

/** 邮件收件箱降噪:分类 + 一句话摘要 + 是否需要回复。 */
export function triageEmail(
  email: { subject: string; from: string; body: string },
  model = DEFAULT_MODEL,
): Promise<EmailTriage> {
  return jsonCall<EmailTriage>(
    `你是邮件收件箱降噪助手。给定一封邮件,返回严格 JSON:
{ "category": "重要|通知|营销|社交|其他", "tldr": "一句话摘要(中文,≤30字)", "needsReply": true/false }。
营销/推广邮件归为"营销"。只返回 JSON。`,
    `发件人:${email.from}\n主题:${email.subject}\n正文:${stripHtml(email.body).slice(0, 4000)}`,
    model,
  );
}

/** 文本整理:把杂乱的速记/剪贴内容整理成干净要点。 */
export async function organizeText(text: string, model = DEFAULT_MODEL): Promise<string> {
  const resp = await getClient().messages.create({
    model,
    max_tokens: 800,
    system: "你帮用户把杂乱的文字整理干净:去口水、分点、保留信息。直接返回整理后的中文文本,不要解释。",
    messages: [{ role: "user", content: text.slice(0, 8000) }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** 批量降噪,带并发上限。 */
export async function enrichMany(
  items: FeedItem[],
  opts: { model?: string; concurrency?: number } = {},
): Promise<AiEnrichment[]> {
  const { model = DEFAULT_MODEL, concurrency = 4 } = opts;
  const out: AiEnrichment[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map((it) => enrichItem(it, model)));
    for (const r of results) if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}
