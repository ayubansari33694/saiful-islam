// Minimal service worker so Chrome offers "Install app". Network-only: no caching, so edits are always live.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
