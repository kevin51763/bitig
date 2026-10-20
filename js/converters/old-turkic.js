/* 突厥如尼文（鄂尔浑、叶尼塞）：Unicode 字母表、Tekin 1968 的换写体系、拼写与读音规则。
   由三栏编辑器（js/editors/three-pane.js）使用。 */
(function () {
  const { C, isMark, LAT_WORD, tokenize, words, mapText, editDist, CORPUS_RAW, VOW, isBackTr, cleanTr } = SIYI.turkic;
  /* ============ Old Turkic (Orkhon runic), after Tekin 1968 ============ */
  const SUP1 = '¹', SUP2 = '²', US = '͟';
  const RN = [
    [0x10C00, 'a', 'V', 'a', 'n', 'ORKHON A', 'a'], [0x10C03, 'i', 'V', 'i', 'n', 'ORKHON I', 'i'],
    [0x10C06, 'u', 'V', 'u', 'b', 'ORKHON O', 'u'], [0x10C07, 'ü', 'V', 'ü', 'f', 'ORKHON OE', 'U'],
    [0x10C09, 'b' + SUP1, 'C', 'b', 'b', 'ORKHON AB', 'b'], [0x10C0B, 'b' + SUP2, 'C', 'b', 'f', 'ORKHON AEB', 'B'],
    [0x10C11, 'd' + SUP1, 'C', 'd', 'b', 'ORKHON AD', 'd'], [0x10C13, 'd' + SUP2, 'C', 'd', 'f', 'ORKHON AED', 'D'],
    [0x10C0D, 'γ', 'C', 'g', 'b', 'ORKHON AG', 'g'], [0x10C0F, 'g', 'C', 'g', 'f', 'ORKHON AEG', 'G'],
    [0x10C34, 'q', 'C', 'k', 'b', 'ORKHON AQ', 'q'], [0x10C1A, 'k', 'C', 'k', 'f', 'ORKHON AEK', 'k'],
    [0x10C1E, 'l' + SUP1, 'C', 'l', 'b', 'ORKHON AL', 'l'], [0x10C20, 'l' + SUP2, 'C', 'l', 'f', 'ORKHON AEL', 'L'],
    [0x10C23, 'n' + SUP1, 'C', 'n', 'b', 'ORKHON AN', 'n'], [0x10C24, 'n' + SUP2, 'C', 'n', 'f', 'ORKHON AEN', 'N'],
    [0x10C3A, 'r' + SUP1, 'C', 'r', 'b', 'ORKHON AR', 'r'], [0x10C3C, 'r' + SUP2, 'C', 'r', 'f', 'ORKHON AER', 'R'],
    [0x10C3D, 's' + SUP1, 'C', 's', 'b', 'ORKHON AS', 's'], [0x10C3E, 's' + SUP2, 'C', 's', 'h', 'ORKHON AES', 'S'],
    [0x10C43, 't' + SUP1, 'C', 't', 'b', 'ORKHON AT', 't'], [0x10C45, 't' + SUP2, 'C', 't', 'f', 'ORKHON AET', 'T'],
    [0x10C16, 'y' + SUP1, 'C', 'y', 'b', 'ORKHON AY', 'y'], [0x10C18, 'y' + SUP2, 'C', 'y', 'h', 'ORKHON AEY', 'Y'],
    [0x10C38, 'qͦ', 'S', 'oq', 'b', 'ORKHON OQ', '1'], [0x10C1C, 'kͦ', 'S', 'ök', 'f', 'ORKHON OEK', '2'],
    [0x10C36, 'qͥ', 'S', 'ïq', 'b', 'ORKHON IQ', '3'], [0x10C31, 'i' + US + 'č', 'S', 'ič', 'n', 'ORKHON IC', '4'],
    [0x10C32, 'č', 'C', 'č', 'n', 'ORKHON EC', 'c'], [0x10C22, 'm', 'C', 'm', 'n', 'ORKHON EM', 'm'],
    [0x10C2A, 'ń', 'C', 'ń', 'n', 'ORKHON ENY', 'j'], [0x10C2D, 'ŋ', 'C', 'ŋ', 'n', 'ORKHON ENG', 'h'],
    [0x10C2F, 'p', 'C', 'p', 'n', 'ORKHON EP', 'p'], [0x10C41, 'š', 'C', 'š', 'n', 'ORKHON ESH', 'x'],
    [0x10C14, 'z', 'C', 'z', 'n', 'ORKHON EZ', 'z'], [0x10C21, 'l' + US + 't', 'C', 'lt', 'b', 'ORKHON ELT', '7'],
    [0x10C28, 'n' + US + 'č', 'C', 'nč', 'n', 'ORKHON ENC', '6'], [0x10C26, 'n' + US + 't', 'C', 'nt', 'n', 'ORKHON ENT', '5'],
    [0x10C3F, 'a' + US + 'š', 'S', 'aš', 'n', 'ORKHON ASH', '8'], [0x10C48, 'b' + US + 'a' + US + 'š', 'S', 'baš', 'n', 'ORKHON BASH', '9'],
    [0x10C30, 'o' + US + 'p', 'S', 'op', 'b', 'ORKHON OP', '0'], [0x10C47, 'o' + US + 't', 'S', 'ot', 'b', 'ORKHON OT', '='],
    [0x10C02, 'ä', 'V', 'ä', 'f', 'YENISEI AE', ''], [0x10C05, 'e', 'V', 'e', 'f', 'YENISEI E', '']
  ].map(([cp, tl, kind, base, h, name, key]) => ({ cp, ch: C(cp), tl: tl.normalize('NFC'), kind, base, h, name: 'OLD TURKIC LETTER ' + name, key }));
  const RN_Y = { 0x10C01: 'a', 0x10C04: 'i', 0x10C08: 'ü', 0x10C0A: 'b¹', 0x10C0C: 'b²', 0x10C0E: 'γ', 0x10C10: 'g',
    0x10C12: 'd¹', 0x10C15: 'z', 0x10C17: 'y¹', 0x10C19: 'y²', 0x10C1B: 'k', 0x10C1D: 'kͦ', 0x10C1F: 'l¹',
    0x10C25: 'n²', 0x10C27: 'n͟t', 0x10C29: 'n͟č', 0x10C2B: 'ń', 0x10C2C: 'ŋ', 0x10C2E: 'ŋ', 0x10C33: 'č',
    0x10C35: 'q', 0x10C37: 'qͥ', 0x10C39: 'qͦ', 0x10C3B: 'r¹', 0x10C40: 'a͟š', 0x10C42: 'š',
    0x10C44: 't¹', 0x10C46: 't²' };
  const Y_NAMES = { 0x10C01: 'YENISEI A', 0x10C04: 'YENISEI I', 0x10C08: 'YENISEI OE', 0x10C0A: 'YENISEI AB', 0x10C0C: 'YENISEI AEB',
    0x10C0E: 'YENISEI AG', 0x10C10: 'YENISEI AEG', 0x10C12: 'YENISEI AD', 0x10C15: 'YENISEI EZ', 0x10C17: 'YENISEI AY',
    0x10C19: 'YENISEI AEY', 0x10C1B: 'YENISEI AEK', 0x10C1D: 'YENISEI OEK', 0x10C1F: 'YENISEI AL', 0x10C25: 'YENISEI AEN',
    0x10C27: 'YENISEI ENT', 0x10C29: 'YENISEI ENC', 0x10C2B: 'YENISEI ENY', 0x10C2C: 'YENISEI ANG', 0x10C2E: 'YENISEI AENG',
    0x10C33: 'YENISEI EC', 0x10C35: 'YENISEI AQ', 0x10C37: 'YENISEI IQ', 0x10C39: 'YENISEI OQ', 0x10C3B: 'YENISEI AR',
    0x10C40: 'YENISEI ASH', 0x10C42: 'YENISEI ESH', 0x10C44: 'YENISEI AT', 0x10C46: 'YENISEI AET' };
  const RN_CP2TL = new Map(); const RN_TL2U = new Map();
  RN.forEach(r => { RN_CP2TL.set(r.ch, r.tl); RN_TL2U.set(r.tl, r); });
  for (const [cp, tl] of Object.entries(RN_Y)) RN_CP2TL.set(C(+cp), tl.normalize('NFC'));
  const RN_TL_SORTED = [...RN_TL2U.keys()].sort((a, b) => b.length - a.length);
  const AMB = new Set(['b', 'd', 'l', 'n', 'r', 's', 't', 'y']);
  const RN_WORD = /[\p{L}\p{M}\p{N}]/u;
  const SYL = { 'ič': 'i͟č', 'nč': 'n͟č', 'nt': 'n͟t', 'lt': 'l͟t', 'aš': 'a͟š', 'baš': 'b͟a͟š',
    'op': 'o͟p', 'ot': 'o͟t', 'oq': 'qͦ', 'ök': 'kͦ', 'ïq': 'qͥ' };
  function normRn(s) {
    return s.normalize('NFC')
      .replace(/\[(baš|ič|nč|nt|lt|aš|op|ot|oq|ök|ïq)\]/g, (m, x) => SYL[x])
      .replace(/([bdlnrsty])1/g, '$1' + SUP1).replace(/([bdlnrsty])2/g, '$1' + SUP2)
      .replace(/oq/g, SYL.oq).replace(/ök/g, SYL['ök']).replace(/ïq/g, SYL['ïq'])
      .replace(/op/g, SYL.op).replace(/ot/g, SYL.ot)
      .replace(/ɣ/g, 'γ').replace(/ng/g, 'ŋ').replace(/sh/g, 'š').replace(/c/g, 'č');
  }
  function parseRn(word) {
    const s = normRn(word); const units = [];
    for (let i = 0; i < s.length;) {
      let hit = null;
      for (const t of RN_TL_SORTED) if (s.startsWith(t, i)) { hit = t; break; }
      if (hit) { units.push(RN_TL2U.get(hit)); i += hit.length; continue; }
      const c = String.fromCodePoint(s.codePointAt(i)); i += c.length;
      if (AMB.has(c)) units.push({ amb: true, kind: 'C', base: c, h: 'n', tl: c });
      else units.push({ unknown: true, raw: c, base: c, kind: 'X' });
    }
    return units;
  }
  function harmRn(units) {
    let s = 0;
    for (const x of units) { if (x.h === 'b') s += 1; else if (x.h === 'f') s -= 1; else if (x.h === 'h') s -= 0.5; }
    return s > 0 ? 'b' : s < 0 ? 'f' : 'b';
  }
  function rnWordToTl(word) { return Array.from(word).map(c => RN_CP2TL.get(c) ?? c).join('').normalize('NFC'); }
  function tlWordToRn(word, unknown) {
    const u = parseRn(word); const h = harmRn(u);
    return u.map(x => {
      if (x.unknown) { if (unknown && /\p{L}/u.test(x.raw)) unknown.add(x.raw); return x.raw; }
      if (x.amb) return RN_TL2U.get(x.base + (h === 'b' ? SUP1 : SUP2)).ch;
      return x.ch;
    }).join('');
  }
  const canonRn = tl => rnWordToTl(tlWordToRn(tl));

  function readRn(tl) {
    const u = parseRn(tl); const back = harmRn(u) === 'b';
    const A = back ? 'a' : 'ä', I = back ? 'ï' : 'i', U = back ? 'u' : 'ü';
    const out = []; let vc = 0, lastRound = false;
    const V = s => { out.push({ v: true, s }); vc++; lastRound = /[ouöü]/.test(s); };
    const K = s => { out.push({ v: false, s }); };
    const consSince = () => { let k = 0; for (let j = out.length - 1; j >= 0 && !out[j].v; j--) k++; return k; };
    const NOINIT = new Set(['d', 'g', 'ŋ', 'ń', 'r', 'z', 'l', 'p', 'lt', 'nt', 'nč']);
    const FINOK = new Set(['lk', 'lp', 'lt', 'nč', 'nt', 'rč', 'rk', 'rs', 'rt', 'yt']);
    const startsV = x => x && (x.kind === 'V' || (x.kind === 'S' && x.base !== 'baš'));
    const ph = b => b === 'g' ? (back ? 'γ' : 'g') : b === 'k' ? (back ? 'q' : 'k') : b;
    const lastOf = b => b.length > 1 && b !== 'nč' ? b[b.length - 1] : b === 'nč' ? 'č' : b;
    const firstOf = b => b.length > 1 ? b[0] : b;
    const pairKey = (a, b) => (a === 'š' ? 's' : a) + (b === 'š' ? 's' : b);
    function q(prev, nx, nxLast) {
      if (nxLast && nx && nx.kind === 'C') {
        if (nx.base === 'p' && prev !== 'l') return I;
        if (nx.base === 'g') return I;
        if (prev === 'm' && (nx.base === 's' || nx.base === 'š')) return 'i';
      }
      if (vc > 0 && (prev === 'd' || prev === 't') && nx && (nx.base === 'm' || nx.base === 'ŋ')) return I;
      if (vc > 0 && prev === 'm' && nx && nx.base === 'z') return I;
      return lastRound && vc > 0 ? U : A;
    }
    function close(prev, nx, nxLast) {
      if (!nx || startsV(nx) || nx.kind === 'X') return;
      if (consSince() >= 2) { V(q(prev, nx, nxLast)); return; }
      if (nxLast && nx.kind === 'C' && !FINOK.has(pairKey(prev, firstOf(nx.base)))) V(q(prev, nx, nxLast));
    }
    for (let i = 0; i < u.length; i++) {
      const x = u[i], nx = u[i + 1], nxLast = i + 1 === u.length - 1;
      if (x.unknown) { K(x.raw); continue; }
      if (x.kind === 'V') { V({ a: A, i: I, u: U, ü: 'ü', ä: 'ä', e: 'e' }[x.base]); continue; }
      if (x.kind === 'S') {
        const b = x.base;
        if (b === 'oq' || b === 'ök' || b === 'ïq') {
          const vow = b === 'oq' ? 'u' : b === 'ök' ? 'ü' : 'ï', k = b === 'ök' ? 'k' : 'q';
          const prevV = out.length && out[out.length - 1].v;
          if (prevV) K(k);
          else if (out.length === 0 && nx && !startsV(nx)) { K(k); V(vow); continue; }
          else { V(vow); K(k); }
          close('k', nx, nxLast); continue;
        }
        if (b === 'ič') { V('i'); K('č'); close('č', nx, nxLast); continue; }
        if (b === 'aš') { V(A); K('š'); close('š', nx, nxLast); continue; }
        if (b === 'baš') { K('b'); V(A); K('š'); close('š', nx, nxLast); continue; }
        if (b === 'op' || b === 'ot') { V(U); K(b[1]); close(b[1], nx, nxLast); continue; }
      }
      const base = x.base;
      const phon = base === 'lt' ? ['l', 't'] : base === 'nt' ? ['n', 't'] : base === 'nč' ? ['n', 'č'] : [ph(base)];
      if (out.length === 0 && !NOINIT.has(base) && u.length > 1) {
        phon.forEach(K);
        if (nx && !startsV(nx)) V(q(base, nx, nxLast));
        continue;
      }
      if (out.length === 0) V(A);
      phon.forEach(K);
      close(lastOf(base), nx, nxLast);
    }
    return out.map(o => o.s).join('');
  }

  function orthRn(word) {
    const w = cleanTr(word).replace(/ng/g, 'ŋ'); const back = isBackTr(w);
    const a = Array.from(w); const last = a.length - 1;
    const H = b => b + (back ? SUP1 : SUP2);
    const CONS = { b: H('b'), p: 'p', f: 'p', v: H('b'), w: H('b'), d: H('d'), δ: H('d'), t: H('t'), γ: back ? 'γ' : 'g',
      g: back ? 'γ' : 'g', q: back ? 'q' : 'k', k: back ? 'q' : 'k', x: 'q', h: 'q', l: H('l'), n: H('n'), r: H('r'),
      s: H('s'), y: H('y'), j: H('y'), z: 'z', ž: 'z', č: 'č', c: 'č', m: 'm', ŋ: 'ŋ', ñ: 'ń', ń: 'ń', š: 'š' };
    let out = '', vc = 0, prevRound = false, prevCons = '';
    for (let i = 0; i < a.length; i++) {
      const c = a[i];
      if (VOW.includes(c)) {
        vc++; const round = 'oöuü'.includes(c);
        let s;
        if (i === last) s = 'aäe'.includes(c) ? 'a' : 'ïi'.includes(c) ? 'i' : 'ou'.includes(c) ? 'u' : 'ü';
        else if (vc === 1) s = 'aäe'.includes(c) ? '' : 'ïi'.includes(c) ? 'i' : 'ou'.includes(c) ? 'u' : 'ü';
        else s = round ? (prevRound ? '' : ('ou'.includes(c) ? 'u' : 'ü')) : '';
        out += s; prevRound = round; prevCons = ''; continue;
      }
      if (c === prevCons) continue;
      if (c === 'n' && (a[i + 1] === 't' || a[i + 1] === 'č')) { out += a[i + 1] === 't' ? SYL.nt : SYL['nč']; prevCons = a[i + 1]; i++; continue; }
      out += CONS[c] ?? c; prevCons = c;
    }
    return out.normalize('NFC');
  }
  const TOK = { oq: ['u', 'k'], ök: ['ü', 'k'], ïq: ['i', 'k'], ič: ['i', 'č'], aš: ['a', 's'], baš: ['b', 'a', 's'],
    op: ['u', 'p'], ot: ['u', 't'], nt: ['n', 't'], nč: ['n', 'č'], lt: ['l', 't'] };
  function rnToks(units) {
    const t = [];
    for (const x of units) {
      if (x.unknown) { t.push(x.raw); continue; }
      if (TOK[x.base]) { t.push(...TOK[x.base]); continue; }
      t.push(x.base === 'š' ? 's' : x.base === 'ń' ? 'y' : x.base);
    }
    return t;
  }
  const isVTok = s => 'aiuüäe'.includes(s);
  const skelOf = toks => toks.filter(s => !isVTok(s)).join('');
  let IDX_RN = null;
  function idxRn() {
    if (IDX_RN) return IDX_RN;
    IDX_RN = new Map();
    CORPUS_RAW.forEach((w, rank) => {
      const toks = rnToks(parseRn(orthRn(w))); const key = skelOf(toks);
      if (!IDX_RN.has(key)) IDX_RN.set(key, []);
      IDX_RN.get(key).push({ w, toks, rank, back: isBackTr(w) });
    });
    return IDX_RN;
  }
  function corpusRn(k) {
    const units = parseRn(k); if (units.some(x => x.unknown)) return null;
    const toks = rnToks(units); const list = idxRn().get(skelOf(toks)); if (!list) return null;
    let sc = 0; for (const x of units) { if (x.h === 'b') sc++; else if (x.h === 'f') sc--; }
    const lim = toks.length >= 7 ? 2 : 1;
    const scored = list.filter(c => sc === 0 || (sc > 0) === c.back)
      .map(c => ({ c, d: editDist(toks, c.toks) })).filter(s => s.d <= lim)
      .sort((a, b) => a.d - b.d || a.c.rank - b.c.rank);
    return scored.length ? scored[0].c.w : null;
  }
  // Spellings Tekin cites in §1.22 with their transcriptions (written with the input shorthands)
  const RAW_ATT = 'd1q=adaq l1t1un1=altun r1t1oq=artuq d2gü=ädgü mgk=ämgäk r2n2=ärän ki=eki l2=el ač=āč ačs1q=āčsïq ' +
    'ačs2q=āčsïq at1=āt id1oq=ïduq iγr1=ïγar ičkd2i=ičikdi igd2=igid il2gr2ü=ilgärü ičr2a=ičrä s2b1r1a=isbara ' +
    's2t2mi=istämi d2i=idi uγl1m=oγlum ut1z=otuz učz=učuz ur1š=uruš ügz=ögüz ül2gl2i=ölgäli üčn2=üčün üzgl2i=üzgäli ' +
    'oqun1=oqun ökün2=ökün öküš=üküš b1l1ïq=balïq t1b1s1γn1=tabïšγan s2b2n2p=säbinip b2d2z=bädiz b2r2ms2=bermiš ' +
    'y2r2=yer t1amqa=tāmqa b1iŋ=biŋ qir1q=qïrq y1il1qa=yïlqa b2il2ga=bilgä kis2i=kiši ïql1p=qïlïp ïqs2ms2=qïsmis ' +
    's1md1i=sïmadï y1γd1m=yïγdïm b2l2t2kmn2=biltükümün b2l2ga=bilgä b2l2gs2i=bilgäsi b2l2gn2=biligin b2n2t2r2a=bintürä ' +
    'b2z=biz b2zn2i=bizni t2l2d2m=tilädim y2msq=yïmšaq y2nčga=yinčgä y2pr1iγ=yïparïγ b1ud1n1=bodun qur1γn1=qorγan ' +
    'b1ul1ŋ=buluŋ y1uy1qa=yuyqa t2ük2t2i=tükäti b2ür2i=böri kür2g=körüg kün2i=küni t1oq=toq t1oquz=toquz t1uqz=toquz ' +
    'b1oqa=buqa oqn1l1d1m=qunladïm oqt1=qut s2ökd2m=sökdüm t2ökt2i=töküti y2ökn2t2i=yükünti öl2kn2=kölikin ökr2=kör ' +
    'ökr2t2g=körtüg r1a=ara b1uγzl1n1t1i=boγuzlantï ul1y1u=ulayu b2ŋgü=bäŋgü qzγn1ms1r1=qazγanmasar y1l1b1či=yalabači ' +
    'b2üks2i=bökäsi kl2r2m=äkälärim s2ül2ms2r2=sülämäsär pm=apām pmz=apamïz r1qs1n1=arqasïn s1γt1ms2=sïγtamis ' +
    's1γt1mš=sïγtamiš t1pl1md1i=taplamadï un1mŋ=unamaŋ y1uγl1ms2=yoγlamis y1uγl1mš=yoγlamiš ačs1r1=āčsar ' +
    'd1γr1γ=adγïrïγ d1r1l1ml1m=adrïlmalïm b1uŋs2z=buŋsïz t1ut1s1qŋn1=tutsïqïŋïn y2gr2mi=yegirmi t2ür2gs2=türgis ' +
    'n1n1=anïn b2r2ü=äbirü r2ig=ärig s2id2=äsid s2id2gl2=äsidgil in2s2i=inisi qur1iqn1=qurïqan uγl1it1i=oγlïtï ' +
    'y2it2nč=yitinč t2ŋr2i=täŋri t2ŋr2id2a=täŋridä b1ul1mš=bolmiš t2ür2ök=türük qγn1=qaγan t1b1γč=tabγač s1b1i=sabï ' +
    's1üčig=süčig γis1i=aγïsï y2imšq=yïmšaq r2ms2=ärmiš b2gl2r2=bäglär b1un1i=bunï s2id2ŋ=äsidiŋ b1umn1=bumïn ' +
    'is2t2mi=istämi ul1r1ms2=olurmiš n2a=nä qγn1qa=qaγanqa is2g=isig küčg=küčüg b2ir2ür2=birür mn2=män t2ir2=tir ' +
    'y2ir2=yir s1y1u=sayu oqp=qop t1ur1u=toru ül2ü=ölü üd2=öd y1s1r1=yasar y1oq=yoq qn1=qan ökk=kök';
  const ATT_RN = {};
  RAW_ATT.split(' ').forEach(p => { const [k, v] = p.split('='); ATT_RN[canonRn(k)] = v; });

  SIYI.turkic.MODES.rn = {
    id: 'rn', WORD: RN_WORD, toTl: rnWordToTl, fromTl: tlWordToRn, canon: canonRn,
    skel: tl => skelOf(rnToks(parseRn(tl))), read: readRn, orth: orthRn,
    sepToTl: s => s.replace(/[⁚⸱]/g, ':'),
    sepFromTl: s => s.replace(/:/g, '⁚'),
    sepTlToTr: s => /\n/.test(s) ? s.replace(/[ \t]*:[ \t]*/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n') : (s.replace(/\s*:\s*/g, ' ').replace(/ {2,}/g, ' ') || ' '),
    sepTrToTl: s => /\n/.test(s) ? s : s.replace(/^[ \t]+$/, ' : '),
    normTl: normRn,
    info(tl, user) {
      const k = canonRn(tl);
      if (user && Object.prototype.hasOwnProperty.call(user, k)) return { tr: user[k], src: 'user', key: k };
      if (ATT_RN[k]) return { tr: ATT_RN[k], src: 'att', key: k };
      const c = corpusRn(k); if (c) return { tr: c, src: 'corpus', key: k };
      return { tr: readRn(k), src: 'rule', key: k };
    },
    base(k) { return ATT_RN[k] ?? corpusRn(k) ?? readRn(k); }
  };
  Object.assign(SIYI.turkic, { RN, RN_Y, Y_NAMES, parseRn, readRn, orthRn, canonRn, corpusRn, ATT_RN });

  /* 编辑器下方“Tekin 的换写体系与拼写规则”一栏的说明文字 */
  SIYI.notes.rn = `
    <summary>如尼文：Tekin 的换写体系与拼写规则</summary>
    <div class="inner rules">
      <h3>换写的记法（Tekin §1.11）</h3>
      <ul>
        <li>四个元音字母记作 <span class="l">a i u ü</span>，每个表两个元音：a 表 a/ä，i 表 ï/i，u 表 o/u，ü 表 ö/ü。</li>
        <li>大多数辅音分前后两套。上标 ¹ 的一套用于后元音词，上标 ² 的一套用于前元音词，如 <span class="l">b¹ b²、t¹ t²</span>。<span class="l">γ / g</span>、<span class="l">q / k</span> 本身就分前后。<span class="l">č m ń ŋ p š z</span> 前后通用。</li>
        <li>音节字母：<span class="l">qͦ</span> 表 oq、uq、qo、qu，<span class="l">kͦ</span> 表 ök、ük、kö、kü，<span class="l">qͥ</span> 表 ïq、qï。带下划线的 <span class="l">i͟č n͟č n͟t l͟t a͟š b͟a͟š</span> 各是一个字母，不是两个。<span class="l">o͟p</span>、<span class="l">o͟t</span> 见于手抄本和叶尼塞碑铭。</li>
        <li>碑文用形似冒号的符号 ⁚ 隔词（§1.23），换写记作 :，转写里换成空格。</li>
        <li>打字时可以用简写：b1 → b¹，t2 → t²，oq → qͦ，ök → kͦ，ïq → qͥ，op → o͟p，[nt] → n͟t，[nč]、[lt]、[ič]、[aš]、[baš] 同理。</li>
        <li>叶尼塞变体字母读进来时会换成对应的鄂尔浑字形，只有 ä 和 e 两个叶尼塞元音字母保留。</li>
      </ul>
      <h3>拼写规则（Tekin §1.22）</h3>
      <ul>
        <li>辅音字母本身代表“a 或 ä + 该辅音”的音节，所以词首的 a、ä、e 不写，第一音节非词首的 a、ä、e 也不写。ï、i 在词首总写，o、u、ö、ü 在第一音节通常写出。</li>
        <li>词尾元音一律写出。非第一音节的 a、ä 和短 ï、i 一般不写，长元音则写。</li>
        <li>非第一音节的 u、ü 在不圆唇音节之后写出，在圆唇音节之后通常不写，如 b¹ud¹n¹ bodun、t¹uqz toquz。</li>
        <li>s² 常混用在后元音词里 ï 的前后；词首 y 后接 i 时常用 y²（§1.2221、§1.2222）。</li>
      </ul>
      <h3>从换写读出转写</h3>
      <ul>
        <li>先按辅音字母判断整个词的前后：¹ 类以及 γ、q、u 算后元音，² 类以及 g、k、ü 算前元音，s² 和 y² 只算半票。</li>
        <li>按音节结构补出没写的元音。词首不能出现 d、γ、g、ŋ、ń、r、z，l 和 p 只见于借词（§2.2），遇到就在前面补 a 或 ä；连续两个以上的辅音中间补元音；词尾只允许 lq/lk、lp、lt、nč、nt、rč、rq/rk、rs、rt、yt 这几种复辅音，其他组合中间补元音。</li>
        <li>补的元音一般是 a 或 ä；前一音节是圆唇元音时补 u 或 ü。d、t 与 m、ŋ 之间补 ï 或 i，对应 -dïm、-dïŋ 这类词尾；m 与词尾 s、š 之间补 i，因为 -miš 在鄂尔浑碑铭里不分前后，一律带 i（§2.1211）。</li>
        <li>第一音节的 o 与 u、ö 与 ü 分不开，先给 u、ü；e 与 ä 也分不开。</li>
        <li>查词的顺序：你改过的读法 → 书中第一章给出拼写的约一百二十个例词 → 五篇碑文转写里的 1615 个词形。比对碑文词形时，先用上面的拼写规则把它写成换写，辅音骨架相同、写法最多差一个字母（长词差两个）才采用。都查不到才按规则推。</li>
      </ul>
      <h3>从转写写出换写</h3>
      <ul>
        <li>照上面的拼写规则：该省的元音省去，词尾元音写出，辅音按整个词的前后选 ¹ 或 ² 那一套。叠辅音只写一个；n 接 t、č 时用 n͟t、n͟č。</li>
        <li>如果你只改了元音，辅音没变，换写保持原样，只记下你的读法。</li>
      </ul>
      <p class="small">依 Talat Tekin, <i>A Grammar of Orkhon Turkic</i> (1968) §1.1–1.23、§2.1–2.3 与第二部分的碑文转写；码位依 Unicode 古突厥文区段 U+10C00–10C48。</p>
    </div>
`;
})();
