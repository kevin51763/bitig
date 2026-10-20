/* 资料：按语言分类的目录。目录在 content/materials.js，文件在 content/materials/。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  const KIND = { pdf: 'PDF', png: '图片', jpg: '图片', jpeg: '图片', gif: '图片', webp: '图片', svg: '图片',
    txt: '文本', md: '文本', csv: '表格', json: '数据', mp4: '视频', webm: '视频', zip: '压缩包', docx: 'Word', xlsx: 'Excel' };
  const ext = m => ((m.file || '').split('.').pop() || '').toLowerCase();
  const kind = m => m.file ? (KIND[ext(m)] || '文件') : '链接';

  function item(m) {
    const href = m.file || m.url || '#';
    const isImg = m.file && KIND[ext(m)] === '图片';
    const host = !m.file && m.url ? ((m.url.match(/^https?:\/\/([^/]+)/) || [])[1] || '') : '';
    return `<li><span class="kind">${isImg ? `<img src="${esc(m.file)}" alt="" loading="lazy">` : esc(kind(m))}</span>
      <span class="info"><a class="t" href="${esc(href)}" target="_blank" rel="noopener">${esc(m.title || '未命名')} ↗</a>
        ${m.note ? `<span class="note">${esc(m.note)}</span>` : ''}
        <span class="meta"><span>${esc(kind(m))}${host ? ' · ' + esc(host) : ''}</span>${SIYI.chips(m)}</span></span></li>`;
  }

  function renderList() {
    const all = SIYI.materials;
    $('mats-count').textContent = all.length ? `共 ${all.length} 份` : '';
    $('mats-groups').innerHTML = all.length
      ? SIYI.groupByLang(all.slice().reverse(), '综合').map(g => `<div class="group"><h3>${esc(g.name)} <span class="n">${g.items.length} 份</span></h3><ul class="mlist">${g.items.map(item).join('')}</ul></div>`).join('')
      : '<div class="empty-box">还没有资料。资料的登记方法见 content/materials.js 开头的说明。</div>';
  }

  SIYI.checkList(SIYI.materials, 'content/materials.js', ['title', ['file', 'url']]);
  SIYI.pages.materials = { renderList };
})();
