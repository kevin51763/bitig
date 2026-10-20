/* 范文：按语言分类的目录，以及单篇的阅读页。目录在 content/texts.js，正文是 content/texts/ 里的 HTML 文件。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;

  function listHtml(items) {
    return `<ul class="tlist">${items.map(d => `<li><a href="#text-${esc(d.id)}"><span class="t">${esc(d.title || '未命名')}</span><span class="s">${esc(d.subtitle || '')}</span>
      ${SIYI.chips(d)}</a></li>`).join('')}</ul>`;
  }

  function renderList() {
    const all = SIYI.texts;
    $('texts-count').textContent = all.length ? `共 ${all.length} 篇` : '';
    $('texts-groups').innerHTML = all.length
      ? SIYI.groupByLang(all, '未分类').map(g => `<div class="group"><h3>${esc(g.name)} <span class="n">${g.items.length} 篇</span></h3>${listHtml(g.items)}</div>`).join('')
      : '<div class="empty-box">还没有范文。范文的登记方法见 content/texts.js 开头的说明。</div>';
  }

  /* 正文放在框里显示；网站和范文同在一个网址下时，框的高度随正文自动调整 */
  function fitFrame(f) {
    let doc;
    try { doc = f.contentDocument; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    const set = () => { f.style.height = Math.min(Math.max(doc.documentElement.scrollHeight + 4, 300), 60000) + 'px'; };
    set();
    try { new ResizeObserver(set).observe(doc.documentElement); } catch (e) {}
    setTimeout(set, 800); setTimeout(set, 2500);
  }

  function renderReader(id) {
    const v = $('v-text');
    const d = SIYI.texts.find(t => t.id === id);
    if (!d) { v.innerHTML = '<a class="backlink" href="#texts">← 全部范文</a><div class="empty-box">找不到这篇范文。</div>'; return; }
    document.title = d.title + ' · ' + SIYI.config.site.title;
    v.innerHTML = `<a class="backlink" href="#texts">← 全部范文</a>
      <header class="reader-head"><div>
        <h1>${esc(d.title || '未命名')}</h1>
        ${d.subtitle ? `<p class="sub">${esc(d.subtitle)}</p>` : ''}
        <p class="sub">${SIYI.chips(d)}</p>
      </div><a class="btn" href="${esc(d.file)}" target="_blank" rel="noopener">单独打开 ↗</a></header>
      <div id="reader-frame"></div>`;
    const f = document.createElement('iframe');
    f.className = 'tframe';
    f.title = d.title || '范文';
    f.addEventListener('load', () => fitFrame(f));
    f.src = d.file;
    $('reader-frame').appendChild(f);
  }

  SIYI.checkList(SIYI.texts, 'content/texts.js', ['id', 'title', 'file']);
  SIYI.pages.texts = { listHtml, renderList, renderReader };
})();
