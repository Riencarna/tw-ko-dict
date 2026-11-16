(function () {
  'use strict';

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
  function zyKey(z) { return z.replace(/[ˊˇˋ˙\s]/g, ''); }

  // ---------- 데이터 ----------
  function parseKo(raw) {
    var list = [], seen = Object.create(null), cat = '';
    raw.split('\n').forEach(function (line) {
      if (line[0] === '#') { cat = line.slice(1).trim(); return; }   // "#분류" 줄: 아래 줄들의 기본 분류
      var f = line.split('|');
      if (f.length < 3 || !f[0].trim()) return;
      var t = f[0].trim(), key = t + '|' + pinKey(f[1]);
      if (seen[key]) return;                                          // 같은 단어가 두 번 나오면 먼저 나온 것만 쓴다
      seen[key] = 1;
      var ex = null;
      if (f[6]) { var i = f[6].indexOf('='); if (i > 0) ex = { zh: f[6].slice(0, i), ko: f[6].slice(i + 1) }; }
      list.push({ src: 'ko', t: t, s: '', p: f[1].trim(), ko: f[2].split(';').map(function (x) { return x.trim(); }),
        cat: (f[3] || '').trim() || cat, cn: (f[4] || '').trim(), note: (f[5] || '').trim(), ex: ex, en: '', k: pinKey(f[1]) });
    });
    return list;
  }
  var KO = parseKo(window.KO_RAW || '');

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
      list.forEach(function (e) {
        if (!e.p) { e.p = c.p; e.k = c.k; }
        if (e.k === c.k || e.k === c.km) {
          c.h = true;
          e.en = e.en ? e.en + '; ' + c.en : c.en;
          if (c.pm && !e.pm && c.k === e.k) e.pm = c.pm;
        }
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
    var vs = KO.filter(function (e) { return e.cn; }).length;
    h += foldHead('cats', '분류별 단어', order.length + 1);
    if (UI.cats !== false) {
      h += '<div class="chips"><a class="hot" href="#/c/' + encodeURIComponent(VS) + '">' + VS + '<span>' + vs + '</span></a>';
      order.forEach(function (c) { h += '<a href="#/c/' + encodeURIComponent(c) + '">' + esc(c) + '<span>' + counts[c] + '</span></a>'; });
      h += '</div>';
    }
    h += '<p class="status">' + esc(statusText()) + '<br>검색 예: <span lang="zh-Hant">捷運</span> · 택시 · lese · ㄐㄧㄝˊ ㄩㄣˋ · pineapple</p>';
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
      var items = KO.filter(function (e) { return activeCat === VS ? e.cn : e.cat === activeCat; });
      $('#home').innerHTML = '<h2 class="sec">' + esc(activeCat) + ' · ' + items.length + '개 <a href="#/">분류 목록</a></h2>';
      $('#results').innerHTML = listHtml(items, '');
    } else {
      $('#home').innerHTML = homeHtml();
      $('#results').innerHTML = '';
    }
  }

  // ---------- 상세 화면 ----------
  var entryWord = '', entryTab = 'def';

  function tokenize(text) {  // 문장을 사전에 있는 단어 단위로 자른다(가장 긴 단어 우선). 통문장 표제어는 건너뛴다.
    var out = [], cs = chars(text), i = 0;
    while (i < cs.length) {
      if (!HAN.test(cs[i])) { out.push({ w: cs[i], han: false }); i++; continue; }
      var hit = cs[i];
      for (var n = Math.min(6, cs.length - i); n > 1; n--) {
        var w = cs.slice(i, i + n).join('');
        if (INDEX[w] && !PHRASE[w]) { hit = w; break; }
      }
      out.push({ w: hit, han: true });
      i += chars(hit).length;
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
    if (e.cn) b += '<span class="badge">대만 표현</span><span class="badge cn">본토: ' + linkWords(e.cn) + '</span>';
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
  function renderGrammar() {
    var h = '';
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

    ['search', 'entry', 'grammar', 'gcard', 'fav', 'hist', 'mine'].forEach(function (s) { $('#screen-' + s).hidden = s !== screen; });
    var navOf = { entry: 'search', gcard: 'grammar' };
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'), function (a) {
      a.classList.toggle('on', a.dataset.nav === (navOf[screen] || screen));
    });
    var detail = screen === 'entry' || screen === 'gcard';
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
  function speak(text) {
    if (!synth || !window.SpeechSynthesisUtterance) { toast('이 브라우저는 음성 읽기를 지원하지 않습니다.'); return; }
    if (IOS) {
      // 아이폰: 내장된 대만 중국어 음성을 시스템이 고르게 하고, 누른 그 순간에 곧바로 읽는다
      // (조금이라도 늦게 호출하면 "사용자가 누른 동작"으로 인정되지 않아 소리가 막힌다).
      var iu = new SpeechSynthesisUtterance(text);
      iu.lang = 'zh-TW';
      iu.rate = 0.9;
      iu.volume = 1;
      iu.onerror = function (ev) { if (ev.error !== 'interrupted' && ev.error !== 'canceled') toast('음성을 재생하지 못했습니다. (' + ev.error + ')'); };
      lastUtter = iu;
      if (synth.speaking || synth.pending) synth.cancel();
      if (synth.paused) synth.resume();
      synth.speak(iu);
      var shown = +load('twko_ioshint', 0);
      if (shown < 3) { save('twko_ioshint', shown + 1); toast(IOS_HINT); }
      return;
    }
    loadVoices();
    var v = pickVoice();
    if (voices.length && !v) { toast(NO_VOICE); return; }   // 음성 목록은 있는데 중국어가 없는 경우
    var u = new SpeechSynthesisUtterance(text), started = false;
    u.lang = v ? v.lang.replace('_', '-') : 'zh-TW';
    if (v) u.voice = v;
    u.rate = 0.9;
    u.onstart = function () { started = true; };
    u.onerror = function (ev) { if (ev.error !== 'interrupted' && ev.error !== 'canceled') toast(NO_VOICE); };
    lastUtter = u;   // 재생이 끝나기 전에 사라지지 않도록 붙잡아 둔다
    var go = function () {
      synth.speak(u);
      if (synth.paused) synth.resume();
      setTimeout(function () { if (!started && lastUtter === u && !synth.speaking && !synth.pending) toast(NO_VOICE); }, 3000);
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
    if (act === 'say-entry') speak(entryWord);
    if (act === 'say') speak(b.dataset.t);
    if (act === 'voice-test') speak('你好，歡迎來到台灣。');
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

  // ---------- 시작 ----------
  buildIndex();
  route();
  setTimeout(loadCedict, 50);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
