// POST /api/treehole/:id/report  举报计数（每次 +1）
import { addReport } from '../../../../lib/pure.js';
import { json, error } from '../../../../lib/http.js';
import { getPost, savePost } from '../../../../lib/posts.js';

export async function onRequestPost(context) {
  const env = context.env;
  const id = context.params.id;
  const post = await getPost(env, id);
  if (!post) return error('帖子不存在', 404);
  const updated = addReport(post);
  await savePost(env, updated);
  return json({ ok: true, post: updated });
}
