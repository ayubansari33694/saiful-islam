'use strict';
const L = require('./_lib');
module.exports = async function (req, res) {
  if (!L.guardPost(req, res)) return;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return L.json(res, 503, { error: 'ADMIN_PASSWORD is not set on the server yet.' });
  const given = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (given && L.safeEq(given, pw)) {
    L.setCookie(res, L.makeToken(30), 30 * 86400);
    return L.json(res, 200, { ok: true });
  }
  await new Promise(function (r) { setTimeout(r, 1200); }); // slow down guessing
  return L.json(res, 401, { error: 'Wrong password.' });
};
