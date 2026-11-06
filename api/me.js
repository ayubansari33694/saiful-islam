'use strict';
const L = require('./_lib');
module.exports = function (req, res) {
  L.json(res, 200, {
    authed: L.isAuthed(req),
    passwordSet: !!process.env.ADMIN_PASSWORD,
    storageSet: !!process.env.BLOB_READ_WRITE_TOKEN
  });
};
