// functions/api/counter.js
// GET /api/counter[?userId=] 用户计数（KV 存储，允许最终一致）
// 新访客（无 userId）count+1 并返回新生成的 userId；带 userId 幂等不重复计数
import { json } from '../lib/http.js';
import { makeUid } from '../lib/pure.js';

export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const userId = (url.searchParams.get('userId') || '').trim() || null;

  let count = parseInt((await env.COUNTER_KV.get('count')) || '0', 10) || 0;
  if (!userId) {
    count += 1;
    await env.COUNTER_KV.put('count', String(count));
  }
  return json({ count, userId: userId || makeUid() });
}
