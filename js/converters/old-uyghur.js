/* 回鹘文：Unicode 字母表、拉丁换写（依 Pandey 2020 的编码提案）、由换写推断转写的规则。
   由三栏编辑器（js/editors/three-pane.js）使用。 */
(function () {
  const { C, isMark, LAT_WORD, tokenize, words, mapText, editDist, CORPUS_RAW, VOW, isBackTr, cleanTr } = SIYI.turkic;
  /* ============ Old Uyghur ============ */
  const LETTERS = [
    ['aleph', 0x10F70, 'ʾ', 'a', 'ALEPH'], ['beth', 0x10F71, 'β', 'b', 'BETH'],
    ['gimel', 0x10F72, 'γ', 'g', 'GIMEL-HETH'], ['waw', 0x10F73, 'w', 'w', 'WAW'],
    ['zayin', 0x10F74, 'z', 'z', 'ZAYIN'], ['fheth', 0x10F75, 'x', 'x', 'FINAL HETH'],
    ['yodh', 0x10F76, 'y', 'y', 'YODH'], ['kaph', 0x10F77, 'k', 'k', 'KAPH'],
    ['lamedh', 0x10F78, 'δ', 'd', 'LAMEDH'], ['mem', 0x10F79, 'm', 'm', 'MEM'],
    ['nun', 0x10F7A, 'n', 'n', 'NUN'], ['samekh', 0x10F7B, 's', 's', 'SAMEKH'],
    ['pe', 0x10F7C, 'p', 'p', 'PE'], ['sadhe', 0x10F7D, 'c', 'c', 'SADHE'],
    ['resh', 0x10F7E, 'r', 'r', 'RESH'], ['shin', 0x10F7F, 'š', 'S', 'SHIN'],
    ['taw', 0x10F80, 't', 't', 'TAW'], ['lesh', 0x10F81, 'l', 'l', 'LESH']
  ].map(([id, cp, tl, key, name]) => ({ id, cp, ch: C(cp), tl, key, name: 'OLD UYGHUR LETTER ' + name }));
  const MARKS = [
    ['da', 0x10F82, '̇', '1', '上一点', 'COMBINING DOT ABOVE'],
    ['dda', 0x10F84, '̈', '2', '上两点', 'COMBINING TWO DOTS ABOVE'],
    ['db', 0x10F83, '̣', '3', '下一点', 'COMBINING DOT BELOW'],
    ['ddb', 0x10F85, '̤', '4', '下两点', 'COMBINING TWO DOTS BELOW']
  ].map(([id, cp, comb, key, label, name]) => ({ id, cp, ch: C(cp), comb, key, label, name: 'OLD UYGHUR ' + name }));
  const PUNCT = [
    [0x10F86, '|', '|', '一竖', 'PUNCTUATION BAR'], [0x10F87, '‖', '.', '两竖', 'PUNCTUATION TWO BARS'],
    [0x10F88, ':', ':', '两点', 'PUNCTUATION TWO DOTS'], [0x10F89, '⁘', ';', '四点', 'PUNCTUATION FOUR DOTS']
  ].map(([cp, tl, key, label, name]) => ({ cp, ch: C(cp), tl, key, label, name: 'OLD UYGHUR ' + name }));
  const BYID = {}; const UG2ID = new Map();
  LETTERS.forEach(l => { BYID[l.id] = l; UG2ID.set(l.ch, l.id); });
  const MBYID = {}; const MBYCP = new Map(); const MBYCOMB = new Map();
  MARKS.forEach(m => { MBYID[m.id] = m; MBYCP.set(m.ch, m); MBYCOMB.set(m.comb, m); });
  const P_UG2TL = new Map(PUNCT.map(p => [p.ch, p.tl]));
  const P_TL2UG = new Map(PUNCT.map(p => [p.tl, p.ch]));
  const BASE2ID = {
    'ʾ': 'aleph', "'": 'aleph', '’': 'aleph', 'ʼ': 'aleph', 'ʿ': 'aleph',
    'β': 'beth', 'b': 'beth', 'v': 'beth', 'γ': 'gimel', 'ɣ': 'gimel', 'g': 'gimel',
    'w': 'waw', 'z': 'zayin', 'x': 'fheth', 'h': 'fheth', 'y': 'yodh', 'k': 'kaph',
    'δ': 'lamedh', 'd': 'lamedh', 'm': 'mem', 'n': 'nun', 's': 'samekh', 'p': 'pe',
    'c': 'sadhe', 'r': 'resh', 't': 'taw', 'l': 'lesh'
  };
  const SILENT = new Set(['ـ', '‌', '‍']);
  const UG_WORD = /[\p{L}\p{M}\p{N}ـ‌‍]/u;

  function ugWordToTl(word) {
    const a = Array.from(word); let out = '';
    for (let i = 0; i < a.length;) {
      const c = a[i++]; const id = UG2ID.get(c);
      if (id) {
        const ms = []; while (i < a.length && MBYCP.has(a[i])) ms.push(MBYCP.get(a[i++]).id);
        let base = BYID[id].tl;
        if (id === 'gimel' && ms[0] === 'dda') { base = 'q'; ms.shift(); }
        else if (id === 'zayin' && ms[0] === 'ddb') { base = 'ž'; ms.shift(); }
        out += base + ms.map(m => MBYID[m].comb).join('');
      } else if (MBYCP.has(c)) out += MBYCP.get(c).comb;
      else out += c;
    }
    return out.normalize('NFC');
  }
  function parseTl(word) {
    const a = Array.from(word.normalize('NFD').toLowerCase()); const units = [];
    for (let i = 0; i < a.length;) {
      const c = a[i++];
      if (isMark(c)) { units.push({ id: null, orphan: true, raw: c, base: c }); continue; }
      const marks = []; while (i < a.length && isMark(a[i])) marks.push(a[i++]);
      let id = null; const extra = [];
      const ci = marks.indexOf('̌');
      if (ci >= 0 && (c === 's' || c === 'z' || c === 'c')) {
        marks.splice(ci, 1);
        id = c === 's' ? 'shin' : c === 'z' ? 'zayin' : 'sadhe';
        if (c === 'z') extra.push('ddb');
      } else if (c === 'q') { id = 'gimel'; extra.push('dda'); }
      else id = BASE2ID[c] ?? null;
      const ms = [...extra]; const unk = [];
      for (const m of marks) { const mk = MBYCOMB.get(m); mk ? ms.push(mk.id) : unk.push(m); }
      units.push({ id, raw: c + marks.join(''), base: c, marks: ms, unk });
    }
    return units;
  }
  function tlWordToUg(word, unknown) {
    return parseTl(word).map(u => {
      if (u.orphan) { const mk = MBYCOMB.get(u.raw); return mk ? mk.ch : u.raw; }
      if (!u.id) {
        if (unknown && /\p{L}/u.test(u.base) && !SILENT.has(u.base)) unknown.add(u.base);
        return u.raw;
      }
      return BYID[u.id].ch + u.marks.map(m => MBYID[m].ch).join('') + u.unk.join('');
    }).join('');
  }
  const canonUg = tl => ugWordToTl(tlWordToUg(tl));

  function readUg(tl) {
    const u = parseTl(tl); const ids = u.map(x => x.id); const n = ids.length;
    let back;
    if (ids.some(id => id === 'gimel' || id === 'fheth')) back = true;
    else if (ids.includes('kaph')) back = false;
    else if (ids.some((id, i) => id === 'waw' && ids[i + 1] === 'yodh')) back = false;
    else if (ids[0] === 'aleph' && n > 1 && ids[1] && !['aleph', 'yodh', 'waw'].includes(ids[1])) back = false;
    else back = true;
    let out = '', prevV = false, vc = 0;
    const V = s => { out += s; prevV = true; vc++; };
    const K = s => { out += s; prevV = false; };
    for (let i = 0; i < n; i++) {
      const id = ids[i], x = u[i], next = ids[i + 1];
      if (!id) { K(x.raw); continue; }
      switch (id) {
        case 'aleph':
          if (i === 0 && next === 'aleph') { V(back ? 'a' : 'e'); i++; }
          else if (i === 0 && next === 'yodh') { V(back ? 'ï' : 'i'); i++; }
          else if (i === 0 && next === 'waw') {
            if (!back && ids[i + 2] === 'yodh') { V('ü'); i += 2; } else { V(back ? 'u' : 'ü'); i++; }
          } else V(back ? 'a' : 'ä');
          break;
        case 'waw':
          if (!back && next === 'yodh' && vc === 0) { V('ü'); i++; } else V(back ? 'u' : 'ü');
          break;
        case 'yodh': {
          const cons = i === 0 || prevV || next === 'aleph' || next === 'waw';
          cons ? K('y') : V(back ? 'ï' : 'i');
          break;
        }
        case 'gimel': K(x.marks.includes('dda') || i === 0 ? 'q' : 'γ'); break;
        case 'fheth': K('q'); break;
        case 'kaph': {
          const p = ids[i - 1];
          if (i === 0) K('k');
          else if (i === n - 1 && out.endsWith('i')) K('g');
          else if (p === 'lamedh' || p === 'lesh') K('g');
          else K('k');
          break;
        }
        case 'nun': if (next === 'kaph') { K('ŋ'); i++; } else K('n'); break;
        case 'pe': K(i === 0 ? 'b' : 'p'); break;
        case 'beth': K('v'); break;
        case 'lamedh': K('d'); break;
        case 'sadhe': K('č'); break;
        case 'zayin': K(x.marks.length ? 'ž' : 'z'); break;
        case 'shin': K('š'); break;
        case 'samekh': K('s'); break;
        default: K({ mem: 'm', resh: 'r', taw: 't', lesh: 'l' }[id]);
      }
    }
    return out;
  }
  function orthUg(word) {
    const w = cleanTr(word); const back = isBackTr(w);
    const INI = { a: 'ʾʾ', e: 'ʾʾ', ä: 'ʾ', ï: 'ʾy', i: 'ʾy', o: 'ʾw', u: 'ʾw', ö: 'ʾwy', ü: 'ʾwy' };
    const FIRST = { a: 'ʾ', ä: 'ʾ', e: 'ʾ', ï: 'y', i: 'y', o: 'w', u: 'w', ö: 'wy', ü: 'wy' };
    const LATER = { a: 'ʾ', ä: 'ʾ', e: 'ʾ', ï: 'y', i: 'y', o: 'w', u: 'w', ö: 'w', ü: 'w' };
    const CONS = { b: 'p', p: 'p', f: 'p', v: 'β', w: 'β', γ: 'γ', q: 'q', x: 'q', h: 'q', k: 'k', g: back ? 'γ' : 'k',
      t: 't', d: 'δ', δ: 'δ', l: 'l', m: 'm', n: 'n', ŋ: 'nk', ñ: 'ny', ń: 'ny', r: 'r', s: 's', š: 'š', z: 'z', ž: 'ž',
      č: 'c', c: 'c', y: 'y', j: 'y' };
    let out = '', vc = 0;
    Array.from(w).forEach((c, i) => {
      if (INI[c]) { vc++; out += i === 0 ? INI[c] : vc === 1 ? FIRST[c] : LATER[c]; }
      else out += CONS[c] ?? c;
    });
    return out;
  }
  const skelUg = tl => Array.from(canonUg(tl)).filter(c => !'ʾwy'.includes(c) && !isMark(c)).map(c => c === 'x' ? 'q' : c).join('');
  const RAW_LEX_UG = {
    'tnkry': 'tängri', 'tʾnkry': 'tängri', 'kwnkwl': 'köŋül', 'kwynkwl': 'köŋül',
    'yrlγ': 'yarlïγ', 'yʾrlyγ': 'yarlïγ', 'pylyk': 'bilig', 'kʾlmʾδwk': 'kälmädük',
    'wyγwr': 'uyγur', 'ʾwyγwr': 'uyγur',
    'ʾʾrmyš': 'ärmiš', 'ʾrmyš': 'ärmiš', 'ʾʾrty': 'ärti', 'ʾrty': 'ärti', 'ʾʾrδy': 'ärdi', 'ʾrδy': 'ärdi',
    'pwrqʾn': 'burxan', 'pwrxʾn': 'burxan', 'nwm': 'nom', 'qʾγʾn': 'qaγan', 'γʾγʾn': 'qaγan', 'qʾn': 'qan',
    'pʾr': 'bar', 'ywq': 'yoq', 'kwyn': 'kün', 'ʾʾy': 'ay', 'yyl': 'yïl', 'ʾδkw': 'ädgü',
    'twyrk': 'türk', 'twrk': 'türk', 'pwδwn': 'bodun', 'tʾβγʾc': 'tavγač',
    'pyr': 'bir', 'ʾyky': 'iki', 'ʾwyc': 'üč', 'twyrt': 'tört', 'twrt': 'tört', 'pyš': 'beš',
    'ʾʾlty': 'altï', 'yyty': 'yeti', 'skyz': 'säkiz', 'sʾkyz': 'säkiz', 'twqwz': 'toquz', 'ʾwn': 'on',
    'ʾwl': 'ol', 'pw': 'bo', 'mʾn': 'män', 'sʾn': 'sän', 'pyz': 'biz', 'syz': 'siz',
    'swyz': 'söz', 'kyšy': 'kiši', 'yyr': 'yer', 'ʾyl': 'el', 'yytmyš': 'yetmiš', 'ʾʾlp': 'alp'
  };
  const LEX_UG = {}; for (const [k, v] of Object.entries(RAW_LEX_UG)) LEX_UG[canonUg(k)] = v;

  // Orkhon forms prepared for Old Uyghur readings: harmonise -miš / -či the way Old Uyghur editions do.
  function ugForm(w) {
    if (/[aïou]/.test(w) && !/[äöü]/.test(w)) return w.replace(/i/g, 'ï').replace(/mïs$/, 'mïš');
    return w.replace(/mis$/, 'miš');
  }
  let IDX_UG = null;
  function idxUg() {
    if (IDX_UG) return IDX_UG;
    IDX_UG = new Map();
    CORPUS_RAW.forEach((w0, rank) => {
      const w = ugForm(w0); const o = canonUg(orthUg(w)); const key = skelUg(o);
      if (!IDX_UG.has(key)) IDX_UG.set(key, []);
      const list = IDX_UG.get(key);
      if (!list.some(x => x.w === w)) list.push({ w, toks: Array.from(o), rank });
    });
    return IDX_UG;
  }
  function corpusUg(k) {
    const list = idxUg().get(skelUg(k)); if (!list) return null;
    const t = Array.from(k);
    const scored = list.map(c => ({ c, d: editDist(t, c.toks) })).sort((a, b) => a.d - b.d || a.c.rank - b.c.rank);
    if (scored[0].d === 0) return scored[0].c.w;
    const near = scored.filter(s => s.d <= 1);
    if (near.length === 1 && t.length >= 4) return near[0].c.w;
    return null;
  }

  /* 换写一律用大写：β γ δ 写作 B Γ Δ，其余字母直接大写，ʾ 和附加点不变。
     内部规则仍按小写运算，进出编辑器时转换。 */
  const UP_MAP = { 'β': 'B', 'γ': 'Γ', 'δ': 'Δ' };
  const LO_MAP = { 'B': 'β', 'V': 'β', 'Β': 'β', 'Γ': 'γ', 'G': 'γ', 'Δ': 'δ', 'D': 'δ', 'H': 'x' };
  const ugUp = s => Array.from(s).map(c => UP_MAP[c] ?? c.toUpperCase()).join('');
  const ugLo = s => Array.from(s).map(c => LO_MAP[c] ?? c.toLowerCase()).join('');
  const normLo = s => s.replace(/['’ʼʿ]/g, 'ʾ').replace(/[bv]/g, 'β').replace(/[gɣ]/g, 'γ').replace(/d/g, 'δ').replace(/h/g, 'x').replace(/č/g, 'c');
  const infoUg = (tl, user) => {
    const k = canonUg(ugLo(tl));
    if (user && Object.prototype.hasOwnProperty.call(user, k)) return { tr: user[k], src: 'user', key: k };
    if (LEX_UG[k]) return { tr: LEX_UG[k], src: 'lex', key: k };
    const c = corpusUg(k); if (c) return { tr: c, src: 'corpus', key: k };
    return { tr: readUg(k), src: 'rule', key: k };
  };
  SIYI.turkic.MODES.ug = {
    id: 'ug', WORD: UG_WORD,
    toTl: w => ugUp(ugWordToTl(w)),
    fromTl: (w, unk) => tlWordToUg(ugLo(w), unk),
    canon: tl => canonUg(ugLo(tl)),
    skel: tl => skelUg(ugLo(tl)),
    read: k => readUg(ugLo(k)),
    orth: w => ugUp(orthUg(w)),
    up: ugUp,
    sepToTl: s => Array.from(s).map(c => P_UG2TL.get(c) ?? c).join(''),
    sepFromTl: s => Array.from(s).map(c => P_TL2UG.get(c) ?? c).join(''),
    sepTlToTr: s => s, sepTrToTl: s => s,
    normTl: s => ugUp(normLo(ugLo(s))),
    info: infoUg,
    base(k) { return LEX_UG[k] ?? corpusUg(k) ?? readUg(k); }
  };
  Object.assign(SIYI.turkic, { LETTERS, MARKS, PUNCT, BYID, LEX_UG, corpusUg });

})();
