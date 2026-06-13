# Quietware Video · 清净订阅

干净的视频**订阅更新流**:只聚合你订阅频道的新视频,**无推荐算法、无广告、不刷信息流**。
点击跳转回原平台观看。

## 为什么是这个形态(合规)
不重新托管、不扒流、不去广告播放别人的内容——那是版权红线。我们只用频道的**公开 RSS**
(YouTube 每个频道都提供 `https://www.youtube.com/feeds/videos.xml?channel_id=…`),
把"算法投喂"换成"你自己选的订阅"。复用 `@quietware/core` 的 feed 引擎。

## 功能(✅ 可跑)
- 订阅频道 RSS、删除、刷新
- 跨频道的最新视频流(网格 + 缩略图),点击跳转观看

## 跑起来
```bash
pnpm --filter @quietware/video dev   # web :5177  api :8791
```
> 注:YouTube feed 在部分网络环境可能需代理才能抓取。

## 待办
频道 ID 自动解析(从频道主页 URL)、已看标记、与 Reader 统一订阅。
