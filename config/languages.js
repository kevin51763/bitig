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
     card       首页卡片：glyph 是卡片上的示例字
     hidden     写 hidden: true 就暂时不在页头和首页显示这个编辑器（网址仍可打开，名句照常显示）
     wip        写 wip: true 表示编辑器还在开发中：不进页头导航和首页的“对照转写”，
                改列在首页最底下的“开发中”一栏；编辑器页面顶上显示一条提醒，
                文字见 config/site.js 的 wipNote。也可以写 wip: '……' 给这种语言单独写提醒。
                开发完成后删掉这一项即可

   加一种只作分类的语言，最少只要写 { id: 'xx', name: '某某文' }。 */
SIYI.languages = [
  {
    id: 'ug', name: '回鹘文', editor: 'three-pane', wip: true,
    font: 'var(--f-ug)', dir: 'rtl', vertical: 'rotated', scale: 1,
    card: { glyph: '𐽳𐽶𐽲𐽳𐽾' }
  },

  {
    id: 'rn', name: '突厥如尼文', short: '如尼文', editor: 'three-pane', hidden: true,
    font: 'var(--f-rn)', dir: 'rtl', vertical: false, scale: 0.86,
    card: { glyph: '𐱅𐰇𐰼𐰜' }
  },

  {
    id: 'mnc', name: '满文', editor: 'two-pane',
    font: 'var(--f-mong)', dir: 'ltr', vertical: true, scale: 1,
    card: { glyph: 'ᠮᠠᠨᠵᡠ' }
  },

  {
    id: 'mn', name: '蒙古文', editor: 'two-pane',
    font: 'var(--f-mong)', dir: 'ltr', vertical: true, scale: 1,
    card: { glyph: 'ᠮᠣᠩᠭᠣᠯ' }
  },

  {
    id: 'bo', name: '藏文', editor: 'two-pane',
    font: 'var(--f-bo)', dir: 'ltr', vertical: false, scale: 0.88, lineHeight: 2.1,
    card: { glyph: 'བོད' }
  },

  {
    id: 'chg', name: '察合台文', editor: 'two-pane', wip: true,
    font: 'var(--f-chg)', dir: 'rtl', vertical: false, scale: 0.9, lineHeight: 2,
    card: { glyph: 'تورکی' }
  },

  // 例：加一种只作分类的语言，去掉下一行开头的 // 即可。每一项末尾都留一个逗号，这样增删时不容易出错。
  // { id: 'txg', name: '西夏文' },
];
