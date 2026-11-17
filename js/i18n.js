/* 界面语言：中文和英文。
   网站的文字都是用中文写的。读者选了英文时，这里照 config/en.js 里的对照表，把页面上的中文界面文字换成英文；
   表里没有的照旧显示中文。词典的释义、文章、资料的书名、名句的译文是内容，不翻译。
     · 用哪种语言：读者点过页头的按钮，就照读者选的（记在浏览器里）；没点过，浏览器是中文的用中文，别的用英文。
       网址后面加 ?lang=en 或 ?lang=zh 也能指定，效果和点按钮一样。
     · 选中文时不下载对照表，这个文件也什么都不做。
     · 加了新的中文界面文字，想让它有英文：在 config/en.js 里加一行。
     · 某一块不想被翻译：给那个元素加上 data-keep（词典的释义和例词已经不翻译，见下面的 KEEP）。
   这个文件要排在 js/siyi.js 之后、别的文件之前。 */
(function () {
  const KEY = 'bitig-lang';
  const asked = /[?&]lang=(en|zh)\b/.exec(location.search);
  let ui = asked && asked[1];
  try {
    if (ui) localStorage.setItem(KEY, ui); else ui = localStorage.getItem(KEY);
  } catch (e) {}
  if (ui !== 'en' && ui !== 'zh') ui = /^zh\b/i.test(navigator.language || 'zh') ? 'zh' : 'en';
  if (asked) {   // 记下之后把 ?lang= 从地址栏里去掉，免得留在收藏和分享的链接里
    const rest = location.search.replace(/([?&])lang=(en|zh)(&|$)/, (m, a, b, c) => c ? a : '');
    try { history.replaceState(null, '', location.pathname + rest + location.hash); } catch (e) {}
  }

  SIYI.ui = ui;                                   // 'zh' 或 'en'
  SIYI.setUi = l => { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); };
  SIYI.t = s => s;                                // 把一段中文界面文字换成当前语言的；中文时原样返回

  // 页头的语言按钮（index.html 里的 #lang-switch）：中文时写 EN，英文时写“中文”
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('lang-switch');
    if (!b) return;
    b.textContent = ui === 'en' ? '中文' : 'EN';
    b.title = ui === 'en' ? '切换到中文' : 'Switch to English';
    b.lang = ui === 'en' ? 'zh-CN' : 'en';
    b.hidden = false;
    b.addEventListener('click', () => SIYI.setUi(ui === 'en' ? 'zh' : 'en'));
  });
  if (ui !== 'en') return;

  document.documentElement.lang = 'en';
  // 对照表只在英文时下载。写在这里，浏览器会先把它读完，再往下读别的文件，页面一出来就是英文
  const ver = (document.currentScript && /\?v=\d+/.exec(document.currentScript.src) || [''])[0];
  document.write('<script src="config/en.js' + ver + '"><\/script>');

  const HAN = /[　-〿㐀-鿿＀-￯“”‘’·…]/;   // 含汉字或中文标点的才去查表
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-label'];
  const KEEP = '[data-keep], .dx-def, .dx-ex, .dx-eg, script, style, textarea';   // 这些里面是内容，不翻译

  function t(s) {
    const T = SIYI.en;
    if (!T || !s || !HAN.test(s)) return s;
    const core = s.trim().replace(/\s+/g, ' ');
    if (!core) return s;
    let out = Object.prototype.hasOwnProperty.call(T.text, core) ? T.text[core] : null;
    if (out == null) {
      for (let i = 0; i < T.patterns.length; i++) {
        const m = T.patterns[i][0].exec(core);
        if (m) { out = T.patterns[i][1].replace(/\$(\d)/g, (x, n) => t(m[n] || '')); break; }
      }
    }
    if (out == null) return s;
    return s.match(/^\s*/)[0] + out + s.match(/\s*$/)[0];   // 两头的空白照原样留着
  }
  SIYI.t = t;

  function kept(el) { return !!(el && el.closest && el.closest(KEEP)); }
  function textNode(n) {
    if (!HAN.test(n.nodeValue) || kept(n.parentNode)) return;
    const v = t(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
  }
  function attrs(el) {
    for (let i = 0; i < ATTRS.length; i++) {
      const v = el.getAttribute(ATTRS[i]);
      if (v && HAN.test(v)) { const w = t(v); if (w !== v) el.setAttribute(ATTRS[i], w); }
    }
  }
  function sweep(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || kept(root)) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeType === 1 && n.matches(KEEP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) textNode(n); else attrs(n); }
  }

  // 页面上每添一块、每改一处文字，就照表换一遍。换成英文后不再含中文，不会来回触发
  // 对照表读完之前已经在页面上的文字（index.html 里写好的那些），等表一到就补换一遍
  let swept = false;
  function first() { if (!swept && SIYI.en) { swept = true; sweep(document.documentElement); } }
  document.addEventListener('DOMContentLoaded', first);
  new MutationObserver(list => {
    first();
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m.type === 'childList') m.addedNodes.forEach(sweep);
      else if (m.type === 'characterData') textNode(m.target);
      else if (!kept(m.target)) attrs(m.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
})();
