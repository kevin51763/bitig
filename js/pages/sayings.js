/* 名句：首页的轮换条和“全部名句”页。句子本身在 content/sayings.js。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const keyOf = q => q.lang + ':' + (q.tr || q.tl || q.sc);

  /* 由一条名句得出要显示的原文、拉丁字母和换写 */
  function forms(q) {
    const lg = SIYI.lang(q.lang) || {};
    try {
      if (lg.editor === 'three-pane' && q.tr && !q.sc) {
        const T = SIYI.turkic, M = T.MODES[q.lang];
        const tl = T.mapText(q.tr, T.LAT_WORD, w => M.orth(w), s => s);
        const sc = T.mapText(tl, T.LAT_WORD, w => M.fromTl(w), s => s.replace(/,/g, ''));
        return { sc, lat: q.tr, small: tl };
      }
      const conv = SIYI.converters[q.lang];
      if (q.sc) return { sc: q.sc, lat: q.tr || q.tl || '', small: conv && q.tr ? conv.toLatin(q.sc, 'sch') : '' };
      if (conv && q.tl) return { sc: conv.toScript(q.tl), lat: q.tl };
    } catch (e) { /* 转换出错时只显示拉丁字母 */ }
    return { sc: '', lat: q.tr || q.tl || '' };
  }
  function block(q) {
    const f = forms(q), lg = SIYI.lang(q.lang) || {};
    const style = `font-family:${lg.font || 'inherit'};--s:${lg.scale || 1}`;
    return `<div class="say-sc${lg.vertical === 'rotated' ? ' rot' : lg.vertical ? ' vert' : ''}" dir="${lg.dir || 'ltr'}" lang="${esc(q.lang)}" style="${esc(style)}">${esc(f.sc)}</div>
      <div class="say-text">
        <span class="say-lang">${esc(SIYI.langName(q.lang))}</span>
        <p class="say-lat">${esc(f.lat)}</p>
        ${f.small ? `<p class="say-small">${esc(f.small)}</p>` : ''}
        <p class="say-zh">${esc(q.zh)}</p>
        ${q.src ? `<p class="say-src">${esc(q.src)}</p>` : ''}
      </div>`;
  }

  /* 轮换：本浏览器记住看过哪些，全部看过一遍才重新开始 */
  let cur = null;
  /* 先选语言，再在这种语言里选句子：相邻两句语言不同，连续三句里语言不重复 */
  function pick() {
    const pool = SIYI.sayings;
    if (!pool.length) return null;
    const load = k => { try { const v = JSON.parse(SIYI.store.get(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
    let seen = load('siyi-say-seen'), recent = load('siyi-say-recent').slice(-2);
    const live = new Set(pool.map(keyOf));
    seen = seen.filter(k => live.has(k));
    let fresh = pool.filter(q => !seen.includes(keyOf(q)));
    if (!fresh.length) { seen = cur ? [keyOf(cur)] : []; fresh = pool.filter(q => !seen.includes(keyOf(q))); if (!fresh.length) fresh = pool; }
    const allowed = q => !recent.includes(q.lang);
    let cand = fresh.filter(allowed), fromBag = true;
    if (!cand.length) { cand = pool.filter(allowed); fromBag = false; }
    if (!cand.length) cand = pool;
    const langs = [...new Set(cand.map(q => q.lang))];
    const lang = langs[Math.floor(Math.random() * langs.length)];
    const list = cand.filter(q => q.lang === lang);
    const q = list[Math.floor(Math.random() * list.length)];
    if (fromBag) seen.push(keyOf(q));
    SIYI.store.set('siyi-say-seen', JSON.stringify(seen));
    SIYI.store.set('siyi-say-recent', JSON.stringify(recent.concat(q.lang).slice(-2)));
    return q;
  }
  function next() {
    cur = pick();
    $('saying').innerHTML = cur ? block(cur) : '';
  }

  /* “全部名句”页 */
  let filter = 'all';
  function renderPage() {
    const list = SIYI.sayings;
    const counts = {}; list.forEach(q => { counts[q.lang] = (counts[q.lang] || 0) + 1; });
    const langs = SIYI.languages.map(l => l.id).filter(k => counts[k]).concat(Object.keys(counts).filter(k => !SIYI.lang(k)));
    $('v-says').innerHTML = `<a class="backlink" href="#home">← 首页</a>
      <div class="sec-head plain"><h1 class="vh">名句</h1><span class="meta">共 ${list.length} 句</span></div>
      <p class="small">首页轮流显示这里的句子。句子写在 content/sayings.js 里。</p>
      <div class="seg say-filter" role="group">${[['all', `全部 ${list.length}`]].concat(langs.map(k => [k, `${SIYI.langName(k)} ${counts[k]}`]))
        .map(([k, t]) => `<button type="button" data-f="${esc(k)}" aria-pressed="${filter === k}">${esc(t)}</button>`).join('')}</div>
      <ul class="slist">${list.filter(q => filter === 'all' || q.lang === filter).map(q => `<li class="say-item"><div class="saying">${block(q)}</div></li>`).join('')}</ul>`;
    $('v-says').querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; renderPage(); }));
  }

  SIYI.checkList(SIYI.sayings, 'content/sayings.js', ['lang', ['tr', 'tl', 'sc'], 'zh']);
  SIYI.pages = SIYI.pages || {};
  SIYI.pages.sayings = { next, renderPage, forms };
})();
