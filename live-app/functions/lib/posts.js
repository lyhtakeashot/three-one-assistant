// functions/lib/posts.js
// D1 posts 表的读写封装（复用纯逻辑的序列化函数）
import { rowToPost, postToRow } from './pure.js';

export async function getPost(env, id) {
  const row = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  return row ? rowToPost(row) : null;
}

export async function savePost(env, post) {
  const r = postToRow(post);
  await env.DB
    .prepare(
      'UPDATE posts SET content=?, category=?, aid=?, created_at=?, likes=?, replies=?, pinned=?, reports=? WHERE id=?'
    )
    .bind(r.content, r.category, r.aid, r.created_at, r.likes, r.replies, r.pinned, r.reports, r.id)
    .run();
}

export async function listPosts(env) {
  const { results } = await env.DB.prepare('SELECT * FROM posts ORDER BY pinned DESC, rowid DESC').all();
  return (results || []).map(rowToPost);
}
