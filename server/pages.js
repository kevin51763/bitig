/* 不带 # 的网址。只在 bitig.ink 的服务器上运行，由 server/index.js 接入。

   网站原先靠网址里 # 后面的部分切换栏目（bitig.ink/#dict-manhan）。# 后面的部分不会发给服务器，
   搜索引擎也只认 # 前面的，所以整个网站在它眼里只有首页一个网址。
   有了这个文件，栏目有了各自的网址（bitig.ink/dict/manhan）。读者访问这样的网址时，这里做三件事：
     1. 发回 index.html，并在 <head> 里加一行 <base href="/" data-clean>。
        网页见到这一行，就改用不带 # 的网址（js/siyi.js 的 SIYI.clean）；
        页面里 css/…、js/… 这些相对路径也靠它从网站最外层找起。
     2. 把标题、简介、canonical 换成这个栏目自己的，搜索引擎和分享链接时用。
     3. 网址写得不标准的（末尾多一个 /、/tool/mnc 这样用了简写的）转到标准写法。
   另外 /sitemap.xml 在这里按现有的文章、词典、编辑器生成，加了文章不用手改。

   词典里的每个词条也有自己的网址（/dict/manhan/abka，词头用词库里的写法）：
     · 五部词典都认这样的网址，标题换成“词头 · 词典名”，网页打开后由浏览器里的程序显示那个词条。
     · 下面 SSR 里列出的词典（现在只有满汉），服务器还把释义直接写进网页：
       分享链接时能带出释义，搜索引擎不运行程序也读得到。词头不存在时回 404。
     · 词条页默认不让搜索引擎收录（网页里加 noindex）。要放开，把 config/site.js 的 indexEntries 改成 true。
       放开前请先确认词典数据的授权：那等于把整部词典一页一页公开给搜索引擎。

   哪些网址是栏目、栏目叫什么名字，见 js/routes.js（浏览器和这里共用）。
   文章、语言、网站名读自 content/texts.js、config/languages.js、config/site.js，
   词典读自 js/dict/dictionaries.js。这些文件有改动，这里会重新读，不必重启。

   没有服务器的地方（GitHub Pages 上的副本、本地预览）没有这些，照旧用带 # 的网址。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const routes = require('../js/routes.js');
const mnc = require('../js/dict/translit-mnc.js');   // 满文转写：词库里的写法 → 正式写法（hvwa → hūwa）

/* 服务器把释义写进网页的词典。每部一行：
     names    各部分词典的名字，和 js/dict/dictionaries.js 里那部词典的 NAMES 一致
     def      释义文字在义项的第几栏，和那里的 textFields 一致
     display  词库里的写法 → 显示的写法
   要给别的词典也做，在这里加一行即可 */
const SSR = {
  manhan: { names: ['满汉大辞典', '新满汉', '满汉和'], def: 3, display: mnc.formal },
};
const DESC_LEN = 110;   // 简介里最多放释义开头的多少个字

const CHECK_GAP = 5000;   // 每隔 5 秒才看一次文件有没有变
const SETTLE = 2000;      // 文件改动满 2 秒才读，免得读到 git 写了一半的文件
const BASE = '<base href="/" data-clean>';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = function (app, dataDir, siteDir) {
  const FILES = {
    index: 'index.html',
    site: 'config/site.js',
    langs: 'config/languages.js',
    texts: 'content/texts.js',
    dicts: 'js/dict/dictionaries.js',
  };
  /* 现在用的一份：index.html 的内容（已加 <base>），以及文章、语言、词典的清单 */
  let S = { html: '', origin: '', title: 'bitig', tagline: '', indexEntries: false, langs: [], texts: [], dicts: [] };
  let stamp = '', checked = 0;

  /* 运行 config/、content/ 里的一个文件，取出它写在 SIYI 上的内容。
     这些文件是给浏览器写的（SIYI.texts = […]），这里给它一个空的 SIYI 让它填 */
  function readSiyi(file) {
    const SIYI = { config: {} };
    vm.runInNewContext(fs.readFileSync(path.join(siteDir, file), 'utf8'), { SIYI }, { timeout: 1000 });
    return SIYI;
  }
  const list = v => (Array.isArray(v) ? v.filter(x => x && typeof x.id === 'string') : []);

  function refresh(first) {
    const now = Date.now();
    if (!first && now - checked < CHECK_GAP) return;
    checked = now;
    let s = '';
    try {
      for (const k in FILES) {
        const st = fs.statSync(path.join(siteDir, FILES[k]));
        if (!first && now - st.mtimeMs < SETTLE) return;   // 还在改，下次再看
        s += st.mtimeMs + ':' + st.size + ';';
      }
    } catch (e) { console.error('[pages] ' + e.message); return; }
    if (s === stamp) return;

    // 一个文件读不出来，只是那一类栏目暂时用不了不带 # 的网址，不影响别的
    const next = { html: '', origin: '', title: 'bitig', tagline: '', indexEntries: false, langs: [], texts: [], dicts: [] };
    const tryRead = (what, f) => { try { f(); } catch (e) { console.error('[pages] 读不出' + what + '：' + e.message); } };
    tryRead(FILES.index, () => {
      const raw = fs.readFileSync(path.join(siteDir, FILES.index), 'utf8');
      // <base> 要放在所有用到相对路径的东西前面，紧跟在 <meta charset> 后面
      const html = raw.replace(/<meta charset="utf-8">/i, m => m + '\n' + BASE);
      if (html === raw) throw new Error('找不到 <meta charset="utf-8">，没法加 <base>');
      next.html = html;
      next.origin = ((/<link rel="canonical" href="(https?:\/\/[^"\/]+)/.exec(raw) || [])[1]) || '';
    });
    tryRead(FILES.site, () => {
      const site = readSiyi(FILES.site).config.site;
      next.title = String(site.title || 'bitig');
      next.tagline = String(site.tagline || '');
      next.indexEntries = site.indexEntries === true;
    });
    tryRead(FILES.langs, () => { next.langs = list(readSiyi(FILES.langs).languages); });
    tryRead(FILES.texts, () => { next.texts = list(readSiyi(FILES.texts).texts); });
    tryRead(FILES.dicts, () => {
      // 各部词典设置的第一行形如  id: 'manhan', tab: '满汉', title: '满汉词典', …
      const code = fs.readFileSync(path.join(siteDir, FILES.dicts), 'utf8');
      const re = /\bid: '([a-z0-9]+)', tab: '[^']*', title: '([^']*)'/g;
      let m;
      while ((m = re.exec(code))) next.dicts.push({ id: m[1], title: m[2] });
      if (!next.dicts.length) throw new Error('没有找到词典的设置（id: …, tab: …, title: …）');
    });
    S = next; stamp = s;
  }
  refresh(true);

  /* 一个栏目的标题和简介；没有这个栏目（文章简写写错了等）返回 null。desc 不写就用 index.html 里原有的 */
  function meta(name) {
    const plain = { texts: '文章', materials: '资料库', sayings: '名句', dict: '词典', contact: '问题反馈' };
    // 首页：网站名 — 一句说明（config/site.js 的 tagline）；没写说明就用 index.html 里原有的标题
    if (name === 'home') return S.tagline ? { full: S.title + ' — ' + S.tagline } : {};
    if (plain[name]) return { title: plain[name] };
    if (name.indexOf('/') > 0) return entryMeta(name);
    const kind = name.slice(0, 5), id = name.slice(5);
    if (kind === 'text-') {
      const t = S.texts.find(x => x.id === id);
      return t ? { title: t.title || '文章', desc: [t.title, t.subtitle].filter(Boolean).join('：') } : null;
    }
    if (kind === 'dict-') {
      const d = S.dicts.find(x => x.id === id);
      return d ? { title: d.title } : null;
    }
    if (kind === 'tool-') {
      const l = S.langs.find(x => x.id === id);
      return l && l.editor ? { title: l.name + '对照转写' } : null;
    }
    return null;
  }

  /* 词典里的一个词条（名字是 dict-词典名/词头）的标题、简介，以及要写进网页的释义 */
  function entryMeta(name) {
    const k = name.indexOf('/'), key = name.slice(k + 1);
    const d = S.dicts.find(x => 'dict-' + x.id === name.slice(0, k));
    if (!d) return null;
    const conf = SSR[d.id], find = app.locals.bitigDict && app.locals.bitigDict.find;
    // 不在 SSR 里的词典（或词库没读进来）：只换标题，释义由浏览器里的程序去取
    if (!conf || !find) return { title: key + ' · ' + d.title, noindex: !S.indexEntries };
    const head = conf.display(key), hit = find(d.id, key);
    if (!hit) return { title: head + ' · ' + d.title, noindex: true, status: 404 };
    // 释义里夹着的拉丁字母转写词也换成正式写法，和网页上显示的一致
    const show = t => String(t || '').replace(/[A-Za-z@][A-Za-z@'_=\-]*[A-Za-z@]|[A-Za-z@]/g, w => conf.display(w));
    const senses = hit.raw.split('\x1e').map(x => x.split('\x1f')).filter(f => f[conf.def])
      .map(f => ({ from: conf.names[+f[0] || 0] || '', text: show(f[conf.def]) }));
    const first = senses.length ? senses[0].text.replace(/\s+/g, ' ').trim() : '';
    return {
      title: head + ' · ' + d.title,
      desc: first ? head + '：' + (first.length > DESC_LEN ? first.slice(0, DESC_LEN) + '…' : first) : undefined,
      noindex: !S.indexEntries,
      // 写进网页的释义。浏览器里的程序一运行，这一块就被词典的界面换掉（js/pages/dict.js 的 build）
      body: '<div class="dx-ssr"><h1>' + esc(head) + '</h1><p class="dx-ssr-from">' + esc(d.title) + '</p><dl>' +
        senses.map(x => '<dt>' + esc(x.from) + '</dt><dd>' + esc(x.text) + '</dd>').join('') + '</dl></div>',
    };
  }

  /* 把 index.html 里的标题、简介、网址换成这个栏目的 */
  function render(m, url) {
    let html = S.html;
    const attr = (re, v) => { html = html.replace(re, (all, a, b) => a + esc(v) + b); };
    if (S.origin) {
      attr(/(<link rel="canonical" href=")[^"]*(")/, S.origin + url);
      attr(/(<meta property="og:url" content=")[^"]*(")/, S.origin + url);
    }
    if (m.title || m.full) {
      const full = m.full || m.title + ' · ' + S.title;
      html = html.replace(/<title>[^<]*<\/title>/, () => '<title>' + esc(full) + '</title>');
      attr(/(<meta property="og:title" content=")[^"]*(")/, full);
    }
    if (m.desc) {
      attr(/(<meta name="description" content=")[^"]*(")/, m.desc);
      attr(/(<meta property="og:description" content=")[^"]*(")/, m.desc);
    }
    if (m.noindex) html = html.replace(BASE, () => BASE + '\n<meta name="robots" content="noindex">');
    if (m.body) {
      // 把释义放进词典那一块，并让网页一打开显示的就是它，而不是空着的首页
      const withBody = html.replace(/<main([^>]*)id="v-dict" hidden><\/main>/, (all, a) => '<main' + a + 'id="v-dict">' + m.body + '</main>');
      if (withBody !== html) html = withBody.replace(/(<main[^>]*id="v-home")/, (all, a) => a + ' hidden');
    }
    return html;
  }

  const query = req => { const i = req.originalUrl.indexOf('?'); return i < 0 ? '' : req.originalUrl.slice(i); };

  app.get(['/', '/texts', '/texts/:a', '/materials', '/sayings', '/contact', '/dict', '/dict/:a', '/dict/:a/:b', '/tool/:a'], (req, res, next) => {
    refresh(false);
    if (!S.html) return next();   // index.html 读不出来：交给后面，按老办法发原样的文件
    const name = routes.fromPath(req.path, S.langs);
    const m = name === null ? null : meta(name);
    if (!m) return next();        // 不是栏目（如 /dict/data/…）：交给后面发文件
    const url = routes.toPath(name, S.langs);
    // 网址写得不标准的转到标准写法。词头里的字符可以有几种 %XX 的写法，所以先都还原了再比
    let same = false;
    try { same = decodeURIComponent(url) === decodeURIComponent(req.path); } catch (e) { return next(); }
    if (!same) return res.redirect(301, url + query(req));
    res.set('Cache-Control', 'no-cache');   // 每次都问一下有没有新的，网站更新后读者马上看到
    res.status(m.status || 200).type('html').send(render(m, url));
  });

  /* /index.html 也是首页。# 后面的部分浏览器会自己带过去，旧链接（index.html#dict-manhan）不受影响 */
  app.get('/index.html', (req, res) => res.redirect(301, '/' + query(req)));

  app.get('/sitemap.xml', (req, res, next) => {
    refresh(false);
    if (!S.html || !S.origin) return next();
    const names = ['home', 'texts', 'materials', 'sayings']
      .concat(S.texts.map(t => 'text-' + t.id))
      .concat(S.dicts.map(d => 'dict-' + d.id))
      .concat(S.langs.filter(l => l.editor && !l.hidden && !l.wip).map(l => 'tool-' + l.id));
    const urls = names.map(n => routes.toPath(n, S.langs)).filter(Boolean);
    res.set('Cache-Control', 'no-cache');
    res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + esc(S.origin + u) + '</loc></url>\n').join('') + '</urlset>\n');
  });
};
