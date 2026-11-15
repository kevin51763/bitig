/* “问题反馈”栏目：读者写一段话给网站的主人，不用公开邮箱，读者也不用注册。
   留言由 bitig.ink 的服务器保存（server/messages.js），网站的主人在 bitig.ink/admin.html 查看。
   没有服务器的地方（GitHub Pages 上的副本、本地预览）不能留言，页面上只写一句说明。
   页脚的“问题反馈”和资料库顶上的链接由 config/site.js 的 contact 开关控制。 */
(function () {
  const $ = SIYI.$, esc = SIYI.esc;
  /* 留言的类别：前面是存进数据库的名字（不要改），后面是显示的文字 */
  const KINDS = [['fix', '纠错'], ['material', '添加资料'], ['other', '其他']];
  const MAX_TEXT = 2000, MAX_CONTACT = 200;   // 字数上限，和 server/messages.js 里的一致

  /* 记下读者来留言之前在哪个栏目（如 dict-manhan），随留言一起交上去，纠错时方便查找 */
  let cur = '', prev = '';
  window.addEventListener('siyi-route', () => {
    const r = SIYI.route();
    if (r !== cur) { prev = cur; cur = r; }
  });

  let built = false;
  function build() {
    built = true;
    const v = $('v-contact');
    const head = `<a class="backlink" href="${esc(SIYI.href('home'))}">← 首页</a>
      <div class="sec-head plain"><h1 class="vh">问题反馈</h1></div>`;
    if (!SIYI.clean) {
      // 没有服务器：指到正式网站去。正式网站的网址取自 index.html 里的 canonical
      const c = document.querySelector('link[rel="canonical"]');
      const url = (c ? c.href.replace(/\/$/, '') : '') + '/contact';
      v.innerHTML = head + `<div class="empty-box">这里是网站的副本，不能反馈。请到 <a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a>。</div>`;
      return;
    }
    v.innerHTML = head + `
      <form class="contact" id="contact-form">
        <p class="small">发现转写、释义有错，想添加资料，或者有别的话要说，都可以写在这里。写的内容只有网站的主人能看到。</p>
        <div class="seg" id="contact-kind" role="group" aria-label="类别">${KINDS.map(([k, t], i) =>
          `<button type="button" data-v="${k}" aria-pressed="${i === 2}">${t}</button>`).join('')}</div>
        <label>内容
          <textarea id="contact-text" rows="8" maxlength="${MAX_TEXT}" required placeholder="纠错请写明是哪部词典的哪个词，或哪篇文章的哪一句"></textarea></label>
        <label>联系方式（选填）
          <input id="contact-contact" type="text" maxlength="${MAX_CONTACT}" autocomplete="off" placeholder="邮箱、微信等。不留就收不到回复"></label>
        <!-- 下面这一栏读者看不见，是用来拦自动灌水的程序的：人不会填，程序多半会填 -->
        <input class="contact-hp" id="contact-website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="toolbar"><button type="submit" class="btn primary" id="contact-send">提交</button><span class="small" id="contact-status" role="status"></span></div>
        <p class="small">不记录你的网络地址。为方便查找，会一并记下你来这里之前所在的栏目。</p>
      </form>
      <div class="empty-box" id="contact-done" hidden>已收到，谢谢。<button type="button" class="btn" id="contact-again">再写一条</button></div>`;

    const kindEl = $('contact-kind');
    kindEl.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) setKind(b.dataset.v);
    });
    $('contact-form').addEventListener('submit', e => { e.preventDefault(); send(); });
    $('contact-again').addEventListener('click', () => { $('contact-done').hidden = true; $('contact-form').hidden = false; $('contact-text').focus(); });
  }
  function setKind(k) {
    $('contact-kind').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === k)));
  }

  function send() {
    const text = $('contact-text').value.trim(), status = $('contact-status'), btn = $('contact-send');
    if (!text) { status.textContent = '内容是空的。'; return; }
    const kind = ($('contact-kind').querySelector('[aria-pressed="true"]') || {}).dataset;
    btn.disabled = true; status.textContent = '正在提交…';
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: kind ? kind.v : 'other', text,
        contact: $('contact-contact').value.trim(),
        from: prev, website: $('contact-website').value,
      }),
    }).then(r => r.json().catch(() => ({})).then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        btn.disabled = false;
        if (!ok) { status.textContent = d.note || '没有提交成功，请稍后再试。'; return; }
        status.textContent = '';
        $('contact-text').value = '';   // 联系方式留着，再写一条时不用重填
        $('contact-form').hidden = true; $('contact-done').hidden = false;
      })
      .catch(() => { btn.disabled = false; status.textContent = '没有发出去，请检查网络后重试。'; });
  }

  SIYI.pages.contact = {
    /* 别的栏目带读者过来时，可以先替他选好类别，如 SIYI.pages.contact.preset = 'material' */
    preset: '',
    render() {
      if (!built) build();   // 只建一次：读者写到一半去别的栏目看一眼，回来时写的还在
      if (this.preset && $('contact-kind')) setKind(this.preset);
      this.preset = '';
    }
  };
})();
