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
  <div class="mm-ctl">
    <span class="g" id="mm-scheme-g">拉丁写法
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
    <div class="mm-col">
      <div class="mm-col-head"><h2>拉丁转写</h2><span class="sub" id="mm-latsub"></span><button class="btn" type="button" data-mmcopy="l">复制</button></div>
      <div class="mm-pane l" id="mm-paneL"><div class="mm-bd"><div class="mm-bd-in"></div></div><textarea id="mm-taL" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="拉丁转写"></textarea></div>
    </div>
  </div>
  <div class="mm-bar" aria-live="polite"><span id="mm-pair">在任意一侧选中或点进一个词，另一侧会标出对应的词。</span><span id="mm-msg"></span></div>
  <div class="mm-notes" id="mm-notes"></div>
`;
  document.getElementById('v-mm').innerHTML = MARKUP;
  const CONV = SIYI.converters;
  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  let NAME = '', L = null, langKey = null, ta, pane, scheme = 'sch', align = [], active = null, started = false;
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
    showPair(idx);
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
  function showPair(idx) {
    const box = $('mm-pair');
    if (!idx.length) { box.textContent = '在任意一侧选中或点进一个词，另一侧会标出对应的词。'; return; }
    const pick = idx.slice(0, 3).map(i => { const a = align[i]; return [ta.m.value.slice(...a.m), ta.l.value.slice(...a.l)]; });
    box.innerHTML = pick.map(([m, l]) => `<span class="mm-p"><span class="mw">${esc(m)}</span><span class="ar">↔</span><span class="lw">${esc(l)}</span></span>`).join('') + (idx.length > 3 ? `<span>等 ${idx.length} 个词</span>` : '');
  }
  function fit(side) {
    const t = ta[side], bd = pane[side].querySelector('.mm-bd');
    bd.style.width = t.clientWidth + 'px'; bd.style.height = t.clientHeight + 'px';
  }
  function syncScroll(side) { const bd = pane[side].querySelector('.mm-bd'); bd.scrollLeft = ta[side].scrollLeft; bd.scrollTop = ta[side].scrollTop; }
  function pressSeg(id, v) { document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
  function loadText(latin) {
    ta.l.value = latin; sync('l'); ta.m.scrollLeft = 0; ta.l.scrollTop = 0; active = null; fit('m'); fit('l'); repaint(); showPair([]);
  }

  function init() {
    ta = { m: $('mm-taM'), l: $('mm-taL') };
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
    $('mm-clear').addEventListener('click', () => { ta.m.value = ''; ta.l.value = ''; align = []; active = null; repaint(); showPair([]); saveDraft(); ta.m.focus(); });
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
    if (u.schemes) document.querySelectorAll('#mm-scheme button').forEach((b, i) => { b.textContent = u.schemes[i]; });
    ta.m.setAttribute('lang', u.lang || key); ta.m.setAttribute('aria-label', NAME);
    $('mm-notes').innerHTML = (u.notes || []).map(p => `<p>${esc(p)}</p>`).join('');
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
    ta.m.value = s; sync('m'); ta.m.scrollLeft = 0; ta.l.scrollTop = 0; active = null; fit('m'); fit('l'); repaint(); showPair([]);
  }


  SIYI.twoPane = { show };
})();
