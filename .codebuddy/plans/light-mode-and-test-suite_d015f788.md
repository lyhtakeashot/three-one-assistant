---
name: light-mode-and-test-suite
overview: 将应用内 4 处深色背景区块（首页用户计数横幅、冲稳保筛选 tab、树洞分类 tab、GitHub 按钮）改为浅色系（浅蓝底深蓝字）提升可读性；并为项目建立零依赖的 Node 原生测试套件，覆盖数据完整性、计算器公式、API 接口、页面渲染、HTML/PWA 结构五类测试，一条命令跑完。
todos:
  - id: light-theme
    content: 将 index.html 中 4 处深色背景（首页横幅 bg-p600、冲稳保 tab bg-s8、树洞分类 tab bg-s8、GitHub 按钮 bg-s8）改为浅色系 class，并 acorn 语法验证
    status: completed
  - id: test-lib
    content: 创建 test/run-tests.cjs 入口与 test/lib/（extract.cjs 提取 SCHOOLS+utils、mock-react.cjs 环境桩）
    status: completed
  - id: data-calc-tests
    content: 编写 data.test.cjs（院校字段完整性）与 calculator.test.cjs（公式 round-trip、筛选逻辑）
    status: completed
    dependencies:
      - test-lib
  - id: api-render-tests
    content: 编写 api.test.cjs（8081 子进程测全部 API 并清理）与 render.test.cjs（13 组件 mock 渲染）
    status: completed
    dependencies:
      - test-lib
  - id: html-test
    content: 编写 html.test.cjs（PWA 结构、manifest 合法性、深色改造回归断言）
    status: completed
    dependencies:
      - test-lib
  - id: verify-all
    content: 运行 node test/run-tests.cjs 全绿，重启 8080 服务器确认页面 200 与浅色 class，预览验证
    status: completed
    dependencies:
      - light-theme
      - data-calc-tests
      - api-render-tests
      - html-test
---

## 需求概述

1. **深色背景改浅色**：应用内 4 处深色背景（墨蓝黑 bg-s8、深蓝 bg-p600）不利于信息阅读，全部改为浅色系（浅蓝底 + 深蓝字），保持对比度与可读性。
2. **补充测试用例**：项目当前无任何测试，新增 Node 原生零依赖测试套件，覆盖数据完整性、计算器公式、API 接口、页面渲染、HTML/PWA 结构 5 类测试，一条命令全部跑完，用于检验前五组功能是否实现。

## 深色背景改造点（index.html 共 4 处）

- 首页"你是第 N 位使用者"计数横幅：bg-p600 深蓝底 → 浅蓝底 + 深蓝字
- 院校筛选"冲稳保"tab 选中态：bg-s8 墨蓝黑 → 浅蓝高亮 + 深蓝字
- 树洞分类 tab 选中态：bg-s8 墨蓝黑 → 浅蓝高亮 + 深蓝字
- 开放数据页 GitHub 按钮：bg-s8 墨蓝黑 → 浅色按钮

## 测试套件目标（Node 原生，零第三方依赖）

- 数据完整性：15 所院校字段、URL 格式、满意度 0-5、学考折算等级递减、权重和=1
- 计算器公式：calcResult 与手工公式一致、反推后再正算 round-trip 一致、筛选逻辑
- API 接口：treehole 全操作、counter 递增与幂等、feedback、400 校验、CORS
- 页面渲染：13 个组件 mock 环境下无异常渲染
- HTML/PWA：manifest link、theme-color、apple-touch-icon、sw.js 注册、图标文件存在

## 技术栈

- 前端：React 18（unpkg UMD，无构建）单文件 index.html，沿用现有 React.createElement 内联写法
- 后端：Node 原生 http server.cjs（8080，已有 /api/* 路由与 JSON 持久化）
- 测试：Node 原生脚本（assert + 自定义 PASS/FAIL 计数器，零第三方依赖，不引入 node_modules）

## 实现方案

### 一、深色背景改浅色（index.html 4 处 class 替换）

复用现有 CSS 变量类（bg-p50 #EFF6FF、text-p #2563EB、bg-p500 #3B82F6），不改样式表、只改组件 class：

| 位置 | 现状 | 改为 |
| --- | --- | --- |
| 首页计数横幅(222行) | bg-p600 text-w | bg-p50 text-p（内层关闭按钮保持 bg-w text-p） |
| 冲稳保 tab 选中(279行) | bg-s8 text-w | bg-p500 text-w（蓝底白字仍清晰，或 bg-p50 text-p 浅色方案，以可读性为准） |
| 树洞分类 tab 选中(522行) | bg-s8 text-w | bg-p500 text-w |
| GitHub 按钮(853行) | bg-s8 text-w | bg-p500 text-w（主蓝按钮，与全局按钮风格统一） |


改造后全站无大面积深色块，浅蓝底/白底为主，信息层级清晰。

### 二、测试套件（test/ 目录，Node 原生）

```
d:/three-one-assistant/
├── test/
│   ├── run-tests.cjs          # 统一入口：顺序执行全部测试，汇总 PASS/FAIL，失败非 0 退出
│   ├── lib/
│   │   ├── extract.cjs        # 从 index.html 提取 SCHOOLS 与 utils 函数（vm 隔离，复用 export-data.cjs 做法）
│   │   └── mock-react.cjs     # mock React/ReactDOM/DOM/localStorage/fetch/navigator（复用既有 runtime_test 思路）
│   ├── data.test.cjs          # 数据完整性
│   ├── calculator.test.cjs    # 计算器公式与筛选
│   ├── api.test.cjs           # API 集成（子进程 8081 端口起 server，测后清理 data/ 并 kill）
│   ├── render.test.cjs        # 13 个组件 mock 渲染
│   └── html.test.cjs          # HTML/PWA 结构
└── index.html                 # [MODIFY] 4 处深色 class 改浅色
```

**关键实现细节**：

1. **run-tests.cjs**：`process.argv` 支持指定单文件或全部；每个测试文件导出 `run(t)` 函数（t = {pass, fail} 计数器），入口按序 require 执行，最后打印 `N passed, M failed`，有失败则 `process.exit(1)`。

2. **lib/extract.cjs**：

- `extractSchools()`：定位 `var SCHOOLS=[`，括号配对找到数组结束，`vm.runInContext` 隔离执行返回数组（复用 tools/export-data.cjs 已验证的做法）
- `extractUtils()`：截取 utils 区（calcResult/reverseGk/reverseXs/filterSchools/calcXuekao 等函数源码段），用 vm 拼接 `module.exports` 导出，供计算器测试调用真实实现

3. **lib/mock-react.cjs**：提供 `createMockEnv()` 返回可注入 global 的 React 桩（useState 返回 [init, fn]、useMemo 执行 fn、useEffect 空执行）、ReactDOM.createRoot 桩、document/localStorage/fetch（reject）/navigator（serviceWorker 桩）桩，渲染测试前注入，测后恢复。

4. **data.test.cjs**（数据完整性，约 20+ 断言）：

- 院校数量 ≥ 15；每所 id 唯一、name/shortName 非空、aliases 数组
- info：campuses 非空、website 以 http 开头、admissionsPhone 匹配电话格式、tuitionGeneral 非空
- formula：weights.xuekao + xiaokao + gaokao = 1（±0.001）；A ≥ B ≥ C ≥ D 且 A > 0；fullScore > 0
- examFormat：hasWrittenTest/hasInterview 布尔；writtenTestSubjects 仅在有笔试时非空
- majors：每所 ≥ 1 个，requiredSubjects 是合法选科（SUBJECTS 集合）
- admission：minScore 在 0-100；satisfaction：overall/environment/life 均在 0-5
- transferRestriction.restricted 布尔；applicationSteps 按 step 递增；brochureUrl 以 http 开头

5. **calculator.test.cjs**（公式正确性，约 10 断言）：

- calcResult：给定学考等级/校测/高考，手工按公式 `学考折算×w1 + 校测×w2 + 高考折算×w3` 计算比对（取 2-3 所不同权重院校）
- reverseGk round-trip：反推高考分后代入 calcResult，综合分 ≈ 目标值（±0.01）
- reverseXs round-trip：反推校测分后代入 calcResult，综合分 ≈ 目标值（±0.01）
- filterSchools：选科过滤（不满足限选科目则排除）、搜索（短名/别名命中）、冲稳保分层（diff>5 safety、diff<-5 reach）

6. **api.test.cjs**（API 集成，约 18 断言，复用此前 e2e 验证过的场景）：

- 读取 server.cjs 源码替换 PORT=8081，spawn 子进程（cwd 指向 d:/three-one-assistant，data/ 用后即清）
- counter：连续两次计数 +1；带 userId 重复请求不重复计数
- treehole：POST 发帖（匿名递增 0001/0002、非法分类回退疑问）、空内容 400、GET 列表置顶在前、like 点赞/取消幂等、reply 追加、pin 切换、report 计数、不存在 id 404
- feedback：正常提交 200、空描述 400
- CORS：OPTIONS 返回 204
- 测毕：kill 子进程、删除临时 data/ 目录（测试专用，不影响生产数据）

7. **render.test.cjs**（13 个组件渲染）：

- mock 环境注入后，逐个执行 HomePage/SchoolListPage/SchoolDetailPage/CalculatorPage/FavoritesPage/FAQPage/TreeholePage/ProfilePage/ComparePage/PathComparePage/FeedbackPage/DownloadPage/App，断言返回对象且无异常
- 每组件独立 try/catch，失败计 FAIL 并输出组件名

8. **html.test.cjs**（HTML/PWA 结构，约 10 断言）：

- index.html 含 `<link rel="manifest"`、theme-color、apple-touch-icon、icon.svg favicon、底部 `serviceWorker.register('sw.js')`
- manifest.json 可 JSON.parse，icons 数组引用的 icon.svg/icon-192.png/icon-512.png 文件均存在
- sw.js 存在且含 CACHE_NAME、install/activate/fetch 监听
- 深色改造回归：index.html 中 `bg-s8 text-w` 出现次数为 0（确保 4 处深色全部改掉）

## 性能与可靠性

- 测试脚本零依赖，运行时间秒级（API 测试约 2-3 秒，其余 <1 秒）；API 子进程用测试端口 8081，不影响 8080 生产服务器
- extract 用 vm 隔离执行，不污染测试进程全局；mock 环境测后 restore，避免测试间串扰
- API 测试自带 data/ 清理，重复运行结果稳定（幂等）；断言用 assert.strictEqual / 近似值（±0.01）避免浮点误差
- 深色改造仅动 4 处 class 字符串，不涉及样式表与逻辑，回归风险极低；测试套件本身即回归保障

## 架构设计

轻量分层：测试套件与运行时代码完全解耦（test/ 独立目录，不进入 index.html/server.cjs 运行时）；lib 层提取公共能力（extract/mock），各测试文件只关注单一职责（data/calculator/api/render/html），run-tests 做编排。与项目"零依赖、无构建"哲学一致，任何环境下 `node test/run-tests.cjs` 即可运行。