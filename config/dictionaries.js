/* 词典链接。
   intro   首页“查词”框里的说明
   list    具体的词典：首页“查词”框里列出全部；
           langs 写了哪些语言，那些语言的对照转写页标题下面也会出现这个链接。
           url 以 http 开头的是站外网站，在新标签页打开；以 # 开头的是本站栏目，如 '#dict-manhan'。 */
SIYI.dictionaries = {
  intro: '',   // 不需要就留空

  list: [
    // 下面三部是本站“词典”栏目里的词典，数据来自栗林均词典
    { name: '栗林均满汉词典', url: '#dict-manhan', langs: ['mnc'] },
    { name: '栗林均蒙汉词典', url: '#dict-menghan', langs: ['mn'] },
    { name: '栗林均满汉蒙词典', url: '#dict-manhanmeng', langs: ['mnc', 'mn'] },
    { name: 'Steinert 藏英词典', url: 'https://dictionary.christian-steinert.de/', langs: ['bo'] },

    // 例：再加一部词典，照上面的格式写一行
    // { name: '某某词典', url: 'https://…', langs: ['chg'] },
  ]
};
