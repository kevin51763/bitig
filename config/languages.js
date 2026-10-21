/* 网站涉及的语言。
   范文、资料、名句按这里的语言分类；有编辑器的语言还会出现在页头导航和首页的“对照转写”里。
   排列顺序就是导航和分类的顺序。

   每一项可以写：
     id         简写，只用小写英文字母。范文、资料、名句里的 langs: ['mnc'] 就是指这个；
                编辑器的网址是 #tool-加简写，如 #tool-mnc
     name       显示的名字
     short      页头导航里的短名（可不写，不写就用 name）
     editor     用哪种编辑器：
                  'three-pane'  回鹘文、如尼文专用的三栏编辑器
                  'two-pane'    通用两栏编辑器，需要 js/converters/ 里有同名简写的转换规则
                  不写          只用作分类，没有编辑器（比如暂时只放范文的语言）
     font       原文用的字体（CSS 写法）；字体文件的登记在 css/fonts.css
     dir        书写方向：'ltr' 从左到右，'rtl' 从右到左
     vertical   是否竖写：false 横写；true 竖写，字形直立、行从左到右（满文、蒙古文）；
                'rotated' 竖写，把横写的字整体左转 90°，自上而下读、行从左到右（回鹘文）。
                'rotated' 只用于首页名句和卡片，编辑器里另有开关
     scale      原文字号的比例，1 是标准大小
     card       首页卡片：glyph 是卡片上的示例字，desc 是一句说明
     hidden     写 hidden: true 就暂时不在页头和首页显示这个编辑器（网址仍可打开，名句照常显示）

   加一种只作分类的语言，最少只要写 { id: 'xx', name: '某某文' }。 */
SIYI.languages = [
  {
    id: 'ug', name: '回鹘文', editor: 'three-pane',
    font: 'var(--f-ug)', dir: 'rtl', vertical: 'rotated', scale: 1,
    card: { glyph: '𐽳𐽶𐽲𐽳𐽾', desc: '原文 · 换写 · 转写，三栏' }
  },

  {
    id: 'rn', name: '突厥如尼文', short: '如尼文', editor: 'three-pane', hidden: true,
    font: 'var(--f-rn)', dir: 'rtl', vertical: false, scale: 0.86,
    card: { glyph: '𐱅𐰇𐰼𐰜', desc: '依 Tekin 的换写体系，三栏' }
  },

  {
    id: 'mnc', name: '满文', editor: 'two-pane',
    font: 'var(--f-mong)', dir: 'ltr', vertical: true, scale: 1,
    card: { glyph: 'ᠮᠠᠨᠵᡠ', desc: '满文 · 穆麟德夫转写，两栏' }
  },

  {
    id: 'mn', name: '蒙古文', editor: 'two-pane',
    font: 'var(--f-mong)', dir: 'ltr', vertical: true, scale: 1,
    card: { glyph: 'ᠮᠣᠩᠭᠣᠯ', desc: '传统蒙古文 · 拉丁转写，两栏' }
  },

  {
    id: 'bo', name: '藏文', editor: 'two-pane',
    font: 'var(--f-bo)', dir: 'ltr', vertical: false, scale: 0.88, lineHeight: 2.1,
    card: { glyph: 'བོད', desc: '藏文 · 威利转写，两栏' }
  },

  {
    id: 'chg', name: '察合台文', editor: 'two-pane',
    font: 'var(--f-chg)', dir: 'rtl', vertical: false, scale: 0.9, lineHeight: 2,
    card: { glyph: 'تورکی', desc: '阿拉伯字母 · 逐字母换写，两栏' }
  },

  // 例：加一种只作分类的语言，去掉下一行开头的 // 即可。每一项末尾都留一个逗号，这样增删时不容易出错。
  // { id: 'txg', name: '西夏文' },
];
