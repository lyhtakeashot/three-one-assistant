// POST /api/treehole/:id/reply  追加回复（内容 ≤ 200 校验）
import { validateReply, newReply } from '../../../lib/pure.js';
import { json, error, readBody } from '../../../lib/http.js';
import { getPost, savePost } from '../../../lib/posts.js';

export async function onRequestPost(context) {
  const env = context.env;
  const id = context.params.id;
  const post = await getPost(env, id);
  if (!post) return error('帖子不存在', 404);
  const body = await readBody(context.request);
  const v = validateReply(body && body.content);
  if (!v.ok) return error('回复不能为空', 400);
  const reply = newReply(v.content, ((body && body.aid) || '').trim());
  const updated = Object.assign({}, post, { replies: (post.replies || []).concat([reply]) });
  await savePost(env, updated);
  return json({ ok: true, post: updated });
}
