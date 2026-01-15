---
name: tophub-trends
description: 获取并分析 TopHub 热榜数据，使用 Gemini AI 提供智能内容创作灵感。
---

# TopHub Trends Analysis Skill

这个 Skill 用于自动化获取 TopHub 热榜数据，结合 **Google Gemini AI** 进行智能分析，为内容创作者提供选题建议。

## 功能描述

1. **Fetch Hot List**: 抓取 TopHub 首页的实时热榜数据
2. **Analyze Trends**: 分析前 30 个热点，识别高流量潜力话题
3. **AI Analysis**: 使用 Gemini AI 生成智能创作建议（可选）
4. **Generate Report**: 生成包含选题建议的 Markdown 报告

## 使用方法

### 安装依赖

```bash
cd /Users/binginx/workspace/antigravity-skills
npm install
```

### 配置 API Key（可选，启用 AI 分析）

在项目根目录创建 `.env` 文件：

```bash
# Google Gemini API Key
GEMINI_API_KEY=your-api-key-here

# 可选：指定模型
GEMINI_MODEL=gemini-2.0-flash
```

### 运行脚本

```bash
npm run skill:trends
```

### 输出结果

脚本运行后，会在 `outputs/trends/` 目录下生成两个文件：

1. `tophub_hot_[timestamp].json`: 原始热榜数据
2. `tophub_analysis_[timestamp].md`: 热点分析报告（含 AI 分析）

## AI 分析功能

配置 `GEMINI_API_KEY` 后，报告将包含：

- **趋势洞察**: AI 分析热点背后的社会情绪
- **创作角度**: 5 个独特的内容切入角度
- **爆款预测**: 最有可能持续发酵的话题

## 依赖配置

确保已安装 Node.js 18+。

可选配置 `.env` 文件：

| 变量             | 说明                  | 默认值             |
| :--------------- | :-------------------- | :----------------- |
| `GEMINI_API_KEY` | Google Gemini API Key | -                  |
| `GEMINI_MODEL`   | 使用的模型            | `gemini-2.0-flash` |
| `MOCK_MODE`      | 使用模拟数据测试      | `false`            |
| `SCRAPE_TIMEOUT` | 抓取超时时间（毫秒）  | `30000`            |
