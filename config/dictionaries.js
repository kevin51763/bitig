/* 词典链接。
   intro   首页“查词”框里的说明
   list    具体的词典：首页“查词”框里列出全部；
           langs 写了哪些语言，那些语言的对照转写页标题下面也会出现这个链接。 */
SIYI.dictionaries = {
  intro: '',   // 不需要就留空

  list: [
    { name: '栗林均满汉词典', url: 'http://hkuri.cneas.tohoku.ac.jp/project1/manchu/list?groupId=11', langs: ['mnc'] },
    { name: '栗林均蒙汉词典', url: 'http://hkuri.cneas.tohoku.ac.jp/p01/', langs: ['mn'] },
    { name: 'Steinert 藏英词典', url: 'https://dictionary.christian-steinert.de/', langs: ['bo'] },

    // 例：再加一部词典，照上面的格式写一行
    // { name: '某某词典', url: 'https://…', langs: ['chg'] },
  ]
};
