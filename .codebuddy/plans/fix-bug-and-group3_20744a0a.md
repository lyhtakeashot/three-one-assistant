---
name: fix-bug-and-group3
overview: 修复 CDN 加载导致的 getBoundingClientRect 白屏 bug，通过 zjzs.net 补充 39 所院校招生简章链接，通过阳光高考网补充满意度数据，并完成第三组剩余功能（对比优化、导出、三一vs高考对比）。
todos:
  - id: fix-cdn-bug
    content: 修复 CDN 加载 bug：将 esm.sh ES module 改为 unpkg UMD script 标签，修复白屏问题
    status: completed
  - id: expand-schools-data
    content: 扩充院校数据：从 5 所扩建至 15 所，包含浙江工业大学、浙江师范大学、温州医科大学等，每所添加 brochureUrl 招生简章链接和真实满意度数据
    status: completed
    dependencies:
      - fix-cdn-bug
  - id: enhance-compare
    content: 增强多院校对比：以最左院校为基准线，数值型字段标注黄色 ⊕ 优势 / 红色 ⊖ 劣势
    status: completed
    dependencies:
      - fix-cdn-bug
  - id: add-markdown-export
    content: 实现 Markdown 方案导出：在档案页点击按钮生成 .md 文件并触发下载
    status: completed
    dependencies:
      - fix-cdn-bug
  - id: add-path-compare
    content: 新增三位一体 vs 普通高考对比页面，包含对比表格、优势劣势卡片和适用场景总结
    status: completed
    dependencies:
      - fix-cdn-bug
  - id: verify-and-restart
    content: 完整测试：重启服务器验证所有页面功能正常，确认 bug 已修复
    status: completed
    dependencies:
      - expand-schools-data
      - enhance-compare
      - add-markdown-export
      - add-path-compare
---

## 用户需求

### Bug 修复

当前 `d:/three-one-assistant/index.html` 使用 `<script type="module">` 从 `esm.sh` CDN 加载 React，在嵌入式 WebView 中跨域模块加载失败，报错 `Cannot read properties of null (reading 'getBoundingClientRect')`，页面白屏。需改用 unpkg CDN 的 UMD 版本通过普通 script 标签加载，解决跨域问题。

### 数据补充

- **院校扩充**：从浙江省教育考试院官网（zjzs.net/col/col363/）获取的 39 所省属三一院校列表中，将现有 5 所扩建至至少 15 所，每所附招生简章来源链接（`brochureUrl` 字段）
- **满意度数据**：从阳光高考网（chsi.com.cn）补入浙江院校的真实满意度三维评分（综合/环境/生活，满分 5.0）

### 第三组新功能（3 项）

1. **多院校对比差异标注**：在当前 ComparePage 基础上，以最左院校为参考线，用黄色背景 + ⊕ 标记优势项，红色背景 + ⊖ 标记劣势项。涉及数值型字段（学费、录取分、满意度）做大小比较，布尔型字段不做标注
2. **Markdown 方案导出**：在 ProfilePage（我的档案页）实现导出按钮，生成包含收院校名称、信息、校测内容、报名流程的 .md 文件并触发浏览器下载
3. **三位一体 vs 普通高考对比**：新增 `pathCompare` 页面，从录取批次、分数构成、志愿限制、风险收益、适合人群等维度对比两条路径

## 技术方案

### Bug 修复方案

**问题根因**：`<script type="module">` 从 `esm.sh` 跨域加载 ES module 在嵌入式 WebView 中失败，`createRoot` 为 undefined，后续渲染时 `getBoundingClientRect` 在 null 上调用报错。

**修复策略**：将 ES module 方式改为传统 UMD script 标签加载：

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
```

加载后 React 挂载到 `window.React`，ReactDOM 挂载到 `window.ReactDOM`。移除 `<script type="module">` 标签，改用普通 `<script>` 标签，所有代码（数据、工具、组件）保持内联。因为不再使用 import，所有函数定义保持使用 `var functionName = function(){}` 或 `function functionName(){}` 形式，React 通过 `window.React` 访问。

### 数据补充方案

**院校数据**：在当前 `SCHOOLS` 数组中新增至少 10 所院校，每所包含完整字段（id、name、shortName、aliases、type、info、formula、examFormat、transferRestriction、majors、admission、satisfaction、dormitory、applicationSteps）。新增 `brochureUrl` 字段存储招生简章链接。院校按重要性排序：浙江工业大学、浙江师范大学、温州医科大学、浙江工商大学、浙江理工大学、浙江海洋大学、浙江农林大学、中国计量大学、杭州师范大学、温州肯恩大学。

**满意度数据**：阳光高考网院校满意度 URL 模式为 `gaokao.chsi.com.cn/zyk/pub/myd/schAppraisalTop`，数据由实名学生投票产生。对新增和现有院校的 satisfaction 字段填入真实数据。部分院校可能投票人数不足，标注数据来源。

### 第三组功能实现方案

**1. 多院校对比差异标注**

修改 `ComparePage` 函数，对数值型字段（学费、最低录取分、满意度）执行差异计算：

- 提取最左院校（`list[0]`）作为基准值
- 学费：值更低 = 优势（⊕ 黄底），更高 = 劣势（⊖ 红底）
- 最低录取分：值更低 = 优势（⊕ 黄底，因为更容易考），更高 = 劣势（⊖ 红底）
- 满意度：值更高 = 优势（⊕ 黄底），更低 = 劣势（⊖ 红底）
- 布尔型字段（笔试、面试、转专业限制）不做差异标注

**2. Markdown 方案导出**

在 `ProfilePage` 的导出按钮实现：

- 收集所有已收藏院校的完整数据
- 生成 Markdown 格式文本（标题、基本信息、校测内容、报名流程、转专业限制）
- 使用 `Blob` + `URL.createObjectURL` + `<a download>` 触发下载
- 文件名：`三位一体方案_YYYYMMDD.md`

**3. 三位一体 vs 普通高考对比**

新增 `PathComparePage` 函数，添加到 App 路由（页面 key: `pathCompare`），在导航栏新增入口。展示内容包括：

- 对比表格：录取批次、分数构成、志愿数量、录取时间、是否影响后续批次、退档风险
- 三一优势卡片：学考优势可放大、校测体现综合能力、多一次录取机会
- 三一劣势卡片：只能报一所院校、部分院校限转专业、校测备考压力
- 适用场景总结：学考成绩好/高考不稳定 → 推荐三一；高考稳定高分 → 可直接走普通批次