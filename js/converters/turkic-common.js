/* 回鹘文、突厥如尼文两套转换共用的工具：分词、编辑距离、碑文词形表。
   回鹘文的规则在 old-uyghur.js，如尼文的规则在 old-turkic.js。 */
(function () {
  const C = String.fromCodePoint;
  const isMark = c => /\p{M}/u.test(c);
  const LAT_WORD = /[\p{L}\p{M}\p{N}'’ʼʿ‌‍]/u;

  function tokenize(text, re) {
    const out = []; let i = 0, cur = null;
    for (const ch of text) {
      const w = re.test(ch);
      if (cur && cur.w === w) { cur.t += ch; cur.e += ch.length; }
      else { cur = { w, t: ch, s: i, e: i + ch.length }; out.push(cur); }
      i += ch.length;
    }
    return out;
  }
  const words = (text, re) => tokenize(text, re).filter(t => t.w).map(t => t.t);
  const mapText = (text, re, wf, sf) => tokenize(text, re).map(t => t.w ? wf(t.t) : sf(t.t)).join('');
  function editDist(a, b) {
    const m = a.length, n = b.length; let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const CORPUS_RAW = SIYI.data.turkicCorpus.split(' ');
  // 整理转写里的异体字母；判断一个转写词是后元音词还是前元音词（两套规则都要用）
  function cleanTr(word) {
    const rep = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u', 'ǖ': 'ü', 'ȫ': 'ö', 'ǟ': 'ä', 'ı': 'ï',
      'ğ': 'γ', 'ġ': 'γ', 'ɣ': 'γ', 'ḳ': 'q', 'ç': 'č', 'ş': 'š', 'â': 'a', 'ê': 'e' };
    return Array.from(word.normalize('NFC').toLowerCase()).map(c => rep[c] ?? c).join('').replace(/̄/g, '');
  }
  const VOW = 'aäeïioöuü';
  const isBackTr = w => /[aïou]/.test(w) ? true : /[äeiöü]/.test(w) ? false : true;
  SIYI.turkic = { C, isMark, LAT_WORD, tokenize, words, mapText, editDist, CORPUS_RAW, VOW, isBackTr, cleanTr,
    CORPUS_SIZE: CORPUS_RAW.length, MODES: {} };
})();
