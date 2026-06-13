import type { FeedItem, FeedSource } from "../types.js";

/**
 * 同步层接口 —— 这是「托管收费」的落点。
 * 自托管用户用内存/本地实现;付费用户用我们的云端实现做跨端同步。
 * 产品代码只依赖接口,不关心背后是本地还是云。
 */
export interface SyncStore {
  listSources(): Promise<FeedSource[]>;
  addSource(source: FeedSource): Promise<void>;
  removeSource(sourceId: string): Promise<void>;

  upsertItems(items: FeedItem[]): Promise<void>;
  listItems(opts?: { sourceId?: string; unreadOnly?: boolean }): Promise<FeedItem[]>;
  markRead(itemId: string, read: boolean): Promise<void>;
}

/** 内存实现 —— 给 demo / 自托管单机用。 */
export class MemoryStore implements SyncStore {
  private sources = new Map<string, FeedSource>();
  private items = new Map<string, FeedItem>();

  async listSources() {
    return [...this.sources.values()];
  }
  async addSource(source: FeedSource) {
    this.sources.set(source.id, source);
  }
  async removeSource(sourceId: string) {
    this.sources.delete(sourceId);
    for (const [id, it] of this.items) if (it.sourceId === sourceId) this.items.delete(id);
  }
  async upsertItems(items: FeedItem[]) {
    for (const it of items) {
      const prev = this.items.get(it.id);
      this.items.set(it.id, { ...it, read: prev?.read ?? it.read ?? false });
    }
  }
  async listItems(opts: { sourceId?: string; unreadOnly?: boolean } = {}) {
    let arr = [...this.items.values()];
    if (opts.sourceId) arr = arr.filter((i) => i.sourceId === opts.sourceId);
    if (opts.unreadOnly) arr = arr.filter((i) => !i.read);
    return arr.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  async markRead(itemId: string, read: boolean) {
    const it = this.items.get(itemId);
    if (it) this.items.set(itemId, { ...it, read });
  }
}
