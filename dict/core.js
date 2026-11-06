/* 三部词典共用的查询与显示程序。各词典页面只写自己的设置（数据怎么读、释义怎么排、左栏显示什么），
   然后调用 DictApp(设置)。一般不需要改动这个文件。

   设置项：
     data        词库文件（每行一个词头：转写 \t 原文 \t 义项，义项之间用 \x1e，义项内的栏用 \x1f）
     dicts       词典来源 [{ name, seal }]；只有一部时不显示勾选框
     inputs      输入方式 [{ id, label, placeholder, lang }]；lang 是转写模块（MNC 或 MN）
     sense(f)    把义项的各栏变成对象，须含 d（词典序号）
     looseOf(e, inputId)   该词头在这种输入方式下用来匹配的转写 [{ r: 原转写, d: 词典序号或 -1 }]
     senseText(s)          释义反查时检索的文字
     head(e, ctx)          词头一行的 HTML
     senseHtml(s, ctx)     一个义项的 HTML
     col(e)                词条左侧竖排的原文
     spine(ctx)            左栏 HTML
     intro                 首屏说明的 HTML */
(function () {
  'use strict';

  window.DictApp = function (C) {
    var PAGE = 50;
    var $ = function (id) { return document.getElementById(id); };
    var qEl = $('q'), modeEl = $('mode'), listEl = $('list'), statusEl = $('status');
    var spineEl = $('spine'), resultsEl = $('results');
    var store = {
      get: function (k, d) { try { var v = localStorage.getItem(C.storeKey + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem(C.storeKey + k, JSON.stringify(v)); } catch (e) {} }
    };

    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;
    var SEG = /[①-⑳；;，,。．：:、！!？?\s\[\]〔〕<>〈〉（）()［］《》・\/]+/;

    var enabled = store.get('dicts', null);
    if (!Array.isArray(enabled) || enabled.length !== C.dicts.length) enabled = C.dicts.map(function () { return true; });
    var inputId = store.get('input', C.inputs[0].id);
    if (!C.inputs.some(function (x) { return x.id === inputId; })) inputId = C.inputs[0].id;
    var input = function () { return C.inputs.filter(function (x) { return x.id === inputId; })[0]; };

    // ---------- 数据 ----------
    var E = [];           // 词头 { key, script, raw, senses(按需解析), mask }
    var LOOSE = {};       // 输入方式 → 每个词头的 [{ s: 归并后的转写, r, d }]
    var ready = false;

    function foldWith(lang, s) {
      var out = '';
      for (var i = 0; i < s.length; i++) out += lang.foldChar(s[i]);
      return out.replace(/\s+/g, ' ').trim();
    }
    // 显示用转写逐字归并，同时记下每个归并后字母在原串中的位置，用于高亮
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

    async function loadData() {
      var res = await fetch(C.data);
      if (!res.ok) throw new Error('词库文件读取失败（' + res.status + '）');
      var text = await res.text();
      var lines = text.split('\n'), counts = C.dicts.map(function () { return 0; });
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i]; if (!L) continue;
        var a = L.indexOf('\t'), b = L.indexOf('\t', a + 1);
        var e = { i: E.length, key: L.slice(0, a), script: L.slice(a + 1, b), raw: L.slice(b + 1), senses: null, mask: 0 };
        var body = e.raw, p = 0;
        while (true) {
          var d = body.charCodeAt(p) - 48;
          if (d >= 0 && d < 10) { e.mask |= 1 << d; counts[d]++; }
          p = body.indexOf('\x1e', p); if (p < 0) break; p++;
        }
        E.push(e);
      }
      return counts;
    }
    function sensesOf(e) {
      if (!e.senses) e.senses = e.raw.split('\x1e').map(function (s) { var o = C.sense(s.split('\x1f')); o.d = +o.d || 0; return o; });
      return e.senses;
    }
    function looseList(id) {
      if (LOOSE[id]) return LOOSE[id];
      var lang = C.inputs.filter(function (x) { return x.id === id; })[0].lang, arr = new Array(E.length);
      for (var i = 0; i < E.length; i++) {
        arr[i] = C.looseOf(E[i], id, sensesOf).map(function (x) {
          return { s: foldWith(lang, lang.display(x.r)), r: x.r, d: x.d == null ? -1 : x.d };
        });
      }
      return (LOOSE[id] = arr);
    }

    // ---------- 匹配 ----------
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
    function maskOn() { var m = 0; enabled.forEach(function (on, i) { if (on) m |= 1 << i; }); return m; }

    function searchDefs(q) {
      var out = [], mask = maskOn(), terms = q.split(/\s+/).filter(Boolean);
      for (var i = 0; i < E.length; i++) {
        var e = E[i];
        if (!(e.mask & mask)) continue;
        var ok = true;
        for (var t = 0; t < terms.length; t++) if (e.raw.indexOf(terms[t]) < 0) { ok = false; break; }
        if (!ok) continue;
        var ss = sensesOf(e), best = 9;
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
      var fq = foldWith(lang, nq), out = [], mask = maskOn(), LL = looseList(inputId);
      if (!fq) return out;
      var wild = /[*?]/.test(q), re = null;
      if (wild) {
        // 通配符两侧的文字分别归并，再拼成正则
        var pat = nq.split(/([*?])/).map(function (p) {
          if (p === '*') return '.*';
          if (p === '?') return '.';
          return foldWith(lang, p).replace(/[.+^${}()|[\]\\]/g, '\\$&');
        }).join('');
        re = new RegExp('^' + pat + '$');
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

    // ---------- 显示用的小工具 ----------
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
          var et = esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          h = h.replace(new RegExp(et, 'g'), '<mark>$&</mark>');
        });
        return h;
      },
      // 释义中的拉丁字母转写词：显示正式写法，点一下按原词查询
      linkWords: function (html, lang, inId) {
        return html.split(/(<[^>]+>|&[a-z]+;)/).map(function (part) {
          if (part.charAt(0) === '<' || part.charAt(0) === '&') return part;
          return part.replace(/[A-Za-z@][A-Za-z@'_=\-]*[A-Za-z@]|[A-Za-z@]/g, function (w) {
            if (w.length < 2) return esc(lang.display(w));
            return '<span class="w" data-q="' + esc(lang.display(w)) + '" data-in="' + inId + '">' + esc(lang.display(w)) + '</span>';
          });
        }).join('');
      },
      seal: function (d) {
        return '<span class="seal d' + d + '" title="' + esc(C.dicts[d].name) + '">' + esc(C.dicts[d].seal) + '</span>';
      },
      // 左栏的一栏：标题、竖排原文、底部转写与复制按钮
      pane: function (o) {
        var h = '<div class="pane">' + (o.lbl ? '<div class="lbl">' + esc(o.lbl) + '</div>' : '') + '<div class="script">';
        if (!o.script) return h + '<span class="empty">' + esc(o.empty || '原文随输入显示') + '</span></div></div>';
        return h + '<div class="v" lang="' + (o.lang || '') + '">' + esc(o.script) + '</div></div>' +
          '<div class="foot"><div class="tl">' + esc(o.tl || '') + '</div>' + (o.from ? '<div class="from">' + esc(o.from) + '</div>' : '') +
          '<button type="button" class="copy" data-copy="' + esc(o.script) + '" data-label="复制' + esc(o.lbl || '原文') + '">复制' + esc(o.lbl || '原文') + '</button></div></div>';
      },
      enabled: function (d) { return enabled[d]; },
      senses: sensesOf
    };

    var lastHits = [], shown = 0, lastQ = '', lastTerms = [], defMode = false, selected = -1;

    function ctx(extra) {
      var o = { q: lastQ, inputId: inputId, input: input(), defMode: defMode, H: H };
      for (var k in extra) o[k] = extra[k];
      return o;
    }

    function renderEntries(from, to) {
      var html = '';
      for (var r = from; r < to; r++) {
        var e = E[lastHits[r].i];
        var ss = sensesOf(e).filter(function (s) { return enabled[s.d]; });
        var c = ctx({ e: e });
        html += '<article class="entry' + (e.i === selected ? ' sel' : '') + '" data-i="' + e.i + '">' +
          '<div class="col" lang="' + C.colLang + '">' + esc(C.col(e)) + '</div><div class="body">' +
          '<div class="head">' + C.head(e, c) + '</div>' +
          ss.map(function (s) { return '<div class="sense">' + H.seal(s.d) + '<div>' + C.senseHtml(s, c) + '</div></div>'; }).join('') +
          '</div></article>';
      }
      return html;
    }
    function moreBtn() {
      return shown < lastHits.length ? '<button class="more" id="more">再显示 ' + Math.min(PAGE, lastHits.length - shown) +
        ' 条（尚余 ' + (lastHits.length - shown).toLocaleString() + '）</button>' : '';
    }

    function drawSpine() {
      var q = qEl.value.trim();
      var top = selected >= 0 ? E[selected] : (lastHits.length && q === lastQ ? E[lastHits[0].i] : null);
      spineEl.innerHTML = C.spine(ctx({ q: q, top: top, selectedEntry: selected >= 0, def: q && (modeEl.value === 'def' || CJK.test(q)) }));
    }

    function welcome() {
      listEl.innerHTML = '<div class="note">' + C.intro + '</div>';
    }

    function run() {
      var q = qEl.value.trim();
      store.set('q', qEl.value);
      selected = -1;
      if (!q) {
        lastHits = []; lastQ = '';
        statusEl.innerHTML = ready ? '词库共 <b>' + E.length.toLocaleString() + '</b> 个词头' : '正在载入词库…';
        welcome(); drawSpine(); return;
      }
      var mode = modeEl.value;
      defMode = mode === 'def' || CJK.test(q);
      if (!ready) { drawSpine(); return; }
      if (!enabled.some(Boolean)) { statusEl.textContent = '未选择词典。请在上方至少勾选一部。'; listEl.innerHTML = ''; drawSpine(); return; }
      var t0 = performance.now();
      lastHits = search(q, mode); lastQ = q;
      lastTerms = q.split(/\s+/).filter(Boolean);
      var ms = Math.round(performance.now() - t0);
      var fuzzyOnly = lastHits.length && lastHits[0].score >= 50000 && !defMode;
      statusEl.innerHTML = (defMode ? '释义中含“' + esc(q) + '”的词头 ' : '') +
        '<b>' + lastHits.length.toLocaleString() + '</b> 条结果' +
        (fuzzyOnly ? '，未见完全相符者，以下为拼写相近的词' : '') +
        ' <span class="ms">（' + ms + ' 毫秒）</span>';
      shown = Math.min(PAGE, lastHits.length);
      drawSpine();
      if (!lastHits.length) {
        listEl.innerHTML = '<div class="note"><h2>没有找到“' + esc(q) + '”</h2><p>' +
          (defMode ? '换个说法，或减少关键词。' :
            '可以改用“近似拼写”，或用 * 代替不确定的部分，例如 ' + esc(q.slice(0, 3)) + '*。也请检查输入方式、所选词典与转写规则。') + '</p></div>';
        return;
      }
      listEl.innerHTML = renderEntries(0, shown) + moreBtn();
      resultsEl.scrollTop = 0;
    }

    var timer = 0;
    function schedule() { clearTimeout(timer); timer = setTimeout(run, 90); }
    function setInput(id) {
      if (!id || id === inputId) return;
      inputId = id; store.set('input', id);
      document.querySelectorAll('[data-input]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-input') === id); });
      qEl.placeholder = input().placeholder;
    }
    function setQuery(v, inId) {
      setInput(inId);
      qEl.value = v;
      if (modeEl.value === 'def' && !CJK.test(v)) modeEl.value = 'smart';
      run(); qEl.focus();
    }

    qEl.addEventListener('input', function () { selected = -1; drawSpine(); schedule(); });
    modeEl.addEventListener('change', function () { store.set('mode', modeEl.value); run(); });
    $('form').addEventListener('submit', function (e) { e.preventDefault(); run(); });

    document.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-q]');
      if (t) { setQuery(t.getAttribute('data-q'), t.getAttribute('data-in')); return; }
      var b = ev.target.closest('[data-input]');
      if (b) { setInput(b.getAttribute('data-input')); run(); qEl.focus(); return; }
      if (ev.target.id === 'more') {
        var from = shown; shown = Math.min(shown + PAGE, lastHits.length);
        ev.target.remove();
        listEl.insertAdjacentHTML('beforeend', renderEntries(from, shown) + moreBtn());
        return;
      }
      if (ev.target.id === 'legendBtn') {
        var open = $('legend').classList.toggle('open'); ev.target.setAttribute('aria-expanded', open); return;
      }
      if (ev.target.closest('.copy')) {
        var btn = ev.target.closest('.copy'), txt = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(txt).then(function () { btn.textContent = '已复制'; }, function () { btn.textContent = '无法复制'; });
        setTimeout(function () { btn.textContent = btn.getAttribute('data-label'); }, 1500);
        return;
      }
      // 点词条空白处：左栏改显示这个词条
      var art = ev.target.closest('.entry');
      if (art && !window.getSelection().toString()) {
        var prev = listEl.querySelector('.entry.sel'); if (prev) prev.classList.remove('sel');
        var i = +art.getAttribute('data-i');
        if (selected === i) selected = -1; else { selected = i; art.classList.add('sel'); }
        drawSpine();
      }
    });

    // ---------- 顶栏 ----------
    function buildFilters(counts) {
      var f = $('filters'), html = '';
      if (C.inputs.length > 1) {
        html += '<span class="grp" role="group" aria-label="输入方式"><span>输入</span>' + C.inputs.map(function (x) {
          return '<button type="button" class="seg" data-input="' + x.id + '" aria-pressed="' + (x.id === inputId) + '">' + esc(x.label) + '</button>';
        }).join('') + '</span>';
      }
      if (C.dicts.length > 1) {
        html += '<span class="grp"><span>词典来源</span>' + C.dicts.map(function (d, i) {
          return '<label class="dict-toggle"><input type="checkbox" data-d="' + i + '"' + (enabled[i] ? ' checked' : '') + '>' +
            '<span class="seal d' + i + '">' + esc(d.seal) + '</span><span class="name">' + esc(d.name) + '</span>' +
            (counts ? '<span class="n">' + counts[i].toLocaleString() + '</span>' : '') + '</label>';
        }).join('') + '</span>';
      } else {
        html += '<span class="grp"><span>词典</span><span class="dict-one">' + H.seal(0) + '<span class="name">' + esc(C.dicts[0].name) + '</span>' +
          (counts ? '<span class="n">' + counts[0].toLocaleString() + ' 条</span>' : '') + '</span></span>';
      }
      html += '<button type="button" class="legend-btn" id="legendBtn" aria-expanded="false">转写规则</button>';
      f.innerHTML = html;
      f.querySelectorAll('input[data-d]').forEach(function (cb) {
        cb.addEventListener('change', function () { enabled[+cb.getAttribute('data-d')] = cb.checked; store.set('dicts', enabled); run(); });
      });
    }

    modeEl.value = store.get('mode', 'smart');
    qEl.value = store.get('q', '') || '';
    qEl.placeholder = input().placeholder;
    buildFilters(null);
    welcome(); drawSpine();
    qEl.focus();

    loadData().then(function (counts) {
      ready = true; if (C.loaded) C.loaded(E); buildFilters(counts); run();
    }).catch(function (err) {
      statusEl.textContent = '词库载入失败：' + err.message + '。' +
        (location.protocol === 'file:' ? '直接双击打开时浏览器不允许读取词库，请按 README 里“本地预览”的方法打开。' : '请刷新页面重试。');
    });
  };
})();
