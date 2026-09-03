// cf-pure 测试：动态 import functions/lib/pure.js（ESM），验证云端业务纯逻辑
// 保证 server.cjs(本地JSON) 与 Cloudflare functions 双实现行为一致
const path = require('path');
const { pathToFileURL } = require('url');

const PURE = pathToFileURL(path.join(__dirname, '..', 'functions', 'lib', 'pure.js')).href;

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('cf-pure: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

module.exports = async function run(t) {
  let pure;
  try {
    pure = await import(PURE);
  } catch (e) {
    check(t, false, '无法 import pure.js: ' + e.message);
    return;
  }

  // 1) clamp 与校验
  check(t, pure.clamp('  内容  ', 500) === '内容', 'clamp 去空格');
  check(t, pure.clamp('a'.repeat(600), 500).length === 500, 'clamp 超长截断');
  const vc = pure.validateContent('   ');
  check(t, vc.ok === false, '空内容校验失败');
  check(t, pure.validateContent('你好').ok === true, '非空内容通过');
  check(t, pure.validateReply('').ok === false, '空回复校验失败');
  check(t, pure.validateReply('a'.repeat(300)).content.length === 200, '回复超长截断到 200');
  const vf = pure.validateFeedback({ detail: '' });
  check(t, vf.ok === false, '纠错空描述校验失败');
  const vf2 = pure.validateFeedback({ schoolName: 'x'.repeat(80), field: '其他', detail: '描述' });
  check(t, vf2.ok === true && vf2.schoolName.length === 50, '纠错字段 clamp + 通过');

  // 2) 分类白名单
  check(t, pure.sanitizeCategory('经验') === '经验', '合法分类保留');
  check(t, pure.sanitizeCategory('水帖') === '疑问', '非法分类回退疑问');
  check(t, pure.VALID_CATEGORIES.length === 4, '分类数量为 4');

  // 3) 匿名序号格式
  check(t, pure.fmtAid(1) === '匿名0001', '匿名0001 格式');
  check(t, pure.fmtAid(23) === '匿名0023', '匿名0023 格式');

  // 4) newPost 构造
  const p = pure.newPost('内容', '互助', 7);
  check(t, p.aid === '匿名0007' && p.category === '互助', 'newPost 匿名序号与分类');
  check(t, p.pinned === false && p.reports === 0 && p.likes.length === 0, 'newPost 默认字段');

  // 5) 点赞幂等 toggle
  const p1 = { ...p, likes: ['u1'] };
  const unliked = pure.toggleLike(p1, 'u1');
  check(t, unliked.likes.length === 0, '已赞用户再点 → 取消（幂等）');
  const reliked = pure.toggleLike(unliked, 'u1');
  check(t, reliked.likes.length === 1 && reliked.likes[0] === 'u1', '未赞用户点赞 → 加入');
  check(t, pure.toggleLike(p1, '').likes.length === 1, '空 userId 不改变点赞');

  // 6) 置顶/举报/回复
  const pinned = pure.togglePin(p);
  check(t, pinned.pinned === true && p.pinned === false, 'togglePin 翻转且原对象不变');
  check(t, pure.togglePin(pinned).pinned === false, 'togglePin 再次翻转');
  check(t, pure.addReport(p).reports === 1, 'addReport +1');
  const r = pure.newReply('回复内容', '匿名0009');
  const withReply = pure.addReply(p, r);
  check(t, withReply.replies.length === 1 && withReply.replies[0].content === '回复内容', 'newReply+addReply');

  // 7) 序列化 round-trip（post <-> D1 行）
  const sample = {
    id: 'x1', content: '内容', category: '疑问', aid: '匿名0010', created_at: 't',
    likes: ['u1', 'u2'], replies: [{ id: 'r1', content: '回', aid: '匿名0011', created_at: 't2' }],
    pinned: true, reports: 3,
  };
  const row = pure.postToRow(sample);
  check(t, row.pinned === 1 && row.reports === 3, 'postToRow pinned/reports 数字列');
  check(t, JSON.parse(row.likes).length === 2 && JSON.parse(row.replies).length === 1, 'postToRow likes/replies 为 JSON 文本');
  const back = pure.rowToPost(row);
  check(t, back.pinned === true && back.reports === 3 && back.likes.length === 2 && back.replies.length === 1, 'rowToPost round-trip 还原');
  const broken = pure.rowToPost({ id: 'b', likes: 'not-json', replies: null, pinned: 0 });
  check(t, broken.likes.length === 0 && broken.replies.length === 0, 'rowToPost 容错坏 JSON');

  // 8) 置顶排序（传入的列表已按插入倒序，置顶应前置）
  const a = { id: 'a', pinned: false }, b = { id: 'b', pinned: true }, c = { id: 'c', pinned: false };
  const sorted = pure.sortPosts([a, c, b]);
  check(t, sorted[0].id === 'b', 'sortPosts 置顶帖排最前');
  check(t, sorted.length === 3, 'sortPosts 数量不变');
};
