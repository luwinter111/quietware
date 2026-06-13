# Quietware Podcast · 清净播客

无广告播客客户端。**复用和 Reader 完全相同的 `@quietware/core` feed 引擎**——
这就是"一套引擎,两个产品"的杠杆:播客本质也是 RSS feed,core 会自动识别音频 enclosure。

## 跑起来

```bash
pnpm install
pnpm podcast:dev   # 前端 http://localhost:5174  后端 http://localhost:8788
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/shows` | 订阅的节目 |
| POST | `/api/shows` | 订阅 `{ url }`(非播客 feed 会被拒绝) |
| GET | `/api/episodes?showId=` | 单集列表(仅含音频) |

## 状态

✅ MVP 可跑:订阅、单集列表、内置播放器、章节信息(时长)。
待办:播放进度跨端同步(收费点)、倍速、跳过片头、下载离线。
