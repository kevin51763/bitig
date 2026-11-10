/* 访问计数：页脚显示“总访问”和“今日访问”。

   数字不在这个仓库里，由 bitig.ink 服务器上的接口 /api/visit 记录（程序在 server/counter.js，
   安装方法见 README 的“访问计数”）。
     · 读者每次打开网站记一次；同一个标签页里刷新、切换栏目不重复记。
     · “今日”按北京时间算，每天零点归零。
   接口读不到时（GitHub Pages 上的副本没有服务器、双击 index.html 打开、网络不通），
   页脚不显示这一行，网站其余部分照常使用。
   要关掉计数：把 config/site.js 里的 counter 改成 false。 */
(function () {
  const el = SIYI.$('foot-stats');
  if (!el || SIYI.config.site.counter === false) return;
  if (!/^https?:$/.test(location.protocol)) return;   // 双击打开的本地文件没有接口可用

  const API = '/api/visit';
  const SEEN = 'bitig-visited';   // 记在标签页里：这个标签页是否已经记过一次

  let seen = false;
  try { seen = sessionStorage.getItem(SEEN) === '1'; } catch (e) {}

  const fmt = n => Number(n).toLocaleString('en-US');   // 12345 → 12,345
  function show(d) {
    if (!d || !Number.isFinite(d.total) || !Number.isFinite(d.today)) return;
    el.innerHTML = `总访问 <b>${fmt(d.total)}</b> · 今日 <b>${fmt(d.today)}</b>`;
    el.hidden = false;
  }

  // 没记过的用 POST（记一次并取回数字），记过的用 GET（只取数字）
  fetch(API, { method: seen ? 'GET' : 'POST', cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d) return;
      try { sessionStorage.setItem(SEEN, '1'); } catch (e) {}
      show(d);
    })
    .catch(() => {});   // 接口不通：不显示，也不报错
})();
