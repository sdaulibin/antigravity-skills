/**
 * Gemini AI 分析模块
 * 使用 Google Gemini 进行智能热点分析
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzedTrend } from './analyzer';

// 初始化 Gemini
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未配置 GEMINI_API_KEY，跳过 AI 分析');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface AIAnalysisResult {
  insights: string;
  creativeAngles: string[];
  trendPrediction: string;
}

/**
 * 使用 Gemini 分析热点趋势
 */
export async function analyzeWithGemini(trends: AnalyzedTrend[]): Promise<AIAnalysisResult | null> {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  try {
    console.log('🤖 启动 Gemini AI 分析...');
    
    const model = client.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });

    // 准备热点数据摘要
    const trendsSummary = trends.slice(0, 10).map((t, i) => 
      `${i + 1}. [${t.source}] ${t.title} (热度: ${t.heat})`
    ).join('\n');

    const prompt = `你是一位资深的内容创作顾问和社交媒体分析师。请分析以下中文热榜数据，提供专业的创作建议。

## 今日 Top 10 热点：
${trendsSummary}

请用中文回答以下问题：

### 1. 趋势洞察
分析这些热点背后的共同主题和社会情绪，用 2-3 句话总结。

### 2. 创作角度建议
针对这些热点，提供 5 个独特的创作切入角度，每个角度一句话描述。考虑：
- 反直觉观点
- 深度分析
- 个人故事切入
- 热点借势

### 3. 爆款预测
预测哪 2-3 个话题最有可能持续发酵，说明原因。

请直接输出分析结果，不要重复热点列表。`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('✅ Gemini 分析完成');

    // 解析响应
    return {
      insights: text,
      creativeAngles: extractAngles(text),
      trendPrediction: extractPrediction(text)
    };

  } catch (error: any) {
    console.error('❌ Gemini 分析失败:', error.message);
    return null;
  }
}

/**
 * 提取创作角度
 */
function extractAngles(text: string): string[] {
  const angles: string[] = [];
  const lines = text.split('\n');
  let inAnglesSection = false;
  
  for (const line of lines) {
    if (line.includes('创作角度') || line.includes('切入角度')) {
      inAnglesSection = true;
      continue;
    }
    if (line.includes('爆款预测') || line.includes('###')) {
      inAnglesSection = false;
    }
    if (inAnglesSection && line.trim().match(/^[-\d•*]/)) {
      angles.push(line.trim().replace(/^[-\d.•*]\s*/, ''));
    }
  }
  
  return angles.slice(0, 5);
}

/**
 * 提取爆款预测
 */
function extractPrediction(text: string): string {
  const lines = text.split('\n');
  let inPredictionSection = false;
  const predictions: string[] = [];
  
  for (const line of lines) {
    if (line.includes('爆款预测')) {
      inPredictionSection = true;
      continue;
    }
    if (inPredictionSection && line.trim()) {
      predictions.push(line.trim());
    }
  }
  
  return predictions.join('\n');
}

/**
 * 生成 AI 分析报告部分
 */
export function generateAIReportSection(aiResult: AIAnalysisResult): string {
  return `
---

## 🤖 AI 智能分析 (Powered by Gemini)

${aiResult.insights}
`;
}
