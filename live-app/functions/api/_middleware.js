// functions/api/_middleware.js
// 作用于 /api/* 及子路由：统一 CORS 头 + OPTIONS 预检 204（与本地 server.cjs 行为一致）
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const k of Object.keys(CORS)) headers.set(k, CORS[k]);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
