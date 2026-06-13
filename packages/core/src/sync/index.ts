import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { FeedItem, FeedSource } from "../types.js";

/**
 * 同步层接口。产品代码只依赖接口,不关心背后是内存、本地文件还是(未来的)云端。
 * 现阶段免费、本地优先:用 MemoryStore(demo)或 FileStore(持久化)。
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

/**
 * 文件持久化实现 —— 订阅和文章存到一个 JSON 文件,跨重启不丢。
 * 本地优先、零依赖,免费产品默认用它。
 */
export class FileStore implements SyncStore {
  private mem = new MemoryStore();
  private loaded = false;

  constructor(private readonly path: string) {}

  private async load() {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.path, "utf8");
      const data = JSON.parse(raw) as { sources: FeedSource[]; items: FeedItem[] };
      for (const s of data.sources ?? []) await this.mem.addSource(s);
      await this.mem.upsertItems(data.items ?? []);
    } catch {
      // 文件不存在 = 首次运行,空状态即可。
    }
    this.loaded = true;
  }

  private async persist() {
    const sources = await this.mem.listSources();
    const items = await this.mem.listItems();
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify({ sources, items }, null, 2));
  }

  async listSources() {
    await this.load();
    return this.mem.listSources();
  }
  async addSource(source: FeedSource) {
    await this.load();
    await this.mem.addSource(source);
    await this.persist();
  }
  async removeSource(sourceId: string) {
    await this.load();
    await this.mem.removeSource(sourceId);
    await this.persist();
  }
  async upsertItems(items: FeedItem[]) {
    await this.load();
    await this.mem.upsertItems(items);
    await this.persist();
  }
  async listItems(opts: { sourceId?: string; unreadOnly?: boolean } = {}) {
    await this.load();
    return this.mem.listItems(opts);
  }
  async markRead(itemId: string, read: boolean) {
    await this.load();
    await this.mem.markRead(itemId, read);
    await this.persist();
  }
}
