/* 全站共用的命名空间和几件小工具。最先载入；其余文件都把自己的内容挂到 SIYI 上。
   一般不需要改动。 */
var SIYI = globalThis.SIYI = {
  config: {},          // config/site.js
  languages: [],       // config/languages.js
  dictionaries: {},    // config/dictionaries.js
  texts: [],           // content/texts.js
  materials: [],       // content/materials.js
  sayings: [],         // content/sayings.js
  converters: {},      // js/converters/*.js，两栏编辑器用
  notes: {},           // 编辑器下方的说明文字
  data: {},            // 大块数据，如碑文词形表
  pages: {}            // js/pages/*.js，各栏目
};

(function () {
  SIYI.$ = id => document.getElementById(id);
  SIYI.esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  SIYI.store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  SIYI.lang = id => SIYI.languages.find(l => l.id === id) || null;
  /* 一个语言标记（如 'mnc'，或直接写的 '汉文'）对应的显示名 */
  SIYI.langName = id => (SIYI.lang(id) || {}).name || id;

  /* 网址是不是站外的（以 http 开头）。站外链接在新标签页打开 */
  SIYI.isExternal = url => /^https?:/.test(url || '');

  /* ---------- 栏目的网址 ----------
     栏目在程序里各有一个名字（home、texts、text-简写、dict-词典名、tool-语言简写……，见 js/routes.js）。
     网址有两种写法：带 # 的（#dict-manhan）和不带 # 的（/dict/manhan）。
     bitig.ink 的服务器发页面时，在 <head> 里加一行 <base href="/" data-clean>（server/pages.js），
     见到这一行就用不带 # 的；没有服务器的地方见不到这一行，照旧用带 # 的。 */
  SIYI.clean = typeof document !== 'undefined' && !!document.querySelector('base[data-clean]');
  /* 栏目的名字 → 链接里写的网址。写链接都用它：href="${SIYI.href('texts')}" */
  SIYI.href = name => (SIYI.clean && SIYI.routes.toPath(name, SIYI.languages)) || '#' + name;
  /* 配置里写的网址（config/dictionaries.js 的 url）：以 # 开头的是本站栏目，换成当前用的写法；其余原样 */
  SIYI.link = url => (url && url.charAt(0) === '#' ? SIYI.href(url.slice(1)) : url);
  /* 现在的网址是哪个栏目 */
  SIYI.route = () => SIYI.clean
    ? SIYI.routes.fromPath(location.pathname, SIYI.languages) || 'home'
    : (location.hash || '#home').slice(1);
  /* 一个链接（<a> 元素）指向哪个栏目；不是本站栏目的返回 null */
  SIYI.routeOfLink = a => {
    const raw = a.getAttribute('href') || '';
    if (raw.charAt(0) === '#') return !SIYI.clean || SIYI.routes.toPath(raw.slice(1), SIYI.languages) ? raw.slice(1) : null;
    if (!SIYI.clean || a.origin !== location.origin) return null;
    return SIYI.routes.fromPath(a.pathname, SIYI.languages);
  };
  /* 另有 SIYI.go(名字)：转到某个栏目，在 js/router.js 里 */

  /* 某种语言的原文该怎样排：竖写、转 90° 竖写，还是横写（config/languages.js 的 vertical）。
     返回要加的 class；竖写的 class 名各处不同，由调用的地方给出 */
  SIYI.vertClass = (lang, vert, rotated = 'rot') =>
    !lang ? '' : lang.vertical === 'rotated' ? ' ' + rotated : lang.vertical ? ' ' + vert : '';

  /* 页面底部弹出一句短提示，过一会儿自动消失（如“已复制”） */
  let toastTimer = null;
  SIYI.toast = msg => {
    const el = SIYI.$('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1600);
  };

  /* 一条词典链接：站外的在新标签页打开并加 ↗，站内的（如 dict/ 里的词典）直接打开 */
  SIYI.dictLink = d => SIYI.isExternal(d.url)
    ? `<a href="${SIYI.esc(d.url)}" target="_blank" rel="noopener">${SIYI.esc(d.name)} ↗</a>`
    : `<a href="${SIYI.esc(SIYI.link(d.url))}">${SIYI.esc(d.name)}</a>`;

  /* 某种语言的词典入口，显示在编辑器标题下面，每部词典一个按钮（样式在 three-pane.css 的 .tool-dicts） */
  SIYI.dictLine = (el, langId) => {
    if (!el) return;
    const list = (SIYI.dictionaries.list || []).filter(d => (d.langs || []).includes(langId));
    el.hidden = !list.length;
    el.innerHTML = list.length ? '<span class="lbl">查词</span>' +
      list.map(d => SIYI.dictLink(d)).join('') : '';
  };

  /* 开发中的编辑器在标题下面显示一条提醒（config/languages.js 的 wip，文字见 config/site.js 的 wipNote；样式在 three-pane.css 的 .wip-note） */
  SIYI.wipLine = (el, langId) => {
    if (!el) return;
    const l = SIYI.lang(langId) || {};
    el.hidden = !l.wip;
    const text = typeof l.wip === 'string' ? l.wip : (SIYI.config.site.wipNote || '这一功能仍在开发中，结果可能有误。');
    el.innerHTML = l.wip ? `<b>开发中</b><span>${SIYI.esc(text)}</span>` : '';
  };

  /* 配置或内容文件写错时，在页面顶上直接说明是哪个文件、第几行，免得整页空白却不知原因 */
  const problems = [];
  SIYI.problem = msg => {
    problems.push(msg);
    const show = () => {
      let box = document.getElementById('siyi-problems');
      if (!box) {
        box = document.createElement('div'); box.id = 'siyi-problems'; box.className = 'problems';
        document.body.prepend(box);
      }
      box.innerHTML = '<b>网站有文件写错了，请按提示修改：</b><ul>' + problems.map(p => `<li>${SIYI.esc(p)}</li>`).join('') + '</ul>';
    };
    if (typeof document === 'undefined') return;
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  };
  if (typeof window !== 'undefined') window.addEventListener('error', e => {
    // 浏览器自身的提示（如 ResizeObserver loop…）、浏览器插件或页面以外脚本的报错，都与本站文件无关，不报
    if (/ResizeObserver loop/.test(e.message || '')) return;
    if (!e.lineno && e.filename && !/\.js(\?|$)/.test(e.filename)) return;
    const cur = document.currentScript && document.currentScript.getAttribute('src');
    const f = (e.filename || '').replace(document.baseURI.replace(/[#?].*$/, '').replace(/[^/]*$/, ''), '') || cur || '某个文件';
    if (!e.lineno || /^Script error/.test(e.message)) SIYI.problem(`${f} 有写法错误（常见的是漏了逗号、引号或括号）。双击打开时看不到具体行号，用 README 里的“本地预览”方法打开即可看到。`);
    else SIYI.problem(`${f} 第 ${e.lineno} 行：${e.message}`);
  });
})();
