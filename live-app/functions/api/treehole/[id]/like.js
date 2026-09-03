// POST /api/treehole/:id/like  点赞/取消（userId 幂等 toggle）
import { toggleLike } from '../../../lib/pure.js';
import { json, error, readBody } from '../../../lib/http.js';
import { getPost, savePost } from '../../../lib/posts.js';

export async function onRequestPost(context) {
  const env = context.env;
  const id = context.params.id;
  const post = await getPost(env, id);
  if (!post) return error('帖子不存在', 404);
  const body = await readBody(context.request);
  const updated = toggleLike(post, (body.userId || '').trim());
  await savePost(env, updated);
  return json({ ok: true, post: updated });
}
