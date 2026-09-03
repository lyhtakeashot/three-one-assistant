// functions/api/feedback.js
// POST /api/feedback 数据纠错（detail 必填，其余字段长度 clamp）
import { validateFeedback, genId } from '../lib/pure.js';
import { json, error, readBody } from '../lib/http.js';

export async function onRequestPost(context) {
  const env = context.env;
  const body = await readBody(context.request);
  const v = validateFeedback(body);
  if (!v.ok) return error('描述不能为空', 400);

  const id = genId();
  const created_at = new Date().toLocaleString('zh-CN');
  await env.DB
    .prepare('INSERT INTO feedback (id, school_id, school_name, field, detail, contact, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(id, v.schoolId, v.schoolName, v.field, v.detail, v.contact, created_at)
    .run();

  return json({ ok: true, id });
}
