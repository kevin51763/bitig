/* 词典链接。
   intro   首页“查词”框里的说明
   list    具体的词典：首页“查词”框里列出全部；
           langs 写了哪些语言，那些语言的对照转写页标题下面也会出现这个链接。 */
SIYI.dictionaries = {
  intro: '满文、蒙古文用栗林均编制的“言语资料检索系统”（日本东北大学东北亚研究中心）：满汉词典组收《满汉大辞典》《五体清文鉴》《御制增订清文鉴》等，蒙汉词典组收内蒙古大学《蒙汉词典》增订本，可用原文字母或拉丁字母检索。藏文用 Christian Steinert 的藏英词典。',

  list: [
    { name: '栗林均满汉词典', url: 'http://hkuri.cneas.tohoku.ac.jp/project1/manchu/list?groupId=11', langs: ['mnc'] },
    { name: '栗林均蒙汉词典', url: 'http://hkuri.cneas.tohoku.ac.jp/p01/', langs: ['mn'] },
    { name: 'Steinert 藏英词典', url: 'https://dictionary.christian-steinert.de/', langs: ['bo'] },

    // 例：再加一部词典，照上面的格式写一行
    // { name: '某某词典', url: 'https://…', langs: ['chg'] },
  ]
};
