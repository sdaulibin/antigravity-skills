/**
 * Football Hotspot Skill - 主入口
 * 收集过去24小时足球热点，AI 分析 Top 10，生成图片提示词和小红书笔记
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeFootballHotspots, FootballTrendItem } from './scraper';
import { analyzeFootballHotspots, basicAnalysis, generateAnalysisReport, AnalysisResult } from './analyzer';
import { generateImagePrompts, generateImagePromptsReport, ImagePrompt } from './image-prompt';
import { generateXiaohongshuNotes, generateXiaohongshuReport, XiaohongshuNote } from './xiaohongshu-note';

// 加载环境变量
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// 输出目录
const OUTPUT_DIR = path.resolve(__dirname, '../../outputs/football-hotspot');

/**
 * 确保输出目录存在
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * 保存文件
 */
function saveFile(filename: string, content: string): string {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * 获取时间戳字符串
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export interface FootballHotspotResult {
  scrapeResult: {
    timestamp: string;
    timeRange: string;
    items: FootballTrendItem[];
  };
  analysis: AnalysisResult;
  imagePrompts: ImagePrompt[];
  xiaohongshuNotes: XiaohongshuNote[];
  savedFiles?: string[];
}

/**
 * 执行完整的足球热点分析流程
 */
export async function runFootballHotspotAnalysis(options: {
  useAI?: boolean;
  saveFiles?: boolean;
  outputJson?: boolean;
} = {}): Promise<FootballHotspotResult> {
  const { useAI = true, saveFiles = true, outputJson = false } = options;

  try {
    // Step 1: 抓取足球热点数据
    const scrapeResult = await scrapeFootballHotspots();
    
    if (scrapeResult.items.length === 0) {
      console.warn('⚠️ 未找到足球相关热点');
    }

    // Step 2: AI 分析或基础分析
    let analysis: AnalysisResult;
    if (useAI && process.env.GEMINI_API_KEY) {
      const aiAnalysis = await analyzeFootballHotspots(scrapeResult.items);
      analysis = aiAnalysis || basicAnalysis(scrapeResult.items);
    } else {
      analysis = basicAnalysis(scrapeResult.items);
    }
    
    // Step 3: 生成图片提示词
    const imagePrompts = await generateImagePrompts(analysis.top10);
    
    // Step 4: 生成小红书笔记
    const xiaohongshuNotes = await generateXiaohongshuNotes(analysis.top10);

    // Step 5: 保存文件
    const savedFiles: string[] = [];
    if (saveFiles) {
      ensureOutputDir();
      const timestamp = getTimestamp();
      
      // 保存原始数据
      savedFiles.push(saveFile(`football_hotspot_${timestamp}.json`, JSON.stringify(scrapeResult, null, 2)));
      
      // 保存分析报告
      savedFiles.push(saveFile(`football_analysis_${timestamp}.md`, generateAnalysisReport(analysis)));
      
      // 保存图片提示词
      savedFiles.push(saveFile(`image_prompts_${timestamp}.json`, generateImagePromptsReport(imagePrompts)));
      
      // 保存小红书笔记
      savedFiles.push(saveFile(`xiaohongshu_notes_${timestamp}.md`, generateXiaohongshuReport(xiaohongshuNotes)));
    }

    const result: FootballHotspotResult = {
      scrapeResult,
      analysis,
      imagePrompts,
      xiaohongshuNotes,
      savedFiles
    };

    // JSON 输出模式
    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result;

  } catch (error) {
    console.error('❌ 执行失败:', error);
    throw error;
  }
}

/**
 * CLI 入口
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isJsonMode = args.includes('--json');
  const skipAI = args.includes('--no-ai');
  const skipSave = args.includes('--no-save');

  if (!isJsonMode) {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('   ⚽ Football Hotspot Analysis Skill');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📅 数据范围: 过去 24 小时');
    console.log('');
  }

  const result = await runFootballHotspotAnalysis({
    useAI: !skipAI,
    saveFiles: !skipSave,
    outputJson: isJsonMode
  });

  if (!isJsonMode) {
    console.log('');
    console.log('✅ 任务完成!');
    console.log(`📊 抓取了 ${result.scrapeResult.items.length} 条足球热点`);
    console.log(`🏆 分析了 Top ${result.analysis.top10.length} 重要话题`);
    console.log(`📷 生成了 ${result.imagePrompts.length} 个图片提示词`);
    console.log(`📝 生成了 ${result.xiaohongshuNotes.length} 篇小红书笔记`);
    
    if (result.savedFiles && result.savedFiles.length > 0) {
      console.log('');
      console.log('📁 输出文件:');
      result.savedFiles.forEach(f => console.log(`   ${path.basename(f)}`));
    }
    console.log('');
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}
