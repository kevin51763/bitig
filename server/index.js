/* 服务器部分的总入口。只在 bitig.ink 的服务器上运行，浏览器不会载入这个文件夹里的文件。

   服务器上的 /var/www/bitig/server.js 不在仓库里，它只要有这一行，就接上了这里列出的全部功能：

       require('./public/server')(app, require('path').join(__dirname, 'data'));

   这一行放在 const app = express() 之后、发送网站文件的 express.static 那一行之前。
   以后新增服务器功能，在下面的 PARTS 里加一行即可，不必再改 server.js。

   dataDir 是存数据的文件夹（/var/www/bitig/data）。它在 public 之外，别人下载不到。 */
'use strict';
const path = require('path');

/* 各项功能：名字（只用于报错）和文件 */
const PARTS = [
  ['访问计数', './counter'],
  ['自动更新', './deploy'],
  ['词典释义', './dict'],
  ['不带 # 的网址', './pages'],
  ['留言', './messages'],
];

module.exports = function (app, dataDir) {
  const siteDir = path.join(__dirname, '..');   // 网站文件所在的文件夹，也就是仓库的 clone（public）
  for (const [name, file] of PARTS) {
    // 一项功能出错，不连累网站和其他功能；报错用 journalctl -u bitig -n 20 看
    try { require(file)(app, dataDir, siteDir); }
    catch (e) { console.error('[server] “' + name + '”没有装上：' + e.message); }
  }
};
