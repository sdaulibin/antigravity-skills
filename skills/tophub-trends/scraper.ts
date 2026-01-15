/**
 * TopHub Trends Scraper
 * 使用 cheerio + node-fetch 抓取 TopHub 热榜数据（无需浏览器）
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export interface TrendItem {
  rank: number;
  title: string;
  heat: string;
  source: string;
  url: string;
}

export interface ScrapeResult {
  timestamp: string;
  items: TrendItem[];
}

/**
 * 抓取 TopHub 热榜数据
 */
export async function scrapeTophubTrends(): Promise<ScrapeResult> {
  const isMockMode = process.env.MOCK_MODE === 'true';
  
  if (isMockMode) {
    return getMockData();
  }

  const timeout = parseInt(process.env.SCRAPE_TIMEOUT || '30000');

  try {
    console.log('� 正在获取 TopHub 热榜数据...');
    
    const response = await fetch('https://tophub.today/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('🔍 解析热榜数据...');
    
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];

    // 解析热榜卡片
    $('.cc-cd').each((_, card) => {
      const $card = $(card);
      
      // 获取来源名称
      const source = $card.find('.cc-cd-lb span').first().text().trim() || '未知来源';
      
      // 获取该平台的热榜列表
      $card.find('.cc-cd-cb-l a').each((index, item) => {
        const $item = $(item);
        const spans = $item.find('span');
        
        const title = spans.eq(1).text().trim();  // 第二个 span 是标题
        const heat = spans.eq(2).text().trim();   // 第三个 span 是热度
        const url = $item.attr('href') || '';
        
        if (title) {
          items.push({
            rank: index + 1,
            title,
            heat,
            source,
            url: url.startsWith('http') ? url : `https://tophub.today${url}`
          });
        }
      });
    });

    console.log(`✅ 成功抓取 ${items.length} 条热点数据`);

    return {
      timestamp: new Date().toISOString(),
      items
    };

  } catch (error: any) {
    // 如果抓取失败，回退到模拟数据
    console.warn('⚠️ 抓取失败，使用模拟数据:', error.message);
    return getMockData();
  }
}

/**
 * 获取模拟数据（用于测试或抓取失败时）
 */
function getMockData(): ScrapeResult {
  console.log('📦 使用模拟数据...');
  
  const mockItems: TrendItem[] = [
    { rank: 1, title: 'AI 技术突破：新模型性能提升 50%', heat: '5356万', source: '微博', url: 'https://example.com/1' },
    { rank: 2, title: '春节档电影票房预测出炉', heat: '3200万', source: '微博', url: 'https://example.com/2' },
    { rank: 3, title: '新能源汽车销量创新高', heat: '2800万', source: '知乎', url: 'https://example.com/3' },
    { rank: 4, title: '年轻人为什么不爱存钱了', heat: '2500万', source: '知乎', url: 'https://example.com/4' },
    { rank: 5, title: '多地发布楼市新政', heat: '2100万', source: '百度', url: 'https://example.com/5' },
    { rank: 6, title: '某明星官宣喜讯', heat: '1900万', source: '微博', url: 'https://example.com/6' },
    { rank: 7, title: '程序员薪资调查报告', heat: '1700万', source: '知乎', url: 'https://example.com/7' },
    { rank: 8, title: '健康饮食新趋势', heat: '1500万', source: '小红书', url: 'https://example.com/8' },
    { rank: 9, title: '职场人如何高效学习', heat: '1300万', source: '知乎', url: 'https://example.com/9' },
    { rank: 10, title: '旅游业复苏数据公布', heat: '1200万', source: '百度', url: 'https://example.com/10' },
    { rank: 11, title: '教育改革新方向', heat: '1100万', source: '微博', url: 'https://example.com/11' },
    { rank: 12, title: '科技公司裁员潮分析', heat: '1050万', source: '知乎', url: 'https://example.com/12' },
    { rank: 13, title: '新款手机发布会预告', heat: '980万', source: '微博', url: 'https://example.com/13' },
    { rank: 14, title: '考研成绩公布', heat: '950万', source: '微博', url: 'https://example.com/14' },
    { rank: 15, title: '年终奖发放情况调查', heat: '920万', source: '知乎', url: 'https://example.com/15' },
    { rank: 16, title: '健身行业新变化', heat: '880万', source: '小红书', url: 'https://example.com/16' },
    { rank: 17, title: '美食探店攻略', heat: '850万', source: '抖音', url: 'https://example.com/17' },
    { rank: 18, title: '投资理财新思路', heat: '820万', source: '知乎', url: 'https://example.com/18' },
    { rank: 19, title: '宠物经济分析', heat: '780万', source: '小红书', url: 'https://example.com/19' },
    { rank: 20, title: '远程办公效率提升', heat: '750万', source: '知乎', url: 'https://example.com/20' },
    { rank: 21, title: '新剧热播引发讨论', heat: '720万', source: '微博', url: 'https://example.com/21' },
    { rank: 22, title: '环保新政策解读', heat: '680万', source: '百度', url: 'https://example.com/22' },
    { rank: 23, title: '电商直播新玩法', heat: '650万', source: '抖音', url: 'https://example.com/23' },
    { rank: 24, title: '心理健康话题受关注', heat: '620万', source: '知乎', url: 'https://example.com/24' },
    { rank: 25, title: '时尚潮流趋势预测', heat: '580万', source: '小红书', url: 'https://example.com/25' },
    { rank: 26, title: '体育赛事最新战报', heat: '550万', source: '微博', url: 'https://example.com/26' },
    { rank: 27, title: '游戏行业新动态', heat: '520万', source: '知乎', url: 'https://example.com/27' },
    { rank: 28, title: '创业故事分享', heat: '480万', source: '知乎', url: 'https://example.com/28' },
    { rank: 29, title: '亲子教育讨论', heat: '450万', source: '小红书', url: 'https://example.com/29' },
    { rank: 30, title: '职场晋升技巧', heat: '420万', source: '知乎', url: 'https://example.com/30' },
  ];

  return {
    timestamp: new Date().toISOString(),
    items: mockItems
  };
}
