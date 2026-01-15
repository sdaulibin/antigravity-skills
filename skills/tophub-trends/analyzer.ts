/**
 * TopHub Trends Analyzer
 * 分析热榜数据并生成选题建议
 */

import { TrendItem, ScrapeResult } from './scraper';

export interface AnalyzedTrend extends TrendItem {
  category: string;
  score: number;
}

export interface AnalysisResult {
  timestamp: string;
  top30: AnalyzedTrend[];
  topPicks: AnalyzedTrend[];
  categoryGroups: Record<string, AnalyzedTrend[]>;
}

// 分类关键词映射
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '科技': ['AI', '人工智能', '手机', '科技', '互联网', '程序员', '代码', '软件', '芯片', '5G', '技术', '数据', '算法', '模型'],
  '财经': ['股票', '房价', '经济', '投资', '理财', '基金', '楼市', '金融', '银行', '消费', '年终奖', '薪资'],
  '娱乐': ['明星', '电影', '电视剧', '综艺', '演唱会', '偶像', '视频', '热播', '票房', '游戏'],
  '社会': ['教育', '医疗', '政策', '改革', '就业', '考研', '高考', '退休', '养老', '环保'],
  '生活': ['美食', '旅游', '健身', '时尚', '健康', '宠物', '亲子', '情感', '心理'],
  '职场': ['职场', '工作', '办公', '创业', '晋升', '跳槽', '裁员', '招聘', '简历']
};

/**
 * 解析热度数值
 */
function parseHeat(heat: string): number {
  if (!heat) return 0;
  
  const num = parseFloat(heat.replace(/[^0-9.]/g, ''));
  if (heat.includes('亿')) return num * 100000000;
  if (heat.includes('万')) return num * 10000;
  return num || 0;
}

/**
 * 识别话题分类
 */
function categorize(title: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }
  return '其他';
}

/**
 * 计算话题潜力分数
 */
function calculateScore(item: TrendItem): number {
  let score = 0;
  
  // 基于热度计算基础分
  const heatValue = parseHeat(item.heat);
  if (heatValue >= 10000000) score += 40;      // 1000万以上
  else if (heatValue >= 5000000) score += 30;  // 500万以上
  else if (heatValue >= 1000000) score += 20;  // 100万以上
  else score += 10;
  
  // 基于来源加分（权重平台）
  const sourceBonus: Record<string, number> = {
    '微博': 15,
    '知乎': 20,
    '百度': 10,
    '抖音': 12,
    '小红书': 12
  };
  score += sourceBonus[item.source] || 5;
  
  // 基于排名加分
  if (item.rank <= 3) score += 20;
  else if (item.rank <= 10) score += 15;
  else if (item.rank <= 20) score += 10;
  else score += 5;
  
  // 反直觉/争议性话题加分
  const controversialKeywords = ['为什么', '真相', '揭秘', '惊人', '没想到', '不爱', '不想'];
  if (controversialKeywords.some(k => item.title.includes(k))) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * 分析热榜数据
 */
export function analyzeTrends(data: ScrapeResult): AnalysisResult {
  console.log('📊 分析热榜数据...');
  
  // 为每个热点添加分类和分数
  const analyzedItems: AnalyzedTrend[] = data.items.map(item => ({
    ...item,
    category: categorize(item.title),
    score: calculateScore(item)
  }));
  
  // 按分数排序
  analyzedItems.sort((a, b) => b.score - a.score);
  
  // 取 Top 30
  const top30 = analyzedItems.slice(0, 30);
  
  // 取 Top 5 作为精选推荐
  const topPicks = top30.slice(0, 5);
  
  // 按分类分组
  const categoryGroups: Record<string, AnalyzedTrend[]> = {};
  for (const item of top30) {
    if (!categoryGroups[item.category]) {
      categoryGroups[item.category] = [];
    }
    categoryGroups[item.category].push(item);
  }
  
  console.log(`✅ 分析完成: Top 30 热点, ${Object.keys(categoryGroups).length} 个分类`);
  
  return {
    timestamp: data.timestamp,
    top30,
    topPicks,
    categoryGroups
  };
}

/**
 * 生成 Markdown 报告
 */
export function generateReport(analysis: AnalysisResult): string {
  const date = new Date(analysis.timestamp);
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  let report = `# 🔥 TopHub 热榜趋势分析报告

📅 **生成时间**: ${formattedDate}

---

## 📊 Top 30 热点概览

| 排名 | 热点标题 | 来源 | 热度 | 分类 | 潜力分 |
|:---:|:---|:---:|:---:|:---:|:---:|
`;

  // 添加 Top 30 表格
  analysis.top30.forEach((item, index) => {
    report += `| ${index + 1} | ${item.title} | ${item.source} | ${item.heat || '-'} | ${item.category} | ${item.score} |\n`;
  });

  report += `
---

## 🎯 高潜力选题 (Top 5)

`;

  // 添加 Top 5 推荐
  analysis.topPicks.forEach((item, index) => {
    const reason = getRecommendReason(item);
    report += `### ${index + 1}. ${item.title}

- **来源**: ${item.source}
- **热度**: ${item.heat || '无数据'}
- **分类**: ${item.category}
- **潜力分**: ${item.score}/100
- **推荐理由**: ${reason}

`;
  });

  report += `---

## 📁 分类热点

`;

  // 按分类列出热点
  for (const [category, items] of Object.entries(analysis.categoryGroups)) {
    report += `### ${category}\n\n`;
    items.slice(0, 5).forEach(item => {
      report += `- ${item.title} (${item.source}, ${item.heat || '-'})\n`;
    });
    report += '\n';
  }

  report += `---

## 💡 创作灵感

基于当前热点趋势，建议以下创作角度：

1. **热点借势**: 结合榜首热点，从独特角度切入评论
2. **反直觉观点**: 针对大众观点提出不同见解
3. **深度分析**: 挖掘热点背后的底层逻辑
4. **个人经历**: 结合热点分享相关亲身经历

---

*报告由 TopHub Trends Skill 自动生成*
`;

  return report;
}

/**
 * 生成推荐理由
 */
function getRecommendReason(item: AnalyzedTrend): string {
  const reasons: string[] = [];
  
  const heatValue = parseHeat(item.heat);
  if (heatValue >= 10000000) {
    reasons.push('超高热度话题');
  } else if (heatValue >= 5000000) {
    reasons.push('高热度话题');
  }
  
  if (item.source === '知乎') {
    reasons.push('适合深度内容创作');
  } else if (item.source === '微博') {
    reasons.push('传播速度快');
  }
  
  if (item.category === '科技') {
    reasons.push('科技类内容长尾价值高');
  } else if (item.category === '财经') {
    reasons.push('财经类受众付费意愿强');
  } else if (item.category === '职场') {
    reasons.push('职场内容易引发共鸣');
  }
  
  if (item.title.includes('为什么') || item.title.includes('如何')) {
    reasons.push('具有明确用户需求导向');
  }
  
  return reasons.length > 0 ? reasons.join('，') : '综合潜力较高';
}
