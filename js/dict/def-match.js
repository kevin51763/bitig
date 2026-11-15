/* 释义反查的匹配规则：输入汉字时，判断一个词条的释义里有没有要找的词，相符到什么程度。

   这个文件浏览器和服务器都用，规则只写这一份，两边查出的结果才一样：
     · 浏览器里由 js/dict/core.js 调用（释义已整份读入时，在浏览器里反查）；
     · bitig.ink 的服务器上由 server/dict.js 调用（平时的反查在服务器上做）。
   所以这里只能用最基本的写法，不能用 document、window 等浏览器才有的东西。

   词库里一个词条的释义是一行：义项之间用 \x1e 隔开，义项内各栏用 \x1f 隔开，
   第 0 栏是词典序号（见 dict/tools/build_data.py）。 */
(function () {
  'use strict';
  // 把释义切成一个个词的标点
  var SEG = /[①-⑳；;，,。．：:、！!？?\s\[\]〔〕<>〈〉（）()［］《》・\/]+/;
  // 括号里的词类、类别标注（〔名〕、（马）、〈史〉等）不算释义本身
  var NOTE = /〈[^〉]*〉|<[^>]*>|〔[^〕]*〕|（[^）]*）|\([^)]*\)|\[[^\]]*\]/g;

  /* 把输入的话按空格拆成几个关键词 */
  function terms(q) { return String(q).split(/\s+/).filter(Boolean); }

  /* 一个词条与关键词相符的程度。
       raw      这个词条的释义（词库里的一行）
       terms    关键词，几个词要同时出现在同一个义项里
       fields   义项的第几栏是释义文字，如 [3]；有几栏就连起来算
       isOn(d)  第 d 部词典有没有勾选
     返回 0 到 3，越小越相符：0 释义的第一个词就是它，1 释义里有一个词就是它，
     2 有一个词以它开头，3 只是出现在释义里。不相符返回 -1。 */
  function score(raw, terms, fields, isOn) {
    var t, k, n;
    for (t = 0; t < terms.length; t++) if (raw.indexOf(terms[t]) < 0) return -1;
    var ss = raw.split('\x1e'), best = 9;
    for (k = 0; k < ss.length; k++) {
      var f = ss[k].split('\x1f');
      if (!isOn(+f[0] || 0)) continue;
      var txt = '';
      for (n = 0; n < fields.length; n++) txt += (n ? ' ' : '') + (f[fields[n]] == null ? '' : f[fields[n]]);
      var all = true;
      for (t = 0; t < terms.length; t++) if (txt.indexOf(terms[t]) < 0) { all = false; break; }
      if (!all) continue;
      var segs = txt.replace(NOTE, ' ').split(SEG).filter(Boolean), sc = 3, first = terms[0];
      if (segs[0] === first) sc = 0;
      else if (segs.indexOf(first) >= 0) sc = 1;
      else {
        for (n = 0; n < segs.length; n++) if (segs[n].indexOf(first) === 0) { sc = 2; break; }
      }
      if (sc < best) best = sc;
    }
    return best < 9 ? best : -1;
  }

  var api = { terms: terms, score: score };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;   // 服务器（Node.js）
  else { window.SIYI = window.SIYI || {}; window.SIYI.defMatch = api; }       // 浏览器
})();
