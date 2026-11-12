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
    var list = [];
    raw.split('\n').forEach(function (line) {
      var f = line.split('|');
      if (f.length < 3 || !f[0].trim()) return;
      var ex = null;
      if (f[6]) { var i = f[6].indexOf('='); if (i > 0) ex = { zh: f[6].slice(0, i), ko: f[6].slice(i + 1) }; }
      list.push({ src: 'ko', t: f[0].trim(), s: '', p: f[1].trim(), ko: f[2].split(';').map(function (x) { return x.trim(); }),
        cat: (f[3] || '').trim(), cn: (f[4] || '').trim(), note: (f[5] || '').trim(), ex: ex, en: '', k: pinKey(f[1]) });
    });
    return list;
  }
  var KO = parseKo(window.KO_RAW || '');
  var CE = [];
  var USER = load('twko_user', []);
  var FAVS = load('twko_favs', []);
  var HIST = load('twko_hist', []);
  USER.forEach(function (e) { e.src = 'user'; e.s = ''; e.en = ''; e.k = pinKey(e.p || ''); });

  var INDEX = Object.create(null);   // 표제어 → 항목 목록
  function buildIndex() {
    INDEX = Object.create(null);
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

  function homeHtml() {
    var h = '';
    if (HIST.length) {
      h += '<h2 class="sec">최근 본 단어 <a href="#/hist">전체 보기</a></h2><div class="list">' + HIST.slice(0, 5).map(rowHtml).join('') + '</div>';
    }
    var counts = {}, order = [];
    KO.forEach(function (e) { if (!counts[e.cat]) { counts[e.cat] = 0; order.push(e.cat); } counts[e.cat]++; });
    var vs = KO.filter(function (e) { return e.cn; }).length;
    h += '<h2 class="sec">분류별 단어</h2><div class="chips"><a class="hot" href="#/c/' + encodeURIComponent(VS) + '">' + VS + '<span>' + vs + '</span></a>';
    order.forEach(function (c) { h += '<a href="#/c/' + encodeURIComponent(c) + '">' + esc(c) + '<span>' + counts[c] + '</span></a>'; });
    h += '</div><p class="status">' + esc(statusText()) + '<br>검색 예: <span lang="zh-Hant">捷運</span> · 택시 · lese · ㄐㄧㄝˊ ㄩㄣˋ · pineapple</p>';
    return h;
  }
  function renderSearch() {
    var q = $('#q').value.trim();
    $('#clear').hidden = !q;
    $('#filters').hidden = !q;
    if (q) {
      var list = search(q, filter);
      $('#home').innerHTML = '';
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

  function segment(text) {   // 예문을 사전에 있는 단어 단위로 잘라 누를 수 있게 한다.
    var out = '', cs = chars(text), i = 0;
    while (i < cs.length) {
      if (!HAN.test(cs[i])) { out += esc(cs[i]); i++; continue; }
      var hit = cs[i];
      for (var n = Math.min(6, cs.length - i); n > 1; n--) {
        var w = cs.slice(i, i + n).join('');
        if (INDEX[w]) { hit = w; break; }
      }
      out += '<a href="' + wordHref(hit) + '">' + esc(hit) + '</a>';
      i += chars(hit).length;
    }
    return out;
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
    if (e.ex) h += '<div class="ex"><div class="zh" lang="zh-Hant">' + segment(e.ex.zh) + '</div><div class="tr">' + esc(e.ex.ko) + '</div></div>';
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
  function renderEntry() {
    var t = entryWord, list = INDEX[t] || [], first = list[0];
    var h = '<div class="ehead"><div class="hz" lang="zh-Hant">' + (first ? hanziHtml(t, first.p) : esc(t)) + '</div>';
    if (first && first.p) h += '<div class="py">' + pinyinHtml(first.p) + '</div><div class="zy">' + esc(zhuyin(first.p)) + '</div>';
    h += '</div>';
    var cs = chars(t).filter(function (c, i, a) { return HAN.test(c) && a.indexOf(c) === i; });
    var multi = chars(t).length > 1;
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
  function addHistory(t) {
    if (!INDEX[t]) return;
    HIST = HIST.filter(function (x) { return x.t !== t; });
    HIST.unshift(snapshot(t));
    HIST = HIST.slice(0, 100);
    save('twko_hist', HIST);
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
    else if (segs[0] === 'fav' || segs[0] === 'hist' || segs[0] === 'mine') screen = segs[0];
    if (!sameHash && current) scrollPos[current] = window.scrollY;

    if (screen === 'search') { activeCat = segs[0] === 'c' ? (segs[1] || '') : ''; renderSearch(); }
    if (screen === 'entry') {
      if (entryWord !== segs[1]) { entryWord = segs[1]; entryTab = 'def'; }
      if (!sameHash || ceState === 'ready') addHistory(entryWord);
      renderEntry();
    }
    if (screen === 'fav') renderFavs();
    if (screen === 'hist') renderHist();
    if (screen === 'mine') renderMine();

    ['search', 'entry', 'fav', 'hist', 'mine'].forEach(function (s) { $('#screen-' + s).hidden = s !== screen; });
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'), function (a) {
      a.classList.toggle('on', a.dataset.nav === (screen === 'entry' ? 'search' : screen));
    });
    if (!sameHash) window.scrollTo(0, screen === 'entry' ? 0 : (scrollPos[screen + location.hash] || 0));
    current = screen + location.hash;
    lastHash = location.hash;
  }
  window.addEventListener('hashchange', route);

  function speak(text) {
    if (!window.speechSynthesis) { alert('이 브라우저는 음성 읽기를 지원하지 않습니다.'); return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    var v = speechSynthesis.getVoices().filter(function (x) { return /zh[-_]TW/i.test(x.lang); })[0];
    if (v) u.voice = v;
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // ---------- 이벤트 ----------
  var timer;
  $('#q').addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (activeCat) { history.replaceState(null, '', '#/'); activeCat = ''; lastHash = location.hash; current = 'search' + location.hash; }
      renderSearch();
      window.scrollTo(0, 0);
    }, 150);
  });
  $('#clear').addEventListener('click', function () { $('#q').value = ''; renderSearch(); $('#q').focus(); });
  $('#filters').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    filter = b.dataset.filter;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    renderSearch();
  });
  $('#nav').addEventListener('click', function (ev) {
    var a = ev.target.closest('a');
    if (a && a.dataset.nav === 'search' && current.indexOf('search') === 0 && !activeCat) { $('#q').focus(); $('#q').select(); }
  });
  var prefill = null;
  document.body.addEventListener('click', function (ev) {
    var tab = ev.target.closest('button[data-etab]');
    if (tab) { entryTab = tab.dataset.etab; renderEntry(); return; }
    var b = ev.target.closest('button[data-act]'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'back') { if (history.length > 1) history.back(); else location.hash = '#/'; }
    if (act === 'say-entry') speak(entryWord);
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
