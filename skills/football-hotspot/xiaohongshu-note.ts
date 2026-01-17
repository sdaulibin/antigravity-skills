/**
 * Xiaohongshu Note Generator
 * 为 Top 10 足球话题生成小红书风格的笔记内容
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzedTopic } from './analyzer';

// 获取 Gemini 客户端
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface XiaohongshuNote {
  topicRank: number;
  title: string;           // 带 emoji 的吸引性标题
  content: string;         // 正文内容
  tags: string[];          // 话题标签 #xxx
  callToAction: string;    // 互动引导
  estimatedReadTime: string; // 预估阅读时间
}

/**
 * 使用 AI 生成小红书笔记
 */
export async function generateXiaohongshuNotes(topics: AnalyzedTopic[]): Promise<XiaohongshuNote[]> {
  const client = getGeminiClient();
  
  if (!client) {
    console.log('📝 使用模板生成小红书笔记...');
    return generateTemplateNotes(topics);
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    console.log(`📝 使用 AI 生成小红书风格笔记 (模型: ${modelName})...`);
    
    const model = client.getGenerativeModel({ model: modelName });

    const topicsList = topics.slice(0, 10).map((t, i) => 
      `${i + 1}. ${t.title}\n   摘要: ${t.summary}\n   分类: ${t.category}`
    ).join('\n\n');

    const prompt = `你是一位拥有百万粉丝的小红书足球博主。请为以下足球热点话题生成小红书风格的笔记。

## 小红书爆款笔记特点:
1. 标题：使用 emoji + 吸睛词（震惊/绝绝子/太顶了/必看）+ 核心信息
2. 正文：
   - 开头抓眼球，引发共鸣
   - 分段清晰，每段 2-3 句
   - 使用 emoji 分隔不同观点
   - 口语化表达，像朋友聊天
   - 200-300 字为佳
3. 标签：5-8 个相关话题标签
4. 互动引导：引导评论/点赞/收藏

## 需要生成笔记的话题:
${topicsList}

请用 JSON 格式输出（不要 markdown 代码块）：
[
  {
    "topicRank": 1,
    "title": "🔥震惊！xxx竟然xxx｜球迷必看",
    "content": "正文内容...",
    "tags": ["足球", "xxx", "xxx"],
    "callToAction": "你们觉得呢？评论区告诉我👇"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      
      return parsed.map((item: any, index: number) => ({
        ...item,
        topicRank: index + 1,
        estimatedReadTime: '1-2分钟'
      }));

    } catch {
      console.warn('⚠️ AI 生成解析失败，使用模板');
      return generateTemplateNotes(topics);
    }

  } catch (error: any) {
    console.error('❌ AI 生成失败:', error.message);
    return generateTemplateNotes(topics);
  }
}

/**
 * 模板生成笔记（无需 AI）
 */
function generateTemplateNotes(topics: AnalyzedTopic[]): XiaohongshuNote[] {
  const emojis = ['⚽', '🔥', '💯', '🏆', '✨', '👀', '😱', '🎯', '💪', '🌟'];
  const hooks = ['震惊！', '绝了！', '太顶了！', '必看！', '重磅！', '独家！', '速看！', '球迷必看！'];
  const ctas = [
    '你们怎么看？评论区聊聊👇',
    '点赞收藏，持续更新足球热点🔥',
    '关注我，每天带你追最新球事⚽',
    '同意的点个赞，不同意的评论区battle👊',
    '你支持谁？评论区告诉我👇'
  ];

  return topics.slice(0, 10).map((topic, index) => {
    const emoji = emojis[index % emojis.length];
    const hook = hooks[index % hooks.length];
    const cta = ctas[index % ctas.length];

    const title = `${emoji}${hook}${topic.title}`;
    
    const content = `${emoji} ${hook}

${topic.summary}

📌 关键信息
这件事为什么重要？因为它直接影响了整个足球圈的走向！

💭 我的看法
作为资深球迷，我觉得这件事情值得大家关注。无论你支持哪支球队，都应该了解这个动态。

${emoji} 后续发展
让我们持续关注，看看接下来会有什么新进展！

${cta}`;

    const tags = generateTags(topic);

    return {
      topicRank: index + 1,
      title,
      content,
      tags,
      callToAction: cta,
      estimatedReadTime: '1分钟'
    };
  });
}

/**
 * 根据话题生成标签
 */
function generateTags(topic: AnalyzedTopic): string[] {
  const baseTags = ['足球', '球迷日常', '体育热点'];
  const categoryTags: Record<string, string[]> = {
    '转会': ['转会窗', '足球转会', '球员动态'],
    '比赛': ['比赛集锦', '进球瞬间', '足球比赛'],
    '球员动态': ['球星生活', '足坛八卦', '球员日常'],
    '荣誉': ['冠军时刻', '足球荣誉', '颁奖典礼'],
    '争议': ['足球争议', 'VAR', '裁判判罚'],
    '其他': ['足球资讯', '球坛热议']
  };

  const extraTags = categoryTags[topic.category] || categoryTags['其他'];
  return [...baseTags, ...extraTags].slice(0, 8);
}

/**
 * 生成小红书笔记 Markdown 报告
 */
export function generateXiaohongshuReport(notes: XiaohongshuNote[]): string {
  let report = `# 📕 小红书足球笔记

> 共 ${notes.length} 篇笔记待发布

---

`;

  notes.forEach(note => {
    report += `## ${note.topicRank}. ${note.title}

${note.content}

**话题标签**: ${note.tags.map(t => `#${t}`).join(' ')}

**预估阅读时间**: ${note.estimatedReadTime}

---

`;
  });

  report += `
*笔记由 Football Hotspot Skill 自动生成*
*建议根据个人风格适当调整后发布*
`;

  return report;
}
