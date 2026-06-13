/** Quietware 核心数据模型 —— 所有产品共享。 */

/** 一个订阅源(RSS / Atom / 播客 feed)。 */
export interface FeedSource {
  /** 稳定 id(通常是 feed url 的 hash 或 url 本身)。 */
  id: string;
  /** feed 的 URL。 */
  url: string;
  /** 站点/节目标题。 */
  title: string;
  /** 描述。 */
  description?: string;
  /** 站点主页。 */
  link?: string;
  /** 是否为播客(含音频 enclosure)。 */
  kind: "article" | "podcast";
  /** 最后抓取时间(ISO)。 */
  lastFetchedAt?: string;
}

/** feed 里的一条内容(文章或单集播客)。 */
export interface FeedItem {
  id: string;
  sourceId: string;
  title: string;
  link?: string;
  author?: string;
  /** 正文(HTML 或纯文本)。 */
  content?: string;
  /** 摘要片段(原始)。 */
  snippet?: string;
  /** 发布时间(ISO)。 */
  publishedAt?: string;
  /** 播客音频地址。 */
  audioUrl?: string;
  /** 播客时长(秒)。 */
  durationSec?: number;
  /** 已读状态(同步层维护)。 */
  read?: boolean;
}

/** AI 处理后的增强信息。 */
export interface AiEnrichment {
  itemId: string;
  /** 一句话摘要。 */
  tldr: string;
  /** 要点列表。 */
  bullets: string[];
  /** 降噪后的「值不值得读」判断:0-100,越高越值得。 */
  signalScore: number;
  /** 模型给出的理由。 */
  reason: string;
}
