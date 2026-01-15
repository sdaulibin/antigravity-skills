/**
 * TopHub Trends Skill - 主入口
 * 抓取 TopHub 热榜数据并生成分析报告
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeTophubTrends } from './scraper';
import { analyzeTrends, generateReport } from './analyzer';

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
    
    // Step 3: 生成报告
    console.log('\n📝 Step 3: 生成分析报告...\n');
    const report = generateReport(analysisResult);
    
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
