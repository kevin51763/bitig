/* 满文 ↔ 穆麟德夫转写（另有 v、x、z 代 ū、š、ž 的简便写法）。
   两栏编辑器（js/editors/two-pane.js）通用的转换接口，写法见 js/converters/_template.js。 */
(function () {
  const NNBSP = ' ', MVS = '᠎';
  const mnc = (() => {
    const isLatV = c => !!c && /[aeiouūův]/.test(c);
    const TOK = [
      ["ts'", 'ᡮ'], ["c'", 'ᡱ'], ["k'", 'ᠺ'], ["g'", 'ᡬ'], ["h'", 'ᡭ'], ['dz', 'ᡯ'], ['ng', 'ᠩ'],
      ['a', 'ᠠ'], ['e', 'ᡝ'], ['i', 'ᡳ'], ['o', 'ᠣ'], ['u', 'ᡠ'], ['ū', 'ᡡ'], ['ů', 'ᡡ'], ['v', 'ᡡ'],
      ['n', 'ᠨ'], ['k', 'ᡴ'], ['g', 'ᡤ'], ['h', 'ᡥ'], ['b', 'ᠪ'], ['p', 'ᡦ'], ['s', 'ᠰ'], ['š', 'ᡧ'], ['x', 'ᡧ'],
      ['t', 'ᡨ'], ['d', 'ᡩ'], ['l', 'ᠯ'], ['m', 'ᠮ'], ['c', 'ᠴ'], ['j', 'ᠵ'], ['y', 'ᠶ'], ['r', 'ᡵ'],
      ['f', 'ᡶ'], ['w', 'ᠸ'], ['ž', 'ᡰ'], ['z', 'ᡰ']];
    const SIB = new Set(['ᠰ', 'ᡱ', 'ᡮ', 'ᡯ']);
    const PUNCT = { ',': '᠈', '.': '᠉', ':': '᠄', ';': '᠈' };
    function toScript(src) {
      const s = src.normalize('NFC').toLowerCase(); let out = '', i = 0;
      outer: while (i < s.length) {
        const ch = s[i];
        if (ch === '·' || ch === '|') { i++; continue; }
        if (ch === '-') { out += NNBSP; i++; continue; }
        if (ch >= '0' && ch <= '9') { out += String.fromCharCode(0x1810 + (+ch)); i++; continue; }
        if (PUNCT[ch]) { out += PUNCT[ch]; i++; continue; }
        if (s.startsWith('jy', i) && !isLatV(s[i + 2])) { out += 'ᡷᡟ'; i += 2; continue; }
        if (ch === 'y' && SIB.has(out.slice(-1)) && !isLatV(s[i + 1])) { out += 'ᡟ'; i++; continue; }
        for (const [k, v] of TOK) { if (s.startsWith(k, i)) { out += v; i += k.length; continue outer; } }
        out += ch; i++;
      }
      return out;
    }
    const R = {
      'ᠠ': 'a', 'ᡝ': 'e', 'ᠡ': 'e', 'ᡳ': 'i', 'ᠢ': 'i', 'ᡞ': 'i', 'ᠣ': 'o', 'ᡠ': 'u', 'ᠤ': 'u',
      'ᡡ': ['ū', 'v'], 'ᠨ': 'n', 'ᠩ': 'ng', 'ᡢ': 'ng', 'ᡴ': 'k', 'ᡣ': 'k', 'ᠬ': 'k', 'ᠺ': "k'",
      'ᡤ': 'g', 'ᠭ': 'g', 'ᡬ': "g'", 'ᡥ': 'h', 'ᡭ': "h'", 'ᠪ': 'b', 'ᡦ': 'p', 'ᠫ': 'p',
      'ᠰ': 's', 'ᡧ': ['š', 'x'], 'ᠱ': ['š', 'x'], 'ᡨ': 't', 'ᠲ': 't', 'ᡩ': 'd', 'ᠳ': 'd',
      'ᠯ': 'l', 'ᠮ': 'm', 'ᠴ': 'c', 'ᡱ': "c'", 'ᠵ': 'j', 'ᡪ': 'j', 'ᡷ': 'j', 'ᠶ': 'y', 'ᡟ': 'y',
      'ᡵ': 'r', 'ᠷ': 'r', 'ᡶ': 'f', 'ᡫ': 'f', 'ᠹ': 'f', 'ᠸ': 'w', 'ᡮ': "ts'", 'ᡯ': 'dz',
      'ᡰ': ['ž', 'z'], 'ᡲ': ['ž', 'z']};
    const DROP = /[᠋-᠍᠏‌‍᠀]/g;
    const RPUNCT = { '᠁': '…', '᠂': ',', '᠃': '.', '᠄': ':', '᠅': '::', '᠈': ',', '᠉': '.' };
    const isLetter = c => c >= 'ᠠ' && c <= 'ᡸ';
    function toLatin(src, scheme) {
      const s = src.normalize('NFC').replace(DROP, ''); const k = scheme === 'simple' ? 1 : 0; let out = '', i = 0;
      while (i < s.length) {
        const c = s[i];
        if (isLetter(c)) {
          let j = i; while (j < s.length && isLetter(s[j])) j++;
          let lw = '';
          for (const ch of s.slice(i, j)) {
            const r = R[ch]; const t = r === undefined ? ch : (Array.isArray(r) ? r[k] : r);
            const last = lw.slice(-1);
            if ((last === 'n' && t[0] === 'g') || (last === 'd' && t[0] === 'z')) lw += '·';
            lw += t;
          }
          out += lw; i = j; continue;
        }
        if (c === NNBSP) { out += '-'; i++; continue; }
        if (c >= '᠐' && c <= '᠙') { out += String(c.charCodeAt(0) - 0x1810); i++; continue; }
        if (RPUNCT[c]) { out += RPUNCT[c]; i++; continue; }
        out += c; i++;
      }
      return out;
    }
    return {
      toScript, toLatin,
      WORD: { m: /[᠐-᠙ᠠ-ᡸ᠋-᠏‌‍ ]/, l: /[0-9A-Za-zŪūŮůŠšŽž'·|\-]/ },
      UI: {
        name: '满文', lang: 'mnc', schemes: ['穆麟德夫', '简便'], latinSub: 'ū、š、ž 也可以打 v、x、z',
        sample: 'manju gisun\n\nbi manju bithe be tacimbi.\nere bithe be hūla.\nabka na, alin bira.\nsain inenggi, šun biya.',
        notes: [
          '左右两栏都可以编辑，改动一侧，另一侧随即重写。拉丁一栏用穆麟德夫转写；没有特殊字母时，ū 打 v，š 打 x，ž 打 z。从满文生成拉丁转写时，按上方所选的写法输出：“简便”就是用 v、x、z 代替这三个字母。切换写法，会按满文一栏重新生成拉丁转写。',
          '汉语借词的特定字可以直接输入：k\' g\' h\' ts\' dz ž sy c\'y jy。ng 默认合成一个字母；如果要 n 和 g 分开写，中间加一个间隔号，如 n·g。',
          '满文按编码逐字对应。原文如果不是按满文的标准编码输入的，比如有些输入法借用了蒙古文字母，转出的拉丁字母可能有误。',
          '如果浏览器不支持竖排输入框，把满文切换为横排即可。']
      }
    };
  })();
  SIYI.converters.mnc = mnc;
})();
