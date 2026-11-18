# 三位一体辅助系统

浙江「三位一体」（学考 + 校测 + 高考）报考辅助系统。把 38 所招生院校的录取规则从招生章程里读成结构化数据，**每个数字都附可点开的官方来源**，查不到就留空，不推测、不编造。

> 在线体验：用 Qoder Sites 部署的演示站（参赛版本，社区功能为单机模式）

## ✨ 功能

- 🔍 **院校筛选**：45 所院校（2026 招生 38 所 + 7 所历史备查），按选科、类别、年份筛选
- 🧮 **综合分计算器**：正算综合分，也可反向推算还差多少分
- ⚖️ **多校对比**：最多 5 所院校并排，以首列为基准可视化差异
- 🏫 **院校详情**：校测形式与占比、转专业限制、学费、住宿、历年竞争比
- 📝 **我的档案**：收藏、折算历史、报名时间线、材料清单
- 💬 **树洞社区**：匿名分享经验（演示站为单机版）
- 📦 **开放数据下载**：6 张 CSV + JSON + Markdown，UTF-8 BOM，Excel 直接打开
- 📱 **PWA**：可添加到主屏幕，核心功能离线可用

## 🚀 本地运行

```bash
cd live-app
node server.cjs
# 访问 http://localhost:8080
```

> 前端为单文件 `index.html`（React 18 UMD，无构建、零外部 CDN），后端为 Node 原生 http。

**跑测试**（基线 4585 项）：

```bash
node live-app/test/run-tests.cjs
```

## 📦 开放数据

`live-app/open-data/` 目录提供整理好的院校数据，也可在应用内「开放数据」页按需下载。

| 文件 | 说明 |
|------|------|
| `schools.json` | 完整结构化数据（45 所院校全字段） |
| `schools.csv` | 院校总览 |
| `formulas.csv` / `majors.csv` / `admission.csv` / `exam-formats.csv` / `application-steps.csv` | 折算规则 / 专业明细 / 历年竞争比 / 校测形式 / 报名流程 |
| `schools.md` | 人类可读数据文档 |

数据来源：浙江省教育考试院、各高校招生网、阳光高考网。

## 🗂 目录结构

```
live-app/            # 应用本体（唯一维护版）
├── index.html       # 前端单文件（React 18 UMD，含全部数据与页面）
├── server.cjs       # 本地后端（静态服务 + 树洞/计数/纠错 API）
├── functions/       # Cloudflare Pages Functions（线上后端）
├── sw.js            # Service Worker（PWA 离线缓存）
├── manifest.json    # PWA 清单
├── open-data/       # 开放数据包
├── test/            # Node 原生零依赖测试
└── tools/           # 数据导入与导出脚本
```

## 📄 许可证

[MIT](LICENSE)
