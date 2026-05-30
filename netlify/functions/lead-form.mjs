function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function getEnv(name) {
  if (globalThis.Netlify && globalThis.Netlify.env) {
    return String(globalThis.Netlify.env.get(name) || '').trim();
  }
  if (typeof process !== 'undefined' && process.env) {
    return String(process.env[name] || '').trim();
  }
  return '';
}

export default async function leadForm(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: '只接受 POST 送出。' }, 405);
  }

  const appsScriptUrl = getEnv('APPS_SCRIPT_WEB_APP_URL');
  const formToken = getEnv('FORM_TOKEN');

  if (!appsScriptUrl || !formToken) {
    return jsonResponse({ ok: false, message: 'Netlify 環境變數尚未設定完整。' }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: '表單資料格式不正確。' }, 400);
  }

  try {
    const upstreamResponse = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        ...payload,
        token: formToken,
      }),
    });

    const text = await upstreamResponse.text();
    let upstreamBody = null;
    try {
      upstreamBody = text ? JSON.parse(text) : null;
    } catch {
      upstreamBody = null;
    }

    if (!upstreamResponse.ok) {
      return jsonResponse({ ok: false, message: 'Google Apps Script 沒有成功回應。' }, 502);
    }

    if (!upstreamBody || upstreamBody.ok !== true) {
      return jsonResponse({
        ok: false,
        message: upstreamBody && upstreamBody.message ? upstreamBody.message : 'Google Apps Script 拒絕這次送出。',
      }, 400);
    }

    return jsonResponse({ ok: true, message: upstreamBody.message || '資料已成功寫入。' });
  } catch (error) {
    console.error('LEAD_FORM_PROXY_FAILED', error);
    return jsonResponse({ ok: false, message: '送出失敗，請稍後再試。' }, 502);
  }
}

export const config = {
  path: '/api/lead-form',
};
