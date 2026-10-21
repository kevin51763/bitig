/* 资料目录：参考书、字母表、论文、网上资源的链接。

   加一份资料：
     · 文件：放进 content/materials/（文件名用英文或拼音），再在下面写 file: 'content/materials/文件名'
     · 网上资源：不放文件，写 url: 'https://…'
     · 有版权、不能公开的书：放在南大网盘研究室的资料库里，url 写网盘里的文件地址，
       再写 access: '南大网盘，研究室成员登录后可看'；网盘里还没有的，只登记书名、作者、出版信息，列为“书目”
   PDF、图片会在浏览器里直接打开。

   注意：GitHub 上单个文件不能超过 100 MB；免费的 GitHub Pages 网站是公开的，
   有版权的书请不要放进来，可以只写出处或链接（见 README“资料与版权”一节）。

   每一项可以写：
     title   标题
     note    说明：作者、年代、用途等（可不写）
     langs   归入哪些语言（同范文）；不写就归入“综合”
     file    文件路径，或者
     url     网址
     access  怎样才能看到，如“南大网盘，研究室成员登录后可看”（可不写），显示在条目下方
     size    文件大小，如 '95 MB'（可不写；文件大时写上，读者点开前心里有数）
     added   加入的日期（可不写） */
SIYI.materials = [
  {
    title: '满洲实录',
    note: '中华书局 1986 年影印《清实录》第一册所收，八卷。满、汉、蒙三体合璧，附实录图。黑白扫描，共 426 页。',
    langs: ['mnc', 'mn', '汉文'],
    file: 'content/materials/manzhou-shilu.pdf',
    size: '95 MB',
    added: '2026-10-21',
  },

  {
    title: 'A Grammar of Orkhon Turkic',
    note: 'Talat Tekin 著。Bloomington: Indiana University; The Hague: Mouton, 1968（Uralic and Altaic Series 69）。本站如尼文的换写体系和转写规则依据此书。',
    langs: ['rn'],
    url: 'https://box.nju.edu.cn/lib/061249cb-cfac-433e-99b7-9af4048abafe/file/A%20grammar%20of%20orkhon%20turkic%20(Talat%20Tekin)%20(z-library.sk%2C%201lib.sk%2C%20z-lib.sk).pdf',
    access: '南大网盘，研究室成员登录后可看',
    added: '2026-10-21',
  },

  {
    title: '蒙古语简志',
    note: '道布编著。北京：民族出版社，1983 年（中国少数民族语言简志丛书）。仍在版权期内，不附全文。',
    langs: ['mn'],
    added: '2026-10-21',
  },

  {
    title: '满文初级教程',
    note: '双山、格根哈斯编。沈阳：辽宁民族出版社，2010 年。仍在版权期内，不附全文。',
    langs: ['mnc'],
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
