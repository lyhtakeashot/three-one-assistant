// API 集成测试：8081 测试端口子进程启动 server.cjs，测后清理 data/ 并 kill
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEST_PORT = 8081;
const DATA_DIR = path.join(ROOT, 'data');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('api: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

function api(port, method, p, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      host: 'localhost', port, path: p, method,
      headers: data ? { 'Content-Type': 'application/json' } : {},
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => resolve({ status: resp.statusCode, body: d, headers: resp.headers }));
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

module.exports = async function run(t) {
  // 清理测试数据目录（幂等）
  fs.rmSync(DATA_DIR, { recursive: true, force: true });

  // 读取 server.cjs 并替换端口
  let code = fs.readFileSync(path.join(ROOT, 'server.cjs'), 'utf8');
  code = code.replace('PORT=8080', 'PORT=' + TEST_PORT);
  const child = spawn('node', ['-e', code], { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
  let serverErr = '';
  child.stderr.on('data', (d) => (serverErr += d.toString()));

  await sleep(1000);

  try {
    // ---- counter ----
    let r = await api(TEST_PORT, 'GET', '/api/counter');
    const c1 = JSON.parse(r.body);
    check(t, r.status === 200 && c1.count >= 1 && !!c1.userId, 'counter 首次访问返回 count+userId');
    r = await api(TEST_PORT, 'GET', '/api/counter');
    const c2 = JSON.parse(r.body);
    check(t, c2.count === c1.count + 1, 'counter 连续访问 +1');
    r = await api(TEST_PORT, 'GET', '/api/counter?userId=' + c1.userId);
    const c3 = JSON.parse(r.body);
    check(t, c3.count === c2.count && c3.userId === c1.userId, 'counter 带 userId 不重复计数');

    // ---- treehole 发帖 ----
    r = await api(TEST_PORT, 'POST', '/api/treehole', { content: '测试：互相鼓励一起上岸！', category: '互助' });
    const p1 = JSON.parse(r.body);
    check(t, r.status === 200 && p1.ok && p1.post.aid === '\u533f\u540d0001', '发帖返回 匿名0001');
    r = await api(TEST_PORT, 'POST', '/api/treehole', { content: '测试：温医大面试形式？', category: '疑问' });
    const p2 = JSON.parse(r.body);
    check(t, p2.post.aid === '\u533f\u540d0002' && p2.post.category === '疑问', '发帖匿名递增 + 分类正确');
    r = await api(TEST_PORT, 'POST', '/api/treehole', { content: '测试：非法分类', category: '\u6c34\u5e16' });
    check(t, JSON.parse(r.body).post.category === '疑问', '非法分类回退为"疑问"');
    r = await api(TEST_PORT, 'POST', '/api/treehole', { content: '   ' });
    check(t, r.status === 400, '空内容发帖返回 400');

    const pid = p1.post.id;

    // ---- like 幂等 ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/like', { userId: 'u-api-1' });
    check(t, JSON.parse(r.body).post.likes.length === 1, '点赞 +1');
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/like', { userId: 'u-api-1' });
    check(t, JSON.parse(r.body).post.likes.length === 0, '重复点赞取消（幂等）');
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/like', { userId: 'u-api-2' });
    check(t, JSON.parse(r.body).post.likes.length === 1, '他人点赞 +1');

    // ---- reply ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/reply', { content: '蹲一个回答', aid: '匿名0099' });
    check(t, r.status === 200 && JSON.parse(r.body).post.replies.length === 1, '回复追加');
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/reply', { content: '' });
    check(t, r.status === 400, '空回复 400');

    // ---- pin ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/pin', {});
    check(t, JSON.parse(r.body).post.pinned === true, '置顶开启');
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/pin', {});
    check(t, JSON.parse(r.body).post.pinned === false, '再次置顶关闭');

    // ---- report ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/report', { userId: 'u-api-3' });
    check(t, JSON.parse(r.body).post.reports === 1, '举报计数 +1');

    // ---- GET list 置顶在前 ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/' + pid + '/pin', {});
    r = await api(TEST_PORT, 'GET', '/api/treehole');
    const list = JSON.parse(r.body);
    check(t, list.posts.length === 3 && list.posts[0].pinned === true, 'GET 列表置顶在前');

    // ---- 404 ----
    r = await api(TEST_PORT, 'POST', '/api/treehole/nonexistent/like', { userId: 'x' });
    check(t, r.status === 404, '不存在帖子 404');

    // ---- feedback ----
    r = await api(TEST_PORT, 'POST', '/api/feedback', { schoolId: 'hdu', schoolName: '杭州电子科技大学', field: '学费', detail: '测试纠错：学费应为5300', contact: 't@t.com' });
    check(t, r.status === 200 && JSON.parse(r.body).ok === true, 'feedback 提交成功');
    r = await api(TEST_PORT, 'POST', '/api/feedback', { detail: '' });
    check(t, r.status === 400, 'feedback 空描述 400');

    // ---- CORS ----
    r = await api(TEST_PORT, 'OPTIONS', '/api/treehole');
    check(t, r.status === 204 && r.headers['access-control-allow-origin'] === '*', 'CORS OPTIONS 204');
  } catch (e) {
    check(t, false, 'API 测试异常: ' + e.message);
  } finally {
    child.kill();
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
  if (serverErr && t.fail === 0) {
    process.stderr.write('  [warn] server stderr: ' + serverErr.trim() + '\n');
  }
};
