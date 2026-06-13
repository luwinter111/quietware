import Parser from "rss-parser";
import { createHash } from "node:crypto";
import type { FeedItem, FeedSource } from "../types.js";

type CustomItem = {
  enclosure?: { url?: string; length?: string; type?: string };
  itunes?: { duration?: string };
};

const parser: Parser<{}, CustomItem> = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Quietware/0.1 (+https://github.com)" },
});

function hash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 16);
}

/** 把 itunes duration("HH:MM:SS" 或秒数)转成秒。 */
function parseDuration(raw?: string): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/**
 * 抓取并解析一个 feed(RSS / Atom / 播客)。
 * 自动判断是文章源还是播客源(看有没有音频 enclosure)。
 */
export async function fetchFeed(url: string): Promise<{ source: FeedSource; items: FeedItem[] }> {
  const feed = await parser.parseURL(url);
  const sourceId = hash(url);

  const items: FeedItem[] = (feed.items ?? []).map((it) => {
    const audioUrl =
      it.enclosure?.type?.startsWith("audio") || /\.(mp3|m4a|aac|ogg)(\?|$)/i.test(it.enclosure?.url ?? "")
        ? it.enclosure?.url
        : undefined;
    return {
      id: hash((it.guid ?? it.link ?? it.title ?? "") + sourceId),
      sourceId,
      title: it.title ?? "(无标题)",
      link: it.link,
      author: (it as any).creator ?? (it as any).author,
      content: (it as any)["content:encoded"] ?? it.content,
      snippet: it.contentSnippet,
      publishedAt: it.isoDate,
      audioUrl,
      durationSec: parseDuration(it.itunes?.duration),
    };
  });

  const isPodcast = items.some((i) => i.audioUrl);

  const source: FeedSource = {
    id: sourceId,
    url,
    title: feed.title ?? url,
    description: feed.description,
    link: feed.link,
    kind: isPodcast ? "podcast" : "article",
    lastFetchedAt: new Date().toISOString(),
  };

  return { source, items };
}

/** 并发抓取多个 feed,单个失败不影响其他。 */
export async function fetchMany(urls: string[]): Promise<{
  ok: { source: FeedSource; items: FeedItem[] }[];
  failed: { url: string; error: string }[];
}> {
  const results = await Promise.allSettled(urls.map(fetchFeed));
  const ok: { source: FeedSource; items: FeedItem[] }[] = [];
  const failed: { url: string; error: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(r.value);
    else failed.push({ url: urls[i], error: String(r.reason?.message ?? r.reason) });
  });
  return { ok, failed };
}

/** 极简 OPML 解析:从导出文件里抽出所有 feed url。 */
export function parseOpml(opml: string): string[] {
  const urls: string[] = [];
  const re = /xmlUrl="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(opml))) urls.push(m[1]);
  return urls;
}
