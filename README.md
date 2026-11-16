# bitig

bitig，古突厥语、回鹘语，意为文字、书籍、碑文。

网站 [bitig.ink](https://bitig.ink/) 收回鹘文、突厥如尼文、满文、蒙古文、藏文、察合台文的原文与拉丁转写对照，另有词典、文章、资料和名句。

网站是一批静态文件：没有数据库，不需要编译，也不依赖任何外部网站。改了文件，传到 GitHub，网站就自动更新。要服务器配合的只有两件事：自动更新和页脚的访问计数。

这份说明分八节：

1. [文件夹里有什么](#一文件夹里有什么)
2. [在自己电脑上预览](#二在自己电脑上预览)
3. [日常维护](#三日常维护)：加文章、资料、名句、词典链接、语言，改配色
4. [写错了怎么办](#四写错了怎么办)
5. [发布](#五发布)：版本号、提交、自动更新
6. [服务器部分](#六服务器部分)：安装、自动更新、访问计数
7. [改程序时的约定](#七改程序时的约定)
8. [其他说明](#八其他说明)

---

## 一、文件夹里有什么

```
index.html            页面骨架，载入全部样式和程序。平时不用动
admin.html            查看读者留言的页面（bitig.ink/admin.html，要密码）
og.png                分享链接时显示的预览图（1200×630）
favicon.ico、favicon-96.png、icon-192.png、apple-touch-icon.png
                      网站的小图标（红底白色的 b），几种大小。平时不用动
robots.txt、sitemap.xml  给搜索引擎看的说明和网址清单。平时不用动（bitig.ink 上的网址清单由服务器自动生成）

config/               网站的设置
  site.js               网站名、首页介绍、留言和访问计数的开关、联系邮箱
  languages.js          语言清单：名字、导航顺序、用哪种编辑器、字体、书写方向
  dictionaries.js       词典链接
content/              网站的内容
  texts.js              文章目录
  texts/                文章的 HTML 文件
  materials.js          资料目录
  materials/            资料文件（PDF、图片等）
  sayings.js            首页轮换的名句

css/                  样式
  theme.css             配色和各种文字的字体（想改颜色就改这里）
  fonts.css             字体文件的登记
  其余                  各部分的版式：base 通用，layout 页头页脚和首页，pages 文章资料名句，
                        two-pane、three-pane 两种编辑器，dict 词典
fonts/                字体文件，随网站发布

js/                   程序
  siyi.js               最先载入：公共工具，以及写错文件时页面顶上的黄色提示
  routes.js             栏目的名字和网址怎样对应，浏览器和服务器共用
  router.js             按网址切换栏目，生成页头和页脚
  counter.js            页脚的访问计数
  gloss.js              编辑器里的悬停释义：查词、还原词尾、虚词表
  pages/                首页、文章、资料、名句、词典各栏目
  editors/              三栏、两栏两种编辑器
  converters/           各文字的转换规则，一种文字一个文件
  data/                 碑文词形表
  dict/                 词典的查询程序和各部词典的设置
dict/
  data/                 词库，由脚本生成，不要手改（其中 gloss/ 是悬停释义用的短释义表）
  tools/                生成词库的 Python 脚本
  *.html                旧网址的跳转页，不必改动
server/               服务器部分，只在 bitig.ink 的服务器上运行
  index.js              总入口，列出下面各项功能
  deploy.js             自动更新：main 分支有改动时取最新的文件
  dict.js               词典释义：浏览器按需来要，不必整份下载
  pages.js              不带 # 的网址：/dict/manhan 这样的网址发回网页，配上各自的标题
  messages.js           留言：收读者的留言，存进数据库
  counter.js            访问计数
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

双击 `index.html` 也能看个大概，但有几处不一样：词典读不到词库，文章框的高度不随正文调整，写错文件时提示里看不到行号。

两种办法下页脚都没有访问计数，因为计数在服务器上。这是正常的。

---

## 三、日常维护

### 加一篇文章

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
- `id` 会成为这篇文章的网址（`bitig.ink/texts/daxue`），公开之后最好别再改。
- 新的写在最后，首页“新近文章”从最后往前取。

**请 AI 做文章时**，可以把下面这段要求一起交给它：

> 做成一个完整、独立的 HTML 文件，样式和脚本都写在文件里。不要引用 Google Fonts 等外部网站的字体，改为在 `<head>` 里加 `<link rel="stylesheet" href="../../css/fonts.css">`，字体名用 Noto Serif Old Uyghur、Noto Sans Old Turkic、Noto Sans Mongolian、Noto Serif Tibetan、Noto Naskh Arabic、Gentium Book Plus。

这样文章和网站用同一套字体，在国内打开也不会卡住。《愚公移山》已经照这样改过。

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

资料库按语言分组显示，新加的排在组里最前面；归入几种语言的资料在每一组里都出现。顶上可以按语言筛选，也可以搜书名、作者，所以 `title` 和 `note` 写全一些，读者才搜得到。

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

页头的“词典”栏目里有满汉、蒙汉、蒙汉满、清文鉴、藏文五部词典。前四部数据来自栗林均词典，藏文词典数据来自 [Christian Steinert 藏文词典](https://github.com/christiansteinert/tibetan-dictionary)（各词典版权属于原作者）。网址分别是 `bitig.ink/dict/manhan`、`/dict/menghan`、`/dict/menghanman`、`/dict/qingwenjian`、`/dict/tibetan`。

```
js/dict/dictionaries.js   各部词典的设置（显示什么、怎样排）
js/dict/core.js           查询程序，各部共用
js/dict/def-match.js      释义反查的匹配规则，浏览器和服务器共用
js/dict/card-image.js     把词卡画成图片，供读者保存
js/dict/translit-mnc.js   满文转写与穆麟德夫式转写
js/dict/translit-mn.js    蒙古文转写与学术转写
js/pages/dict.js          栏目本身：切换词典、预读词库
css/dict.css              版式
dict/data/                词库（由 CSV 生成，不要手改）
dict/tools/build_data.py  从 CSV 生成词库的脚本
```

每部词典的词库分两个文件：较小的检索文件（`.idx.txt`）和释义文件（`.def.txt`）。浏览器先读检索文件，读完即可查询。释义文件较大（满汉词典压缩后约 3 MB），在 bitig.ink 上不必下载：浏览器只向服务器要当前这一页词条的释义，输入汉字的释义反查也由服务器做，见第六节的“词典释义”。没有服务器的地方（GitHub Pages 上的副本、本地预览），释义文件照旧在后台整份读入。读过的词库留在内存里，在栏目之间来回切换不必重读。

拿到新版 CSV 后，在仓库最外层运行（不需要的一份可以不给）：

```
python3 dict/tools/build_data.py --manhan 满汉.csv --menghan 蒙汉.csv --manhanmeng 满汉蒙.csv --qingwenjian 清文鉴.csv
```

然后把 `js/dict/dictionaries.js` 开头 `VER` 的日期改新再上传。服务器也靠 `VER` 核对词库的版本，这一步不能省。

藏文词典另有一个脚本。它收词约三十五万，释义分成数百份小文件（`dict/data/tibetan/`），网页只读当前一页结果用得到的几份；“英文反查”用 `dict/data/tibetan.en.txt`。更新时先把 Steinert 的仓库下载下来，再运行（需要装有 node）：

```
git clone --depth 1 https://github.com/christiansteinert/tibetan-dictionary /tmp/tibdict
python3 dict/tools/build_tibetan.py /tmp/tibdict
```

它同时生成 `js/dict/tibetan-dicts.js`（各部词典的名称和出处）。只有页码、没有文字的扫描本词典不收。

`dict/` 里的三个 HTML 只是把旧链接转到词典栏目，不必改动。

### 改网站名、首页文字、联系邮箱

都在 `config/site.js`。邮箱只写这一处，页脚和资料库顶上都用它。

首页最上面是一行标题和“试一试”：选一种文字，输入转写，右边随即写出原文，按回车到那种文字的词典里查。

- 标题是 `config/site.js` 的 `lead`，越短越好；留空就不显示。
- 搜索结果和浏览器标签上，首页显示成“bitig — 一句说明”。这句说明是 `config/site.js` 的 `tagline`，写别人会搜的词。改它时，`index.html` 开头 `<title>` 和 `og:title` 里的同一句话也要跟着改。
- “试一试”里有哪几种文字、各查哪部词典、空着时写哪个例词，在 `js/pages/home.js` 开头的 `TRY` 里。
- 首页词典卡片上的名字是 `config/dictionaries.js` 里的 `name`。

### 加一种语言

**只用来给文章、资料分类**（比如以后加西夏文、粟特文的文章）：在 `config/languages.js` 里加一行即可：

```js
  { id: 'txg', name: '西夏文' },
```

**要它有自己的两栏编辑器**：

1. 照 `js/converters/_template.js` 写一个转换规则文件，放进 `js/converters/`。
2. 在 `index.html` 里“新加的转换规则放在这一行上面”那一行之上，加一行 `<script src="js/converters/文件名.js?v=版本号"></script>`，版本号和其他行一样。
3. 在 `config/languages.js` 里给这种语言写上 `editor: 'two-pane'`，以及 `slug`（网址里用的全名，如 `'manchu'`）、`font`、`dir` 等。
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
- **kevin51763.github.io/bitig/**：GitHub Pages 上的副本。它没有访问计数。

仓库的 main 分支一有改动，两个地址都自动更新。

### 第一步：改版本号

`index.html` 里载入的每个文件后面都带 `?v=2026111012` 这样的版本号（年月日时）。读者的浏览器靠它判断文件有没有变。

**凡是改了 .js 或 .css 文件（包括 `config/`、`content/` 里的），都要把 `index.html` 里所有的 `?v=` 改成同一个新值。** 用编辑器的“全部替换”，把旧的数字换成当前的日期和小时。只改一部分，读者的浏览器会新旧文件混用，页面顶上出现黄色报错。

只改 HTML（比如文章正文）或只加资料文件，不用改版本号。重新生成词库后要改的是 `js/dict/dictionaries.js` 开头的 `VER`，见上面的“词典栏目”。

### 第二步：传到 GitHub

- **改一个文件**：在 GitHub 网页上打开它，点右上角的铅笔图标，改完点 **Commit changes**。
- **加文件**（新的文章、资料）：进入对应的文件夹，比如 `content/texts`，点 **Add file** → **Upload files**。
- **改得多时**：用 [GitHub Desktop](https://desktop.github.com/) 把仓库同步到电脑上，在本地改好、预览，再一次推送。
- **让 Claude 改**：在 Claude 里连上这个仓库，直接说“加一篇文章，文件在这里”或者“给藏文加一个词典链接”。它会新建分支、开一个合并请求（PR），你看过之后点 **Merge** 合并。

### 第三步：bitig.ink 自动更新

合并到 main 之后，两个地址都会在一两分钟内自动更新，不用登录服务器。bitig.ink 的自动更新由服务器上的程序完成，做法见下一节。

想确认更新到了没有，在浏览器里打开 https://bitig.ink/api/deploy ，那里写着上一次更新的时间和结果。

浏览器如果还显示旧内容，按 Ctrl+F5（Mac 上是 ⌘+Shift+R）强制刷新。

自动更新失灵时，登录服务器手工取一次：

```
sudo -u www-data git -C /var/www/bitig/public pull
```

取完立即生效。只有 `server/` 里的文件变了才要再运行 `systemctl restart bitig`。

---

## 六、服务器部分

bitig.ink 的服务器除了发送网站文件，还做五件事：自动更新、不带 # 的网址、词典释义、留言和访问计数。程序在仓库的 `server/` 文件夹里，数据在服务器的 `/var/www/bitig/data/` 里。

### 安装（只做一次）

**1. 接上 `server/` 里的程序。** 服务器上的 `/var/www/bitig/server.js` 不在仓库里。打开它，在 `const app = express()` 之后、`express.static` 那一行之前，写上这一行（原先接访问计数的那一行删掉）：

```js
require('./public/server')(app, require('path').join(__dirname, 'data'));
```

以后新增服务器功能，不用再改 `server.js`。

**2. 把两个文件夹交给网站程序。** 网站程序以 `www-data` 账户运行。它要能写数据文件夹，也要能在网站文件夹里取文件：

```
mkdir -p /var/www/bitig/data
chown -R www-data:www-data /var/www/bitig/data /var/www/bitig/public
```

从此不要再以 root 身份在 `public` 里直接运行 `git pull`，那样取来的文件归 root，自动更新会失败。手工取文件用第五节末尾的那条命令。

**3. 生成密钥。** 密钥是一段随机文字，只有 GitHub 和服务器知道，用来确认通知确实来自 GitHub：

```
openssl rand -hex 32 > /var/www/bitig/data/deploy-secret.txt
chown www-data:www-data /var/www/bitig/data/deploy-secret.txt
chmod 600 /var/www/bitig/data/deploy-secret.txt
cat /var/www/bitig/data/deploy-secret.txt
```

最后一条命令显示密钥，复制下来，下一步要用。密钥不要写进仓库，也不要发给别人。

**4. 重启。**

```
systemctl restart bitig
```

**5. 在 GitHub 上设通知。** 打开仓库的 **Settings** → **Webhooks** → **Add webhook**，填：

| 项目 | 填什么 |
| --- | --- |
| Payload URL | `https://bitig.ink/api/deploy` |
| Content type | `application/json` |
| Secret | 上一步复制的密钥 |
| Which events | Just the push event |

点 **Add webhook**。GitHub 随即发一条试探的通知，在这个页面的 **Recent Deliveries** 里能看到，绿色的勾表示通了。

装好后打开 bitig.ink，页脚出现“总访问 · 今日”；打开 https://bitig.ink/api/deploy 能看到一行文字。哪一样没有，运行 `journalctl -u bitig -n 20` 看报错。

### 自动更新

| 位置 | 作用 |
| --- | --- |
| `server/deploy.js` | 接口 `/api/deploy`：收 GitHub 的通知，核对签名，运行 `git pull` |
| 服务器上的 `data/deploy-secret.txt` | 密钥。删掉这个文件，自动更新就停用 |
| 服务器上的 `data/deploy.json` | 上一次更新的结果 |

- 只有 main 分支的改动才更新网站。
- 这次改动了服务器用到的程序（`server/` 里的文件和 `js/dict/def-match.js`）时，程序取完文件自己退出，系统 3 秒后把它重新启动，不必手工重启。
- 更新失败时，https://bitig.ink/api/deploy 写着“更新失败”，原因用 `journalctl -u bitig -n 20` 看。最常见的原因是有人在服务器上直接改过 `public` 里的文件，或者以 root 身份取过文件（重新运行安装第 2 步的 `chown` 即可）。
- 换密钥：重新运行安装第 3 步，再到 GitHub 的 Webhooks 页面把新密钥填进去。不用重启。

### 不带 # 的网址

栏目的网址有两种写法：

| | bitig.ink（有服务器） | GitHub Pages、本地预览（没有服务器） |
| --- | --- | --- |
| 文章目录 | `bitig.ink/texts` | `…/#texts` |
| 单篇文章 | `bitig.ink/texts/daxue` | `…/#text-daxue` |
| 资料库、名句、留言 | `bitig.ink/materials`、`/sayings`、`/contact` | `…/#materials`、`…/#sayings`、`…/#contact` |
| 词典 | `bitig.ink/dict/manhan` | `…/#dict-manhan` |
| 词典里的一个词条 | `bitig.ink/dict/manhan/abka` | `…/#dict-manhan/abka` |
| 编辑器 | `bitig.ink/tool/manchu` | `…/#tool-mnc` |

`#` 后面的部分不会发给服务器，搜索引擎也只认 `#` 前面的，所以带 `#` 时整个网站在搜索引擎眼里只有首页一个网址。不带 `#` 的网址要服务器配合：读者访问 `bitig.ink/dict/manhan` 时，服务器发回网页，并配上这个栏目自己的标题和简介。

| 位置 | 作用 |
| --- | --- |
| `js/routes.js` | 栏目的名字和网址怎样对应。浏览器和服务器共用 |
| `server/pages.js` | 服务器部分：发回网页，换上标题、简介；生成 `sitemap.xml` |
| `js/siyi.js` 的 `SIYI.clean`、`SIYI.href` | 网页部分：判断用哪种写法，生成链接 |
| `js/router.js` | 按网址切换栏目；点站内链接时只换栏目，不重新载入整页 |

- 用哪种写法是自动的：服务器发网页时在 `<head>` 里加一行 `<base href="/" data-clean>`，网页见到它就用不带 `#` 的。不用设置。
- 以前公开的旧链接（`bitig.ink/#dict-manhan`）照样能用，打开后自动换成新网址。
- 词典在网址里的名字就是 `#dict-` 后面的名字，只有蒙汉满词典例外：程序和词库里叫 `manhanmeng`，网址是 `bitig.ink/dict/menghanman`（写在 `js/routes.js` 的 `DICT_PATH`）。
- 编辑器在网址里用语言的全名，即 `config/languages.js` 里的 `slug`：满文 `manchu`、蒙古文 `mongol`、藏文 `tibetan`、回鹘文 `uyghur`、如尼文 `runic`、察合台文 `chagatai`。
- `bitig.ink/sitemap.xml` 由服务器按现有的文章、词典、编辑器生成，加了文章不用手改。仓库里的 `sitemap.xml` 只给 GitHub Pages 上的副本用。
- 文章、语言的改动（`content/texts.js`、`config/languages.js`）服务器会自己重新读，不必重启。

### 词条的固定网址

词典里每个词条都有自己的网址，读者可以把一个词发给别人。五部词典都有。

- 网址是词典的网址后面加 `/` 和词头，如 `bitig.ink/dict/manhan/abka`。词头用词库里的写法（检索文件每行的第一栏），如满文的 `hvwa`（即 hūwa）、蒙古文的 `tabaraG_a`（即 tabaraγ-a）。它在一部词典里不重复。
- 每条结果的词头后面有“分享”二字，点一下打开这个词条的词卡。
- 打开这样的网址，看到的是一张词卡：只有这一个词，一边是大字的原文，一边是词头和各部词典的释义。卡片下面有三个按钮：“保存为图片”“复制链接”“在词典里查这个词”（回到平常的查词界面）。
- “保存为图片”把词卡画成一张 PNG 图片，不含下面的按钮，底部带这个词条的网址。电脑上直接下载；手机上把图片摆出来，长按保存（微信里不能下载文件，这样才存得下来）。图片是照网页上词卡的样子一笔一笔画的，改了词卡的样式，图片跟着变，不用另改。
- 在词卡上点释义里的词、点别的词典，都会离开词卡，地址栏换回词典本身的网址；按浏览器的“后退”能回到词卡。
- 网址里的词头查不到时，照常显示“没有找到”。
- 重新生成词库不影响这些网址，只要词头没变。

**服务器把释义写进网页**（五部都有）：访问 `bitig.ink/dict/manhan/abka` 时，服务器把这张词卡直接写在发出的网页里，简介也换成释义的开头。分享链接时能带出释义，搜索引擎不运行程序也读得到。读者的浏览器随后照常运行程序，画出一样的词卡。

服务器怎样显示词头、原文和释义，取自 `js/dict/dictionaries.js` 里每部词典的三项设置，新加词典时照样写上：

| 设置 | 作用 |
| --- | --- |
| `show(key)` | 词库里的词头怎样写给读者看，如 `hvwa` → `hūwa` |
| `script(e)`、`scriptLang` | 词卡上大字的原文；不写就没有原文那一栏 |
| `plain(f)` | 一条释义怎样写成纯文字；不写就取释义文件里的原样 |

藏文词典的释义不在内存里（太大），服务器找到词头在第几行后，只读那一小块释义文件。

**要不要让搜索引擎收录词条页**：由 `config/site.js` 的 `indexEntries` 决定，现在是 `false`（不让）。改成 `true` 等于把整部词典一页一页公开给搜索引擎，改之前请先确认词典数据的授权。词条页不在 `sitemap.xml` 里。

| 位置 | 作用 |
| --- | --- |
| `js/routes.js` | 词条的名字（`dict-manhan/abka`）和网址怎样对应 |
| `js/dict/core.js` 的 `openKey`、`drawCard`、`permalink` | 按词头找到词条；画词卡；画“分享”二字 |
| `js/pages/dict.js` | 打开词条的网址时调用 `openKey`，改标题 |
| `js/dict/card-image.js`、`core.js` 的 `saveCard` | 把词卡画成图片；下载或摆出来 |
| `server/pages.js` 的 `entryMeta`、`entryBody` | 服务器部分：词条页的标题、简介、写进网页的词卡 |
| `css/dict.css` 的“词卡”一节 | 词卡的样子，网页和服务器写的那份共用 |
| `server/dict.js` | 按词头找释义（供上一行使用） |

### 词典释义

满汉、蒙汉、蒙汉满、清文鉴四部词典的释义文件，服务器启动时读进内存（共约 20 MB，不用数据库）。浏览器查到词头后，只来要当前这一页词条的释义，每次几 KB。

| 位置 | 作用 |
| --- | --- |
| `server/dict.js` | 接口 `/api/dict/<词典>/…`：`info` 核对版本，`defs` 取释义，`search` 释义反查 |
| `js/dict/def-match.js` | 释义反查的匹配规则。浏览器和服务器用同一份，两边查出的结果才一样 |
| `js/dict/core.js` | 网页部分：接口能用就按需要释义，不能用就下载整份释义文件 |

- 查词头（输入转写）仍在浏览器里做，不经过服务器。
- 更新词库不用多做什么：照“词典栏目”一节生成词库、改 `VER`、合并。服务器发现文件变了会重新读入。
- 浏览器和服务器靠 `VER` 和词条数核对词库是不是同一版。对不上时（比如读者的浏览器还留着旧的检索文件），浏览器自动改为下载整份释义文件，不会张冠李戴。
- 藏文词典的释义本来就分成小份按需读取，不经过这里。

### 留言

读者在“问题反馈”栏目（`bitig.ink/contact`，页脚和资料库顶上有链接）写一段话给你，可以选“纠错”“添加资料”或“其他”，联系方式可留可不留。这样不用公开邮箱，读者也不用注册。

**设密码（只做一次）**

看留言要密码。登录服务器，生成一个：

```
openssl rand -hex 12 > /var/www/bitig/data/admin-password.txt
chown www-data:www-data /var/www/bitig/data/admin-password.txt
chmod 600 /var/www/bitig/data/admin-password.txt
cat /var/www/bitig/data/admin-password.txt
```

最后一条命令显示密码，记在自己的密码本里。不用重启。想换密码，重新运行一遍即可。

**看留言**

打开 `bitig.ink/admin.html`，输入密码。每条留言可以“标为已处理”或“删除”。密码记在当前的标签页里，关掉标签页就要重新输入。没有新留言的提醒，要自己隔几天去看一次。

**各部分在哪**

| 位置 | 作用 |
| --- | --- |
| `js/pages/contact.js` | 网页部分：留言的表单 |
| `admin.html` | 查看留言的页面。页面本身谁都能打开，没有密码看不到留言 |
| `server/messages.js` | 服务器部分：接口 `/api/messages`，收留言、核对密码 |
| 服务器上的 `data/messages.db` | 留言，SQLite 数据库。不在仓库里，别人下载不到 |
| 服务器上的 `data/admin-password.txt` | 密码。没有这个文件时，留言照收，但看不了 |
| `config/site.js` 的 `contact` | 开关。改成 `false`，页脚和资料库顶上不再有“问题反馈”链接 |

- 防垃圾：同一个网络地址 10 分钟内最多留 5 条，全站一天最多收 300 条；密码 10 分钟内最多输错 10 次。这些数字在 `server/messages.js` 开头。
- 不记录读者的网络地址。会记下读者来留言之前所在的栏目（如 `dict-manhan`），纠错时方便查找。
- 备份：把 `data/messages.db` 复制一份即可。
- 数据库用的是 Node.js 自带的 `node:sqlite`，不用另装东西，服务器上的 Node.js 要 22.5 以上。

### 访问计数

页脚的“总访问 · 今日”由服务器记录。

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
| 服务器上的 `data/visits.json` | 数字本身。不在仓库里，别人下载不到 |
| `config/site.js` 的 `counter` | 开关。改成 `false`，页脚不显示，也不再计数 |
| `css/layout.css` 的 `.foot-stats` | 样式 |

**看历史、改数字**

`visits.json` 形如 `{ "total": 1234, "days": { "2026-11-10": 56 } }`，`days` 里留着每天的访问数。要清零或改数，先 `systemctl stop bitig`，改完文件再 `systemctl start bitig`；不停服务直接改，会被内存里的旧数字盖掉。

### 没有服务器的地方

GitHub Pages 上的副本和本地预览没有服务器。那里网址带 `#`，页脚不显示计数，不能留言，词典下载整份释义文件，其余一切照常。

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
   | `SIYI.href(名字)` | 某个栏目的网址，写链接时用：`href="${SIYI.href('texts')}"`。不要直接写 `href="#texts"` |
   | `SIYI.go(名字)` | 转到某个栏目 |
   | `SIYI.route()` | 现在在哪个栏目 |
   | `SIYI.vertClass(lang, …)` | 这种文字竖写还是横写 |
   | `SIYI.toast(msg)` | 页面底部弹一句短提示 |
   | `SIYI.problem(msg)` | 页面顶上的黄色提示，用来报告配置写错 |

   按语言分组、语言小标签、检查目录漏项在 `js/pages/shared.js`。词典（`js/dict/`）原是独立的程序，自带一套同样的小工具，没有并过来。
5. **加栏目**：在 `index.html` 里加一块 `<main class="view" id="v-xxx" hidden>`，栏目的标题写成 `<h1>`（没显示的栏目里的 h1，`js/router.js` 会自动换成 div，保证整个网页只有一个 h1）。然后在 `js/router.js` 的 `VIEWS` 和 `resolve` 里各加一行，再把栏目的名字写进 `js/routes.js`（和 `server/pages.js` 的 `meta`），不带 `#` 的网址才认得它。
6. **网址不能随便变。** 栏目的名字（`texts`、`text-<id>`、`dict-<词典名>`、`tool-<语言简写>`）和它们的两种网址（见第六节“不带 # 的网址”）公开后就是别人收藏的链接。页面里的路径一律用相对路径（`css/base.css`，不以 `/` 开头），这样在 bitig.ink 和 GitHub Pages 的 `/bitig/` 下都能用。接口是例外，写 `/api/…`。
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
