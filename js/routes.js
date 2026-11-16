/* 栏目的名字和网址怎样对应。

   每个栏目有一个名字，程序里都用它：
     home 首页   texts 文章目录   text-简写 单篇文章   materials 资料库   sayings 全部名句   contact 留言
     dict 词典（上次看的那部）   dict-词典名 某一部词典   tool-语言简写 该语言的编辑器
     dict-词典名/词头 词典里的一个词条（见下面的 split）

   网址有两种写法：
     · 带 # 的：名字前面加 #，如 #dict-manhan。没有服务器的地方（GitHub Pages 上的副本、本地预览）用这种。
     · 不带 # 的：如 /dict/manhan。bitig.ink 上用这种，要服务器配合（server/pages.js）。
       对应关系就是下面的 toPath 和 fromPath：
         /            home             /texts/简写      text-简写
         /texts       texts            /dict/词典名     dict-词典名
         /materials   materials        /tool/语言全名   tool-语言简写（全名是 config/languages.js 里的 slug）
         /sayings     sayings          /contact         contact
         /dict        dict

   这个文件浏览器和服务器都用，所以只能用最基本的写法，不能用 document、window 等浏览器才有的东西。
   两种网址公开后都是别人收藏的链接，不要改。 */
(function () {
  'use strict';

  /* 词典在不带 # 的网址里用的名字，和程序里的名字不同的才写。
     蒙汉满词典在程序和词库里一直叫 manhanmeng（改不得），网址里用 menghanman */
  var DICT_PATH = { manhanmeng: 'menghanman' };
  var DICT_NAME = {};
  for (var k in DICT_PATH) DICT_NAME[DICT_PATH[k]] = k;

  var WORD = /^[A-Za-z0-9_-]+$/;   // 简写、词典名、语言全名里可以用的字符
  var PLAIN = { texts: 1, materials: 1, sayings: 1, dict: 1, contact: 1 };

  /* 词典里的一个词条也有自己的名字和网址：在词典的名字后面加 / 和词头。
       名字  dict-manhan/abka      网址  /dict/manhan/abka  或  #dict-manhan/abka
     词头用词库里的写法（dict/data/*.idx.txt 每行的第一栏，如满文的 hvwa = hūwa），它在一部词典里不重复。
     词头里的空格等字符在网址里要转成 %20 这样的写法，下面的 encodeURIComponent 管这件事。 */
  function split(name) {
    var k = name.indexOf('/');
    return k < 0 ? [name, ''] : [name.slice(0, k), name.slice(k + 1)];
  }
  function okWord(w) { return w.length > 0 && w.length <= 500 && !/[\u0000-\u001f\u007f]/.test(w); }

  /* 栏目的名字 → 不带 # 的网址。langs 是语言清单（config/languages.js）。认不出的名字返回 null */
  function toPath(name, langs) {
    var sp = split(name), word = sp[1];
    if (word && (sp[0].indexOf('dict-') !== 0 || !okWord(word))) return null;
    var p = basePath(sp[0], langs);
    return p && word ? p + '/' + encodeURIComponent(word) : p;
  }
  function basePath(name, langs) {
    if (name === 'home') return '/';
    if (PLAIN[name] === 1) return '/' + name;
    var m = /^(text|dict|tool)-(.+)$/.exec(name);
    if (!m || !WORD.test(m[2])) return null;
    if (m[1] === 'text') return '/texts/' + m[2];
    if (m[1] === 'dict') return '/dict/' + (DICT_PATH[m[2]] || m[2]);
    for (var i = 0; i < langs.length; i++) if (langs[i].id === m[2]) return '/tool/' + (langs[i].slug || langs[i].id);
    return null;
  }

  /* 不带 # 的网址 → 栏目的名字。末尾多一个 / 也认。不是栏目的网址返回 null */
  function fromPath(path, langs) {
    var p = String(path).split('/').filter(Boolean), word = '';
    if (!p.length) return 'home';
    if (p.length === 3 && p[0] === 'dict') {   // /dict/词典名/词头
      try { word = decodeURIComponent(p[2]); } catch (e) { return null; }
      if (!okWord(word)) return null;
      p.pop();
    }
    var name = baseName(p, langs);
    return name && word ? name + '/' + word : name;
  }
  function baseName(p, langs) {
    if (p.length > 2 || (p[1] && !WORD.test(p[1]))) return null;
    if (p.length === 1) return PLAIN[p[0]] === 1 ? p[0] : null;
    if (p[0] === 'texts') return 'text-' + p[1];
    if (p[0] === 'dict') return 'dict-' + (DICT_NAME[p[1]] || p[1]);
    if (p[0] !== 'tool') return null;
    var i;
    for (i = 0; i < langs.length; i++) if (langs[i].slug === p[1]) return 'tool-' + langs[i].id;
    for (i = 0; i < langs.length; i++) if (langs[i].id === p[1]) return 'tool-' + langs[i].id;   // 写了简写也认
    return null;
  }

  /* 栏目的名字 ↔ 带 # 的网址。只有词条的词头要转写，别的名字原样加 # */
  function toHash(name) {
    var sp = split(name);
    return '#' + sp[0] + (sp[1] ? '/' + encodeURIComponent(sp[1]) : '');
  }
  function fromHash(hash) {
    var sp = split(String(hash).replace(/^#/, ''));
    if (!sp[1]) return sp[0];
    try { return sp[0] + '/' + decodeURIComponent(sp[1]); } catch (e) { return sp[0]; }
  }

  var api = { toPath: toPath, fromPath: fromPath, toHash: toHash, fromHash: fromHash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;   // 服务器（Node.js）
  else globalThis.SIYI.routes = api;                                          // 浏览器
})();
