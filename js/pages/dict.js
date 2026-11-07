/* “词典”栏目：满汉、蒙汉、满汉蒙、清文鉴、藏文五部词典。
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
    watchScroll();
  }
  /* 手机上：整页滚动。往下滑时页头、词典顶栏和原文栏一起滑出屏幕，只留结果数一行；往上滑时滑回。
     电脑端不收。具体的位置和动画在 css/dict.css 末尾。 */
  const narrow = window.matchMedia('(max-width: 760px)');
  let collapsed = false, lastY = 0, acc = 0;
  function setCollapsed(on) {
    if (collapsed === on) return;
    collapsed = on;
    document.body.classList.toggle('dx-collapsed', on);
  }
  // 量出页头、当前词典顶栏、原文栏的高度，供吸顶和滑出的位置用
  function measure() {
    const root = document.documentElement.style, panel = document.querySelector('.dx-panel:not([hidden])');
    const h = sel => { const el = panel && panel.querySelector(sel); return el ? el.offsetHeight : 0; };
    root.setProperty('--sh', document.querySelector('.site-head').offsetHeight + 'px');
    root.setProperty('--dh', h('.dx-head') + 'px');
    root.setProperty('--sp', h('.dx-spine') + 'px');
    return document.querySelector('.site-head').offsetHeight + h('.dx-head') + h('.dx-spine');
  }
  let ro = null;
  function watchScroll() {
    if (window.ResizeObserver) ro = new ResizeObserver(() => measure());
    window.addEventListener('scroll', () => {
      if (!document.body.classList.contains('in-dict')) return;
      const y = window.scrollY, d = y - lastY;
      lastY = y;
      if (!narrow.matches) return setCollapsed(false);
      // 上方内容还没整个滚过去时不收，否则会把结果数一行也推出屏幕
      if (y < measure() + 10) { acc = 0; return setCollapsed(false); }
      // 同一方向累计滑过 30 像素才收放，轻微抖动不算
      acc = (acc > 0) === (d > 0) ? acc + d : d;
      if (acc > 30) setCollapsed(true);
      else if (acc < -30) setCollapsed(false);
    }, { passive: true });
    narrow.addEventListener('change', () => { setCollapsed(false); measure(); });
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

  SIYI.pages.dict = {
    show(id) {
      if (!cfgOf(id)) id = lastId();
      SIYI.store.set('dict-last', id);
      app(id);
      SIYI.dictConfigs.forEach(c => { $('dx-' + c.id).hidden = c.id !== id; });
      $('dict-h1').textContent = cfgOf(id).title;
      setCollapsed(false);
      headH(); measure();
      apps[id].show();
      // 稍后趁空闲预读另外两部的检索文件，切换过去时不用等
      setTimeout(() => idle(() => SIYI.dictConfigs.forEach(c => app(c.id).prefetch())), 3000);
    }
  };

  /* 还没打开词典时：鼠标移到“词典”或查词链接上，就先读检索文件；首页闲下来也预读上次用的那部 */
  const warm = id => { if (SIYI.dictConfigs && cfgOf(id)) app(id).prefetch(); };
  document.addEventListener('pointerover', e => {
    const a = e.target.closest && e.target.closest('a[href^="#dict"]');
    if (a) warm(a.getAttribute('href').slice(6) || lastId());
  });
  document.addEventListener('focusin', e => {
    const a = e.target.closest && e.target.closest('a[href^="#dict"]');
    if (a) warm(a.getAttribute('href').slice(6) || lastId());
  });
  window.addEventListener('load', () => setTimeout(() => idle(() => warm(lastId())), 2500));
})();
