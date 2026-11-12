/* “词典”栏目的查询程序，各部词典共用。各词典的设置在 js/dict/dictionaries.js。
   一般不需要改动这个文件。

   载入顺序：先读较小的检索文件（*.idx.txt），读完即可查询；释义文件（*.def.txt）随后在后台读入，
   读完后结果自动补上释义。读过的词库留在内存里，切换栏目、切换词典都不必重读。
   特别大的词典（藏文）设 shard：释义分成许多小份，只读当前这一页结果用得到的几份；
   设 reverse 时，“释义反查”改查另备的反查索引（如英文 → 藏文）。 */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CJK = /[぀-ヿ㐀-鿿豈-﫿]/;
  var SEG = /[①-⑳；;，,。．：:、！!？?\s\[\]〔〕<>〈〉（）()［］《》・\/]+/;
  var PAGE = 50;   // 每页条数
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
  // 上次是否收起了左栏
  try { if (localStorage.getItem('dict-spine') === 'off') document.documentElement.classList.add('dx-nospine'); } catch (e) {}
  /* 每个词条左边那一列竖写的原文（满文、蒙古文词典才有）要不要显示。
     读者选过就照读者的；没选过时，电脑上显示，手机上（窗口宽度不到 760）不显示，省地方 */
  (function () {
    var v = null;
    try { v = localStorage.getItem('dict-col'); } catch (e) {}
    var hide = v === null ? !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches) : v === 'off';
    if (hide) document.documentElement.classList.add('dx-nocol');
  })();

  function DictApp(C, root, headLeft) {
    var store = {
      get: function (k, d) { try { var v = localStorage.getItem('dict-' + C.id + '-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem('dict-' + C.id + '-' + k, JSON.stringify(v)); } catch (e) {} }
    };
    var enabled = store.get('dicts', null);
    if (!Array.isArray(enabled) || enabled.length !== C.dicts.length) enabled = C.dicts.map(function () { return true; });
    var inputId = store.get('input', C.defaultInput || C.inputs[0].id);
    if (!C.inputs.some(function (x) { return x.id === inputId; })) inputId = C.inputs[0].id;
    var input = function () { return C.inputs.filter(function (x) { return x.id === inputId; })[0]; };

    // ---------- 页面骨架 ----------
    root.innerHTML =
      '<div class="dx-head">' +
        '<div class="dx-left">' + headLeft + '</div>' +
        '<form class="dx-search" role="search"><span class="dx-qwrap"><input class="dx-q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="转写或释义">' +
          '<button type="button" class="dx-clear" aria-label="清空输入" title="清空输入" hidden>' +
          '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></span>' +
          '<select class="dx-mode" aria-label="查询方式"><option value="smart">综合</option><option value="prefix">词首</option>' +
          '<option value="contain">包含</option><option value="fuzzy">近似拼写</option><option value="def">' + esc(C.defLabel || '释义反查') + '</option></select></form>' +
        '<div class="dx-filters"></div>' +
        '<div class="dx-dictpanel" hidden></div>' +
        // 转写规则：点“转写规则”后浮在结果区上方，不挤动页面；再点按钮、点框外或按 Esc 关上
        '<div class="dx-legend" role="dialog" aria-label="转写规则">' + C.legend + '</div>' +
      '</div>' +
      '<div class="dx-main' + (C.twoPanes ? ' two' : '') + '"><aside class="dx-spine" aria-label="原文"></aside>' +
        '<section class="dx-results" aria-live="polite"><div class="dx-status">正在载入词库…</div><div class="dx-list"></div></section></div>';
    var q$ = function (sel) { return root.querySelector(sel); };
    var qEl = q$('.dx-q'), modeEl = q$('.dx-mode'), listEl = q$('.dx-list'), statusEl = q$('.dx-status');
    var spineEl = q$('.dx-spine'), resultsEl = q$('.dx-results'), clearBtn = q$('.dx-clear');

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
          var e = { i: E.length, key: f[0] || '', script: f[1] || '', mask: 0, alt: f[3] || '' };
          if (C.listDicts) {
            // 第三栏是收此词的词典序号，逗号分隔
            e.dl = f[2] ? f[2].split(',').map(Number) : [];
            for (var k = 0; k < e.dl.length; k++) counts[e.dl[k]]++;
          } else {
            e.mask = +f[2] || 0;
            for (var d = 0; d < C.dicts.length; d++) if (e.mask & (1 << d)) counts[d]++;
          }
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
      if (C.shard) return loadIndex();   // 分份的释义按需读取，见 ensureRaw
      if (loadingDef) return loadingDef;
      loadingDef = loadIndex().then(function () { return fetchText(C.data + '.def.txt' + C.ver); }).then(function (text) {
        var lines = text.split('\n'), n = Math.min(lines.length, E.length);
        for (var i = 0; i < n; i++) E[i].raw = lines[i];
        state = 'full';
        if (pendingDef || lastHits.length) run(true);   // 停在当前页，补上释义
        pendingDef = false;
      }, function (err) { loadingDef = null; failed(err); });
      return loadingDef;
    }

    // 分份的释义：读入一批词条所在的那几份，读完后调用 done
    var SHARDS = {};
    function ensureRaw(list, done) {
      var need = {};
      list.forEach(function (e) { if (e.raw == null) need[Math.floor(e.i / C.shard)] = 1; });
      var ns = Object.keys(need);
      if (!ns.length) return false;
      Promise.all(ns.map(function (n) {
        if (!SHARDS[n]) SHARDS[n] = fetchText(C.data + '/' + ('000' + n).slice(-4) + '.txt' + C.ver).then(function (text) {
          var lines = text.split('\n'), base = n * C.shard;
          for (var j = 0; j < lines.length && base + j < E.length; j++) E[base + j].raw = lines[j];
        }, function (err) { delete SHARDS[n]; throw err; });
        return SHARDS[n];
      })).then(done, function (err) { failed(err); });
      return true;
    }

    // 反查索引（如英文 → 藏文词头）：第一次反查时读入
    var REV = null, loadingRev = null;
    function loadRev() {
      if (loadingRev) return loadingRev;
      loadingRev = fetchText(C.reverse + C.ver).then(function (text) {
        REV = text.split('\n').map(function (l) { var t = l.indexOf('\t'); return [l.slice(0, t), l.slice(t + 1)]; });
        run(true);
      }, function (err) { loadingRev = null; failed(err); });
      return loadingRev;
    }
    function searchRev(q) {
      var fq = q.toLowerCase().replace(/\s+/g, ' ').trim(), best = {}, out = [];
      if (!fq) return out;
      for (var r = 0; r < REV.length; r++) {
        var t = REV[r][0], sc;
        if (t === fq) sc = 0;
        else if (t.indexOf(fq) === 0) sc = 1;
        else if (t.indexOf(' ' + fq) >= 0) sc = 2;
        else if (fq.length >= 3 && t.indexOf(fq) >= 0) sc = 3;
        else continue;
        sc = sc * 1000 + Math.min(t.length, 999);
        REV[r][1].split(',').forEach(function (id) { if (!(id in best) || sc < best[id]) best[id] = sc; });
      }
      for (var id in best) if (on(E[id], maskOn())) out.push({ i: +id, score: best[id] });
      return sortOut(out);
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
    // 这个词头是否收在已勾选的词典里
    function on(e, mask) {
      if (!e.dl) return e.mask & mask;
      for (var k = 0; k < e.dl.length; k++) if (enabled[e.dl[k]]) return true;
      return false;
    }

    function searchDefs(q) {
      var out = [], mask = maskOn(), terms = q.split(/\s+/).filter(Boolean);
      for (var i = 0; i < E.length; i++) {
        var e = E[i];
        if (!on(e, mask) || e.raw == null) continue;
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
      if (mode === 'def' || CJK.test(q)) return C.reverse ? searchRev(q) : sortOut(searchDefs(q));
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
        if (!on(E[i], mask)) continue;
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
    var lastHits = [], page = 0, lastQ = '', lastTerms = [], defMode = false, selected = -1, lastMs = 0;
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
      seal: function (d) {
        var D = C.dicts[d];
        // 有简称（藏文词典）时印简称章，章下可带一行小字；点章可显示全名
        if (D.abbr) return '<button type="button" class="dx-seal dx-tag d' + sealColor(d) + '" title="' + esc(D.name + (D.zh ? '：' + D.zh : '')) + '">' +
          '<b>' + esc(D.abbr) + '</b>' + (D.sub ? '<small>' + esc(D.sub) + '</small>' : '') + '</button>';
        return '<span class="dx-seal d' + sealColor(d) + '" title="' + esc(D.name) + '">' + esc(D.seal) + '</span>';
      },
      // 左栏的一栏：标题、竖排原文、底部转写与复制按钮
      pane: function (o) {
        var h = '<div class="dx-pane">' + (o.lbl ? '<div class="dx-lbl">' + esc(o.lbl) + '</div>' : '') + '<div class="dx-script">';
        if (!o.script) return h + '<span class="dx-empty">' + esc(o.empty || '原文随输入显示') + '</span></div></div>';
        return h + '<div class="dx-v' + (o.horizontal ? ' h' : '') + '" lang="' + (o.lang || '') + '">' + esc(o.script) + '</div></div>' +
          '<div class="dx-foot"><div class="dx-tl">' + esc(o.tl || '') + '</div>' + (o.from ? '<div class="dx-from">' + esc(o.from) + '</div>' : '') +
          '<button type="button" class="dx-copy" data-copy="' + esc(o.script) + '" data-label="复制' + esc(o.lbl || '原文') + '">复制' + esc(o.lbl || '原文') + '</button></div></div>';
      },
      enabled: function (d) { return enabled[d]; },
      senses: senses,
      alts: alts,
      full: function () { return state === 'full'; }
    };
    // 一个词条里的义项按语种分段（C.groups 的次序），段内按各词典的 rank（常用的在前），每段前加一行段名
    function groupSenses(ss) {
      var out = [];
      C.groups.forEach(function (g) {
        var part = ss.filter(function (s) { return C.dicts[s.d].group === g.id; });
        if (!part.length) return;
        part.sort(function (a, b) { return (C.dicts[a.d].rank || 0) - (C.dicts[b.d].rank || 0); });
        var n = {}; part.forEach(function (s) { n[s.d] = 1; });
        out.push({ heading: g.label, count: Object.keys(n).length });
        out.push.apply(out, part);
      });
      return out;
    }
    function sealColor(d) { return C.dicts[d].color != null ? C.dicts[d].color : d; }
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
        if (C.groupSenses) ss = groupSenses(ss);
        html += '<article class="dx-entry' + (C.noCol ? ' nocol' : '') + (e.i === selected ? ' sel' : '') + '" data-i="' + e.i + '">' +
          (C.noCol ? '' : '<div class="dx-col" lang="' + C.colLang + '">' + esc(C.col(e)) + '</div>') + '<div class="dx-body">' +
          '<div class="dx-headline">' + C.head(e, c) + '</div>' +
          (e.raw != null
            ? ss.map(function (s) {
                if (s.heading) return '<div class="dx-sgroup">' + esc(s.heading) + '<span>' + s.count + ' 部</span></div>';
                return '<div class="dx-sense' + (C.dicts[s.d].abbr ? ' tagged' : '') + '">' + H.seal(s.d) + '<div>' + C.senseHtml(s, c) + '</div></div>';
              }).join('')
            : '<div class="dx-wait">释义载入中…</div>') +
          '</div></article>';
      }
      return html;
    }
    // 回到结果列表顶部：电脑上结果区自己滚动；手机上是整页滚动，回到结果数一行
    function toTop() {
      if (getComputedStyle(resultsEl).overflowY !== 'visible') { resultsEl.scrollTop = 0; return; }
      var y = resultsEl.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(statusEl).top) || 0);
      if (window.scrollY > y) window.scrollTo(0, Math.max(0, y));
    }

    // ---------- 翻页 ----------
    function pages() { return Math.max(1, Math.ceil(lastHits.length / PAGE)); }
    // 页码：首页、末页、当前页前后两页，其余用省略号
    function pager() {
      var n = pages();
      if (n < 2) return '';
      var nums = [], h = '<nav class="dx-pager" aria-label="翻页">' +
        '<button type="button" data-pg="' + (page - 1) + '"' + (page === 0 ? ' disabled' : '') + '>上一页</button>';
      for (var i = 0; i < n; i++) if (i === 0 || i === n - 1 || Math.abs(i - page) <= 2) nums.push(i);
      nums.forEach(function (i, k) {
        if (k && i - nums[k - 1] > 1) h += '<span class="dx-gap">…</span>';
        h += '<button type="button" class="dx-num" data-pg="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button>';
      });
      return h + '<button type="button" data-pg="' + (page + 1) + '"' + (page >= n - 1 ? ' disabled' : '') + '>下一页</button></nav>';
    }
    function drawStatus() {
      var n = pages(), fuzzyOnly = lastHits.length && lastHits[0].score >= 50000 && !defMode;
      statusEl.innerHTML = '<span>' + (defMode ? (C.defPrefix || '释义中含') + '“' + esc(lastQ) + '”的词头 ' : '') +
        '<b>' + lastHits.length.toLocaleString() + '</b> 条结果' +
        (fuzzyOnly ? '，未见完全相符者，以下为拼写相近的词' : '') +
        ' <span class="dx-ms">（' + lastMs + ' 毫秒）</span></span>' +
        (n > 1 ? '<span class="dx-pg-mini"><button type="button" data-pg="' + (page - 1) + '" aria-label="上一页"' + (page === 0 ? ' disabled' : '') + '>‹</button>' +
          '<span>第 ' + (page + 1) + ' / ' + n + ' 页</span>' +
          '<button type="button" data-pg="' + (page + 1) + '" aria-label="下一页"' + (page >= n - 1 ? ' disabled' : '') + '>›</button></span>' : '');
    }
    // 长释义折叠：.dx-defbox 超过 C.fold 行的，先只显示这么多行，下面加“展开”
    function foldLong() {
      if (!C.fold) return;
      listEl.querySelectorAll('.dx-defbox:not(.checked)').forEach(function (box) {
        box.classList.add('checked');
        var lh = parseFloat(getComputedStyle(box).lineHeight) || 26;
        if (box.scrollHeight > lh * (C.fold + 1.5)) {
          box.classList.add('folded');
          box.style.setProperty('--fold-h', Math.round(lh * C.fold) + 'px');
          box.insertAdjacentHTML('afterend', '<button type="button" class="dx-fold">展开</button>');
        }
      });
    }
    function drawList() {
      var from = page * PAGE, to = Math.min(from + PAGE, lastHits.length);
      listEl.innerHTML = renderEntries(from, to) + pager();
      foldLong();
      if (C.shard) {
        // 这一页还缺释义的，读入所在的几份后重画（期间若已换页、换词就不管了）
        var hits = lastHits, pg = page;
        ensureRaw(hits.slice(from, to).map(function (h) { return E[h.i]; }), function () {
          if (hits === lastHits && pg === page) { var st = resultsEl.scrollTop; drawList(); resultsEl.scrollTop = st; }
        });
      }
    }
    function goPage(n) {
      n = Math.max(0, Math.min(pages() - 1, n));
      if (n === page) return;
      page = n; selected = -1;
      drawStatus(); drawList(); drawSpine();
      toTop();
    }

    function drawSpine() {
      var q = qEl.value.trim();
      var top = selected >= 0 ? E[selected] : (lastHits.length && q === lastQ ? E[lastHits[0].i] : null);
      spineEl.innerHTML = C.spine(ctx({ q: q, top: top, selectedEntry: selected >= 0, def: q && (modeEl.value === 'def' || CJK.test(q)) }));
    }

    function run(keepScroll) {
      var q = qEl.value.trim();
      clearBtn.hidden = !qEl.value;
      if (!keepScroll) selected = -1;
      if (!q) {
        lastHits = []; lastQ = '';
        statusEl.innerHTML = '<span>' + (state !== 'none' ? '词库共 <b>' + E.length.toLocaleString() + '</b> 个词头' : '正在载入词库…' + (C.loadingNote ? '（' + esc(C.loadingNote) + '）' : '')) + '</span>';
        listEl.innerHTML = '<div class="dx-note">' + C.intro + '</div>' + histHtml();
        drawSpine(); return;
      }
      var mode = modeEl.value;
      defMode = mode === 'def' || CJK.test(q);
      if (state === 'none') { drawSpine(); return; }
      if (!enabled.some(Boolean)) { statusEl.textContent = '未选择词典。请在上方至少勾选一部。'; listEl.innerHTML = ''; drawSpine(); return; }
      if (defMode && C.reverse && !REV) {
        lastHits = []; lastQ = q; loadRev();
        statusEl.textContent = '正在载入反查索引…';
        listEl.innerHTML = ''; drawSpine(); return;
      }
      if (defMode && !C.reverse && state !== 'full') {
        pendingDef = true; lastHits = []; lastQ = q;
        statusEl.textContent = '释义还在载入，载入后自动显示反查结果…';
        listEl.innerHTML = ''; drawSpine(); return;
      }
      var t0 = performance.now();
      lastHits = search(q, mode); lastQ = q;
      lastTerms = q.split(/\s+/).filter(Boolean);
      lastMs = Math.round(performance.now() - t0);
      // 新的查询回到第一页；补释义等重画时停在原页
      page = keepScroll ? Math.min(page, pages() - 1) : 0;
      drawStatus();
      drawSpine();
      if (!lastHits.length) {
        listEl.innerHTML = '<div class="dx-note"><h2>没有找到“' + esc(q) + '”</h2><p>' +
          (defMode ? '换个说法，或减少关键词。' :
            '可以改用“近似拼写”，或用 * 代替不确定的部分，例如 ' + esc(q.slice(0, 3)) + '*。也请检查输入方式、所选词典与转写规则。') + '</p></div>';
        return;
      }
      drawList();
      if (!keepScroll) toTop();
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
      remember(false);
    }

    // ---------- 查询历史 ----------
    // 查过的词记在浏览器里，每部词典各记各的，新的在前，最多 HISTORY_MAX 条。输入框空着时显示在结果区。
    // 何时记下：按回车、点示例词或释义里的词、点历史里的词，或者打完字停下 1.5 秒且有结果。
    var HISTORY_MAX = 30;
    var hist = store.get('history', []), histEditing = false, histTimer = 0, histAutoAt = 0;
    if (!Array.isArray(hist)) hist = [];
    function remember(auto) {
      clearTimeout(histTimer);
      var q = qEl.value.trim();
      if (!q) return;
      var item = { q: q, in: inputId }, first = hist[0], now = Date.now();
      if (modeEl.value === 'def' && !CJK.test(q)) item.m = 'def';
      // 边打边停时会先记下半截的词；半分钟内接着打成完整的词，就用完整的替换那半截
      if (first && histAutoAt && now - histAutoAt < 30000 && first.in === item.in && q.indexOf(first.q) === 0) hist.shift();
      hist = hist.filter(function (h) { return !(h.q === item.q && h.in === item.in); });
      hist.unshift(item);
      if (hist.length > HISTORY_MAX) hist.length = HISTORY_MAX;
      histAutoAt = auto ? now : 0;
      store.set('history', hist);
    }
    function histHtml() {
      var tag = function (h) {
        if (h.m === 'def') return '<small>反查</small>';
        if (C.inputs.length > 1 && !CJK.test(h.q)) {
          var x = C.inputs.filter(function (i) { return i.id === h.in; })[0];
          return x ? '<small>' + esc(x.label.charAt(0)) + '</small>' : '';
        }
        return '';
      };
      return '<section class="dx-hist' + (histEditing ? ' editing' : '') + '" aria-label="查询历史"><div class="dx-hhead"><h3>查询历史</h3>' +
        (hist.length ? '<span class="dx-hn">' + hist.length + ' 条</span>' : '') +
        (!hist.length ? '' : histEditing
          ? '<button type="button" class="dx-hbtn" data-hist="clear">全部删除</button><button type="button" class="dx-hbtn on" data-hist="done">完成</button>'
          : '<button type="button" class="dx-hbtn" data-hist="edit">删除</button>') + '</div>' +
        (hist.length
          ? '<ul class="dx-hlist">' + hist.map(function (h, k) {
              return '<li><button type="button" class="dx-hq" data-hi="' + k + '"' + (histEditing ? ' title="删除这一条" aria-label="删除 ' + esc(h.q) + '"' : '') + '>' +
                '<span>' + esc(h.q) + '</span>' + tag(h) + (histEditing ? '<i aria-hidden="true">×</i>' : '') + '</button></li>';
            }).join('') + '</ul>'
          : '<p class="dx-hempty">查过的词会记在这里，最多保留 ' + HISTORY_MAX + ' 条。</p>') + '</section>';
    }
    function drawHist() {
      var box = listEl.querySelector('.dx-hist');
      if (box) box.outerHTML = histHtml();
    }
    // 点历史区里的按钮或词；处理了就返回 true
    function histClick(ev) {
      var b = ev.target.closest('[data-hist]');
      if (b) {
        var act = b.getAttribute('data-hist');
        if (act === 'edit') histEditing = true;
        else if (act === 'done') histEditing = false;
        else if (act === 'clear') { hist = []; histEditing = false; store.set('history', hist); }
        drawHist();
        var f = listEl.querySelector('[data-hist]'); if (f) f.focus();
        return true;
      }
      var it = ev.target.closest('[data-hi]');
      if (!it) return false;
      var h = hist[+it.getAttribute('data-hi')];
      if (!h) return true;
      if (histEditing) {
        hist.splice(+it.getAttribute('data-hi'), 1);
        if (!hist.length) histEditing = false;
        store.set('history', hist); drawHist();
        return true;
      }
      setInput(h.in);
      qEl.value = h.q;
      if (h.m === 'def') modeEl.value = 'def';
      else if (modeEl.value === 'def') modeEl.value = 'smart';
      store.set('mode', modeEl.value);
      run(); qEl.focus();
      remember(false);
      return true;
    }

    qEl.addEventListener('input', function () {
      clearBtn.hidden = !qEl.value; selected = -1; drawSpine(); schedule();
      clearTimeout(histTimer);
      histTimer = setTimeout(function () { if (qEl.value.trim() && lastHits.length) remember(true); }, 1500);
    });
    modeEl.addEventListener('change', function () { store.set('mode', modeEl.value); run(); });
    q$('.dx-search').addEventListener('submit', function (e) { e.preventDefault(); run(); remember(false); });

    root.addEventListener('click', function (ev) {
      if (histClick(ev)) return;
      var t = ev.target.closest('[data-q]');
      if (t) { setQuery(t.getAttribute('data-q'), t.getAttribute('data-in')); return; }
      var b = ev.target.closest('[data-input]');
      if (b) { setInput(b.getAttribute('data-input')); run(); qEl.focus(); return; }
      var tag = ev.target.closest('.dx-tag');
      if (tag) { tag.closest('.dx-sense').classList.toggle('showfn'); return; }
      var fold = ev.target.closest('.dx-fold');
      if (fold) {
        var box = fold.previousElementSibling, open = box.classList.toggle('folded') === false;
        fold.textContent = open ? '收起' : '展开';
        return;
      }
      var pg = ev.target.closest('[data-pg]');
      if (pg) { if (!pg.disabled) goPage(+pg.getAttribute('data-pg')); return; }
      if (ev.target.closest('.dx-clear')) { qEl.value = ''; run(); qEl.focus(); return; }
      if (ev.target.closest('.dx-spine-btn')) { setSpine(!spineHidden()); return; }
      if (ev.target.closest('.dx-col-btn')) { setCol(!colHidden()); return; }
      var pk = ev.target.closest('.dx-pick');
      if (pk) { panelEl.hidden = !panelEl.hidden; pk.setAttribute('aria-expanded', !panelEl.hidden); return; }
      if (ev.target.closest('.dx-legend-btn')) { setLegend(!q$('.dx-legend').classList.contains('open')); return; }
      if (ev.target.closest('.dx-legend')) return;
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
    function setLegend(open) {
      var box = q$('.dx-legend'), b = q$('.dx-legend-btn');
      if (!box) return;
      box.classList.toggle('open', open);
      if (b) b.setAttribute('aria-expanded', open);
    }
    // 转写规则开着时，点它以外的地方或按 Esc 就关上
    document.addEventListener('click', function (ev) {
      if (!q$('.dx-legend.open')) return;
      if (ev.target.closest && (ev.target.closest('.dx-legend') || ev.target.closest('.dx-legend-btn'))) return;
      setLegend(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && q$('.dx-legend.open')) { setLegend(false); var b = q$('.dx-legend-btn'); if (b) b.focus(); }
    });
    // 左栏（原文与复制按钮）可以收起，各部词典共用这一设置，记在浏览器里
    function spineHidden() { return document.documentElement.classList.contains('dx-nospine'); }
    function setSpine(hide) {
      document.documentElement.classList.toggle('dx-nospine', hide);
      try { localStorage.setItem('dict-spine', hide ? 'off' : 'on'); } catch (e) {}
      document.querySelectorAll('.dx-spine-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', hide); b.textContent = hide ? '显示原文' : '收起原文';
      });
    }
    // 词条左边的原文一列可以隐藏，各部词典共用这一设置，记在浏览器里。按钮按下（深色）表示正在显示
    var COL_NAME = { mnc: '满文词条', mn: '蒙古文词条' };
    function colHidden() { return document.documentElement.classList.contains('dx-nocol'); }
    function setCol(hide) {
      document.documentElement.classList.toggle('dx-nocol', hide);
      try { localStorage.setItem('dict-col', hide ? 'off' : 'on'); } catch (e) {}
      document.querySelectorAll('.dx-col-btn').forEach(function (b) { b.setAttribute('aria-pressed', !hide); });
    }
    function buildFilters(counts) {
      var html = '';
      if (C.inputs.length > 1) {
        html += '<span class="dx-grp" role="group" aria-label="输入方式"><span>输入</span>' + C.inputs.map(function (x) {
          return '<button type="button" class="dx-segbtn" data-input="' + x.id + '" aria-pressed="' + (x.id === inputId) + '">' + esc(x.label) + '</button>';
        }).join('') + '</span>';
      }
      if (groups) {
        html += '<span class="dx-grp"><span>词典来源</span><button type="button" class="dx-pick" aria-expanded="' + !panelEl.hidden + '">' + pickLabel() + '</button></span>';
      } else {
        html += '<span class="dx-grp"><span>词典来源</span><span class="dx-one">' + H.seal(0) + '<span class="dx-name">' + esc(C.dicts[0].name) + '</span>' +
          (counts ? '<span class="dx-n">' + E.length.toLocaleString() + ' 个词头</span>' : '') + '</span></span>';
      }
      html += '<span class="dx-tools">' +
        (C.noCol ? '' : '<button type="button" class="dx-col-btn" aria-pressed="' + !colHidden() + '" title="每个词条左边的原文，显示或隐藏">' + (COL_NAME[C.colLang] || '原文词条') + '</button>') +
        '<button type="button" class="dx-spine-btn" aria-pressed="' + spineHidden() + '">' + (spineHidden() ? '显示原文' : '收起原文') + '</button>' +
        '<button type="button" class="dx-legend-btn" aria-expanded="false">转写规则</button></span>';
      var f = q$('.dx-filters');
      f.innerHTML = html;
      if (groups) buildPanel(counts);
    }
    /* 词典来源放在可展开的面板里，点“已选 x / y 部”打开。
       藏文词典很多，按语种分组（设置里的 groups），每组可全选、全不选；
       其余词典没有分组，面板里就是一组。只有一部来源的词典不用面板。 */
    var panelEl = q$('.dx-dictpanel'), lastCounts = null;
    var groups = C.groups || (C.dicts.length > 1 ? [{ id: '', label: '全部' }] : null);
    function groupIds(gid) {
      return C.dicts.map(function (d, i) { return (d.group || '') === gid ? i : -1; }).filter(function (i) { return i >= 0; });
    }
    function pickLabel() { return '已选 ' + enabled.filter(Boolean).length + ' / ' + C.dicts.length + ' 部'; }
    function buildPanel(counts) {
      lastCounts = counts || lastCounts;
      panelEl.innerHTML = groups.map(function (g) {
        var ids = groupIds(g.id);
        ids.sort(function (a, b) { return (C.dicts[a].rank || 0) - (C.dicts[b].rank || 0); });   // 与词条里的次序一致
        return '<section class="dx-pgroup"><h4>' + esc(g.label) + '<button type="button" data-all="' + g.id + '">全选</button>' +
          '<button type="button" data-none="' + g.id + '">全不选</button></h4><div class="dx-pgrid">' +
          ids.map(function (i) {
            var d = C.dicts[i];
            return '<label class="dx-toggle" title="' + esc((d.about || []).join('\n')) + '"><input type="checkbox" data-pd="' + i + '"' + (enabled[i] ? ' checked' : '') + '>' +
              (d.abbr ? H.seal(i).replace('<button type="button"', '<span').replace('</button>', '</span>') : '<span class="dx-seal d' + sealColor(i) + '">' + esc(d.seal) + '</span>') +
              '<span class="dx-name">' + esc(d.name) +
              (d.zh ? '<small>' + esc(d.zh) + '</small>' : d.about && d.about[0] && d.about[0] !== d.name ? '<small>' + esc(d.about[0]) + '</small>' : '') + '</span>' +
              (lastCounts ? '<span class="dx-n">' + lastCounts[i].toLocaleString() + '</span>' : '') + '</label>';
          }).join('') + '</div></section>';
      }).join('') + (C.panelNote ? '<p class="dx-pnote">' + C.panelNote + '</p>' : '');
    }
    function setEnabled(ids, v) {
      ids.forEach(function (i) { enabled[i] = v; });
      store.set('dicts', enabled);
      buildPanel(); var b = q$('.dx-pick'); if (b) b.textContent = pickLabel();
      run(true);
    }
    panelEl.addEventListener('change', function (ev) {
      var cb = ev.target.closest('[data-pd]');
      if (cb) setEnabled([+cb.getAttribute('data-pd')], cb.checked);
    });
    panelEl.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-all],[data-none]');
      if (!a) return;
      setEnabled(groupIds(a.getAttribute(a.hasAttribute('data-all') ? 'data-all' : 'data-none')), a.hasAttribute('data-all'));
    });

    modeEl.value = store.get('mode', 'smart');
    // 输入框每次打开网站都是空的；以前的版本把输入的词记在浏览器里，这里顺手删掉
    try { localStorage.removeItem('dict-' + C.id + '-q'); } catch (e) {}
    clearBtn.hidden = true;
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
      prefetch: function () { loadIndex().catch(function () {}); },
      // 替读者填好要查的词并查询（从编辑器里双击一个词过来时用）。inId 是输入方式，如 'mnc'
      query: function (q, inId) { setQuery(q, inId); },
      // 从别的栏目回到词典时调用：清空输入框，结果区回到说明和查询历史
      reset: function () {
        clearTimeout(histTimer); histEditing = false;
        qEl.value = ''; selected = -1; run();
      }
    };
  }

  window.SIYI = window.SIYI || {};
  SIYI.DictApp = DictApp;
})();
