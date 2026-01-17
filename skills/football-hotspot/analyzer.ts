/**
 * Football Hotspot Analyzer
 * 使用 Gemini AI 进行中文总结和 Top 10 话题提取
 * 默认模型: gemini-2.0-flash (可通过 GEMINI_MODEL 环境变量配置)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { FootballTrendItem } from './scraper';

// 获取 Gemini 客户端
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未配置 GEMINI_API_KEY，跳过 AI 分析');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface AnalyzedTopic {
  rank: number;
  title: string;
  summary: string;
  importance: number;  // 1-10
  category: string;    // 转会、比赛、球员、争议等
  originalHeat: string;
  source: string;
}

export interface AnalysisResult {
  overview: string;           // 整体概述
  top10: AnalyzedTopic[];     // Top 10 话题
  trendInsight: string;       // 趋势洞察
  timestamp: string;
}

/**
 * 使用 Gemini 分析足球热点
 */
export async function analyzeFootballHotspots(items: FootballTrendItem[]): Promise<AnalysisResult | null> {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  try {
    // 使用环境变量配置的模型，默认 gemini-2.0-flash
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    console.log(`🤖 启动 Gemini AI 分析 (模型: ${modelName})...`);
    
    const model = client.getGenerativeModel({ model: modelName });

    // 准备热点数据摘要
    const itemsSummary = items.slice(0, 20).map((item, i) => 
      `${i + 1}. [${item.source}] ${item.title} (热度: ${item.heat})`
    ).join('\n');

    const prompt = `你是一位资深的足球评论员和社交媒体分析师。请分析以下过去24小时的中文足球热榜数据，提供专业的分析报告。

## 今日足球热点 (共${items.length}条):
${itemsSummary}

请用中文回答，输出格式为 JSON（不要包含 markdown 代码块标记）：

{
  "overview": "用2-3句话总结今日足球热点整体情况",
  "top10": [
    {
      "rank": 1,
      "title": "原标题",
      "summary": "一句话总结这个话题的核心内容",
      "importance": 9,
      "category": "分类（转会/比赛/球员动态/争议/数据/荣誉/其他）"
    }
  ],
  "trendInsight": "2-3句话分析当前足球舆论的热点趋势和走向"
}

注意：
1. 从热点中选出最重要的 Top 10 话题
2. importance 为 1-10 分，10 分最重要
3. 按重要性从高到低排序
4. 只输出 JSON，不要其他内容`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('✅ Gemini 分析完成');

    // 解析 JSON 响应
    try {
      // 清理可能的 markdown 代码块标记
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      
      // 补充原始数据
      const top10WithMeta: AnalyzedTopic[] = parsed.top10.slice(0, 10).map((topic: any, index: number) => {
        const original = items.find(item => item.title.includes(topic.title.slice(0, 10)));
        return {
          rank: index + 1,
          title: topic.title,
          summary: topic.summary,
          importance: topic.importance,
          category: topic.category,
          originalHeat: original?.heat || '',
          source: original?.source || ''
        };
      });

      return {
        overview: parsed.overview,
        top10: top10WithMeta,
        trendInsight: parsed.trendInsight,
        timestamp: new Date().toISOString()
      };

    } catch (parseError) {
      console.error('⚠️ JSON 解析失败，返回原始文本');
      // 如果 JSON 解析失败，返回基本结构
      return {
        overview: text.slice(0, 200),
        top10: items.slice(0, 10).map((item, index) => ({
          rank: index + 1,
          title: item.title,
          summary: item.title,
          importance: 10 - index,
          category: '其他',
          originalHeat: item.heat,
          source: item.source
        })),
        trendInsight: '分析数据处理中...',
        timestamp: new Date().toISOString()
      };
    }

  } catch (error: any) {
    console.error('❌ Gemini 分析失败:', error.message);
    return null;
  }
}

/**
 * 不使用 AI 时的基础分析
 */
export function basicAnalysis(items: FootballTrendItem[]): AnalysisResult {
  console.log('📊 执行基础分析（无AI）...');
  
  return {
    overview: `过去24小时共收集到 ${items.length} 条足球热点新闻。`,
    top10: items.slice(0, 10).map((item, index) => ({
      rank: index + 1,
      title: item.title,
      summary: item.title,
      importance: 10 - index,
      category: categorizeByKeywords(item.keywords),
      originalHeat: item.heat,
      source: item.source
    })),
    trendInsight: '需要 AI 分析以获取深度洞察。',
    timestamp: new Date().toISOString()
  };
}

/**
 * 根据关键词简单分类
 */
function categorizeByKeywords(keywords: string[]): string {
  const keywordStr = keywords.join(' ');
  
  if (keywordStr.includes('转会') || keywordStr.includes('签约') || keywordStr.includes('租借')) {
    return '转会';
  }
  if (keywordStr.includes('进球') || keywordStr.includes('比赛') || keywordStr.includes('胜') || keywordStr.includes('负')) {
    return '比赛';
  }
  if (keywordStr.includes('冠军') || keywordStr.includes('射手榜') || keywordStr.includes('最佳')) {
    return '荣誉';
  }
  if (keywordStr.includes('红牌') || keywordStr.includes('VAR') || keywordStr.includes('争议')) {
    return '争议';
  }
  return '球员动态';
}

/**
 * 生成 Markdown 分析报告
 */
export function generateAnalysisReport(analysis: AnalysisResult): string {
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  let report = `# ⚽ 足球热点分析报告

> 生成时间: ${now}
> 数据范围: 过去 24 小时

## 📊 整体概述

${analysis.overview}

## 🏆 Top 10 重要话题

`;

  analysis.top10.forEach(topic => {
    const stars = '⭐'.repeat(Math.ceil(topic.importance / 2));
    report += `### ${topic.rank}. ${topic.title}

- **分类**: ${topic.category}
- **重要性**: ${stars} (${topic.importance}/10)
- **来源**: ${topic.source} | 热度: ${topic.originalHeat}
- **摘要**: ${topic.summary}

`;
  });

  report += `## 📈 趋势洞察

${analysis.trendInsight}

---
*本报告由 Football Hotspot Skill 自动生成，使用 Gemini AI 分析*
`;

  return report;
}
