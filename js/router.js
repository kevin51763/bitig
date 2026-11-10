/* 最后载入：生成页头导航和页脚，按网址里 # 后面的部分切换栏目。
     #home 首页   #texts 范文   #text-简写 单篇范文   #materials 资料   #sayings 全部名句
     #dict 词典（上次看的那部）   #dict-词典名 某一部词典，词典名见 js/dict/dictionaries.js
     #tool-语言简写 该语言的编辑器
   访问计数在 js/counter.js，不在这里。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const site = SIYI.config.site;
  const tools = SIYI.languages.filter(l => l.editor);
  const shown = tools.filter(l => !l.hidden && !l.wip);   // 开发中的（wip）只在首页最底下列出

  /* 页头与页脚 */
  document.title = site.title;
  $('brand-name').textContent = site.title;
  $('brand-seal').textContent = site.seal || '';
  $('brand-seal').parentNode.hidden = !site.seal;
  const links = list => list.map(([h, t]) => `<a href="#${esc(h)}" data-nav="${esc(h)}">${esc(t)}</a>`).join('');
  $('nav').innerHTML = links(shown.map(l => ['tool-' + l.id, l.short || l.name]));
  $('nav-right').innerHTML = links([['dict', '词典'], ['texts', '范文'], ['materials', '资料库']]);
  $('foot-name').textContent = site.title;
  $('foot-meta').innerHTML = site.email ? `联系邮箱：<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : '';

  /* 页头只占一行。放不下时可以左右滑动：右边缘淡出作提示，当前栏目自动滑到看得见的地方 */
  const head = document.querySelector('.site-head'), bar = head.querySelector('.in');
  function edge() {
    head.classList.toggle('scrolls', bar.scrollWidth > bar.clientWidth + 1);
    head.classList.toggle('at-end', bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 2);
  }
  function revealNav() {
    const a = bar.querySelector('a[aria-current="page"][data-nav]');
    if (a && bar.scrollWidth > bar.clientWidth) {
      const r = a.getBoundingClientRect(), b = bar.getBoundingClientRect(), brand = $('brand').getBoundingClientRect();
      const left = r.left - brand.right - 8, right = r.right - b.right + 32;
      if (left < 0) bar.scrollLeft += left; else if (right > 0) bar.scrollLeft += right;
    } else if (!a) bar.scrollLeft = 0;
    edge();
  }
  bar.addEventListener('scroll', edge, { passive: true });
  window.addEventListener('resize', edge);

  /* 网址里 # 后面的部分 h 对应哪个栏目。返回：
       view  显示 index.html 里的哪一块（<main id="v-…">）
       nav   页头导航里哪一项标成当前栏目（不写就都不标）
       open  显示之前要做的事
     加新栏目：在 index.html 里加一块 <main class="view" id="v-xxx" hidden>，把 id 写进 VIEWS，再在这里加一行。
     这些网址公开后就是别人收藏的链接，不要改。 */
  const VIEWS = ['v-home', 'v-texts', 'v-mats', 'v-tri', 'v-mm', 'v-text', 'v-says', 'v-dict'];
  function resolve(h) {
    const P = SIYI.pages;
    const tool = h.startsWith('tool-') ? SIYI.lang(h.slice(5)) : null;
    if (tool && tool.editor === 'three-pane') return { view: 'v-tri', nav: h, open() {
      $('tri-h1').textContent = tool.name + '对照转写';
      SIYI.dictLine($('tri-dicts'), tool.id);
      SIYI.wipLine($('tri-wip'), tool.id);
      SIYI.threePane.show(tool.id);
    } };
    if (tool && tool.editor === 'two-pane' && SIYI.converters[tool.id]) return { view: 'v-mm', nav: h, open: () => SIYI.twoPane.show(tool.id) };
    if (h === 'texts') return { view: 'v-texts', nav: 'texts', open: P.texts.renderList };
    if (h.startsWith('text-')) return { view: 'v-text', nav: 'texts', open: () => P.texts.renderReader(h.slice(5)) };
    if (h === 'materials') return { view: 'v-mats', nav: 'materials', open: P.materials.renderList };
    if (h === 'sayings') return { view: 'v-says', open: P.sayings.renderPage };
    if (h === 'dict' || h.startsWith('dict-')) return { view: 'v-dict', nav: 'dict', open: () => P.dict.show(h.slice(5)) };
    return { view: 'v-home', nav: 'home', open: P.home.render };   // 认不出的网址都回首页
  }

  function route() {
    const { view, nav, open } = resolve((location.hash || '#home').slice(1));
    document.title = site.title;
    VIEWS.forEach(id => { $(id).hidden = id !== view; });
    document.body.classList.toggle('in-dict', view === 'v-dict');   // 词典占满窗口，版式不同（css/dict.css）
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    revealNav();
    open();
    // 浏览器标签上的标题：栏目名 · 网站名。首页只写网站名；单篇范文的标题由 js/pages/texts.js 自己写
    if (view !== 'v-home' && view !== 'v-text') {
      const t = $(view).querySelector('h1');
      if (t && t.textContent) document.title = t.textContent + ' · ' + site.title;
    }
    window.scrollTo(0, 0);
  }

  /* 检查语言配置：两栏编辑器要有对应的转换规则 */
  tools.forEach(l => {
    if (l.editor === 'two-pane' && !SIYI.converters[l.id]) SIYI.problem(`config/languages.js 里「${l.name}」设了 editor: 'two-pane'，但 js/converters/ 里没有简写为 ${l.id} 的转换规则（或 index.html 没有载入它）`);
    if (l.editor === 'three-pane' && !(SIYI.turkic && SIYI.turkic.MODES[l.id])) SIYI.problem(`config/languages.js 里「${l.name}」设了 editor: 'three-pane'，但三栏编辑器只支持回鹘文（ug）和如尼文（rn）`);
  });

  window.addEventListener('hashchange', route);
  route();
  if (document.fonts) document.fonts.ready.then(revealNav);   // 字体载入后导航宽度会变
})();
