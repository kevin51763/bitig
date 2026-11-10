/* “词典”栏目：满汉、蒙汉、蒙汉满、清文鉴、藏文五部词典。
   网址：#dict（上次看的那部）、#dict-manhan、#dict-menghan、#dict-manhanmeng、#dict-qingwenjian、#dict-tibetan。
   各词典的设置在 js/dict/dictionaries.js，查询程序在 js/dict/core.js。
   词库只在第一次用到时读入，之后留在内存里，切换栏目、切换词典都不再重读。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const apps = {};
  let built = false;
  const idle = window.requestIdleCallback || (f => setTimeout(f, 200));

  const cfgOf = id => SIYI.dictConfigs.find(c => c.id === id);
  /* 左上角的词典切换：按数据来源分行，每行开头是来源，后面是出自这一来源的词典 */
  const tabs = id => {
    const rows = [];
    SIYI.dictConfigs.forEach(c => {
      const src = c.source || '栗林均词典';
      let row = rows.find(r => r.src === src);
      if (!row) rows.push(row = { src, url: c.sourceUrl, list: [] });
      if (!row.url) row.url = c.sourceUrl;
      row.list.push(c);
    });
    return '<nav class="dx-tabs" aria-label="切换词典">' + rows.map(r => {
      const cur = r.list.some(c => c.id === id);
      const label = r.url
        ? `<a class="dx-tabsrc" href="${esc(r.url)}" target="_blank" rel="noopener" title="数据来源">${esc(r.src)}</a>`
        : `<span class="dx-tabsrc" title="数据来源">${esc(r.src)}</span>`;
      return `<div class="dx-tabrow${cur ? ' cur' : ''}">${label}<span class="dx-tablist">` +
        r.list.map(c => `<a href="#dict-${c.id}"${c.id === id ? ' aria-current="page"' : ''}>${esc(c.tab)}</a>`).join('') + '</span></div>';
    }).join('') + '</nav>';
  };

  /* 词典占满页头以下的窗口，要知道页头有多高（窄屏时导航会折行） */
  function headH() {
    const h = document.querySelector('.site-head');
    if (h) document.documentElement.style.setProperty('--head-h', h.offsetHeight + 'px');
  }
  function build() {
    if (built) return;
    built = true;
    $('v-dict').innerHTML = '<h1 class="vh" id="dict-h1" hidden>词典</h1>' +
      SIYI.dictConfigs.map(c => `<div class="dx-panel" id="dx-${c.id}" hidden></div>`).join('');
    headH();
    if (window.ResizeObserver) new ResizeObserver(headH).observe(document.querySelector('.site-head'));
    else window.addEventListener('resize', headH);
    watchSize();
  }
  /* 手机上：整页滚动，页头、词典顶栏、原文栏、结果数一行依次固定在上面，一直显示，不随滑动收起。
     要固定得一个接一个，得知道前面几块有多高，这里量出来交给 css/dict.css 末尾的样式。 */
  const rootStyle = document.documentElement.style;
  function measure() {
    const panel = document.querySelector('.dx-panel:not([hidden])');
    const h = sel => { const el = panel && panel.querySelector(sel); return el ? el.offsetHeight : 0; };
    rootStyle.setProperty('--sh', document.querySelector('.site-head').offsetHeight + 'px');
    rootStyle.setProperty('--dh', h('.dx-head') + 'px');
    rootStyle.setProperty('--sp', h('.dx-spine') + 'px');
  }
  // 这几块的高度一变（展开词典来源、转动屏幕），就重新量
  let ro = null;
  function watchSize() {
    if (window.ResizeObserver) ro = new ResizeObserver(() => measure());
    else window.addEventListener('resize', measure);
  }
  function observe(id) {
    if (!ro) return;
    const p = $('dx-' + id);
    ro.observe(document.querySelector('.site-head'));
    ['.dx-head', '.dx-spine'].forEach(sel => { const el = p.querySelector(sel); if (el) ro.observe(el); });
  }

  function app(id) {
    build();
    if (!apps[id]) { apps[id] = SIYI.DictApp(cfgOf(id), $('dx-' + id), tabs(id)); observe(id); }
    return apps[id];
  }
  function lastId() {
    const v = SIYI.store.get('dict-last');
    return cfgOf(v) ? v : SIYI.dictConfigs[0].id;
  }

  /* 离开词典栏目（去了首页、编辑器等）后再回来，各部词典的输入框都清空；在词典之间切换则不清 */
  let away = true;
  window.addEventListener('hashchange', () => { if (!/^#dict(-|$)/.test(location.hash)) away = true; });

  SIYI.pages.dict = {
    show(id) {
      if (away) { Object.keys(apps).forEach(k => apps[k].reset()); away = false; }
      if (!cfgOf(id)) id = lastId();
      SIYI.store.set('dict-last', id);
      app(id);
      SIYI.dictConfigs.forEach(c => { $('dx-' + c.id).hidden = c.id !== id; });
      $('dict-h1').textContent = cfgOf(id).title;
      headH(); measure();
      apps[id].show();
      // 稍后趁空闲预读其余几部的检索文件，切换过去时不用等
      setTimeout(() => idle(() => SIYI.dictConfigs.forEach(c => app(c.id).prefetch())), 3000);
    }
  };

  /* 还没打开词典时：鼠标移到“词典”或查词链接上，就先读检索文件；首页闲下来也预读上次用的那部 */
  const warm = id => { if (SIYI.dictConfigs && cfgOf(id)) app(id).prefetch(); };
  ['pointerover', 'focusin'].forEach(type => document.addEventListener(type, e => {
    const a = e.target.closest && e.target.closest('a[href^="#dict"]');
    if (a) warm(a.getAttribute('href').slice(6) || lastId());
  }));
  window.addEventListener('load', () => setTimeout(() => idle(() => warm(lastId())), 2500));
})();
