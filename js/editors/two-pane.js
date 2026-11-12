/* 通用的两栏编辑器：左边原文，右边拉丁转写，互相转换，点词对应高亮。
   鼠标停在词上，浮窗显示简短释义；双击一个词，到词典里查它（满文、蒙古文、藏文，见 js/gloss.js）。
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
    <div class="mm-col">
      <div class="mm-col-head"><h2>拉丁转写</h2><span class="sub" id="mm-latsub"></span><button class="btn" type="button" data-mmcopy="l">复制</button></div>
      <div class="mm-pane l" id="mm-paneL"><div class="mm-bd"><div class="mm-bd-in"></div></div><textarea id="mm-taL" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="拉丁转写"></textarea></div>
    </div>
  </div>
  <div class="mm-bar" aria-live="polite"><span id="mm-msg"></span></div>

`;
  const $ = SIYI.$, esc = SIYI.esc, store = SIYI.store;
  $('v-mm').innerHTML = MARKUP;
  const CONV = SIYI.converters;
  /* m 指原文一栏，l 指拉丁转写一栏。
     L 是当前语言的转换规则，align 记着两栏里每个词的位置，用来点词对应高亮 */
  let NAME = '', L = null, langKey = null, ta, pane, scheme = 'sch', align = [], active = null, started = false;
  const other = s => s === 'm' ? 'l' : 'm';

  /* 把文字切成“词”和“词之间的空白标点”两种片段 */
  function segment(text, side) {
    const re = L.WORD[side], segs = []; let i = 0;
    while (i < text.length) {
      const w = re.test(text[i]); let j = i + 1;
      while (j < text.length && re.test(text[j]) === w) j++;
      segs.push({ s: i, e: j, word: w, text: text.slice(i, j) }); i = j;
    }
    return segs;
  }
  /* 一栏改了，重新生成另一栏 */
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

  /* 高亮画在输入框后面一层同样排版的文字上（.mm-bd），字本身透明，只露出底色。
     这一层里每个词都包着一个 <span data-i="第几个">（高亮的是 <mark>），鼠标悬停时靠它判断指着哪个词 */
  function paintSide(side, idx, cls) {
    const text = ta[side].value, bd = pane[side].querySelector('.mm-bd-in'), on = new Set(idx);
    let html = '', p = 0;
    align.forEach((a, i) => {
      const r = a[side];
      if (!a.word || !r || r[1] <= r[0] || r[0] < p) return;
      const tag = on.has(i) ? 'mark' : 'span';
      html += esc(text.slice(p, r[0])) + `<${tag} data-i="${i}"${on.has(i) ? ` class="${cls}"` : ''}>` + esc(text.slice(r[0], r[1])) + `</${tag}>`;
      p = r[1];
    });
    html += esc(text.slice(p));
    if (text.endsWith('\n') || text === '') html += ' ';
    bd.innerHTML = html;
    rects[side] = null;
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
    rects[side] = null;
  }
  function syncScroll(side) { const bd = pane[side].querySelector('.mm-bd'); bd.scrollLeft = ta[side].scrollLeft; bd.scrollTop = ta[side].scrollTop; rects[side] = null; }

  /* ---------- 悬停释义 ----------
     鼠标停在词上约 0.15 秒，浮窗显示释义（js/gloss.js 查出）；移开就消失。
     触屏没有悬停：点一下词，浮窗出现在词旁边，里面有“查词典”的链接。 */
  const rects = { m: null, l: null };   // 两栏里每个词在屏幕上的位置，文字或滚动一变就作废重量
  let tip = null, tipTimer = 0, tipFor = null, tipSeq = 0, lastHit = null;
  const canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
  const glossOn = () => !!(SIYI.gloss && SIYI.gloss.has(langKey));
  function wordRects(side) {
    if (!rects[side]) {
      rects[side] = [];
      pane[side].querySelectorAll('.mm-bd-in [data-i]').forEach(el => {
        for (const r of el.getClientRects()) rects[side].push({ i: +el.dataset.i, l: r.left, t: r.top, r: r.right, b: r.bottom });
      });
    }
    return rects[side];
  }
  function wordAt(side, x, y) {
    for (const r of wordRects(side)) if (x >= r.l && x <= r.r && y >= r.t && y <= r.b) return r;
    return null;
  }
  /* 第 i 个词的标准拉丁转写。右栏用的是“简便”写法时，从原文重新转一遍 */
  function latinOf(i) {
    const a = align[i];
    return scheme === 'sch' ? ta.l.value.slice(a.l[0], a.l[1]) : L.toLatin(ta.m.value.slice(a.m[0], a.m[1]), 'sch');
  }
  /* 第 i 个词前后连在一起的一串词（中间只隔空格，没有标点和换行），供查词组用 */
  function runAround(i) {
    const C = SIYI.gloss.config(langKey), words = [C.norm(latinOf(i))];
    const sep = k => align[k] && !align[k].word && C.joiner.test(ta.l.value.slice(align[k].l[0], align[k].l[1]));
    let at = 0, k = i;
    while (words.length < C.max * 2 && sep(k - 1) && align[k - 2] && align[k - 2].word) { k -= 2; words.unshift(C.norm(latinOf(k))); at++; }
    k = i;
    while (words.length < C.max * 2 && sep(k + 1) && align[k + 2] && align[k + 2].word) { k += 2; words.push(C.norm(latinOf(k))); }
    return { words, at };
  }
  function hideTip() { clearTimeout(tipTimer); tipFor = null; tipSeq++; if (tip) tip.hidden = true; }
  // box 是词在屏幕上的位置；at 是鼠标的位置（竖排的词很长，浮窗跟着鼠标的高度放在词的右边）
  function showTip(i, box, at) {
    if (!glossOn() || !align[i] || !align[i].word) return hideTip();
    if (tipFor === i && tip && !tip.hidden) return;
    tipFor = i;
    const seq = ++tipSeq, run = runAround(i), surface = run.words[run.at], lang = langKey;
    SIYI.gloss.lookup(lang, run.words, run.at).then(res => {
      if (seq !== tipSeq) return;   // 鼠标已经移到别处
      lastHit = { i, lang, head: res.word && res.word.text ? res.word.head : surface };
      const row = (r, cls) => `<div class="mm-tip-row ${cls}"><b>${esc(r.head)}</b>${r.text ? `<span>${esc(r.text)}</span>` : ''}` +
        (r.note ? `<span class="mm-tip-note">${esc(r.note)}</span>` : '') + '</div>';
      let html = '';
      if (res.phrase) html += row(res.phrase, 'phrase');
      html += res.word && res.word.text ? row(res.word, '')
        : `<div class="mm-tip-row none"><b>${esc(surface)}</b><span>词典里没有查到</span>` +
          (res.word && res.word.note ? `<span class="mm-tip-note">${esc(res.word.note)}</span>` : '') + '</div>';
      html += canHover ? '<div class="mm-tip-foot">双击这个词，到词典里查</div>'
        : '<div class="mm-tip-foot"><button type="button" class="mm-tip-go">到词典里查 ›</button></div>';
      if (!tip) {
        tip = document.createElement('div'); tip.id = 'mm-tip'; tip.className = 'mm-tip'; tip.setAttribute('role', 'tooltip');
        document.body.appendChild(tip);
        tip.addEventListener('click', e => { if (e.target.closest('.mm-tip-go')) openDict(); });
      }
      tip.classList.toggle('touch', !canHover);
      tip.setAttribute('lang', lang === 'bo' ? 'en' : 'zh-CN');
      tip.innerHTML = html; tip.hidden = false;
      const w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
      let x, y;
      if (at && box.b - box.t > (box.r - box.l) * 1.5) {
        // 竖排的词：放在词的右边，右边放不下就放左边
        x = box.r + 10; if (x + w > vw - 8) x = Math.max(8, box.l - w - 10);
        y = Math.min(Math.max(8, at.y - 14), vh - h - 8);
      } else {
        // 横排的词：放在词的下方，下面放不下就放上方
        x = Math.min(Math.max(8, box.l), vw - w - 8); y = box.b + 8;
        if (y + h > vh - 8) y = Math.max(8, box.t - h - 8);
      }
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    });
  }
  /* 双击（或点浮窗里的链接）：到对应的词典里查这个词的原形 */
  function openDict(i) {
    if (!glossOn()) return;
    const C = SIYI.gloss.config(langKey);
    const go = head => { hideTip(); SIYI.pages.dict.open(C.dict, head, C.input); };
    if (i == null || (lastHit && lastHit.i === i && lastHit.lang === langKey)) { if (lastHit) go(lastHit.head); return; }
    const run = runAround(i);
    SIYI.gloss.lookup(langKey, run.words, run.at).then(res => go(res.word && res.word.text ? res.word.head : run.words[run.at]));
  }
  function initGloss() {
    for (const side of ['m', 'l']) {
      const t = ta[side];
      if (canHover) {
        t.addEventListener('mousemove', e => {
          if (!glossOn() || e.buttons) return hideTip();
          const hit = wordAt(side, e.clientX, e.clientY);
          if (!hit) return hideTip();
          if (hit.i === tipFor) return;
          clearTimeout(tipTimer); if (tip) tip.hidden = true; tipFor = null;
          tipTimer = setTimeout(() => showTip(hit.i, hit, { x: e.clientX, y: e.clientY }), 150);
        });
        t.addEventListener('mouseleave', hideTip);
        t.addEventListener('dblclick', e => {
          const hit = wordAt(side, e.clientX, e.clientY);
          if (hit) { e.preventDefault(); openDict(hit.i); }
        });
      } else {
        // 触屏：点一下词，等高亮画好之后，浮窗出现在被点的词旁边
        t.addEventListener('click', () => setTimeout(() => {
          const mk = pane[side].querySelector('.mm-bd-in mark');
          if (!glossOn() || !mk || t.selectionStart !== t.selectionEnd) return hideTip();
          const r = mk.getBoundingClientRect();
          tipFor = null; showTip(+mk.dataset.i, { l: r.left, t: r.top, r: r.right, b: r.bottom });
        }, 60));
      }
      t.addEventListener('input', hideTip);
      t.addEventListener('scroll', hideTip);
    }
    window.addEventListener('scroll', hideTip, { passive: true });
    window.addEventListener('hashchange', hideTip);
  }
  function pressSeg(id, v) { document.querySelectorAll(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
  /* 把一段文字放进某一栏（'l' 拉丁转写，'m' 原文），另一栏随之生成 */
  function load(side, text) {
    ta[side].value = text; sync(side); ta.m.scrollLeft = 0; ta.l.scrollTop = 0; active = null; fit('m'); fit('l'); repaint();
  }
  const loadSample = () => L.UI.sampleScript ? load('m', L.UI.sampleScript) : load('l', L.UI.sample || '');

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
    $('mm-sample').addEventListener('click', loadSample);
    $('mm-clear').addEventListener('click', () => { ta.m.value = ''; ta.l.value = ''; align = []; active = null; repaint(); saveDraft(); ta.m.focus(); });
    const msg = $('mm-msg');
    document.querySelectorAll('[data-mmcopy]').forEach(b => b.addEventListener('click', async () => {
      const t = ta[b.dataset.mmcopy].value; if (!t.trim()) { msg.textContent = '这一栏还是空的。'; return; }
      let ok = false;
      try { await navigator.clipboard.writeText(t); ok = true; } catch (e) { ta[b.dataset.mmcopy].select(); }
      msg.textContent = ok ? (b.dataset.mmcopy === 'm' ? NAME + '已复制。' : '拉丁转写已复制。') : '已选中，请按 Ctrl+C 或 ⌘C 复制。';
      setTimeout(() => msg.textContent = '', 2200);
    }));
    initGloss();
    if (window.innerWidth < 600) { $('mm-zoom').value = 85; $('mm-zoom').dispatchEvent(new Event('input')); }
    if (document.fonts) document.fonts.ready.then(() => { if (L) { fit('m'); fit('l'); repaint(); } });
  }

  /* 入口：由 js/router.js 调用，key 是语言简写。换语言时先存下草稿，再按新语言的设置换界面 */
  function show(key) {
    if (!started) { started = true; init(); }
    if (key === langKey) { requestAnimationFrame(() => { fit('m'); fit('l'); repaint(); }); return; }
    if (L) { clearTimeout(draftT); store.set('mm-draft-' + langKey, ta.l.value); }
    hideTip(); lastHit = null;
    langKey = key; L = CONV[key];
    const u = L.UI, lg = SIYI.lang(key) || {};
    NAME = lg.name || key;
    $('mm-title').textContent = NAME + '对照转写';
    $('mm-hm').textContent = NAME;
    $('mm-orient-lab').textContent = NAME;
    $('mm-latsub').textContent = u.latinSub || '';
    SIYI.dictLine($('mm-dicts'), key);
    SIYI.wipLine($('mm-wip'), key);
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
      if (draft !== null && draft.trim()) load('l', draft);
      else loadSample();
    });
  }

  SIYI.twoPane = { show };
})();
