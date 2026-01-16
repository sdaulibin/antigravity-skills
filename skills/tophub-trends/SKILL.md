---
name: tophub-trends
description: 获取并分析 TopHub 热榜数据。在 Agent 模式下，可提供结构化 JSON 数据供 Agent 进行深度分析和创作建议。
---

# TopHub Trends Analysis Skill

这个 Skill 用于自动化获取 TopHub 热榜数据。它既可以作为独立脚本生成报告，也可以作为 Agent 的工具提供原始数据。

## 🤖 Agent 模式使用 (推荐)

在 Gemini CLI 或其他 Agent 环境中，Agent 应使用以下命令获取数据：

```bash
npm run skill:trends -- --json --no-ai
```

**输出格式**: 
返回一个包含 `top30` 热门话题及其 `score`（潜力分）、`category`（分类）和 `heat`（热度）的 JSON 对象。

**Agent 协作流程**:
1. Agent 调用该工具获取实时热榜 JSON。
2. Agent 利用自身大模型能力，结合热榜数据进行深度洞察、跨平台创作建议或舆情分析。

## 🚀 独立运行模式

作为独立工具使用时，它会生成一份完整的 Markdown 报告。

### 运行脚本

```bash
# 生成包含基础分析的报告
npm run skill:trends

# (可选) 如果配置了 GEMINI_API_KEY，可开启内置 AI 分析
npm run skill:trends -- --use-ai
```

### 配置 API Key (仅用于独立模式)
在项目根目录创建 `.env` 文件：
```bash
GEMINI_API_KEY=your-api-key-here
```

## 功能特性

1. **实时抓取**: 获取 TopHub 首页的最新热点。
2. **多维评分**: 基于热度、来源平台和排名计算话题潜力（0-100分）。
3. **自动分类**: 自动识别科技、财经、娱乐、社会等领域。
4. **Agent 友好**: 支持 `--json` 输出，无缝对接大模型工作流。