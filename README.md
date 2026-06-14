# Quietware · 清净

> **一套引擎,养一窝「不被打扰」的开源替代产品。**
> A shared AI-feed engine powering a family of open-source, ad-free alternatives.

主流产品把广告硬塞进体验里。Quietware 反过来:把广告绕开,做一层干净的产品,
**全部开源、免费、本地优先**。我们卖的不是功能,是**注意力的主权**——清净本身就是价值。

> 现阶段目标:**先把东西做好、做免费、打影响力**,不急着商业化。
> 可持续的事(可选的云同步等)是以后的话题,见文末。

## 这是什么

一个 monorepo。底层是共享引擎 `@quietware/core`(feed 抓取/解析 + 正文提取 + 接 Claude 做 AI 摘要/降噪 + 本地持久化),上层是一窝复用它的产品。每个产品在 `apps/` 下**独立可跑**。

```
quietware/
├── packages/
│   └── core/          # 共享引擎:feed + extract + AI + 本地持久化
└── apps/
    ├── reader/        # RSS / 资讯阅读器(AI 降噪)
    ├── podcast/       # 无广告播客客户端(倍速/章节)
    ├── tools/         # 隐私优先本地工具 + AI 文本助手
    ├── browser/       # 「清净阅读」:粘贴链接→干净正文+AI 摘要
    ├── video/         # 订阅更新流(频道 RSS,无算法推荐)
    ├── maps/          # OpenStreetMap 无竞价排名地点搜索
    ├── mail/          # AI 收件箱降噪(当前示例数据演示)
    └── shop/          # 干净的想买清单(不扒电商)
```

## 产品状态

| 产品 | 状态 | 说明 |
|---|:--:|---|
| core | ✅ | feed/extract/AI/持久化,已测 |
| reader | ✅ | 订阅/OPML/刷新/删除/AI 降噪,后端已测 |
| podcast | ✅ | 订阅/播放/倍速,音频识别已测 |
| tools | ✅ | 速记 CRUD + AI 摘要/整理,已测 |
| browser | ✅ | 正文提取已测(example.com 17 词) |
| video | ✅ | 订阅/刷新/视频流已测(YouTube 需畅通网络) |
| maps | ✅* | 代码+类型通过;Nominatim 上游本地可用(测试环境对 node 限流) |
| mail | ✅ | 示例收件箱 + AI 分流;真实 IMAP 接入待做 |
| shop | ✅ | 想买清单 CRUD + 持久化,已测 |

> 注:涉及 AI 的功能(降噪/摘要/整理/邮件分流)需配 `ANTHROPIC_API_KEY` 才生效;
> 不配时自动优雅降级(其余功能照常用)。前端界面需本地 `dev` 起来在浏览器查看。

## 快速开始

```bash
# 前置:Node >= 20、pnpm
pnpm install

# (可选)配置 Claude API key,启用 AI 功能
cp .env.example .env   # 填入 ANTHROPIC_API_KEY

# 跑 core 引擎 demo(抓真实 feed → 解析 → AI 摘要)
pnpm core:demo

# 跑任意产品(各自独立端口)
pnpm reader:dev                      # RSS 阅读器
pnpm podcast:dev                     # 播客
pnpm --filter @quietware/tools dev   # 工具
pnpm --filter @quietware/browser dev # 清净阅读
pnpm --filter @quietware/video dev   # 视频订阅
pnpm --filter @quietware/maps dev    # 地图
pnpm --filter @quietware/mail dev    # 邮件
pnpm --filter @quietware/shop dev    # 想买清单
```

数据默认存在本地 `~/.quietware/`,不上传任何服务器。

## 路线

1. **打磨现有 8 个产品**,做免费、好用,积累口碑与用户。
2. 真实接入待补:mail 的 IMAP、video 的频道解析、maps 自建 Nominatim。
3. 移动端:Web 跑顺后用 Capacitor 打包。

## 关于「可持续」(以后再说)

现在不做收费。等产品真有人用了,可持续的方式也是**不打扰用户**的:核心永远开源免费、
本地优先;只有可选的云同步、托管 AI 这类有真实成本的增值能力,未来才考虑订阅。
绝不靠广告。

## License

[AGPL-3.0](LICENSE) — 开源,且禁止他人拿去做闭源 SaaS。这保证产品永远属于社区。
完整品类调研见 [品类调研文档](品类调研-去广告开源订阅产品.md)。
