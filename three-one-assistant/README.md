# 三位一体辅助系统

浙江高考三位一体招生辅助工具，帮助高中生了解、筛选、计算和决策三位一体招生路径。

## 功能

- **院校筛选**：按选科、学考等级、专业大类筛选院校，支持模糊搜索和冲稳保分层
- **综合分计算**：正算综合分 + 反向推算所需高考/校测分数
- **院校详情**：基本信息、校测内容、报名流程、历年竞争比、满意度、住宿条件
- **院校对比**：最多5所院校并排对比，差异可视化
- **个人工具**：收藏夹、我的三一档案、时间线、材料清单、方案导出
- **树洞**：匿名交流社区
- **FAQ**：三位一体常见问题解答

## 技术栈

- React 18 + TypeScript 5 + Vite 5
- Tailwind CSS 3.4 + shadcn/ui
- React Router v6 + Zustand
- Recharts 图表
- Supabase（树洞/匿名登录）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env` 并填入 Supabase 项目配置：

```bash
cp .env.example .env
```

## 数据说明

数据来源于：
- 浙江省教育考试院官网
- 各高校本科招生网
- 阳光高考网

当前数据文件位于 `src/data/`，手动维护。GitHub Actions 每周自动触发数据更新检查。

## 部署

项目部署在 Cloudflare Pages（免费），与 GitHub 仓库联动，推送代码自动部署。

## License

MIT
