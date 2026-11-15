/* 资料：按语言分组的目录，可按语言筛选、按书名和作者搜索。目录在 content/materials.js，文件在 content/materials/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const KIND = { pdf: 'PDF', png: '图片', jpg: '图片', jpeg: '图片', gif: '图片', webp: '图片', svg: '图片',
    txt: '文本', md: '文本', csv: '表格', json: '数据', mp4: '视频', webm: '视频', zip: '压缩包', docx: 'Word', xlsx: 'Excel' };
  const ext = m => ((m.file || m.url || '').split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  const kind = m => KIND[ext(m)] || (m.file ? '文件' : m.url ? '链接' : '书目');

  /* 一份资料占两行：第一行书名，右边是类型、大小等；第二行作者与出版信息。
     PDF 最常见，不标类型；别的类型（图片、链接、书目……）才标。图片在书名前带一张小图。
     chips 为真时加语言标签：只给归入几种语言的资料加，提示它在别的语言下也有 */
  function item(m) {
    const href = m.file || m.url || '', k = kind(m);
    const isImg = m.file && KIND[ext(m)] === '图片';
    const host = k === '链接' ? ((m.url.match(/^https?:\/\/([^/]+)/) || [])[1] || '') : '';
    const facts = [k === 'PDF' ? '' : k, m.size || '', host].filter(Boolean).join(' · ');
    const title = esc(m.title || '未命名');
    return `<li>${isImg ? `<img class="thumb" src="${esc(m.file)}" alt="" loading="lazy">` : ''}
      <div class="info">
        <div class="head">${href ? `<a class="t" href="${esc(href)}" target="_blank" rel="noopener">${title}<span class="out" aria-hidden="true"> ↗</span></a>` : `<span class="t">${title}</span>`}
          <span class="meta">${facts ? `<span>${esc(facts)}</span>` : ''}${(m.langs || []).length > 1 ? SIYI.chips(m) : ''}</span></div>
        ${m.note ? `<div class="note">${esc(m.note)}</div>` : ''}</div></li>`;
  }

  /* 搜索：把书名、作者与出版信息、语言名连成一串来找。不分大小写，也不分字母上的附加符号
     （搜 janos 能找到 János）；输入几个词（空格隔开）时要同时出现 */
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hay = new Map();   // 每份资料连成的那一串，算一次留着用
  function matches(m, terms) {
    if (!hay.has(m)) hay.set(m, fold([m.title, m.note].concat(SIYI.itemLangs(m).map(l => l.name)).join(' ')));
    const h = hay.get(m);
    return terms.every(t => h.includes(t));
  }

  /* 顶上一排语言按钮筛选，旁边是搜索框。资料按语言分组，组内按加入先后，新的在前；
     归入几种语言的资料在每一组里都出现 */
  let filter = SIYI.store.get('siyi-mat-filter') || 'all';
  let wired = false;
  function renderList() {
    // 顶上的“添加资料，请……”：能留言就指到留言栏目，否则用 config/site.js 里的 email；两样都没有就不显示这一行
    const site = SIYI.config.site, email = site.email, canContact = site.contact !== false && SIYI.clean;
    $('mats-contact').hidden = !email && !canContact;
    $('mats-contact').innerHTML = canContact ? `添加资料，请到<a id="mats-contact-link" href="${esc(SIYI.href('contact'))}">问题反馈</a>里说明`
      : email ? `添加资料，请联系 <a href="mailto:${esc(email)}">${esc(email)}</a>` : '';
    // 从这里去留言，类别先选好“添加资料”
    const link = $('mats-contact-link');
    if (link) link.addEventListener('click', () => { SIYI.pages.contact.preset = 'material'; });

    const qEl = $('mats-q');
    if (!wired) { wired = true; qEl.addEventListener('input', renderList); }
    const all = SIYI.materials.slice().reverse();
    qEl.hidden = !all.length;
    if (!all.length) {
      $('mats-count').textContent = '';
      $('mats-filter').innerHTML = '';
      $('mats-groups').innerHTML = '<div class="empty-box">还没有资料。资料的登记方法见 content/materials.js 开头的说明。</div>';
      return;
    }
    const terms = fold(qEl.value).split(/\s+/).filter(Boolean);
    const found = terms.length ? all.filter(m => matches(m, terms)) : all;
    $('mats-count').textContent = terms.length ? `找到 ${found.length} 份，共 ${all.length} 份` : `共 ${all.length} 份`;

    // 按钮照全部资料的语言列出，搜索时不增不减；后面的数字是搜到的份数
    const key = g => g.key || '_';
    const groups = SIYI.groupByLang(found, '综合');
    const buttons = SIYI.groupByLang(all, '综合').map(g => ({ f: key(g), name: g.name, n: (groups.find(x => key(x) === key(g)) || { items: [] }).items.length }));
    if (filter !== 'all' && !buttons.some(b => b.f === filter)) filter = 'all';
    $('mats-filter').innerHTML = [{ f: 'all', name: '全部', n: found.length }].concat(buttons)
      .map(b => `<button type="button" data-f="${esc(b.f)}" aria-pressed="${b.f === filter}">${esc(b.name)} ${b.n}</button>`).join('');
    $('mats-filter').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      filter = btn.dataset.f; SIYI.store.set('siyi-mat-filter', filter); renderList();
    }));

    const shown = filter === 'all' ? groups : groups.filter(g => key(g) === filter);
    $('mats-groups').innerHTML = shown.length
      ? shown.map(g => `<div class="group"><h3>${esc(g.name)} <span class="n">${g.items.length} 份</span></h3><ul class="mlist">${g.items.map(item).join('')}</ul></div>`).join('')
      : `<div class="empty-box">${filter === 'all' ? '' : '“' + esc((buttons.find(b => b.f === filter) || {}).name) + '”下'}没有找到含“${esc(qEl.value.trim())}”的资料${filter === 'all' ? '' : '。可以点“全部”在所有语言里找'}。</div>`;
  }

  SIYI.checkList(SIYI.materials, 'content/materials.js', ['title']);
  SIYI.pages.materials = { renderList };
})();
