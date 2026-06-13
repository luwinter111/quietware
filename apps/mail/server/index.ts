/**
 * Quietware Mail —— 后端(诚实版演示)。
 *
 * ⚠️ 这是用本地示例数据演示「AI 收件箱降噪」的核心价值,**没有接真实 IMAP/SMTP**。
 * 真实邮件接入(Gmail/Outlook API 或 IMAP)是后续工程;这里先把"AI 把收件箱分流 +
 * 一句话摘要 + 标记是否需回复"的体验做出来,验证产品价值。
 *
 * AI 降噪复用 @quietware/core 的 triageEmail。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { triageEmail, type EmailTriage } from "@quietware/core";

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
}

// 本地示例收件箱(模拟真实收件箱的杂乱:重要、通知、营销混在一起)。
const SAMPLE: Email[] = [
  { id: "1", from: "boss@company.com", subject: "明天 10 点季度评审,请准备数据", body: "Hi,明天上午十点会议室做 Q2 评审,麻烦把你负责模块的指标整理好发我。", receivedAt: "2026-06-13T09:12:00Z" },
  { id: "2", from: "noreply@shopping.com", subject: "🔥618 最后 3 小时!全场 5 折,错过等一年", body: "亲爱的用户,618 大促即将结束,海量爆款 5 折抢购,点击立即查看为你推荐的商品……", receivedAt: "2026-06-13T08:30:00Z" },
  { id: "3", from: "github@notifications.com", subject: "[quietware] PR #12 已被合并", body: "Your pull request 'add FileStore' was merged into main by luwinter111.", receivedAt: "2026-06-13T07:45:00Z" },
  { id: "4", from: "friend@gmail.com", subject: "周末一起爬山?", body: "周六天气不错,约几个人去香山,你来不?顺便聊聊你那个开源项目。", receivedAt: "2026-06-12T20:10:00Z" },
  { id: "5", from: "newsletter@medium.com", subject: "本周精选:10 篇你可能感兴趣的文章", body: "为你精选了本周热门文章,涵盖技术、设计、创业……点击阅读更多。", receivedAt: "2026-06-12T18:00:00Z" },
  { id: "6", from: "bank@icbc.com", subject: "您的信用卡账单已出", body: "尊敬的客户,您本期账单金额 ¥2,341.00,还款日 6 月 25 日,请及时还款。", receivedAt: "2026-06-12T10:00:00Z" },
];

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ai: !!process.env.ANTHROPIC_API_KEY }));

/** 原始收件箱。 */
app.get("/api/emails", (c) => c.json(SAMPLE));

/** AI 降噪:对全部邮件分类 + 摘要 + 是否需回复。 */
app.post("/api/triage", async (c) => {
  if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "未配置 ANTHROPIC_API_KEY" }, 400);
  try {
    const results = await Promise.all(
      SAMPLE.map(async (e) => {
        const t: EmailTriage = await triageEmail({ from: e.from, subject: e.subject, body: e.body });
        return { ...e, ...t };
      }),
    );
    return c.json(results);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

const port = Number(process.env.API_PORT ?? 8793);
serve({ fetch: app.fetch, port });
console.log(`✉️  Mail API 已启动:http://localhost:${port}`);
