# bitig

bitig，古突厥语、回鹘语，意为文字、书籍、碑文。

网站 [bitig.ink](https://bitig.ink/) 收回鹘文、突厥如尼文、满文、蒙古文、藏文、察合台文的原文与拉丁转写对照，另有词典、范文、资料和名句。

网站是一批静态文件：没有数据库，不需要编译，也不依赖任何外部网站。改了文件，传到 GitHub，再让服务器取一次，网站就更新了。唯一要服务器配合的是页脚的访问计数。

这份说明分八节：

1. [文件夹里有什么](#一文件夹里有什么)
2. [在自己电脑上预览](#二在自己电脑上预览)
3. [日常维护](#三日常维护)：加范文、资料、名句、词典链接、语言，改配色
4. [写错了怎么办](#四写错了怎么办)
5. [发布](#五发布)：版本号、提交、让 bitig.ink 更新
6. [访问计数](#六访问计数)
7. [改程序时的约定](#七改程序时的约定)
8. [其他说明](#八其他说明)

---

## 一、文件夹里有什么

```
index.html            页面骨架，载入全部样式和程序。平时不用动
og.png                分享链接时显示的预览图（1200×630）
robots.txt、sitemap.xml  给搜索引擎看的说明和网址清单。平时不用动

config/               网站的设置
  site.js               网站名、首页介绍、联系邮箱、访问计数的开关
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
  其余                  各部分的版式：base 通用，layout 页头页脚和首页，pages 范文资料名句，
                        two-pane、three-pane 两种编辑器，dict 词典
fonts/                字体文件，随网站发布

js/                   程序
  siyi.js               最先载入：公共工具，以及写错文件时页面顶上的黄色提示
  router.js             按网址里 # 后面的部分切换栏目，生成页头和页脚
  counter.js            页脚的访问计数
  gloss.js              编辑器里的悬停释义：查词、还原词尾、虚词表
  pages/                首页、范文、资料、名句、词典各栏目
  editors/              三栏、两栏两种编辑器
  converters/           各文字的转换规则，一种文字一个文件
  data/                 碑文词形表
  dict/                 词典的查询程序和各部词典的设置
dict/
  data/                 词库，由脚本生成，不要手改（其中 gloss/ 是悬停释义用的短释义表）
  tools/                生成词库的 Python 脚本
  *.html                旧网址的跳转页，不必改动
server/
  counter.js            访问计数的服务器部分，只在 bitig.ink 的服务器上运行
```

平时要改的只有 `config/` 和 `content/` 两个文件夹。

这些文件可以用任何文本编辑器打开，比如 VS Code、记事本，也可以直接在 GitHub 网页上改。每个文件开头都有中文说明，写着它管什么、怎么改。

---

## 二、在自己电脑上预览

在这个文件夹里打开终端，运行：

```
python3 -m http.server 8000
```

然后在浏览器里打开 http://localhost:8000 。Windows 上把 `python3` 换成 `python`。

双击 `index.html` 也能看个大概，但有几处不一样：词典读不到词库，范文框的高度不随正文调整，写错文件时提示里看不到行号。

两种办法下页脚都没有访问计数，因为计数在服务器上。这是正常的。

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

**资料与版权**：免费的 GitHub Pages 网站和它的仓库都是公开的，谁都能下载里面的文件。正式出版的书不要放进仓库，改放南大网盘研究室的资料库，`url` 写网盘里的文件地址（形如 `https://box.nju.edu.cn/lib/…/file/…`，要登录才能打开）。不要用网盘“分享”生成的 `/f/…` 链接，那种谁拿到都能下载。大文件也照此办理：GitHub 上单个文件不能超过 100 MB。

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

### 词典栏目

页头的“词典”栏目里有满汉、蒙汉、蒙汉满、清文鉴、藏文五部词典。前四部数据来自栗林均词典，藏文词典数据来自 [Christian Steinert 藏文词典](https://github.com/christiansteinert/tibetan-dictionary)（各词典版权属于原作者）。网址分别是 `#dict-manhan`、`#dict-menghan`、`#dict-manhanmeng`、`#dict-qingwenjian`、`#dict-tibetan`。

```
js/dict/dictionaries.js   各部词典的设置（显示什么、怎样排）
js/dict/core.js           查询程序，各部共用
js/dict/translit-mnc.js   满文转写与穆麟德夫式转写
js/dict/translit-mn.js    蒙古文转写与学术转写
js/pages/dict.js          栏目本身：切换词典、预读词库
css/dict.css              版式
dict/data/                词库（由 CSV 生成，不要手改）
dict/tools/build_data.py  从 CSV 生成词库的脚本
```

每部词典的词库分两个文件：较小的检索文件（`.idx.txt`）先读，读完即可查询；释义文件（`.def.txt`）随后在后台读入。读过的词库留在内存里，在栏目之间来回切换不必重读。

拿到新版 CSV 后，在仓库最外层运行（不需要的一份可以不给）：

```
python3 dict/tools/build_data.py --manhan 满汉.csv --menghan 蒙汉.csv --manhanmeng 满汉蒙.csv --qingwenjian 清文鉴.csv
```

然后把 `js/dict/dictionaries.js` 开头 `VER` 的日期改新再上传。

藏文词典另有一个脚本。它收词约三十五万，释义分成数百份小文件（`dict/data/tibetan/`），网页只读当前一页结果用得到的几份；“英文反查”用 `dict/data/tibetan.en.txt`。更新时先把 Steinert 的仓库下载下来，再运行（需要装有 node）：

```
git clone --depth 1 https://github.com/christiansteinert/tibetan-dictionary /tmp/tibdict
python3 dict/tools/build_tibetan.py /tmp/tibdict
```

它同时生成 `js/dict/tibetan-dicts.js`（各部词典的名称和出处）。只有页码、没有文字的扫描本词典不收。

`dict/` 里的三个 HTML 只是把旧链接转到词典栏目，不必改动。

### 改网站名、首页文字、联系邮箱

都在 `config/site.js`。邮箱只写这一处，页脚和资料库顶上都用它。

### 加一种语言

**只用来给范文、资料分类**（比如以后加西夏文、粟特文的范文）：在 `config/languages.js` 里加一行即可：

```js
  { id: 'txg', name: '西夏文' },
```

**要它有自己的两栏编辑器**：

1. 照 `js/converters/_template.js` 写一个转换规则文件，放进 `js/converters/`。
2. 在 `index.html` 里“新加的转换规则放在这一行上面”那一行之上，加一行 `<script src="js/converters/文件名.js?v=版本号"></script>`，版本号和其他行一样。
3. 在 `config/languages.js` 里给这种语言写上 `editor: 'two-pane'`，以及 `font`、`dir` 等。
4. 如果需要新字体：把 `.woff2` 文件放进 `fonts/`，在 `css/fonts.css` 里照样登记。

这一步涉及程序，交给 Claude 做最省事：告诉它是哪种文字、用哪套转写方案即可。

### 把编辑器标为“开发中”

在 `config/languages.js` 里给这种语言加上 `wip: true`（现在回鹘文、察合台文是这样）。这种编辑器不出现在页头导航和首页的“对照转写”里，改列在首页最底下的“开发中”一栏，页面标题下面显示一条红色提醒。提醒的文字在 `config/site.js` 的 `wipNote`；要给某种语言单写一句，就写成 `wip: '……'`。开发完成后，删掉 `wip` 这一项即可。

### 改配色和字体

颜色和字体都集中在 `css/theme.css`。每个颜色后面都注明了用在哪里。深色模式（读者的系统设为深色时）的颜色在同一个文件的下半部分，只有一份。

### 编辑器里的悬停释义

满文、蒙古文、藏文的编辑器里，鼠标停在一个词上，浮窗显示它的简短意思；双击这个词，跳到词典里查它。手机上没有悬停，点一下词出浮窗，浮窗里有“到词典里查”。

- **释义从哪来**：从词典里抽出来的短释义表，在 `dict/data/gloss/` 下，按语言分三个文件夹，每个文件夹里是若干小文件，用到哪个读哪个。满文取《满汉大辞典》（没有的词取《新满汉大词典》），蒙古文取《蒙汉词典》，藏文取几部释义简短的藏英词典，所以藏文的释义是英文。
- **重新生成**：词库更新之后，在仓库最外层运行 `python3 dict/tools/build_gloss.py`（不用参数），再把 `js/gloss.js` 开头 `VER` 的日期改新。这些文件不要手改。
- **带词尾的词**：文中的词常带词尾，词典只收原形。`js/gloss.js` 里每种语言有一套还原规则（如满文 `tucikengge` → `tucimbi`），只管常见形式，查不到时浮窗里写“词典里没有查到”。要补规则，改这个文件里的词尾表（`MNC_VERB`、`MN_VERB` 等）和不规则形式表（`MNC_IRREGULAR`）。
- **虚词**：格助词一类不取词典的释义（太长），用 `js/gloss.js` 里的小表 `MNC_PARTICLES`、`MN_PARTICLES`、`MN_SUFFIX`、`BO_PARTICLES`，可以直接改文字。
- **给别的语言加**：先要有那种语言的词库，再在 `build_gloss.py` 和 `js/gloss.js` 的 `LANGS` 里各加一段。

---

## 四、写错了怎么办

`config/` 和 `content/` 里的文件格式比较严格。常见的错误是漏了逗号、引号没配对、括号没关上。

写错时，网页顶上会出现一条黄色提示，说明是哪个文件出了问题。用“本地预览”的方法打开，还能看到是第几行。按提示改好，刷新即可。

几条习惯能少出错：

- 每一项 `{ … }` 后面都留一个逗号，最后一项也一样。
- 文字一律放在英文单引号 `'…'` 里。文字里要用单引号时，写成 `\'`。
- 改之前先复制一份原文件；改坏了，换回去即可。

---

## 五、发布

网站有两个地址：

- **bitig.ink**：正式网站，在阿里云香港的服务器上。
- **kevin51763.github.io/bitig/**：GitHub Pages 上的副本，仓库的 main 分支一有改动就自动更新。它没有访问计数。

### 第一步：改版本号

`index.html` 里载入的每个文件后面都带 `?v=2026111012` 这样的版本号（年月日时）。读者的浏览器靠它判断文件有没有变。

**凡是改了 .js 或 .css 文件（包括 `config/`、`content/` 里的），都要把 `index.html` 里所有的 `?v=` 改成同一个新值。** 用编辑器的“全部替换”，把旧的数字换成当前的日期和小时。只改一部分，读者的浏览器会新旧文件混用，页面顶上出现黄色报错。

只改 HTML（比如范文正文）或只加资料文件，不用改版本号。重新生成词库后要改的是 `js/dict/dictionaries.js` 开头的 `VER`，见上面的“词典栏目”。

### 第二步：传到 GitHub

- **改一个文件**：在 GitHub 网页上打开它，点右上角的铅笔图标，改完点 **Commit changes**。
- **加文件**（新的范文、资料）：进入对应的文件夹，比如 `content/texts`，点 **Add file** → **Upload files**。
- **改得多时**：用 [GitHub Desktop](https://desktop.github.com/) 把仓库同步到电脑上，在本地改好、预览，再一次推送。
- **让 Claude 改**：在 Claude 里连上这个仓库，直接说“加一篇范文，文件在这里”或者“给藏文加一个词典链接”。它会新建分支、开一个合并请求（PR），你看过之后点 **Merge** 合并。

### 第三步：让 bitig.ink 更新

合并到 main 之后，GitHub Pages 上的副本一两分钟内自动更新，**bitig.ink 不会**。登录服务器，取一次最新的文件：

```
cd /var/www/bitig/public
git pull
```

取完立即生效，不用重启。只有 `server/` 里的文件变了才要重启，见下一节。

浏览器如果还显示旧内容，按 Ctrl+F5（Mac 上是 ⌘+Shift+R）强制刷新。

---

## 六、访问计数

页脚的“总访问 · 今日”由 bitig.ink 的服务器记录。

**怎么算**

- 读者每次打开网站记一次。同一个标签页里刷新、切换栏目不重复记；关掉再打开算新的一次。
- 同一个网络地址 10 秒内最多记一次，防止有人连续刷数字。
- “今日”按北京时间，每天零点归零。
- 记的只是次数。不记录读者是谁、看了什么，也不用任何外部统计服务。

**各部分在哪**

| 位置 | 作用 |
| --- | --- |
| `js/counter.js` | 网页部分：打开网站时向服务器报一次，把数字写进页脚 |
| `server/counter.js` | 服务器部分：接口 `/api/visit`，记数、存盘 |
| 服务器上的 `/var/www/bitig/data/visits.json` | 数字本身。不在仓库里，别人下载不到 |
| `config/site.js` 的 `counter` | 开关。改成 `false`，页脚不显示，也不再计数 |
| `css/layout.css` 的 `.foot-stats` | 样式 |

**安装（只做一次）**

服务器上的 `/var/www/bitig/server.js` 不在仓库里，要手工加一行。先照第五节取到最新文件，然后打开 `server.js`，在 `const app = express()` 之后、`express.static` 那一行之前加上：

```js
require('./public/server/counter')(app, require('path').join(__dirname, 'data'));
```

保存后重启：

```
systemctl restart bitig
```

打开 bitig.ink，页脚出现“总访问 1 · 今日 1”就装好了。没出现的话，运行 `journalctl -u bitig -n 20` 看报错。

以后 `server/counter.js` 有改动，`git pull` 之后同样要运行一次 `systemctl restart bitig`。

**看历史、改数字**

`visits.json` 形如 `{ "total": 1234, "days": { "2026-11-10": 56 } }`，`days` 里留着每天的访问数。要清零或改数，先 `systemctl stop bitig`，改完文件再 `systemctl start bitig`；不停服务直接改，会被内存里的旧数字盖掉。

**没有服务器的地方**

GitHub Pages 上的副本和本地预览没有这个接口。那里页脚不显示计数，其余一切照常。

---

## 七、改程序时的约定

给以后改 `js/`、`css/` 的人（或 AI）看。日常加内容用不到这一节。

1. **不用框架，不用打包。** 没有 npm 依赖，没有编译步骤。浏览器直接读仓库里的文件。
2. **不引用外部资源。** 读者大多在中国大陆，外部的字体、脚本、统计服务可能很慢或打不开。字体放 `fonts/`，脚本和样式都放在仓库里。
3. **每个 .js 文件包在一个立即执行函数里**，对外的东西挂到全局对象 `SIYI` 上。`SIYI` 的结构见 `js/siyi.js` 开头。`index.html` 里的载入顺序不能乱。
4. **公共工具只写一份，都在 `js/siyi.js`：**

   | 名字 | 作用 |
   | --- | --- |
   | `SIYI.$(id)` | 按 id 取页面元素 |
   | `SIYI.esc(s)` | 把文字放进 HTML 之前转义 |
   | `SIYI.store.get / set` | 在读者浏览器里存取小段文字（草稿、上次的选择） |
   | `SIYI.lang(id)`、`SIYI.langName(id)` | 按简写查语言、查语言名 |
   | `SIYI.isExternal(url)` | 是不是站外链接 |
   | `SIYI.vertClass(lang, …)` | 这种文字竖写还是横写 |
   | `SIYI.toast(msg)` | 页面底部弹一句短提示 |
   | `SIYI.problem(msg)` | 页面顶上的黄色提示，用来报告配置写错 |

   按语言分组、语言小标签、检查目录漏项在 `js/pages/shared.js`。词典（`js/dict/`）原是独立的程序，自带一套同样的小工具，没有并过来。
5. **加栏目**：在 `index.html` 里加一块 `<main class="view" id="v-xxx" hidden>`，然后在 `js/router.js` 的 `VIEWS` 和 `resolve` 里各加一行。
6. **网址不能随便变。** `#texts`、`#text-<id>`、`#dict-<词典名>`、`#tool-<语言简写>` 公开后就是别人收藏的链接。页面里的路径一律用相对路径（`css/base.css`，不以 `/` 开头），这样在 bitig.ink 和 GitHub Pages 的 `/bitig/` 下都能用。接口是例外，写 `/api/…`。
7. **配置写错要在页面上说清楚。** 用 `SIYI.problem('哪个文件、怎么改')`，不要只写进控制台。
8. **读者浏览器里存的名字不要改**（如 `mm-draft-mnc`、`ougr-draft-v1`、`dict-last`、`dict-spine`、`dict-col`）。改了，读者以前存的草稿和设置就读不到了。
9. **颜色只在 `css/theme.css` 里定义**，其他样式文件引用变量名。深色模式的颜色在同一个文件里。
10. **生成的文件不手改**：`dict/data/`（包括 `dict/data/gloss/`）和 `js/dict/tibetan-dicts.js` 由 `dict/tools/` 的脚本生成。
11. **新代码写中文注释**，说明它管什么、怎么改。改了维护流程，同步改这份说明。
12. **改完检查**：
    - 对改过的每个 .js 运行 `node --check 文件名`；
    - `grep -o '?v=[0-9]*' index.html | sort | uniq -c` 的结果只有一种值；
    - 本地预览，页面顶上没有黄色提示，各栏目都能切换；动过词典的，查一个词。

---

## 八、其他说明

- 编辑器里打的字、改过的读法，存在读者自己的浏览器里，不会上传，也不会互相看见。
- 网站不连接任何外部服务。字体都在 `fonts/` 里，访问计数记在自己的服务器上。
- 搜索引擎：`index.html` 开头有一行必应的站长验证（`msvalidate.01`），不能删。以后登记别的搜索引擎，把它给的那一行 `<meta …>` 加在旁边。
- 字体来源：Noto 系列与 Gentium Book Plus 均为 SIL Open Font License 开源字体。
- 词典数据：满汉、蒙汉、蒙汉满、清文鉴来自栗林均词典，藏文来自 Christian Steinert 藏文词典。各词典版权属于原作者。
