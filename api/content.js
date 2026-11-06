'use strict';
const L = require('./_lib');
// Public: returns the live content. Uses the saved copy in Vercel Blob if there is one,
// otherwise the content.json shipped with the site.
module.exports = async function (req, res) {
  const fresh = req.query && req.query.fresh;
  res.setHeader('Cache-Control', fresh ? 'no-store' : 'public, max-age=0, s-maxage=20, stale-while-revalidate=120');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const url = L.blobUrl('portfolio/content.json');
  if (url) {
    try {
      const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
      if (r.ok) { res.statusCode = 200; return res.end(await r.text()); }
    } catch (e) { /* fall through to the bundled copy */ }
  }
  try {
    const r = await fetch('https://' + req.headers.host + '/content.json', { cache: 'no-store' });
    res.statusCode = r.status;
    return res.end(await r.text());
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Content unavailable.' }));
  }
};
