---
name: group5-pwa-and-open-data
overview: 为三位一体辅助系统实现第五组功能：完整 PWA 支持（manifest.json + service worker 离线缓存 + 应用图标，可添加到主屏幕并离线使用），以及开放数据集下载（从 SCHOOLS 数据生成 JSON/Markdown/CSV 三格式，提供页面下载入口，并生成 GitHub 存储副本与上传指引）。
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3B82F6"
      - "#2563EB"
      - "#1D4ED8"
    background:
      - "#F8FAFC"
      - "#FFFFFF"
      - "#EFF6FF"
    text:
      - "#1E293B"
      - "#64748B"
      - "#94A3B8"
    functional:
      - "#16A34A"
      - "#F59E0B"
      - "#EF4444"
todos:
  - id: pwa-base-files
    content: 创建 manifest.json 与 icon.svg（手写 3一 logo），更新 server.cjs MIME 支持 application/manifest+json
    status: completed
  - id: generate-png-icons
    content: 使用 [skill:多模态内容生成] 生成 512/192 PNG 应用图标并接入 manifest 与 apple-touch-icon
    status: completed
    dependencies:
      - pwa-base-files
  - id: service-worker
    content: 编写 sw.js：install 缓存应用壳、/api/ 网络优先、其余 cache-first、activate 清理旧缓存
    status: completed
    dependencies:
      - generate-png-icons
  - id: pwa-integration
    content: index.html 头部加入 manifest/theme-color/apple-touch-icon/iOS meta，底部注册 service worker
    status: completed
    dependencies:
      - service-worker
  - id: download-page
    content: 新增 DownloadPage 开放数据页：JSON/CSV/Markdown 三格式下载按钮、数据说明与 GitHub 链接，接入路由与导航
    status: completed
    dependencies:
      - pwa-integration
  - id: open-data-pack
    content: 编写 tools/export-data.cjs 生成 open-data/ 三格式数据包与 README 上传指引
    status: completed
    dependencies:
      - download-page
  - id: verify-group5
    content: 验证：acorn 语法、渲染测试、重启服务器、HTTP 验证 manifest/sw.js/图标可达、预览确认 PWA 可安装
    status: completed
    dependencies:
      - open-data-pack
---

## 产品概述

为三位一体辅助系统实现第五组"体验优化与开放输出"功能：将应用升级为完整 PWA（可添加到主屏幕、离线可用），并开放整理好的院校数据包下载（JSON / Markdown / CSV 三种格式），同步准备 GitHub 仓库存储内容。

## 核心功能

- **PWA 完整实现**：新增 manifest.json（应用名"三位一体辅助系统"/短名"三一辅助"、standalone 展示、蓝色主题色）、应用图标（SVG 手写 3一 logo + PNG 192/512）、service worker 离线缓存，支持添加到主屏幕
- **离线可用**：核心应用壳（index.html 本身含全部数据与样式）+ manifest + 图标被 SW 缓存；离线时首页、院校浏览、计算器、FAQ 等纯前端功能可用；/api/* 动态接口网络优先、失败时前端已有 localStorage 降级
- **开放数据下载页**：新增"数据"页面，一键下载 schools.json / schools.csv / schools.md（前端 Blob 从 SCHOOLS 生成，离线也可下载），附数据说明与 GitHub 仓库链接
- **GitHub 数据包**：项目内生成 open-data/ 目录（三种格式数据 + README 含上传指引），用户推送到 GitHub 仓库后填入仓库地址
- **入口接入**：App 路由新增 download 页，桌面导航加"数据"，首页功能卡片增加入口

## 边界

- GitHub 推送由用户执行（AI 无 GitHub 凭据），AI 负责生成数据文件与 README 上传指引；用户提供仓库地址后填入 DownloadPage 链接
- service worker 仅在 localhost 或 HTTPS 生效，本地 8080 可验证，生产部署需 HTTPS

## 技术栈

- 前端：React 18（unpkg UMD 全局加载，无构建）单文件 index.html，React.createElement 内联写法，与现有架构完全一致
- 后端：Node 原生 http server.cjs（8080 端口，已有 /api/* 路由与静态服务），扩展 MIME 映射
- PWA：手写 manifest.json + sw.js（无第三方依赖），SVG 手写图标 + 多模态内容生成 PNG 图标
- 数据导出：前端 Blob 生成下载；Node 脚本 tools/export-data.cjs 从 index.html 提取 SCHOOLS 生成 open-data/ 数据包

## 实现方案

### 1. PWA 基础文件

- **manifest.json**（项目根目录）：name"三位一体辅助系统"、short_name"三一辅助"、start_url"/"、display"standalone"、background_color"#F8FAFC"、theme_color"#3B82F6"、icons（icon.svg any + icon-512.png 512x512 purpose any maskable + icon-192.png 192x192）
- **icon.svg**：手写 3一 logo（渐变蓝圆角方块 + 白色"3一"文字，与现有 gradient-primary 视觉一致）
- **server.cjs**：mime 映射增加 'manifest':'application/manifest+json'；确认 sw.js 走已有 application/javascript

### 2. 应用图标 PNG

- 使用 [skill:多模态内容生成] 生成 512x512 应用图标 PNG（提示词：扁平化蓝色渐变圆角方块、白色"3一"字样、简洁现代教育风格），输出 icon-512.png；icon-192.png 由同一生成结果提供（浏览器可缩放，或用 SVG 渲染备用）

### 3. service worker（sw.js）

- **install**：缓存 app shell 列表 ['/','/manifest.json','/icon.svg','/icon-192.png','/icon-512.png']，使用 CACHE_NAME='3in1-v1' 版本管理
- **fetch 策略**：
- /api/ 开头：network-first（在线取最新，失败回缓存或离线 fallback），保证树洞/计数/纠错实时性
- 其余（静态资源）：cache-first（离线可用核心功能）
- **activate**：清理旧版本缓存

### 4. index.html 接入 PWA

- head 增加：`<link rel="manifest" href="manifest.json">`、`<meta name="theme-color" content="#3B82F6">`、`<link rel="apple-touch-icon" href="icon-192.png">`、iOS meta（apple-mobile-web-app-capable / status-bar-style）
- 底部脚本注册：`navigator.serviceWorker.register('sw.js')`（load 事件后，try/catch 静默失败不阻塞页面）

### 5. 开放数据下载页（DownloadPage）

- 页面区块：数据概览卡（15 所院校、数据字段说明、更新日期）、三格式下载按钮卡（JSON/CSV/Markdown，前端从 SCHOOLS 序列化生成 Blob 触发下载，文件名 schools.json/schools.csv/schools.md）、GitHub 仓库卡（仓库链接占位，用户提供后填入）、使用说明卡（数据来源、字段含义、许可声明）
- 数据生成逻辑：内联函数 buildSchoolsJson/CSV/MD，CSV 转义引号与逗号，MD 用表格呈现核心字段（名称/校区/学费/录取分/满意度/简章链接）

### 6. open-data/ 数据包 + GitHub 指引

- **tools/export-data.cjs**（一次性脚本）：从 index.html 提取 `var SCHOOLS=[...]` 段，vm 执行获得数组，生成 open-data/schools.json、schools.csv、schools.md、README.md
- **open-data/README.md**：数据说明 + GitHub 上传指引（git init / add / commit / remote add / push 步骤），提示用户将仓库地址反馈给开发者填入 DownloadPage

### 7. 导航接入

- App 路由加 `case 'download'` → DownloadPage；桌面导航加"数据"；HomePage 功能卡片加"开放数据"

## 性能与可靠性

- SW 缓存版本化（CACHE_NAME 递增即失效旧缓存），避免更新后加载旧壳
- /api/ 不缓存，社区数据实时性不受影响；离线时接口失败走现有 localStorage 降级
- 数据导出在前端运行时生成（内存 SCHOOLS），无网络请求、离线可用；open-data/ 为静态副本保证 GitHub 包完整性
- export-data.cjs 单次运行，不进入运行时；提取逻辑用 vm 隔离执行避免污染
- 潜在瓶颈：index.html 约 94KB，首屏缓存一次即可；CSV/MD 生成遍历 15 所院校，开销可忽略

## 目录结构

```
d:/three-one-assistant/
├── index.html              [MODIFY] head 加 manifest/theme-color/apple-touch-icon/iOS meta；底部注册 SW；新增 DownloadPage 组件；App 路由与导航、HomePage 卡片接入
├── server.cjs              [MODIFY] mime 增加 'manifest':'application/manifest+json'
├── manifest.json           [NEW] PWA 应用清单（名称/图标/主题色/start_url）
├── sw.js                   [NEW] service worker：install 缓存 app shell、/api/ 网络优先、其余 cache-first、activate 清理
├── icon.svg                [NEW] 手写 3一 logo（SVG）
├── icon-192.png            [NEW] 192x192 应用图标（多模态生成或 SVG 渲染）
├── icon-512.png            [NEW] 512x512 应用图标（多模态生成）
├── tools/
│   └── export-data.cjs     [NEW] 从 index.html 提取 SCHOOLS → 生成 open-data/ 三格式数据
└── open-data/              [NEW] GitHub 数据包（用户推送）
    ├── schools.json        [NEW] 15 所院校完整结构化数据
    ├── schools.csv         [NEW] 核心字段表格数据
    ├── schools.md          [NEW] 人类可读数据文档
    └── README.md           [NEW] 数据说明 + GitHub 上传指引
```

延续现有"清新教育风"（浅蓝主色 #3B82F6 系 + 白色卡片 + 圆角阴影），保持与已完成页面视觉一致。开放数据页采用卡片式分区：顶部数据概览卡（15 所院校统计与字段说明）、中部三格式下载卡（JSON/CSV/Markdown 各一张按钮卡，悬停微抬升、下载后绿色成功反馈）、GitHub 仓库卡（深色图标 + 链接按钮）、底部使用说明卡（浅灰底、分条列出）。PWA 图标为渐变蓝圆角方块内白色"3一"字样，与首页 logo 呼应。下载按钮使用主蓝渐变，hover 阴影加深；页面整体 max-w-md 居中、上下留白舒适。

## Agent Extensions

### Skill

- **多模态内容生成**
- Purpose: 生成 PWA 应用图标 PNG（512x512 与 192x192），提示词限定为扁平化蓝色渐变圆角方块、白色"3一"字样、简洁现代教育风格，与现有 logo 视觉一致
- Expected outcome: 产出 icon-512.png / icon-192.png 两个应用图标文件，接入 manifest.json 与 apple-touch-icon，使 PWA 在桌面与 iOS 添加主屏幕时显示正确图标