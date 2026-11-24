(function () {
  'use strict';

  // ---------- 버전 ----------
  // 고쳐서 올릴 때마다 올린다. sw.js의 CACHE 이름도 'twko-' + 같은 번호로 맞춘다.
  // tools/deploy.py는 바뀐 파일이 있는데 번호가 그대로면 끝자리를 자동으로 올리고 날짜를 바꾼다.
  var VERSION = '1.3.1', VERSION_DATE = '2026-11-24';

  // ---------- 도우미 ----------
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 불가 환경 */ }
  }
  var HAN = /[㐀-鿿]/;
  function chars(s) { return Array.from(s); }
  function wordHref(t) { return '#/w/' + encodeURIComponent(t); }

  // ---------- 병음: 성조 부호·색상 ----------
  var MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  function markSyllable(s) {
    var m = /^([A-Za-zü:]+)([1-5])$/.exec(s);
    if (!m) return s.replace(/u:|v/g, 'ü');
    var body = m[1].replace(/u:|v/g, 'ü'), tone = +m[2];
    if (tone === 5) return body;
    var low = body.toLowerCase(), i = low.indexOf('a');
    if (i < 0) i = low.indexOf('e');
    if (i < 0) i = low.indexOf('ou');
    if (i < 0) for (var k = low.length - 1; k >= 0; k--) if ('iouü'.indexOf(low[k]) >= 0) { i = k; break; }
    if (i < 0) return body;
    var marked = MARKS[low[i]][tone - 1];
    if (body[i] !== low[i]) marked = marked.toUpperCase();
    return body.slice(0, i) + marked + body.slice(i + 1);
  }
  function toneOf(s) { var m = /[a-zü:]([1-5])$/i.exec(s); return m ? +m[1] : 0; }
  function pinyinMarks(p) { return p.split(' ').map(markSyllable).join(' '); }
  function pinyinHtml(p) {
    return p.split(' ').map(function (s) {
      var t = toneOf(s);
      return t ? '<span class="t' + t + '">' + esc(markSyllable(s)) + '</span>' : esc(markSyllable(s));
    }).join(' ');
  }
  // 한자를 성조 색으로 칠한다(한자 수와 음절 수가 맞을 때만).
  function hanziHtml(t, p) {
    var syl = p ? p.split(' ') : [], cs = chars(t), n = 0, i = 0;
    cs.forEach(function (c) { if (HAN.test(c)) n++; });
    if (!n || n !== syl.length) return esc(t);
    return cs.map(function (c) {
      return HAN.test(c) ? '<span class="t' + toneOf(syl[i++]) + '">' + c + '</span>' : esc(c);
    }).join('');
  }

  // ---------- 병음 → 주음부호 ----------
  var INI = { b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ', d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ', g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
    j: 'ㄐ', q: 'ㄑ', x: 'ㄒ', zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ', z: 'ㄗ', c: 'ㄘ', s: 'ㄙ' };
  var FIN = { a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ', an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', er: 'ㄦ',
    i: 'ㄧ', ia: 'ㄧㄚ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', ian: 'ㄧㄢ', 'in': 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', io: 'ㄧㄛ', iai: 'ㄧㄞ',
    u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uan: 'ㄨㄢ', un: 'ㄨㄣ', uang: 'ㄨㄤ', ong: 'ㄨㄥ', ueng: 'ㄨㄥ',
    'ü': 'ㄩ', 'üe': 'ㄩㄝ', 'üan': 'ㄩㄢ', 'ün': 'ㄩㄣ', iong: 'ㄩㄥ' };
  var YW = { yi: 'i', ya: 'ia', ye: 'ie', yao: 'iao', you: 'iu', yan: 'ian', yin: 'in', yang: 'iang', ying: 'ing',
    yong: 'iong', yo: 'io', yai: 'iai', yu: 'ü', yue: 'üe', yuan: 'üan', yun: 'ün',
    wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'ui', wan: 'uan', wen: 'un', wang: 'uang', weng: 'ueng' };
  var WHOLE = { zhi: 'ㄓ', chi: 'ㄔ', shi: 'ㄕ', ri: 'ㄖ', zi: 'ㄗ', ci: 'ㄘ', si: 'ㄙ', r: 'ㄦ', e: 'ㄜ', ê: 'ㄝ' };
  var TONE = ['', '', 'ˊ', 'ˇ', 'ˋ', ''];
  function zhuyinSyllable(s) {
    var m = /^([a-zü:]+)([1-5])?$/.exec(s.toLowerCase());
    if (!m) return null;
    var body = m[1].replace(/u:|v/g, 'ü'), tone = m[2] ? +m[2] : 0, z;
    if (WHOLE[body]) z = WHOLE[body];
    else if (YW[body]) z = FIN[YW[body]];
    else {
      var ini = INI[body.slice(0, 2)] ? body.slice(0, 2) : (INI[body[0]] ? body[0] : '');
      var fin = body.slice(ini.length);
      if ('jqx'.indexOf(ini) >= 0 && ini && fin[0] === 'u') fin = 'ü' + fin.slice(1);
      if (!FIN[fin]) return null;
      z = (INI[ini] || '') + FIN[fin];
    }
    return tone === 5 ? '˙' + z : z + TONE[tone];
  }
  function zhuyin(p) { return p.split(' ').map(function (s) { return zhuyinSyllable(s) || s; }).join(' '); }
  function pinKey(p) { return p.toLowerCase().replace(/u:|ü/g, 'v').replace(/[^a-z]/g, ''); }
  function toneKey(p) { return (p || '').toLowerCase().replace(/u:|ü/g, 'v').replace(/[^a-z1-5]/g, ''); }   // 성조까지 구분하는 열쇠
  function zyKey(z) { return z.replace(/[ˊˇˋ˙\s]/g, ''); }

  // ---------- 데이터 ----------
  function parseKo(raw) {
    var list = [], seen = Object.create(null), cat = '', sub = '';
    raw.split('\n').forEach(function (line) {
      // "#분류" 줄: 아래 줄들의 기본 분류. "#분류 > 상황"이면 분류 목록에서 상황별로 묶어 보여 준다.
      if (line[0] === '#') { var hd = line.slice(1).split('>'); cat = hd[0].trim(); sub = (hd[1] || '').trim(); return; }
      var f = line.split('|');
      if (f.length < 3 || !f[0].trim()) return;
      var t = f[0].trim(), key = t + '|' + toneKey(f[1]);
      if (seen[key]) return;                                          // 같은 단어·같은 발음이 두 번 나오면 먼저 나온 것만 쓴다(성조만 다른 읽기는 따로 둔다: 子 zi3 / zi5)
      seen[key] = 1;
      var ex = null;
      if (f[6]) { var i = f[6].indexOf('='); if (i > 0) ex = { zh: f[6].slice(0, i), ko: f[6].slice(i + 1) }; }
      // 본토 표현 칸: "A / ~B / =C" (없음 = 본토에서 쓰는 말, ~ = 대만도 쓰지만 본토에서 더 흔함, = = 공통 표준어)
      var cnw = (f[4] || '').split('/').map(function (x) {
        x = x.trim();
        var k = x[0] === '~' || x[0] === '=' ? x[0] : '';
        return { w: k ? x.slice(1).trim() : x, k: k };
      }).filter(function (x) { return x.w; });
      list.push({ src: 'ko', t: t, s: '', p: f[1].trim(), ko: f[2].split(';').map(function (x) { return x.trim(); }),
        cat: (f[3] || '').trim() || cat, sub: (f[3] || '').trim() ? '' : sub, cn: cnw.map(function (x) { return x.w; }).join(' / '), cnw: cnw,
        note: (f[5] || '').trim(), ex: ex, en: '', k: pinKey(f[1]) });
    });
    return list;
  }
  var KO = parseKo(window.KO_RAW || '');

  // 양사(세는 말): 명사 → { mw: ['台', '輛'], note } — data/measure-data.js
  var MW = Object.create(null);
  (window.MW_RAW || '').split('\n').forEach(function (l) {
    if (!l || l[0] === '#') return;
    var f = l.split('|');
    if (f.length < 2 || !f[0].trim()) return;
    MW[f[0].trim()] = { mw: f[1].split(',').map(function (x) { return x.trim(); }).filter(Boolean), note: (f[2] || '').trim() };
  });

  // 문법 카드
  var LV_NAME = { A1: 'A1 · 입문', A2: 'A2 · 기초', B1: 'B1 · 중급', TW: '대만식 문법' };
  var GR = (window.GRAMMAR_RAW || '').split('\n').map(function (line) { return line.split('|'); })
    .filter(function (f) { return f.length >= 5 && f[0].trim(); })
    .map(function (f, i) {
      return { id: i, title: f[0].trim(), sum: f[1].trim(), lv: f[2].trim(), desc: f[3].trim(),
        ex: f[4].split('//').map(function (x) { var k = x.indexOf('='); return { zh: x.slice(0, k), ko: x.slice(k + 1) }; }),
        keys: (f[5] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean), tw: (f[6] || '').trim() };
    });
  function gRowHtml(g) {
    return '<a class="row" href="#/g/' + g.id + '"><div class="l1"><span class="gt" lang="zh-Hant">' + esc(g.title) + '</span></div>' +
      '<div class="df ko">' + (g.lv === 'TW' ? '' : '<span class="tag lv">' + g.lv + '</span>') +
      (g.lv === 'TW' || g.tw ? '<span class="tag tw">台</span>' : '') + esc(g.sum) + '</div></a>';
  }
  function grammarFor(q) {   // 검색어·표제어와 관련된 문법 카드
    if (!q) return [];
    var han = HAN.test(q);
    return GR.filter(function (g) {
      return han ? (g.keys.indexOf(q) >= 0 || g.title.indexOf(q) >= 0) : (g.sum.indexOf(q) >= 0);
    });
  }
  var CE = [];
  var USER = load('twko_user', []);
  var FAVS = load('twko_favs', []);
  var HIST = load('twko_hist', []);
  USER.forEach(function (e) { e.src = 'user'; e.s = ''; e.en = ''; e.k = pinKey(e.p || ''); });

  // 예문 모음: 예문 파일 + 단어에 달린 예문 + 생활 회화 문장 + 문법 카드 예문
  var EXS = [], PHRASE = Object.create(null);
  (function () {
    var seen = Object.create(null);
    function add(zh, ko) { zh = zh.trim(); if (zh && !seen[zh]) { seen[zh] = 1; EXS.push({ zh: zh, ko: ko.trim() }); } }
    (window.EX_RAW || '').split('\n').forEach(function (l) { var i = l.indexOf('='); if (i > 0) add(l.slice(0, i), l.slice(i + 1)); });
    KO.forEach(function (e) {
      if (e.ex) add(e.ex.zh, e.ex.ko);
      if (e.cat === '생활 회화') { PHRASE[e.t] = 1; add(e.t, e.ko[0]); }
    });
    GR.forEach(function (g) { g.ex.forEach(function (x) { if (/[。？！]$/.test(x.zh)) add(x.zh, x.ko); }); });
  })();

  var INDEX = Object.create(null);   // 표제어 → 항목 목록
  function buildIndex() {
    INDEX = Object.create(null);
    EXS.forEach(function (x) { x.tk = null; });
    USER.concat(KO).forEach(function (e) { (INDEX[e.t] = INDEX[e.t] || []).push(e); });
    // 성씨·고유명사 풀이(병음이 대문자로 시작)는 일반 풀이 뒤에 오도록 두 번에 나눠 넣는다.
    CE.forEach(function (e) { if (!e.h && !e.cap) (INDEX[e.t] = INDEX[e.t] || []).push(e); });
    CE.forEach(function (e) { if (!e.h && e.cap) (INDEX[e.t] = INDEX[e.t] || []).push(e); });
  }

  function linkCedict() {
    // 한국어 풀이가 있는 단어와 겹치는 영어 항목은 숨기고, 영어 풀이는 참고용으로 붙인다.
    var mine = Object.create(null);
    KO.concat(USER).forEach(function (e) { e.en = ''; (mine[e.t] = mine[e.t] || []).push(e); });
    CE.forEach(function (c) {
      var list = mine[c.t];
      c.h = false;
      if (!list) return;
      list.forEach(function (e) { if (!e.p) { e.p = c.p; e.k = c.k; } });
      var hits = list.filter(function (e) { return e.k === c.k || e.k === c.km; });
      if (hits.length > 1) {   // 성조만 다른 풀이가 여럿이면(中 zhong1 / zhong4) 성조까지 맞는 풀이에만 붙인다
        var exact = hits.filter(function (e) { var k = toneKey(e.p); return k === toneKey(c.p) || (c.pm && k === toneKey(c.pm)); });
        if (exact.length) hits = exact;
      }
      hits.forEach(function (e) {
        c.h = true;
        e.en = e.en ? e.en + '; ' + c.en : c.en;
        if (c.pm && !e.pm && c.k === e.k) e.pm = c.pm;
      });
    });
    buildIndex();
  }

  var ceState = 'loading';
  function loadCedict() {
    var s = document.createElement('script');
    s.src = 'data/cedict-data.js';
    s.onload = function () {
      var lines = (window.CEDICT_RAW || '').split('\n');
      window.CEDICT_RAW = null;
      for (var i = 0; i < lines.length; i++) {
        var f = lines[i].split('\t');
        if (f.length < 6) continue;
        var tw = f[3], p = tw || f[2];
        CE.push({ src: 'ce', t: f[0], s: f[1] || f[0], p: p, pm: tw ? f[2] : '', tw: f[4].indexOf('T') >= 0,
          prc: f[4].indexOf('P') >= 0, en: f[5].replace(/([㐀-鿿]+)\|[㐀-鿿]+/g, '$1').replace(/\//g, '; '),
          k: pinKey(p), km: tw ? pinKey(f[2]) : '', cap: /^[A-Z]/.test(p) });
      }
      ceState = 'ready';
      linkCedict();
      route();
    };
    s.onerror = function () { ceState = 'failed'; route(); };
    document.body.appendChild(s);
  }
  function statusText() {
    var n = '한국어 풀이 ' + (KO.length + USER.length).toLocaleString() + '개 · 영어 참고 사전 ';
    if (ceState === 'ready') return n + CE.length.toLocaleString() + '개';
    if (ceState === 'failed') return n + '불러오기 실패 (한국어 단어집만 검색됩니다)';
    return n + '불러오는 중…';
  }
  function shortDef(e) {
    if (e.d !== undefined) return e.d;
    return e.ko && e.ko.length ? e.ko.join('; ') : (e.en || '');
  }
  function isTw(e) { return !!(e.cn || e.tw); }

  // ---------- 검색 ----------
  var MAX = 80;
  function search(q, filter) {
    q = q.trim();
    if (!q) return [];
    var hits = [];
    function add(e, cls) {
      if (filter === 'ko' && e.src === 'ce') return;
      if (filter === 'tw' && !isTw(e)) return;
      hits.push({ e: e, score: cls * 1000 + (e.src === 'ce' ? 100 : 0) + (e.cap ? 60 : 0) + Math.min(e.t.length, 50) });
    }
    var own = USER.concat(KO), all = own.concat(CE);

    if (HAN.test(q)) {
      all.forEach(function (e) {
        if (e.h) return;
        if (e.t === q || e.s === q) add(e, 0);
        else if (e.t.indexOf(q) === 0 || (e.s && e.s.indexOf(q) === 0)) add(e, 1);
        else if (e.t.indexOf(q) > 0 || (e.s && e.s.indexOf(q) > 0)) add(e, 2);
        else if (e.cn && e.cn.indexOf(q) >= 0) add(e, e.cn.split(' / ').indexOf(q) >= 0 ? 0 : 3);
      });
    } else if (/[가-힣ㄱ-ㆎ]/.test(q)) {
      own.forEach(function (e) {
        var best = 9;
        e.ko.forEach(function (m) {
          var bare = m.replace(/\(.*?\)/g, '').trim();
          if (m === q || bare === q) best = Math.min(best, 0);
          else if (m.indexOf(q) === 0) best = Math.min(best, 1);
          else if (m.indexOf(q) > 0) best = Math.min(best, 2);
        });
        if (best === 9 && e.note && e.note.indexOf(q) >= 0) best = 4;
        if (best < 9) add(e, best);
      });
    } else if (/[ㄅ-ㄯ]/.test(q)) {
      var zq = zyKey(q);
      all.forEach(function (e) {
        if (e.h || !e.p) return;
        if (e.z === undefined) e.z = zyKey(zhuyin(e.p));
        if (e.z === zq) add(e, 0);
        else if (e.z.indexOf(zq) === 0) add(e, 2);
      });
    } else {
      var pq = pinKey(q), lq = q.toLowerCase();
      var word = lq.length >= 2 ? new RegExp('(^|[^a-z])' + lq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)') : null;
      all.forEach(function (e) {
        if (e.h) return;
        if (pq && e.k === pq) add(e, 0);
        else if (e.en && word && word.test(e.en.toLowerCase())) {
          var parts = e.en.toLowerCase().split('; ');
          add(e, parts.indexOf(lq) >= 0 || parts.indexOf('to ' + lq) >= 0 ? 1 : 3);
        } else if (pq.length >= 2 && e.k.indexOf(pq) === 0) add(e, 2);
      });
    }
    hits.sort(function (a, b) { return a.score - b.score; });
    return hits.slice(0, MAX).map(function (h) { return h.e; });
  }

  // ---------- 목록 한 줄 ----------
  function rowHtml(e) {
    var isKo = e.src !== 'ce' && !(e.d !== undefined && e.en1);
    var h = '<a class="row" href="' + wordHref(e.t) + '"><div class="l1"><span class="hz" lang="zh-Hant">' + hanziHtml(e.t, e.p) + '</span>';
    if (e.p) h += '<span class="py">' + pinyinHtml(e.p) + '</span><span class="zy">' + esc(zhuyin(e.p)) + '</span>';
    h += '</div><div class="df' + (isKo ? ' ko' : '') + '">';
    if (isTw(e)) h += '<span class="tag tw">台</span>';
    if (!isKo) h += '<span class="tag en">EN</span>';
    return h + esc(shortDef(e)) + '</div></a>';
  }
  function listHtml(list, emptyMsg) {
    if (!list.length) return '<p class="empty">' + emptyMsg + '</p>';
    return list.map(rowHtml).join('');
  }
  function snapshot(t) {
    var list = INDEX[t] || [], e = list[0];
    if (!e) return { t: t, p: '', d: '' };
    return { t: t, p: e.p, d: shortDef(e), tw: isTw(e), en1: e.src === 'ce' };
  }

  // ---------- 검색 화면 ----------
  var VS = '대만 vs 본토';
  var FF = '한자어 함정';   // 한국 한자어와 뜻이 다른 말: 메모에 "한국 한자어"가 들어간 단어를 모은다
  function isFF(e) { return e.note.indexOf('한국 한자어') >= 0; }
  function catItems(c) { return KO.filter(function (e) { return c === VS ? e.cn : c === FF ? isFF(e) : e.cat === c; }); }
  var filter = 'all', activeCat = '';

  var UI = load('twko_ui', {});   // 접어 둔 구역 기억: { hist: false, cats: false }
  function foldHead(key, title, n) {
    var open = UI[key] !== false;
    return '<button class="sec fold" data-act="fold" data-sec="' + key + '" aria-expanded="' + open + '"><span>' + title +
      ' <i>' + n + '</i></span><span class="chev">' + (open ? '접기 ▲' : '펼치기 ▼') + '</span></button>';
  }
  function homeHtml() {
    var h = '';
    if (HIST.length) {
      h += foldHead('hist', '최근 본 단어', HIST.length);
      if (UI.hist !== false) {
        h += '<div class="list">' + HIST.slice(0, 5).map(rowHtml).join('') + '</div>' +
          (HIST.length > 5 ? '<a class="more" href="#/hist">최근 본 단어 전체 보기 (' + HIST.length + ')</a>' : '');
      }
    }
    var counts = {}, order = [];
    KO.forEach(function (e) { if (!counts[e.cat]) { counts[e.cat] = 0; order.push(e.cat); } counts[e.cat]++; });
    h += foldHead('cats', '분류별 단어', order.length + 2);
    if (UI.cats !== false) {
      h += '<div class="chips">' + [VS, FF].map(function (c) {
        return '<a class="hot" href="#/c/' + encodeURIComponent(c) + '">' + c + '<span>' + catItems(c).length + '</span></a>';
      }).join('');
      order.forEach(function (c) { h += '<a href="#/c/' + encodeURIComponent(c) + '">' + esc(c) + '<span>' + counts[c] + '</span></a>'; });
      h += '</div>';
    }
    h += '<a class="more" href="#/p">처음이라면: 성조 · 주음부호 · 대만 발음 안내 보기 ›</a>';
    h += '<p class="status">' + esc(statusText()) + '<br>검색 예: <span lang="zh-Hant">捷運</span> · 택시 · lese · ㄐㄧㄝˊ ㄩㄣˋ · pineapple' +
      '<br>버전 ' + VERSION + ' (' + VERSION_DATE + ')' + statusLine() + '</p>';
    return h;
  }
  function renderSearch() {
    var q = $('#q').value.trim();
    $('#clear').hidden = !q;
    $('#filters').hidden = !q;
    if (q) {
      var list = search(q, filter);
      var gr = /[㐀-鿿가-힣]/.test(q) && filter === 'all' ? grammarFor(q).slice(0, 3) : [];
      $('#home').innerHTML = gr.length ? '<h2 class="sec">문법</h2><div class="list">' + gr.map(gRowHtml).join('') + '</div>' : '';
      $('#results').innerHTML = (list.length ? '<div class="count">결과 ' + list.length + (list.length === MAX ? '개 이상' : '개') + '</div>' : '') +
        listHtml(list, ceState === 'loading' ? '검색 결과가 없습니다.<br>영어 참고 사전을 아직 불러오는 중입니다.' : '검색 결과가 없습니다.');
    } else if (activeCat) {
      var items = catItems(activeCat), subs = [], by = {};
      items.forEach(function (e) { var s = e.sub || ''; if (!by[s]) { by[s] = []; subs.push(s); } by[s].push(e); });
      $('#home').innerHTML = '<h2 class="sec">' + esc(activeCat) + ' · ' + items.length + '개 <a href="#/">분류 목록</a></h2>';
      $('#results').innerHTML = subs.length > 1 ? subs.map(function (s) {   // 상황별로 나눈 분류(생활 회화)
        return '<h3 class="subsec">' + esc(s || '그 밖의 말') + ' <i>' + by[s].length + '</i></h3>' + listHtml(by[s], '');
      }).join('') : listHtml(items, '');
    } else {
      $('#home').innerHTML = homeHtml();
      $('#results').innerHTML = '';
    }
  }

  // ---------- 상세 화면 ----------
  var entryWord = '', entryTab = 'def';

  // 문장을 사전에 있는 단어 단위로 자른다. 통문장 표제어는 건너뛴다.
  // 왼쪽부터 가장 긴 단어를 잡으면 在台灣이 在台|灣, 換工作가 換工|作처럼 잘리므로,
  // 한자 덩어리마다 "조각 비용"의 합이 가장 작은 나누기를 고른다.
  //   한국어 풀이가 있는 단어(한 글자 포함) 100 · 영어 풀이뿐인 두 글자 이상 단어 150 · 풀이가 없거나 영어뿐인 한 글자 200
  //   (영어 풀이 단어는 한 글자 둘보다는 싸게 두어 交往·他們이 交|往처럼 쪼개지지 않게 한다)
  // 그 밖에는 비용이 같을 때만 갈리도록:
  //   홀로 잘 쓰이는 한 글자(上·人·在·了 등)는 99 → 網路上 = 網路|上, 沒有人 = 沒有|人, 這個人 = 這個|人
  //   그래도 같으면 뒤쪽 단어가 길어지는 쪽 → 最好吃 = 最|好吃, 十分鐘 = 十|分鐘
  var FREE1 = {};
  '上下裡人在了的是有不也都就很嗎呢吧和跟給到說會要'.split('').forEach(function (c) { FREE1[c] = 1; });
  // 예문 나누기에 쓰지 않는 영어 사전 단어: 문장 속에서는 거의 다른 뜻으로 잘못 걸린다
  // (說得很好 → 說|得很|好, 我去超商 → 我去|超商, 我等了 → 我等|了, 搭錯車 → 搭|錯車, 都會去 → 都會|去).
  var NOSEG = { '得很': 1, '我去': 1, '我等': 1, '錯車': 1, '都會': 1, '要看': 1, '完了': 1 };
  function wordCost(w, single) {
    var list = INDEX[w];
    if (single) return list && list[0].src !== 'ce' ? (FREE1[w] ? 99 : 100) : 200;
    if (!list || PHRASE[w] || (NOSEG[w] && list[0].src === 'ce')) return -1;   // 쓸 수 없는 조각
    return list[0].src !== 'ce' ? 100 : 150;
  }
  function splitHan(cs) {
    var n = cs.length, best = new Array(n + 1), step = new Array(n + 1);
    best[n] = 0;
    for (var i = n - 1; i >= 0; i--) {
      best[i] = Infinity;
      for (var k = 1; k <= Math.min(6, n - i); k++) {
        var c = wordCost(cs.slice(i, i + k).join(''), k === 1);
        if (c < 0) continue;
        if (c + best[i + k] < best[i]) { best[i] = c + best[i + k]; step[i] = k; }
      }
    }
    var out = [];
    for (var j = 0; j < n; j += step[j]) out.push(cs.slice(j, j + step[j]).join(''));
    return out;
  }
  function tokenize(text) {
    var out = [], cs = chars(text), i = 0;
    while (i < cs.length) {
      if (!HAN.test(cs[i])) { out.push({ w: cs[i], han: false }); i++; continue; }
      var j = i;
      while (j < cs.length && HAN.test(cs[j])) j++;
      splitHan(cs.slice(i, j)).forEach(function (w) { out.push({ w: w, han: true }); });
      i = j;
    }
    return out;
  }
  function segment(text) {   // 예문 속 단어를 누를 수 있게 한다(누르면 그 자리에서 뜻 창이 뜬다).
    return tokenize(text).map(function (k) {
      return k.han ? '<a class="pw" href="' + wordHref(k.w) + '" data-c="' + esc(k.w) + '">' + esc(k.w) + '</a>' : esc(k.w);
    }).join('');
  }
  function exHtml(x) {
    return '<div class="ex"><button class="say" data-act="say" data-t="' + esc(x.zh) + '" aria-label="예문 듣기">' +
      '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/></svg></button>' +
      '<div class="zh" lang="zh-Hant">' + segment(x.zh) + '</div><div class="tr">' + esc(x.ko) + '</div></div>';
  }
  function examplesFor(t, skip) {   // 표제어가 들어 있는 예문(짧은 것부터 최대 5개)
    var multi = chars(t).length > 1;
    return EXS.filter(function (x) {
      if (x.zh === t || skip[x.zh] || x.zh.indexOf(t) < 0) return false;
      if (multi) return true;
      if (!x.tk) x.tk = tokenize(x.zh).map(function (k) { return k.w; });
      return x.tk.indexOf(t) >= 0;
    }).sort(function (a, b) { return a.zh.length - b.zh.length; }).slice(0, 5);
  }
  function linkWords(s) {     // "A / B" 형태의 본토 표현을 각각 링크로
    return s.split(' / ').map(function (w) { return HAN.test(w) ? '<a href="' + wordHref(w) + '" lang="zh-Hant">' + esc(w) + '</a>' : esc(w); }).join(' / ');
  }
  function senseHtml(e, showReading) {
    var h = '<div class="sense">';
    if (showReading && e.p) h += '<div class="reading">' + pinyinHtml(e.p) + '<span class="zy">' + esc(zhuyin(e.p)) + '</span></div>';
    if (e.ko && e.ko.length) {
      h += '<ol class="defs' + (e.ko.length === 1 ? ' single' : '') + '">' + e.ko.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ol>';
    } else {
      var parts = e.en.split('; ');
      h += '<ol class="defs en' + (parts.length === 1 ? ' single' : '') + '">' + parts.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ol>';
    }
    var b = '';
    if (e.cn) {
      var only = function (k) { return e.cnw.filter(function (x) { return x.k === k; }).map(function (x) { return x.w; }).join(' / '); };
      var main = only(''), more = only('~'), std = only('=');
      b += '<span class="badge">' + (!main && !std ? '대만에서 더 흔함' : '대만 표현') + '</span>';
      if (main) b += '<span class="badge cn">본토: ' + linkWords(main) + '</span>';
      if (more) b += '<span class="badge cn">본토에서 더 흔함: ' + linkWords(more) + '</span>';
      if (std) b += '<span class="badge plain">표준어: ' + linkWords(std) + '</span>';
    }
    else if (e.tw) b += '<span class="badge">대만 표현</span>';
    if (e.prc) b += '<span class="badge cn">본토 표현 포함</span>';
    if (e.pm) b += '<span class="badge cn">본토 발음: ' + esc(pinyinMarks(e.pm)) + '</span>';
    if (e.src === 'ce') b += '<span class="badge plain">영어 풀이</span>';
    if (e.src === 'user') b += '<span class="badge plain">내 단어</span>';
    if (e.cat) b += '<span class="badge plain">' + esc(e.cat) + '</span>';
    if (b) h += '<div class="badges">' + b + '</div>';
    if (e.note) h += '<p class="note">' + esc(e.note) + '</p>';
    if (e.ex) h += exHtml(e.ex);
    if (e.src !== 'ce' && e.en) h += '<p class="ref">영어 참고: ' + esc(e.en) + '</p>';
    if (e.src === 'ce') h += '<button class="linkbtn" data-act="addko" data-t="' + esc(e.t) + '" data-p="' + esc(e.p) + '">한국어 뜻 직접 추가</button>';
    return h + '</div>';
  }
  // 단어 화면의 '세는 말' 칸: 一台機車 · 一輛機車. 양사 글자를 누르면 그 자리에서 뜻이 뜬다.
  function mwHtml(t) {
    var m = MW[t];
    if (!m || !m.mw.length) return '';
    var first = '一' + m.mw[0] + t;
    return '<div class="sense mwbox"><div class="mw-head"><span class="mw-label">세는 말(양사)</span>' +
      '<button class="say" data-act="say" data-t="' + esc(first) + '" aria-label="' + esc(first) + ' 듣기">' +
      '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/></svg></button></div>' +
      '<div class="mw-items">' + m.mw.map(function (w) {
        return '<span class="mw-item" lang="zh-Hant">一<a class="pw" href="' + wordHref(w) + '" data-c="' + esc(w) + '">' + esc(w) + '</a>' + esc(t) + '</span>';
      }).join('<span class="mw-sep">·</span>') + '</div>' +
      (m.note ? '<p class="note">' + esc(m.note) + '</p>' : '') + '</div>';
  }
  function relatedWords(t) {
    var hits = [];
    USER.concat(KO, CE).forEach(function (e) {
      if (e.h || e.t === t) return;
      var i = e.t.indexOf(t);
      if (i >= 0) hits.push({ e: e, s: (i === 0 ? 0 : 1000) + (e.src === 'ce' ? 100 : 0) + e.t.length });
    });
    hits.sort(function (a, b) { return a.s - b.s; });
    return hits.slice(0, 60).map(function (x) { return x.e; });
  }
  // 표제어의 글자를 하나씩 누를 수 있게 만든다(누르면 그 글자의 뜻이 아래에 뜬다).
  function headCharsHtml(t, p) {
    var syl = p ? p.split(' ') : [], cs = chars(t), n = 0, i = 0;
    cs.forEach(function (c) { if (HAN.test(c)) n++; });
    var match = n && n === syl.length;
    return cs.map(function (c, idx) {
      if (!HAN.test(c)) return esc(c);
      var s = match ? syl[i++] : '';
      return '<button class="hc pw' + (s ? ' t' + toneOf(s) : '') + '" data-act="peek" data-c="' + c + '" data-i="' + idx + '" data-s="' + esc(s) + '">' + c + '</button>';
    }).join('');
  }
  function renderEntry() {
    var t = entryWord, list = INDEX[t] || [], first = list[0];
    var multi = chars(t).length > 1;
    var h = '<div class="ehead"><div class="hz" lang="zh-Hant">' +
      (multi ? headCharsHtml(t, first ? first.p : '') : (first ? hanziHtml(t, first.p) : esc(t))) + '</div>';
    if (first && first.p) h += '<div class="py">' + pinyinHtml(first.p) + '</div><div class="zy">' + esc(zhuyin(first.p)) + '</div>';
    if (multi && !UI.peeked) h += '<div class="hint">글자를 누르면 그 글자의 뜻을 볼 수 있습니다</div>';
    h += '</div>';
    var cs = chars(t).filter(function (c, i, a) { return HAN.test(c) && a.indexOf(c) === i; });
    if (!multi && entryTab === 'chars') entryTab = 'def';
    h += '<div class="tabs"><button data-etab="def" class="' + (entryTab === 'def' ? 'on' : '') + '">뜻풀이</button>' +
      (multi ? '<button data-etab="chars" class="' + (entryTab === 'chars' ? 'on' : '') + '">글자</button>' : '') +
      '<button data-etab="words" class="' + (entryTab === 'words' ? 'on' : '') + '">단어</button></div>';
    if (entryTab === 'def') {
      if (!list.length) {
        h += '<p class="empty">' + (ceState === 'loading' ? '사전을 불러오는 중입니다…' :
          '수록되지 않은 표제어입니다.' + (multi ? '<br>‘글자’ 탭에서 한 글자씩 볼 수 있습니다.' : '')) + '</p>';
      } else {
        h += list.map(function (e) { return senseHtml(e, list.length > 1); }).join('');
      }
      h += mwHtml(t);
      var own = {};
      list.forEach(function (e) { if (e.ex) own[e.ex.zh] = 1; });
      var exs = examplesFor(t, own);
      if (exs.length) h += '<h2 class="sec">예문</h2><div class="sense">' + exs.map(exHtml).join('') + '</div>';
      var gr = GR.filter(function (g) { return g.keys.indexOf(t) >= 0; });
      if (gr.length) h += '<h2 class="sec">이 단어가 쓰이는 문법</h2><div class="list">' + gr.map(gRowHtml).join('') + '</div>';
    } else if (entryTab === 'chars') {
      h += '<div class="list">' + cs.map(function (c) {
        return (INDEX[c] || [{ t: c, p: '', d: '', src: 'ce' }]).map(rowHtml).join('');
      }).join('') + '</div>';
    } else {
      h += '<div class="list">' + listHtml(relatedWords(t), '이 표제어가 들어간 단어가 없습니다.') + '</div>';
    }
    $('#entry').innerHTML = h;
    $('#favbtn').classList.toggle('on', FAVS.some(function (f) { return f.t === t; }));
  }

  // ---------- 뜻 미리 보기 창 ----------
  // 표제어의 글자나 예문 속 단어(.pw)를 누르면, 화면을 옮기지 않고 그 자리에서 뜻을 띄운다.
  var peek = null;   // 떠 있는 창: { box: '#entry' 또는 '#gcard', n: 그 안에서 몇 번째 .pw인지, w: 띄운 단어 }
  function closePeek() {
    if (!peek) return;
    peek = null;
    $('#peek').hidden = true;
    document.body.classList.remove('peek-open');
    var on = document.querySelector('.pw.on');
    if (on) on.classList.remove('on');
  }
  function togglePeek(el) { if (el.classList.contains('on')) closePeek(); else openPeek(el, true); }
  function refreshPeek() {   // 창을 띄워 둔 채 화면이 다시 그려지면(사전 로딩 완료 등) 내용을 새로 채운다
    if (!peek) return;
    var el = $(peek.box).querySelectorAll('.pw')[peek.n];
    if (el && el.dataset.c === peek.w) openPeek(el, false); else closePeek();
  }
  function openPeek(btn, reveal) {
    var c = btn.dataset.c, syl = (btn.dataset.s || '').toLowerCase(), key = pinKey(syl);
    var single = chars(c).length === 1;
    // 이 단어 안에서 읽히는 발음의 풀이를 맨 위에 둔다(예: 銀行의 行은 háng).
    function rank(e) { return !syl ? 0 : (e.p.toLowerCase() === syl ? 0 : (e.k === key || e.km === key ? 1 : 2)); }
    var list = (INDEX[c] || []).map(function (e, i) { return { e: e, r: rank(e), i: i }; })
      .sort(function (a, b) { return a.r - b.r || a.i - b.i; }).map(function (x) { return x.e; });
    var first = list[0], SHOW = 4;
    var h = '<div class="pk-head"><span class="hz' + (single ? '' : ' multi') + '" lang="zh-Hant">' + (first ? hanziHtml(c, first.p) : esc(c)) + '</span>' +
      '<span class="grow"></span>' +
      '<button class="icon" data-act="say" data-t="' + esc(c) + '" aria-label="발음 듣기"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg></button>' +
      '<button class="icon" data-act="peek-close" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="pk-body">';
    if (!list.length) {
      h += '<p class="pk-none">' + (ceState === 'loading' ? '사전을 불러오는 중입니다…' : (single ? '수록되지 않은 글자입니다.' : '수록되지 않은 단어입니다.')) + '</p>';
    } else {
      h += list.slice(0, SHOW).map(function (e) {
        var isKo = e.ko && e.ko.length;
        return '<div class="pk-sense">' +
          (e.p ? '<div class="reading">' + pinyinHtml(e.p) + '<span class="zy">' + esc(zhuyin(e.p)) + '</span></div>' : '') +
          '<div class="pk-def' + (isKo ? ' ko' : '') + '">' + (isTw(e) ? '<span class="tag tw">台</span>' : '') +
          (isKo ? '' : '<span class="tag en">EN</span>') + esc(shortDef(e)) + '</div></div>';
      }).join('');
    }
    h += '</div>';
    var box = btn.closest('#gcard') ? '#gcard' : '#entry';
    var here = box === '#entry' && c === entryWord;   // 지금 보고 있는 표제어 자신이면 "자세히 보기"가 필요 없다
    if (list.length && !here) {
      h += '<a class="pk-more" href="' + wordHref(c) + '">‘' + esc(c) + '’ 자세히 보기' +
        (list.length > SHOW ? ' (풀이 ' + list.length + '개)' : '') + ' ›</a>';
    }
    var el = $('#peek');
    el.innerHTML = h;
    el.hidden = false;
    el.querySelector('.pk-body').scrollTop = 0;
    var on = document.querySelector('.pw.on');
    if (on) on.classList.remove('on');
    btn.classList.add('on');
    peek = { box: box, n: Array.prototype.indexOf.call($(box).querySelectorAll('.pw'), btn), w: c };
    document.body.style.setProperty('--pk-h', el.offsetHeight + 'px');
    document.body.classList.add('peek-open');
    if (reveal) {   // 누른 단어가 창에 가려지면 보이는 곳까지 화면을 올린다
      var gap = btn.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 16;
      if (gap > 0) window.scrollBy({ top: gap, behavior: 'smooth' });
    }
    if (btn.classList.contains('hc') && !UI.peeked) {
      UI.peeked = true; save('twko_ui', UI);
      var hint = document.querySelector('.ehead .hint');
      if (hint) hint.remove();
    }
  }
  function addHistory(t) {
    if (!INDEX[t]) return;
    HIST = HIST.filter(function (x) { return x.t !== t; });
    HIST.unshift(snapshot(t));
    HIST = HIST.slice(0, 100);
    save('twko_hist', HIST);
  }

  // ---------- 문법 화면 ----------
  var gfilter = 'all';
  var GUIDE_ROW = '<a class="row" href="#/p"><div class="l1"><span class="gt">발음 안내</span></div>' +
    '<div class="df ko">성조 · 주음부호 표 · 대만 발음과 본토 발음의 차이</div></a>';
  function renderGrammar() {
    var h = gfilter === 'all' ? '<h2 class="sec">처음이라면</h2>' + GUIDE_ROW : '';
    ['A1', 'A2', 'B1', 'TW'].forEach(function (lv) {
      if (gfilter !== 'all' && gfilter !== lv && !(gfilter === 'TW')) return;
      var items = GR.filter(function (g) {
        if (gfilter === 'TW') return g.lv === lv && (g.lv === 'TW' || g.tw);
        return g.lv === lv;
      });
      if (items.length) h += '<h2 class="sec">' + LV_NAME[lv] + ' · ' + items.length + '개</h2>' + items.map(gRowHtml).join('');
    });
    $('#glist').innerHTML = h || '<p class="empty">문법 카드가 없습니다.</p>';
  }
  function renderGCard(id) {
    var g = GR[id];
    if (!g) { $('#gcard').innerHTML = '<p class="empty">문법 카드를 찾을 수 없습니다.</p>'; return; }
    var h = '<div class="ehead"><div class="gtitle" lang="zh-Hant">' + esc(g.title) + '</div><div class="gsum">' + esc(g.sum) + '</div>' +
      '<div class="badges"><span class="badge plain">' + LV_NAME[g.lv] + '</span>' + (g.lv !== 'TW' && g.tw ? '<span class="badge">대만 참고</span>' : '') + '</div></div>';
    h += '<div class="sense"><p class="gdesc">' + esc(g.desc) + '</p>';
    h += g.ex.map(exHtml).join('');
    if (g.tw) h += '<p class="twnote"><b>대만 · 본토 차이</b> ' + esc(g.tw) + '</p>';
    h += '</div>';
    var words = [];
    g.keys.forEach(function (k) { if (INDEX[k]) words.push(INDEX[k][0]); });
    if (words.length) h += '<h2 class="sec">관련 단어</h2><div class="list">' + words.map(rowHtml).join('') + '</div>';
    $('#gcard').innerHTML = h;
  }

  // ---------- 그 밖의 화면 ----------
  function renderFavs() { $('#favlist').innerHTML = listHtml(FAVS, '단어 화면에서 ★을 누르면 여기에 담깁니다.'); }
  function renderHist() { $('#histlist').innerHTML = listHtml(HIST, '아직 본 단어가 없습니다.'); }
  function renderMine() {
    $('#minelist').innerHTML = USER.length ? USER.map(function (e) {
      return '<div class="rowwrap">' + rowHtml(e) + '<button data-act="del" data-t="' + esc(e.t) + '" data-p="' + esc(e.p) + '">삭제</button></div>';
    }).join('') : '<p class="empty">아직 추가한 단어가 없습니다.</p>';
  }

  // ---------- 화면 전환 ----------
  var current = '', scrollPos = {}, lastHash = null;
  function route() {
    var segs = location.hash.slice(1).split('/').filter(Boolean).map(function (x) {
      try { return decodeURIComponent(x); } catch (e) { return x; }
    });
    var screen = 'search', sameHash = lastHash === location.hash;
    if (segs[0] === 'w' && segs[1]) screen = 'entry';
    else if (segs[0] === 'g') screen = segs[1] !== undefined ? 'gcard' : 'grammar';
    else if (segs[0] === 'p') screen = 'guide';   // 발음 안내(내용은 index.html에 그대로 적혀 있다)
    else if (segs[0] === 'fav' || segs[0] === 'hist' || segs[0] === 'mine') screen = segs[0];
    if (!sameHash && current) scrollPos[current] = window.scrollY;
    if (!sameHash) closePeek();
    if (screen !== 'search' && hw.open) hwClose();

    if (screen === 'search') { activeCat = segs[0] === 'c' ? (segs[1] || '') : ''; renderSearch(); }
    if (screen === 'entry') {
      if (entryWord !== segs[1]) { entryWord = segs[1]; entryTab = 'def'; }
      if (!sameHash || ceState === 'ready') addHistory(entryWord);
      renderEntry();
    }
    if (screen === 'fav') renderFavs();
    if (screen === 'hist') renderHist();
    if (screen === 'mine') renderMine();
    if (screen === 'grammar') renderGrammar();
    if (screen === 'gcard') renderGCard(+segs[1]);

    ['search', 'entry', 'grammar', 'gcard', 'guide', 'fav', 'hist', 'mine'].forEach(function (s) { $('#screen-' + s).hidden = s !== screen; });
    var navOf = { entry: 'search', gcard: 'grammar', guide: 'grammar' };
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'), function (a) {
      a.classList.toggle('on', a.dataset.nav === (navOf[screen] || screen));
    });
    var detail = screen === 'entry' || screen === 'gcard' || screen === 'guide';
    if (!sameHash) window.scrollTo(0, detail ? 0 : (scrollPos[screen + location.hash] || 0));
    current = screen + location.hash;
    lastHash = location.hash;
    refreshPeek();
  }
  window.addEventListener('hashchange', route);

  // ---------- 음성 ----------
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, 6000);
  }
  var synth = window.speechSynthesis, voices = [], lastUtter = null;
  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  if (synth) {
    loadVoices();   // 기기에 따라 음성 목록이 늦게 준비되므로 준비되면 다시 읽는다
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }
  function pickVoice() {   // 대만 중국어 → 그 밖의 표준 중국어 순으로 고른다(광둥어 제외)
    var zh = voices.filter(function (v) {
      return /^(zh|cmn)/i.test(v.lang) && !/HK|MO|yue|Cantonese|粵/i.test(v.lang + ' ' + v.name);
    });
    function find(re) { return zh.filter(function (v) { return re.test(v.lang + ' ' + v.name); })[0]; }
    return find(/TW|Hant|Taiwan|臺灣|台灣/i) || find(/CN|Hans/i) || zh[0] || null;
  }
  var NO_VOICE = '이 기기에 중국어 음성이 없어 소리를 낼 수 없습니다. ‘내 단어’ 탭 아래의 “소리가 안 나올 때”를 확인해 주세요.';
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var STANDALONE = !!navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var IOS_HINT = '소리가 안 들리면 아이폰 옆면의 무음 스위치를 풀고, 볼륨 버튼으로 소리를 키워 주세요.';
  function voiceStatus() {   // 소리가 안 날 때 원인을 좁히기 위한 정보
    loadVoices();
    var zh = voices.filter(function (v) { return /^(zh|cmn)/i.test(v.lang); });
    return '음성 기능: ' + (synth ? '있음' : '없음') +
      '\n전체 음성: ' + voices.length + '개' +
      '\n중국어 음성: ' + zh.length + '개' + (zh.length ? ' (' + zh.map(function (v) { return v.name + ' ' + v.lang; }).join(', ') + ')' : '') +
      '\n실행 방식: ' + (STANDALONE ? '홈 화면 앱' : '브라우저') +
      '\n기기: ' + (IOS ? '아이폰/아이패드' : '그 밖의 기기') +
      '\n' + (navigator.userAgent.match(/(OS [\d_]+|Android [\d.]+|Windows NT [\d.]+|Version\/[\d.]+|Chrome\/[\d]+)/g) || []).join(' · ');
  }
  // 발음 버튼 상태: 누르면 '준비 중'(색 + 깜빡임) → 소리가 시작되면 '재생 중'(채워진 스피커 + 물결 움직임)
  // → 끝나면 원래대로. 소리가 시작되지 않으면 '실패'(빨간색으로 흔들림)를 잠깐 보여 준다.
  // (아이폰 무음 모드에서는 소리 없이 '재생 중'만 보이므로, 기능은 되는데 무음인지 구분할 수 있다)
  var sayBtn = null, sayTimer = null;
  function sayState(btn, state) {   // state: 'wait' · 'on' · 'fail' · '' (원래대로)
    if (sayBtn && sayBtn !== btn) sayBtn.classList.remove('say-wait', 'say-on', 'say-fail');
    sayBtn = btn || null;
    clearTimeout(sayTimer);
    if (!btn) return;
    btn.classList.remove('say-wait', 'say-on', 'say-fail');
    if (state) btn.classList.add('say-' + state);
    if (state === 'fail') sayTimer = setTimeout(function () { sayState(btn, ''); }, 1500);
  }
  function watchUtter(u, btn, text, onFail) {   // 소리 시작·끝·오류에 맞춰 버튼 상태를 바꾼다(지금 읽는 소리일 때만)
    var started = false;
    sayState(btn, 'wait');
    u.onstart = function () { started = true; if (lastUtter === u) sayState(btn, 'on'); };
    u.onend = function () { if (lastUtter === u) sayState(btn, ''); };
    u.onerror = function (ev) {
      if (lastUtter !== u) return;
      if (ev.error === 'interrupted' || ev.error === 'canceled') { sayState(btn, ''); return; }
      sayState(btn, 'fail'); onFail(ev.error);
    };
    // 3초가 지나도 시작하지 않으면 실패로 본다
    setTimeout(function () { if (!started && lastUtter === u && !synth.speaking && !synth.pending) { sayState(btn, 'fail'); onFail(''); } }, 3000);
    // 끝 신호가 오지 않는 기기를 위해, 글자 수로 어림한 시간이 지나면 원래대로 돌린다
    setTimeout(function () { if (lastUtter === u && btn && btn.classList.contains('say-on')) sayState(btn, ''); }, 4000 + chars(text).length * 450);
  }
  function speak(text, btn) {
    if (!synth || !window.SpeechSynthesisUtterance) { sayState(btn, 'fail'); toast('이 브라우저는 음성 읽기를 지원하지 않습니다.'); return; }
    if (IOS) {
      // 아이폰: 내장된 대만 중국어 음성을 시스템이 고르게 하고, 누른 그 순간에 곧바로 읽는다
      // (조금이라도 늦게 호출하면 "사용자가 누른 동작"으로 인정되지 않아 소리가 막힌다).
      var iu = new SpeechSynthesisUtterance(text);
      iu.lang = 'zh-TW';
      iu.rate = 0.9;
      iu.volume = 1;
      lastUtter = iu;
      watchUtter(iu, btn, text, function (err) { toast('음성을 재생하지 못했습니다.' + (err ? ' (' + err + ')' : '')); });
      if (synth.speaking || synth.pending) synth.cancel();
      if (synth.paused) synth.resume();
      synth.speak(iu);
      var shown = +load('twko_ioshint', 0);
      if (shown < 3) { save('twko_ioshint', shown + 1); toast(IOS_HINT); }
      return;
    }
    loadVoices();
    var v = pickVoice();
    if (voices.length && !v) { sayState(btn, 'fail'); toast(NO_VOICE); return; }   // 음성 목록은 있는데 중국어가 없는 경우
    var u = new SpeechSynthesisUtterance(text);
    u.lang = v ? v.lang.replace('_', '-') : 'zh-TW';
    if (v) u.voice = v;
    u.rate = 0.9;
    lastUtter = u;   // 재생이 끝나기 전에 사라지지 않도록 붙잡아 둔다
    watchUtter(u, btn, text, function () { toast(NO_VOICE); });
    var go = function () {
      synth.speak(u);
      if (synth.paused) synth.resume();
    };
    // 재생 중에 다시 누르면 멈추고 조금 뒤에 새로 읽는다(멈춘 직후 바로 읽으면 무시되는 기기가 있다)
    if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 150); } else go();
  }

  // ---------- 필기 입력 ----------
  // 인식 엔진(lib/hanzilookup.min.js)과 획 데이터(data/hanzi-strokes.js)는 필기 판을 처음 열 때 불러온다.
  var hw = { open: false, state: 'idle', strokes: [], cur: null, cands: [], ctx: null, matcher: null, w: 0, h: 0, last: null };
  var HW_STEP = 5;   // 이 거리(px)보다 가까운 점은 기록하지 않는다(점이 너무 촘촘하면 획의 꺾임을 잘못 읽는다)
  function loadScript(src, ok, fail) {
    var s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = fail;
    document.body.appendChild(s);
  }
  function hwLoad() {
    if (hw.state === 'loading' || hw.state === 'ready') return;
    hw.state = 'loading';
    hwCands();
    var fail = function () { hw.state = 'failed'; hwCands(); };
    loadScript('lib/hanzilookup.min.js', function () {
      loadScript('data/hanzi-strokes.js', function () {
        try {
          var d = window.HW_DATA;
          window.HW_DATA = null;
          d.substrokes = window.HanziLookup.decodeCompact(d.substrokes);
          window.HanziLookup.data.mmah = d;
          hw.matcher = new window.HanziLookup.Matcher('mmah');
          hw.state = 'ready';
          hwRecognize();
        } catch (e) { fail(); }
      }, fail);
    }, fail);
  }
  function hwOpen() {
    closePeek();
    hw.open = true;
    $('#hw').hidden = false;
    $('#hwbtn').setAttribute('aria-pressed', 'true');
    $('#q').blur();   // 휴대폰 자판을 내린다
    hwSize();
    document.body.style.setProperty('--hw-h', $('#hw').offsetHeight + 'px');
    document.body.classList.add('hw-open');
    if (hw.state === 'idle' || hw.state === 'failed') hwLoad(); else hwCands();
  }
  function hwClose() {
    hw.open = false;
    hw.strokes = []; hw.cur = null; hw.cands = [];
    $('#hw').hidden = true;
    $('#hwbtn').setAttribute('aria-pressed', 'false');
    document.body.classList.remove('hw-open');
  }
  function hwReset() { hw.strokes = []; hw.cur = null; hw.cands = []; hwDraw(); hwCands(); }
  function hwSize() {
    var c = $('#hwpad'), r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    hw.w = r.width; hw.h = r.height;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    hw.ctx = c.getContext('2d');
    hw.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hwDraw();
  }
  function hwInk() {
    var x = hw.ctx;
    x.setLineDash([]); x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = getComputedStyle(document.body).color;
  }
  function hwDraw() {
    var x = hw.ctx;
    if (!x) return;
    x.clearRect(0, 0, hw.w, hw.h);
    // 가운데를 잡기 쉽게 흐린 십자 안내선을 긋는다
    x.setLineDash([4, 6]); x.lineWidth = 1; x.lineCap = 'butt';
    x.strokeStyle = getComputedStyle($('#hwpad')).borderTopColor;
    x.beginPath();
    x.moveTo(hw.w / 2, 8); x.lineTo(hw.w / 2, hw.h - 8);
    x.moveTo(8, hw.h / 2); x.lineTo(hw.w - 8, hw.h / 2);
    x.stroke();
    hwInk();
    hw.strokes.concat(hw.cur ? [hw.cur] : []).forEach(function (s) {
      x.beginPath();
      x.moveTo(s[0][0], s[0][1]);
      if (s.length === 1) x.lineTo(s[0][0] + 0.1, s[0][1]);
      for (var i = 1; i < s.length; i++) x.lineTo(s[i][0], s[i][1]);
      x.stroke();
    });
  }
  function hwCands() {
    var el = $('#hwcands'), msg = '';
    if (hw.state === 'loading') msg = '필기 인식을 준비하는 중입니다…';
    else if (hw.state === 'failed') msg = '필기 인식 데이터를 불러오지 못했습니다.<button type="button" data-act="hw-retry">다시 시도</button>';
    else if (!hw.strokes.length) msg = '아래 칸에 한 글자씩 써 주세요. 맞는 글자를 누르면 검색창에 들어갑니다.';
    else if (!hw.cands.length) msg = '비슷한 글자를 찾지 못했습니다. 획순대로 또박또박 써 보세요.';
    if (msg) { el.innerHTML = '<span class="msg">' + msg + '</span>'; return; }
    el.innerHTML = hw.cands.map(function (c) {
      return '<button type="button" class="hwc' + (c.known ? '' : ' dim') + '" data-act="hw-pick" data-c="' + c.ch + '" lang="zh-Hant">' + c.ch + '</button>';
    }).join('');
    el.scrollLeft = 0;
  }
  function hwRecognize() {
    if (hw.state !== 'ready') return;
    if (!hw.strokes.length) { hw.cands = []; hwCands(); return; }
    // 엔진은 256×256 칸에 쓴 글씨를 기준으로 만들어졌으므로 좌표를 그 크기로 맞춘다
    var k = 256 / hw.h;
    var strokes = hw.strokes.map(function (s) {
      var pts = s.map(function (p) { return [p[0] * k, p[1] * k]; });
      if (pts.length === 1) pts.push([pts[0][0] + 3, pts[0][1] + 3]);   // 콕 찍은 점
      return pts;
    });
    try {
      hw.matcher.match(new window.HanziLookup.AnalyzedCharacter(strokes), 16, function (matches) {
        var seen = {}, list = [];
        matches.forEach(function (m) {
          if (seen[m.character]) return;
          seen[m.character] = 1;
          list.push({ ch: m.character, known: !!INDEX[m.character] });
        });
        // 대만 사전이므로 사전에 표제어(번체자)로 실린 글자를 앞에 둔다(영어 참고 사전까지 다 불러온 뒤에만)
        if (ceState === 'ready') {
          list = list.filter(function (c) { return c.known; }).concat(list.filter(function (c) { return !c.known; }));
        } else list.forEach(function (c) { c.known = true; });
        hw.cands = list.slice(0, 10);
        hwCands();
      });
    } catch (e) { hw.cands = []; hwCands(); }
  }
  (function () {
    var pad = $('#hwpad');
    function pos(ev) { var r = pad.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    function add(p, force) {
      var s = hw.cur, l = s[s.length - 1], dx = p[0] - l[0], dy = p[1] - l[1];
      if (force ? (dx || dy) : (dx * dx + dy * dy >= HW_STEP * HW_STEP)) s.push(p);
    }
    pad.addEventListener('pointerdown', function (ev) {
      if (ev.button > 0 || hw.cur) return;
      ev.preventDefault();
      try { pad.setPointerCapture(ev.pointerId); } catch (e) { /* 지원하지 않는 기기 */ }
      hw.cur = [pos(ev)]; hw.last = hw.cur[0]; hw.pid = ev.pointerId;
      hwDraw();
    });
    pad.addEventListener('pointermove', function (ev) {
      if (!hw.cur || ev.pointerId !== hw.pid) return;
      ev.preventDefault();
      var p = pos(ev), x = hw.ctx;
      hwInk();
      x.beginPath(); x.moveTo(hw.last[0], hw.last[1]); x.lineTo(p[0], p[1]); x.stroke();
      hw.last = p;
      add(p, false);
    });
    function end(ev) {
      if (!hw.cur || ev.pointerId !== hw.pid) return;
      if (ev.type === 'pointerup') add(pos(ev), true);
      hw.strokes.push(hw.cur);
      hw.cur = null;
      hwDraw();
      hwRecognize();
      if (hw.state !== 'ready') hwCands();
    }
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    window.addEventListener('resize', function () { if (hw.open) { hwSize(); document.body.style.setProperty('--hw-h', $('#hw').offsetHeight + 'px'); } });
  })();

  // ---------- 이벤트 ----------
  var timer;
  function queryChanged() {
    clearTimeout(timer);
    if (activeCat) { history.replaceState(null, '', '#/'); activeCat = ''; lastHash = location.hash; current = 'search' + location.hash; }
    renderSearch();
    window.scrollTo(0, 0);
  }
  $('#q').addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(queryChanged, 150);
  });
  $('#clear').addEventListener('click', function () { $('#q').value = ''; renderSearch(); if (!hw.open) $('#q').focus(); });
  // 휴대폰에서는 자판과 필기 판이 함께 뜨면 화면이 가려지므로, 검색창을 누르면 필기 판을 닫는다
  $('#q').addEventListener('focus', function () {
    if (hw.open && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) hwClose();
  });
  $('#filters').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    filter = b.dataset.filter;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    renderSearch();
  });
  $('#gfilters').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    gfilter = b.dataset.gf;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    renderGrammar();
    window.scrollTo(0, 0);
  });
  $('#nav').addEventListener('click', function (ev) {
    var a = ev.target.closest('a');
    if (a && a.dataset.nav === 'search' && current.indexOf('search') === 0 && !activeCat) { $('#q').focus(); $('#q').select(); }
  });
  var prefill = null;
  document.body.addEventListener('click', function (ev) {
    // 뜻 창이 떠 있을 때 바깥을 누르면 닫는다
    if (peek && !ev.target.closest('#peek') && !ev.target.closest('.pw')) closePeek();
    // 예문 속 단어: 화면을 옮기지 않고 뜻 창을 띄운다(Ctrl·Shift와 함께 누르면 원래 링크대로 연다)
    var pw = ev.target.closest('a.pw');
    if (pw && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) { ev.preventDefault(); togglePeek(pw); return; }
    var tab = ev.target.closest('button[data-etab]');
    if (tab) { entryTab = tab.dataset.etab; renderEntry(); return; }
    var b = ev.target.closest('button[data-act]'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'peek') togglePeek(b);
    if (act === 'peek-close') closePeek();
    if (act === 'hw-toggle') { if (hw.open) hwClose(); else hwOpen(); }
    if (act === 'hw-close') hwClose();
    if (act === 'hw-retry') hwLoad();
    if (act === 'hw-undo') { hw.strokes.pop(); hwDraw(); hwRecognize(); }
    if (act === 'hw-clear') hwReset();
    if (act === 'hw-pick') { $('#q').value += b.dataset.c; hwReset(); queryChanged(); }
    if (act === 'hw-back') {
      if (hw.strokes.length) hwReset();   // 쓰던 글자가 있으면 그것부터 지운다
      else { $('#q').value = chars($('#q').value).slice(0, -1).join(''); queryChanged(); }
    }
    if (act === 'back') { if (history.length > 1) history.back(); else location.hash = '#/'; }
    if (act === 'say-entry') speak(entryWord, b);
    if (act === 'say') speak(b.dataset.t, b);
    if (act === 'voice-test') speak('你好，歡迎來到台灣。', b);
    if (act === 'reload') location.reload();   // 홈 화면 앱에는 새로 고침 버튼이 없어서 따로 둔다
    if (act === 'voice-status') {
      var st = voiceStatus();
      $('#voicestatus').textContent = st;
      if (synth && synth.addEventListener) setTimeout(function () { $('#voicestatus').textContent = voiceStatus(); }, 800);
    }
    if (act === 'fold') {
      UI[b.dataset.sec] = UI[b.dataset.sec] === false;   // 접혀 있으면 펼치고, 펼쳐져 있으면 접는다
      save('twko_ui', UI);
      renderSearch();
    }
    if (act === 'fav') {
      var had = FAVS.some(function (f) { return f.t === entryWord; });
      FAVS = FAVS.filter(function (f) { return f.t !== entryWord; });
      if (!had) FAVS.unshift(snapshot(entryWord));
      save('twko_favs', FAVS);
      b.classList.toggle('on', !had);
    }
    if (act === 'clear-hist') { if (confirm('최근 본 단어 기록을 모두 지울까요?')) { HIST = []; save('twko_hist', HIST); renderHist(); } }
    if (act === 'addko') {
      prefill = { t: b.dataset.t, p: b.dataset.p };
      location.hash = '#/mine';
      setTimeout(function () {
        var f = $('#addform');
        f.t.value = prefill.t; f.p.value = prefill.p; f.ko.value = ''; f.note.value = '';
        f.ko.focus();
      }, 50);
    }
    if (act === 'del') {
      if (!confirm('이 단어를 삭제할까요?')) return;
      USER = USER.filter(function (x) { return !(x.t === b.dataset.t && x.p === b.dataset.p); });
      saveUser(); renderMine();
    }
  });

  function saveUser() {
    save('twko_user', USER.map(function (e) { return { t: e.t, p: e.p, ko: e.ko, note: e.note || '' }; }));
    if (CE.length) linkCedict(); else buildIndex();
  }
  $('#addform').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = ev.target, t = f.t.value.trim(), p = f.p.value.trim();
    if (!p) { var c = CE.filter(function (x) { return x.t === t; })[0]; if (c) p = c.p; }
    USER.unshift({ src: 'user', t: t, s: '', p: p, ko: f.ko.value.split(';').map(function (x) { return x.trim(); }).filter(Boolean),
      note: f.note.value.trim(), en: '', k: pinKey(p) });
    saveUser(); f.reset(); renderMine();
  });
  $('#export').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ user: load('twko_user', []), favs: FAVS }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = '대만사전-내단어.json'; a.click();
  });
  $('#import').addEventListener('change', function (ev) {
    var file = ev.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result), have = {};
        USER.forEach(function (e) { have[e.t + '|' + e.p] = 1; });
        (d.user || []).forEach(function (e) {
          if (!e.t || have[e.t + '|' + (e.p || '')]) return;
          USER.push({ src: 'user', t: e.t, s: '', p: e.p || '', ko: e.ko || [], note: e.note || '', en: '', k: pinKey(e.p || '') });
        });
        var haveF = {};
        FAVS.forEach(function (e) { haveF[e.t] = 1; });
        (d.favs || []).forEach(function (e) { if (e.t && !haveF[e.t]) FAVS.push(e); });
        save('twko_favs', FAVS); saveUser(); renderMine();
        alert('가져오기를 마쳤습니다.');
      } catch (e) { alert('파일을 읽을 수 없습니다.'); }
    };
    r.readAsText(file);
    ev.target.value = '';
  });

  // ---------- 연결 상태 · 오프라인 준비 (여는 화면 · 첫 화면 · 도움말) ----------
  var NET = { state: 'checking', remote: '' };                  // checking · online · offline · local
  var OFF = { state: 'checking', have: 0, total: 0, big: false }; // checking · ready · partial · none
  var splashGone = false, splashTimer = null, splashLong = false, lastNet = '';
  function verNewer(a, b) {   // 버전 a가 b보다 새것인가
    var x = a.split('.'), y = b.split('.');
    for (var i = 0; i < 3; i++) if (+(x[i] || 0) !== +(y[i] || 0)) return +(x[i] || 0) > +(y[i] || 0);
    return false;
  }
  function hasNewer() { return NET.state === 'online' && NET.remote && verNewer(NET.remote, VERSION); }
  function netText() {
    if (NET.state === 'checking') return '인터넷 연결을 확인하는 중…';
    if (NET.state === 'local') return 'PC의 파일로 열었습니다';
    if (NET.state === 'offline') return '📴 오프라인 · 저장된 사전으로 열었습니다';
    if (hasNewer()) return '🌐 온라인 · 새 버전 ' + NET.remote + '이 있습니다';
    return '🌐 온라인 · 최신 버전으로 열었습니다';
  }
  function offText() {
    if (OFF.state === 'none') return '이 환경에서는 오프라인 저장을 쓸 수 없습니다';
    if (OFF.state === 'checking') return '오프라인 준비 상태를 확인하는 중…';
    if (OFF.state === 'ready') return '✓ 오프라인 준비 완료 (파일 ' + OFF.have + '/' + OFF.total + ')';
    return '오프라인 준비 중 (파일 ' + OFF.have + '/' + OFF.total + (OFF.big ? ')' : ', 영어 참고 사전 받는 중)');
  }
  function hideSplash() {
    if (splashGone) return;
    splashGone = true;
    $('#splash').classList.add('hide');
    setTimeout(function () { $('#splash').hidden = true; }, 400);
  }
  function showStatus() {
    $('#sp-net').textContent = netText();
    $('#sp-off').textContent = offText();
    Array.prototype.forEach.call(document.querySelectorAll('.netstat'), function (el) { el.textContent = netText(); });
    Array.prototype.forEach.call(document.querySelectorAll('.offstat'), function (el) { el.textContent = offText(); });
    if (netText() !== lastNet) {   // 연결 상태가 바뀌었을 때만 첫 화면 아래 상태 줄을 다시 그린다
      lastNet = netText();
      if (current.indexOf('search') === 0 && !activeCat && !$('#q').value.trim()) renderSearch();
    }
    // 연결 확인이 끝나면 잠깐 보여 주고 닫는다(새 버전이 있으면 조금 더 길게)
    if (NET.state !== 'checking' && !splashTimer) splashTimer = setTimeout(hideSplash, 1200);
    if (hasNewer() && !splashLong && !splashGone) { splashLong = true; clearTimeout(splashTimer); splashTimer = setTimeout(hideSplash, 3500); }   // 새 버전 소식은 조금 더 길게
  }
  function setNet(state, remote) {   // 처음 정해진 한 번만 반영한다
    if (NET.state !== 'checking') return;
    NET.state = state; NET.remote = remote || '';
    showStatus();
  }
  // 연결 상태는 두 갈래로 알아낸다. 먼저 오는 쪽을 쓴다.
  //  ① 서비스 워커의 답(checkOffline): 이 화면을 인터넷에서 받았는지 저장분에서 꺼냈는지 — 대개 바로 온다
  //  ② 직접 확인: 서버의 sw.js를 받아 본다(①을 알 수 없을 때, 그리고 새 버전이 있는지 보려고)
  function checkNetwork() {
    if (!/^https?:$/.test(location.protocol)) { setNet('local'); return; }
    if (navigator.onLine === false) { setNet('offline'); return; }
    // 서비스 워커가 아직 이 화면을 맡고 있지 않다면(처음 연 경우) 화면은 인터넷에서 받은 것이다
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) setNet('online', VERSION);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); setNet('offline'); }, 3000);   // 신호가 약해 답이 늦어도 오프라인으로 본다
    // sw.js에는 올라가 있는 버전 번호(CACHE 이름)가 들어 있다. ?check는 서비스 워커가 저장분을 거치지 않고 보낸다.
    fetch('sw.js?check=' + Date.now(), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        clearTimeout(timer);
        var m = /'twko-(\d+\.\d+\.\d+)'/.exec(t);
        if (NET.state === 'online' && m && verNewer(m[1], VERSION)) { NET.remote = m[1]; showStatus(); }   // 이미 온라인으로 정해졌어도 새 버전 소식은 반영
        else setNet('online', m ? m[1] : '');
      })
      .catch(function () { clearTimeout(timer); setNet('offline'); });
  }
  function checkOffline(tries) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || !window.MessageChannel) { OFF.state = 'none'; showStatus(); return; }
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.active) return;
      var ch = new MessageChannel();
      ch.port1.onmessage = function (ev) {
        var d = ev.data || {};
        if (d.opened === 'network') setNet('online', VERSION);
        else if (d.opened === 'cache') setNet('offline');
        OFF.have = d.have || 0; OFF.total = d.total || 0; OFF.big = !!d.big;
        OFF.state = OFF.total && OFF.have >= OFF.total ? 'ready' : 'partial';
        showStatus();
        if (OFF.state === 'partial' && tries < 40) setTimeout(function () { checkOffline(tries + 1); }, 3000);   // 받는 동안 다시 확인
      };
      reg.active.postMessage({ type: 'offline-status' }, [ch.port2]);
    }).catch(function () {});
  }
  function statusLine() {   // 첫 화면 맨 아래에 붙는 연결 상태
    if (NET.state === 'checking' || NET.state === 'local') return '';
    return '<br>' + esc(netText()) + (hasNewer() ? ' <button class="netbtn" data-act="reload">새 버전 받기</button>' : '');
  }

  // ---------- 시작 ----------
  Array.prototype.forEach.call(document.querySelectorAll('.appver'), function (el) { el.textContent = VERSION + ' (' + VERSION_DATE + ')'; });
  $('#sp-ver').textContent = '버전 ' + VERSION;
  $('#splash').addEventListener('click', hideSplash);
  setTimeout(hideSplash, 6000);   // 무슨 일이 있어도 6초 뒤에는 닫는다
  // 연결 확인을 먼저 시작한다(영어 참고 사전을 처리하는 동안에는 답을 받아도 화면에 늦게 반영되므로)
  showStatus();
  checkNetwork();
  checkOffline(0);
  buildIndex();
  route();
  setTimeout(loadCedict, 150);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
