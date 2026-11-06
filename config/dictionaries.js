/* 词典链接。
   intro   首页“查词”框里的说明
   list    具体的词典：首页“查词”框里列出全部；
           langs 写了哪些语言，那些语言的对照转写页标题下面也会出现这个链接。
           url 以 http 开头的是站外网站，在新标签页打开；不以 http 开头的是本站页面。 */
SIYI.dictionaries = {
  intro: '',   // 不需要就留空

  list: [
    // 下面三部是本站自己的在线词典（dict/ 文件夹），数据来自栗林均词典
    { name: '栗林均满汉词典', url: 'dict/manhan.html', langs: ['mnc'] },
    { name: '栗林均蒙汉词典', url: 'dict/menghan.html', langs: ['mn'] },
    { name: '栗林均满汉蒙词典', url: 'dict/manhanmeng.html', langs: ['mnc', 'mn'] },
    { name: 'Steinert 藏英词典', url: 'https://dictionary.christian-steinert.de/', langs: ['bo'] },

    // 例：再加一部词典，照上面的格式写一行
    // { name: '某某词典', url: 'https://…', langs: ['chg'] },
  ]
};
