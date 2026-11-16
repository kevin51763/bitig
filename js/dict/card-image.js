/* 把词卡画成一张图片，供读者保存。
   做法：照网页上这张词卡的样子，把每块底色、每条分隔线、每行字原样画到画布上，不用任何外部程序。
   用法：SIYI.cardImage(词卡元素, { skip: 不画的部分的选择器, note: 图片底部的一行小字 })，结果是一个画布。 */
(function () {
  'use strict';
  var SIYI = window.SIYI = window.SIYI || {};

  // 一段文字切成小块：汉字、假名一字一块；藏文在音节点后可断行；其余按空格分词
  var PIECE = /[⺀-鿿豈-﫿＀-￯　-〿]|[^\s⺀-鿿豈-﫿＀-￯་]*་|[^\s⺀-鿿豈-﫿＀-￯་]+|\s+/g;

  function shown(cs) { return cs.display !== 'none' && cs.visibility !== 'hidden'; }
  function solid(color) { return color && color !== 'transparent' && !/,\s*0\)$/.test(color); }

  SIYI.cardImage = function (card, opt) {
    opt = opt || {};
    var box = card.getBoundingClientRect();
    var skip = opt.skip ? card.querySelector(opt.skip) : null;
    var band = opt.note ? 44 : 0;                                            // 底部留给小字的高度
    var H = (skip ? skip.getBoundingClientRect().top - box.top : box.height) + band;
    var W = box.width;
    var scale = Math.min(2, 16000 / H);                                      // 画成两倍大，字才清楚；太长的卡片缩小些
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    var g = canvas.getContext('2d');
    g.scale(scale, scale);
    var cardCs = getComputedStyle(card);
    g.fillStyle = cardCs.backgroundColor; g.fillRect(0, 0, W, H);

    function fontOf(cs) { return cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; }

    // 一个元素的底色和上边的分隔线
    function paintBox(el, cs) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = r.left - box.left, y = r.top - box.top, h = r.height;
      if (el.classList.contains('dx-card-script') && r.width < W * .6) h = H - y;   // 原文在左边一条时，画到图片底
      if (y + h > H) h = H - y;
      if (h <= 0) return;
      if (solid(cs.backgroundColor)) {
        g.fillStyle = cs.backgroundColor;
        var rad = parseFloat(cs.borderTopLeftRadius) || 0;
        if (rad && g.roundRect) { g.beginPath(); g.roundRect(x, y, r.width, h, rad); g.fill(); } else g.fillRect(x, y, r.width, h);
      }
      var bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw && cs.borderTopStyle !== 'none' && solid(cs.borderTopColor) && r.width > 60) {
        g.save(); g.strokeStyle = cs.borderTopColor; g.lineWidth = bw;
        if (cs.borderTopStyle === 'dashed') g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(x, y + bw / 2); g.lineTo(x + r.width, y + bw / 2); g.stroke(); g.restore();
      }
    }

    // 一个文字节点：量出每小块在网页上的位置，同一行的连起来一次画出
    function paintText(node, cs) {
      var text = node.nodeValue;
      if (!text.trim()) return;
      var vertical = cs.writingMode.indexOf('vertical') === 0;
      var range = document.createRange(), runs = [], cur = null;
      function piece(from, to) {
        range.setStart(node, from); range.setEnd(node, to);
        var rs = range.getClientRects();
        if (!rs.length) return;
        var r = rs[0], last = rs[rs.length - 1];
        var wrapped = vertical ? Math.abs(last.left - r.left) > 1 : Math.abs(last.top - r.top) > 1;
        if (wrapped && to - from > 1) {                                      // 这一小块自己被折成了两行：一个字一个字地量
          for (var i = from; i < to;) { var n = text.codePointAt(i) > 0xFFFF ? 2 : 1; piece(i, i + n); i += n; }
          return;
        }
        var line = Math.round(vertical ? r.left : r.top);
        if (cur && cur.line === line) { cur.text += text.slice(from, to); return; }
        if (r.width < .5 && !/\S/.test(text.slice(from, to))) return;       // 行首被网页略去的空格
        if (!r.width && !r.height) return;
        cur = { line: line, r: r, text: text.slice(from, to) }; runs.push(cur);
      }
      var m; PIECE.lastIndex = 0;
      while ((m = PIECE.exec(text))) piece(m.index, m.index + m[0].length);

      g.font = fontOf(cs); g.fillStyle = cs.color;
      if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      var mt = g.measureText('x'), up = mt.fontBoundingBoxAscent || parseFloat(cs.fontSize) * .8, down = mt.fontBoundingBoxDescent || parseFloat(cs.fontSize) * .2;
      runs.forEach(function (run) {
        var s = run.text, r = run.r;
        if (!s.trim()) return;
        var x = r.left - box.left, y = r.top - box.top;
        if (y > H) return;
        if (vertical) {
          // 竖写的满文、蒙古文：字体里的字是横着造的，把画布转四分之一圈再写
          g.save(); g.translate(x + r.width / 2, y); g.rotate(Math.PI / 2);
          g.textBaseline = 'middle'; g.fillText(s, 0, 0); g.restore();
        } else {
          g.textBaseline = 'alphabetic';
          g.fillText(s, x, y + (r.height - up - down) / 2 + up);
        }
      });
    }

    (function walk(el) {
      if (el === skip) return;
      var cs = getComputedStyle(el);
      if (!shown(cs)) return;
      if (el !== card) paintBox(el, cs);
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) paintText(n, cs); else if (n.nodeType === 1) walk(n);
      }
    })(card);

    if (opt.note) {
      var body = card.querySelector('.dx-card-body') || card, bcs = getComputedStyle(body), br = body.getBoundingClientRect();
      var soft = getComputedStyle(card.querySelector('.dx-card-dict') || card);
      g.font = '12px ' + bcs.fontFamily; g.fillStyle = soft.color; g.textBaseline = 'alphabetic';
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      g.fillText(opt.note, br.left - box.left + parseFloat(bcs.paddingLeft), H - 18, br.width - parseFloat(bcs.paddingLeft) * 2);
    }
    return canvas;
  };
})();
