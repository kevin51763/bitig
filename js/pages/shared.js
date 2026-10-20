/* 各栏目共用的小部件：语言标签、按语言分组。 */
(function () {
  const esc = SIYI.esc;

  /* 一条范文或资料归入的语言：[{ key, name }] */
  SIYI.itemLangs = d => (d.langs || []).map(k => ({ key: k, name: SIYI.langName(k) }));

  SIYI.chips = d => `<span class="lchips">${SIYI.itemLangs(d).map(x => `<span class="lchip">${esc(x.name)}</span>`).join('')}</span>`;

  /* 按语言分组；同一条归入几种语言，就出现在几组里。组的顺序依 config/languages.js，其余按名称 */
  SIYI.groupByLang = (items, fallback) => {
    const groups = new Map();
    items.forEach(d => {
      const ls = SIYI.itemLangs(d);
      (ls.length ? ls : [{ key: '', name: fallback }]).forEach(l => {
        if (!groups.has(l.key)) groups.set(l.key, { key: l.key, name: l.name, items: [] });
        groups.get(l.key).items.push(d);
      });
    });
    const order = SIYI.languages.map(l => l.id);
    return [...groups.values()].sort((a, b) => {
      const ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.name.localeCompare(b.name, 'zh');
    });
  };

  /* 检查目录里漏写的项目，在页面顶上提示 */
  SIYI.checkList = (list, file, need) => {
    const seen = new Set();
    list.forEach((d, i) => {
      const where = `${file} 第 ${i + 1} 项${d && d.title ? '（' + d.title + '）' : ''}`;
      if (!d || typeof d !== 'object') { SIYI.problem(`${where} 不是 { … } 的格式`); return; }
      need.forEach(k => { if (Array.isArray(k) ? !k.some(x => d[x]) : !d[k]) SIYI.problem(`${where} 缺少 ${Array.isArray(k) ? k.join(' 或 ') : k}`); });
      if (d.id) { if (seen.has(d.id)) SIYI.problem(`${where} 的 id「${d.id}」和前面重复了`); seen.add(d.id); }
      (d.langs || []).forEach(k => { if (/^[a-z]+$/.test(k) && !SIYI.lang(k)) SIYI.problem(`${where} 的语言简写「${k}」在 config/languages.js 里没有`); });
    });
  };
})();
