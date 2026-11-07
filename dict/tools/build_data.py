"""把栗林均词典的 CSV 整理成网页用的词库文件（dict/data/*.txt），网站“词典”栏目读取这些文件。

用法（在仓库根目录运行，三个参数分别是三份 CSV，不需要的可以不给）：
    python3 dict/tools/build_data.py --manhan 满汉.csv --menghan 蒙汉.csv --manhanmeng 满汉蒙.csv --qingwenjian 清文鑑.csv

每部词典生成检索文件和释义文件两个，格式见 write() 的说明。网页先载入较小的检索文件，释义随后在后台载入。
"""
import argparse
import collections
import csv
import os
import re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
HOM = re.compile(r'\s*/\s*(\d+)\s*$')


def fvs1(s):
    """连写几个变体符时字体会显示成方框，只留第一个。"""
    return re.sub(r'([\u180b-\u180d])[\u180b-\u180d]+', r'\1', s)


def clean(s):
    return s.replace('\r', '').replace('\t', ' ').replace('\x1e', ' ').replace('\x1f', ' ').replace('\n', ' / ').strip()


def write(name, groups, script_of, alt_of=lambda k, g: ''):
    """每部词典写两个文件：
       name.idx.txt  检索用，每行：转写 \t 原文（与程序自动转换结果相同时留空）\t 词典掩码 \t 其他检索项
       name.def.txt  释义，与 idx 逐行对应：义项之间用 \x1e，义项内各栏用 \x1f"""
    idx, defs = [], []
    for key, g in groups.items():
        mask = 0
        for sn in g['senses']:
            mask |= 1 << int(sn[0])
        idx.append(clean(key) + '\t' + script_of(key, g) + '\t' + str(mask) + '\t' + alt_of(key, g))
        defs.append('\x1e'.join('\x1f'.join(clean(str(x)) for x in sn) for sn in g['senses']))
    for suffix, lines in (('idx', idx), ('def', defs)):
        path = os.path.join(OUT, f'{name}.{suffix}.txt')
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(lines))
        print(f'{name}.{suffix}.txt: {len(lines)} 行，{os.path.getsize(path) / 1e6:.1f} MB')


def same_or(script, generated):
    """原文与自动转换结果相同时不必存，网页自行生成"""
    return '' if norm_script(script) == norm_script(generated) else script


# ---------- 满汉 ----------
MNC_ONE = dict(zip('aeiouv@nkghbpsSxtdlmcjyrfwKR\'', [
    'ᠠ', 'ᡝ', 'ᡳ', 'ᠣ', 'ᡠ', 'ᡡ', 'ᡡ', 'ᠨ', 'ᡴ', 'ᡤ', 'ᡥ',
    'ᠪ', 'ᡦ', 'ᠰ', 'ᡧ', 'ᡧ', 'ᡨ', 'ᡩ', 'ᠯ', 'ᠮ', 'ᠴ', 'ᠵ',
    'ᠶ', 'ᡵ', 'ᡶ', 'ᠸ', 'ᠺ', 'ᡰ', '᠋']))
MNC_ONE.update({'\u016B': '\u1861', '\u0161': '\u1867', '\u017E': '\u1870', ',': '\u1808', '.': '\u1809', '!': '\uFE15', '?': '\uFE16', '-': ' '})
MNC_TWO = {'zy': '\u1877\u1836', 'ng': '\u1829', 'dz': '\u186F', 'ts': '\u186E', 'cy': '\u1871\u1836', 'jy': '\u1877\u1836'}


MNC_THREE = {"ts'": '\u186E', "c'y": '\u1871\u1836'}


def to_manchu(s):
    """与 js/dict/translit-mnc.js 里的 toManchu 逐条对应，改一处要同时改另一处。"""
    out, i = '', 0
    while i < len(s):
        if s[i:i + 3] in MNC_THREE:
            out += MNC_THREE[s[i:i + 3]]; i += 3; continue
        if s[i:i + 2] in MNC_TWO:
            out += MNC_TWO[s[i:i + 2]]; i += 2; continue
        out += MNC_ONE.get(s[i], s[i]); i += 1
    return out


MN_ONE = {
    'a': '\u1820', 'e': '\u1821', 'i': '\u1822', 'o': '\u1823', 'u': '\u1824', 'O': '\u1825', 'U': '\u1826', 'E': '\u1827',
    'n': '\u1828', 'b': '\u182A', 'p': '\u182B', 'q': '\u182C', 'k': '\u182C', 'G': '\u182D', 'g': '\u182D',
    'm': '\u182E', 'l': '\u182F', 's': '\u1830', 'S': '\u1831', 't': '\u1832', 'd': '\u1833', 'c': '\u1834', 'j': '\u1835',
    'y': '\u1836', 'r': '\u1837', 'w': '\u1838', 'f': '\u1839', 'K': '\u183A', 'x': '\u183B', 'C': '\u183C', 'z': '\u183D',
    'h': '\u183E', 'H': '\u183E', 'Q': '\u1842', 'N': '\u1829', 'A': '\u1887',
    'D': '\u1833\u180B', 'T': '\u1832\u180B',
    '\u03B3': '\u182D', '\u0263': '\u182D', '\u010D': '\u1834', '\u01F0': '\u1835', '\u0161': '\u1831',
    '\u00F6': '\u1825', '\u00FC': '\u1826', '\u0113': '\u1827', 'v': '\u1826',
    '*': '\u200D', '+': '', '=': '', ',': '\u1802', '.': '\u1803', '!': '\uFE15', '?': '\uFE16'}
MN_LAT = re.compile('[A-Za-z\u03B3\u0263\u010D\u01F0\u0161\u00F6\u00FC\u0113]')


def to_mongolian(s, classical=False):
    """与 js/dict/translit-mn.js 里的 toMongolian 逐条对应，改一处要同时改另一处。"""
    out, i, n = '', 0, len(s)
    lat = lambda k: 0 <= k < n and bool(MN_LAT.match(s[k]))
    while i < n:
        ch, nx = s[i], s[i + 1] if i + 1 < n else ''
        if classical and ch == 'y' and nx == 'i' and i > 0 and s[i - 1] in 'aeiouOUE\u00F6\u00FC\u0113':
            out += '\u1822\u180B'; i += 2; continue
        if s[i:i + 3] == '(n)':
            out += '(\u180A\u1828)'; i += 3; continue
        if ch == 'n' and nx == 'g':
            out += '\u1829'; i += 2; continue
        if ch == '=' and nx == '_':
            out += '\u202F'; i += 2; continue
        if ch == '_':
            out += '\u180E'; i += 1; continue
        if ch == '-':
            out += '\u180E' if nx in ('a', 'e') and not lat(i + 2) and lat(i - 1) else '\u202F'; i += 1; continue
        if ch in "'`":
            k = 1
            while i + k < n and s[i + k] == "'":
                k += 1
            out += '\u180D' if k >= 3 else '\u180C' if k == 2 else '\u180B'; i += k; continue
        if ch in 'qk' and nx == "'":
            out += '\u182D'; i += 2; continue
        out += MN_ONE.get(ch, ch); i += 1
    return out


def norm_script(s):
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()


def manhan(path):
    dicts = ['满汉大辞典', '新满汉', '満漢和']
    groups = collections.OrderedDict()
    for x in csv.DictReader(open(path, encoding='utf-8-sig')):
        d = x['词典'].strip()
        if d not in dicts:
            continue
        t = x['转写字母'].strip()
        m = HOM.search(t)
        key = re.sub(r'\s+', ' ', HOM.sub('', t)).strip().replace('@', 'v').replace('x', 'S')
        if not key:
            continue
        g = groups.setdefault(key, {'script': HOM.sub('', x['满文词条'].strip()), 'senses': []})
        g['senses'].append((dicts.index(d), m.group(1) if m else '', x['页码'].strip(), x['词类/中文译文']))
    for g in groups.values():
        g['senses'].sort(key=lambda s: (s[0], s[1]))
    write('manhan', groups, lambda k, g: same_or(g['script'], to_manchu(k)))


# ---------- 蒙汉 ----------
def menghan(path):
    groups = collections.OrderedDict()
    for x in csv.DictReader(open(path, encoding='utf-8-sig')):
        t = x['转写'].strip()
        m = HOM.search(t)
        key = re.sub(r'\s+', ' ', HOM.sub('', t)).strip()
        if not key:
            continue
        g = groups.setdefault(key, {'scripts': [], 'senses': []})
        g['scripts'].append(fvs1(HOM.sub('', x['蒙文词条'].strip())))
        g['senses'].append((0, m.group(1) if m else '', x['页/段'].strip(), x['释义'],
                            x['国际音标'].strip(), x['西里尔蒙文'].strip()))
    for g in groups.values():
        g['senses'].sort(key=lambda s: (s[1], s[4] == ''))
    # 同一词头有几种写法时，取最长的一种（如带 (᠊ᠨ) 的）
    write('menghan', groups, lambda k, g: same_or(max(g['scripts'], key=len), to_mongolian(k)))


# ---------- 满汉蒙 ----------
def manhanmeng(path):
    dicts = ['欽定蒙文彙書', '蒙文総彙', '蒙文倒綱', '蒙漢字典']
    groups = collections.OrderedDict()

    def shown_form(s):
        # 学术转写里看不出差别的写法（变体符、词素分界号）视为相同；q'、k' 会转成 γ、g，要保留
        return re.sub(r'\s+', ' ', re.sub(r"(?<![qk])['`]|[=+*]", '', s)).strip()

    def strip_notes(s):
        s = re.sub(r'\s*\[[^\]]*\]', '', s).replace('(*)', '')
        hom = re.search(r'\s(\d+)\s*$', s)
        s = re.sub(r'\s+\d+\s*$', '', s)
        return re.sub(r'\s+', ' ', s).strip(), (hom.group(1) if hom else '')

    for x in csv.DictReader(open(path, encoding='utf-8-sig')):
        d = x['词典'].strip()
        if d not in dicts:
            continue
        raw = x['转写字母'].strip()
        key, hom = strip_notes(raw)
        if not key:
            continue
        script, _ = strip_notes(x['蒙文词条'].strip())
        script = fvs1(script)
        di = dicts.index(d)
        if d == '蒙漢字典':
            mnc, page = '', (x['页码'].strip() + ' ' + x['満文'].strip()).strip()
        else:
            mnc, page = x['満文'].strip(), x['页码'].strip()
        # 只差变体符、词素分界号的写法（如 q 与 q'、= 的有无）并为一个词头，以先出现、写法最简的一种为准
        gid = re.sub(r"['`=+*]", '', key)
        g = groups.setdefault(gid, {'keys': [], 'script': script, 'senses': []})
        g['keys'].append(key)
        g['senses'].append([di, hom, raw, x['中文译文'], mnc, page])
    out = collections.OrderedDict()
    for g in groups.values():
        key = min(g['keys'], key=lambda k: (k.count("'") + k.count('`'), g['keys'].index(k)))
        for sn in g['senses']:
            # 原书写法与词头不同时才单独列出
            sn[2] = '' if shown_form(re.sub(r'\s+\d+$', '', sn[2])) == shown_form(key) else sn[2]
        g['senses'].sort(key=lambda s: (s[0], s[1]))
        out[key] = g
    def alt(k, g):
        # 满文检索项：各义项的满文对译，拆成单项，带上词典序号，如 0:aiman
        seen = []
        for sn in g['senses']:
            for p in re.split(r'\s*[,;，；]\s*', sn[4]):
                p = re.sub(r'\[[^\]]*\]|\([^)]*\)|\{[^}]*\}', '', p).strip()
                item = f'{sn[0]}:{p}'
                if p and item not in seen:
                    seen.append(item)
        return '\x1e'.join(seen)
    write('manhanmeng', out, lambda k, g: same_or(g['script'], to_mongolian(k, True)), alt)


# ---------- 清文鑑 ----------
def qingwenjian(path):
    dicts = ['増訂清文鑑', '満蒙清文鑑', '五体清文鑑', '三合切音清文鑑', '大清全書']
    note = re.compile(r'\s*\[[^\]]*\]')
    groups = collections.OrderedDict()
    for x in csv.DictReader(open(path, encoding='utf-8-sig')):
        d = x['词典'].strip()
        if d not in dicts:
            continue
        raw = x['満洲語'].strip()
        m = HOM.search(raw)
        key = re.sub(r'\s+', ' ', note.sub('', HOM.sub('', raw))).strip().replace('@', 'v').replace('x', 'S')
        if not key:
            continue
        # 原书写法带校注（如 abdaha[S:abtaha]）时另行列出
        shown = HOM.sub('', raw) if note.search(raw) else ''
        g = groups.setdefault(key, {'senses': []})
        g['senses'].append((dicts.index(d), m.group(1) if m else '', shown, x['漢語'].strip(),
                            x['モンゴル語'].strip(), x['訳・語解'], x['页码'].strip(), x['西里尔'].strip()))
    for g in groups.values():
        g['senses'].sort(key=lambda s: (s[0], s[1]))

    def alt(k, g):
        # 蒙文检索项：各义项的蒙古文，拆成单项，去掉 /2 一类的同形词编号，带上词典序号
        seen = []
        for sn in g['senses']:
            for p in re.split(r'\s*[,;]\s*', sn[4]):
                p = re.sub(r'\s*/\s*\d+\s*$', '', note.sub('', p)).strip()
                item = f'{sn[0]}:{p}'
                if p and item not in seen:
                    seen.append(item)
        return '\x1e'.join(seen)
    # 数据里没有满文原文，一律由网页从转写生成
    write('qingwenjian', groups, lambda k, g: '', alt)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--manhan'); ap.add_argument('--menghan'); ap.add_argument('--manhanmeng'); ap.add_argument('--qingwenjian')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.manhan: manhan(a.manhan)
    if a.menghan: menghan(a.menghan)
    if a.manhanmeng: manhanmeng(a.manhanmeng)
    if a.qingwenjian: qingwenjian(a.qingwenjian)
