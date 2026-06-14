# Quietware Tools · 清净工具

隐私优先、无广告的本地工具 + AI 文本助手。对标大陆工具类 App 的广告/隐私重灾区——
这里数据只在你机器上(`~/.quietware/tools-notes.json`),不上传、不偷。

## 功能(✅ 可跑)
- 本地速记:增/删/持久化
- AI 摘要:把长文压成一句话 + 要点(复用 `@quietware/core` 的 `summarizeText`)
- AI 整理:把杂乱速记整理成干净要点(`organizeText`)

## 跑起来
```bash
pnpm install
pnpm --filter @quietware/tools dev   # web :5175  api :8789
```
AI 功能需在根目录 `.env` 配 `ANTHROPIC_API_KEY`(不配也能用速记)。

## 待办
剪贴板历史、截图 OCR、桌面端(Tauri)打包。
