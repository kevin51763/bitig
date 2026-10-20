/* 范文目录。
   每篇范文是 content/texts/ 里的一个完整 HTML 文件（比如请 AI 做好的对照页），这里登记它的标题和分类。

   加一篇范文：
     1. 把 HTML 文件放进 content/texts/，文件名用英文或拼音，如 yugong.html
     2. 在下面的列表末尾照样子加一项
   新加的写在最后，首页“新近范文”从最后往前取。

   每一项可以写：
     id        简写，只用英文字母、数字和连字符；网址是 #text-加简写。一旦公开就别再改，免得旧链接失效
     title     标题
     subtitle  副标题或出处（可不写）
     langs     归入哪些语言，写 config/languages.js 里的简写；不在那里的语言直接写中文名，如 '汉文'
     file      HTML 文件的路径
     added     加入的日期（可不写） */
SIYI.texts = [
  {
    id: 'yugong',
    title: '愚公移山',
    subtitle: '传统蒙古文与满文逐词对照',
    langs: ['mnc', 'mn'],
    file: 'content/texts/yugong.html',
    added: '2026-10-20',
  },

];
