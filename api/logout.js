'use strict';
const L = require('./_lib');
module.exports = function (req, res) {
  L.setCookie(res, '', 0);
  L.json(res, 200, { ok: true });
};
