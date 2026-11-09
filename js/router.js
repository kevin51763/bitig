/* 最后载入：生成页头导航和页脚，按网址里 # 后面的部分切换栏目。
     #home 首页   #texts 范文   #text-简写 单篇范文   #materials 资料   #sayings 全部名句
     #dict 词典（#dict-manhan、#dict-menghan、#dict-manhanmeng）
     #tool-语言简写 该语言的编辑器 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const site = SIYI.config.site, D = SIYI.dictionaries;
  const tools = SIYI.languages.filter(l => l.editor);
  const shown = tools.filter(l => !l.hidden && !l.wip);   // 开发中的（wip）只在首页最底下列出

  /* 页头与页脚 */
  document.title = site.title;
  $('brand').textContent = site.title;
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

  const VIEWS =['v-home', 'v-texts', 'v-mats', 'v-tri', 'v-mm', 'v-text', 'v-says', 'v-dict'];
  function route() {
    const h = (location.hash || '#home').slice(1);
    let view = 'v-home', nav = 'home';
    document.title = site.title;
    const tool = h.startsWith('tool-') ? SIYI.lang(h.slice(5)) : null;
    if (tool && tool.editor === 'three-pane') { view = 'v-tri'; nav = h; }
    else if (tool && tool.editor === 'two-pane' && SIYI.converters[tool.id]) { view = 'v-mm'; nav = h; }
    else if (h === 'texts') { view = 'v-texts'; nav = 'texts'; }
    else if (h.startsWith('text-')) { view = 'v-text'; nav = 'texts'; }
    else if (h === 'materials') { view = 'v-mats'; nav = 'materials'; }
    else if (h === 'sayings') { view = 'v-says'; }
    else if (h === 'dict' || h.startsWith('dict-')) { view = 'v-dict'; nav = 'dict'; }
    VIEWS.forEach(id => { $(id).hidden = id !== view; });
    document.body.classList.toggle('in-dict', view === 'v-dict');
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    revealNav();

    if (view === 'v-tri') {
      $('tri-h1').textContent = tool.name + '对照转写';
      SIYI.dictLine($('tri-dicts'), tool.id);
      SIYI.wipLine($('tri-wip'), tool.id);
      SIYI.threePane.show(tool.id);
    } else if (view === 'v-mm') SIYI.twoPane.show(tool.id);
    else if (view === 'v-texts') SIYI.pages.texts.renderList();
    else if (view === 'v-text') SIYI.pages.texts.renderReader(h.slice(5));
    else if (view === 'v-mats') SIYI.pages.materials.renderList();
    else if (view === 'v-says') SIYI.pages.sayings.renderPage();
    else if (view === 'v-dict') SIYI.pages.dict.show(h.slice(5));
    else SIYI.pages.home.render();
    if (view !== 'v-home' && view !== 'v-text') {
      const t = $(view).querySelector('h1'); if (t && t.textContent) document.title = t.textContent + ' · ' + site.title;
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
