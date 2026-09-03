// functions/api/treehole.js
// GET  /api/treehole  帖子列表（置顶优先，返回匿名序号）
// POST /api/treehole  发帖（校验分类、D1 meta 原子递增匿名序号后写入）
import { sortPosts, sanitizeCategory, newPost, validateContent } from '../lib/pure.js';
import { json, error, readBody } from '../lib/http.js';
import { listPosts } from '../lib/posts.js';

export async function onRequestGet(context) {
  const env = context.env;
  const posts = await listPosts(env);
  const meta = await env.DB.prepare('SELECT last_anon FROM meta WHERE id = 1').first();
  return json({ posts: sortPosts(posts), anonSeq: meta ? meta.last_anon : 0 });
}

export async function onRequestPost(context) {
  const env = context.env;
  const body = await readBody(context.request);
  const v = validateContent(body && body.content);
  if (!v.ok) return error('内容不能为空', 400);

  const category = sanitizeCategory(body && body.category);

  // D1 单语句原子递增匿名序号
  await env.DB.prepare('UPDATE meta SET last_anon = last_anon + 1 WHERE id = 1').run();
  const meta = await env.DB.prepare('SELECT last_anon FROM meta WHERE id = 1').first();
  const post = newPost(v.content, category, meta ? meta.last_anon : 1);

  await env.DB
    .prepare(
      'INSERT INTO posts (id, content, category, aid, created_at, likes, replies, pinned, reports) VALUES (?,?,?,?,?,?,?,?,?)'
    )
    .bind(post.id, post.content, post.category, post.aid, post.created_at, '[]', '[]', 0, 0)
    .run();

  return json({ ok: true, post });
}
