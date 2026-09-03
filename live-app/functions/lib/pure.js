// functions/lib/pure.mjs
// 纯逻辑层：树洞/计数/纠错的业务规则（校验、排序、幂等、序列化），
// 被 functions/api/*.mjs handler 复用，并被 test/cf-pure.test.cjs 动态 import 验证，
// 保证 server.cjs(本地JSON) 与云端 D1/KV 双实现行为一致。

export const VALID_CATEGORIES = ['经验', '互助', '吐槽', '疑问'];
export const LIMITS = { content: 500, reply: 200, detail: 1000, schoolName: 50, schoolId: 20, field: 20, contact: 50, userId: 64, aid: 20 };

export function clamp(v, max) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length > max ? s.substring(0, max) : s;
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fmtAid(n) {
  return '匿名' + String(n).padStart(4, '0');
}

export function sortPosts(posts) {
  // 置顶优先，其后保持插入倒序（列表已按 created_at 倒序存储）
  return posts.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}

// 分类白名单，非法回退 '疑问'（与 server.cjs 一致）
export function sanitizeCategory(cat) {
  const c = clamp(cat, 8);
  return VALID_CATEGORIES.indexOf(c) > -1 ? c : '疑问';
}

export function validateContent(c) {
  const content = clamp(c, LIMITS.content);
  return { content, ok: content.length > 0 };
}

export function validateReply(c) {
  const content = clamp(c, LIMITS.reply);
  return { content, ok: content.length > 0 };
}

export function validateFeedback(b) {
  const schoolName = clamp(b && b.schoolName, LIMITS.schoolName);
  const schoolId = clamp(b && b.schoolId, LIMITS.schoolId);
  const field = clamp(b && b.field, LIMITS.field) || '其他';
  const detail = clamp(b && b.detail, LIMITS.detail);
  const contact = clamp(b && b.contact, LIMITS.contact);
  return { schoolName, schoolId, field, detail, contact, ok: detail.length > 0 };
}

// ---- 序列化：post 对象 <-> D1 行 ----
export function postToRow(p) {
  return {
    id: p.id,
    content: p.content,
    category: p.category,
    aid: p.aid,
    created_at: p.created_at,
    likes: JSON.stringify(p.likes || []),
    replies: JSON.stringify(p.replies || []),
    pinned: p.pinned ? 1 : 0,
    reports: p.reports || 0,
  };
}

export function rowToPost(r) {
  let likes = [], replies = [];
  try { likes = JSON.parse(r.likes || '[]'); } catch (e) { likes = []; }
  try { replies = JSON.parse(r.replies || '[]'); } catch (e) { replies = []; }
  return {
    id: r.id,
    content: r.content,
    category: r.category,
    aid: r.aid,
    created_at: r.created_at,
    likes,
    replies,
    pinned: !!r.pinned,
    reports: r.reports || 0,
  };
}

export function newPost(content, category, anonN) {
  const now = new Date().toLocaleString('zh-CN');
  return {
    id: genId(),
    content,
    category,
    aid: fmtAid(anonN),
    created_at: now,
    likes: [],
    replies: [],
    pinned: false,
    reports: 0,
  };
}

export function newReply(content, aid) {
  return {
    id: genId(),
    content,
    aid: aid || '匿名',
    created_at: new Date().toLocaleString('zh-CN'),
  };
}

// ---- 变更操作（不可变更新，返回新对象）----
// 点赞/取消：userId 已在则移除（幂等 toggle）
export function toggleLike(post, userId) {
  if (!userId) return post;
  const likes = post.likes || [];
  const i = likes.indexOf(userId);
  const next = i > -1 ? likes.filter((x) => x !== userId) : likes.concat([userId]);
  return Object.assign({}, post, { likes: next });
}

export function togglePin(post) {
  return Object.assign({}, post, { pinned: !post.pinned });
}

export function addReply(post, reply) {
  return Object.assign({}, post, { replies: (post.replies || []).concat([reply]) });
}

export function addReport(post) {
  return Object.assign({}, post, { reports: (post.reports || 0) + 1 });
}

export function makeUid() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
