/* 资料目录：参考书、字母表、论文、网上资源的链接。

   加一份资料：
     · 文件：放进 content/materials/（文件名用英文或拼音），再在下面写 file: 'content/materials/文件名'
     · 网上资源：不放文件，写 url: 'https://…'
     · 有版权的书、大文件：放在南大网盘研究室的资料库里，url 写网盘里的文件地址
     · 暂时没有文件的：file 和 url 都不写，只登记书名和出版信息，列为“书目”
   PDF、图片会在浏览器里直接打开。

   注意：GitHub 上单个文件不能超过 100 MB；免费的 GitHub Pages 网站是公开的，
   有版权的书请不要放进来，可以只写出处或链接（见 README“资料与版权”一节）。

   每一项可以写：
     title   标题
     note    说明：作者、年代、用途等（可不写）
     langs   归入哪些语言（同范文）；不写就归入“综合”
     file    文件路径，或者
     url     网址
     size    文件大小，如 '95 MB'（可不写；文件大时写上，读者点开前心里有数）
     added   加入的日期（可不写） */
SIYI.materials = [
  {
    title: '满洲实录',
    note: '中华书局 1986 年影印《清实录》第一册所收，八卷。满、汉、蒙三体合璧，附实录图。黑白扫描，共 426 页。',
    langs: ['mnc', 'mn', '汉文'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/%E3%80%8A%E6%BB%A1%E6%B4%B2%E5%AE%9E%E5%BD%95%E3%80%8B.pdf',
    size: '95 MB',
    added: '2026-10-21',
  },

  {
    title: 'A Grammar of Orkhon Turkic',
    note: 'Talat Tekin 著。Bloomington: Indiana University; The Hague: Mouton, 1968（Uralic and Altaic Series 69）。本站如尼文的换写体系和转写规则依据此书。',
    langs: ['rn'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/A%20grammar%20of%20orkhon%20turkic%20(Talat%20Tekin)%20(z-library.sk%2C%201lib.sk%2C%20z-lib.sk).pdf',
    added: '2026-10-21',
  },

  {
    title: '蒙古语简志',
    note: '道布编著。北京：民族出版社，1983 年（中国少数民族语言简志丛书）。',
    langs: ['mn'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/%E8%92%99%E5%8F%A4%E8%AF%AD%E7%AE%80%E5%BF%97.pdf',
    added: '2026-10-21',
  },

  {
    title: '满文初级教程',
    note: '双山、格根哈斯编。沈阳：辽宁民族出版社，2010 年。',
    langs: ['mnc'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/%E5%88%9D%E5%AD%A6%E6%BB%A1%E8%AF%AD%E6%95%99%E7%A8%8B.pdf',
    added: '2026-10-21',
  },

  {
    title: 'An Introduction to Chaghatay: A Graded Textbook for Reading Central Asian Sources',
    note: 'Eric Schluessel 著。Ann Arbor: Maize Books, 2018。',
    langs: ['chg'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/Eric%20Schluessel-An%20Introduction%20to%20Chaghatay.pdf',
    added: '2026-10-21',
  },

  {
    title: 'A Sketch of the Turki Language as Spoken in Eastern Turkistan, Part II: Vocabulary, Turki-English',
    note: 'Robert Barkley Shaw 编。Calcutta: Baptist Mission Press, 1880。',
    langs: ['chg'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/Shaw%E7%BC%96%E5%AF%9F%E5%90%88%E5%8F%B0%E6%96%87%E8%8B%B1%E6%96%87%E8%AF%8D%E6%B1%87%E5%AF%B9%E7%85%A7-A%20Sketch%20of%20the%20Turki%20Language2%20as%20spoken%20in%20Eastern%20Turkistan.%20Part%20II.%20Vocabulary%20Turki-English%20by%20Shaw%20R.B..pdf',
    added: '2026-10-21',
  },

  {
    title: 'Chagatay Manual',
    note: 'János Eckmann 著。Bloomington: Indiana University; The Hague: Mouton, 1966（Uralic and Altaic Series 60）。',
    langs: ['chg'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/%E5%9F%83%E5%85%8B%E6%9B%BC-Chagatay%20manual%20by%20Eckmann%20J%C3%A1nos.%20(z-lib.org).pdf',
    added: '2026-10-21',
  },

  {
    title: '维汉大词典',
    note: '新疆维吾尔自治区语言文字工作委员会编。北京：民族出版社，2006 年。',
    langs: ['chg', '维吾尔语'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/%E7%BB%B4%E6%B1%89%E5%A4%A7%E8%AF%8D%E5%85%B8.pdf',
    added: '2026-10-21',
  },

  // 例：
  // {
  //   title: '回鹘文字母表',
  //   note: '自制，按 Unicode 码位排列',
  //   langs: ['ug'],
  //   file: 'content/materials/ougr-alphabet.pdf',
  // },

];
