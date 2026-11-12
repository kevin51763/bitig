"""从现成的词库（dict/data/）里给每个词抽一条短释义，供转写编辑器的“悬停释义”用。

用法（在仓库根目录运行，不用参数）：
    python3 dict/tools/build_gloss.py

读取：dict/data/manhan.*（满文，取《满汉大辞典》，没有的词取《新满汉大词典》）
      dict/data/menghan.*（蒙古文，《蒙汉词典》）
      dict/data/tibetan.*、dict/data/tibetan/（藏文，取几部释义简短的藏英词典）
写出：dict/data/gloss/mnc/、mn/、bo/ 下的若干小文件，每行“词\t短释义”。

为什么分成小文件：全部放在一个文件里有几 MB，读者只为看几个词的意思不值得下载。
按词的第一个音节（词）算一个号码分到各个小文件，网页只读用得到的那几个（js/gloss.js）。
分成几份（BUCKETS）和算号码的办法（bucket）必须和 js/gloss.js 里的一致，改一处要改两处。

词库更新（重新运行过 build_data.py 或 build_tibetan.py）之后，再运行一次本脚本，
然后把 js/gloss.js 开头 VER 的日期改新。
"""
import json
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')
OUT = os.path.join(DATA, 'gloss')
BUCKETS = {'mnc': 16, 'mn': 16, 'bo': 96}   # 各语言分成几份
MAXLEN = {'mnc': 30, 'mn': 30, 'bo': 56}    # 短释义最多多少个字符
BO_MAX_SYL = 4                              # 藏文只收四个音节以内的词
# 藏文取释义的词典，按先后顺序；名字是 js/dict/tibetan-dicts.js 里的 name
BO_SOURCES = ['Rangjung Yeshe', 'Hopkins 2015', 'James Valby', 'Ives Waldo', 'Dan Martin', '84000 Glossary']


def bucket(first, n):
    """按词的第一个音节（词）算出它在第几个小文件里。js/gloss.js 的 bucket() 与此相同。"""
    h = 0
    b = first.encode('utf-16-le')
    for i in range(0, len(b), 2):
        h = (h * 31 + b[i] + (b[i + 1] << 8)) % 65536
    return h % n


def read_lines(path):
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    return lines


# ---------- 汉语释义（满文、蒙古文）怎样缩短 ----------
POS = re.compile(r'^\s*([〔\[［][^〕\]］]{1,8}[〕\]］])\s*')
NUM = re.compile(r'[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]')


def first_clause(s):
    """一个义项只留释义本身：例句（冒号后面）、句号后面的说明都去掉。"""
    s = re.split(r'[：:]\s*(?=[A-Za-z\u1800-\u18af])|。', s, maxsplit=1)[0]
    s = re.sub(r'《[^》]*》', '', s)
    s = re.sub(r'[(（][^)）]*[\u1800-\u18af][^)）]*(?:[)）]|$)', '', s)   # 括号里的蒙古文例词
    s = re.sub(r'[(（]\d+[)）]', '', s)                                   # (938) 一类页码
    return s.strip(' ，,；;、')


def short_zh(text, maxlen):
    """把一条释义缩成一行：按词类（〔名〕〔形〕……）分段，每段按 ①②③ 分义项，
    每个义项只留释义本身，依次往后接，接到 maxlen 个字为止。第一个义项总是保留。"""
    items = []   # [(词类标记, 义项)]
    for sec in re.split(r'(?=[〔\[［][^〕\]］]{1,8}[〕\]］])', text.strip()):
        m = POS.match(sec)
        pos = m.group(1) if m else ''
        body = sec[m.end():] if m else sec
        label = ''   # 〈不及〉〈经〉一类只有标记、没有释义的片段，接在下一个义项前面
        for part in NUM.split(body):
            c = first_clause(part)
            if re.fullmatch(r'(?:[〈<][^〉>]{1,8}[〉>])+', c):
                label += c
            elif c:
                items.append((pos, label + c))
                label = ''
    out, last = '', None
    for pos, c in items:
        piece = (pos if pos != last else '') + c
        nxt = out + ('；' if out else '') + piece
        if out and len(nxt) > maxlen:
            break
        out, last = nxt, pos
    if len(out) > maxlen + 6:
        out = out[:maxlen + 5].rstrip(' ，；、') + '…'
    return out


# ---------- 满文 ----------
def mnc_formal(s):
    """词库的写法 → 穆麟德夫式（与 js/dict/translit-mnc.js 的 formal 相同），再全部小写。"""
    s = re.sub(r"ts(?!')", "ts'", s).replace('cy', "c'y").replace('jy', 'zy')
    s = re.sub(r'[v@]', 'ū', s)
    s = re.sub(r'[Sx]', 'š', s).replace('K', "k'").replace('R', 'ž')
    return s.lower()


def variants(key):
    """词头里带括号的可有可无的字母，如 tobči(n)：带和不带各算一个词。"""
    if '(' not in key:
        return [key]
    return [re.sub(r'\(([^)]*)\)', '', key), re.sub(r'\(([^)]*)\)', r'\1', key)]


def build_zh(name, lang, norm, prefer, ok, fold=lambda k: k, fix=lambda g: g):
    """返回 {查询用的词: (短释义, 显示用的词)}。fold 把词变成查询用的样子（蒙古文去掉连字符）。"""
    idx = read_lines(os.path.join(DATA, name + '.idx.txt'))
    defs = read_lines(os.path.join(DATA, name + '.def.txt'))
    out = {}
    for line, d in zip(idx, defs):
        keys = [re.sub(r'\s+', ' ', k).strip() for k in variants(norm(line.split('\t')[0]))]
        keys = [k for k in keys if k and ok(k)]
        if not keys:
            continue
        senses = [s.split('\x1f') for s in d.split('\x1e')]
        text = ''
        for want in prefer:
            # 同一部词典里同形的几个词（各是一条释义）并列，最多两个，用“｜”隔开
            found = []
            for s in senses:
                if s[0] == want and len(s) > 3:
                    g = short_zh(s[3], MAXLEN[lang])
                    if g and g not in found:
                        found.append(g)
            if found:
                text = '｜'.join(found[:2])
                break
        for key in keys:
            if not text:
                continue
            k = fold(key)
            if k not in out:
                out[k] = (fix(text), key)
            elif '｜' not in out[k][0] and fix(text) != out[k][0]:
                out[k] = (out[k][0] + '｜' + fix(text), out[k][1])   # 同形的另一个词，最多并列两个
    return out


# ---------- 蒙古文 ----------
MN_ACAD = {'G': 'γ', 'c': 'č', 'j': 'ǰ', 'S': 'š', 'O': 'ö', 'U': 'ü', 'E': 'ē',
           'D': 'd', 'T': 't', 'K': 'k', 'x': 'kh', 'C': 'ts', 'H': 'h', 'Q': 'ch', 'N': 'ng', 'A': 'a'}


def mn_academic(s):
    """词库的写法 → 学术转写（与 js/dict/translit-mn.js 的 academic 相同），再全部小写。"""
    s = s.replace("q'", 'γ').replace("k'", 'g')
    s = s.replace('=_', '-').replace('_', '-')
    s = re.sub(r'[=+*`]', '', s).replace("'", '')
    s = re.sub(r'[GcjSOUEDTKxCHQNA]', lambda m: MN_ACAD[m.group(0)], s)
    return s.lower()


# ---------- 藏文 ----------
def short_en(text, maxlen):
    t = text.replace('\\n', ' ')
    t = re.sub(r'\{[^}]*\}', lambda m: m.group(0)[1:-1], t)       # {bod} → bod
    t = re.sub(r'^\s*<[^>]*>\s*', '', t)                           # 开头的 <person> 一类标记
    t = re.sub(r'\[[^\]]*\]', '', t)                               # 方括号里的语法说明
    t = re.sub(r'\((?:Original glossary|Skt|h\b)[^)]*\)', '', t)
    t = re.sub(r'\bSA\b.*$', '', t)                                # “SA 某词”＝参见，去掉
    t = re.sub(r'\s+', ' ', t).strip(' ,;.:')
    if len(t) > maxlen:
        cut = t[:maxlen]
        cut = cut[:max(cut.rfind(';'), cut.rfind(','), cut.rfind(' '))] if re.search(r'[;, ]', cut) else cut
        t = cut.rstrip(' ,;:') + '…'
    return t


def build_bo():
    src = open(os.path.join(HERE, '..', '..', 'js', 'dict', 'tibetan-dicts.js'), encoding='utf-8').read()
    dicts = json.loads(src[src.index('['):src.rindex(']') + 1])
    order = [next(i for i, d in enumerate(dicts) if d['name'] == n) for n in BO_SOURCES]
    rank = {d: r for r, d in enumerate(order)}
    idx = read_lines(os.path.join(DATA, 'tibetan.idx.txt'))
    shard = 600   # 与 js/dict/dictionaries.js 里藏文词典的 shard 相同
    out = {}
    lines = []
    for i, line in enumerate(idx):
        if i % shard == 0:
            lines = read_lines(os.path.join(DATA, 'tibetan', '%04d.txt' % (i // shard)))
        key, _, mask, _ = line.split('\t')
        if not re.fullmatch(r"[A-Za-z'+.\- ]+", key) or len(key.split(' ')) > BO_MAX_SYL:
            continue
        if not any(int(m) in rank for m in mask.split(',') if m):
            continue
        best = None
        for s in lines[i % shard].split('\x1e'):
            d, _, t = s.partition('\x1f')
            if int(d) in rank:
                g = short_en(t, MAXLEN['bo'])
                if g and (best is None or rank[int(d)] < best[0]):
                    best = (rank[int(d)], g)
        if best:
            out[key] = (best[1], key)
    return out


def write(lang, table):
    n = BUCKETS[lang]
    d = os.path.join(OUT, lang)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    files = [[] for _ in range(n)]
    # 每行：查询用的词 \t 短释义 \t 显示用的词（与查询用的相同时不写）
    for key in sorted(table):
        text, show = table[key]
        row = key + '\t' + text.replace('\t', ' ').replace('\n', ' ')
        files[bucket(key.split(' ')[0], n)].append(row + ('\t' + show if show != key else ''))
    total = 0
    for i, rows in enumerate(files):
        path = os.path.join(d, '%02d.txt' % i)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(rows) + '\n')
        total += os.path.getsize(path)
    print('%s：%d 个词，%d 个文件，共 %.1f MB' % (lang, len(table), n, total / 1e6))


if __name__ == '__main__':
    # 满文释义里夹的满文词（如“= Sanyan”）也改成穆麟德夫式
    write('mnc', build_zh('manhan', 'mnc', mnc_formal, ['0', '1'], lambda k: re.fullmatch(r"[a-zūšž' ]+", k) is not None,
                          fix=lambda g: re.sub(r"[A-Za-z@][A-Za-z@' ]*", lambda m: mnc_formal(m.group(0)), g)))
    write('mn', build_zh('menghan', 'mn', mn_academic, ['0'], lambda k: re.fullmatch(r"[a-zγčǰšöüē\- ]+", k) is not None,
                         fold=lambda k: k.replace('-', '')))
    write('bo', build_bo())
