/* 留言。只在 bitig.ink 的服务器上运行，由 server/index.js 接入。

   读者在“留言”栏目（js/pages/contact.js）写一段话，存在这里；网站的主人在 bitig.ink/admin.html
   输入密码后查看。这样不用公开邮箱，读者也不用注册账号。

   接口：
     POST   /api/messages            读者留言。正文是 JSON：
                                       { kind: 'fix' | 'material' | 'other', text: 留言, contact: 联系方式（可空）,
                                         from: 留言前所在的栏目（可空）, website: 必须为空（见下面的“防垃圾”） }
     GET    /api/messages            全部留言，新的在前                    ┐
     POST   /api/messages/3/done     把第 3 条标为已处理（再发一次改回未处理） │ 这三个要带密码：
     DELETE /api/messages/3          删掉第 3 条                           ┘ 请求头 X-Admin-Password

   服务器上的两个文件（都在 /var/www/bitig/data/，不在仓库里）：
     admin-password.txt   查看留言的密码。没有这个文件时，留言照收，但谁也看不了
     messages.db          留言，SQLite 数据库。用的是 Node.js 自带的 node:sqlite，不用另装东西

   防垃圾：
     · 同一个网络地址 10 分钟内最多留 5 条；全站一天最多收 300 条，免得有人把硬盘写满。
     · 表单里有一栏读者看不见的 website，人不会填，自动灌水的程序多半会填；填了的不收。
     · 密码输错：同一个地址 10 分钟内最多试 10 次。
   网络地址只留在内存里用来计数，不写进数据库。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KINDS = ['fix', 'material', 'other'];   // 纠错、添加资料、其他（显示的名字在 js/pages/contact.js 和 admin.html）
const MAX_TEXT = 2000;        // 留言最多 2000 字
const MAX_CONTACT = 200;      // 联系方式最多 200 字
const MAX_BODY = 20 * 1024;   // 正文超过 20 KB 不收
const WINDOW = 10 * 60 * 1000;   // 计数的时间段：10 分钟
const MAX_POSTS = 5;          // 一个地址 10 分钟内最多留几条
const MAX_TRIES = 10;         // 一个地址 10 分钟内最多输错几次密码
const MAX_PER_DAY = 300;      // 全站一天最多收几条

/* 北京时间，如 '2026-11-15 14:30:05' */
const now = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

module.exports = function (app, dataDir) {
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'messages.db'));
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    time    TEXT NOT NULL,              -- 北京时间
    kind    TEXT NOT NULL,              -- fix、material、other
    text    TEXT NOT NULL,              -- 留言
    contact TEXT NOT NULL DEFAULT '',   -- 联系方式，读者可以不留
    source  TEXT NOT NULL DEFAULT '',   -- 留言前所在的栏目，如 dict-manhan
    done    INTEGER NOT NULL DEFAULT 0  -- 1 是已处理
  )`);
  // 写法固定的语句先备好。留言的内容一律作为参数（?）交给数据库，不拼进语句里
  const insert = db.prepare('INSERT INTO messages (time, kind, text, contact, source) VALUES (?, ?, ?, ?, ?)');
  const countDay = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE time >= ?');
  const selectAll = db.prepare('SELECT id, time, kind, text, contact, source, done FROM messages ORDER BY id DESC');
  const toggle = db.prepare('UPDATE messages SET done = 1 - done WHERE id = ?');
  const remove = db.prepare('DELETE FROM messages WHERE id = ?');

  /* 计数：某个地址在 10 分钟内做了几次某件事 */
  function counter() {
    const seen = new Map();   // 地址 → 这 10 分钟内各次的时间
    setInterval(() => {
      const t = Date.now();
      for (const [ip, list] of seen) if (t - list[list.length - 1] > WINDOW) seen.delete(ip);
    }, 60 * 1000).unref();
    return {
      count(ip) {
        const t = Date.now(), list = (seen.get(ip) || []).filter(x => t - x < WINDOW);
        seen.set(ip, list);
        return list.length;
      },
      add(ip) { (seen.get(ip) || seen.set(ip, []).get(ip)).push(Date.now()); },
    };
  }
  const posts = counter(), tries = counter();
  /* 读者的地址。请求经 Nginx 转来，真实地址在 X-Real-IP 或 X-Forwarded-For 里 */
  const ipOf = req => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() || '?';

  /* 读出请求的正文，按 JSON 解开；太大或不是 JSON 返回 null */
  function readJson(req, done) {
    const chunks = [];
    let size = 0, over = false;
    req.on('data', c => { size += c.length; if (size > MAX_BODY) over = true; else chunks.push(c); });
    req.on('end', () => {
      if (over) return done(null);
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); done(v && typeof v === 'object' ? v : null); }
      catch (e) { done(null); }
    });
    req.on('error', () => done(null));
  }
  const str = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');

  /* 核对密码。对了返回 true；不对就回话并返回 false */
  function admin(req, res) {
    res.set('Cache-Control', 'no-store');
    let pass = '';
    try { pass = fs.readFileSync(path.join(dataDir, 'admin-password.txt'), 'utf8').trim(); } catch (e) {}
    if (!pass) { res.status(503).json({ note: '服务器上还没有密码文件 admin-password.txt' }); return false; }
    const ip = ipOf(req);
    if (tries.count(ip) >= MAX_TRIES) { res.status(429).json({ note: '密码输错的次数太多，过 10 分钟再试' }); return false; }
    // 先各算一遍摘要再比，长度不同也能比，比较花的时间不透露密码的内容
    const h = s => crypto.createHash('sha256').update(String(s)).digest();
    if (!crypto.timingSafeEqual(h(req.headers['x-admin-password'] || ''), h(pass))) {
      tries.add(ip);
      res.status(401).json({ note: '密码不对' });
      return false;
    }
    return true;
  }
  const idOf = req => (/^\d{1,9}$/.test(req.params.id) ? +req.params.id : 0);

  app.post('/api/messages', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const ip = ipOf(req);
    if (posts.count(ip) >= MAX_POSTS) return res.status(429).json({ note: '留言太频繁了，过一会儿再试。' });
    readJson(req, body => {
      if (!body) return res.status(400).json({ note: '留言没有收全，请重试。' });
      if (body.website) return res.json({ ok: true });   // 灌水程序填了那一栏：装作收下，其实不存
      const text = str(body.text, MAX_TEXT + 1), contact = str(body.contact, MAX_CONTACT);
      const kind = KINDS.includes(body.kind) ? body.kind : 'other';
      const source = /^[A-Za-z0-9_-]{1,60}$/.test(body.from || '') ? body.from : '';
      if (!text) return res.status(400).json({ note: '留言是空的。' });
      if (text.length > MAX_TEXT) return res.status(400).json({ note: '留言太长了，最多 ' + MAX_TEXT + ' 字。' });
      try {
        if (countDay.get(now().slice(0, 10)).n >= MAX_PER_DAY) return res.status(429).json({ note: '今天的留言已经收满，请明天再来。' });
        insert.run(now(), kind, text, contact, source);
      } catch (e) {
        console.error('[messages] 存不进数据库：' + e.message);
        return res.status(500).json({ note: '服务器出了点问题，留言没有存上，请稍后再试。' });
      }
      posts.add(ip);
      res.json({ ok: true });
    });
  });

  app.get('/api/messages', (req, res) => {
    if (!admin(req, res)) return;
    res.json({ messages: selectAll.all() });
  });
  app.post('/api/messages/:id/done', (req, res) => {
    if (!admin(req, res)) return;
    res.json({ ok: toggle.run(idOf(req)).changes > 0 });
  });
  app.delete('/api/messages/:id', (req, res) => {
    if (!admin(req, res)) return;
    res.json({ ok: remove.run(idOf(req)).changes > 0 });
  });
};
