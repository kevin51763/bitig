/* 最后载入：生成页头导航和页脚，按网址里 # 后面的部分切换栏目。
     #home 首页   #texts 范文   #text-简写 单篇范文   #materials 资料   #sayings 全部名句
     #tool-语言简写 该语言的编辑器 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const site = SIYI.config.site, D = SIYI.dictionaries;
  const tools = SIYI.languages.filter(l => l.editor);

  /* 页头与页脚 */
  document.title = site.title;
  $('brand').textContent = site.title;
  $('nav').innerHTML = [['home', '首页'], ['texts', '范文'], ['materials', '资料']]
    .concat(tools.map(l => ['tool-' + l.id, l.short || l.name]))
    .map(([h, t]) => `<a href="#${esc(h)}" data-nav="${esc(h)}">${esc(t)}</a>`).join('');
  if (D.header && D.header.url) { $('dict-link').href = D.header.url; $('dict-link').textContent = (D.header.name || '查词') + ' ↗'; }
  else $('dict-link').hidden = true;
  $('foot-name').textContent = site.title;
  $('foot-meta').textContent = site.footer || '';

  const VIEWS = ['v-home', 'v-texts', 'v-mats', 'v-tri', 'v-mm', 'v-text', 'v-says'];
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
    VIEWS.forEach(id => { $(id).hidden = id !== view; });
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });

    if (view === 'v-tri') {
      $('tri-h1').textContent = tool.name + '对照转写';
      SIYI.dictLine($('tri-dicts'), tool.id);
      SIYI.threePane.show(tool.id);
    } else if (view === 'v-mm') SIYI.twoPane.show(tool.id);
    else if (view === 'v-texts') SIYI.pages.texts.renderList();
    else if (view === 'v-text') SIYI.pages.texts.renderReader(h.slice(5));
    else if (view === 'v-mats') SIYI.pages.materials.renderList();
    else if (view === 'v-says') SIYI.pages.sayings.renderPage();
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
})();
