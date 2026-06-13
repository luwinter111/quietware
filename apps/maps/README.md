# Quietware Maps · 清净地图

基于 **OpenStreetMap** 的地点搜索:**无竞价排名、无推广**,纯按相关性返回结果。

## 为什么是这个形态(合规)
不与商业地图正面竞争、不抓它们的数据。用开放数据(OSM / Nominatim 搜索 + OSM 瓦片),
做一个干净、不被商业排名污染的搜索体验。

## 功能(✅ 可跑)
- 地点搜索(后端代理 Nominatim,带合规 User-Agent)
- Leaflet 地图展示 + 结果列表,点击定位

## 跑起来
```bash
pnpm --filter @quietware/maps dev   # web :5178  api :8792
```
> Nominatim 有使用频率限制,仅供低频个人使用;自部署可换自建实例。

## 待办
路线规划(OSRM)、POI 分类筛选、离线瓦片、自建 Nominatim 实例。
