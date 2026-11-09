/* 通用的两栏编辑器：左边原文，右边拉丁转写，互相转换，点词对应高亮。
   满文、蒙古文、藏文、察合台文都用它；转换规则各在 js/converters/ 下的文件里，
   名字、字体、书写方向在 config/languages.js 里。 */
(function () {
  const MARKUP = `
  <header class="top">
    <div><h1 id="mm-title">对照转写</h1><p class="tool-dicts" id="mm-dicts" hidden></p></div>
    <div class="toolbar">
      <button class="btn" id="mm-sample" type="button">载入示例</button>
      <button class="btn" id="mm-clear" type="button">全部清空</button>
    </div>
  </header>
  <p class="wip-note" id="mm-wip" role="note" hidden></p>
  <div class="mm-ctl">
    <span class="g" id="mm-scheme-g">拉丁转写
      <span class="seg" id="mm-scheme"><button type="button" data-v="sch" aria-pressed="true">穆麟德夫</button><button type="button" data-v="simple" aria-pressed="false">简便</button></span></span>
    <span class="g" id="mm-orient-g"><span id="mm-orient-lab">原文</span>
      <span class="seg" id="mm-orient"><button type="button" data-v="vert" aria-pressed="true">竖排</button><button type="button" data-v="horiz" aria-pressed="false">横排</button></span></span>
    <label class="g">字号 <input type="range" id="mm-zoom" min="70" max="170" value="100"></label>
  </div>
  <div class="mm-grid">
    <div class="mm-col">
      <div class="mm-col-head"><h2 id="mm-hm">原文</h2><span class="sub">可直接输入或粘贴</span><button class="btn" type="button" data-mmcopy="m">复制</button></div>
      <div class="mm-pane m vert" id="mm-paneM"><div class="mm-bd"><div class="mm-bd-in"></div></div><textarea id="mm-taM" spellcheck="false" aria-label="原文"></textarea></div>
    </div>
    <div class="mm-col" id="mm-colL">
      <div class="mm-col-head"><h2>拉丁转写</h2><span class="sub" id="mm-latsub"></span><button class="btn" type="button" data-mmcopy="l">复制</button></div>
      <div class="mm-pane l" id="mm-paneL"><div class="mm-bd"><div class="mm-bd-in"></div></div><textarea id="mm-taL" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="拉丁转写"></textarea></div>
      <!-- 逐词释义：config/languages.js 里写了 gloss 的语言才显示，程序在 js/editors/gloss.js -->
      <div class="mm-col-head gl-head" id="gl-head" hidden><h2>逐词释义</h2><span class="sub">取自<span id="gl-src"></span>；词尾按规则切分，仅供参考。点方块可在两栏中标出该词</span></div>
      <div class="gl-box" id="gl-box" hidden aria-live="polite"></div>
    </div>
  </div>
  <div class="mm-bar" aria-live="polite"><span id="mm-msg"></span></div>

`;
  document.getElementById('v-mm').innerHTML = MARKUP;
  const CONV = SIYI.converters;
  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  let NAME = '', L = null, langKey = null, ta, pane, scheme = 'sch', align = [], active = null, started = false, gloss = null;
  const other = s => s === 'm' ? 'l' : 'm';

  function segment(text, side) {
    const re = L.WORD[side], segs = []; let i = 0;
    while (i < text.length) {
      const w = re.test(text[i]); let j = i + 1;
      while (j < text.length && re.test(text[j]) === w) j++;
      segs.push({ s: i, e: j, word: w, text: text.slice(i, j) }); i = j;
    }
    return segs;
  }
  function sync(from) {
    const to = other(from), segs = segment(ta[from].value, from);
    let out = ''; align = [];
    for (const g of segs) {
      const conv = from === 'm' ? L.toLatin(g.text, scheme) : L.toScript(g.text);
      const a = { word: g.word }; a[from] = [g.s, g.e]; a[to] = [out.length, out.length + conv.length];
      align.push(a); out += conv;
    }
    const t = ta[to], sl = t.scrollLeft, st = t.scrollTop;
    t.value = out; t.scrollLeft = sl; t.scrollTop = st;
    saveDraft();
    if (gloss) gloss.update(ta.l.value);
  }
  let draftT = null;
  function saveDraft() { clearTimeout(draftT); const k = langKey, v = ta.l.value; draftT = setTimeout(() => store.set('mm-draft-' + k, v), 400); }

  function paintSide(side, idx, cls) {
    const text = ta[side].value, bd = pane[side].querySelector('.mm-bd-in');
    const ranges = idx.map(i => align[i] && align[i][side]).filter(r => r && r[1] > r[0]).sort((a, b) => a[0] - b[0]);
    let html = '', p = 0;
    for (const [s, e] of ranges) { html += esc(text.slice(p, s)) + `<mark class="${cls}">` + esc(text.slice(s, e)) + '</mark>'; p = e; }
    html += esc(text.slice(p));
    if (text.endsWith('\n') || text === '') html += ' ';
    bd.innerHTML = html;
  }
  function wordsIn(side, s, e) {
    const hits = [];
    align.forEach((a, i) => {
      if (!a.word) return; const [as, ae] = a[side];
      if (s === e ? (as <= s && s <= ae) : (as < e && ae > s)) hits.push(i);
    });
    return hits;
  }
  function highlight(side) {
    const t = ta[side], idx = wordsIn(side, t.selectionStart, t.selectionEnd);
    active = { side, idx };
    paintSide(side, idx, 'src'); paintSide(other(side), idx, 'dst');
    syncScroll('m'); syncScroll('l');
    if (idx.length) reveal(other(side));
    if (gloss) {
      if (side === 'l') gloss.mark(t.selectionStart, t.selectionEnd);
      else if (idx.length) gloss.mark(Math.min(...idx.map(i => align[i].l[0])), Math.max(...idx.map(i => align[i].l[1])));
      else gloss.mark(-1, -1);
    }
  }
  // 点了逐词释义里的方块：在两栏里标出拉丁转写 s..e 这一段
  function pickLatin(s, e) {
    const idx = wordsIn('l', s, e);
    active = { side: 'l', idx };
    paintSide('l', idx, 'src'); paintSide('m', idx, 'dst');
    syncScroll('m'); syncScroll('l');
    reveal('l'); reveal('m');
    gloss.mark(s, e);
  }
  function repaint() {
    if (active) { paintSide(active.side, active.idx, 'src'); paintSide(other(active.side), active.idx, 'dst'); }
    else { paintSide('m', [], ''); paintSide('l', [], ''); }
    syncScroll('m'); syncScroll('l');
  }
  function reveal(side) {
    const mk = pane[side].querySelector('mark'), t = ta[side]; if (!mk) return;
    const vert = side === 'm' && pane.m.classList.contains('vert');
    if (vert) {
      const x = mk.offsetLeft, w = mk.offsetWidth;
      if (x < t.scrollLeft || x + w > t.scrollLeft + t.clientWidth) t.scrollLeft = Math.max(0, x - t.clientWidth / 3);
    } else {
      const y = mk.offsetTop, h = mk.offsetHeight;
      if (y < t.scrollTop || y + h > t.scrollTop + t.clientHeight) t.scrollTop = Math.max(0, y - t.clientHeight / 3);
    }
    syncScroll(side);
  }
  function fit(side) {
    const t = ta[side], bd = pane[side].querySelector('.mm-bd');
    bd.style.width = t.clientWidth + 'px'; bd.style.height = t.clientHeight + 'px';
  }
  function syncScroll(side) { const bd = pane[side].querySelector('.mm-bd'); bd.scrollLeft = ta[side].scrollLeft; bd.scrollTop = ta[side].scrollTop; }
  function pressSeg(id, v) { document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
  function loadText(latin) {
    ta.l.value = latin; sync('l'); ta.m.scrollLeft = 0; ta.l.scrollTop = 0; active = null; fit('m'); fit('l'); repaint();
  }

  function init() {
    ta = { m: $('mm-taM'), l: $('mm-taL') };
    gloss = SIYI.Gloss ? SIYI.Gloss($('gl-box'), { pick: pickLatin }) : null;
    pane = { m: $('mm-paneM'), l: $('mm-paneL') };
    const ro = new ResizeObserver(() => { if (!L) return; fit('m'); fit('l'); syncScroll('m'); syncScroll('l'); });
    ro.observe(ta.m); ro.observe(ta.l);
    for (const side of ['m', 'l']) {
      const t = ta[side];
      t.addEventListener('input', () => { sync(side); fit('m'); fit('l'); highlight(side); });
      t.addEventListener('scroll', () => syncScroll(side));
      ['select', 'keyup', 'mouseup', 'focus'].forEach(ev => t.addEventListener(ev, () => highlight(side)));
    }
    document.addEventListener('selectionchange', () => {
      const a = document.activeElement; if (a === ta.m) highlight('m'); else if (a === ta.l) highlight('l');
    });
    document.querySelectorAll('#mm-scheme button').forEach(b => b.addEventListener('click', () => {
      scheme = b.dataset.v; pressSeg('mm-scheme', scheme); sync('m'); fit('l');
      if (active) active.side === 'm' ? highlight('m') : (active = { side: 'm', idx: active.idx }, repaint()); else repaint();
    }));
    document.querySelectorAll('#mm-orient button').forEach(b => b.addEventListener('click', () => {
      pressSeg('mm-orient', b.dataset.v); pane.m.classList.toggle('vert', b.dataset.v === 'vert');
      ta.m.scrollLeft = 0; ta.m.scrollTop = 0; fit('m'); repaint();
    }));
    $('mm-zoom').addEventListener('input', e => {
      const z = e.target.value / 100;
      document.documentElement.style.setProperty('--mm-ms', (34 * z) + 'px');
      document.documentElement.style.setProperty('--mm-ls', (21 * z) + 'px');
      fit('m'); fit('l'); repaint();
    });
    $('mm-sample').addEventListener('click', () => L.UI.sampleScript ? loadScript(L.UI.sampleScript) : loadText(L.UI.sample));
    $('mm-clear').addEventListener('click', () => { ta.m.value = ''; ta.l.value = ''; align = []; active = null; repaint(); saveDraft(); if (gloss) gloss.update(''); ta.m.focus(); });
    const msg = $('mm-msg');
    document.querySelectorAll('[data-mmcopy]').forEach(b => b.addEventListener('click', async () => {
      const t = ta[b.dataset.mmcopy].value; if (!t.trim()) { msg.textContent = '这一栏还是空的。'; return; }
      let ok = false;
      try { await navigator.clipboard.writeText(t); ok = true; } catch (e) { ta[b.dataset.mmcopy].select(); }
      msg.textContent = ok ? (b.dataset.mmcopy === 'm' ? NAME + '已复制。' : '拉丁转写已复制。') : '已选中，请按 Ctrl+C 或 ⌘C 复制。';
      setTimeout(() => msg.textContent = '', 2200);
    }));
    if (window.innerWidth < 600) { $('mm-zoom').value = 85; $('mm-zoom').dispatchEvent(new Event('input')); }
    if (document.fonts) document.fonts.ready.then(() => { if (L) { fit('m'); fit('l'); repaint(); } });
  }

  function show(key) {
    if (!started) { started = true; init(); }
    if (key === langKey) { requestAnimationFrame(() => { fit('m'); fit('l'); repaint(); }); return; }
    if (L) { clearTimeout(draftT); store.set('mm-draft-' + langKey, ta.l.value); }
    langKey = key; L = CONV[key];
    const u = L.UI, lg = SIYI.lang(key) || {};
    NAME = lg.name || key;
    $('mm-title').textContent = NAME + '对照转写';
    $('mm-hm').textContent = NAME;
    $('mm-orient-lab').textContent = NAME;
    $('mm-latsub').textContent = u.latinSub || '';
    SIYI.dictLine($('mm-dicts'), key);
    SIYI.wipLine($('mm-wip'), key);
    // 逐词释义：右栏分成上下两半（config/languages.js 的 gloss）
    const g = gloss && lg.gloss ? (SIYI.dictConfigs || []).find(c => c.id === lg.gloss) : null;
    const has = !!g && gloss.setLang(key, lg.gloss, L.WORD.l);
    if (gloss && !has) gloss.setLang(null, null, null);
    if (lg.gloss && !g) SIYI.problem('config/languages.js 里' + NAME + '的 gloss 写的是“' + lg.gloss + '”，没有这部词典。可用的有：' + (SIYI.dictConfigs || []).map(c => c.id).join('、') + '。');
    $('gl-head').hidden = $('gl-box').hidden = !has;
    $('mm-colL').classList.toggle('split', has);
    if (has) $('gl-src').textContent = g.title;
    if (u.schemes) document.querySelectorAll('#mm-scheme button').forEach((b, i) => { b.textContent = u.schemes[i]; });
    ta.m.setAttribute('lang', u.lang || key); ta.m.setAttribute('aria-label', NAME);
    scheme = 'sch'; pressSeg('mm-scheme', 'sch');
    $('mm-scheme-g').hidden = !u.schemes;
    $('mm-orient-g').hidden = !lg.vertical;
    pane.m.style.fontFamily = lg.font || '';
    document.documentElement.style.setProperty('--mm-font', lg.font || 'inherit');
    pane.m.style.setProperty('--mm-scale', lg.scale || 1);
    pane.m.style.lineHeight = lg.lineHeight || '';
    pane.m.classList.toggle('vert', !!lg.vertical); pressSeg('mm-orient', 'vert');
    ta.m.dir = lg.dir || 'ltr'; pane.m.querySelector('.mm-bd-in').dir = lg.dir || 'ltr';
    ta.m.scrollLeft = 0; ta.m.scrollTop = 0;
    const draft = store.get('mm-draft-' + key);
    requestAnimationFrame(() => {
      if (draft !== null && draft.trim()) loadText(draft);
      else if (u.sampleScript) loadScript(u.sampleScript);
      else loadText(u.sample || '');
    });
  }
  function loadScript(s) {
    ta.m.value = s; sync('m'); ta.m.scrollLeft = 0; ta.l.scrollTop = 0; active = null; fit('m'); fit('l'); repaint();
  }


  SIYI.twoPane = { show };
})();
