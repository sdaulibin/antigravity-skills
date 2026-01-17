/**
 * Football Hotspot Scraper
 * 使用 TopHub 抓取过去 24 小时足球热点数据
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export interface FootballTrendItem {
  rank: number;
  title: string;
  heat: string;
  source: string;
  url: string;
  keywords: string[];
  timestamp: string;
}

export interface ScrapeResult {
  timestamp: string;
  timeRange: string; // "过去24小时"
  items: FootballTrendItem[];
}

// 足球相关关键词（用于过滤）
const FOOTBALL_KEYWORDS = [
  // 运动关键词
  "足球",
  "球员",
  "球队",
  "教练",
  "主帅",
  // 赛事
  "联赛",
  "欧冠",
  "世界杯",
  "欧洲杯",
  "亚洲杯",
  "美洲杯",
  "英超",
  "西甲",
  "德甲",
  "意甲",
  "法甲",
  "中超",
  "欧联杯",
  "足总杯",
  "国王杯",
  "欧冠",
  "亚冠",
  // 俱乐部
  "皇马",
  "巴萨",
  "曼联",
  "曼城",
  "利物浦",
  "切尔西",
  "阿森纳",
  "热刺",
  "拜仁",
  "多特",
  "国米",
  "米兰",
  "AC米兰",
  "尤文",
  "PSG",
  "巴黎圣日耳曼",
  // 球星
  "梅西",
  "C罗",
  "姆巴佩",
  "哈兰德",
  "贝林厄姆",
  "维尼修斯",
  "莱万",
  "凯恩",
  "萨拉赫",
  "德布劳内",
  "本泽马",
  "武磊",
  "李刚仁",
  // 术语
  "进球",
  "助攻",
  "帽子戏法",
  "点球",
  "红牌",
  "黄牌",
  "转会",
  "签约",
  "租借",
  "解约",
  "续约",
  "冠军",
  "降级",
  "升级",
  "积分",
  "射手榜",
  "VAR",
  "越位",
  "任意球",
  "角球",
  // 国家队
  "国足",
  "中国队",
  "阿根廷",
  "法国队",
  "英格兰",
  "德国队",
  "西班牙队",
  "巴西队",
];

/**
 * 检查标题是否与足球相关
 */
function isFootballRelated(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return FOOTBALL_KEYWORDS.some((keyword) =>
    lowerTitle.includes(keyword.toLowerCase())
  );
}

/**
 * 提取标题中的足球关键词
 */
function extractKeywords(title: string): string[] {
  return FOOTBALL_KEYWORDS.filter((keyword) =>
    title.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 抓取 TopHub 热榜数据并过滤足球相关内容
 */
export async function scrapeFootballHotspots(): Promise<ScrapeResult> {
  const isMockMode = process.env.MOCK_MODE === "true";

  if (isMockMode) {
    return getMockData();
  }

  const timeout = parseInt(process.env.SCRAPE_TIMEOUT || "30000");

  try {
    console.log("⚽ 正在获取足球热点数据...");

    const response = await fetch("https://tophub.today/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
      },
      timeout,
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log("🔍 解析热榜数据并筛选足球内容...");

    const $ = cheerio.load(html);
    const allItems: FootballTrendItem[] = [];
    const currentTime = new Date().toISOString();

    // 解析热榜卡片
    $(".cc-cd").each((_, card) => {
      const $card = $(card);

      // 获取来源名称
      const source =
        $card.find(".cc-cd-lb span").first().text().trim() || "未知来源";

      // 获取该平台的热榜列表
      $card.find(".cc-cd-cb-l a").each((index, item) => {
        const $item = $(item);
        const spans = $item.find("span");

        const title = spans.eq(1).text().trim();
        const heat = spans.eq(2).text().trim();
        const url = $item.attr("href") || "";

        // 只收集足球相关内容
        if (title && isFootballRelated(title)) {
          allItems.push({
            rank: allItems.length + 1,
            title,
            heat,
            source,
            url: url.startsWith("http") ? url : `https://tophub.today${url}`,
            keywords: extractKeywords(title),
            timestamp: currentTime,
          });
        }
      });
    });

    // 按热度排序（如果可解析）
    allItems.sort((a, b) => {
      const heatA = parseHeat(a.heat);
      const heatB = parseHeat(b.heat);
      return heatB - heatA;
    });

    // 重新分配排名
    allItems.forEach((item, index) => {
      item.rank = index + 1;
    });

    console.log(`✅ 成功筛选 ${allItems.length} 条足球热点`);

    return {
      timestamp: currentTime,
      timeRange: "过去24小时",
      items: allItems,
    };
  } catch (error: any) {
    console.warn("⚠️ 抓取失败，使用模拟数据:", error.message);
    return getMockData();
  }
}

/**
 * 解析热度值为数字（用于排序）
 */
function parseHeat(heat: string): number {
  if (!heat) return 0;
  const num = parseFloat(heat.replace(/[^\d.]/g, ""));
  if (heat.includes("亿")) return num * 100000000;
  if (heat.includes("万")) return num * 10000;
  return num || 0;
}

/**
 * 获取模拟数据（用于测试或抓取失败时）
 */
function getMockData(): ScrapeResult {
  console.log("📦 使用模拟足球热点数据...");

  const currentTime = new Date().toISOString();
  const mockItems: FootballTrendItem[] = [
    {
      rank: 1,
      title: "梅西加盟迈阿密国际后首次回归欧冠赛场",
      heat: "5356万",
      source: "微博",
      url: "https://example.com/1",
      keywords: ["梅西", "欧冠"],
      timestamp: currentTime,
    },
    {
      rank: 2,
      title: "皇马官宣姆巴佩正式加盟 身披7号球衣",
      heat: "4200万",
      source: "虎扑",
      url: "https://example.com/2",
      keywords: ["皇马", "姆巴佩", "转会"],
      timestamp: currentTime,
    },
    {
      rank: 3,
      title: "英超争冠白热化 曼城阿森纳同分",
      heat: "3800万",
      source: "懂球帝",
      url: "https://example.com/3",
      keywords: ["英超", "曼城", "阿森纳"],
      timestamp: currentTime,
    },
    {
      rank: 4,
      title: "C罗沙特联赛戴帽 本赛季已打进35球",
      heat: "3500万",
      source: "微博",
      url: "https://example.com/4",
      keywords: ["C罗", "帽子戏法", "进球"],
      timestamp: currentTime,
    },
    {
      rank: 5,
      title: "欧冠半决赛对阵出炉 皇马对阵拜仁",
      heat: "3200万",
      source: "虎扑",
      url: "https://example.com/5",
      keywords: ["欧冠", "皇马", "拜仁"],
      timestamp: currentTime,
    },
    {
      rank: 6,
      title: "中超联赛第10轮综述 上港继续领跑",
      heat: "2800万",
      source: "懂球帝",
      url: "https://example.com/6",
      keywords: ["中超", "联赛"],
      timestamp: currentTime,
    },
    {
      rank: 7,
      title: "武磊替补登场完成助攻 西班牙人3-1大胜",
      heat: "2500万",
      source: "微博",
      url: "https://example.com/7",
      keywords: ["武磊", "助攻", "西甲"],
      timestamp: currentTime,
    },
    {
      rank: 8,
      title: "利物浦公布新赛季球衣 致敬伊斯坦布尔奇迹",
      heat: "2200万",
      source: "虎扑",
      url: "https://example.com/8",
      keywords: ["利物浦"],
      timestamp: currentTime,
    },
    {
      rank: 9,
      title: "哈兰德缺战两周 曼城前锋线告急",
      heat: "2000万",
      source: "懂球帝",
      url: "https://example.com/9",
      keywords: ["哈兰德", "曼城"],
      timestamp: currentTime,
    },
    {
      rank: 10,
      title: "巴萨青训再出新星 17岁小将首秀破门",
      heat: "1800万",
      source: "虎扑",
      url: "https://example.com/10",
      keywords: ["巴萨", "进球"],
      timestamp: currentTime,
    },
    {
      rank: 11,
      title: "国足世预赛名单公布 归化球员悉数入选",
      heat: "1600万",
      source: "微博",
      url: "https://example.com/11",
      keywords: ["国足", "世界杯"],
      timestamp: currentTime,
    },
    {
      rank: 12,
      title: "德甲收官战多特蒙德逆转夺冠",
      heat: "1400万",
      source: "懂球帝",
      url: "https://example.com/12",
      keywords: ["德甲", "多特", "冠军"],
      timestamp: currentTime,
    },
    {
      rank: 13,
      title: "切尔西新帅首秀开门红 4-2大胜西汉姆",
      heat: "1300万",
      source: "虎扑",
      url: "https://example.com/13",
      keywords: ["切尔西", "英超"],
      timestamp: currentTime,
    },
    {
      rank: 14,
      title: "意甲最佳阵容出炉 国米5人入选",
      heat: "1200万",
      source: "懂球帝",
      url: "https://example.com/14",
      keywords: ["意甲", "国米"],
      timestamp: currentTime,
    },
    {
      rank: 15,
      title: "2026世界杯扩军至48队 亚洲获8.5席位",
      heat: "1100万",
      source: "微博",
      url: "https://example.com/15",
      keywords: ["世界杯"],
      timestamp: currentTime,
    },
  ];

  return {
    timestamp: currentTime,
    timeRange: "过去24小时",
    items: mockItems,
  };
}
