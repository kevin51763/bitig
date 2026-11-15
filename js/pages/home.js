/* 首页：标题和“试一试”、名句条、查词、各语言的编辑器入口、新近文章，最底下一行是开发中的编辑器。文字来自 config/ 和 content/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  let built = false;
  const BOOK = '<svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true"><path d="M2.5 3.2c1.9-.6 3.8-.4 5.5.8 1.7-1.2 3.6-1.4 5.5-.8v9.3c-1.9-.6-3.8-.4-5.5.8-1.7-1.2-3.6-1.4-5.5-.8zM8 4v9.3" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';

  /* “试一试”：选一种文字，输入转写，右边随即写出原文；按回车或点“查词典”，到那种文字的词典里查这个词。
     新来的人不用读说明，试一下就知道这个网站是做什么的。
     每种文字一行：语言简写 → [查词用哪部词典, 那部词典的输入方式, 空着时显示的例词]。
     只列出 config/languages.js 里有、且有转换规则（js/converters/）的文字 */
  const TRY = { mnc: ['manhan', 'mnc', 'abka'], mn: ['menghan', 'mn', 'bičig'], bo: ['tibetan', 'bo', 'bkra shis'] };
  function buildTry() {
    const langs = SIYI.languages.filter(l => TRY[l.id] && SIYI.converters[l.id] && !l.hidden && !l.wip);
    $('home-try').hidden = $('home-try-script').hidden = !langs.length;
    if (!langs.length) return;
    let cur = langs.find(l => l.id === SIYI.store.get('home-try-lang')) || langs[0];
    const qEl = $('home-try-q'), out = $('home-try-script');
    const script = t => { try { return SIYI.converters[cur.id].toScript(t); } catch (e) { return ''; } };
    function draw() {
      const q = qEl.value.trim(), eg = TRY[cur.id][2];
      const cjk = /[\u3400-\u9fff]/.test(q);   // 输入的是汉字：不转写，按回车在释义里反查
      out.className = 'hero-script' + SIYI.vertClass(cur, 'v') + (q && !cjk ? '' : ' eg');
      out.style.fontFamily = cur.font || '';
      out.dir = cur.dir || 'ltr'; out.lang = cur.id;
      out.textContent = script(q && !cjk ? q : eg);   // 空着时写出例词，颜色淡一些
    }
    function pick(l) {
      cur = l; SIYI.store.set('home-try-lang', l.id);
      $('home-try-langs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === l.id)));
      qEl.placeholder = `输入${l.name}转写，如 ${TRY[l.id][2]}；也可输入汉字`;
      $('home-try-note').innerHTML = `整段文字的转写在<a href="${esc(SIYI.href('tool-' + l.id))}">${esc(l.name)}对照转写</a>里做。`;
      draw();
    }
    $('home-try-langs').innerHTML = langs.map(l => `<button type="button" class="btn" data-v="${esc(l.id)}">${esc(l.short || l.name)}</button>`).join('');
    $('home-try-langs').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) { pick(langs.find(l => l.id === b.dataset.v)); qEl.focus(); }
    });
    qEl.addEventListener('input', draw);
    $('home-try').addEventListener('submit', e => {
      e.preventDefault();
      const q = qEl.value.trim() || TRY[cur.id][2];   // 空着就查例词
      SIYI.pages.dict.open(TRY[cur.id][0], q, TRY[cur.id][1]);
    });
    pick(cur);
  }

  function build() {
    const site = SIYI.config.site, D = SIYI.dictionaries;
    $('home-lead').textContent = site.lead || '';
    $('home-lead').hidden = !site.lead;
    $('home-origin').textContent = site.origin || '';
    $('home-origin').hidden = !site.origin;
    buildTry();

    const list = D.list || [];
    $('home-dicts').hidden = !list.length && !D.intro;
    $('home-dict-intro').textContent = D.intro || '';
    $('home-dict-intro').hidden = !D.intro;
    // 词典卡片和下面“对照转写”的卡片同一个样子：左边是该词典所收文字的示例字（config/dictionaries.js 的 glyph），
    // 字体、竖排照那种语言的设置；没写 glyph 的用书本图标
    const glyphHtml = d => !(d.glyph && d.glyph.length) ? BOOK : d.glyph.map(([text, id]) => {
      const l = SIYI.lang(id) || {};
      return `<span class="g${SIYI.vertClass(l, 'v')}" style="font-family:${esc(l.font || 'inherit')}" dir="${l.dir || 'ltr'}">${esc(text)}</span>`;
    }).join('');
    $('home-dict-links').innerHTML = list.map(d => {
      const out = SIYI.isExternal(d.url);
      return `<a class="tool-card" href="${esc(SIYI.link(d.url))}"${out ? ' target="_blank" rel="noopener"' : ''}>
        <span class="glyph dglyph${d.glyph && d.glyph.length > 1 ? ' pair' : ''}">${glyphHtml(d)}</span><b>${esc(d.name)}${out ? ' ↗' : ''}</b></a>`;
    }).join('');

    const card = l => {
      const c = l.card || {};
      return `<a class="tool-card" href="${esc(SIYI.href('tool-' + l.id))}">
        <span class="glyph${SIYI.vertClass(l, 'v')}" style="font-family:${esc(l.font || 'inherit')}" dir="${l.dir || 'ltr'}">${esc(c.glyph || '')}</span>
        <b>${esc(l.name)}</b></a>`;
    };
    const tools = SIYI.languages.filter(l => l.editor && !l.hidden);
    const ready = tools.filter(l => !l.wip), wip = tools.filter(l => l.wip);
    $('home-tools-sec').hidden = !ready.length;
    $('home-tools').innerHTML = ready.map(card).join('');
    // 最底下的“开发中”：config/languages.js 里写了 wip 的编辑器，只列一行小字
    $('home-wip-sec').hidden = !wip.length;
    $('home-wip-sec').innerHTML = '开发中，结果可能不准确：' + wip.map(l => `<a href="${esc(SIYI.href('tool-' + l.id))}">${esc(l.name)}</a>`).join('、');

    $('say-next').addEventListener('click', SIYI.pages.sayings.next);
    SIYI.pages.sayings.next();
  }

  function render() {
    if (!built) { built = true; build(); }
    const n = SIYI.config.site.recentTexts || 6;
    const items = SIYI.texts.slice(-n).reverse();
    $('home-texts').innerHTML = items.length
      ? SIYI.pages.texts.listHtml(items) + (SIYI.texts.length > items.length ? `<p class="small"><a href="${esc(SIYI.href('texts'))}">查看全部 ${SIYI.texts.length} 篇 →</a></p>` : '')
      : '<div class="empty-box">还没有文章。</div>';
  }

  SIYI.pages.home = { render };
})();
