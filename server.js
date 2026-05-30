// EVNHCMC Personal Dashboard — local Express backend
// Proxies authenticated requests to www.evnhcmc.vn and serves the SPA in /public.

import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CookieJar } from 'tough-cookie';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const UPSTREAM = 'https://www.evnhcmc.vn';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Prefer the built React app in web/dist, fall back to legacy /public during dev.
const WEB_DIST = path.join(__dirname, 'web', 'dist');
const LEGACY_PUBLIC = path.join(__dirname, 'public');
const STATIC_ROOT = fs.existsSync(path.join(WEB_DIST, 'index.html')) ? WEB_DIST : LEGACY_PUBLIC;

// sessionId -> { jar: CookieJar, listPE: [], createdAt: number }
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h

function cleanupSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}
setInterval(cleanupSessions, 1000 * 60 * 10).unref();

// ---------- Upstream HTTP helper with cookie jar ----------
async function upstream(jar, urlPath, { method = 'GET', body, headers = {}, isJson = false } = {}) {
  const url = UPSTREAM + urlPath;
  const cookieHeader = await jar.getCookieString(url);
  const finalHeaders = {
    'User-Agent': UA,
    'Accept': isJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,*/*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    'Referer': UPSTREAM + '/',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...headers,
  };
  if (method === 'POST' && body && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: method === 'POST' ? body : undefined,
    redirect: 'manual',
  });

  // Persist Set-Cookie headers into the jar.
  // Node's Headers.getSetCookie() (Node 19.7+) returns an array.
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.raw?.()['set-cookie'] || []);
  for (const c of setCookies) {
    try { await jar.setCookie(c, url); } catch { /* ignore parse errors */ }
  }
  return res;
}

async function upstreamText(jar, p, opts) {
  const r = await upstream(jar, p, opts);
  return { status: r.status, text: await r.text(), headers: r.headers };
}

async function upstreamPostForm(jar, p, params, opts = {}) {
  const body = new URLSearchParams(params).toString();
  return upstreamText(jar, p, {
    method: 'POST',
    body,
    isJson: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest', ...(opts.headers || {}) },
    ...opts,
  });
}

// Parse the `listPE` array from the inline script of any authenticated page.
function parseListPE(html) {
  // localStorage.setItem("listPE", '[ ...json... ]');
  const m = html.match(/localStorage\.setItem\(\s*["']listPE["']\s*,\s*'([\s\S]*?)'\s*\)/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Try to safely parse JSON; some EVN endpoints reply with text/html content-type
// but a JSON body, or wrap JSON in HTML on error.
function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ---------- Session helpers ----------
function readSid(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)evn_sid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function requireSession(req, res) {
  const sid = readSid(req);
  const s = sid && sessions.get(sid);
  if (!s) {
    res.status(401).json({ error: 'not_authenticated' });
    return null;
  }
  return s;
}

// ---------- Express app ----------
const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(STATIC_ROOT));

app.post('/api/login', async (req, res) => {
  const { sdt, password, remember = 1 } = req.body || {};
  if (!sdt || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  const jar = new CookieJar();
  try {
    // Warm up: visit homepage to receive any initial cookies (BIG-IP TS*, etc.).
    await upstream(jar, '/');

    const { text: loginText } = await upstreamPostForm(jar, '/Dangnhap/checkLG', {
      u: String(sdt).trim(),
      p: String(password),
      remember: remember ? '1' : '0',
      token: '',
    });

    const loginJson = safeJson(loginText);
    if (!loginJson || loginJson.state !== 'success') {
      return res.status(401).json({
        error: 'login_failed',
        upstream: loginJson || loginText.slice(0, 300),
      });
    }

    // Pull the list of linked customer codes (PE...) by loading an authenticated page.
    const { text: pageHtml } = await upstreamText(jar, '/Tracuu/dienNangTieuThu');
    const listPE = parseListPE(pageHtml) || [];

    const sid = crypto.randomBytes(24).toString('hex');
    sessions.set(sid, { jar, listPE, createdAt: Date.now() });

    res.setHeader('Set-Cookie', `evn_sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
    res.json({ ok: true, listPE });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'upstream_error', message: String(e.message || e) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), sessions: sessions.size });
});

app.post('/api/logout', async (req, res) => {
  const sid = readSid(req);
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', 'evn_sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const s = requireSession(req, res); if (!s) return;
  res.json({ ok: true, listPE: s.listPE });
});

// --- Proxy endpoints ---

async function callTraCuu(s, urlPath, params) {
  const { text } = await upstreamPostForm(s.jar, urlPath, params);
  const json = safeJson(text);
  if (!json) return { error: 'bad_upstream_response', raw: text.slice(0, 300) };
  return json;
}

app.post('/api/dien/ngay', async (req, res) => {
  const s = requireSession(req, res); if (!s) return;
  const { input_makh, input_tungay, input_denngay } = req.body || {};
  if (!input_makh || !input_tungay || !input_denngay) {
    return res.status(400).json({ error: 'missing_params' });
  }
  res.json(await callTraCuu(s, '/Tracuu/ajax_dienNangTieuThuTheoNgay', {
    token: '', input_makh, input_tungay, input_denngay,
  }));
});

app.post('/api/dien/gio', async (req, res) => {
  const s = requireSession(req, res); if (!s) return;
  const { input_makh, input_ngay } = req.body || {};
  if (!input_makh || !input_ngay) return res.status(400).json({ error: 'missing_params' });
  res.json(await callTraCuu(s, '/Tracuu/thongtinphutai_theogio_result', {
    token: '', input_makh, input_ngay,
  }));
});

app.post('/api/dien/kyhoadon', async (req, res) => {
  const s = requireSession(req, res); if (!s) return;
  const { input_makh, input_nam } = req.body || {};
  if (!input_makh || !input_nam) return res.status(400).json({ error: 'missing_params' });
  res.json(await callTraCuu(s, '/Tracuu/ajax_dienNangTieuThuTheoKyHoaDon', {
    token: '', input_makh, input_nam: String(input_nam),
  }));
});

// SPA history fallback: any non-API GET serves index.html so React Router can handle routes.
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  const indexFile = path.join(STATIC_ROOT, 'index.html');
  if (!fs.existsSync(indexFile)) return next();
  res.sendFile(indexFile);
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`\n  EVNHCMC dashboard ready  ->  http://${HOST}:${PORT}`);
  console.log(`  Serving static from        ${path.relative(__dirname, STATIC_ROOT) || '.'}\n`);
});
