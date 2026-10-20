# 四译馆

回鹘文、突厥如尼文、满文、蒙古文、藏文、察合台文的对照编辑，以及范文、资料和名句。

这是一个纯静态网站：没有数据库，也不需要编译。所有内容都是文件夹里的文件，改了文件、传到 GitHub，网站就更新了。

---

## 一、文件夹里有什么

```
index.html            页面骨架。平时不用动，只有加新的转换规则时要加一行
config/               网站的设置
  site.js               网站名、首页介绍、页脚
  languages.js          语言清单：名字、导航顺序、用哪种编辑器、字体、书写方向
  dictionaries.js       词典链接
content/              网站的内容
  texts.js              范文目录
  texts/                范文的 HTML 文件
  materials.js          资料目录
  materials/            资料文件（PDF、图片等）
  sayings.js            首页轮换的名句
css/                  样式
  theme.css             配色和各种文字的字体（想改颜色就改这里）
  fonts.css             字体文件的登记
  其余                  各部分的版式，一般不用动
fonts/                字体文件，随网站发布，国内也能正常显示
js/                   程序
  converters/           各文字的转换规则，一种文字一个文件
  editors/              三栏、两栏两种编辑器
  pages/                首页、范文、资料、名句各栏目
  data/                 碑文词形表
```

平时要改的只有 `config/` 和 `content/` 两个文件夹。

这些文件可以用任何文本编辑器打开，比如 VS Code、记事本，也可以直接在 GitHub 网页上改。文件里每一段前面都有中文说明。

---

## 二、在自己电脑上预览

**最简单**：双击 `index.html`，用浏览器打开就能看。

**更完整**：双击打开时，有两处会打折扣：范文框的高度不会随正文自动调整，写错文件时提示里也看不到具体行号。要和网上完全一样，在这个文件夹里打开终端，运行：

```
python3 -m http.server 8000
```

然后在浏览器里打开 http://localhost:8000 。Windows 上把 `python3` 换成 `python`。

---

## 三、日常维护

### 加一篇范文

1. 把 HTML 文件放进 `content/texts/`。文件名用英文或拼音，比如 `daxue.html`。
2. 打开 `content/texts.js`，在列表末尾照现有的样子加一项：

```js
  {
    id: 'daxue',
    title: '大学',
    subtitle: '满汉合璧本首章',
    langs: ['mnc', '汉文'],
    file: 'content/texts/daxue.html',
    added: '2026-11-01',
  },
```

- `langs` 里写语言简写，简写在 `config/languages.js` 里查；清单里没有的语言直接写中文名，比如 `'汉文'`。
- `id` 会成为这篇范文的网址（`#text-daxue`），公开之后最好别再改。
- 新的写在最后，首页“新近范文”从最后往前取。

**请 AI 做范文时**，可以把下面这段要求一起交给它：

> 做成一个完整、独立的 HTML 文件，样式和脚本都写在文件里。不要引用 Google Fonts 等外部网站的字体，改为在 `<head>` 里加 `<link rel="stylesheet" href="../../css/fonts.css">`，字体名用 Noto Serif Old Uyghur、Noto Sans Old Turkic、Noto Sans Mongolian、Noto Serif Tibetan、Noto Naskh Arabic、Gentium Book Plus。

这样范文和网站用同一套字体，在国内打开也不会卡住。《愚公移山》已经照这样改过。

### 加一份资料

1. 文件放进 `content/materials/`，文件名用英文或拼音。
2. 在 `content/materials.js` 里加一项：

```js
  {
    title: '满文字母表',
    note: '自制，按 Unicode 码位排列',
    langs: ['mnc'],
    file: 'content/materials/manchu-alphabet.pdf',
  },
```

只放网上资源的链接时，把 `file: …` 换成 `url: 'https://…'`。

**资料与版权**：免费的 GitHub Pages 网站和它的仓库都是公开的，谁都能下载里面的文件。正式出版的书（比如 Tekin 的语法书）不要整本放进来；可以只登记书名和出处，或者链接到出版社和图书馆的页面。另外，GitHub 上单个文件不能超过 100 MB，整个网站最好不超过 1 GB。

### 加一句名句

在 `content/sayings.js` 的对应语言下面加一行：

```js
  { lang: 'mnc', tl: 'gucu goro baci jici, inu sebjen akū semeo', zh: '有朋友从远方来，不也快乐吗？', src: '满文《论语·学而》' },
```

- 回鹘文、如尼文写 `tr`（转写），满文、蒙古文、藏文写 `tl`（拉丁转写），原文会自动生成。
- 察合台文，以及没有转换规则的语言，用 `sc` 直接写原文，`tr` 写读音。
- 不想再显示某一句，删掉那一行，或在行首加 `//`。

### 加词典链接

在 `config/dictionaries.js` 的 `list` 里加一行。`langs` 里写了哪种语言，那种语言的编辑器标题下面也会出现这个链接：

```js
    { name: '藏汉大辞典', url: 'https://…', langs: ['bo'] },
```

### 改网站名、首页文字

都在 `config/site.js`。

注意：大标题的书法字体只含“四译馆”三个字，以控制文件大小。如果改了站名，标题会改用系统自带的楷体。要书法字体，可以请 Claude 重新生成 `fonts/ma-shan-zheng-title.woff2`。

### 加一种语言

**只用来给范文、资料分类**（比如以后加西夏文、粟特文的范文）：在 `config/languages.js` 里加一行即可：

```js
  { id: 'txg', name: '西夏文' },
```

**要它有自己的两栏编辑器**：

1. 照 `js/converters/_template.js` 写一个转换规则文件，放进 `js/converters/`。
2. 在 `index.html` 里“新加的转换规则放在这一行上面”那一行之上，加一行 `<script src="js/converters/文件名.js"></script>`。
3. 在 `config/languages.js` 里给这种语言写上 `editor: 'two-pane'`，以及 `font`、`dir` 等。
4. 如果需要新字体：把 `.woff2` 文件放进 `fonts/`，在 `css/fonts.css` 里照样登记。

这一步涉及程序，交给 Claude 做最省事：告诉它是哪种文字、用哪套转写方案即可。

### 改配色和字体

颜色和字体都集中在 `css/theme.css`。每个颜色后面都注明了用在哪里。深色模式的颜色在同一个文件的下半部分。

---

## 四、写错了怎么办

`config/` 和 `content/` 里的文件格式比较严格。常见的错误是漏了逗号、引号没配对、括号没关上。

写错时，网页顶上会出现一条黄色提示，说明是哪个文件出了问题。用“本地预览”的方法打开，还能看到是第几行。按提示改好，刷新即可。

几条习惯能少出错：

- 每一项 `{ … }` 后面都留一个逗号，最后一项也一样。
- 文字一律放在英文单引号 `'…'` 里。文字里要用单引号时，写成 `\'`。
- 改之前先复制一份原文件；改坏了，换回去即可。

---

## 五、发布到 GitHub Pages

### 第一次发布

1. 登录 GitHub，点右上角 **+** → **New repository**。仓库名可以叫 `siyi`；选 **Public**（免费账号的 GitHub Pages 只支持公开仓库）。
2. 进入新仓库，点 **uploading an existing file**，把这个文件夹里的**全部内容**拖进去。要拖的是文件夹里面的东西，不是文件夹本身：`index.html` 要位于仓库的最外层。然后点 **Commit changes**。
3. 进入仓库的 **Settings** → 左侧 **Pages**。在 **Build and deployment** 下：Source 选 **Deploy from a branch**，Branch 选 **main**，文件夹选 **/(root)**，点 **Save**。
4. 等一两分钟，刷新这一页，上方会显示网址，形如 `https://你的用户名.github.io/siyi/` 。

文件夹里有一个空文件 `.nojekyll`，作用是让 GitHub 原样发布全部文件，请一并上传。电脑默认会隐藏以点开头的文件，看不到时可以在 GitHub 网页上新建一个同名空文件。

### 以后更新

- **改一个文件**：在 GitHub 网页上打开它，点右上角的铅笔图标，改完点 **Commit changes**。
- **加文件**（新的范文、资料）：进入对应的文件夹，比如 `content/texts`，点 **Add file** → **Upload files**。
- **改得多时**：用 [GitHub Desktop](https://desktop.github.com/) 把仓库同步到电脑上，在本地改好、预览，再一次推送。

每次提交后一两分钟，网站自动更新。浏览器如果还显示旧内容，按 Ctrl+F5（Mac 上是 ⌘+Shift+R）强制刷新。

### 让 Claude 直接改

在 Claude 里把这个仓库连上之后，可以直接说“加一篇范文，文件在这里”或者“给藏文加一个词典链接”，由它修改并推送。

---

## 六、其他说明

- 编辑器里打的字、改过的读法，存在读者自己的浏览器里，不会上传，也不会互相看见。
- 网站不连接任何外部服务，字体也都在 `fonts/` 里，所以国内外访问的差别只取决于 GitHub Pages 本身的速度。
- 字体来源：Noto 系列与 Gentium Book Plus、马善政楷书均为 SIL Open Font License 开源字体。
