/* 词典释义的服务器部分。只在 bitig.ink 的服务器上运行，由 server/index.js 接入。

   为什么要它：满汉词典的释义文件压缩后约 3 MB，读者查一个词，原先要先把它整份下载下来。
   现在释义留在服务器上，浏览器只要当前这一页词条的释义，每次几 KB。
   查词头仍在浏览器里做（检索文件 *.idx.txt 较小）；输入汉字的释义反查改在这里做。
   藏文词典的释义本来就分成小份按需读取，不经过这里。

   接口（<词典> 是 manhan、menghan、manhanmeng、qingwenjian）：
     GET /api/dict/<词典>/info?v=版本
         → { n: 词条数 }。浏览器用它确认服务器的词库和自己读到的检索文件是同一版
     GET /api/dict/<词典>/defs?v=版本&i=3,17,42
         → { defs: [第 3 条的释义, 第 17 条的, 第 42 条的] }
     GET /api/dict/<词典>/search?v=版本&q=学问&f=3&d=0,1,2
         → { hits: [[…], […], […], […]] }。在释义里找“学问”：f 是释义文字在义项的第几栏，
           d 是勾选了哪几部词典；hits 按相符程度分四组，每组是词条的序号（规则见 js/dict/def-match.js）
   版本是 js/dict/dictionaries.js 开头 VER 里的数字。版本对不上时回 409，
   浏览器收到后退回老办法：下载整份释义文件。没有服务器的地方（GitHub Pages、本地预览）也走老办法。

   释义文件（dict/data/*.def.txt）在启动时读进内存，共约 20 MB，不用数据库。
   自动更新取来新词库后，这里发现文件变了会重新读，不必重启。 */
'use strict';
const fs = require('fs');
const path = require('path');
const match = require('../js/dict/def-match.js');

const CHECK_GAP = 5000;    // 每隔 5 秒才看一次文件有没有变
const SETTLE = 2000;       // 文件改动满 2 秒才读，免得读到 git 写了一半的文件
const MAX_IDS = 200;       // 一次最多要 200 条释义（网页每页 50 条）
const MAX_QUERY = 100;     // 反查的话最多 100 个字
const MAX_TERMS = 8;       // 最多 8 个关键词
const CACHE = 'public, max-age=3600';   // 网址里带着版本，结果可以让浏览器留一小时

/* 把 '3,17,42' 这样的参数变成数字的列表；有一项不是 0 到 max 之间的整数，或超过 count 项，就返回 null */
function ints(s, max, count) {
  if (typeof s !== 'string' || !s) return null;
  const parts = s.split(',');
  if (parts.length > count) return null;
  const out = [];
  for (const p of parts) {
    if (!/^\d{1,9}$/.test(p) || +p > max) return null;
    out.push(+p);
  }
  return out;
}

module.exports = function (app, dataDir, siteDir) {
  const dir = path.join(siteDir, 'dict', 'data');
  const verFile = path.join(siteDir, 'js', 'dict', 'dictionaries.js');
  const books = new Map();   // 词典名 → { stamp: 文件的时间和大小, lines: 各词条的释义, keys: 词头 → 第几条 }
  let ver = '', verStamp = '', checked = 0;

  /* 文件的时间和大小，用来判断它变没变。文件不存在、或刚改动还没满 2 秒，返回 '' */
  function stampOf(file, now) {
    try {
      const st = fs.statSync(file);
      return now - st.mtimeMs < SETTLE ? '' : st.mtimeMs + ':' + st.size;
    } catch (e) { return ''; }
  }

  /* 读入（或重新读入）变了的文件。first 为真时是刚启动，不等那 2 秒 */
  function refresh(first) {
    const now = first ? Infinity : Date.now();
    if (!first && now - checked < CHECK_GAP) return;
    checked = first ? Date.now() : now;

    const vs = stampOf(verFile, now);
    if (vs && vs !== verStamp) {
      try {
        const m = /VER\s*=\s*'\?v=(\d+)'/.exec(fs.readFileSync(verFile, 'utf8'));
        if (m) { ver = m[1]; verStamp = vs; }
        else console.error('[dict] 在 ' + verFile + ' 里找不到 VER');
      } catch (e) { console.error('[dict] 读不出 ' + verFile + '：' + e.message); }
    }

    let names = [];
    try { names = fs.readdirSync(dir).filter(n => /^[a-z0-9]+\.def\.txt$/.test(n)); }
    catch (e) { console.error('[dict] 读不出 ' + dir + '：' + e.message); return; }
    for (const name of names) {
      const id = name.slice(0, -'.def.txt'.length), file = path.join(dir, name);
      const s = stampOf(file, now), old = books.get(id);
      if (!s || (old && old.stamp === s)) continue;
      try {
        const book = { stamp: s, lines: fs.readFileSync(file, 'utf8').split('\n'), keys: new Map() };
        // 检索文件每行的第一栏是词头：记下“词头 → 第几条”，词条页（server/pages.js）按词头找释义时用
        fs.readFileSync(path.join(dir, id + '.idx.txt'), 'utf8').split('\n').forEach((line, i) => {
          const k = line.split('\t')[0];
          if (k && !book.keys.has(k)) book.keys.set(k, i);
        });
        books.set(id, book);
        console.log('[dict] 读入 ' + id + '：' + books.get(id).lines.length + ' 条');
      } catch (e) { console.error('[dict] 读不出 ' + file + '：' + e.message); }
    }
  }
  refresh(true);

  /* 给服务器上别的部分用（server/pages.js 的词条页）：按词头找一个词条的释义。
     找到返回 { i: 第几条, raw: 释义（词库里的一行） }，没有这部词典或这个词头返回 null */
  app.locals.bitigDict = {
    find(id, key) {
      refresh(false);
      const b = books.get(id), i = b && b.keys.get(key);
      return i === undefined || !b ? null : { i, raw: b.lines[i] || '' };
    },
  };

  /* 找到请求里说的那部词典；找不到或版本不对，就回话并返回 null */
  function bookOf(req, res) {
    refresh(false);
    const b = books.get(req.params.id);
    if (!b) { res.status(404).json({ note: '没有这部词典' }); return null; }
    if (!ver || req.query.v !== ver) { res.status(409).json({ note: '词库版本不同' }); return null; }
    return b;
  }

  app.get('/api/dict/:id/info', (req, res) => {
    const b = bookOf(req, res);
    if (!b) return;
    res.set('Cache-Control', 'no-store');
    res.json({ n: b.lines.length });
  });

  app.get('/api/dict/:id/defs', (req, res) => {
    const b = bookOf(req, res);
    if (!b) return;
    const ids = ints(req.query.i, b.lines.length - 1, MAX_IDS);
    if (!ids) return res.status(400).json({ note: 'i 要写成词条序号，用逗号隔开，最多 ' + MAX_IDS + ' 个' });
    res.set('Cache-Control', CACHE);
    res.json({ defs: ids.map(i => b.lines[i]) });
  });

  app.get('/api/dict/:id/search', (req, res) => {
    const b = bookOf(req, res);
    if (!b) return;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const terms = match.terms(q);
    const fields = ints(req.query.f, 15, 4), dicts = ints(req.query.d, 63, 64);
    if (!terms.length || q.length > MAX_QUERY || terms.length > MAX_TERMS || !fields || !dicts) {
      return res.status(400).json({ note: '参数不对' });
    }
    const on = new Set(dicts), isOn = d => on.has(d);
    const hits = [[], [], [], []];
    for (let i = 0; i < b.lines.length; i++) {
      const sc = match.score(b.lines[i], terms, fields, isOn);
      if (sc >= 0) hits[sc].push(i);
    }
    res.set('Cache-Control', CACHE);
    res.json({ hits });
  });
};
