---
name: group4-community-features
overview: 为三位一体辅助系统实现第四组互动社区功能：扩展 server.cjs 增加轻量 REST API（树洞/计数/纠错存服务器 JSON 文件），增强树洞为社区完整版（点赞+回复+分类+置顶+举报），扩充政策 FAQ、加入鼓励话语、用户计数与数据纠错入口。
design:
  architecture:
    framework: react
  styleKeywords:
    - 清新
    - 社区卡片流
    - 暖黄语录
    - 圆角阴影
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
      - "#FFF7ED"
    text:
      - "#1E293B"
      - "#64748B"
      - "#94A3B8"
    functional:
      - "#F59E0B"
      - "#EF4444"
      - "#16A34A"
todos:
  - id: extend-server-api
    content: 扩展 server.cjs：新增 /api/treehole、/api/counter、/api/feedback 路由，JSON 原子持久化、CORS、body 解析与输入长度校验
    status: completed
  - id: frontend-api-layer
    content: index.html 新增 apiGet/apiPost 封装与离线降级（localStorage 缓存、userId 存储），供社区功能复用
    status: in_progress
    dependencies:
      - extend-server-api
  - id: treehole-community
    content: 重写 TreeholePage 为社区完整版：分类筛选、点赞、回复、置顶、举报，接后端并在 API 失败时降级本地模式
    status: completed
    dependencies:
      - frontend-api-layer
  - id: faq-encourage
    content: 扩充 FAQ_DATA 科普问答至 10+ 条，新增 ENCOURAGE_DATA 语录数组并实现首页语录横幅（随机+换一句）与树洞鼓励卡片
    status: completed
  - id: counter-feedback
    content: 实现"我是第 N 位使用者"计数横幅（页脚累计显示）与数据纠错 FeedbackPage 表单页，接入导航
    status: completed
    dependencies:
      - frontend-api-layer
  - id: verify-group4
    content: 完整验证：重启服务器，用 HTTP 请求测试全部 API，acorn 检查脚本语法，runtime 渲染各页面，预览确认
    status: completed
    dependencies:
      - treehole-community
      - faq-encourage
      - counter-feedback
---

## 产品概述

为三位一体辅助系统实现第四组"互动社区与情感"功能：通过扩展 server.cjs 提供轻量 API（树洞/计数/纠错持久化到服务器 JSON 文件，同网用户可共享），将树洞升级为社区完整版，并新增鼓励话语、科普问答扩充、用户计数、数据纠错入口。API 不可达时前端自动降级为 localStorage 本地模式。

## 核心功能

- **鼓励话语**：首页展示随机励志语录横幅，支持"换一句"切换；树洞页穿插鼓励卡片
- **政策FAQ扩充**：FAQ 折叠面板从 6 条扩至 10+ 条，新增"什么是综合分""校测占比怎么定""提前批与普通批是否冲突"等高频科普问答
- **树洞社区完整版**：匿名发帖 + 分类标签（经验/互助/吐槽/疑问）+ 点赞（可取消，按用户去重）+ 回复 + 置顶展示 + 举报入口，数据存服务器共享
- **"我是第 N 位使用者"计数**：首次访问显示用户序号横幅，之后在页脚显示累计访问人数，提供共建成就感
- **数据纠错入口**：表单提交（院校、错误字段、错误描述、联系方式选填）到服务器，成功/降级均有明确反馈

## 技术栈

- 前端：React 18（unpkg UMD 全局加载，无构建）单文件 `index.html`，React.createElement 内联写法，fetch 调 API
- 后端：Node 原生 http（无第三方依赖），扩展 `server.cjs` 增加 `/api/*` 路由，JSON 文件持久化
- 数据：`data/treehole.json`、`data/counter.json`、`data/feedback.json`

## 技术架构

### 系统架构

轻量 B/S：浏览器 fetch 同源 `/api/*` → server.cjs 读写 data/*.json；请求失败时前端降级 localStorage。部署形态不变（node server.cjs 常驻服务器即可共享数据）。

### 后端 API 设计（server.cjs 扩展）

在现有静态文件服务回调开头增加 API 分支，路由前缀 `/api/`：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/treehole | 返回全部帖子，置顶排前、按时间倒序 |
| POST | /api/treehole | 发布帖子 `{content, category}`，服务器生成匿名 id |
| POST | /api/treehole/:id/like | `{userId}` 幂等点赞/取消（数组含则移除） |
| POST | /api/treehole/:id/reply | `{content, aid}` 追加回复 |
| POST | /api/treehole/:id/pin | 切换置顶标记 `{pinned}` |
| POST | /api/treehole/:id/report | `{userId}` 举报计数 |
| GET | /api/counter | 返回 `{count, userId}`；新访客（无 userId 参数）count+1 并生成 userId |
| POST | /api/feedback | `{schoolId, schoolName, field, detail, contact}` 写入反馈 |
| OPTIONS | 任意 | 204 CORS 预检（含 Access-Control-Allow-* 头） |


实现要点：

- 数据文件：`readJson(file, def)` / `writeJson(file, data)`，用 `writeFileSync(临时文件) + renameSync` 原子替换，Node 单线程串行处理无竞态
- body 解析：`parseBody` 限制 100KB，JSON 解析失败回退 `{}`，所有字段做字符串长度校验（content ≤ 500、reply ≤ 200、detail ≤ 1000）
- `genId()`：`Date.now().toString(36)+随机` 生成帖子/回复/反馈 id
- 首次启动自动 `mkdirSync(data, {recursive:true})`，文件不存在时读默认值（空数组 / {count:0}）
- 匿名 id：服务器用计数器生成 `匿名0001` 递增，避免前端随机碰撞

### 前端实现（index.html）

1. **API 封装**（utils 区新增）：

```js
function apiGet(path,cb){fetch(path).then(r=>r.json()).then(cb).catch(function(){cb(null)})}
function apiPost(path,body,cb){fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()).then(cb).catch(function(){cb(null)})}
```

所有回调式（非 Promise），兼容现有代码风格；cb(null) 表示失败进入降级分支。

2. **TreeholePage 重写**：状态含 posts/categoryFilter/text/replyOpenId/replyText；挂载时 `apiGet('/api/treehole')` 成功则渲染服务器数据并缓存 localStorage，失败读 localStorage 并显示"离线模式"提示；发帖/点赞/回复/举报均 apiPost，失败降级本地存储+提示；点赞用本地 state 乐观更新，userId 取自 counter 接口（存 localStorage `3in1_uid`）用于去重。

3. **用户计数**：App 挂载或 HomePage 中 `apiGet('/api/counter')`；localStorage 标记 `3in1_counterShown`；首次显示"你是第 N 位使用者"可关闭横幅；页脚显示"已有 N 位使用者"（API 失败隐藏）。

4. **数据纠错 FeedbackPage**：院校下拉（SCHOOLS）+ 手动名称输入、错误字段单选（学费/录取分/满意度/校测/其他）、错误描述 textarea、联系方式选填；提交成功显示感谢提示；失败降级生成可复制的纠错文本。

5. **FAQ 扩充**：FAQ_DATA 数组追加 4-6 条（综合分含义、校测占比规则、提前批与普通批关系、报名材料、入围后志愿规则等），FAQPage 组件无需改动。

6. **鼓励话语**：新增 ENCOURAGE_DATA 数组（10+ 条），HomePage hero 下加语录卡片（随机 + 换一句按钮）；TreeholePage 顶部穿插鼓励卡片。

7. **导航**：App 路由加 `case 'feedback'`；桌面导航加"纠错"；首页卡片加"数据纠错"入口。

## 性能与可靠性

- 数据量小（帖子/反馈数百条内），同步 JSON 读写单次 < 1ms，无性能瓶颈；不做缓存以保实时一致性
- 请求体限 100KB，字段长度校验防滥用；写入原子替换防文件损坏
- 前端所有 API 调用带 catch 降级，纯静态部署（无 server.cjs）时核心功能（含树洞本地模式）仍可用
- 点赞/举报幂等：同一 userId 重复请求不重复计数

## 目录结构

```
d:/three-one-assistant/
├── index.html        [MODIFY] FAQ_DATA/ENCOURAGE_DATA 扩充、apiGet/apiPost 封装、TreeholePage 重写、HomePage 语录横幅、用户计数横幅、FeedbackPage 新增、App 路由与导航更新
├── server.cjs        [MODIFY] 增加 /api/* 路由（treehole/counter/feedback）、CORS、body 解析、JSON 原子持久化、输入校验
└── data/             [NEW] 服务器运行时自动创建
    ├── treehole.json [NEW] 树洞帖子数组
    ├── counter.json  [NEW] {count, lastAnon} 访问计数与匿名序号
    └── feedback.json [NEW] 纠错反馈数组
```

## 设计风格

延续现有"清新教育风"：浅蓝主色 + 白色卡片 + 圆角阴影，保持与已完成页面的视觉一致性。情感化增强：鼓励语录使用暖黄渐变横幅与柔和插画式 emoji 图标；树洞社区采用"分类标签 + 卡片流"布局，置顶帖用黄底标记、点赞按钮红色爱心反馈、回复区浅灰底展开；纠错表单用分步卡片与绿色成功反馈。微交互：语录"换一句"点击卡片轻微旋转淡入，点赞按钮缩放动画，分类切换滑动效果。

## 页面布局

- 首页：hero 下方新增语录横幅卡片（语录文字 + "换一句"按钮），首次访问叠加"你是第 N 位使用者"横幅（可关闭）
- 树洞：顶部分类 Tab（全部/经验/互助/吐槽/疑问）+ 发帖框 + 鼓励卡片；帖子卡片流含置顶标、分类 tag、内容、匿名作者/时间、❤点赞数、回复展开按钮、举报入口
- FAQ：保持折叠面板，扩充条目
- 纠错页：院校选择 + 错误字段单选 + 描述 textarea + 联系方式输入 + 提交按钮，成功绿色提示卡片
- 页脚：追加"已有 N 位使用者"