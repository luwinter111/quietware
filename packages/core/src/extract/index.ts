/**
 * 轻量正文提取 —— 给一个网页 URL,抓回来并尽量只留下「正文」。
 * 零重依赖(不引 jsdom/readability),用启发式:优先 <article>,否则取最长文本块。
 * 够 MVP 用;以后要更准可换 @mozilla/readability。
 */

export interface Article {
  url: string;
  title: string;
  text: string;
  html: string;
  byline?: string;
  wordCount: number;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTitle(html: string): string {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return decodeEntities(og[1]);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return decodeEntities(stripTags(h1[1]));
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? decodeEntities(stripTags(t[1])) : "(无标题)";
}

/** 抓取并提取一篇文章的正文。 */
export async function extractArticle(url: string): Promise<Article> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Quietware/0.1 (clean reader)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`抓取失败:HTTP ${res.status}`);
  const html = await res.text();

  const title = pickTitle(html);
  const byline =
    html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)?.[1];

  // 优先 <article>;否则在所有 <p> 聚合里取正文。
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  let bodyHtml = articleMatch?.[0];
  if (!bodyHtml || stripTags(bodyHtml).length < 200) {
    const paras = [...html.matchAll(/<p[\s\S]*?<\/p>/gi)].map((m) => m[0]);
    bodyHtml = paras.join("\n");
  }

  const text = decodeEntities(stripTags(bodyHtml));
  return {
    url,
    title,
    byline: byline ? decodeEntities(byline) : undefined,
    html: bodyHtml,
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}
