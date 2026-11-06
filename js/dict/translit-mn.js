/* 蒙古文：栗林均词典的转写 ↔ 传统蒙古文，以及通行的学术转写。
   词典数据用栗林均的写法：G = γ，c = č，j = ǰ，S = š，O = ö，U = ü，E = ē，
   _ = 词末 a/e 前的分隔符（MVS），- = 附加成分前的窄空格（NNBSP），= 是词素分界（不写出），
   ' 是变体选择符（q' 表示写作 ᠭ 的 q），D、T 是带变体符的 d、t。
   输入时学术写法（γ č ǰ š ö ü ē，-a/-e）和栗林均写法都可以用。 */
(function (root) {
  var NNBSP = ' ', MVS = '᠎', FVS1 = '᠋', FVS2 = '᠌', FVS3 = '᠍';
  var ONE = {
    a: 'ᠠ', e: 'ᠡ', i: 'ᠢ', o: 'ᠣ', u: 'ᠤ', O: 'ᠥ', U: 'ᠦ', E: 'ᠧ',
    n: 'ᠨ', b: 'ᠪ', p: 'ᠫ', q: 'ᠬ', k: 'ᠬ', G: 'ᠭ', g: 'ᠭ',
    m: 'ᠮ', l: 'ᠯ', s: 'ᠰ', S: 'ᠱ', t: 'ᠲ', d: 'ᠳ', c: 'ᠴ', j: 'ᠵ',
    y: 'ᠶ', r: 'ᠷ', w: 'ᠸ', f: 'ᠹ', K: 'ᠺ', x: 'ᠻ', C: 'ᠼ', z: 'ᠽ',
    h: 'ᠾ', H: 'ᠾ', Q: 'ᡂ', N: 'ᠩ', A: 'ᢇ',
    D: 'ᠳ' + FVS1, T: 'ᠲ' + FVS1,
    // 学术写法
    'γ': 'ᠭ', 'ɣ': 'ᠭ', 'č': 'ᠴ', 'ǰ': 'ᠵ', 'š': 'ᠱ',
    'ö': 'ᠥ', 'ü': 'ᠦ', 'ē': 'ᠧ', v: 'ᠦ',
    '*': '‍', '+': '', '=': '',
    ',': '᠂', '.': '᠃', '!': '︕', '?': '︖'
  };
  var isLat = function (c) { return !!c && /[A-Za-zγɣčǰšöüē]/.test(c); };

  // classical 为真时按清代辞书的写法：元音后的 yi 写作 ᠢ᠋（不写 ᠶ）
  function toMongolian(src, classical) {
    var s = src.normalize('NFC'), out = '', i = 0;
    while (i < s.length) {
      var ch = s[i], nx = s[i + 1];
      if (classical && ch === 'y' && nx === 'i' && /[aeiouOUE\u00F6\u00FC\u0113]/.test(s[i - 1] || '')) {
        out += '\u1822' + FVS1; i += 2; continue;
      }
      if (s.substr(i, 3) === '(n)') { out += '(᠊ᠨ)'; i += 3; continue; }
      if (ch === 'n' && nx === 'g') { out += 'ᠩ'; i += 2; continue; }
      if (ch === '=' && nx === '_') { out += NNBSP; i += 2; continue; }
      if (ch === '_') { out += MVS; i++; continue; }
      if (ch === '-') {
        // 学术写法：词末 -a / -e 为 MVS，其余为附加成分前的窄空格
        if ((nx === 'a' || nx === 'e') && !isLat(s[i + 2]) && isLat(s[i - 1])) { out += MVS; i++; continue; }
        out += NNBSP; i++; continue;
      }
      if (ch === "'" || ch === '`') {
        var n = 1; while (s[i + n] === "'") n++;
        out += n >= 3 ? FVS3 : n === 2 ? FVS2 : FVS1; i += n; continue;
      }
      if ((ch === 'q' || ch === 'k') && nx === "'") { out += 'ᠭ'; i += 2; continue; }
      out += ONE[ch] !== undefined ? ONE[ch] : ch;
      i++;
    }
    return out;
  }

  // 栗林均写法 → 学术转写（用于显示）
  var ACAD = { G: 'γ', c: 'č', j: 'ǰ', S: 'š', O: 'ö', U: 'ü', E: 'ē',
    D: 'd', T: 't', K: 'k', x: 'kh', C: 'ts', H: 'h', Q: 'ch', N: 'ng', A: 'a' };
  function academic(s) {
    return s
      .replace(/q'/g, 'γ').replace(/k'/g, 'g')
      .replace(/=_/g, '-').replace(/_/g, '-').replace(/[=+*`]/g, '')
      .replace(/'/g, '')
      .replace(/[GcjSOUEDTKxCHQNA]/g, function (c) { return ACAD[c]; });
  }

  // 查询用的逐字归并：学术写法与栗林均写法、q 与 k、γ 与 g、ö 与 o、ü 与 u 视为相同，去掉标点
  var FOLD = { '\u03B3': 'g', '\u0263': 'g', '\u010D': 'c', '\u01F0': 'j', '\u0161': 's',
    '\u00F6': 'o', '\u00FC': 'u', '\u0113': 'e', q: 'k', v: 'u', x: 'k' };
  function foldChar(c) {
    var l = c.toLowerCase();
    if (FOLD[l]) return FOLD[l];
    return /[a-z ]/.test(l) ? l : '';
  }
  // 输入里的简便写法先改成学术写法：sh→š，ch→č，gh→γ
  function normInput(s) {
    return academic(s.normalize('NFC').replace(/sh/g, '\u0161').replace(/ch/g, '\u010D').replace(/gh/g, '\u03B3'));
  }

  root.MN = { toScript: toMongolian, display: academic, foldChar: foldChar, normInput: normInput };
  if (typeof module !== 'undefined') module.exports = { toMongolian: toMongolian, academic: academic };
})(typeof window !== 'undefined' ? window : globalThis);
