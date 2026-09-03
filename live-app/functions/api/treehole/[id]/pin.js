// POST /api/treehole/:id/pin  置顶/取消置顶（toggle）
import { togglePin } from '../../../lib/pure.js';
import { json, error } from '../../../lib/http.js';
import { getPost, savePost } from '../../../lib/posts.js';

export async function onRequestPost(context) {
  const env = context.env;
  const id = context.params.id;
  const post = await getPost(env, id);
  if (!post) return error('帖子不存在', 404);
  const updated = togglePin(post);
  await savePost(env, updated);
  return json({ ok: true, post: updated });
}
