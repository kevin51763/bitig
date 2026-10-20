/* 两栏编辑器的转换规则样板。这个文件不会被网站载入，只作参考。

   给一种新文字做两栏编辑器：
     1. 复制本文件，改名为该文字的英文名，如 js/converters/sogdian.js
     2. 把下面的 xx 换成 config/languages.js 里的简写，写好 toScript 和 toLatin
     3. 在 index.html 里“新加的转换规则放在这一行上面”那一行之上，加一行
          <script src="js/converters/sogdian.js"></script>
     4. 在 config/languages.js 里给这种语言写 editor: 'two-pane'，并设好 font、dir
   现成的例子可以看 chagatai.js（最简单，逐字母对照）和 manchu.js。 */
(function () {
  // 拉丁字母 → 原文字母，长的写在前面（先匹配 sh，再匹配 s）
  const L2S = [['sh', '?'], ['a', '?'], ['b', '?']];
  const S2L = new Map(L2S.map(([l, s]) => [s, l]));

  SIYI.converters.xx = {
    /* 拉丁转写 → 原文 */
    toScript(latin) {
      let out = '', i = 0;
      outer: while (i < latin.length) {
        for (const [l, s] of L2S) if (latin.startsWith(l, i)) { out += s; i += l.length; continue outer; }
        out += latin[i]; i++;
      }
      return out;
    },
    /* 原文 → 拉丁转写。scheme 是上方“拉丁写法”的选择：'sch' 或 'simple'（没有设 schemes 时总是 'sch'） */
    toLatin(script, scheme) {
      return Array.from(script).map(c => S2L.get(c) ?? c).join('');
    },
    /* 哪些字符算词的一部分，用于点词对应：m 是原文一侧，l 是拉丁一侧 */
    WORD: { m: /[\p{L}\p{M}]/u, l: /[A-Za-z'\-]/ },
    UI: {
      lang: 'xx',                 // 原文输入框的语言标记
      schemes: null,              // 两种拉丁写法时写 ['学术', '简便']，否则 null
      latinSub: '说明拉丁一栏的写法',
      sample: 'a b sh',           // “载入示例”给出的拉丁文字；或改写 sampleScript: '原文'
      notes: ['编辑器下方的说明，一段一项。']
    }
  };
})();
