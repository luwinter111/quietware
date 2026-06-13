/**
 * @quietware/core — 共享引擎
 *
 * 所有 Quietware 产品共用的地基:
 *  - feed:抓取/解析 RSS、Atom、播客 feed
 *  - ai:接 Claude 做摘要 + 信息降噪打分(差异化 & 收费核心)
 *  - sync:同步层接口(自托管 vs 云端托管)
 */
export * from "./types.js";
export { fetchFeed, fetchMany, parseOpml } from "./feed/index.js";
export { enrichItem, enrichMany } from "./ai/index.js";
export { type SyncStore, MemoryStore } from "./sync/index.js";
