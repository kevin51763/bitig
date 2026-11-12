/* 悬停释义：转写编辑器里，鼠标停在一个词上，浮窗显示它的简短意思（js/editors/two-pane.js 调用）。
   现在有满文（mnc）、蒙古文（mn）、藏文（bo）三种。

   释义来自词典，但不是直接读词库（太大），而是读一份专门抽出来的短释义表：
     dict/data/gloss/<语言>/00.txt、01.txt……  每行“词 \t 短释义 \t 显示用的词（可省）”
   这些文件由 dict/tools/build_gloss.py 生成，不要手改。词按第一个音节（词）分到各个小文件，
   用到哪个读哪个，读过的留在内存里。

   文中的词常带词尾（tucikengge、töregsen、ri bo'i），词典只收原形。每种语言有一套“还原”规则：
   整词查不到时，去掉常见词尾再查。规则只管常见形式，查不到就如实说查不到。
   格助词等虚词的释义不取词典（太长），用下面各语言的 PARTICLES 小表，可以直接改。

   重新生成过 dict/data/gloss/ 之后，把下面 VER 的日期改新，读者才会读到新的文件。 */
(function () {
  const VER = '?v=20261112';

  /* 词在第几个小文件里。必须和 dict/tools/build_gloss.py 的 bucket() 相同 */
  function bucket(first, n) {
    let h = 0;
    for (let i = 0; i < first.length; i++) h = (h * 31 + first.charCodeAt(i)) % 65536;
    return h % n;
  }

  /* ---------- 满文 ---------- */
  const MNC_PARTICLES = {
    i: '〔格助〕的；以、用（属格、工具格）',
    ni: '〔格助〕的（属格，接在 ng 之后）；〔语气〕呢',
    de: '〔格助〕在、于、向、对（与位格）',
    be: '〔格助〕把（宾格）',
    ci: '〔格助〕从、自；比（离格）',
    deri: '〔格助〕从、由、经过',
    kai: '〔语气〕啊、也（表示肯定）',
    dere: '〔语气〕吧（表示推测）',
    seme: '说着；虽然；（引语标记，sembi 的副动形）',
    sere: '所谓、叫做（sembi 的形动形）',
    ofi: '因为（ombi 的副动形）',
    oci: '若是；至于（ombi 的条件形）'
  };
  // 不规则的变化形 → 原形
  const MNC_IRREGULAR = {
    bihe: 'bimbi', bici: 'bimbi', bifi: 'bimbi', bime: 'bimbi', bisire: 'bimbi', bisirengge: 'bimbi', bihebi: 'bimbi',
    oho: 'ombi', ohobi: 'ombi', ome: 'ombi', ojoro: 'ombi', ojorongge: 'ombi', ohode: 'ombi', ojorakū: 'ombi',
    sehe: 'sembi', sefi: 'sembi', seci: 'sembi', sehebi: 'sembi', serengge: 'sembi', sehengge: 'sembi',
    jihe: 'jimbi', jifi: 'jimbi', jidere: 'jimbi', jiderengge: 'jimbi', jio: 'jimbi',
    jeke: 'jembi', jefi: 'jembi', jetere: 'jembi', baha: 'bahambi', bahafi: 'bahambi', gaisu: 'gaimbi', bisu: 'bimbi', osu: 'ombi'
  };
  // 动词词尾，长的在前。去掉词尾、补上 mbi 就是词典里的原形
  const MNC_VERB = ['mbihebi', 'mbihe', 'mbime', 'mbikai', 'mbio',
    'hangge', 'hengge', 'hongge', 'kangge', 'kengge', 'kongge', 'rangge', 'rengge', 'rongge',
    'habi', 'hebi', 'hobi', 'kabi', 'kebi', 'kobi', 'hakū', 'hekū', 'hokū', 'kakū', 'kekū', 'kokū', 'rakū',
    'nggala', 'nggele', 'nggolo', 'tala', 'tele', 'tolo', 'cibe', 'cina', 'kini',
    'hai', 'hei', 'hoi', 'kai', 'kei', 'koi', 'rao', 'reo', 'roo',
    'ha', 'he', 'ho', 'ka', 'ke', 'ko', 'ra', 're', 'ro', 'fi', 'pi', 'me', 'ci', 'ki'];
  // 连写在名词后面的格助词和复数词尾
  const MNC_NOUN = ['deri', 'ngge', 'ci', 'de', 'be', 'ni', 'sa', 'se', 'si', 'ta', 'te', 'i'];
  function mncCandidates(w) {
    const out = [w];
    if (MNC_IRREGULAR[w]) out.push(MNC_IRREGULAR[w]);
    for (const s of MNC_VERB) if (w.length > s.length + 1 && w.endsWith(s)) out.push(w.slice(0, -s.length) + 'mbi');
    for (const s of MNC_NOUN) if (w.length > s.length + 1 && w.endsWith(s)) out.push(w.slice(0, -s.length));
    out.push(w + 'mbi');   // 命令式就是词干
    return out;
  }

  /* ---------- 蒙古文 ---------- */
  const MN_PARTICLES = {
    inu: '〔助〕（提示主语）；他的、其',
    'aǰuγu': '曾是、乃（a- “有、在”的过去形）',
    bui: '是、有、在', buyu: '是、有、在', bolai: '是也（句末）',
    kemen: '说、云（kemekü 的副动形）', kiged: '以及、和',
    ba: '和、及；我们'
  };
  // 用连字符接在词后面的附加成分
  const MN_SUFFIX = {};
  [['un ün u ü yin', '的（属格）'], ['i yi', '把（宾格）'],
    ['dur dür tur tür da de du dü a e', '在、于、向（与位格）'], ['ača eče', '从、比（离格）'],
    ['bar ber iyar iyer', '以、用（工具格）'], ['luγa lüge tai tei', '和、与（共同格）'],
    ['ban ben iyan iyen', '自己的（反身）'], ['ud üd nar ner', '们（复数）']
  ].forEach(([list, zh]) => list.split(' ').forEach(s => { MN_SUFFIX[s] = zh; }));
  // 动词词尾，长的在前。去掉词尾、补上 qu 或 kü 就是词典里的原形
  const MN_VERB = ['γsaγar', 'gseger', 'ǰuqui', 'ǰüküi', 'čuqui', 'čüküi', 'suγai', 'sügei', 'tuγai', 'tügei',
    'γsan', 'gsen', 'γtun', 'gtün', 'basu', 'besü', 'luγa', 'lüge', 'tala', 'tele',
    'γad', 'ged', 'qui', 'küi', 'bai', 'bei', 'mui', 'müi', 'nam', 'nem', 'bal', 'bel', 'γči', 'gči', 'daγ', 'deg',
    'ǰu', 'ǰü', 'ču', 'čü', 'ba', 'be', 'yu', 'yü', 'ya', 'ye', 'mu', 'mü'];
  const mnFold = s => s.replace(/-/g, '');
  // 古典写法和现代词典的写法在第二音节以后的元音上常有出入（töre- 与 törö-），两种都试
  function mnVowelAlts(stem) {
    const out = [stem], m = /^[^aeiouöü]*([oö])/.exec(stem);
    if (m) {
      const from = m[1] === 'ö' ? /e/g : /a/g, head = stem.slice(0, m[0].length), rest = stem.slice(m[0].length);
      const alt = head + rest.replace(from, m[1]);
      if (alt !== stem) out.push(alt);
    }
    return out;
  }
  function mnCandidates(w) {
    const out = [mnFold(w)];
    const base = w.replace(/-/g, '');
    for (const s of MN_VERB) {
      if (base.length > s.length + 1 && base.endsWith(s)) {
        const stem = base.slice(0, -s.length), inf = /[aouγq]/.test(stem) ? 'qu' : 'kü';
        mnVowelAlts(stem).forEach(x => out.push(x + inf));
      }
    }
    return out;
  }
  /* 带连字符的词（qaγan-u）：整词查不到时，把最后一个连字符后面的部分当作附加成分 */
  function mnSplit(w) {
    const i = w.lastIndexOf('-');
    if (i <= 0) return null;
    const suf = w.slice(i + 1);
    return MN_SUFFIX[suf] ? { base: w.slice(0, i), note: '-' + suf + '　' + MN_SUFFIX[suf] } : null;
  }

  /* ---------- 藏文（释义是英文，词典里没有藏汉词典） ---------- */
  const BO_PARTICLES = {};
  [["kyi gyi gi yi 'i", 'of (genitive)'], ['kyis gyis gis yis', 'by, with (agentive)'],
    ['la', 'to, at, in, for (dative-locative)'], ['na', 'in, at; if (locative)'],
    ['du tu su ru', 'to, into, as (terminative)'], ['nas', 'from; after, having … (ablative)'],
    ['las', 'from; than (ablative)'], ['dang', 'and, with'], ['ni', '(topic marker)'],
    ["kyang yang 'ang", 'also, even, although'], ['te ste de', '(continuative: and, then)'],
    ["'o", '(sentence-final particle)'], ["'am", 'or; (question)']
  ].forEach(([list, en]) => list.split(' ').forEach(s => { BO_PARTICLES[s] = en; }));
  // 连写在最后一个音节上的虚词：'i、'o 等；单个音节还试着去掉末尾的 s、r（具格、向格）。
  // 词组不去 s、r，否则容易凑出不相干的词
  function boPhraseCandidates(w) {
    const out = [w];
    for (const s of ["'i", "'o", "'ang", "'am", "'is"]) if (w.length > s.length && w.endsWith(s)) out.push(w.slice(0, -s.length));
    return out;
  }
  function boCandidates(w) {
    const out = boPhraseCandidates(w);
    if (/[aeiou][sr]$/.test(w)) out.push(w.slice(0, -1));
    return out;
  }

  /* 各语言的设置：
       n        分成几个小文件（与 build_gloss.py 的 BUCKETS 相同）
       dict     双击时跳到哪部词典（js/dict/dictionaries.js 里的 id）；input 是那部词典的输入方式
       max      词组最多几个词（音节）
       joiner   两个词之间是这样的间隔，才算连在一起、可以组成词组
       norm     把编辑器里的词变成查询用的样子 */
  const LANGS = {
    mnc: { n: 16, dict: 'manhan', input: 'mnc', max: 5, joiner: /^ +$/, particles: MNC_PARTICLES, candidates: mncCandidates,
      fold: s => s, norm: s => s.toLowerCase().replace(/ů/g, 'ū').replace(/[·|]/g, '') },
    mn: { n: 16, dict: 'menghan', input: 'mn', max: 4, joiner: /^ +$/, particles: MN_PARTICLES, candidates: mnCandidates, split: mnSplit,
      fold: mnFold, norm: s => s.toLowerCase().replace(/ɣ/g, 'γ').replace(/'/g, '') },
    bo: { n: 96, dict: 'tibetan', input: 'bo', max: 4, joiner: /^ $/, particles: BO_PARTICLES, candidates: boCandidates, phraseCandidates: boPhraseCandidates,
      fold: s => s, norm: s => s }
  };

  /* 读一个小文件，变成“词 → [短释义, 显示用的词]”的表。读不到（没有网络）就当作空表，稍后还可以再试 */
  const cache = {};
  function load(lang, b) {
    const key = lang + '/' + b;
    if (!cache[key]) {
      const url = 'dict/data/gloss/' + lang + '/' + String(b).padStart(2, '0') + '.txt' + VER;
      cache[key] = fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).then(text => {
        const map = new Map();
        text.split('\n').forEach(line => {
          const f = line.split('\t');
          if (f.length >= 2) map.set(f[0], [f[1], f[2] || f[0]]);
        });
        return map;
      }).catch(() => { delete cache[key]; return new Map(); });
    }
    return cache[key];
  }
  async function get(lang, key) {
    const map = await load(lang, bucket(key.split(' ')[0], LANGS[lang].n));
    const hit = map.get(key);
    return hit ? { head: hit[1], text: hit[0] } : null;
  }
  async function first(lang, keys) {
    const seen = new Set();
    for (const k of keys) {
      if (seen.has(k)) continue;
      seen.add(k);
      const r = await get(lang, k);
      if (r) return r;
    }
    return null;
  }

  /* 查一个词。返回 { head 原形, text 释义, note 附加成分的说明 }，查不到返回 null */
  async function word(lang, w) {
    const C = LANGS[lang];
    if (C.particles[w]) return { head: w, text: C.particles[w] };
    let r = await first(lang, C.candidates(w));
    if (!r && C.split) {
      const sp = C.split(w);
      if (sp) {
        r = C.particles[sp.base] ? { head: sp.base, text: C.particles[sp.base] } : await first(lang, C.candidates(sp.base));
        if (r) r.note = sp.note; else r = { head: w, text: '', note: sp.note };
      }
    }
    return r;
  }

  /* 查鼠标所在的词。words 是连在一起的一串词（已经 norm 过），i 是鼠标所在的那一个。
     返回 { word: 这个词的结果或 null, phrase: 包含它的最长词组的结果或 null } */
  async function lookup(lang, words, i) {
    const C = LANGS[lang];
    const cands = C.phraseCandidates || C.candidates;
    let phrase = null;
    // 从长到短；同样长的，先找原样能查到的，再试“最后一个词带词尾”的
    for (let len = Math.min(C.max, words.length); len >= 2 && !phrase; len--) {
      for (const exact of [true, false]) {
        for (let s = Math.max(0, i - len + 1); s <= Math.min(i, words.length - len) && !phrase; s++) {
          const part = words.slice(s, s + len), head = part.slice(0, -1).map(C.fold).join(' ') + ' ';
          const tails = exact ? [C.fold(part[len - 1])] : cands(part[len - 1]).slice(1);
          phrase = await first(lang, tails.map(x => head + x));
        }
      }
    }
    return { word: await word(lang, words[i]), phrase };
  }

  SIYI.gloss = {
    has: lang => !!LANGS[lang],
    config: lang => LANGS[lang],
    lookup
  };
})();
