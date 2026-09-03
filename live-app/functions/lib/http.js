// functions/lib/http.js
// Response 构造与请求体读取的轻量 helper（Cloudflare Pages Functions 环境）
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

export function error(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}
