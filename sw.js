// 한 번 열어 본 뒤에는 인터넷이 없어도 사전이 열리도록 파일을 기기에 저장해 둡니다.
// data/cedict-data.js(영어 참고 사전)를 새로 만들었을 때는 아래 CACHE 이름의 숫자를 올려 주세요.
var CACHE = 'twko-v2';
var CORE = ['./', 'index.html', 'style.css', 'app.js', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json',
  'data/ko-data.js', 'data/ko-data-2.js'];
var BIG = 'data/cedict-data.js';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  var put = function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  };
  if (url.pathname.slice(-BIG.length) === BIG) {
    // 10MB짜리 큰 파일: 저장해 둔 것이 있으면 그것을 쓰고, 없을 때만 내려받는다.
    e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request).then(put); }));
  } else {
    // 작은 파일: 인터넷이 되면 새 버전을 받고, 안 되면 저장해 둔 것을 쓴다.
    e.respondWith(fetch(e.request).then(put).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
  }
});
