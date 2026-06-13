# Quietware Reader · 清净阅读

干净、AI 降噪、无广告的 RSS / 资讯阅读器。这是 Quietware 的**首选打穿品类**。

## 差异化

不只是"又一个 RSS 阅读器"——核心卖点是 **AI 降噪**:每条内容可一键让 Claude 给出
一句话摘要 + 要点 + **信噪比打分**,帮你在信息流里只看值得看的。这是开源做不好、
而我们能托管收费的部分。

## 技术

- 后端:Hono + `@quietware/core`(feed 抓取/解析 + Claude AI)
- 前端:React + Vite
- 同步:`MemoryStore`(自托管单机);云端跨端同步 = 替换为实现 `SyncStore` 的类

## 跑起来

```bash
# 在仓库根目录
pnpm install
cp .env.example .env   # 填 ANTHROPIC_API_KEY(不填也能跑,只是没 AI 降噪)
pnpm reader:dev        # 前端 http://localhost:5173  后端 http://localhost:8787
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/sources` | 列出订阅源 |
| POST | `/api/sources` | 添加源 `{ url }` |
| POST | `/api/opml` | 导入 OPML(请求体为 OPML 文本) |
| GET | `/api/items?sourceId=&unread=1` | 列出文章 |
| POST | `/api/items/:id/read` | 标记已读 `{ read }` |
| POST | `/api/items/:id/enrich` | AI 降噪(需 API key) |

## 状态

✅ MVP 可跑。待办:全文抓取、本地缓存、云同步、移动端(Capacitor 打包)。
