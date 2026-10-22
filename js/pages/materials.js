/* 资料：按语言分类的目录。目录在 content/materials.js，文件在 content/materials/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const KIND = { pdf: 'PDF', png: '图片', jpg: '图片', jpeg: '图片', gif: '图片', webp: '图片', svg: '图片',
    txt: '文本', md: '文本', csv: '表格', json: '数据', mp4: '视频', webm: '视频', zip: '压缩包', docx: 'Word', xlsx: 'Excel' };
  const ext = m => ((m.file || m.url || '').split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  const kind = m => KIND[ext(m)] || (m.file ? '文件' : m.url ? '链接' : '书目');

  function item(m) {
    const href = m.file || m.url || '';
    const isImg = m.file && KIND[ext(m)] === '图片';
    const host = kind(m) === '链接' ? ((m.url.match(/^https?:\/\/([^/]+)/) || [])[1] || '') : '';
    return `<li><span class="kind">${isImg ? `<img src="${esc(m.file)}" alt="" loading="lazy">` : esc(kind(m))}</span>
      <span class="info">${href ? `<a class="t" href="${esc(href)}" target="_blank" rel="noopener">${esc(m.title || '未命名')} ↗</a>` : `<span class="t">${esc(m.title || '未命名')}</span>`}
        ${m.note ? `<span class="note">${esc(m.note)}</span>` : ''}
        <span class="meta"><span>${esc(kind(m))}${m.size ? ' · ' + esc(m.size) : ''}${host ? ' · ' + esc(host) : ''}</span>${SIYI.chips(m)}</span></span></li>`;
  }

  /* 顶上一排语言按钮筛选；“全部”时每份资料只列一次，按加入先后，新的在前 */
  let filter = SIYI.store.get('siyi-mat-filter') || 'all';
  function renderList() {
    const all = SIYI.materials.slice().reverse();
    $('mats-count').textContent = all.length ? `共 ${all.length} 份` : '';
    if (!all.length) {
      $('mats-filter').innerHTML = '';
      $('mats-groups').innerHTML = '<div class="empty-box">还没有资料。资料的登记方法见 content/materials.js 开头的说明。</div>';
      return;
    }
    const groups = SIYI.groupByLang(all, '综合').map(g => ({ ...g, f: g.key || '_' }));
    if (filter !== 'all' && !groups.some(g => g.f === filter)) filter = 'all';
    $('mats-filter').innerHTML = [{ f: 'all', name: '全部', items: all }].concat(groups)
      .map(g => `<button type="button" data-f="${esc(g.f)}" aria-pressed="${g.f === filter}">${esc(g.name)} ${g.items.length}</button>`).join('');
    $('mats-filter').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      filter = btn.dataset.f; SIYI.store.set('siyi-mat-filter', filter); renderList();
    }));
    const shown = filter === 'all' ? all : groups.find(g => g.f === filter).items;
    $('mats-groups').innerHTML = `<ul class="mlist">${shown.map(item).join('')}</ul>`;
  }

  SIYI.checkList(SIYI.materials, 'content/materials.js', ['title']);
  SIYI.pages.materials = { renderList };
})();
