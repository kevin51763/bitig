/* 藏文 ↔ 威利转写（扩展威利 EWTS），自动判断前加字、上加字、基字、下加字。
   两栏编辑器（js/editors/two-pane.js）通用的转换接口，写法见 js/converters/_template.js。 */
(function () {
  const NNBSP = ' ', MVS = '᠎';
  const bo = (() => {
    const CONS = [['k', 0x0F40], ['kh', 0x0F41], ['g', 0x0F42], ['gh', 0x0F43], ['ng', 0x0F44], ['c', 0x0F45], ['ch', 0x0F46], ['j', 0x0F47],
      ['ny', 0x0F49], ['T', 0x0F4A], ['Th', 0x0F4B], ['D', 0x0F4C], ['Dh', 0x0F4D], ['N', 0x0F4E], ['t', 0x0F4F], ['th', 0x0F50],
      ['d', 0x0F51], ['dh', 0x0F52], ['n', 0x0F53], ['p', 0x0F54], ['ph', 0x0F55], ['b', 0x0F56], ['bh', 0x0F57], ['m', 0x0F58],
      ['ts', 0x0F59], ['tsh', 0x0F5A], ['dz', 0x0F5B], ['dzh', 0x0F5C], ['w', 0x0F5D], ['zh', 0x0F5E], ['z', 0x0F5F], ["'", 0x0F60],
      ['y', 0x0F61], ['r', 0x0F62], ['l', 0x0F63], ['sh', 0x0F64], ['Sh', 0x0F65], ['s', 0x0F66], ['h', 0x0F67], ['a', 0x0F68], ['kSh', 0x0F69]];
    const W2C = new Map(CONS), C2W = new Map();
    CONS.forEach(([w, c]) => { C2W.set(c, w); C2W.set(c + 0x50, w); });
    const CKEYS = CONS.map(c => c[0]).filter(k => k !== 'a').sort((a, b) => b.length - a.length);
    const VOW = [['-I', 'ཱྀ'], ['-i', 'ྀ'], ['ai', 'ཻ'], ['au', 'ཽ'], ['A', 'ཱ'], ['I', 'ཱི'],
      ['U', 'ཱུ'], ['i', 'ི'], ['u', 'ུ'], ['e', 'ེ'], ['o', 'ོ'], ['a', '']];
    const VKEYS = VOW.map(v => v[0]).sort((a, b) => b.length - a.length);
    const V2U = new Map(VOW), U2V = [...VOW].filter(v => v[1]).sort((a, b) => b[1].length - a[1].length);
    const SUPER = { r: 'k g ng j ny t d n b m ts dz', l: 'k g ng c j t d p b h', s: 'k g ng ny t d n p b m ts' };
    for (const k in SUPER) SUPER[k] = new Set(SUPER[k].split(' '));
    const SUB = { y: new Set('k kh g p ph b m h'.split(' ')), r: new Set('k kh g t th d n p ph b m s h sh'.split(' ')),
      l: new Set('k g b r s z'.split(' ')), w: null };
    const PREFIX = new Set(['g', 'd', 'b', 'm', "'"]);
    const PRE_ROOT = { g: 'c ny t d n ts zh z y sh s', d: 'k g ng p b m', b: 'k g c t d ts zh z sh s r l', m: 'kh g ng ch j ny th d n tsh dz', "'": 'kh g ch j th d ph b tsh dz' };
    for (const k in PRE_ROOT) PRE_ROOT[k] = new Set(PRE_ROOT[k].split(' '));
    const POSTOK = new Set(['g', 'ng', 'b', 'm']);
    function validStack(cs) {
      if (cs.length === 1) return true;
      let root, i;
      if (SUPER[cs[0]] && SUPER[cs[0]].has(cs[1])) { root = cs[1]; i = 2; } else { root = cs[0]; i = 1; }
      for (; i < cs.length; i++) {
        const s = cs[i];
        if (!(s in SUB)) return false;
        if (SUB[s] && !SUB[s].has(root)) return false;
      }
      return true;
    }
    function tokenize(s) {
      const t = []; let i = 0;
      outer: while (i < s.length) {
        for (const k of CKEYS) if (s.startsWith(k, i)) { t.push({ c: k }); i += k.length; continue outer; }
        for (const k of VKEYS) if (s.startsWith(k, i)) { t.push({ v: k }); i += k.length; continue outer; }
        const ch = s[i]; i++;
        if (ch === '+' || ch === '.') t.push({ m: ch });
        else if (ch === 'M') t.push({ raw: 'ཾ' });
        else if (ch === 'H') t.push({ raw: 'ཿ' });
        else if (ch >= '0' && ch <= '9') t.push({ raw: String.fromCharCode(0x0F20 + (+ch)) });
        else t.push({ raw: ch });
      }
      return t;
    }
    const base = w => String.fromCodePoint(W2C.get(w));
    const sub = w => String.fromCodePoint(W2C.get(w) + 0x50);
    const stackStr = st => base(st[0]) + st.slice(1).map(sub).join('');
    function sylToScript(syl) {
      const t = tokenize(syl);
      const vi = t.findIndex(x => x.v !== undefined);
      if (vi < 0) return t.map(x => x.c ? base(x.c) : x.raw || '').join('');
      const pre = t.slice(0, vi), post = t.slice(vi + 1);
      let stacks;
      if (pre.some(x => x.m)) {
        stacks = []; let cur = [];
        pre.forEach((x, k) => {
          if (x.m === '.') { if (cur.length) stacks.push(cur); cur = []; }
          else if (x.m === '+') { /* join */ }
          else if (x.c) {
            if (cur.length && pre[k - 1] && pre[k - 1].m !== '+') { stacks.push(cur); cur = []; }
            cur.push(x.c);
          }
        });
        if (cur.length) stacks.push(cur);
      } else {
        const cs = pre.map(x => x.c);
        if (cs.some(c => !c)) return t.map(x => x.c ? base(x.c) : x.v ? V2U.get(x.v) : x.raw || '').join('');
        if (!cs.length) stacks = [['a']];
        else if (validStack(cs)) stacks = [cs];
        else if (cs.length >= 2 && PREFIX.has(cs[0]) && validStack(cs.slice(1))) stacks = [[cs[0]], cs.slice(1)];
        else stacks = cs.map(c => [c]);
      }
      let out = stacks.map(stackStr).join('') + V2U.get(t[vi].v);
      for (let k = 0; k < post.length; k++) {
        const x = post[k];
        if (x.c) out += (post[k - 1] && post[k - 1].m === '+') ? sub(x.c) : base(x.c);
        else if (x.v !== undefined) out += V2U.get(x.v);
        else if (x.raw) out += x.raw;
      }
      return out;
    }
    function sylToLatin(syl) {
      const st = []; let tail = '';
      for (const ch of syl) {
        const c = ch.codePointAt(0);
        if (c >= 0x0F40 && c <= 0x0F6C && C2W.has(c)) st.push({ L: [C2W.get(c)], v: '', m: '' });
        else if (c >= 0x0F8D && c <= 0x0FBC && C2W.has(c) && st.length) st[st.length - 1].L.push(C2W.get(c));
        else if ((c >= 0x0F71 && c <= 0x0F7D) || c === 0x0F80 || c === 0x0F81) { if (st.length) st[st.length - 1].v += ch; else tail += ch; }
        else if (c === 0x0F7E || c === 0x0F7F) { if (st.length) st[st.length - 1].m += c === 0x0F7E ? 'M' : 'H'; }
        else if (st.length) st[st.length - 1].m += ch; else tail += ch;
      }
      if (!st.length) return tail;
      const noVowelRoot = () => {
        let root;
        const multi = st.findIndex(s => s.L.length > 1);
        const single = st.map(s => s.L.length === 1 ? s.L[0] : null);
        if (multi >= 0) root = multi;
        else if (st.length <= 2) root = 0;
        else if (st.length === 3) root = (PREFIX.has(single[0]) && PRE_ROOT[single[0]].has(single[1]) && !(single[2] === 's' && POSTOK.has(single[1]) && !PRE_ROOT[single[0]].has(single[1]))) ? 1 : 0;
        else root = 1;
        return root;
      };
      let root = st.findIndex(s => s.v);
      if (root < 0) root = noVowelRoot();
      else if (root > 0 && st[root].L.length === 1 && st[root].L[0] === "'" && /^[ིོུ]$/.test(st[root].v)) root = noVowelRoot();
      const skt = st.some(s => s.L.length > 1 && !validStack(s.L));
      let out = '';
      st.forEach((s, i) => {
        let w = s.L.length > 1 && !validStack(s.L) ? s.L.join('+') : s.L.join('');
        if (s.L.length === 1 && s.L[0] === 'a' && (s.v || i === root)) w = '';
        if (i > 0 && w) {
          const prev = st[i - 1];
          const joinAmb = prev.L.length === 1 && !prev.v && i === root && validStack([prev.L[0], ...s.L]);
          const tokAmb = tokenize(out + w).length !== tokenize(out).length + tokenize(w).length;
          if (joinAmb || tokAmb) out += '.';
        }
        out += w;
        if (s.v) { let v = s.v, vw = ''; while (v) { const hit = U2V.find(([, u]) => v.startsWith(u)); if (!hit) { vw += v[0]; v = v.slice(1); continue; } vw += hit[0]; v = v.slice(hit[1].length); } out += vw; }
        else if (i === root || (skt && !(s.L.length === 1 && s.L[0] === 'a' && !w))) out += 'a';
        out += s.m;
      });
      return out + tail;
    }
    const SYL_L = /[A-Za-z'+.\-]+/g;
    function sepToScript(t) {
      if (/\//.test(t)) return t.replace(/ *(\/\/?) */g, (m, sl) => (sl.length === 2 ? '༎' : '།') + (/ $/.test(m) ? ' ' : ''));
      return t.replace(/[ \t]+/g, '་').replace(/[0-9]/g, d => String.fromCharCode(0x0F20 + (+d)));
    }
    function toScript(src) {
      let out = '', last = 0;
      for (const m of src.normalize('NFC').matchAll(SYL_L)) {
        out += sepToScript(src.slice(last, m.index)) + sylToScript(m[0]); last = m.index + m[0].length;
      }
      return (out + sepToScript(src.slice(last))).replace(/ང(?=།)/g, 'ང་');
    }
    function sepToLatin(t) {
      return t.replace(/[་༌]/g, ' ').replace(/༎/g, '//').replace(/།/g, '/')
        .replace(/[༠-༩]/g, d => String(d.charCodeAt(0) - 0x0F20));
    }
    function toLatin(src) {
      let out = '', last = 0;
      src = src.replace(/་(?=།)/g, '');
      for (const m of src.matchAll(/[ཀ-ྼ]+/g)) {
        out += sepToLatin(src.slice(last, m.index)) + sylToLatin(m[0]); last = m.index + m[0].length;
      }
      return out + sepToLatin(src.slice(last));
    }
    return {
      toScript, toLatin,
      WORD: { m: /[ཀ-ྼ]/, l: /[A-Za-z'+.\-]/ },
      UI: {
        name: '藏文', lang: 'bo', schemes: null, latinSub: '威利转写（Wylie / EWTS）',
        sample: 'bkra shis bde legs/\n\nchu thigs bsags na rgya mtsho chags/\nsangs rgyas chos dang tshogs kyi mchog rnams la/\nbyang chub bar du bdag ni skyabs su mchi/'
      }
    };
  })();
  SIYI.converters.bo = bo;
})();
