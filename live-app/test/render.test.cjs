// 渲染测试：mock 环境下 13 个组件逐一渲染无异常
const fs = require('fs');
const path = require('path');
const { createMockEnv } = require('./lib/mock-react.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('render: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

module.exports = function run(t) {
  const env = createMockEnv();
  env.install();

  try {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const s = html.indexOf('<script>');
    const e = html.lastIndexOf('</script>');
    const src = html.substring(s + 8, e).trim();
    eval(src);

    const pages = [
      'HomePage', 'SchoolListPage', 'SchoolDetailPage', 'CalculatorPage', 'FavoritesPage',
      'FAQPage', 'TreeholePage', 'ProfilePage', 'ComparePage', 'PathComparePage',
      'FeedbackPage', 'DownloadPage', 'App',
    ];
    pages.forEach((name) => {
      try {
        const fn = eval(name);
        const result = fn({ setPage: () => {} });
        check(t, result && typeof result === 'object' && result.type !== undefined, name + ' 渲染返回元素');
      } catch (err) {
        check(t, false, name + ' 渲染异常: ' + err.message);
      }
    });
  } catch (err) {
    check(t, false, '脚本加载异常: ' + err.message);
  } finally {
    env.restore();
  }
};
