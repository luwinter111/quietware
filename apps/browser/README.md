# Quietware Read · 清净阅读层

粘贴任意网页链接 → 抓回来提取**干净正文**(去广告、去弹窗、去信息流),可选 AI 摘要。

这是"用户侧干净前端层"的最小、合规形态:**不重建别人的内容后端、不批量抓取**,
只在你主动请求某一页时净化它。可作为引流入口,也能和 [Reader](../reader) 打通。

## 功能(✅ 可跑)
- 正文提取(`@quietware/core` 的 `extractArticle`,启发式可读性)
- AI 摘要(`summarizeText`)

## 跑起来
```bash
pnpm --filter @quietware/browser dev   # web :5176  api :8790
```

## 待办
更准的正文提取(可换 @mozilla/readability)、浏览器扩展形态、稍后读、与 Reader 同步。
