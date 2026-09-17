// functions/api/counter.js
// GET /api/counter 访问次数计数（KV 存储，允许最终一致）
// 口径：每次页面会话 +1；一次会话内前端多处调用由 counterQueue 合并为一次请求，故每次请求无条件 count+1
import { json } from '../lib/http.js';
import { makeUid } from '../lib/pure.js';

export async function onRequestGet(context) {
  const env = context.env;

  let count = parseInt((await env.COUNTER_KV.get('count')) || '0', 10) || 0;
  count += 1;
  await env.COUNTER_KV.put('count', String(count));
  return json({ count, userId: makeUid() });
}
