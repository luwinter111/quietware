/**
 * @quietware/core — 共享引擎
 *
 * 所有 Quietware 产品共用的地基:
 *  - feed:抓取/解析 RSS、Atom、播客 feed
 *  - extract:网页正文/可读性提取
 *  - ai:接 Claude 做摘要 / 降噪 / 邮件分类 / 文本整理(差异化核心)
 *  - sync:本地优先的持久化(内存 / 文件),接口可扩展到云端
 */
export * from "./types.js";
export { fetchFeed, fetchMany, parseOpml } from "./feed/index.js";
export { extractArticle, type Article } from "./extract/index.js";
export {
  enrichItem,
  enrichMany,
  summarizeText,
  triageEmail,
  organizeText,
  type TextSummary,
  type EmailTriage,
} from "./ai/index.js";
export { type SyncStore, MemoryStore, FileStore } from "./sync/index.js";
