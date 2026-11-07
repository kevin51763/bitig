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
  /* 手机上：结果往下滑时收起页头、词典顶栏和左栏，只留结果；往上滑或回到顶部时再显示。电脑端不收。
     收起时页头高度为 0，ResizeObserver 会把 --head-h 改成 0，词典随之占满整屏。 */
  const narrow = window.matchMedia('(max-width: 760px)');
  let lock = 0;
  function setCollapsed(on) {
    if (document.body.classList.contains('dx-collapsed') === on) return;
    document.body.classList.toggle('dx-collapsed', on);
    lock = Date.now() + 350;   // 收放会改变列表高度、引起一次滚动，这段时间里不再判断，免得来回跳
  }
  function watchScroll() {
    const last = new WeakMap(), acc = new WeakMap();
    $('v-dict').addEventListener('scroll', e => {
      const t = e.target;
      if (!t.classList || !t.classList.contains('dx-results')) return;
      const y = t.scrollTop, d = y - (last.get(t) || 0);
      last.set(t, y);
      if (!narrow.matches) return setCollapsed(false);
      if (Date.now() < lock) return;
      if (y < 30) { acc.set(t, 0); return setCollapsed(false); }
      // 同一方向累计滑过 40 像素才收放，轻微抖动不算
      const a = acc.get(t) || 0, n = (a > 0) === (d > 0) ? a + d : d;
      acc.set(t, n);
      if (n > 40) setCollapsed(true);
      else if (n < -40) setCollapsed(false);
    }, true);
    narrow.addEventListener('change', () => setCollapsed(false));
  }

  function app(id) {
    build();
    if (!apps[id]) apps[id] = SIYI.DictApp(cfgOf(id), $('dx-' + id), tabs(id));
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
      headH();
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
