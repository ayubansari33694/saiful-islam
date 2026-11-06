'use strict';
const L = require('./_lib');
module.exports = async function (req, res) {
  if (!L.guardPost(req, res)) return;
  if (!L.isAuthed(req)) return L.json(res, 401, { error: 'Please sign in again.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return L.json(res, 503, { error: 'Storage is not connected yet (Vercel Blob).' });
  const b = req.body || {};
  if (typeof b.data !== 'string' || b.data.length < 100) return L.json(res, 400, { error: 'No image received.' });
  const buf = Buffer.from(b.data, 'base64');
  if (buf.length > 3500000) return L.json(res, 413, { error: 'Image is too large (max 3.5 MB).' });
  const safe = String(b.name || 'photo').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40) || 'photo';
  try {
    const { put } = require('@vercel/blob');
    const r = await put('portfolio/uploads/' + Date.now() + '-' + safe + '.jpg', buf, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: false });
    return L.json(res, 200, { ok: true, url: r.url });
  } catch (e) {
    return L.json(res, 500, { error: 'Could not upload: ' + (e && e.message ? e.message : e) });
  }
};
