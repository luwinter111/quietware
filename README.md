# Quietware · 清净

> **一套引擎,养一窝「不被打扰」的开源替代产品。**
> A shared AI-feed engine powering a family of open-source, ad-free alternatives.

主流产品把广告硬塞进体验里。Quietware 反过来:把广告绕开,做一层干净的产品,
核心**开源**建立信任与竞争力,用**托管同步 + AI 能力**养活产品。我们卖的不是功能,
是**注意力的主权**——清净本身就是付费理由。

## 这是什么

一个 monorepo。底层是共享引擎 `@quietware/core`(feed 抓取 / 同步 / 接 Claude 做 AI 摘要降噪),
上层是一窝复用它的产品。每个产品在 `apps/` 下**独立可跑、可单独商业化**,跑出来的随时能拆成独立仓库。

```
quietware/
├── packages/
│   └── core/          # 共享引擎:feed + sync + Claude AI(✅ 已实现)
└── apps/
    ├── reader/        # RSS / 资讯阅读器        ✅ MVP
    ├── podcast/       # 播客客户端              ✅ MVP
    ├── tools/         # 输入法 / 工具类(隐私+无广告) 🏗️ 骨架
    ├── browser/       # 浏览器去广告 / 干净前端   🏗️ 骨架
    ├── mail/          # 邮件客户端              🏗️ 骨架
    ├── video/         # 视频客户端              🏗️ 骨架
    ├── maps/          # 地图 / 本地生活          🏗️ 骨架
    └── shop/          # 电商 / 比价             🏗️ 骨架
```

> ✅ = 真能跑的 MVP。🏗️ = 结构完整的脚手架 + 立项说明,等待填充。
> 这是有意为之:RSS 和播客共享同一 feed 引擎,先把它们打穿验证;其余 6 个先立项占位,按验证结果逐个推进。

## 商业模式

| 层 | 开源 | 收费 |
|---|:--:|:--:|
| 客户端 / 核心引擎 | ✅ | 免费 |
| 云同步 / 跨端 | ❌ | 💰 订阅 |
| AI 摘要 / 降噪 / 全文搜索 | 部分 | 💰 订阅 |
| 自托管版本 | ✅ | 免费 |

参考范本:Bitwarden、Obsidian、Overcast。完整调研见
[品类调研文档](品类调研-去广告开源订阅产品.md)。

## 快速开始

```bash
# 前置:Node >= 20、pnpm
pnpm install

# 配置 Claude API key(AI 摘要用)
cp .env.example .env   # 然后填入 ANTHROPIC_API_KEY

# 跑 core 引擎 demo(抓真实 feed → 解析 → AI 摘要)
pnpm core:demo

# 跑 RSS 阅读器 / 播客客户端
pnpm reader:dev
pnpm podcast:dev
```

## 路线

1. **打穿 RSS 阅读器**(痛点深 × 可做性高 × 风险低,三项最优)。
2. **复用引擎扩到播客**(同一套 feed 底座,边际成本极低)。
3. 按验证结果,逐个推进其余品类。**避坑:视频/地图/电商 早期不碰**(版权/反爬/数据壁垒)。

## License

[AGPL-3.0](LICENSE) — 开源,但禁止拿去做闭源 SaaS 白嫖。这是「开源 + 托管收费」模式的护城河。
