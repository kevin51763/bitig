/* 传统蒙古文 ↔ 拉丁转写（学术转写与简便写法）。
   两栏编辑器（js/editors/two-pane.js）通用的转换接口，写法见 js/converters/_template.js。 */
(function () {
  const NNBSP = ' ', MVS = '᠎';
  const mn = (() => {
    const MAP = [
      ['ng', 'ᠩ'], ['sh', 'ᠱ'], ['ch', 'ᠴ'], ['kh', 'ᠬ'], ['gh', 'ᠭ'], ['oe', 'ᠥ'], ['ue', 'ᠦ'],
      ['a', 'ᠠ'], ['e', 'ᠡ'], ['i', 'ᠢ'], ['o', 'ᠣ'], ['u', 'ᠤ'], ['ö', 'ᠥ'], ['ü', 'ᠦ'], ['v', 'ᠦ'],
      ['n', 'ᠨ'], ['b', 'ᠪ'], ['p', 'ᠫ'], ['q', 'ᠬ'], ['k', 'ᠬ'], ['h', 'ᠬ'], ['γ', 'ᠭ'], ['ɣ', 'ᠭ'], ['g', 'ᠭ'],
      ['m', 'ᠮ'], ['l', 'ᠯ'], ['s', 'ᠰ'], ['š', 'ᠱ'], ['x', 'ᠱ'], ['t', 'ᠲ'], ['d', 'ᠳ'], ['č', 'ᠴ'], ['c', 'ᠴ'],
      ['ǰ', 'ᠵ'], ['j', 'ᠵ'], ['y', 'ᠶ'], ['r', 'ᠷ'], ['w', 'ᠸ'], ['f', 'ᠹ'], ['z', 'ᠽ'], ['ē', 'ᠧ']];
    const PUNCT = { ',': '᠂', '.': '᠃', ':': '᠄', ';': '᠂' };
    function toScript(src) {
      const s = src.normalize('NFC').toLowerCase(); let out = '', i = 0;
      outer: while (i < s.length) {
        const ch = s[i];
        if (ch === "'") { i++; continue; }
        if (ch === '-') {
          const m = s.slice(i + 1).match(/^([ae])(?![a-zöüγɣčǰšē])/);
          if (m) { out += MVS + (m[1] === 'a' ? 'ᠠ' : 'ᠡ'); i += 2; continue; }
          out += NNBSP; i++; continue;
        }
        if (ch >= '0' && ch <= '9') { out += String.fromCharCode(0x1810 + (+ch)); i++; continue; }
        if (PUNCT[ch]) { out += PUNCT[ch]; i++; continue; }
        for (const [k, v] of MAP) { if (s.startsWith(k, i)) { out += v; i += k.length; continue outer; } }
        out += ch; i++;
      }
      return out;
    }
    const R = { 'ᠠ': ['a', 'a'], 'ᠡ': ['e', 'e'], 'ᠢ': ['i', 'i'], 'ᠣ': ['o', 'o'], 'ᠤ': ['u', 'u'], 'ᠥ': ['ö', 'ö'], 'ᠦ': ['ü', 'ü'], 'ᠧ': ['ē', 'ē'],
      'ᠨ': ['n', 'n'], 'ᠩ': ['ng', 'ng'], 'ᠪ': ['b', 'b'], 'ᠫ': ['p', 'p'], 'ᠮ': ['m', 'm'], 'ᠯ': ['l', 'l'], 'ᠰ': ['s', 's'],
      'ᠱ': ['š', 'sh'], 'ᠲ': ['t', 't'], 'ᠳ': ['d', 'd'], 'ᠴ': ['č', 'ch'], 'ᠵ': ['ǰ', 'j'], 'ᠶ': ['y', 'y'], 'ᠷ': ['r', 'r'],
      'ᠸ': ['w', 'w'], 'ᠹ': ['f', 'f'], 'ᠺ': ['k', 'k'], 'ᠻ': ['kh', 'kh'], 'ᠼ': ['ts', 'ts'], 'ᠽ': ['z', 'z'], 'ᠾ': ['h', 'h'],
      'ᠿ': ['zr', 'zr'], 'ᡀ': ['lh', 'lh'], 'ᡁ': ['zh', 'zh'], 'ᡂ': ['ch', 'ch'] };
    const DROP = /[᠋-᠍᠏‌‍᠀]/g;
    const RPUNCT = { '᠁': '…', '᠂': ',', '᠃': '.', '᠄': ':', '᠅': '::', '᠈': ',', '᠉': '.' };
    const DIGRAPH = new Set(['ng', 'sh', 'ch', 'kh', 'gh', 'oe', 'ue']);
    const isLetter = c => c >= 'ᠠ' && c <= 'ᡂ';
    function toLatin(src, scheme) {
      const s = src.normalize('NFC').replace(DROP, ''); const k = scheme === 'simple' ? 1 : 0; let out = '', i = 0;
      while (i < s.length) {
        const c = s[i];
        if (isLetter(c)) {
          let j = i; while (j < s.length && isLetter(s[j])) j++;
          const w = s.slice(i, j), back = /[ᠠᠣᠤ]/.test(w); let lw = '';
          for (const ch of w) {
            let t;
            if (ch === 'ᠬ') t = k ? 'h' : (back ? 'q' : 'k');
            else if (ch === 'ᠭ') t = k ? 'g' : (back ? 'γ' : 'g');
            else t = R[ch] ? R[ch][k] : ch;
            if (lw && DIGRAPH.has(lw.slice(-1) + t[0])) lw += "'";
            lw += t;
          }
          out += lw; i = j; continue;
        }
        if (c === MVS || c === NNBSP) { out += '-'; i++; continue; }
        if (c >= '᠐' && c <= '᠙') { out += String(c.charCodeAt(0) - 0x1810); i++; continue; }
        if (RPUNCT[c]) { out += RPUNCT[c]; i++; continue; }
        out += c; i++;
      }
      return out;
    }
    return {
      toScript, toLatin,
      WORD: { m: /[᠐-᠙ᠠ-ᡂ᠋-᠏‌‍ ]/, l: /[0-9A-Za-zÖÜöüγɣČčǰŠšĒē'\-]/ },
      UI: {
        name: '蒙古文', lang: 'mn-Mong', schemes: ['学术', '简便'], latinSub: '学术、简便两种写法都能输入',
        sample: 'mongγol-un niγuča tobčiyan\n\nsayin bayin-a uu.\nköke tngri, aγula usu.\nmongγol kele bičig.\nkökeqota, ulaγanbaγatur.',
        notes: [
          '左右两栏都可以编辑，改动一侧，另一侧随即重写。拉丁一栏接受学术转写（q γ č ǰ š）和简便写法（h g ch j sh），也接受 oe、ue、v、gh、x 等替代写法；从蒙古文生成拉丁转写时，按上方所选的写法输出。切换写法，会按蒙古文一栏重新生成拉丁转写。',
          '词尾分写的 a、e 在拉丁一栏写作 -a、-e；附加成分前用连字符，如 mongγol-un；撇号把字母隔开，如 n\'g。蒙古文按编码逐字对应，原文若是按字形编码的（例如把 u 编成 o），转出的拉丁字母会跟着出错。',
          '如果浏览器不支持竖排输入框，把蒙古文切换为横排即可。']
      }
    };
  })();
  SIYI.converters.mn = mn;
})();
