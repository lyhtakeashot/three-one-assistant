# 部署到 Cloudflare Pages（D1 + KV）

让树洞等社区功能拥有**长期免费网址**并实现**跨设备数据实时互通**。

> 前置条件：
> 1. 已注册 [Cloudflare](https://dash.cloudflare.com) 账号（免费）
> 2. 代码已在 GitHub 仓库 `lyhtakeashot/three-one-assistant`（公开）
> 3. 仓库已包含本次新增的 `live-app/functions/` 与 `live-app/schema.sql`（应用代码位于仓库 `live-app/` 目录）

---

## 一、整体架构

```
浏览器（index.html，同源 fetch /api/*，每 8s 轮询树洞）
      │
      ▼
Cloudflare Pages（https://你的项目名.pages.dev）
  ├── 静态：index.html / sw.js / manifest / 图标 / open-data
  └── Pages Functions：functions/api/*（按请求触发，无常驻进程，不会像容器 3h 回收）
        ├── treehole 列表/发帖      → D1 数据库（绑定名 DB）
        ├── treehole/:id/like|reply|pin|report → D1
        ├── counter 访问计数        → KV（绑定名 COUNTER_KV）
        └── feedback 数据纠错       → D1
```

- **D1（SQLite）**：帖子/回复/纠错。事务安全、强一致、5GB 免费
- **KV**：访问计数。允许最终一致，10万读/天免费
- 树洞"近实时"：页面每 8 秒轮询拉取最新列表，发帖约 10 秒内全平台可见

---

## 二、操作步骤（约 10 分钟）

### 第 1 步：创建 Pages 项目并连接 GitHub

1. 打开 Cloudflare Dashboard → 左侧 **Workers 和 Pages** → **创建** → **Pages** → **连接到 Git**
2. 授权 GitHub，选择仓库 `lyhtakeashot/three-one-assistant`
3. 配置构建：
   - **生产分支**：`main`
   - **框架预设**：无（None）
   - **根目录（Root directory）**：`live-app`  ← 关键！（应用代码位于仓库 live-app/ 目录）
   - **构建命令**：留空  ← 关键！（不要跑 vite，那套已弃用）
   - **构建输出目录**：留空（保持根目录，即静态文件直接在根）
4. 点击 **保存并部署**，等待首次部署完成

### 第 2 步：创建 D1 数据库

1. Dashboard → 左侧 **Workers 和 Pages** → **D1** → **创建数据库**
2. 名称随意（如 `three_one_db`），地区选 **WNAM** 或就近
3. 创建后进入数据库 → **控制台（Console）**，把 `schema.sql`（项目根目录）内容整体粘贴执行

### 第 3 步：创建 KV 命名空间

1. Dashboard → **Workers 和 Pages** → **KV** → **创建命名空间**
2. 名称：`counter_kv`（任意，绑定名才是关键）
3. 创建即可，无需预置数据

### 第 4 步：绑定 D1 与 KV 到 Pages 项目

1. 进入刚创建的 **Pages 项目** → **设置（Settings）** → **函数（Functions）**
2. **D1 数据库绑定** → 添加绑定：
   - 变量名称：`DB`（必须与 functions 代码一致）
   - 数据库：选择第 2 步创建的 `three_one_db`
3. **KV 命名空间绑定** → 添加绑定：
   - 变量名称：`COUNTER_KV`（必须一致）
   - 命名空间：选择第 3 步创建的 `counter_kv`
4. 绑定会触发自动重新部署（若未自动，点 **部署** 里的 **重试部署**）

### 第 5 步：验证上线

打开 `https://你的项目名.pages.dev`，按下面的验证清单逐项检查。

---

## 三、验证清单

| 功能 | 操作 | 期望 |
|------|------|------|
| 页面加载 | 打开根网址 | 首页正常、无控制台报错 |
| 树洞互通 | 设备A发帖 → 设备B等 ≤10s | B 自动看到新帖（轮询生效） |
| 点赞 | 同一 userId 连续点两次 | ❤ 数 0→1→0（幂等） |
| 回复/置顶/举报 | 在树洞帖上操作 | 均正常返回 |
| 匿名序号 | 连续发 2 帖 | aid 为 匿名0001、匿名0002 |
| 用户计数 | 无痕窗口访问首页 | 横幅数字 +1；再刷新不重复 +1 |
| 数据纠错 | 提交一条反馈 | 返回"已提交" |
| 离线/PWA | 手机添加到主屏幕 | 可安装、断网后核心页仍可用 |
| 数据下载 | 开放数据页 | JSON/CSV/MD 均可下载 |

> 建议在手机（同网络或 4G）再开一次验证跨设备互通。

---

## 四、常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `/api/*` 全部 404 | functions 未生效 | 检查 Pages 项目 **根目录** 是否 = `live-app`；确认 `functions/` 已推送 |
| 树洞返回 500 | D1 未绑定/表未建 | 确认绑定变量名是 `DB`；在 D1 Console 执行过 schema.sql |
| 计数不涨或 NaN | KV 未绑定 | 确认绑定变量名是 `COUNTER_KV` |
| 发帖报错"绑定名"类 | 绑定名不一致 | Dashboard 绑定名必须与代码 `context.env.DB` / `env.COUNTER_KV` 一致 |
| 页面正常但改完代码没生效 | 部署了旧版 | 重新 push 触发部署，或 Dashboard 手动重试部署 |
| CORS 报错 | 跨域名调试 | 已内置 `functions/api/_middleware.js`，若仍出现请确认访问的是 `*.pages.dev` 域名而非本地 |

---

## 五、绑定名速查（代码已按此约定）

| 绑定 | 变量名 | 用途 |
|------|--------|------|
| D1 | `DB` | posts / feedback / meta 表 |
| KV | `COUNTER_KV` | 访问计数 `count` 键 |

如需改名，请同步修改 `functions/**/*.js` 中 `context.env.XXX` 的引用。

---

## 六、可选：绑定自定义域名

Pages 项目 → **自定义域** → 设置自定义域，按 Cloudflare 引导添加（需域名托管在 Cloudflare）。

---

## 七、本地开发不受影响

- 本地仍用 `node server.cjs`（8080，JSON 文件存储），测试 `node test/run-tests.cjs`（767 项）继续全绿
- 云端与本地业务规则同源于 `functions/lib/pure.js`，行为一致
