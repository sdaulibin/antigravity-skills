/**
 * Image Prompt Generator
 * 为 Top 10 足球话题生成 Nano Banana 风格的图片提示词
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

export interface ImagePrompt {
  topicRank: number;
  topicTitle: string;
  prompt: string;         // 英文提示词
  promptCN: string;       // 中文提示词
  style: string;          // Nano Banana 风格描述
  suggestedRatio: string; // 建议比例 (1:1, 16:9 等)
}

/**
 * Nano Banana 风格说明
 * - 高饱和度色彩
 * - 扁平化设计 + 3D 元素
 * - 几何形状和渐变
 * - 活泼、现代、科技感
 */
const NANO_BANANA_STYLE = `nano banana style, vibrant high-saturation colors, flat design with 3D elements, geometric shapes, smooth gradients, modern tech aesthetic, playful and dynamic composition`;

const NANO_BANANA_STYLE_CN = `Nano Banana 风格：高饱和度色彩，扁平化设计搭配3D元素，几何形状，流畅渐变，现代科技感，活泼动感的构图`;

/**
 * 使用 AI 生成图片提示词
 */
export async function generateImagePrompts(topics: AnalyzedTopic[]): Promise<ImagePrompt[]> {
  const client = getGeminiClient();
  
  if (!client) {
    console.log('📷 使用规则引擎生成图片提示词...');
    return generateRuleBasedPrompts(topics);
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    console.log(`📷 使用 AI 生成 Nano Banana 风格图片提示词 (模型: ${modelName})...`);
    
    const model = client.getGenerativeModel({ model: modelName });

    const topicsList = topics.slice(0, 10).map((t, i) => 
      `${i + 1}. ${t.title} (分类: ${t.category})`
    ).join('\n');

    const prompt = `你是一位专业的 AI 图片提示词工程师。请为以下足球新闻话题生成 Nano Banana 风格的图片生成提示词。

## Nano Banana 风格特点:
- 高饱和度色彩（明亮的黄、橙、蓝、绿等）
- 扁平化设计 + 3D 立体元素
- 几何形状（圆形、三角形、波浪线）
- 流畅渐变过渡
- 现代科技感
- 活泼、动感的构图
- 适合社交媒体的视觉冲击力

## 需要生成提示词的足球话题:
${topicsList}

请用 JSON 格式输出（不要 markdown 代码块）：
[
  {
    "topicRank": 1,
    "topicTitle": "话题标题",
    "prompt": "英文版本提示词，详细描述场景、人物、元素、风格、颜色、构图",
    "promptCN": "中文版本提示词",
    "suggestedRatio": "16:9 或 1:1 或 9:16"
  }
]

注意：
1. 提示词要具体、可执行，能直接用于 Midjourney/DALL-E
2. 融入足球元素（球场、足球、球衣、奖杯等）
3. 保持 Nano Banana 的活泼科技风格
4. 考虑小红书封面的视觉吸引力`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      
      return parsed.map((item: any) => ({
        ...item,
        style: NANO_BANANA_STYLE
      }));

    } catch {
      console.warn('⚠️ AI 生成解析失败，使用规则引擎');
      return generateRuleBasedPrompts(topics);
    }

  } catch (error: any) {
    console.error('❌ AI 生成失败:', error.message);
    return generateRuleBasedPrompts(topics);
  }
}

/**
 * 规则引擎生成提示词（无需 AI）
 */
function generateRuleBasedPrompts(topics: AnalyzedTopic[]): ImagePrompt[] {
  const categoryTemplates: Record<string, { scene: string, elements: string }> = {
    '转会': {
      scene: 'dramatic airport scene, player silhouette with suitcase',
      elements: 'airplane, club badges, spotlight, contract papers'
    },
    '比赛': {
      scene: 'dynamic stadium view, action pose',
      elements: 'football, goal net, scoreboard, cheering crowd'
    },
    '球员动态': {
      scene: 'portrait style, player in training',
      elements: 'jersey, football, training cones, modern facility'
    },
    '荣誉': {
      scene: 'celebration podium, trophy presentation',
      elements: 'golden trophy, confetti, medals, camera flashes'
    },
    '争议': {
      scene: 'split screen dramatic comparison',
      elements: 'VAR monitor, red card, referee whistle, replay screen'
    },
    '其他': {
      scene: 'abstract football composition',
      elements: 'football, geometric patterns, dynamic lines'
    }
  };

  return topics.slice(0, 10).map((topic, index) => {
    const template = categoryTemplates[topic.category] || categoryTemplates['其他'];
    
    const prompt = `${template.scene}, ${template.elements}, ${NANO_BANANA_STYLE}, ultra detailed, 8k quality, trending on artstation`;
    
    const promptCN = `${topic.title}，${NANO_BANANA_STYLE_CN}，超高清细节，8K画质，艺术站流行风格`;

    return {
      topicRank: index + 1,
      topicTitle: topic.title,
      prompt,
      promptCN,
      style: NANO_BANANA_STYLE,
      suggestedRatio: topic.category === '比赛' ? '16:9' : '1:1'
    };
  });
}

/**
 * 生成图片提示词 JSON 报告
 */
export function generateImagePromptsReport(prompts: ImagePrompt[]): string {
  return JSON.stringify(prompts, null, 2);
}
