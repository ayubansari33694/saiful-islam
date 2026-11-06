'use strict';
const L = require('./_lib');
module.exports = async function (req, res) {
  if (!L.guardPost(req, res)) return;
  if (!L.isAuthed(req)) return L.json(res, 401, { error: 'Please sign in again.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return L.json(res, 503, { error: 'Storage is not connected yet (Vercel Blob).' });
  const c = req.body;
  if (!c || typeof c !== 'object' || !c.t || !c.profile || !Array.isArray(c.publications) || !Array.isArray(c.experience)) {
    return L.json(res, 400, { error: 'This does not look like portfolio content.' });
  }
  const text = JSON.stringify(c);
  if (text.length > 900000) return L.json(res, 413, { error: 'Content is too large.' });
  try {
    const { put } = require('@vercel/blob');
    await put('portfolio/content.json', text, { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    return L.json(res, 200, { ok: true });
  } catch (e) {
    return L.json(res, 500, { error: 'Could not save: ' + (e && e.message ? e.message : e) });
  }
};
