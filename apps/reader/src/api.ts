import type { FeedItem, FeedSource, AiEnrichment } from "@quietware/core";

const json = (r: Response) => {
  if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.error ?? r.statusText)));
  return r.json();
};

export const api = {
  sources: (): Promise<FeedSource[]> => fetch("/api/sources").then(json),
  items: (opts: { sourceId?: string; unread?: boolean } = {}): Promise<FeedItem[]> => {
    const q = new URLSearchParams();
    if (opts.sourceId) q.set("sourceId", opts.sourceId);
    if (opts.unread) q.set("unread", "1");
    return fetch(`/api/items?${q}`).then(json);
  },
  addSource: (url: string): Promise<FeedSource> =>
    fetch("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    }).then(json),
  markRead: (id: string, read: boolean): Promise<void> =>
    fetch(`/api/items/${id}/read`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ read }),
    }).then(json),
  enrich: (id: string): Promise<AiEnrichment> =>
    fetch(`/api/items/${id}/enrich`, { method: "POST" }).then(json),
  removeSource: (id: string): Promise<void> =>
    fetch(`/api/sources/${id}`, { method: "DELETE" }).then(json),
  refresh: (): Promise<{ items: number }> =>
    fetch("/api/refresh", { method: "POST" }).then(json),
  importOpml: (opml: string): Promise<{ added: number }> =>
    fetch("/api/opml", { method: "POST", body: opml }).then(json),
};
