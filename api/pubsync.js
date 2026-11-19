'use strict';
const L = require('./_lib');
// Admin only. Reads the public ORCID record and returns papers whose DOI is not on the site yet.
// Nothing is saved here: the admin adds them to the draft, and the owner reviews and publishes.
const clean = s => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
module.exports = async function (req, res) {
  if (!L.guardPost(req, res)) return;
  if (!L.isAuthed(req)) return L.json(res, 401, { error: 'Please sign in.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const m = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/.exec(String(body.orcid || ''));
  if (!m) return L.json(res, 400, { error: 'ORCID ID not found. Add the ORCID link in Profile first.' });
  const have = new Set((Array.isArray(body.dois) ? body.dois : []).map(d => String(d || '').toLowerCase().trim()).filter(Boolean));
  try {
    const r = await fetch('https://pub.orcid.org/v3.0/' + m[1] + '/works', { headers: { Accept: 'application/json' } });
    if (!r.ok) return L.json(res, 502, { error: 'ORCID did not answer (' + r.status + '). Try again later.' });
    const data = await r.json();
    const found = [];
    for (const g of (data.group || [])) {
      const ids = (g['external-ids'] && g['external-ids']['external-id']) || [];
      const d = ids.find(x => x['external-id-type'] === 'doi');
      const doi = d ? String(d['external-id-value']).toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim() : '';
      if (!doi || have.has(doi)) continue;
      found.push(doi);
    }
    const items = [];
    for (const doi of found.slice(0, 20)) {
      let w = {};
      try {
        const cr = await fetch('https://api.crossref.org/works/' + encodeURIComponent(doi), { headers: { 'User-Agent': 'portfolio-sync/1.0' } });
        if (cr.ok) w = (await cr.json()).message || {};
      } catch (e) {}
      const issued = (w.issued && w.issued['date-parts'] && w.issued['date-parts'][0]) || [];
      const j = clean((w['container-title'] || [])[0]);
      const vol = [w.volume, w['article-number'] || w.page].filter(Boolean).join(', ');
      const conf = w.type === 'proceedings-article';
      items.push({
        year: issued[0] || new Date().getFullYear(),
        title: clean((w.title || [])[0]) || doi,
        journal: [j, vol].filter(Boolean).join(' ') || '',
        q: conf ? 'Conf' : '',
        cites: w['is-referenced-by-count'] || 0,
        doi: doi,
        kind: conf ? 'conf' : 'journal',
        note: { en: '', bn: '', ar: '' }
      });
    }
    L.json(res, 200, { orcid: m[1], total: (data.group || []).length, items: items });
  } catch (e) {
    L.json(res, 502, { error: 'Could not reach ORCID. Try again later.' });
  }
};
