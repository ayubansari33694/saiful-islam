'use strict';
const crypto = require('crypto');

const COOKIE = 'adm';
const DAY = 86400;

function secret() {
  const pw = process.env.ADMIN_PASSWORD || '';
  return process.env.AUTH_SECRET || crypto.createHash('sha256').update('portfolio-admin:' + pw).digest('hex');
}
function sign(v) { return crypto.createHmac('sha256', secret()).update(v).digest('hex'); }
function safeEq(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function makeToken(days) {
  const exp = String(Math.floor(Date.now() / 1000) + (days || 30) * DAY);
  return exp + '.' + sign(exp);
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAuthed(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const t = cookies(req)[COOKIE];
  if (!t) return false;
  const parts = t.split('.');
  if (parts.length !== 2) return false;
  if (!/^\d+$/.test(parts[0]) || Number(parts[0]) < Date.now() / 1000) return false;
  return safeEq(parts[1], sign(parts[0]));
}
function setCookie(res, token, maxAge) {
  res.setHeader('Set-Cookie', COOKIE + '=' + (token || '') + '; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=' + maxAge);
}
function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
// Only accept JSON posts that come from our own site (basic CSRF protection).
function guardPost(req, res) {
  if (req.method !== 'POST') { json(res, 405, { error: 'Use POST.' }); return false; }
  const ct = String(req.headers['content-type'] || '');
  if (ct.indexOf('application/json') !== 0) { json(res, 415, { error: 'JSON only.' }); return false; }
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) {}
    if (host !== req.headers.host) { json(res, 403, { error: 'Bad origin.' }); return false; }
  }
  return true;
}
function storeId() {
  const t = process.env.BLOB_READ_WRITE_TOKEN || '';
  const m = /^vercel_blob_rw_([^_]+)_/.exec(t);
  return m ? m[1].toLowerCase() : '';
}
function blobUrl(path) {
  const id = storeId();
  return id ? 'https://' + id + '.public.blob.vercel-storage.com/' + path : '';
}
module.exports = { json, guardPost, isAuthed, makeToken, setCookie, safeEq, blobUrl, storeId, COOKIE };
