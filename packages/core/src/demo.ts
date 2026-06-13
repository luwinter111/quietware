/**
 * core 引擎 demo —— 证明整条链路能跑通:
 *   抓真实 feed → 解析 → 存入同步层 →(有 key 时)AI 降噪
 *
 * 跑法:  pnpm core:demo
 */
import { fetchFeed, enrichItem, MemoryStore } from "./index.js";

const DEMO_FEEDS = [
  "https://hnrss.org/frontpage", // Hacker News 头版
];

async function main() {
  const store = new MemoryStore();

  for (const url of DEMO_FEEDS) {
    console.log(`\n⏬  抓取 ${url}`);
    const { source, items } = await fetchFeed(url);
    await store.addSource(source);
    await store.upsertItems(items);
    console.log(`✅  ${source.title} —— ${items.length} 条(类型:${source.kind})`);
  }

  const items = await store.listItems();
  console.log(`\n📰  最新 5 条:`);
  for (const it of items.slice(0, 5)) {
    console.log(`   • ${it.title}`);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const first = items[0];
    console.log(`\n🤖  对第一条做 AI 降噪:「${first.title}」`);
    const e = await enrichItem(first);
    console.log(`   TL;DR : ${e.tldr}`);
    console.log(`   要点  : ${e.bullets.join(" / ")}`);
    console.log(`   信噪比: ${e.signalScore}/100 —— ${e.reason}`);
  } else {
    console.log(`\nℹ️  未设置 ANTHROPIC_API_KEY,跳过 AI 降噪。`);
    console.log(`   设置后再跑一次,即可看到 Claude 的摘要 + 信噪比打分。`);
  }

  console.log(`\n✨  core 引擎链路跑通。`);
}

main().catch((err) => {
  console.error("❌ demo 失败:", err.message);
  process.exit(1);
});
