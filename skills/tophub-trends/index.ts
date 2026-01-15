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
    console.log(`📁 创建输出目录: ${OUTPUT_DIR}`);
  }
}

/**
 * 保存文件
 */
function saveFile(filename: string, content: string): string {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`💾 文件已保存: ${filepath}`);
  return filepath;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('   🔥 TopHub Trends Analysis Skill');
  console.log('═══════════════════════════════════════════');
  console.log('');

  try {
    // 确保输出目录存在
    ensureOutputDir();

    // Step 1: 抓取热榜数据
    console.log('📡 Step 1: 抓取热榜数据...\n');
    const scrapeResult = await scrapeTophubTrends();
    
    // 生成时间戳用于文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // 保存原始数据
    const jsonFilename = `tophub_hot_${timestamp}.json`;
    saveFile(jsonFilename, JSON.stringify(scrapeResult, null, 2));
    
    // Step 2: 分析数据
    console.log('\n📊 Step 2: 分析热点数据...\n');
    const analysisResult = analyzeTrends(scrapeResult);
    
    // Step 3: AI 智能分析 (如果配置了 API Key)
    let aiSection = '';
    if (process.env.GEMINI_API_KEY) {
      console.log('\n🤖 Step 3: Gemini AI 智能分析...\n');
      const aiResult = await analyzeWithGemini(analysisResult.top30);
      if (aiResult) {
        aiSection = generateAIReportSection(aiResult);
      }
    } else {
      console.log('\n💡 提示: 配置 GEMINI_API_KEY 可启用 AI 智能分析\n');
    }
    
    // Step 4: 生成报告
    console.log('\n📝 Step 4: 生成分析报告...\n');
    let report = generateReport(analysisResult);
    
    // 如果有 AI 分析结果，追加到报告
    if (aiSection) {
      report += aiSection;
    }
    
    // 保存报告
    const mdFilename = `tophub_analysis_${timestamp}.md`;
    const reportPath = saveFile(mdFilename, report);
    
    // 完成
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ 任务完成!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log(`📊 分析了 ${scrapeResult.items.length} 条热点数据`);
    console.log(`🎯 精选了 Top ${analysisResult.top30.length} 热点`);
    if (aiSection) {
      console.log(`🤖 已生成 AI 智能分析`);
    }
    console.log(`📁 报告已保存到: ${reportPath}`);
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行
main();

