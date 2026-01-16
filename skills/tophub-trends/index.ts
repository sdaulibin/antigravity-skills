/**
 * TopHub Trends Skill - 主入口
 * 抓取 TopHub 热榜数据并生成分析报告
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeTophubTrends } from './scraper';
import { analyzeTrends, generateReport } from './analyzer';
import { analyzeWithGemini, generateAIReportSection } from './ai-analyzer';

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
const OUTPUT_DIR = path.resolve(__dirname, '../../outputs/trends');

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
 * 执行抓取和分析流程
 */
export async function runTrendsAnalysis(options: { 
  useAI?: boolean, 
  saveFiles?: boolean,
  outputJson?: boolean 
} = {}) {
  const { useAI = false, saveFiles = true, outputJson = false } = options;

  try {
    // Step 1: 抓取热榜数据
    const scrapeResult = await scrapeTophubTrends();
    
    // Step 2: 基础分析
    const analysisResult = analyzeTrends(scrapeResult);
    
    let aiResult = null;
    let aiSection = '';

    // Step 3: AI 智能分析 (如果明确要求且有 Key)
    if (useAI && process.env.GEMINI_API_KEY) {
      aiResult = await analyzeWithGemini(analysisResult.top30);
      if (aiResult) {
        aiSection = generateAIReportSection(aiResult);
      }
    }
    
    // Step 4: 生成报告
    let report = generateReport(analysisResult);
    if (aiSection) {
      report += aiSection;
    }
    
    // Step 5: 输出/保存
    if (saveFiles) {
      ensureOutputDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveFile(`tophub_hot_${timestamp}.json`, JSON.stringify(scrapeResult, null, 2));
      saveFile(`tophub_analysis_${timestamp}.md`, report);
    }

    const result = {
      ...analysisResult,
      aiAnalysis: aiResult,
      report: report
    };

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
    console.log('   🔥 TopHub Trends Analysis Skill');
    console.log('═══════════════════════════════════════════');
    console.log('');
  }

  const result = await runTrendsAnalysis({
    useAI: !skipAI && !!process.env.GEMINI_API_KEY,
    saveFiles: !skipSave,
    outputJson: isJsonMode
  });

  if (!isJsonMode) {
    console.log('\n✅ 任务完成!');
    console.log(`📊 分析了 ${result.top30.length} 条热门趋势`);
    if (result.aiAnalysis) {
      console.log(`🤖 已包含 AI 智能建议`);
    }
    console.log('');
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}

