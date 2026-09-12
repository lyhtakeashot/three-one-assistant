// HTML/PWA 结构测试：PWA meta、manifest 合法性、图标存在、SW 注册、深色改造回归
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('html: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

module.exports = function run(t) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // ---- PWA head ----
  check(t, html.indexOf('<link rel="manifest"') > -1, 'index.html 含 manifest link');
  check(t, html.indexOf('name="theme-color"') > -1, 'index.html 含 theme-color');
  check(t, html.indexOf('apple-touch-icon') > -1, 'index.html 含 apple-touch-icon');
  check(t, html.indexOf('icon.svg') > -1, 'index.html 引用 icon.svg favicon');
  check(t, /navigator\.serviceWorker\.register\('sw\.js'\)/.test(html), 'index.html 注册 sw.js');

  // ---- manifest.json ----
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
    check(t, true, 'manifest.json 为合法 JSON');
  } catch (e) {
    check(t, false, 'manifest.json 解析失败: ' + e.message);
  }
  if (manifest) {
    check(t, manifest.name && manifest.short_name, 'manifest 含 name/short_name');
    check(t, manifest.display === 'standalone', 'manifest display=standalone');
    check(t, manifest.theme_color === '#3B82F6', 'manifest theme_color 正确');
    check(t, Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest icons 数量 >= 2');
    if (Array.isArray(manifest.icons)) {
      manifest.icons.forEach((ic) => {
        check(t, fs.existsSync(path.join(ROOT, ic.src)), 'manifest 图标文件存在: ' + ic.src);
      });
    }
  }

  // ---- sw.js ----
  const swPath = path.join(ROOT, 'sw.js');
  if (fs.existsSync(swPath)) {
    const sw = fs.readFileSync(swPath, 'utf8');
    check(t, sw.indexOf('CACHE_NAME') > -1, 'sw.js 含 CACHE_NAME');
    check(t, sw.indexOf("'install'") > -1, 'sw.js 监听 install');
    check(t, sw.indexOf("'activate'") > -1, 'sw.js 监听 activate');
    check(t, sw.indexOf("'fetch'") > -1, 'sw.js 监听 fetch');
    check(t, sw.indexOf('/api/') > -1, 'sw.js 处理 /api/ 网络优先');
  } else {
    check(t, false, 'sw.js 文件不存在');
  }

  // ---- 图标文件 ----
  ['icon.svg', 'icon-192.png', 'icon-512.png'].forEach((f) => {
    check(t, fs.existsSync(path.join(ROOT, f)), '图标文件存在: ' + f);
  });

  // ---- 深色改造回归：脚本内不应再有 bg-s8 text-w 深色选中态 ----
  const s = html.indexOf('<script>');
  const e = html.lastIndexOf('</script>');
  const src = html.substring(s + 8, e);
  check(t, (src.match(/bg-s8 text-w/g) || []).length === 0, '脚本内无 bg-s8 text-w 深色残留');
  // 首页横幅应为浅色
  check(t, src.indexOf("'bg-p50 text-p p3 text-center text-sm'") > -1, '首页计数横幅为浅色 bg-p50');

  // ---- 控制台改版结构回归 ----
  check(t, src.indexOf('var ICON_PATHS={') > -1, '脚本内含内联 SVG 图标表 ICON_PATHS');
  check(t, src.indexOf("React.createElement('svg'") > -1, '图标以内联 svg 渲染（零外部图标依赖）');
  check(t, src.indexOf('function Icon(props)') > -1, 'Icon 图标组件存在');
  check(t, src.indexOf('var NAV_SECTIONS=[') > -1, '脚本内含 NAV_SECTIONS 侧边栏分组导航');
  check(t, src.indexOf('var PAGE_META={') > -1, '脚本内含 PAGE_META 页面标题元信息');
  check(t, src.indexOf('BOTTOM_NAV') === -1 && src.indexOf('bottom-nav') === -1, '已移除与侧边栏重复的移动端底部 Tab 栏');
  check(t, src.indexOf("'sidebar'") > -1 && src.indexOf("'topbar'") > -1, '外壳使用 sidebar / topbar 控制台类名');
  check(t, src.indexOf('drawer-mask') > -1, '移动端抽屉遮罩存在');
  check(t, src.indexOf('navMode') > -1, '侧边栏展开/收起状态写入 localStorage');
  check(t, src.indexOf("'data-theme'") > -1, '支持深浅主题 data-theme 切换');
  check(t, src.indexOf("'data-table'") > -1, '院校库与详情使用 data-table 数据表');
  check(t, src.indexOf('function dashboardStats') > -1 && src.indexOf('function scoreBuckets') > -1 && src.indexOf('function sortSchools') > -1, '仪表盘统计与表格排序派生函数存在');

  // 控制台样式类与主题 token 已定义
  check(t, html.indexOf('.sidebar{') > -1, 'style 含 .sidebar 侧边栏样式');
  check(t, html.indexOf('.data-table thead th{') > -1, 'style 含 .data-table 表头样式');
  check(t, html.indexOf('[data-theme="dark"]') > -1, 'style 含深色主题 token');
  check(t, html.indexOf('--nav-w:248px') > -1, 'style 含侧边栏宽度 token');
  check(t, html.indexOf('.console[data-nav="closed"]{--nav-cur:var(--nav-w-mini)}') > -1, 'style 含收起态侧边栏宽度规则');
  check(t, html.indexOf('.sidebar{position:sticky') > -1 && html.indexOf('width:var(--nav-cur)') > -1, 'style 含文档流内侧边栏（宽度由 --nav-cur 驱动，主区由 flex 自动让位）');

  // ---- open-data 数据包存在 ----
  ['schools.json', 'schools.csv', 'schools.md', 'README.md'].forEach((f) => {
    check(t, fs.existsSync(path.join(ROOT, 'open-data', f)), 'open-data/' + f + ' 存在');
  });

  // ---- server.cjs 支持 manifest MIME ----
  const server = fs.readFileSync(path.join(ROOT, 'server.cjs'), 'utf8');
  check(t, server.indexOf('application/manifest+json') > -1, 'server.cjs 支持 manifest MIME');

  // ---- Cloudflare functions 结构 ----
  const fnFiles = ['functions/lib/pure.js', 'functions/api/_middleware.js', 'functions/api/treehole.js', 'functions/api/counter.js', 'functions/api/feedback.js', 'functions/api/treehole/[id]/like.js', 'functions/api/treehole/[id]/reply.js', 'functions/api/treehole/[id]/pin.js', 'functions/api/treehole/[id]/report.js'];
  fnFiles.forEach((f) => check(t, fs.existsSync(path.join(ROOT, f)), 'functions 文件存在: ' + f));

  // ---- schema.sql ----
  if (fs.existsSync(path.join(ROOT, 'schema.sql'))) {
    const schema = fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8');
    check(t, schema.indexOf('CREATE TABLE') > -1 && schema.indexOf('posts') > -1, 'schema.sql 含 posts 表');
    check(t, schema.indexOf('feedback') > -1, 'schema.sql 含 feedback 表');
    check(t, schema.indexOf('meta') > -1, 'schema.sql 含 meta 表');
  } else {
    check(t, false, 'schema.sql 文件不存在');
  }

  // ---- docs 部署文档 ----
  check(t, fs.existsSync(path.join(ROOT, 'docs', 'DEPLOY-CLOUDFLARE.md')), 'docs/DEPLOY-CLOUDFLARE.md 存在');
};
