---
name: football-hotspot
description: 收集过去24小时足球热点新闻，AI 总结 Top 10 话题，生成 Nano Banana 风格图片提示词和小红书笔记。
---

# Football Hotspot Skill ⚽

自动收集足球热点新闻，提取 Top 10 重要话题，生成专业图片提示词和小红书风格笔记。

## 🤖 Agent 模式使用 (推荐)

在 Gemini CLI 或其他 Agent 环境中，使用以下命令获取数据：

```bash
npm run skill:football -- --json --no-ai
```

**输出格式**:
返回包含过去 24 小时 Top 10 足球热点的 JSON 对象，包含话题、热度、来源等信息。

**Agent 协作流程**:

1. Agent 调用该工具获取实时足球热榜 JSON。
2. Agent 利用自身大模型能力进行深度分析、小红书创作或球迷舆情洞察。

## 🚀 独立运行模式

作为独立工具使用时，会生成完整报告：

```bash
# 完整流程：抓取 + AI 分析 + 图片提示词 + 小红书笔记
npm run skill:football

# 仅抓取数据，不使用 AI
npm run skill:football -- --no-ai

# JSON 输出模式（适合脚本调用）
npm run skill:football -- --json
```

### 配置 API Key

在项目根目录 `.env` 文件中配置：

```bash
GEMINI_API_KEY=your-api-key-here
```

## 📤 输出文件

运行后在 `outputs/football-hotspot/` 目录生成：

| 文件                      | 说明                   |
| ------------------------- | ---------------------- |
| `football_hotspot_*.json` | 原始热点数据           |
| `football_analysis_*.md`  | AI 分析报告 + Top 10   |
| `image_prompts_*.json`    | Nano Banana 图片提示词 |
| `xiaohongshu_notes_*.md`  | 小红书风格笔记         |

## 功能特性

1. **24 小时热点**: 只收集过去 24 小时内的足球新闻
2. **智能筛选**: 自动过滤足球相关内容（球员、联赛、比赛等）
3. **AI 总结**: 使用 Gemini 提取 Top 10 重要话题
4. **图片生成**: Nano Banana 风格专业提示词
5. **小红书适配**: 生成符合平台风格的笔记内容
