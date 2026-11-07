/* “词典”栏目：满汉、蒙汉、满汉蒙、清文鑑四部词典。
   网址：#dict（上次看的那部）、#dict-manhan、#dict-menghan、#dict-manhanmeng、#dict-qingwenjian。
   各词典的设置在 js/dict/dictionaries.js，查询程序在 js/dict/core.js。
   词库只在第一次用到时读入，之后留在内存里，切换栏目、切换词典都不再重读。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const apps = {};
  let built = false;
  const idle = window.requestIdleCallback || (f => setTimeout(f, 200));

  const cfgOf = id => SIYI.dictConfigs.find(c => c.id === id);
  const tabs = id => '<nav class="dx-tabs" aria-label="切换词典">' +
    SIYI.dictConfigs.map(c => `<a href="#dict-${c.id}"${c.id === id ? ' aria-current="page"' : ''}>${esc(c.tab)}</a>`).join('') + '</nav>';

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
