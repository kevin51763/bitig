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
  data: {},           // 大块数据，如碑文词形表
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

  /* 一条词典链接：站外的在新标签页打开并加 ↗，站内的（如 dict/ 里的词典）直接打开 */
  SIYI.dictLink = d => /^https?:/.test(d.url || '')
    ? `<a href="${SIYI.esc(d.url)}" target="_blank" rel="noopener">${SIYI.esc(d.name)} ↗</a>`
    : `<a href="${SIYI.esc(d.url)}">${SIYI.esc(d.name)}</a>`;

  /* 某种语言的词典入口，显示在编辑器标题下面，每部词典一个按钮（样式在 three-pane.css 的 .tool-dicts） */
  const BOOK = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2.5 3.2c1.9-.6 3.8-.4 5.5.8 1.7-1.2 3.6-1.4 5.5-.8v9.3c-1.9-.6-3.8-.4-5.5.8-1.7-1.2-3.6-1.4-5.5-.8zM8 4v9.3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  SIYI.dictLine = (el, langId) => {
    if (!el) return;
    const list = (SIYI.dictionaries.list || []).filter(d => (d.langs || []).includes(langId));
    el.hidden = !list.length;
    el.innerHTML = list.length ? '<span class="lbl">查词</span>' +
      list.map(d => SIYI.dictLink(d).replace('>', '>' + BOOK)).join('') : '';
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
    const cur = document.currentScript && document.currentScript.getAttribute('src');
    const f = (e.filename || '').replace(location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''), '') || cur || '某个文件';
    if (!e.lineno || /^Script error/.test(e.message)) SIYI.problem(`${f} 有写法错误（常见的是漏了逗号、引号或括号）。双击打开时看不到具体行号，用 README 里的“本地预览”方法打开即可看到。`);
    else SIYI.problem(`${f} 第 ${e.lineno} 行：${e.message}`);
  });
})();
