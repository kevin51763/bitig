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

   哪些网址是栏目、栏目叫什么名字，见 js/routes.js（浏览器和这里共用）。
   文章、语言、网站名读自 content/texts.js、config/languages.js、config/site.js，
   词典读自 js/dict/dictionaries.js。这些文件有改动，这里会重新读，不必重启。

   没有服务器的地方（GitHub Pages 上的副本、本地预览）没有这些，照旧用带 # 的网址。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const routes = require('../js/routes.js');

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
  let S = { html: '', origin: '', title: 'bitig', langs: [], texts: [], dicts: [] };
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
    const next = { html: '', origin: '', title: 'bitig', langs: [], texts: [], dicts: [] };
    const tryRead = (what, f) => { try { f(); } catch (e) { console.error('[pages] 读不出' + what + '：' + e.message); } };
    tryRead(FILES.index, () => {
      const raw = fs.readFileSync(path.join(siteDir, FILES.index), 'utf8');
      // <base> 要放在所有用到相对路径的东西前面，紧跟在 <meta charset> 后面
      const html = raw.replace(/<meta charset="utf-8">/i, m => m + '\n' + BASE);
      if (html === raw) throw new Error('找不到 <meta charset="utf-8">，没法加 <base>');
      next.html = html;
      next.origin = ((/<link rel="canonical" href="(https?:\/\/[^"\/]+)/.exec(raw) || [])[1]) || '';
    });
    tryRead(FILES.site, () => { next.title = String(readSiyi(FILES.site).config.site.title || 'bitig'); });
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
    const plain = { texts: '文章', materials: '资料库', sayings: '名句', dict: '词典' };
    if (name === 'home') return {};
    if (plain[name]) return { title: plain[name] };
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

  /* 把 index.html 里的标题、简介、网址换成这个栏目的 */
  function render(m, url) {
    let html = S.html;
    const attr = (re, v) => { html = html.replace(re, (all, a, b) => a + esc(v) + b); };
    if (S.origin) {
      attr(/(<link rel="canonical" href=")[^"]*(")/, S.origin + url);
      attr(/(<meta property="og:url" content=")[^"]*(")/, S.origin + url);
    }
    if (m.title) {
      const full = m.title + ' · ' + S.title;
      html = html.replace(/<title>[^<]*<\/title>/, () => '<title>' + esc(full) + '</title>');
      attr(/(<meta property="og:title" content=")[^"]*(")/, full);
    }
    if (m.desc) {
      attr(/(<meta name="description" content=")[^"]*(")/, m.desc);
      attr(/(<meta property="og:description" content=")[^"]*(")/, m.desc);
    }
    return html;
  }

  const query = req => { const i = req.originalUrl.indexOf('?'); return i < 0 ? '' : req.originalUrl.slice(i); };

  app.get(['/', '/texts', '/texts/:a', '/materials', '/sayings', '/dict', '/dict/:a', '/tool/:a'], (req, res, next) => {
    refresh(false);
    if (!S.html) return next();   // index.html 读不出来：交给后面，按老办法发原样的文件
    const name = routes.fromPath(req.path, S.langs);
    const m = name === null ? null : meta(name);
    if (!m) return next();        // 不是栏目（如 /dict/data/…）：交给后面发文件
    const url = routes.toPath(name, S.langs);
    if (url !== req.path) return res.redirect(301, url + query(req));
    res.set('Cache-Control', 'no-cache');   // 每次都问一下有没有新的，网站更新后读者马上看到
    res.type('html').send(render(m, url));
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
