/* “词典”栏目的查询程序，满汉、蒙汉、满汉蒙三部词典共用。各词典的设置在 js/dict/dictionaries.js。
   一般不需要改动这个文件。

   载入顺序：先读较小的检索文件（*.idx.txt），读完即可查询；释义文件（*.def.txt）随后在后台读入，
   读完后结果自动补上释义。读过的词库留在内存里，切换栏目、切换词典都不必重读。 */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CJK = /[぀-ヿ㐀-鿿豈-﫿]/;
  var SEG = /[①-⑳；;，,。．：:、！!？?\s\[\]〔〕<>〈〉（）()［］《》・\/]+/;
  var PAGE = 30;
  var idle = window.requestIdleCallback || function (f) { return setTimeout(function () { f({ timeRemaining: function () { return 8; } }); }, 1); };

  // 逐字归并；每个字母的归并结果记在表里，免得反复计算
  function foldTable(lang) { return lang._fold || (lang._fold = Object.create(null)); }
  function foldWith(lang, s) {
    var out = '', T = foldTable(lang);
    for (var i = 0; i < s.length; i++) {
      var c = s[i], f = T[c];
      if (f === undefined) f = T[c] = lang.foldChar(c);
      out += f;
    }
    return out.replace(/\s+/g, ' ').trim();
  }
  // 逐字归并，同时记下每个归并后字母在原串中的位置，用于高亮
  function foldMap(lang, s) {
    var f = '', idx = [], prevSpace = true;
    for (var i = 0; i < s.length; i++) {
      var c = lang.foldChar(s[i]);
      for (var j = 0; j < c.length; j++) {
        if (c[j] === ' ') { if (prevSpace) continue; prevSpace = true; } else prevSpace = false;
        f += c[j]; idx.push(i);
      }
    }
    return { f: f, idx: idx };
  }
  // 带相邻换位的编辑距离（OSA），超过 max 提前返回
  function lev(a, b, max) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    var pp = new Array(lb + 1), prev = new Array(lb + 1), cur = new Array(lb + 1), j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      cur[0] = i; var rowMin = i, ca = a.charCodeAt(i - 1);
      for (j = 1; j <= lb; j++) {
        var cb = b.charCodeAt(j - 1);
        var c = prev[j - 1] + (ca === cb ? 0 : 1);
        if (prev[j] + 1 < c) c = prev[j] + 1;
        if (cur[j - 1] + 1 < c) c = cur[j - 1] + 1;
        if (i > 1 && j > 1 && ca === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === cb && pp[j - 2] + 1 < c) c = pp[j - 2] + 1;
        cur[j] = c; if (c < rowMin) rowMin = c;
      }
      if (rowMin > max) return max + 1;
      var t = pp; pp = prev; prev = cur; cur = t;
    }
    return prev[lb];
  }
  async function fetchText(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error('词库文件读取失败（' + res.status + '）');
    return res.text();
  }

  /* 一部词典。C 是设置（见 dictionaries.js），root 是放这部词典的元素；headLeft 是顶栏左侧的 HTML（切换词典的链接）。 */
  function DictApp(C, root, headLeft) {
    var store = {
      get: function (k, d) { try { var v = localStorage.getItem('dict-' + C.id + '-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem('dict-' + C.id + '-' + k, JSON.stringify(v)); } catch (e) {} }
    };
    var enabled = store.get('dicts', null);
    if (!Array.isArray(enabled) || enabled.length !== C.dicts.length) enabled = C.dicts.map(function () { return true; });
    var inputId = store.get('input', C.inputs[0].id);
    if (!C.inputs.some(function (x) { return x.id === inputId; })) inputId = C.inputs[0].id;
    var input = function () { return C.inputs.filter(function (x) { return x.id === inputId; })[0]; };

    // ---------- 页面骨架 ----------
    root.innerHTML =
      '<div class="dx-head">' +
        '<div class="dx-left">' + headLeft + '</div>' +
        '<form class="dx-search" role="search"><input class="dx-q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="转写或释义">' +
          '<select class="dx-mode" aria-label="查询方式"><option value="smart">综合</option><option value="prefix">词首</option>' +
          '<option value="contain">包含</option><option value="fuzzy">近似拼写</option><option value="def">释义反查</option></select></form>' +
        '<div class="dx-source">数据来源<b>栗林均词典</b></div>' +
        '<div class="dx-filters"></div>' +
        '<div class="dx-legend">' + C.legend + '</div>' +
      '</div>' +
      '<div class="dx-main' + (C.twoPanes ? ' two' : '') + '"><aside class="dx-spine" aria-label="原文"></aside>' +
        '<section class="dx-results" aria-live="polite"><div class="dx-status">正在载入词库…</div><div class="dx-list"></div></section></div>';
    var q$ = function (sel) { return root.querySelector(sel); };
    var qEl = q$('.dx-q'), modeEl = q$('.dx-mode'), listEl = q$('.dx-list'), statusEl = q$('.dx-status');
    var spineEl = q$('.dx-spine'), resultsEl = q$('.dx-results');

    // ---------- 数据 ----------
    var E = [];            // 词头 { i, key, script, mask, alt, raw（释义原文，读入后才有）, senses }
    var LOOSE = {};        // 输入方式 → { list, done }：每个词头用来匹配的归并转写
    var state = 'none';    // none → index（可以查询）→ full（释义也已读入）
    var pendingDef = false;

    function senses(e) {
      if (e.raw == null) return [];
      if (!e.senses) e.senses = e.raw.split('\x1e').map(function (s) { var o = C.sense(s.split('\x1f')); o.d = +o.d || 0; return o; });
      return e.senses;
    }
    function alts(e) {
      if (!e.altList) e.altList = e.alt ? e.alt.split('\x1e').map(function (s) { var k = s.indexOf(':'); return { d: +s.slice(0, k), r: s.slice(k + 1) }; }) : [];
      return e.altList;
    }

    var loadingIdx = null, loadingDef = null;
    function failed(err) {
      statusEl.textContent = '词库载入失败：' + err.message + '。' +
        (location.protocol === 'file:' ? '直接双击打开时浏览器不允许读取词库，请按 README 里“本地预览”的方法打开。' : '请刷新页面重试。');
    }
    function loadIndex() {
      if (loadingIdx) return loadingIdx;
      loadingIdx = fetchText(C.data + '.idx.txt' + C.ver).then(function (text) {
        var lines = text.split('\n'), counts = C.dicts.map(function () { return 0; });
        for (var i = 0; i < lines.length; i++) {
          var f = lines[i].split('\t');
          var e = { i: E.length, key: f[0] || '', script: f[1] || '', mask: +f[2] || 0, alt: f[3] || '' };
          for (var d = 0; d < C.dicts.length; d++) if (e.mask & (1 << d)) counts[d]++;
          E.push(e);
        }
        state = 'index';
        if (C.loaded) C.loaded(E);
        buildFilters(counts);
        idleLoose(inputId);
        run(true);
      }, function (err) { loadingIdx = null; failed(err); throw err; });
      return loadingIdx;
    }
    function loadDefs() {
      if (loadingDef) return loadingDef;
      loadingDef = loadIndex().then(function () { return fetchText(C.data + '.def.txt' + C.ver); }).then(function (text) {
        var lines = text.split('\n'), n = Math.min(lines.length, E.length);
        for (var i = 0; i < n; i++) E[i].raw = lines[i];
        state = 'full';
        if (pendingDef || lastHits.length) { var keep = shown; run(true); if (!defMode) more(keep); }
        pendingDef = false;
      }, function (err) { loadingDef = null; failed(err); });
      return loadingDef;
    }

    // 归并转写：词库读入后趁空闲分批算好，免得第一次查询时卡一下
    function looseItems(e, id) {
      var lang = C.inputs.filter(function (x) { return x.id === id; })[0].lang;
      return C.looseOf(e, id, alts).map(function (x) {
        return { s: foldWith(lang, lang.display(x.r)), r: x.r, d: x.d == null ? -1 : x.d };
      });
    }
    function looseState(id) { return LOOSE[id] || (LOOSE[id] = { list: new Array(E.length), done: 0 }); }
    function idleLoose(id) {
      var L = looseState(id);
      if (L.scheduled) return;
      L.scheduled = true;
      idle(function step(dl) {
        while (L.done < E.length && dl.timeRemaining() > 2) {
          var end = Math.min(L.done + 500, E.length);
          for (; L.done < end; L.done++) L.list[L.done] = looseItems(E[L.done], id);
        }
        if (L.done < E.length) idle(step);
      });
    }
    function looseList(id) {
      var L = looseState(id);
      for (; L.done < E.length; L.done++) L.list[L.done] = looseItems(E[L.done], id);
      return L.list;
    }

    // ---------- 匹配 ----------
    function maskOn() { var m = 0; enabled.forEach(function (on, i) { if (on) m |= 1 << i; }); return m; }

    function searchDefs(q) {
      var out = [], mask = maskOn(), terms = q.split(/\s+/).filter(Boolean);
      for (var i = 0; i < E.length; i++) {
        var e = E[i];
        if (!(e.mask & mask) || e.raw == null) continue;
        var ok = true;
        for (var t = 0; t < terms.length; t++) if (e.raw.indexOf(terms[t]) < 0) { ok = false; break; }
        if (!ok) continue;
        var ss = senses(e), best = 9;
        for (var k = 0; k < ss.length; k++) {
          if (!enabled[ss[k].d]) continue;
          var txt = C.senseText(ss[k]), all = true;
          for (t = 0; t < terms.length; t++) if (txt.indexOf(terms[t]) < 0) { all = false; break; }
          if (!all) continue;
          // 括号里的词类、类别标注（〔名〕、（马）、〈史〉等）不算释义本身
          var segs = txt.replace(/〈[^〉]*〉|<[^>]*>|〔[^〕]*〕|（[^）]*）|\([^)]*\)|\[[^\]]*\]/g, ' ').split(SEG).filter(Boolean), sc = 3;
          if (segs[0] === terms[0]) sc = 0;
          else if (segs.indexOf(terms[0]) >= 0) sc = 1;
          else if (segs.some(function (g) { return g.indexOf(terms[0]) === 0; })) sc = 2;
          if (sc < best) best = sc;
        }
        if (best < 9) out.push({ i: i, score: best * 1000 + Math.min(e.key.length, 999) });
      }
      return out;
    }

    function search(q, mode) {
      if (mode === 'def' || CJK.test(q)) return sortOut(searchDefs(q));
      var lang = input().lang, nq = lang.normInput ? lang.normInput(q) : q;
      var fq = foldWith(lang, nq), out = [], mask = maskOn();
      if (!fq) return out;
      var LL = looseList(inputId), wild = /[*?]/.test(q), re = null;
      if (wild) {
        // 通配符两侧的文字分别归并，再拼成正则
        re = new RegExp('^' + nq.split(/([*?])/).map(function (p) {
          if (p === '*') return '.*';
          if (p === '?') return '.';
          return foldWith(lang, p).replace(/[.+^${}()|[\]\\]/g, '\\$&');
        }).join('') + '$');
      }
      var maxD = fq.length <= 2 ? 0 : fq.length <= 4 ? 1 : 2;
      for (var i = 0; i < E.length; i++) {
        if (!(E[i].mask & mask)) continue;
        var items = LL[i], best = Infinity;
        for (var k = 0; k < items.length; k++) {
          var it = items[k];
          if (it.d >= 0 && !enabled[it.d]) continue;
          var lk = it.s, s = Infinity;
          if (wild) { if (re.test(lk)) s = lk.length; }
          else if (mode !== 'fuzzy') {
            if (lk === fq) s = (it.r === q || lang.display(it.r) === q) ? 0 : 10000;
            else if (lk.indexOf(fq) === 0) s = 20000;
            else if (mode !== 'prefix') {
              var pos = lk.indexOf(fq);
              if (pos > 0) s = lk.charAt(pos - 1) === ' ' ? 30000 : 40000;
            }
            if (s < Infinity) s += lk.length;
          }
          if (s === Infinity && !wild && (mode === 'smart' || mode === 'fuzzy') && maxD > 0) {
            var dd = lev(fq, lk, maxD);
            if (dd > maxD && lk.indexOf(' ') > 0 && fq.indexOf(' ') < 0) {
              var ws = lk.split(' ');
              for (var w = 0; w < ws.length && dd > maxD; w++) dd = Math.min(dd, lev(fq, ws[w], maxD) + 0.5);
            }
            if (dd <= maxD) s = (5 + dd) * 10000 + lk.length;
          }
          if (s < best) best = s;
        }
        if (best < Infinity) out.push({ i: i, score: best });
      }
      return sortOut(out);
    }
    function sortOut(out) { return out.sort(function (a, b) { return a.score - b.score || a.i - b.i; }); }

    // ---------- 显示用的小工具（交给各词典的设置使用） ----------
    var lastHits = [], shown = 0, lastQ = '', lastTerms = [], defMode = false, selected = -1;
    var H = {
      esc: esc,
      // 在显示用的转写里标出与查询相符的部分
      markDisplay: function (lang, disp, q) {
        if (!q || defMode) return esc(disp);
        var fq = foldWith(lang, lang.normInput ? lang.normInput(q) : q);
        if (!fq || /[*?]/.test(q)) return esc(disp);
        var m = foldMap(lang, disp), p = m.f.indexOf(fq);
        if (p < 0) return esc(disp);
        var a = m.idx[p], b = m.idx[p + fq.length - 1] + 1;
        return esc(disp.slice(0, a)) + '<mark>' + esc(disp.slice(a, b)) + '</mark>' + esc(disp.slice(b));
      },
      // 释义反查时标出关键词
      markTerms: function (text) {
        var h = esc(text);
        if (!defMode) return h;
        lastTerms.forEach(function (t) {
          if (!t) return;
          h = h.replace(new RegExp(esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '<mark>$&</mark>');
        });
        return h;
      },
      // 释义中的拉丁字母转写词：显示正式写法，点一下即查
      linkWords: function (html, lang, inId) {
        return html.split(/(<[^>]+>|&[a-z]+;)/).map(function (part) {
          if (part.charAt(0) === '<' || part.charAt(0) === '&') return part;
          return part.replace(/[A-Za-z@][A-Za-z@'_=\-]*[A-Za-z@]|[A-Za-z@]/g, function (w) {
            var d = lang.display(w);
            if (w.length < 2) return esc(d);
            return '<span class="dx-w" data-q="' + esc(d) + '" data-in="' + inId + '">' + esc(d) + '</span>';
          });
        }).join('');
      },
      seal: function (d) { return '<span class="dx-seal d' + d + '" title="' + esc(C.dicts[d].name) + '">' + esc(C.dicts[d].seal) + '</span>'; },
      // 左栏的一栏：标题、竖排原文、底部转写与复制按钮
      pane: function (o) {
        var h = '<div class="dx-pane">' + (o.lbl ? '<div class="dx-lbl">' + esc(o.lbl) + '</div>' : '') + '<div class="dx-script">';
        if (!o.script) return h + '<span class="dx-empty">' + esc(o.empty || '原文随输入显示') + '</span></div></div>';
        return h + '<div class="dx-v" lang="' + (o.lang || '') + '">' + esc(o.script) + '</div></div>' +
          '<div class="dx-foot"><div class="dx-tl">' + esc(o.tl || '') + '</div>' + (o.from ? '<div class="dx-from">' + esc(o.from) + '</div>' : '') +
          '<button type="button" class="dx-copy" data-copy="' + esc(o.script) + '" data-label="复制' + esc(o.lbl || '原文') + '">复制' + esc(o.lbl || '原文') + '</button></div></div>';
      },
      enabled: function (d) { return enabled[d]; },
      senses: senses,
      alts: alts,
      full: function () { return state === 'full'; }
    };
    function ctx(extra) {
      var o = { q: lastQ, inputId: inputId, input: input(), defMode: defMode, H: H };
      for (var k in extra) o[k] = extra[k];
      return o;
    }

    // ---------- 显示 ----------
    function renderEntries(from, to) {
      var html = '';
      for (var r = from; r < to; r++) {
        var e = E[lastHits[r].i], c = ctx({ e: e });
        var ss = senses(e).filter(function (s) { return enabled[s.d]; });
        html += '<article class="dx-entry' + (e.i === selected ? ' sel' : '') + '" data-i="' + e.i + '">' +
          '<div class="dx-col" lang="' + C.colLang + '">' + esc(C.col(e)) + '</div><div class="dx-body">' +
          '<div class="dx-headline">' + C.head(e, c) + '</div>' +
          (state === 'full'
            ? ss.map(function (s) { return '<div class="dx-sense">' + H.seal(s.d) + '<div>' + C.senseHtml(s, c) + '</div></div>'; }).join('')
            : '<div class="dx-wait">释义载入中…</div>') +
          '</div></article>';
      }
      return html;
    }
    function moreBtn() {
      return shown < lastHits.length ? '<button type="button" class="dx-more">再显示 ' + Math.min(PAGE, lastHits.length - shown) +
        ' 条（尚余 ' + (lastHits.length - shown).toLocaleString() + '）</button>' : '';
    }
    function more(upto) {
      var from = shown; shown = Math.min(upto || shown + PAGE, lastHits.length);
      if (shown <= from) return;
      var b = q$('.dx-more'); if (b) b.remove();
      listEl.insertAdjacentHTML('beforeend', renderEntries(from, shown) + moreBtn());
    }

    function drawSpine() {
      var q = qEl.value.trim();
      var top = selected >= 0 ? E[selected] : (lastHits.length && q === lastQ ? E[lastHits[0].i] : null);
      spineEl.innerHTML = C.spine(ctx({ q: q, top: top, selectedEntry: selected >= 0, def: q && (modeEl.value === 'def' || CJK.test(q)) }));
    }

    function run(keepScroll) {
      var q = qEl.value.trim();
      store.set('q', qEl.value);
      if (!keepScroll) selected = -1;
      if (!q) {
        lastHits = []; lastQ = '';
        statusEl.innerHTML = state !== 'none' ? '词库共 <b>' + E.length.toLocaleString() + '</b> 个词头' : '正在载入词库…';
        listEl.innerHTML = '<div class="dx-note">' + C.intro + '</div>';
        drawSpine(); return;
      }
      var mode = modeEl.value;
      defMode = mode === 'def' || CJK.test(q);
      if (state === 'none') { drawSpine(); return; }
      if (!enabled.some(Boolean)) { statusEl.textContent = '未选择词典。请在上方至少勾选一部。'; listEl.innerHTML = ''; drawSpine(); return; }
      if (defMode && state !== 'full') {
        pendingDef = true; lastHits = []; lastQ = q;
        statusEl.textContent = '释义还在载入，载入后自动显示反查结果…';
        listEl.innerHTML = ''; drawSpine(); return;
      }
      var t0 = performance.now();
      lastHits = search(q, mode); lastQ = q;
      lastTerms = q.split(/\s+/).filter(Boolean);
      var ms = Math.round(performance.now() - t0);
      var fuzzyOnly = lastHits.length && lastHits[0].score >= 50000 && !defMode;
      statusEl.innerHTML = (defMode ? '释义中含“' + esc(q) + '”的词头 ' : '') +
        '<b>' + lastHits.length.toLocaleString() + '</b> 条结果' +
        (fuzzyOnly ? '，未见完全相符者，以下为拼写相近的词' : '') +
        ' <span class="dx-ms">（' + ms + ' 毫秒）</span>';
      shown = Math.min(PAGE, lastHits.length);
      drawSpine();
      if (!lastHits.length) {
        listEl.innerHTML = '<div class="dx-note"><h2>没有找到“' + esc(q) + '”</h2><p>' +
          (defMode ? '换个说法，或减少关键词。' :
            '可以改用“近似拼写”，或用 * 代替不确定的部分，例如 ' + esc(q.slice(0, 3)) + '*。也请检查输入方式、所选词典与转写规则。') + '</p></div>';
        return;
      }
      listEl.innerHTML = renderEntries(0, shown) + moreBtn();
      if (!keepScroll) resultsEl.scrollTop = 0;
    }

    var timer = 0;
    function schedule() { clearTimeout(timer); timer = setTimeout(run, 80); }
    function setInput(id) {
      if (!id || id === inputId || !C.inputs.some(function (x) { return x.id === id; })) return;
      inputId = id; store.set('input', id);
      root.querySelectorAll('[data-input]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-input') === id); });
      qEl.placeholder = input().placeholder;
      if (state !== 'none') idleLoose(id);
    }
    function setQuery(v, inId) {
      setInput(inId);
      qEl.value = v;
      if (modeEl.value === 'def' && !CJK.test(v)) modeEl.value = 'smart';
      run(); qEl.focus();
    }

    qEl.addEventListener('input', function () { selected = -1; drawSpine(); schedule(); });
    modeEl.addEventListener('change', function () { store.set('mode', modeEl.value); run(); });
    q$('.dx-search').addEventListener('submit', function (e) { e.preventDefault(); run(); });

    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-q]');
      if (t) { setQuery(t.getAttribute('data-q'), t.getAttribute('data-in')); return; }
      var b = ev.target.closest('[data-input]');
      if (b) { setInput(b.getAttribute('data-input')); run(); qEl.focus(); return; }
      if (ev.target.closest('.dx-more')) { more(); return; }
      if (ev.target.closest('.dx-legend-btn')) {
        var open = q$('.dx-legend').classList.toggle('open'); ev.target.setAttribute('aria-expanded', open); return;
      }
      var cp = ev.target.closest('.dx-copy');
      if (cp) {
        navigator.clipboard.writeText(cp.getAttribute('data-copy')).then(function () { cp.textContent = '已复制'; }, function () { cp.textContent = '无法复制'; });
        setTimeout(function () { cp.textContent = cp.getAttribute('data-label'); }, 1500);
        return;
      }
      // 点词条空白处：左栏改显示这个词条
      var art = ev.target.closest('.dx-entry');
      if (art && !window.getSelection().toString()) {
        var prev = listEl.querySelector('.dx-entry.sel'); if (prev) prev.classList.remove('sel');
        var i = +art.getAttribute('data-i');
        if (selected === i) selected = -1; else { selected = i; art.classList.add('sel'); }
        drawSpine();
      }
    });

    // ---------- 顶栏 ----------
    function buildFilters(counts) {
      var html = '';
      if (C.inputs.length > 1) {
        html += '<span class="dx-grp" role="group" aria-label="输入方式"><span>输入</span>' + C.inputs.map(function (x) {
          return '<button type="button" class="dx-segbtn" data-input="' + x.id + '" aria-pressed="' + (x.id === inputId) + '">' + esc(x.label) + '</button>';
        }).join('') + '</span>';
      }
      if (C.dicts.length > 1) {
        html += '<span class="dx-grp"><span>词典来源</span>' + C.dicts.map(function (d, i) {
          return '<label class="dx-toggle"><input type="checkbox" data-d="' + i + '"' + (enabled[i] ? ' checked' : '') + '>' +
            '<span class="dx-seal d' + i + '">' + esc(d.seal) + '</span><span class="dx-name">' + esc(d.name) + '</span>' +
            (counts ? '<span class="dx-n">' + counts[i].toLocaleString() + '</span>' : '') + '</label>';
        }).join('') + '</span>';
      } else {
        html += '<span class="dx-grp"><span>词典</span><span class="dx-one">' + H.seal(0) + '<span class="dx-name">' + esc(C.dicts[0].name) + '</span>' +
          (counts ? '<span class="dx-n">' + E.length.toLocaleString() + ' 个词头</span>' : '') + '</span></span>';
      }
      html += '<button type="button" class="dx-legend-btn" aria-expanded="false">转写规则</button>';
      var f = q$('.dx-filters');
      f.innerHTML = html;
      f.querySelectorAll('input[data-d]').forEach(function (cb) {
        cb.addEventListener('change', function () { enabled[+cb.getAttribute('data-d')] = cb.checked; store.set('dicts', enabled); run(); });
      });
    }

    modeEl.value = store.get('mode', 'smart');
    qEl.value = store.get('q', '') || '';
    qEl.placeholder = input().placeholder;
    buildFilters(null);
    run();

    return {
      // 栏目显示这部词典时调用：读词库（只读一次），把光标放进输入框
      show: function () {
        loadDefs();
        if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) qEl.focus();
      },
      // 预先读入检索文件，切换过来时不用等
      prefetch: function () { loadIndex().catch(function () {}); }
    };
  }

  window.SIYI = window.SIYI || {};
  SIYI.DictApp = DictApp;
})();
