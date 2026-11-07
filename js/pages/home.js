/* 首页：大标题、名句条、查词、各语言的编辑器入口、新近范文。文字来自 config/ 和 content/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  let built = false;
  const BOOK = '<svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true"><path d="M2.5 3.2c1.9-.6 3.8-.4 5.5.8 1.7-1.2 3.6-1.4 5.5-.8v9.3c-1.9-.6-3.8-.4-5.5.8-1.7-1.2-3.6-1.4-5.5-.8zM8 4v9.3" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';

  function build() {
    const site = SIYI.config.site, D = SIYI.dictionaries;
    $('home-title').textContent = site.title;
    $('home-seal').textContent = site.seal || '';
    $('home-seal').parentNode.hidden = !site.seal;
    $('home-lead').textContent = site.lead || '';
    $('home-lead').hidden = !site.lead;
    $('home-origin').textContent = site.origin || '';
    $('home-origin').hidden = !site.origin;

    const list = D.list || [];
    $('home-dicts').hidden = !list.length && !D.intro;
    $('home-dict-intro').textContent = D.intro || '';
    $('home-dict-intro').hidden = !D.intro;
    // 词典卡片和下面“对照转写”的卡片同一个样子，左边是书本图标
    $('home-dict-links').innerHTML = list.map(d => {
      const out = /^https?:/.test(d.url || '');
      return `<a class="tool-card" href="${esc(d.url)}"${out ? ' target="_blank" rel="noopener"' : ''}>
        <span class="glyph">${BOOK}</span><b>${esc(d.name)}${out ? ' ↗' : ''}</b></a>`;
    }).join('');

    const tools = SIYI.languages.filter(l => l.editor && !l.hidden);
    $('home-tools-sec').hidden = !tools.length;
    $('home-tools').innerHTML = tools.map(l => {
      const c = l.card || {};
      return `<a class="tool-card" href="#tool-${esc(l.id)}">
        <span class="glyph${l.vertical === 'rotated' ? ' rot' : l.vertical ? ' v' : ''}" style="font-family:${esc(l.font || 'inherit')}" dir="${l.dir || 'ltr'}">${esc(c.glyph || '')}</span>
        <b>${esc(l.name)}</b></a>`;
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
