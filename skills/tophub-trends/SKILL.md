---
name: tophub-trends
description: 获取并分析 TopHub 热榜数据，提供内容创作灵感。
---

# TopHub Trends Analysis Skill

这个 Skill 用于自动化获取 TopHub 热榜数据，分析当前最具传播潜力的热点话题，为内容创作者提供选题建议。

## 功能描述

1. **Fetch Hot List**: 抓取 TopHub 首页的实时热榜数据
2. **Analyze Trends**: 分析前 30 个热点，识别高流量潜力话题
3. **Generate Report**: 生成包含选题建议的 Markdown 报告

## 使用方法

### 安装依赖

```bash
cd /Users/binginx/workspace/antigravity-skills
npm install
```

### 运行脚本

```bash
npm run skill:trends
```

### 输出结果

脚本运行后，会在 `outputs/trends/` 目录下生成两个文件：

1. `tophub_hot_[timestamp].json`: 原始热榜数据
2. `tophub_analysis_[timestamp].md`: 热点分析报告

## 依赖配置

确保已安装 Node.js 18+。

可选配置 `.env` 文件：

- `MOCK_MODE`: 设置为 `true` 可使用模拟数据进行测试
- `SCRAPE_TIMEOUT`: 抓取超时时间（毫秒），默认 30000
