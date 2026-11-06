/* 满文：栗林均词典的转写 ↔ 满文，以及穆麟德夫式正式转写。
   词典数据的写法：v（或 @）= ū，S（或 x）= š，K = k'，R = ž；ng、dz、ts、cy、jy 各算一个字母；
   ' 是变体选择符（如藏文、梵文译音词里的 k'、g'）。
   输入时也可以直接用正式写法 ū、š、ž、ts'、c'y、zy。 */
(function (root) {
  var M = {
    a: 'ᠠ', e: 'ᡝ', i: 'ᡳ', o: 'ᠣ', u: 'ᡠ', v: 'ᡡ', '@': 'ᡡ',
    n: 'ᠨ', k: 'ᡴ', g: 'ᡤ', h: 'ᡥ', b: 'ᠪ', p: 'ᡦ',
    s: 'ᠰ', S: 'ᡧ', x: 'ᡧ', t: 'ᡨ', d: 'ᡩ', l: 'ᠯ', m: 'ᠮ',
    c: 'ᠴ', j: 'ᠵ', y: 'ᠶ', r: 'ᡵ', f: 'ᡶ', w: 'ᠸ',
    K: 'ᠺ', R: 'ᡰ', "'": '᠋',
    'ū': 'ᡡ', 'š': 'ᡧ', 'ž': 'ᡰ',
    ',': '᠈', '.': '᠉', '!': '︕', '?': '︖', '-': ' '
  };
  var MULTI3 = { "ts'": 'ᡮ', "c'y": 'ᡱᠶ' };
  var MULTI = { zy: 'ᡷᠶ', ng: 'ᠩ', dz: 'ᡯ', ts: 'ᡮ', cy: 'ᡱᠶ', jy: 'ᡷᠶ' };

  function toManchu(src) {
    var out = '', i = 0;
    while (i < src.length) {
      var three = src.substr(i, 3);
      if (MULTI3[three]) { out += MULTI3[three]; i += 3; continue; }
      var two = src.substr(i, 2);
      if (MULTI[two]) { out += MULTI[two]; i += 2; continue; }
      var ch = src[i];
      out += M[ch] !== undefined ? M[ch] : ch;
      i++;
    }
    return out;
  }

  // 数据写法 → 穆麟德夫式：v/@→ū，S/x→š，K→k'，R→ž，ts→ts'，cy→c'y，jy→zy
  function formal(s) {
    return s.replace(/ts(?!')/g, "ts'").replace(/cy/g, "c'y").replace(/jy/g, 'zy')
      .replace(/[v@]/g, 'ū').replace(/[Sx]/g, 'š').replace(/K/g, "k'").replace(/R/g, 'ž');
  }

  // 查询用的逐字归并：ū 与 u、š 与 s、ž 与 r 视为相同，去掉标点
  var FOLD = { 'ū': 'u', v: 'u', '@': 'u', 'š': 's', x: 's', 'ž': 'r' };
  function foldChar(c) {
    var l = c.toLowerCase();
    if (FOLD[c] || FOLD[l]) return FOLD[c] || FOLD[l];
    return /[a-z ]/.test(l) ? l : '';
  }

  root.MNC = { toScript: toManchu, display: formal, foldChar: foldChar };
  root.toManchu = toManchu;
  if (typeof module !== 'undefined') module.exports = { toManchu: toManchu, formal: formal };
})(typeof window !== 'undefined' ? window : globalThis);
