/* 回鹘文、突厥如尼文的三栏编辑器：原文 · 换写 · 转写。
   页面结构在下面的 MARKUP 里，转换规则在 js/converters/old-uyghur.js 和 old-turkic.js。 */
(function () {
  const MARKUP = `
  <header class="top">
    <div>
      <h1 id="tri-h1">回鹘文对照转写</h1>
      <p class="tool-dicts" id="tri-dicts" hidden></p>
    </div>
    <div class="toolbar">
      <button class="btn" id="btn-sample" type="button">载入示例</button>
      <button class="btn" id="btn-clear" type="button">清空</button>
    </div>
  </header>

  <div class="mm-ctl tri-ctl">
    <span class="g" id="tri-orient-g"><span id="tri-orient-lab">回鹘文</span>
      <span class="seg" id="tri-orient"><button type="button" data-v="vert" aria-pressed="true">竖排</button><button type="button" data-v="horiz" aria-pressed="false">横排</button></span></span>
    <label class="g">字号 <input type="range" id="tri-zoom" min="70" max="170" value="100"></label>
  </div>


  <div class="tri-grid">
  <section class="pane" id="pane-sc">
    <div class="pane-head">
      <div>
        <h2><span id="sc-title">回鹘文</span></h2>
      </div>
      <div class="tools">
        <button class="btn" type="button" data-copy="sc">复制</button>
      </div>
    </div>
    <div class="field sc" id="field-sc">
      <div class="backdrop" dir="rtl" aria-hidden="true"><div class="bd-inner" id="bd-sc"></div></div>
      <textarea id="ta-sc" dir="rtl" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="原文"></textarea>
    </div>
  </section>

  <section class="pane" id="pane-tl">
    <div class="pane-head">
      <div>
        <h2>换写</h2>
      </div>
      <div class="tools"><button class="btn" type="button" data-copy="tl">复制</button></div>
    </div>
    <div class="field lat">
      <div class="backdrop" aria-hidden="true"><div class="bd-inner" id="bd-tl"></div></div>
      <textarea id="ta-tl" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="换写"></textarea>
    </div>
    <div class="palette" id="pal-tl"></div>
    <div class="pane-foot" id="foot-tl"></div>
  </section>

  <section class="pane" id="pane-tr">
    <div class="pane-head">
      <div>
        <h2>转写</h2>
      </div>
      <div class="tools"><button class="btn" type="button" data-copy="tr">复制</button></div>
    </div>
    <div class="field lat">
      <div class="backdrop" aria-hidden="true"><div class="bd-inner" id="bd-tr"></div></div>
      <textarea id="ta-tr" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="转写"></textarea>
    </div>
    <div class="palette" id="pal-tr"></div>
  </section>
  </div>

  <details class="box kb-box" id="kb" open>
    <summary>字母键</summary>
    <div class="kb-body">
      <label class="small"><input type="checkbox" id="kb-map" checked> <span id="kb-map-label"></span></label>
      <div class="grp-lbl" id="kb-lbl-1"></div>
      <div class="keys" id="keys-letters"></div>
      <div class="grp-lbl" id="kb-lbl-2"></div>
      <div class="keys" id="keys-extra"></div>
    </div>
  </details>

`;
  document.getElementById('v-tri').innerHTML = MARKUP;
})();

(function () {
  const O = SIYI.turkic;
  const $ = id => document.getElementById(id);
  const TA = { sc: $('ta-sc'), tl: $('ta-tl'), tr: $('ta-tr') };
  const BD = { sc: $('bd-sc'), tl: $('bd-tl'), tr: $('bd-tr') };
  const fieldSc = $('field-sc');
  const PANES = ['sc', 'tl', 'tr'];

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const KEYS = {
    ug: { draft: 'ougr-draft-v1' },
    rn: { draft: 'ougr-draft-rn-v1' }
  };
  const SAMPLES = {
    ug: { text: 'wyγwr tnkry kwnkwl yrlγ\npylyk kʾlmʾδwk\npyr ʾyky ʾwyc twyrt' },
    rn: { text: 't¹b¹γč : b¹ud¹n¹ : s¹b¹i : s¹üčig : γis¹i : y²imšq : r²ms²\nt²ŋr²id²a : b¹ul¹mš : t²ür²kͦ : b²il²ga : qγn¹' }
  };
  const UI = {
    ug: { title: '回鹘文', lang: 'und-Ougr', aria: '回鹘文',
      kbLabel: '在回鹘文栏里，拉丁键直接打出回鹘文字母（a→ʾ，S→š，数字 1–4 打附加点）',
      kb1: '字母（按字母表顺序，左上角是对应的拉丁键）', kb2: '附加点与标点',
      tlPal: ['ʾ', 'B', 'Γ', 'Q', 'X', 'Δ', 'Š', 'Ž', 'C', '̇', '̈', '̣', '̤', '|', '‖', ':', '⁘'],
      trPal: ['ä', 'ï', 'ö', 'ü', 'γ', 'q', 'ŋ', 'ñ', 'č', 'š', 'ž', 'ā', 'ī', 'ū'],
      unk: '元音请用 ʾ、W、Y 表示。' },
    rn: { title: '如尼文', lang: 'und-Orkh', aria: '鄂尔浑如尼文',
      kbLabel: '在如尼文栏里，拉丁键直接打出如尼文字母（b→b¹，B→b²，u→o/u，U→ö/ü，数字打音节字母，: 打隔词号）',
      kb1: '字母（按 Tekin 字母表的顺序，左上角是对应的拉丁键）', kb2: '隔词号',
      tlPal: ['¹', '²', 'γ', 'g', 'q', 'k', 'qͦ', 'kͦ', 'qͥ', 'i͟č', 'n͟č', 'n͟t', 'l͟t', 'a͟š', 'b͟a͟š', 'ŋ', 'ń', 'č', 'š', ':'],
      trPal: ['ä', 'ï', 'ö', 'ü', 'γ', 'q', 'ŋ', 'ń', 'č', 'š', 'ā', 'ī', 'ū'],
      unk: '元音请用 a、i、u、ü 表示，辅音加 ¹ 或 ²。' }
  };

  let mode = store.get('ougr-mode') === 'rn' ? 'rn' : 'ug';
  let M = O.MODES[mode];
  let state = { tlW: [], trW: [] };
  let active = new Set(); let activeFrom = null;
  let kbOn = true;
  const RE = () => ({ sc: M.WORD, tl: O.LAT_WORD, tr: O.LAT_WORD });

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Latin keys typed into the script box
  const KEYMAP = { ug: {}, rn: {} };
  (() => {
    const L = id => O.BYID[id].ch, Mk = id => O.MARKS.find(m => m.id === id).ch;
    Object.assign(KEYMAP.ug, {
      a: L('aleph'), e: L('aleph'), "'": L('aleph'), 'ʾ': L('aleph'),
      b: L('beth'), v: L('beth'), 'β': L('beth'), g: L('gimel'), 'γ': L('gimel'), q: L('gimel') + Mk('dda'),
      w: L('waw'), o: L('waw'), u: L('waw'), z: L('zayin'), Z: L('zayin') + Mk('ddb'), 'ž': L('zayin') + Mk('ddb'),
      x: L('fheth'), h: L('fheth'), y: L('yodh'), i: L('yodh'), k: L('kaph'), d: L('lamedh'), 'δ': L('lamedh'),
      m: L('mem'), n: L('nun'), s: L('samekh'), S: L('shin'), 'š': L('shin'), p: L('pe'), c: L('sadhe'), 'č': L('sadhe'),
      r: L('resh'), t: L('taw'), l: L('lesh'),
      '1': Mk('da'), '2': Mk('dda'), '3': Mk('db'), '4': Mk('ddb'),
      '|': O.PUNCT[0].ch, ',': O.PUNCT[0].ch, '.': O.PUNCT[1].ch, ':': O.PUNCT[2].ch, ';': O.PUNCT[3].ch
    });
    O.RN.forEach(r => { if (r.key) KEYMAP.rn[r.key] = r.ch; });
    Object.assign(KEYMAP.rn, { o: KEYMAP.rn.u, O: KEYMAP.rn.U, Q: KEYMAP.rn.k, K: KEYMAP.rn.k, ':': '⁚' });
  })();

  function rewriteInPlace(t, fn) {
    const v = t.value, nv = fn(v);
    if (nv === v) return;
    const p = fn(v.slice(0, t.selectionEnd)).length;
    t.value = nv; t.setSelectionRange(p, p);
  }
  const mapKeys = s => Array.from(s).map(c => KEYMAP[mode][c] ?? c).join('');
  const trText = tl => O.mapText(tl, O.LAT_WORD, w => M.info(w, null).tr, M.sepTlToTr);
  const scText = (tl, unk) => O.mapText(tl, O.LAT_WORD, w => M.fromTl(w, unk), M.sepFromTl);

  function fromTr() {
    const newW = O.words(TA.tr.value, O.LAT_WORD); const oW = state.trW, oT = state.tlW;
    let p = 0; while (p < newW.length && p < oW.length && newW[p] === oW[p]) p++;
    let s = 0; while (s < newW.length - p && s < oW.length - p && newW[newW.length - 1 - s] === oW[oW.length - 1 - s]) s++;
    const midNew = newW.slice(p, newW.length - s), midOld = oT.slice(p, oT.length - s);
    const same = midNew.length === midOld.length;
    const midTl = midNew.map((w, j) => {
      const o = M.orth(w);
      const t = same && midOld[j] !== undefined && M.skel(o) === M.skel(midOld[j]) ? midOld[j] : o;
      return t;
    });
    const tlW = [...oT.slice(0, p), ...midTl, ...oT.slice(oT.length - s)];
    let k = 0;
    TA.tl.value = O.tokenize(TA.tr.value, O.LAT_WORD).map(t => t.w ? (tlW[k++] ?? '') : M.sepTrToTl(t.t)).join('');
    TA.sc.value = scText(TA.tl.value);
  }

  function sync(src) {
    if (src === 'sc') {
      if (kbOn) rewriteInPlace(TA.sc, mapKeys);
      TA.tl.value = O.mapText(TA.sc.value, M.WORD, M.toTl, M.sepToTl);
      TA.tr.value = trText(TA.tl.value);
    } else if (src === 'tl') {
      rewriteInPlace(TA.tl, M.normTl);
      TA.sc.value = scText(TA.tl.value);
      TA.tr.value = trText(TA.tl.value);
    } else fromTr();
    state.tlW = O.words(TA.tl.value, O.LAT_WORD);
    state.trW = O.words(TA.tr.value, O.LAT_WORD);
    updateUnknown();
    pick(src);
    renderAll(src);
    saveDraft();
  }

  let draftTimer = null;
  function saveDraft() {
    clearTimeout(draftTimer);
    const m = mode, v = TA.tl.value;
    draftTimer = setTimeout(() => store.set(KEYS[m].draft, v), 400);
  }

  // ---------- highlighting ----------
  function indicesAt(text, re, s, e) {
    const out = new Set(); let k = 0;
    for (const t of O.tokenize(text, re)) {
      if (!t.w) continue;
      const hit = s === e ? (t.s <= s && s <= t.e) : (t.s < e && t.e > s);
      if (hit) out.add(k);
      k++;
    }
    return out;
  }
  function pick(pane) {
    const t = TA[pane];
    active = indicesAt(t.value, RE()[pane], t.selectionStart, t.selectionEnd);
    activeFrom = pane;
  }
  function renderPane(p) {
    let k = 0;
    const html = O.tokenize(TA[p].value, RE()[p]).map(t => {
      if (!t.w) return esc(t.t);
      const on = active.has(k++);
      return on ? `<mark class="${p === activeFrom ? 'self' : ''}">${esc(t.t)}</mark>` : esc(t.t);
    }).join('');
    BD[p].innerHTML = html + '\n ';
    follow(p);
  }
  function follow(p) {
    const t = TA[p];
    BD[p].style.transform = `translate(${-t.scrollLeft}px, ${-t.scrollTop}px)`;
  }
  function reveal(p) {
    const t = TA[p], mk = BD[p].querySelector('mark'); if (!mk) return;
    const vertical = p === 'sc' && fieldSc.classList.contains('vertical');
    if (vertical) {
      const a = mk.offsetLeft, b = a + mk.offsetWidth;
      if (a < t.scrollLeft || b > t.scrollLeft + t.clientWidth) t.scrollLeft = Math.max(0, a - t.clientWidth / 3);
    } else {
      const a = mk.offsetTop, b = a + mk.offsetHeight;
      if (a < t.scrollTop || b > t.scrollTop + t.clientHeight) t.scrollTop = Math.max(0, a - t.clientHeight / 3);
    }
    follow(p);
  }
  function renderAll(src) {
    PANES.forEach(renderPane);
    PANES.forEach(p => { if (p !== src) reveal(p); });
  }

  // ---------- unknown characters ----------
  const footTl = $('foot-tl');
  function updateUnknown() {
    const unk = new Set(); scText(TA.tl.value, unk);
    footTl.innerHTML = unk.size
      ? `<span class="warn">这些字母在${UI[mode].title}里没有对应：<b>${[...unk].map(esc).join('、')}</b>。${UI[mode].unk}</span>`
      : '';
    footTl.hidden = !unk.size;
  }

  // ---------- keyboard & palettes ----------
  function insertInto(p, str) {
    const t = TA[p];
    if (document.activeElement !== t && t.dataset.touched !== '1') t.setSelectionRange(t.value.length, t.value.length);
    t.setRangeText(str, t.selectionStart, t.selectionEnd, 'end');
    t.dataset.touched = '1';
    sync(p);
  }
  function backspace(p) {
    const t = TA[p]; let s = t.selectionStart, e = t.selectionEnd;
    if (s === e) {
      if (s === 0) return;
      const c = t.value.charCodeAt(s - 1);
      s -= (c >= 0xDC00 && c <= 0xDFFF && s >= 2) ? 2 : 1;
    }
    t.setRangeText('', s, e, 'end'); sync(p);
  }
  const keyBtn = (ins, g, t, s, kbd, cls = '', gcls = '') =>
    `<button type="button" class="key ${cls}" data-ins="${esc(ins)}" title="${esc(s || t)}">${kbd ? `<kbd>${esc(kbd)}</kbd>` : ''}<span class="g ${gcls}">${esc(g)}</span><span class="t">${esc(t)}</span>${s ? `<span class="s">${esc(s)}</span>` : ''}</button>`;
  const utilKeys = () =>
    `<button type="button" class="key wide" data-ins=" "><span class="s">空格</span></button>` +
    `<button type="button" class="key" data-ins="\n"><span class="s">换行</span></button>` +
    `<button type="button" class="key" data-act="bs" aria-label="删除前一个字符"><span class="t">⌫</span><span class="s">退格</span></button>`;
  function buildKeys() {
    const u = UI[mode];
    $('kb-map-label').textContent = u.kbLabel; $('kb-lbl-1').textContent = u.kb1; $('kb-lbl-2').textContent = u.kb2;
    if (mode === 'ug') {
      $('keys-letters').innerHTML = O.LETTERS.map(l => keyBtn(l.ch, l.ch, O.MODES.ug.up(l.tl), '', l.key === 'S' ? '⇧S' : l.key)).join('');
      $('keys-extra').innerHTML =
        O.MARKS.map(m => keyBtn(m.ch, '◌' + m.ch, '◌' + m.comb, m.label, m.key)).join('') +
        O.PUNCT.map(p => keyBtn(p.ch, p.ch, p.tl, p.label, p.key)).join('') + utilKeys();
    } else {
      const shown = k => !k ? '' : /^[A-Z]$/.test(k) ? '⇧' + k : k;
      $('keys-letters').innerHTML = O.RN.map(r => keyBtn(r.ch, r.ch, r.tl, r.name.includes('YENISEI') ? '叶尼塞' : '', shown(r.key), '', 'rn')).join('');
      $('keys-extra').innerHTML = keyBtn('⁚', '⁚', ':', '隔词号', ':') + utilKeys();
    }
    $('pal-tl').innerHTML = u.tlPal.map(c => `<button type="button" class="pk" data-ins="${esc(c)}" data-to="tl">${/^\p{M}/u.test(c) ? '◌' + c : esc(c)}</button>`).join('');
    $('pal-tr').innerHTML = u.trPal.map(c => `<button type="button" class="pk" data-ins="${esc(c)}" data-to="tr">${esc(c)}</button>`).join('');
  }
  document.addEventListener('mousedown', e => { if (e.target.closest('.key, .pk')) e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('.key, .pk'); if (!b) return;
    const to = b.dataset.to || 'sc';
    if (b.dataset.act === 'bs') backspace(to); else insertInto(to, b.dataset.ins);
  });
  $('kb-map').addEventListener('change', e => { kbOn = e.target.checked; });

  // ---------- orientation (Old Uyghur only; vertical by default) and font size ----------
  const canVert = !!(window.CSS && CSS.supports('writing-mode', 'sideways-lr'));
  function setVert(on) {
    fieldSc.classList.toggle('vertical', on);
    document.querySelectorAll('#tri-orient button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.v === 'vert') === on)));
    TA.sc.scrollTop = 0; TA.sc.scrollLeft = 0;
    renderPane('sc');
  }
  document.querySelectorAll('#tri-orient button').forEach(b => b.addEventListener('click', () => {
    const on = b.dataset.v === 'vert'; store.set('ougr-vert', on ? '1' : '0'); setVert(on);
  }));
  $('tri-zoom').addEventListener('input', e => {
    $('v-tri').style.setProperty('--tri-z', e.target.value / 100);
    PANES.forEach(renderPane);
  });

  // ---------- events ----------
  let composing = false;
  PANES.forEach(p => {
    const t = TA[p];
    t.addEventListener('compositionstart', () => { composing = true; });
    t.addEventListener('compositionend', () => { composing = false; sync(p); });
    t.addEventListener('input', e => { t.dataset.touched = '1'; if (!e.isComposing && !composing) sync(p); });
    t.addEventListener('scroll', () => follow(p));
  });
  TA.tr.addEventListener('blur', () => {
    const v = trText(TA.tl.value);
    if (v !== TA.tr.value) { TA.tr.value = v; state.trW = O.words(v, O.LAT_WORD); renderAll(null); }
  });
  document.addEventListener('selectionchange', () => {
    const el = document.activeElement;
    const p = PANES.find(k => TA[k] === el); if (!p) return;
    const before = [...active].join(',') + activeFrom;
    pick(p);
    if ([...active].join(',') + activeFrom !== before) renderAll(p);
  });
  new ResizeObserver(() => PANES.forEach(follow)).observe(document.body);

  // ---------- copy / toolbar ----------
  const toast = $('toast'); let toastT = null;
  function say(msg) { toast.textContent = msg; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, 1600); }
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const t = TA[b.dataset.copy];
    const fallback = () => { t.focus(); t.select(); say('已选中全部文字，请按 Ctrl+C 或 ⌘C 复制'); };
    try { navigator.clipboard.writeText(t.value).then(() => say('已复制'), fallback); } catch (e) { fallback(); }
  }));
  function load(text, isSample) {
    TA.tl.value = text; active = new Set(); activeFrom = null;
    TA.tl.setSelectionRange(0, 0);
    sync('tl');
    active = new Set(); renderAll(null);
  }
  $('btn-sample').addEventListener('click', () => load(SAMPLES[mode].text, true));
  $('btn-clear').addEventListener('click', () => { load('', false); TA.sc.focus(); });

  // ---------- mode ----------
  function applyMode(m, first) {
    if (!first) { clearTimeout(draftTimer); store.set(KEYS[mode].draft, TA.tl.value); }
    mode = m; M = O.MODES[m]; store.set('ougr-mode', m);
    const u = UI[m];
    $('sc-title').textContent = u.title;
    TA.sc.setAttribute('lang', u.lang); TA.sc.setAttribute('aria-label', u.aria);
    fieldSc.classList.toggle('rn', m === 'rn');
    $('tri-orient-lab').textContent = u.title;
    $('tri-orient-g').hidden = !(canVert && m === 'ug');
    setVert(canVert && m === 'ug' && store.get('ougr-vert') !== '0');
    buildKeys();
    TA.sc.dataset.touched = ''; TA.tl.dataset.touched = ''; TA.tr.dataset.touched = '';
    const draft = store.get(KEYS[m].draft);
    if (draft !== null && draft.trim() !== '') load(draft, false); else load(SAMPLES[m].text, true);
  }
  // ---------- start (driven by the site router) ----------
  let started = false;
  SIYI.threePane = {
    show(m) {
      if (!started) { started = true; applyMode(m, true); }
      else if (m !== mode) applyMode(m);
      requestAnimationFrame(() => PANES.forEach(renderPane));
    }
  };
  if (document.fonts) document.fonts.ready.then(() => { if (started) PANES.forEach(renderPane); });
})();
