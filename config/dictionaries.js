/* 词典链接。
   intro   首页“查词”框里的说明
   list    具体的词典：首页“查词”框里列出全部；
           langs 写了哪些语言，那些语言的对照转写页标题下面也会出现这个链接。
           url 以 http 开头的是站外网站，在新标签页打开；以 # 开头的是本站栏目，如 '#dict-manhan'。
           glyph 首页卡片左边的示例字，写成 [['字', '语言代号'], …]，字体和竖排照 config/languages.js 里那种语言；
                 可以并排放几种文字。不写就用书本图标。 */
SIYI.dictionaries = {
  intro: '',   // 不需要就留空

  list: [
    // 下面是本站“词典”栏目里的词典：前四部数据来自栗林均词典，藏文词典数据来自 Christian Steinert 藏文词典
    // 示例字：bithe（满文“书”）、bičig（蒙古文“书”）、gisun 与 üge（满、蒙“词”）、buleku（满文“鉴”）、tshig mdzod（藏文“词典”）
    { name: '栗林均满汉词典', url: '#dict-manhan', langs: ['mnc'], glyph: [['ᠪᡳᡨᡥᡝ', 'mnc']] },
    { name: '栗林均蒙汉词典', url: '#dict-menghan', langs: ['mn'], glyph: [['ᠪᠢᠴᠢᠭ', 'mn']] },
    { name: '栗林均蒙汉满词典', url: '#dict-manhanmeng', langs: ['mnc', 'mn'], glyph: [['ᡤᡳᠰᡠᠨ', 'mnc'], ['ᠦᠭᠡ', 'mn']] },
    { name: '栗林均清文鉴词典', url: '#dict-qingwenjian', langs: ['mnc', 'mn'], glyph: [['ᠪᡠᠯᡝᡴᡠ', 'mnc']] },
    { name: 'Steinert 藏文词典', url: '#dict-tibetan', langs: ['bo'], glyph: [['ཚིག་མཛོད', 'bo']] },

    // 例：再加一部词典，照上面的格式写一行
    // { name: '某某词典', url: 'https://…', langs: ['chg'] },
  ]
};
