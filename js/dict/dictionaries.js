/* “词典”栏目里三部词典各自的设置：读哪个词库、释义怎么排、左栏显示什么。
   查询程序在 js/dict/core.js，转写规则在 js/dict/translit-mnc.js 和 translit-mn.js。
   词库在 dict/data/，由 dict/tools/build_data.py 从栗林均词典的 CSV 生成；
   重新生成词库后，把下面 VER 的日期改新，读者的浏览器才会重新下载。 */
(function () {
  var VER = '?v=2026110701';
  var MNC = window.MNC, MN = window.MN;

  var LEGEND_MNC =
    '<h3>满文转写（穆麟德夫式）</h3><dl>' +
    '<div><dt>ū</dt><dd>也可打 v 或 @</dd></div><div><dt>š</dt><dd>也可打 S 或 x</dd></div>' +
    '<div><dt>ž</dt><dd>也可打 R</dd></div><div><dt>k\'</dt><dd>也可打 K</dd></div>' +
    '<div><dt>ts\'</dt><dd>也可打 ts</dd></div><div><dt>c\'y</dt><dd>也可打 cy</dd></div>' +
    '<div><dt>zy</dt><dd>也可打 jy</dd></div><div><dt>ng、dz</dt><dd>各算一个字母</dd></div></dl>';
  var LEGEND_MN =
    '<h3>蒙古文转写（学术转写）</h3><dl>' +
    '<div><dt>γ</dt><dd>也可打 G 或 gh</dd></div><div><dt>č</dt><dd>也可打 c 或 ch</dd></div>' +
    '<div><dt>ǰ</dt><dd>也可打 j</dd></div><div><dt>š</dt><dd>也可打 S 或 sh</dd></div>' +
    '<div><dt>ö</dt><dd>也可打 O</dd></div><div><dt>ü</dt><dd>也可打 U</dd></div>' +
    '<div><dt>ē</dt><dd>也可打 E</dd></div><div><dt>-a、-e</dt><dd>词末分写的 a、e</dd></div>' +
    '<div><dt>-un 等</dt><dd>附加成分前的分隔</dd></div></dl>';
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
    var D = MNC.display, NAMES = ['满汉大辞典', '新满汉', '満漢和'];
    var col = function (e) { return e.script || MNC.toScript(e.key); };
    return {
      id: 'manhan', tab: '满汉', title: '满汉词典', data: 'dict/data/manhan', ver: VER, colLang: 'mnc',
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
      id: 'menghan', tab: '蒙汉', title: '蒙汉词典', data: 'dict/data/menghan', ver: VER, colLang: 'mn',
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
    var NAMES = ['欽定蒙文彙書', '蒙文総彙', '蒙文倒綱', '蒙漢字典'], SEALS = ['彙', '総', '倒', '字'];
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
      id: 'manhanmeng', tab: '满汉蒙', title: '满汉蒙词典', data: 'dict/data/manhanmeng', ver: VER, colLang: 'mn', twoPanes: true,
      dicts: NAMES.map(function (n, i) { return { name: n, seal: SEALS[i] }; }),
      inputs: [
        { id: 'mn', label: '蒙文转写', lang: MN, placeholder: '输入蒙古文转写，如 ayimaγ、bičig；也可输入汉字反查' },
        { id: 'mnc', label: '满文转写', lang: MNC, placeholder: '输入满文转写，如 aiman、bithe；也可输入汉字反查' }
      ],
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

  /* ---------- 清文鑑 ---------- */
  var qingwenjian = (function () {
    var NAMES = ['増訂清文鑑', '満蒙清文鑑', '五体清文鑑', '三合切音清文鑑', '大清全書'], SEALS = ['增', '蒙', '五', '三', '全'];
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
      id: 'qingwenjian', tab: '清文鑑', title: '清文鑑', data: 'dict/data/qingwenjian', ver: VER, colLang: 'mnc', twoPanes: true,
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
          // 释义：増訂、満蒙两部是满文，五体是日文，大清全書是汉文；其中的满文词点一下即查
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
        '<p>收増訂清文鑑、満蒙清文鑑、五体清文鑑、三合切音清文鑑、大清全書五部，可分别勾选。増訂、満蒙两部以满文释满文，五体附日文译释，大清全書附汉文释义；释义里的满文词点一下即可查询。左栏并列满文和蒙古文，蒙古文原文由转写生成。</p>' +
        '<p>' + eg(['abka', 'bithe', 'morin', 'aššafi'], 'mnc') + eg(['tngri', 'bičig'], 'mn') + eg(['天', '書']) + '</p>'
    };
  })();

  SIYI.dictConfigs = [manhan, menghan, manhanmeng, qingwenjian];
})();
