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
  /* 手机上：整页滚动，上方内容（页头、词典顶栏、原文栏）随滑动收放。电脑端不收。
     往下滑：同一方向滑过 30 像素就一次收完；滑得越快，收起的动画越短（120～280 毫秒）。
     往上滑：慢慢滑时保持收起，方便来回看词条；快速往上一划（超过 FAST）才平滑滑回。
     回到页首附近时总是完整显示。位置和动画在 css/dict.css 末尾。 */
  const narrow = window.matchMedia('(max-width: 760px)');
  const FAST = 0.8;          // 往上滑的速度超过每毫秒 0.8 像素（约每秒 800 像素）才算快
  let hide = 0, top = 0, lastY = 0, down = 0, trail = [], animTimer = 0, frame = 0;
  const rootStyle = document.documentElement.style;
  function apply() { frame = 0; rootStyle.setProperty('--hide', hide + 'px'); }
  // ms：动画时长（毫秒），不给就用 300
  function setHide(px, animate, ms) {
    px = Math.max(0, Math.min(px, top));
    if (px === hide) return;
    hide = px;
    clearTimeout(animTimer);
    rootStyle.setProperty('--hide-ms', (ms || 300) + 'ms');
    document.body.classList.toggle('dx-anim', !!animate);
    if (animate) animTimer = setTimeout(() => document.body.classList.remove('dx-anim'), (ms || 300) + 20);
    if (!frame) frame = requestAnimationFrame(apply);
  }
  function setCollapsed(on) { setHide(on ? top : 0, true); }
  // 量出页头、当前词典顶栏、原文栏的高度，供吸顶和收起的位置用
  function measure() {
    const panel = document.querySelector('.dx-panel:not([hidden])');
    const h = sel => { const el = panel && panel.querySelector(sel); return el ? el.offsetHeight : 0; };
    const sh = document.querySelector('.site-head').offsetHeight, dh = h('.dx-head'), sp = h('.dx-spine');
    rootStyle.setProperty('--sh', sh + 'px');
    rootStyle.setProperty('--dh', dh + 'px');
    rootStyle.setProperty('--sp', sp + 'px');
    top = sh + dh + sp;
    if (hide > top) setHide(top);
  }
  let ro = null;
  function watchScroll() {
    if (window.ResizeObserver) ro = new ResizeObserver(() => measure());
    window.addEventListener('scroll', () => {
      if (!document.body.classList.contains('in-dict')) return;
      if (!narrow.matches) return setHide(0);
      const y = Math.max(0, window.scrollY), now = performance.now(), d = y - lastY;
      lastY = y;
      // 记下最近的位置，用来算速度（每毫秒多少像素，往下为正）
      trail.push([now, y]);
      while (trail.length && now - trail[0][0] > 150) trail.shift();
      // 速度只按最近 150 毫秒内的位置算；刚开始滑、只有一个点时还不知道速度（null）
      const v = trail.length >= 2 ? (y - trail[0][1]) / Math.max(1, now - trail[0][0]) : null;
      if (d > 0) {
        down += d;
        // 往下：上方内容已整个滚过去、且同一方向滑过 30 像素，一次收完；滑得越快动画越短。
        // 还不知道速度时先等下一帧（约 16 毫秒），除非一下就滑了很远
        if (hide === 0 && y >= top && down > 30 && (v !== null || down > 80))
          setHide(top, true, v === null ? 200 : Math.round(Math.max(120, Math.min(280, 300 - 90 * v))));
      } else if (d < 0) {
        down = 0;
        if (hide > 0 && v !== null && v < -FAST) setHide(0, true);   // 快速往上：滑回
      }
      // 回到页首附近时完整显示，否则结果上面会空出一块
      if (hide > 0 && y < top) setHide(0, true);
    }, { passive: true });
    narrow.addEventListener('change', () => { setHide(0); measure(); });
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
      // #dict-manhan?q=bithe：打开这部词典并查 bithe（编辑器逐词释义里的“词典”链接）
      let q = null;
      const m = /^([^?]*)\?q=(.*)$/.exec(id || '');
      if (m) { id = m[1]; try { q = decodeURIComponent(m[2]); } catch (e) { q = m[2]; } }
      if (!cfgOf(id)) id = lastId();
      SIYI.store.set('dict-last', id);
      app(id);
      SIYI.dictConfigs.forEach(c => { $('dx-' + c.id).hidden = c.id !== id; });
      $('dict-h1').textContent = cfgOf(id).title;
      setCollapsed(false);
      headH(); measure();
      apps[id].show();
      if (q) apps[id].query(q);
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
