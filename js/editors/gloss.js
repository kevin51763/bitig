/* 逐词释义：两栏编辑器右栏下半，把拉丁转写里的每个词拿到词典里查，显示第一条释义。
   用哪部词典，写在 config/languages.js 的 gloss 一项（满文 manhan、蒙古文 menghan、藏文 tibetan）。
   词库就是“词典”栏目那批文件（dict/data/），第一次用到时才读；读过的浏览器会缓存。

   查法：
     1. 相邻几个词合起来查，看是不是词典里的词组，取查得到的最长一组（满文、蒙古文最多 4 个词，藏文最多 6 个音节）；
     2. 单个词查不到，就按下面的词尾表切去词尾再查（满文动词换成 -mbi，蒙古文动词换成 -qu）；
     3. 字母的归并（q 与 k、ū 与 u 等）与词典栏目相同。
   词尾表写不全，有的词查不到或切错，页面上已向读者说明。要补词尾，改下面的 SUFFIX。 */
(function () {
  'use strict';
  var CJK_TAG = /^[〔\[][^〕\]]*[〕\]]/;

  /* ---------- 各语言的规则 ---------- */
  // 词尾表：[词尾（归并后的写法）, 切去后补上的词尾, 说明]。按从长到短排列，先匹配长的。
  var SUFFIX = {
    mnc: [
      ['mbihebi', 'mbi', '过去完成时'], ['mbihe', 'mbi', '过去时'], ['mbime', 'mbi', '并列（且……）'],
      ['habi', 'mbi', '完成时'], ['hebi', 'mbi', '完成时'], ['hobi', 'mbi', '完成时'],
      ['kabi', 'mbi', '完成时'], ['kebi', 'mbi', '完成时'], ['kobi', 'mbi', '完成时'],
      ['hangge', 'mbi', '完成体形动词＋者'], ['hengge', 'mbi', '完成体形动词＋者'], ['hongge', 'mbi', '完成体形动词＋者'],
      ['rangge', 'mbi', '未完成体形动词＋者'], ['rengge', 'mbi', '未完成体形动词＋者'], ['rongge', 'mbi', '未完成体形动词＋者'],
      ['nggala', 'mbi', '前时副动词（……之前）'], ['nggele', 'mbi', '前时副动词（……之前）'], ['nggolo', 'mbi', '前时副动词（……之前）'],
      ['haku', 'mbi', '完成体否定'], ['heku', 'mbi', '完成体否定'], ['hoku', 'mbi', '完成体否定'],
      ['raku', 'mbi', '未完成体否定'], ['reku', 'mbi', '未完成体否定'], ['roku', 'mbi', '未完成体否定'],
      ['tala', 'mbi', '直至副动词（直到……）'], ['tele', 'mbi', '直至副动词（直到……）'], ['tolo', 'mbi', '直至副动词（直到……）'],
      ['cibe', 'mbi', '让步副动词（虽然……）'], ['kini', 'mbi', '第三人称祈使'],
      ['hai', 'mbi', '持续副动词'], ['hei', 'mbi', '持续副动词'], ['hoi', 'mbi', '持续副动词'],
      ['deri', '', '经格（从……经过）'],
      ['ha', 'mbi', '完成体形动词'], ['he', 'mbi', '完成体形动词'], ['ho', 'mbi', '完成体形动词'],
      ['ka', 'mbi', '完成体形动词'], ['ke', 'mbi', '完成体形动词'], ['ko', 'mbi', '完成体形动词'],
      ['ra', 'mbi', '未完成体形动词'], ['re', 'mbi', '未完成体形动词'], ['ro', 'mbi', '未完成体形动词'],
      ['me', 'mbi', '并列副动词'], ['fi', 'mbi', '顺序副动词'], ['ci', 'mbi', '条件副动词（如果……）'],
      ['ki', 'mbi', '祈使（愿望）'], ['ci', '', '从格（从、比）'],
      ['be', '', '宾格'], ['de', '', '与位格（在、于）'], ['ni', '', '属格'], ['i', '', '属格／工具格'],
      ['sa', '', '复数'], ['se', '', '复数'], ['so', '', '复数']
    ],
    // 蒙古文：连字符后面的格词尾见 CASE；这里是直接连写的动词词尾（归并后 q=k、γ=g、ü=u、č=c、ǰ=j）
    mn: [
      ['gsagar', 'ku', '过去形动词＋工具格'], ['gsan', 'ku', '过去形动词'], ['gsen', 'ku', '过去形动词'],
      ['basu', 'ku', '条件副动词（如果……）'], ['besu', 'ku', '条件副动词（如果……）'],
      ['gad', 'ku', '分离副动词（……之后）'], ['ged', 'ku', '分离副动词（……之后）'],
      ['gci', 'ku', '行为者形动词（……者）'], ['dag', 'ku', '惯常形动词'], ['deg', 'ku', '惯常形动词'],
      ['mui', 'ku', '现在时'], ['bai', 'ku', '过去时'], ['bei', 'ku', '过去时'],
      ['ju', 'ku', '联合副动词'], ['cu', 'ku', '联合副动词'],
      ['ba', 'ku', '过去时'], ['be', 'ku', '过去时'], ['n', 'ku', '并列副动词'],
      ['ud', '', '复数'], ['nar', '', '复数'], ['ner', '', '复数']
    ],
    bo: []
  };
  // 蒙古文连字符后面的格词尾（归并后的写法）
  var CASE_MN = {
    un: '属格', yin: '属格', u: '属格',
    i: '宾格', yi: '宾格',
    dur: '与位格', tur: '与位格', du: '与位格', tu: '与位格',
    aca: '从格', ece: '从格',
    bar: '工具格', ber: '工具格', iyar: '工具格', iyer: '工具格',
    luga: '联合格', luge: '联合格', lug: '联合格',
    tai: '共同格', tei: '共同格',
    ban: '反身领属', ben: '反身领属', iyan: '反身领属', iyen: '反身领属',
    ud: '复数', nar: '复数', ner: '复数'
  };
  // 藏文音节末尾连写的助词
  var TAIL_BO = [["'ang", '也（ཡང་）'], ["'am", '或、吗（选择、疑问）'], ["'i", '属格（的）'], ["'is", '作格'], ["'s", '作格'], ["'o", '句末语气词']];
  // 满文常用助词：词典第一条往往是别的意思，这里先给助词的用法
  var PARTICLE = {
    mnc: { i: '〔助〕属格，……的；工具格，以、用', be: '〔助〕宾格，把、将', de: '〔助〕与位格，在、于、向、给',
      ci: '〔助〕从格，从、自、比', deri: '〔助〕经格，从、由', ni: '〔助〕属格，……的（用于 ng 之后）' }
  };
  // 每部词典优先取哪几部分典的释义（序号见 js/dict/dictionaries.js 与 tibetan-dicts.js）
  var PREFER = {
    manhan: [0, 1, 2],                         // 满汉大辞典、新满汉、满汉和（日文）
    tibetan: [0, 34, 8, 9, 11, 2, 3, 10, 30]   // Hopkins、林崇安、Valby、Waldo、Barron、Rangjung Yeshe……
  };
  var MAXN = { mnc: 4, mn: 4, bo: 6 };

  function fetchText(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('词库文件读取失败（' + r.status + '）'); return r.text(); });
  }

  /* ---------- 一部词典的数据 ---------- */
  var SOURCES = {};
  function Source(C) {
    var lang = C.inputs[0].lang, self = this;
    this.C = C; this.lang = lang; this.E = null; this.map = null; this.state = 'none'; this.err = null;
    var T = Object.create(null);
    this.fold = function (s) {
      var out = '';
      for (var i = 0; i < s.length; i++) { var c = s[i], f = T[c]; if (f === undefined) f = T[c] = lang.foldChar(c); out += f; }
      return out.replace(/\s+/g, ' ').trim();
    };
    var waiters = [];
    this.onChange = function (f) { waiters.push(f); };
    var changed = function () { waiters.forEach(function (f) { f(); }); };
    this.load = function () {
      if (self.loading) return self.loading;
      self.state = 'loading';
      self.loading = fetchText(C.data + '.idx.txt' + C.ver).then(function (text) {
        var lines = text.split('\n'), E = [], map = Object.create(null);
        for (var i = 0; i < lines.length; i++) {
          var f = lines[i].split('\t');
          if (!f[0]) { E.push(null); continue; }
          var e = { i: i, key: f[0], raw: null };
          E.push(e);
          var rs = C.looseOf ? C.looseOf(e, C.inputs[0].id, function () { return [{ r: e.key }]; }) : [{ r: e.key }];
          for (var k = 0; k < rs.length; k++) {
            var r = rs[k].r;
            // a(n)、a[an] 一类：括号里的字母可有可无，两种写法都登记
            var vs = /[(\[]/.test(r) ? [r.replace(/[(\[][^)\]]*[)\]]/g, ''), r.replace(/[()\[\]]/g, '')] : [r];
            for (var v = 0; v < vs.length; v++) {
              var fk = self.fold(vs[v]);
              if (!fk) continue;
              if (!map[fk]) map[fk] = [];
              if (map[fk].indexOf(i) < 0) map[fk].push(i);
            }
          }
        }
        self.E = E; self.map = map; self.state = 'index';
        changed();
        if (!C.shard) fetchText(C.data + '.def.txt' + C.ver).then(function (t) {
          var ls = t.split('\n');
          for (var j = 0; j < ls.length && j < E.length; j++) if (E[j]) E[j].raw = ls[j];
          self.state = 'full'; changed();
        }, function (err) { self.err = err; changed(); });
      }, function (err) { self.loading = null; self.state = 'none'; self.err = err; changed(); throw err; });
      return self.loading;
    };
    // 分份的释义（藏文）：读入用得到的几份
    var SH = {};
    this.ensure = function (ids) {
      if (!C.shard || !self.E) return;
      var need = {};
      ids.forEach(function (i) { var e = self.E[i]; if (e && e.raw == null) need[Math.floor(i / C.shard)] = 1; });
      Object.keys(need).forEach(function (n) {
        if (SH[n]) return;
        SH[n] = fetchText(C.data + '/' + ('000' + n).slice(-4) + '.txt' + C.ver).then(function (t) {
          var ls = t.split('\n'), base = n * C.shard;
          for (var j = 0; j < ls.length && base + j < self.E.length; j++) if (self.E[base + j]) self.E[base + j].raw = ls[j];
          changed();
        }, function () { delete SH[n]; });
      });
    };
    this.find = function (s) {
      var hit = self.map ? self.map[self.fold(s)] : null;
      if (!hit || hit.length < 2) return hit;
      var rank = function (i) { var k = self.E[i].key; return lang.display(k) === s || k === s ? 0 : /[0-9]/.test(k) ? 2 : 1; };
      return hit.slice().sort(function (a, b) { return rank(a) - rank(b) || a - b; });
    };
  }
  function source(id) {
    if (!SOURCES[id]) {
      var C = (SIYI.dictConfigs || []).filter(function (c) { return c.id === id; })[0];
      if (!C) return null;
      SOURCES[id] = new Source(C);
    }
    return SOURCES[id];
  }

  /* ---------- 释义：按 PREFER 的顺序取第一条，去掉例句 ---------- */
  function glossOf(src, idxs) {
    var C = src.C, e = src.E[idxs[0]];
    if (!e || e.raw == null) return null;
    var senses = e.raw.split('\x1e').map(function (s) { var o = C.sense(s.split('\x1f')); o.d = +o.d || 0; return o; });
    var pref = PREFER[C.id] || [];
    var pick = null;
    for (var p = 0; p < pref.length && !pick; p++) pick = senses.filter(function (s) { return s.d === pref[p]; })[0] || null;
    if (!pick) {
      // 藏文：先找英文释义，再退而用藏文释义
      var D = C.dicts || [];
      pick = senses.filter(function (s) { return !D[s.d] || D[s.d].group !== 'tib'; })[0] || senses[0];
    }
    if (!pick) return null;
    var text = String(C.senseText(pick) || '').replace(/\\n/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    var full = text;
    if (C.shard) {
      // 藏文：Hopkins 的释义开头常有 [逐字直译]，去掉
      text = text.replace(/^\[[^\]]*\]\s*;?\s*/, '');
    } else {
      // 满文、蒙古文：“：”后面到下一个义项（②、〔动〕等）之间是例句，去掉；◇ 以后是成语，也去掉
      text = text.replace(/◇.*$/, '').replace(/[:：][^①-⑳〔\[]*/g, ' ').replace(/[\u1800-\u18AF\u202F]+/g, '').replace(/\s+/g, ' ');
    }
    text = text.replace(/[;；,，◇\s]+$/, '').trim();
    var name = (C.dicts[pick.d] || {}).name || '';
    return { text: text || full, full: full, from: name };
  }

  /* ---------- 切分与查找 ---------- */
  // 一行里的词：{ s, e, text }，以及相邻两词之间是否只隔空格（能否合成词组）
  function tokens(line, re) {
    var out = [], i = 0;
    while (i < line.length) {
      if (!re.test(line[i])) { i++; continue; }
      var j = i + 1;
      while (j < line.length && re.test(line[j])) j++;
      var gap = out.length ? line.slice(out[out.length - 1].e, i) : '';
      out.push({ s: i, e: j, text: line.slice(i, j), join: out.length > 0 && /^ +$/.test(gap) });
      i = j;
    }
    return out;
  }

  // 一个词查不到时的候选：{ q: 查的写法, how: 显示的切分, sfx: 切去的词尾, note: 词尾说明 }
  function variants(langId, src, w) {
    var out = [], f = src.fold(w);
    if (langId === 'bo') {
      for (var t = 0; t < TAIL_BO.length; t++) {
        var tl = TAIL_BO[t][0];
        if (w.length > tl.length && w.slice(-tl.length) === tl) { out.push({ q: w.slice(0, -tl.length), tail: TAIL_BO[t] }); break; }
      }
      return out;
    }
    var bases = [];   // 先列出可能的词干，最后再加上拼写的出入
    if (langId === 'mn') {
      // 整个词拼写的出入（sayin / sain）先试
      if (/[aeou]yi/.test(f)) out.push({ q: f.replace(/([aeou])yi/g, '$1i') });
      else if (/[aeou]i/.test(f)) out.push({ q: f.replace(/([aeou])i/g, '$1yi') });
      var m = /^(.+?n)-([ae])$/.exec(w);
      // bayin-a、kelen-e：动词现在时 -n-a / -n-e，词干补 -qu
      if (m) bases.push({ q: src.fold(m[1].slice(0, -1)) + 'ku', how: w, sfx: '-n-' + m[2], note: '现在时' });
      var h = w.indexOf('-');
      if (h > 0 && !(m && h === w.length - 2)) {
        // mongγol-un、ger-tü-ben：连字符后面是格词尾，切开查词干
        var parts = w.slice(h + 1).split('-');
        bases.push({ q: w.slice(0, h), how: w, sfx: '-' + parts.join('-'),
          note: parts.map(function (p) { return CASE_MN[src.fold(p)] || '附加成分'; }).join('＋') });
        f = src.fold(w.slice(0, h)); w = w.slice(0, h);
      }
    }
    var list = SUFFIX[langId] || [], same = f.length === w.length;   // 归并前后逐字对应时，显示用读者原来的写法（ū、š……）
    for (var k = 0; k < list.length; k++) {
      var sfx = list[k][0];
      if (f.length - sfx.length >= 2 && f.slice(-sfx.length) === sfx) {
        var cut = f.length - sfx.length;
        bases.push({ q: f.slice(0, cut) + list[k][1], how: same ? w.slice(0, cut) + '-' + w.slice(cut) : f.slice(0, cut) + '-' + sfx,
          sfx: '-' + (same ? w.slice(cut) : sfx), note: list[k][2] });
      }
    }
    bases.forEach(function (b) {
      out.push(b);
      if (langId !== 'mn') return;
      // 蒙古文拼写的出入：ayi/ai、eyi/ei、oyi/oi、uyi/ui
      var q = src.fold(b.q);
      if (/[aeou]yi/.test(q)) out.push({ q: q.replace(/([aeou])yi/g, '$1i'), how: b.how, sfx: b.sfx, note: b.note });
      else if (/[aeou]i/.test(q)) out.push({ q: q.replace(/([aeou])i/g, '$1yi'), how: b.how, sfx: b.sfx, note: b.note });
    });
    return out;
  }

  // 一行 → 若干块：{ s, e, words, key, idxs, how, note, tail }
  function analyse(langId, src, line, re) {
    var tk = tokens(line, re), out = [], i = 0, maxN = MAXN[langId] || 1;
    while (i < tk.length) {
      var done = false;
      // 词组：从长到短
      for (var n = Math.min(maxN, tk.length - i); n >= 2 && !done; n--) {
        var ok = true;
        for (var m = 1; m < n; m++) if (!tk[i + m].join) { ok = false; break; }
        if (!ok) continue;
        var phrase = tk.slice(i, i + n).map(function (t) { return t.text; }).join(' ');
        var hit = src.find(phrase);
        // 藏文：末一个音节带 'i 等，切开再查
        var tail = null;
        if (!hit && langId === 'bo') {
          var last = tk[i + n - 1].text;
          for (var t = 0; t < TAIL_BO.length && !hit; t++) {
            var tl = TAIL_BO[t][0];
            if (last.length > tl.length && last.slice(-tl.length) === tl) {
              hit = src.find(phrase.slice(0, -tl.length));
              if (hit) tail = TAIL_BO[t];
            }
          }
        }
        if (hit) {
          out.push({ s: tk[i].s, e: tk[i + n - 1].e, text: line.slice(tk[i].s, tk[i + n - 1].e), idxs: hit, phrase: true, tail: tail });
          i += n; done = true;
        }
      }
      if (done) continue;
      var w = tk[i], b = { s: w.s, e: w.e, text: w.text };
      var P = PARTICLE[langId] && PARTICLE[langId][src.fold(w.text)];
      if (P) b.particle = P;
      var direct = src.find(w.text);
      if (direct) b.idxs = direct;
      else {
        var vs = variants(langId, src, w.text);
        for (var v = 0; v < vs.length; v++) {
          var hh = src.find(vs[v].q);
          if (hh) { b.idxs = hh; b.how = vs[v].how; b.sfx = vs[v].sfx; b.note = vs[v].note; b.tail = vs[v].tail; break; }
        }
      }
      out.push(b); i++;
    }
    return out;
  }

  /* ---------- 显示 ---------- */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // el：放释义的元素；langId：语言；dictId：词典；hooks.pick(s, e)：点方块时在拉丁转写里选中 s..e
  function Gloss(el, hooks) {
    var langId = null, src = null, re = null, text = '', timer = 0, blocks = [];
    function draw() {
      if (!src) { el.innerHTML = ''; return; }
      if (src.state === 'none' && src.err) { el.innerHTML = '<p class="gl-msg">词库载入失败：' + esc(src.err.message) + '。请刷新页面重试。</p>'; return; }
      if (!text.trim()) { el.innerHTML = '<p class="gl-msg">在上面输入拉丁转写，这里逐词列出词典里的释义。</p>'; return; }
      if (!src.map) { el.innerHTML = '<p class="gl-msg">正在载入' + esc(src.C.title) + '……</p>'; return; }
      var lines = text.split('\n'), off = 0, html = '', need = [];
      blocks = [];
      lines.forEach(function (line) {
        var bs = analyse(langId, src, line, re);
        if (bs.length) {
          html += '<div class="gl-line">' + bs.map(function (b) {
            var k = blocks.length; b.s += off; b.e += off; blocks.push(b);
            var g = b.idxs ? glossOf(src, b.idxs) : null;
            if (b.idxs && !g) need = need.concat(b.idxs.slice(0, 1));
            var head = b.idxs ? src.lang.display(src.E[b.idxs[0]].key) : '';
            var show = b.particle || (g ? g.text : (b.idxs ? (src.state === 'full' || src.C.shard ? '' : '释义载入中……') : '词典未收'));
            var title = b.particle ? b.particle + (g ? '\n' + g.from + '：' + g.full : '') : g ? g.from + '：' + g.full : '';
            var cls = 'gl-w' + (b.idxs || b.particle ? '' : ' miss') + (b.phrase ? ' ph' : '');
            var link = head ? '<a class="gl-dict" href="#dict-' + esc(src.C.id) + '?q=' + encodeURIComponent(head) + '" title="在词典里查看全部释义">词典</a>' : '';
            return '<div class="' + cls + '" data-k="' + k + '" title="' + esc(title.slice(0, 600)) + '">' +
              '<div class="gl-top"><span class="gl-t">' + esc(b.text) + '</span>' + link + '</div>' +
              (head && (b.how || (!b.phrase && src.fold(head) !== src.fold(b.text))) && !b.particle ? '<div class="gl-how">' + (b.how ? esc(b.how) + ' ' : '') + '→ ' + esc(head) + '</div>' : '') +
              (b.note ? '<div class="gl-note">' + esc(b.sfx || '') + '：' + esc(b.note) + '</div>' : '') +
              (b.tail ? '<div class="gl-note">' + esc(b.tail[0]) + '：' + esc(b.tail[1]) + '</div>' : '') +
              '<div class="gl-g">' + esc(show) + '</div></div>';
          }).join('') + '</div>';
        } else if (html) html += '<div class="gl-gap"></div>';
        off += line.length + 1;
      });
      el.innerHTML = html || '<p class="gl-msg">没有可查的词。</p>';
      if (need.length) src.ensure(need);
    }
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('.gl-dict')) return;
      var w = ev.target.closest('.gl-w');
      if (!w) return;
      var b = blocks[+w.dataset.k];
      if (b && hooks.pick) hooks.pick(b.s, b.e);
    });
    return {
      // 换语言；没有设 gloss 的语言返回 false
      setLang: function (id, dictId, wordRe) {
        langId = id; re = wordRe; src = dictId ? source(dictId) : null;
        if (src && !src._hooked) { src._hooked = true; src.onChange(function () { if (src === this) draw(); }.bind(src)); }
        text = ''; draw();
        return !!src;
      },
      update: function (t) {
        text = t;
        if (!src) return;
        if (src.state === 'none' && t.trim()) src.load().catch(function () {});
        clearTimeout(timer); timer = setTimeout(draw, 120);
      },
      // 拉丁转写里选中了 s..e：标出对应的方块
      mark: function (s, e) {
        var first = null;
        el.querySelectorAll('.gl-w').forEach(function (n) {
          var b = blocks[+n.dataset.k], on = !!b && (s === e ? (b.s <= s && s <= b.e) : (b.s < e && b.e > s));
          n.classList.toggle('on', on);
          if (on && !first) first = n;
        });
        if (first) {
          var r = first.getBoundingClientRect(), pr = el.getBoundingClientRect();
          if (r.top < pr.top || r.bottom > pr.bottom) el.scrollTop += r.top - pr.top - el.clientHeight / 3;
        }
      }
    };
  }

  SIYI.Gloss = Gloss;
  SIYI.glossInternals = { analyse: analyse, source: source, glossOf: glossOf };   // 供检查用
})();
