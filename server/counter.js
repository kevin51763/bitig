/* 访问计数的服务器部分。只在 bitig.ink 的服务器上运行，浏览器不会载入这个文件。

   安装（只做一次）：打开服务器上的 /var/www/bitig/server.js，在 const app = express() 之后、
   发送网站文件的 express.static 那一行之前，加一行：

       require('./public/server/counter')(app, require('path').join(__dirname, 'data'));

   保存后运行 systemctl restart bitig。以后这个文件有改动，git pull 之后也要再运行一次这条命令。

   接口：
     POST /api/visit   记一次访问，返回 { total: 总访问数, today: 今日访问数 }
     GET  /api/visit   只返回数字，不计数

   数字存在 /var/www/bitig/data/visits.json，形如
     { "total": 1234, "days": { "2026-11-10": 56, … } }
   days 里留着每天的访问数，想看历史可以直接打开这个文件；要清零或改数，
   先 systemctl stop bitig，改完文件再 systemctl start bitig。 */
'use strict';
const fs = require('fs');
const path = require('path');

const MIN_GAP = 10 * 1000;   // 同一个地址 10 秒内只记一次，防止有人连续刷数字
const SAVE_DELAY = 1000;     // 数字变动后 1 秒写入文件

/* 北京时间的今天，如 '2026-11-10'。服务器在香港，时区与北京相同，这里仍按 UTC+8 算，不依赖服务器设置 */
const today = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

module.exports = function (app, dataDir) {
  const file = path.join(dataDir, 'visits.json');
  let data = { total: 0, days: {} };
  try {
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (d && Number.isFinite(d.total) && d.days && typeof d.days === 'object') data = d;
  } catch (e) {
    // 文件还不存在（第一次运行）就从 0 开始。文件存在却读不出来时，先留一份备份，免得旧数字被盖掉
    if (e.code !== 'ENOENT') {
      console.error('[counter] 读不出 ' + file + '，从 0 开始计数：' + e.message);
      try { fs.copyFileSync(file, file + '.bad-' + Date.now()); } catch (e2) {}
    }
  }

  /* 先写到临时文件再改名，写到一半断电也不会留下半个文件 */
  let timer = null;
  function save() {
    timer = null;
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify(data));
      fs.renameSync(file + '.tmp', file);
    } catch (e) { console.error('[counter] 写不进 ' + file + '：' + e.message); }
  }

  /* 读者的地址。请求经 Nginx 转来，真实地址在 X-Real-IP 或 X-Forwarded-For 里 */
  const last = new Map();   // 地址 → 上次计数的时间
  const ipOf = req => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, t] of last) if (now - t > MIN_GAP) last.delete(ip);
  }, 60 * 1000).unref();

  function reply(res) {
    res.set('Cache-Control', 'no-store');
    res.json({ total: data.total, today: data.days[today()] || 0 });
  }

  app.get('/api/visit', (req, res) => reply(res));
  app.post('/api/visit', (req, res) => {
    const ip = ipOf(req), now = Date.now();
    // 地址是本机（127.0.0.1）说明 Nginx 没有把读者的地址转过来，这时分不清谁是谁，就不限制
    const local = !ip || ip === '::1' || ip.endsWith('127.0.0.1');
    if (local || !last.has(ip) || now - last.get(ip) >= MIN_GAP) {
      if (!local) last.set(ip, now);
      const day = today();
      data.total += 1;
      data.days[day] = (data.days[day] || 0) + 1;
      if (!timer) timer = setTimeout(save, SAVE_DELAY);
    }
    reply(res);
  });
};
