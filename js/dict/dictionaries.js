/* “词典”栏目里各部词典各自的设置：读哪个词库、释义怎么排、左栏显示什么。
   查询程序在 js/dict/core.js，转写规则在 js/dict/translit-mnc.js 和 translit-mn.js。
   词库在 dict/data/，由 dict/tools/build_data.py 从栗林均词典的 CSV 生成；
   重新生成词库后，把下面 VER 的日期改新，读者的浏览器才会重新下载。 */
(function () {
  var VER = '?v=2026110709';
  // 栗林均词典的官网：词典页左上角点“栗林均词典”即打开
  var KURI = 'http://hkuri.cneas.tohoku.ac.jp/';
  var MNC = window.MNC, MN = window.MN;

  /* ---------- 转写规则表（词典顶栏“转写规则”按钮打开） ----------
     每格上面是原文字母，中间是转写，下面是说明（如可代用的打法）。
     每一行写成 ['转写', '打出这个字母用的写法（与转写相同就不写）', '说明（可不写）']；
     只有转写时可以只写一个字符串，如 'a'。 */
  var escL = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  function letters(title, rows, toScript, cls) {
    return '<h4>' + title + '</h4><div class="dx-lgrid">' + rows.map(function (r) {
      if (typeof r === 'string') r = [r];
      return '<div class="dx-lk"><span class="dx-lg ' + cls + '"><span>' + escL(toScript(r[1] || r[0])) + '</span></span>' +
        '<b>' + escL(r[0]) + '</b>' + (r[2] ? '<small>' + escL(r[2]) + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // 不对应单个字母的记号：左边是写法，右边是说明
  function marks(rows) {
    return '<dl>' + rows.map(function (r) { return '<div><dt>' + escL(r[0]) + '</dt><dd>' + escL(r[1]) + '</dd></div>'; }).join('') + '</dl>';
  }

  var LEGEND_MNC =
    '<h3>满文转写（穆麟德夫式）</h3>' +
    letters('元音', ['a', 'e', 'i', 'o', 'u', ['ū', 'v', '也可打 v 或 @']], MNC.toScript, 'mong') +
    letters('辅音', ['n', ['ng', 'ng', '算一个字母'], 'k', 'g', 'h', 'b', 'p', 's', ['š', 'S', '也可打 S 或 x'],
      't', 'd', 'l', 'm', 'c', 'j', 'y', 'r', 'f', 'w'], MNC.toScript, 'mong') +
    letters('拼写汉语、藏语、梵语借词的字母', [["k'", 'K', '也可打 K'], ["g'"], ["h'"], ["ts'", 'ts', '也可打 ts'],
      ['dz', 'dz', '算一个字母'], ['ž', 'R', '也可打 R'], ["c'y", 'cy', '也可打 cy'], ['zy', 'jy', '也可打 jy']], MNC.toScript, 'mong');
  var LEGEND_MN =
    '<h3>蒙古文转写（学术转写）</h3>' +
    letters('元音', ['a', 'e', 'i', 'o', 'u', ['ö', 'O', '也可打 O'], ['ü', 'U', '也可打 U 或 v'], ['ē', 'E', '也可打 E']], MN.toScript, 'mong') +
    letters('辅音', ['n', ['ng', 'ng', '算一个字母'], 'b', 'p', ['q', 'q', '阳性词中'], ['k', 'k', '阴性词中，与 q 同字'],
      ['γ', 'G', '阳性词中；也可打 G 或 gh'], ['g', 'g', '阴性词中，与 γ 同字'], 'm', 'l', 's', ['š', 'S', '也可打 S 或 sh'],
      't', 'd', ['č', 'c', '也可打 c 或 ch'], ['ǰ', 'j', '也可打 j'], 'y', 'r', 'w'], MN.toScript, 'mong') +
    letters('拼写借词的字母', ['f', ['k', 'K', '打 K'], ['kh', 'x', '打 x'], ['ts', 'C', '打 C'], 'z', 'h', ['ch', 'Q', '打 Q']], MN.toScript, 'mong') +
    marks([['-a、-e', '词末与词干分写的 a、e'], ['-un 等', '附加成分前的分隔（窄空格）'], ['\'', '变体选择符，取字母的另一种写法']]);
  var LEGEND_TAIL =
    '<p>结果中的转写一律用正式写法。查询时不分 q 与 k、γ 与 g，ö 与 o、ü 与 u、š 与 s 也可互通；' +
    '用 * 代替任意多个字母，? 代替一个字母。输入汉字则在释义中反查。点击词条空白处，左栏改显示该词条的原文。</p>';

  var eg = function (words, inId) {
    return words.map(function (w) { return '<span class="dx-eg' + (inId ? '' : ' zh') + '" data-q="' + w + '"' + (inId ? ' data-in="' + inId + '"' : '') + '>' + w + '</span>'; }).join('');
  };
  var src = function (H, name, s) {
    return '<span class="dx-src">' + (name ? name + ' ' : '') + '页 ' + H.esc(s.page) + (s.hom ? ' <i>/' + H.esc(s.hom) + '</i>' : '') + '</span>';
  };
  var fromLabel = function (c) { return c.selectedEntry ? '所选词条' : '首条结果'; };

  /* ---------- 满汉词典 ---------- */
  var manhan = (function () {
    var D = MNC.display, NAMES = ['满汉大辞典', '新满汉', '满汉和'];
    var col = function (e) { return e.script || MNC.toScript(e.key); };
    return {
      id: 'manhan', tab: '满汉', title: '满汉词典', data: 'dict/data/manhan', ver: VER, source: '栗林均词典', sourceUrl: KURI, colLang: 'mnc',
      dicts: [{ name: NAMES[0], seal: '大' }, { name: NAMES[1], seal: '新' }, { name: NAMES[2], seal: '和' }],
      inputs: [{ id: 'mnc', label: '满文转写', lang: MNC, placeholder: '输入满文转写，如 abka、hūwa；也可输入汉字反查' }],
      legend: LEGEND_MNC + LEGEND_TAIL,
      sense: function (f) { return { d: f[0], hom: f[1], page: f[2], def: f[3] }; },
      looseOf: function (e) { return [{ r: e.key }]; },
      senseText: function (s) { return s.def; },
      head: function (e, c) {
        var d = D(e.key);
        return '<button type="button" class="dx-tl" data-q="' + c.H.esc(d) + '" data-in="mnc">' + c.H.markDisplay(MNC, d, c.q) + '</button>';
      },
      senseHtml: function (s, c) {
        return src(c.H, NAMES[s.d], s) + '<span class="dx-def">' + c.H.linkWords(c.H.markTerms(s.def), MNC, 'mnc') + '</span>';
      },
      col: col,
      spine: function (c) {
        if (c.q && !c.def && !c.selectedEntry) return c.H.pane({ lbl: '满文', lang: 'mnc', script: MNC.toScript(c.q), tl: D(c.q) });
        if (c.top && (c.def || c.selectedEntry)) return c.H.pane({ lbl: '满文', lang: 'mnc', script: col(c.top), tl: D(c.top.key), from: fromLabel(c) });
        return c.H.pane({ lbl: '满文', empty: '满文随输入显示' });
      },
      intro: '<h2>输入满文转写开始查询</h2>' +
        '<p>输入时左栏随即写出满文。结果按完全相同、词首相同、词中包含、拼写相近的顺序排列；输入汉字或日文则在释义中反查。</p>' +
        '<p>' + eg(['abka', 'morin', 'bithe', 'hūwa', 'gisun'], 'mnc') + eg(['马', '学问']) + '</p>'
    };
  })();

  /* ---------- 蒙汉词典 ---------- */
  var menghan = (function () {
    var D = MN.display, INDEX = {};
    var normSc = function (s) { return s.replace(/[᠋-᠍‍]/g, '').replace(/[\s ]+/g, ' ').trim(); };
    var col = function (e) { return e.script || MN.toScript(e.key); };
    // 释义里的蒙古文：词库中有这个词头的，点一下即可查询
    function mongolLinks(html) {
      return html.split(/(<[^>]+>)/).map(function (part) {
        if (part.charAt(0) === '<') return part;
        return part.replace(/[᠀-᢯‍]+(?:[ ᠎][᠀-᢯]+)*(?:\([᠀-᢯]+\))?/g, function (run) {
          var k = INDEX[normSc(run)];
          if (k === undefined) return '<span class="dx-mn plain">' + run + '</span>';
          var d = D(k).replace(/"/g, '&quot;');
          return '<span class="dx-mn" data-q="' + d + '" data-in="mn" title="' + d + '">' + run + '</span>';
        });
      }).join('');
    }
    function uniq(arr) { return arr.filter(function (x, i) { return x && arr.indexOf(x) === i; }); }
    return {
      id: 'menghan', tab: '蒙汉', title: '蒙汉词典', data: 'dict/data/menghan', ver: VER, source: '栗林均词典', sourceUrl: KURI, colLang: 'mn',
      dicts: [{ name: '蒙汉词典', seal: '蒙' }],
      inputs: [{ id: 'mn', label: '蒙文转写', lang: MN, placeholder: '输入蒙古文转写，如 mongγol、bičig；也可输入汉字反查' }],
      legend: LEGEND_MN + LEGEND_TAIL,
      sense: function (f) { return { d: f[0], hom: f[1], page: f[2], def: f[3], ipa: f[4], cyr: f[5] }; },
      looseOf: function (e) { return e.key.split('～').map(function (r) { return { r: r.trim() }; }); },
      senseText: function (s) { return s.def; },
      loaded: function (E) { E.forEach(function (e) { var k = normSc(col(e)); if (!(k in INDEX)) INDEX[k] = e.key; }); },
      head: function (e, c) {
        var d = D(e.key), ss = c.H.senses(e);
        var cyr = uniq(ss.map(function (s) { return s.cyr; })), ipa = uniq(ss.map(function (s) { return s.ipa; }));
        return '<button type="button" class="dx-tl" data-q="' + c.H.esc(d) + '" data-in="mn">' + c.H.markDisplay(MN, d, c.q) + '</button>' +
          (cyr.length || ipa.length ? '<span class="dx-aux">' + (cyr.length ? '<span class="dx-cyr" lang="mn-Cyrl">' + c.H.esc(cyr.join('，')) + '</span> ' : '') +
            (ipa.length ? '<span class="dx-ipa">[' + c.H.esc(ipa.join('] [')) + ']</span>' : '') + '</span>' : '');
      },
      senseHtml: function (s, c) { return src(c.H, '', s) + '<span class="dx-def">' + mongolLinks(c.H.markTerms(s.def)) + '</span>'; },
      col: col,
      spine: function (c) {
        if (c.q && !c.def && !c.selectedEntry) return c.H.pane({ lbl: '蒙文', lang: 'mn', script: MN.toScript(MN.normInput(c.q)), tl: MN.normInput(c.q) });
        if (c.top && (c.def || c.selectedEntry)) return c.H.pane({ lbl: '蒙文', lang: 'mn', script: col(c.top), tl: D(c.top.key), from: fromLabel(c) });
        return c.H.pane({ lbl: '蒙文', empty: '蒙古文随输入显示' });
      },
      intro: '<h2>输入蒙古文转写开始查询</h2>' +
        '<p>输入时左栏随即写出蒙古文。学术写法和栗林均的写法都可以输入，结果中的转写一律用学术写法。词条另附西里尔蒙古文和国际音标；释义里的蒙古文词点一下即可查询。</p>' +
        '<p>' + eg(['mongγol', 'bičig', 'aγula', 'köke', 'usu'], 'mn') + eg(['马', '学问']) + '</p>'
    };
  })();

  /* ---------- 满汉蒙词典 ---------- */
  var manhanmeng = (function () {
    var NAMES = ['钦定蒙文汇书', '蒙文总汇', '蒙文倒纲', '蒙汉字典'], SEALS = ['汇', '总', '倒', '字'];
    var clean = function (s) { return s.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').replace(/\{[^}]*\}/g, '').trim(); };
    var foldMnc = function (s) { var o = ''; for (var i = 0; i < s.length; i++) o += MNC.foldChar(s[i]); return o.replace(/\s+/g, ' ').trim(); };
    var col = function (e) { return e.script || MN.toScript(e.key, true); };

    // 某词条对应的满文：满文输入时取与查询相符的一项，否则取第一项
    function manchuOf(e, c) {
      var best = null, fq = c.inputId === 'mnc' && c.q ? foldMnc(c.q) : '';
      c.H.alts(e).forEach(function (a) {
        if (!c.H.enabled(a.d)) return;
        var f = foldMnc(a.r), sc = !fq ? 2 : f === fq ? 0 : f.indexOf(fq) >= 0 ? 1 : 2;
        if (!best || sc < best.sc) best = { p: a.r, sc: sc };
      });
      return best && best.p;
    }
    function mncHtml(s, c) {
      return s.mnc.split(/(\s*[,;，；]\s*)/).map(function (p) {
        if (/^\s*[,;，；]\s*$/.test(p)) return c.H.esc(p);
        var q = clean(p), d = MNC.display(p);
        if (!q) return c.H.esc(d);
        return '<span class="dx-w" data-q="' + c.H.esc(MNC.display(q)) + '" data-in="mnc">' +
          (c.inputId === 'mnc' ? c.H.markDisplay(MNC, d, c.q) : c.H.esc(d)) + '</span>';
      }).join('');
    }
    return {
      id: 'manhanmeng', tab: '满汉蒙', title: '满汉蒙词典', data: 'dict/data/manhanmeng', ver: VER, source: '栗林均词典', sourceUrl: KURI, colLang: 'mn', twoPanes: true,
      dicts: NAMES.map(function (n, i) { return { name: n, seal: SEALS[i] }; }),
      // 按钮次序与清文鉴一致：满文在左、蒙文在右；本词典按蒙古文立词头，第一次打开默认蒙文
      inputs: [
        { id: 'mnc', label: '满文转写', lang: MNC, placeholder: '输入满文转写，如 aiman、bithe；也可输入汉字反查' },
        { id: 'mn', label: '蒙文转写', lang: MN, placeholder: '输入蒙古文转写，如 ayimaγ、bičig；也可输入汉字反查' }
      ],
      defaultInput: 'mn',
      legend: LEGEND_MN + LEGEND_MNC + LEGEND_TAIL,
      sense: function (f) { return { d: f[0], hom: f[1], raw: f[2], zh: f[3], mnc: f[4], page: f[5] }; },
      looseOf: function (e, id, alts) { return id === 'mn' ? [{ r: e.key }] : alts(e); },
      senseText: function (s) { return s.zh; },
      head: function (e, c) {
        var d = MN.display(e.key);
        return '<button type="button" class="dx-tl" data-q="' + c.H.esc(d) + '" data-in="mn">' +
          (c.inputId === 'mn' ? c.H.markDisplay(MN, d, c.q) : c.H.esc(d)) + '</button>';
      },
      senseHtml: function (s, c) {
        return src(c.H, NAMES[s.d], s) +
          (s.raw ? '<span class="dx-alt">原书作 ' + c.H.esc(MN.display(s.raw)) + '</span>' : '') +
          '<span class="dx-def">' + c.H.markTerms(s.zh) + '</span>' +
          (s.mnc ? '<span class="dx-eq"><span class="dx-k">满文</span>' + mncHtml(s, c) + '</span>' : '');
      },
      col: col,
      spine: function (c) {
        var live = c.q && !c.def && !c.selectedEntry, from = fromLabel(c);
        var mnc = { lbl: '满文', lang: 'mnc', empty: '满文' }, mn = { lbl: '蒙文', lang: 'mn', empty: '蒙文' };
        if (live && c.inputId === 'mnc') { mnc.script = MNC.toScript(c.q); mnc.tl = MNC.display(c.q); }
        else if (c.top) { var p = manchuOf(c.top, c); if (p) { mnc.script = MNC.toScript(p); mnc.tl = MNC.display(p); mnc.from = from; } }
        if (live && c.inputId === 'mn') { mn.script = MN.toScript(MN.normInput(c.q), true); mn.tl = MN.normInput(c.q); }
        else if (c.top) { mn.script = col(c.top); mn.tl = MN.display(c.top.key); mn.from = from; }
        return c.H.pane(mnc) + c.H.pane(mn);
      },
      intro: '<h2>输入蒙古文或满文转写开始查询</h2>' +
        '<p>先在上方选择输入蒙文转写还是满文转写。左栏并列满文和蒙古文：输入的一种随打随写，另一种取自首条结果；点击词条空白处，左栏改显示该词条。四部清代辞书可分别勾选，汉字输入则在译文中反查。</p>' +
        '<p>' + eg(['ayimaγ', 'bičig', 'morin'], 'mn') + eg(['aiman', 'bithe'], 'mnc') + eg(['部落', '馬']) + '</p>'
    };
  })();

  /* ---------- 清文鉴 ---------- */
  var qingwenjian = (function () {
    var NAMES = ['增订清文鉴', '满蒙清文鉴', '五体清文鉴', '三合切音清文鉴', '大清全书'], SEALS = ['增', '蒙', '五', '三', '全'];
    var D = MNC.display;
    var clean = function (s) { return s.replace(/\[[^\]]*\]/g, '').replace(/\s*\/\s*\d+\s*$/, '').trim(); };
    var foldMn = function (s) { var o = ''; for (var i = 0; i < s.length; i++) o += MN.foldChar(s[i]); return o.replace(/\s+/g, ' ').trim(); };
    var col = function (e) { return MNC.toScript(e.key); };

    // 某词条对应的蒙古文：蒙文输入时取与查询相符的一项，否则取第一项
    function mongolOf(e, c) {
      var best = null, fq = c.inputId === 'mn' && c.q ? foldMn(MN.normInput(c.q)) : '';
      c.H.alts(e).forEach(function (a) {
        if (!c.H.enabled(a.d)) return;
        var f = foldMn(MN.display(a.r)), sc = !fq ? 2 : f === fq ? 0 : f.indexOf(fq) >= 0 ? 1 : 2;
        if (!best || sc < best.sc) best = { p: a.r, sc: sc };
      });
      return best && best.p;
    }
    function mnHtml(s, c) {
      return s.mn.split(/(\s*[,;]\s*)/).map(function (p) {
        if (/^\s*[,;]\s*$/.test(p)) return c.H.esc(p);
        var q = clean(p), d = MN.display(p);
        if (!q) return c.H.esc(d);
        return '<span class="dx-w" data-q="' + c.H.esc(MN.display(q)) + '" data-in="mn">' +
          (c.inputId === 'mn' ? c.H.markDisplay(MN, d, c.q) : c.H.esc(d)) + '</span>';
      }).join('');
    }
    return {
      id: 'qingwenjian', tab: '清文鉴', title: '清文鉴词典', data: 'dict/data/qingwenjian', ver: VER, source: '栗林均词典', sourceUrl: KURI, colLang: 'mnc', twoPanes: true,
      dicts: NAMES.map(function (n, i) { return { name: n, seal: SEALS[i] }; }),
      inputs: [
        { id: 'mnc', label: '满文转写', lang: MNC, placeholder: '输入满文转写，如 abka、bithe；也可输入汉字反查' },
        { id: 'mn', label: '蒙文转写', lang: MN, placeholder: '输入蒙古文转写，如 tngri、bičig；也可输入汉字反查' }
      ],
      legend: LEGEND_MNC + LEGEND_MN + LEGEND_TAIL,
      sense: function (f) { return { d: f[0], hom: f[1], raw: f[2], zh: f[3], mn: f[4], expl: f[5], page: f[6], cyr: f[7] }; },
      looseOf: function (e, id, alts) { return id === 'mnc' ? [{ r: e.key }] : alts(e); },
      senseText: function (s) { return s.zh + ' ' + s.expl; },
      head: function (e, c) {
        var d = D(e.key);
        return '<button type="button" class="dx-tl" data-q="' + c.H.esc(d) + '" data-in="mnc">' +
          (c.inputId === 'mnc' ? c.H.markDisplay(MNC, d, c.q) : c.H.esc(d)) + '</button>';
      },
      senseHtml: function (s, c) {
        var H = c.H;
        return '<span class="dx-src">' + NAMES[s.d] + (s.page ? ' 页 ' + H.esc(s.page) : '') + (s.hom ? ' <i>/' + H.esc(s.hom) + '</i>' : '') + '</span>' +
          (s.raw ? '<span class="dx-alt">原书作 ' + H.esc(D(s.raw)) + '</span>' : '') +
          (s.zh ? '<span class="dx-def">' + H.markTerms(s.zh) + '</span>' : '') +
          // 释义：增订、满蒙两部是满文，五体是日文，大清全书是汉文；其中的满文词点一下即查
          (s.expl ? '<span class="dx-ex">' + H.linkWords(H.markTerms(s.expl), MNC, 'mnc') + '</span>' : '') +
          (s.mn ? '<span class="dx-eq"><span class="dx-k">蒙文</span>' + mnHtml(s, c) +
            (s.cyr ? ' <span class="dx-cyr" lang="mn-Cyrl">' + H.esc(s.cyr) + '</span>' : '') + '</span>' : '');
      },
      col: col,
      spine: function (c) {
        var live = c.q && !c.def && !c.selectedEntry, from = fromLabel(c);
        var mnc = { lbl: '满文', lang: 'mnc', empty: '满文' }, mn = { lbl: '蒙文', lang: 'mn', empty: '蒙文' };
        if (live && c.inputId === 'mnc') { mnc.script = MNC.toScript(c.q); mnc.tl = D(c.q); }
        else if (c.top) { mnc.script = col(c.top); mnc.tl = D(c.top.key); mnc.from = from; }
        if (live && c.inputId === 'mn') { mn.script = MN.toScript(MN.normInput(c.q), true); mn.tl = MN.normInput(c.q); }
        else if (c.top) { var p = mongolOf(c.top, c); if (p) { mn.script = MN.toScript(p, true); mn.tl = MN.display(p); mn.from = from; } }
        return c.H.pane(mnc) + c.H.pane(mn);
      },
      intro: '<h2>输入满文或蒙古文转写开始查询</h2>' +
        '<p>收增订清文鉴、满蒙清文鉴、五体清文鉴、三合切音清文鉴、大清全书五部，可分别勾选。增订、满蒙两部以满文释满文，五体附日文译释，大清全书附汉文释义；释义里的满文词点一下即可查询。左栏并列满文和蒙古文，蒙古文原文由转写生成。</p>' +
        '<p>' + eg(['abka', 'bithe', 'morin', 'aššafi'], 'mnc') + eg(['tngri', 'bičig'], 'mn') + eg(['天', '書']) + '</p>'
    };
  })();

  /* ---------- 藏文词典（Steinert） ---------- */
  var tibetan = (function () {
    var BOC = SIYI.converters.bo;
    // 威利转写：显示照原样；查询时不分大小写，去掉 . + - 等分隔号；输入藏文时先转成威利
    var BO = {
      display: function (s) { return s; },
      toScript: function (s) { return BOC.toScript(s); },
      foldChar: function (c) { var l = c.toLowerCase(); return /[a-z' ]/.test(l) ? l : ''; },
      normInput: function (s) {
        if (/[ༀ-࿿]/.test(s)) s = BOC.toLatin(s);
        return s.replace(/[\s\/]+$/, '').trim();
      }
    };
    var GROUP = { en: { seal: '英', color: 0 }, tib: { seal: '藏', color: 1 }, skt: { seal: '梵', color: 2 } };
    var DICTS = (SIYI.tibetanDicts || []).map(function (d) {
      return { name: d.name, group: d.group, about: d.about, seal: GROUP[d.group].seal, color: GROUP[d.group].color,
        abbr: d.abbr, sub: d.sub, zh: d.zh, rank: d.rank };
    });
    // 释义里 {威利} 是藏文：写成藏文字，短的可点击查询；\n 换行
    function defHtml(def, H) {
      return def.split(/\{([^}]*)\}/).map(function (part, k) {
        if (k % 2) {
          var w = part.replace(/[\s\/]+$/, '').trim(), sc = H.esc(BOC.toScript(part));
          return w.length && w.length <= 40
            ? '<span class="dx-bo-in" data-q="' + H.esc(w) + '" data-in="bo" title="' + H.esc(w) + '">' + sc + '</span>'
            : '<span class="dx-bo-in plain" title="' + H.esc(w) + '">' + sc + '</span>';
        }
        return H.markTerms(part).replace(/\\n/g, '<br>');
      }).join('');
    }
    return {
      id: 'tibetan', tab: '藏文', title: 'Steinert 藏文词典', data: 'dict/data/tibetan', ver: VER,
      shard: 600, listDicts: true, noCol: true, reverse: 'dict/data/tibetan.en.txt',
      groupSenses: true, fold: 5,   // 义项按语种分段；释义超过 5 行先折叠
      defLabel: '英文反查', defPrefix: '英文对应', loadingNote: '词头较多，第一次打开稍慢',
      source: 'Steinert 词典', sourceUrl: 'https://dictionary.christian-steinert.de',
      dicts: DICTS,
      groups: [{ id: 'en', label: '藏英' }, { id: 'tib', label: '藏文释义' }, { id: 'skt', label: '藏梵' }],
      panelNote: '各词典的版权属于原作者，鼠标移到词典名上可看出处。数据取自 ' +
        '<a href="https://github.com/christiansteinert/tibetan-dictionary" target="_blank" rel="noopener">christiansteinert/tibetan-dictionary</a>；' +
        '只有页码、没有文字的扫描本词典不收。',
      inputs: [{ id: 'bo', label: '威利转写', lang: BO, placeholder: '输入威利转写，如 bkra shis、sangs rgyas；也可粘贴藏文' }],
      legend: (function () {
        var bo = function (w) { return BOC.toScript(w); };
        // 辅音字母本身带 a 音，表里写成 ka、kha，上面的藏文也是带 a 的字
        var C30 = ['k', 'kh', 'g', 'ng', 'c', 'ch', 'j', 'ny', 't', 'th', 'd', 'n', 'p', 'ph', 'b', 'm',
          'ts', 'tsh', 'dz', 'w', 'zh', 'z', "'", 'y', 'r', 'l', 'sh', 's', 'h'];
        return '<h3>威利转写（扩展威利 EWTS）</h3>' +
          letters('辅音', C30.map(function (c) { return [c, c + 'a', c === "'" ? '小阿' : '']; }).concat([['a', 'a', '大阿']]), bo, 'bo') +
          letters('元音', ['i', 'u', 'e', 'o'], bo, 'bo') +
          letters('上加字、下加字（自动叠写）', [['rka', 'rka', '上加 r'], ['lka', 'lka', '上加 l'], ['ska', 'ska', '上加 s'],
            ['kya', 'kya', '下加 y'], ['kra', 'kra', '下加 r'], ['kla', 'kla', '下加 l'], ['kwa', 'kwa', '下加 w']], bo, 'bo') +
          letters('梵文字母和符号', [['Ta', 'Ta', '卷舌'], ['Tha'], ['Da'], ['Na'], ['Sha'], ['gha', 'gha', '送气'], ['dha'], ['bha'], ['dzha'],
            ['kSha'], ['A', 'A', '长元音'], ['I'], ['U'], ['ai'], ['au'], ['-i', '-i', '反写元音'], ['-I'],
            ['M', 'aM', '随韵'], ['H', 'aH', '止声']], bo, 'bo') +
          marks([['空格', '音节之间的点（tsheg）'], ['/', '单垂符 །；// 为双垂符'], ['.', '分开容易误读的字母，如 g.yag 写作 གཡག，不写作 གྱག'],
            ['+', '强制叠写，如 k+Sha'], ['0–9', '藏文数字 ༠–༩']]) +
          '<p>查询时不分大小写；也可以直接粘贴藏文，会自动转成威利转写。“英文反查”按英文词找藏文词头，只收有英藏对照表的几部词典。点击词条空白处，左栏改显示该词条的藏文。</p>';
      })(),
      sense: function (f) { return { d: f[0], def: f[1] }; },
      looseOf: function (e) { return [{ r: e.key }]; },
      senseText: function (s) { return s.def; },
      head: function (e, c) {
        return '<span class="dx-bo" lang="bo">' + c.H.esc(BOC.toScript(e.key)) + '</span>' +
          '<button type="button" class="dx-tl" data-q="' + c.H.esc(e.key) + '" data-in="bo">' + c.H.markDisplay(BO, e.key, c.q) + '</button>';
      },
      senseHtml: function (s, c) {
        // 词典全名平时不显示，点左边的简称章才出现
        var D = DICTS[s.d];
        return '<span class="dx-fn">' + c.H.esc(D.name) + (D.zh ? '　' + c.H.esc(D.zh) : '') + '</span>' +
          '<div class="dx-defbox"><span class="dx-def">' + defHtml(s.def, c.H) + '</span></div>';
      },
      col: function () { return ''; },
      spine: function (c) {
        if (c.q && !c.def && !c.selectedEntry) { var w = BO.normInput(c.q); return c.H.pane({ lbl: '藏文', lang: 'bo', horizontal: true, script: BOC.toScript(w), tl: w }); }
        if (c.top && (c.def || c.selectedEntry)) return c.H.pane({ lbl: '藏文', lang: 'bo', horizontal: true, script: BOC.toScript(c.top.key), tl: c.top.key, from: fromLabel(c) });
        return c.H.pane({ lbl: '藏文', empty: '藏文随输入显示' });
      },
      intro: '<h2>输入威利转写开始查询</h2>' +
        '<p>收 Christian Steinert 藏文词典里的六十部词典，三十四万多个词头：藏英词典为主，另有藏文释藏文的辞书和藏梵对照。输入时左栏随即写出藏文，也可以直接粘贴藏文。' +
        '要按英文找藏文，把右边的查询方式改为“英文反查”。词典很多，点上方“词典来源”可按语种勾选。</p>' +
        '<p>' + eg(['bkra shis', 'sangs rgyas', 'byang chub sems', 'chos'], 'bo') + '</p>'
    };
  })();

  SIYI.dictConfigs = [manhan, menghan, manhanmeng, qingwenjian, tibetan];
})();
