/* 首页：大标题、名句条、查词、各语言的编辑器入口、新近范文。文字来自 config/ 和 content/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  let built = false;

  function build() {
    const site = SIYI.config.site, D = SIYI.dictionaries;
    $('home-title').textContent = site.title;
    $('home-seal').textContent = site.seal || '';
    $('home-seal').parentNode.hidden = !site.seal;
    $('home-lead').textContent = site.lead || '';
    $('home-origin').textContent = site.origin || '';
    $('home-origin').hidden = !site.origin;

    const list = D.list || [];
    $('home-dicts').hidden = !list.length && !D.intro;
    $('home-dict-intro').textContent = D.intro || '';
    $('home-dict-links').innerHTML = list.map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)} ↗</a>`).join('');

    const tools = SIYI.languages.filter(l => l.editor);
    $('home-tools-sec').hidden = !tools.length;
    $('home-tools').innerHTML = tools.map(l => {
      const c = l.card || {};
      return `<a class="tool-card" href="#tool-${esc(l.id)}">
        <span class="glyph${l.vertical === 'rotated' ? ' rot' : l.vertical ? ' v' : ''}" style="font-family:${esc(l.font || 'inherit')}" dir="${l.dir || 'ltr'}">${esc(c.glyph || '')}</span>
        <span><b>${esc(l.name)}</b><span class="d">${esc(c.desc || '')}</span></span></a>`;
    }).join('');

    $('say-next').addEventListener('click', SIYI.pages.sayings.next);
    SIYI.pages.sayings.next();
  }

  function render() {
    if (!built) { built = true; build(); }
    const n = SIYI.config.site.recentTexts || 6;
    const items = SIYI.texts.slice(-n).reverse();
    $('home-texts').innerHTML = items.length
      ? SIYI.pages.texts.listHtml(items) + (SIYI.texts.length > items.length ? `<p class="small"><a href="#texts">查看全部 ${SIYI.texts.length} 篇 →</a></p>` : '')
      : '<div class="empty-box">还没有范文。</div>';
  }

  SIYI.pages.home = { render };
})();
