/* 自动更新：GitHub 上的 main 分支一有改动，bitig.ink 就自己取一次最新的文件，不必再登录服务器。
   只在 bitig.ink 的服务器上运行，由 server/index.js 接入。安装方法见 README 的“自动更新”。

   经过：
     1. 合并到 main 后，GitHub 向 https://bitig.ink/api/deploy 发一条通知（webhook）。
     2. 这里先核对通知的签名。签名用一段只有 GitHub 和服务器知道的密钥算出，别人伪造不了。
     3. 核对无误，就在网站文件夹里运行 git pull。
     4. 如果这次改动了服务器用到的程序（下面的 SERVER_FILES），程序自己退出，systemd 3 秒后把它重新启动，
        新程序生效。

   接口：
     POST /api/deploy   GitHub 的通知
     GET  /api/deploy   上一次更新的结果，形如 { time, ok, from, to, note }。
                        在浏览器里打开 https://bitig.ink/api/deploy 就能看

   服务器上的两个文件（都在 /var/www/bitig/data/，不在仓库里）：
     deploy-secret.txt   密钥。没有这个文件时，自动更新不工作
     deploy.json         上一次更新的结果 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const BRANCH = 'main';            // 只有这个分支的改动才更新网站
const GIT_TIMEOUT = 5 * 60 * 1000;  // 一条 git 命令最多等 5 分钟（词库更新时文件较大）
const MAX_BODY = 5 * 1024 * 1024;   // 通知的正文超过 5 MB 就不收
const RESTART_DELAY = 2000;       // 退出前等 2 秒，让访问计数先存盘
/* 服务器用到的程序。这些文件有改动就要重新启动。
   后两个是浏览器和服务器共用的：释义反查的匹配规则，栏目的名字和网址的对应。
   （词典的设置 js/dict/dictionaries.js 等服务器也读，但改了会自己重新读，不必重启） */
const SERVER_FILES = ['server', 'js/dict/def-match.js', 'js/routes.js'];

/* 北京时间，如 '2026-11-15 14:30:05' */
const now = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

module.exports = function (app, dataDir, siteDir) {
  const secretFile = path.join(dataDir, 'deploy-secret.txt');
  const stateFile = path.join(dataDir, 'deploy.json');

  let state = null;   // 上一次更新的结果
  try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch (e) {}

  function saveState(s) {
    state = s;
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(stateFile + '.tmp', JSON.stringify(s));
      fs.renameSync(stateFile + '.tmp', stateFile);
    } catch (e) { console.error('[deploy] 写不进 ' + stateFile + '：' + e.message); }
  }

  /* 每次都重新读密钥：换了密钥不用重启 */
  function secret() {
    try { return fs.readFileSync(secretFile, 'utf8').trim(); } catch (e) { return ''; }
  }

  /* 核对签名。GitHub 用密钥对正文算出 HMAC-SHA256，放在 X-Hub-Signature-256 里 */
  function signed(body, header, key) {
    const want = Buffer.from('sha256=' + crypto.createHmac('sha256', key).update(body).digest('hex'));
    const got = Buffer.from(String(header || ''));
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  }

  /* 读出通知的正文（原样的字节，签名是按它算的） */
  function readBody(req, done) {
    const chunks = [];
    let size = 0, over = false;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) over = true; else chunks.push(c);
    });
    req.on('end', () => done(over ? null : Buffer.concat(chunks)));
    req.on('error', () => done(null));
  }

  /* 在网站文件夹里运行一条 git 命令 */
  function git(args) {
    return new Promise((resolve, reject) => {
      execFile('git', ['-C', siteDir].concat(args),
        { timeout: GIT_TIMEOUT, env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }) },
        (err, stdout, stderr) => {
          if (err) reject(new Error((stderr || err.message).trim()));
          else resolve(stdout.trim());
        });
    });
  }

  /* 取一次最新的文件。同一时间只运行一次；运行中又来了通知，就在结束后再取一次 */
  let running = false, again = false;
  async function update() {
    if (running) { again = true; return; }
    running = true;
    let restart = false;
    try {
      const from = await git(['rev-parse', 'HEAD']);
      await git(['pull', '--ff-only', 'origin', BRANCH]);
      const to = await git(['rev-parse', 'HEAD']);
      // 这次有没有改动服务器用到的程序
      restart = from !== to && (await git(['diff', '--name-only', from, to, '--'].concat(SERVER_FILES))) !== '';
      saveState({
        time: now(), ok: true, from: from.slice(0, 7), to: to.slice(0, 7),
        note: from === to ? '已是最新，没有要取的改动' : restart ? '已更新，服务器程序有改动，已重新启动' : '已更新',
      });
      console.log('[deploy] ' + from.slice(0, 7) + ' → ' + to.slice(0, 7) + (restart ? '，重新启动' : ''));
    } catch (e) {
      // 详细的报错只写进日志（journalctl -u bitig -n 20），接口里只说失败
      console.error('[deploy] 更新失败：' + e.message);
      saveState({ time: now(), ok: false, note: '更新失败。登录服务器运行 journalctl -u bitig -n 20 看原因' });
    }
    running = false;
    if (restart) { setTimeout(() => process.exit(0), RESTART_DELAY); return; }
    if (again) { again = false; update(); }
  }

  app.get('/api/deploy', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(state || { note: '还没有自动更新过' });
  });

  app.post('/api/deploy', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const key = secret();
    if (!key) return res.status(503).json({ note: '服务器上还没有密钥文件 deploy-secret.txt，自动更新没有启用' });
    readBody(req, body => {
      if (!body) return res.status(413).json({ note: '正文太大或没有收全' });
      if (!signed(body, req.headers['x-hub-signature-256'], key)) return res.status(403).json({ note: '签名不对' });

      const event = req.headers['x-github-event'];
      // 在 GitHub 上刚设好通知时，它先发一条 ping 试试通不通
      if (event === 'ping') return res.json({ note: '通了' });
      if (event !== 'push') return res.json({ note: '不是推送通知，不处理' });

      let ref = '';
      try { ref = JSON.parse(body.toString('utf8')).ref; } catch (e) {}
      if (ref !== 'refs/heads/' + BRANCH) return res.json({ note: '不是 ' + BRANCH + ' 分支的改动，不处理' });

      // 先回话，再去取文件：GitHub 只等 10 秒，取大文件可能不止
      res.status(202).json({ note: '已开始更新。结果见 /api/deploy' });
      update();
    });
  });
};
