// 한 번 열어 본 뒤에는 인터넷이 없어도 사전이 열리도록 파일을 기기에 저장해 둡니다.
// CACHE 이름은 'twko-' + app.js의 VERSION과 같게 둡니다(tools/deploy.py가 함께 올립니다).
// 이름이 바뀌면 새 버전을 설치하면서 옛 저장분을 지웁니다.
var CACHE = 'twko-1.3.0';
// 10MB짜리 영어 참고 사전은 따로 저장해서 버전이 바뀌어도 다시 받지 않습니다.
// data/cedict-data.js를 새로 만들었을 때만 아래 숫자를 올려 주세요.
var BIG_CACHE = 'twko-cedict-1';
var CORE = ['./', 'index.html', 'style.css', 'app.js', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json',
  'lib/hanzilookup.min.js', 'data/hanzi-strokes.js',
  'data/ko-data.js', 'data/ko-data-2.js', 'data/ko-data-3.js', 'data/ko-data-4.js', 'data/ko-data-5.js', 'data/measure-data.js', 'data/grammar-data.js', 'data/examples-data.js', 'data/examples-data-2.js', 'data/examples-data-3.js'];
var BIG = 'data/cedict-data.js';
var WAIT = 3000;   // 인터넷이 이 시간(ms) 안에 답하지 않으면 저장해 둔 파일로 연다(신호가 약한 곳 대비)
var slowUntil = 0; // 방금 인터넷이 늦었으면 이 시각까지는 기다리지 않고 바로 저장분을 쓴다(파일마다 3초씩 기다리지 않도록)
var opened = {}, lastOpened = '';   // 사전 화면을 인터넷('network')에서 받았는지 저장분('cache')에서 꺼냈는지(앱이 여는 화면에 표시)

self.addEventListener('install', function (e) {
  // 영어 참고 사전: 이미 있으면 그대로, 옛 저장분에 있으면 옮겨 오고(다시 받지 않음), 없으면 뒤에서 받는다.
  var big = caches.open(BIG_CACHE).then(function (bc) {
    return bc.match(BIG).then(function (hit) {
      if (hit) return null;
      return caches.match(BIG).then(function (old) {
        if (old) return bc.put(BIG, old);
        bc.add(BIG).catch(function () {});   // 기다리지 않는다(처음 한 번만 열어도 나머지는 바로 준비되도록)
        return null;
      });
    });
  }).catch(function () {});
  e.waitUntil(Promise.all([caches.open(CACHE).then(function (c) { return c.addAll(CORE); }), big])
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== BIG_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// 앱이 묻는 "오프라인 준비 상태": 저장해야 할 파일 중 몇 개가 저장돼 있는지 답한다.
self.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'offline-status' || !e.ports || !e.ports[0]) return;
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (f) { return c.match(f); })); }),
    caches.open(BIG_CACHE).then(function (bc) { return bc.match(BIG); })
  ]).then(function (r) {
    var have = r[0].filter(Boolean).length + (r[1] ? 1 : 0);
    var how = (e.source && opened[e.source.id]) || lastOpened;
    e.ports[0].postMessage({ have: have, total: CORE.length + 1, big: !!r[1], cache: CACHE, opened: how });
  }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.searchParams.has('check')) return;   // 앱의 연결 확인 요청은 저장분을 거치지 않고 인터넷으로 바로 보낸다
  if (url.pathname.slice(-BIG.length) === BIG) {
    // 영어 참고 사전: 저장해 둔 것이 있으면 그것을 쓰고, 없을 때만 내려받는다.
    e.respondWith(caches.open(BIG_CACHE).then(function (bc) {
      return bc.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          if (res && res.ok) bc.put(e.request, res.clone());
          return res;
        });
      });
    }));
    return;
  }
  // 작은 파일: 인터넷이 되면 새 버전을 받는다. 끊겼거나 WAIT 안에 답이 없으면 저장해 둔 것을 쓴다.
  // 늦게라도 받아지면 저장분을 새것으로 바꿔 두어 다음에 열 때 반영된다.
  // (cache: 'no-cache' = 브라우저에 남은 옛 파일을 쓰지 않고 서버에 새 버전이 있는지 매번 확인)
  var t0 = Date.now(), isPage = e.request.mode === 'navigate';
  var net = fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    if (Date.now() - t0 < WAIT) slowUntil = 0;   // 제때 답이 왔으면 인터넷이 다시 괜찮아진 것
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  });
  e.waitUntil(net.catch(function () {}));
  e.respondWith(new Promise(function (resolve, reject) {
    var done = false;
    function finish(res, how) {
      if (done || !res) return;
      done = true;
      if (isPage) { lastOpened = how; if (e.resultingClientId) opened[e.resultingClientId] = how; }
      resolve(res);
    }
    function fromCache() { return caches.match(e.request, { ignoreSearch: true }); }
    var timer = setTimeout(function () {
      if (!done) slowUntil = Date.now() + 15000;
      fromCache().then(function (hit) { finish(hit, 'cache'); });
    }, t0 < slowUntil ? 0 : WAIT);
    net.then(function (res) { clearTimeout(timer); finish(res, 'network'); }).catch(function () {
      clearTimeout(timer);
      fromCache().then(function (hit) {
        if (hit) finish(hit, 'cache');
        else if (!done) { done = true; reject(new Error('offline')); }
      });
    });
  }));
});
