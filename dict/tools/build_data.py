"""把栗林均词典的 CSV 整理成网页用的词库文件（dict/data/*.txt）。

用法（在仓库根目录运行，三个参数分别是三份 CSV，不需要的可以不给）：
    python3 dict/tools/build_data.py --manhan 满汉.csv --menghan 蒙汉.csv --manhanmeng 满汉蒙.csv

词库文件每行一个词头：转写 \\t 原文 \\t 义项；义项之间用 \\x1e 隔开，义项内各栏用 \\x1f 隔开。
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


def write(name, groups, script_of):
    lines = []
    for key, g in groups.items():
        senses = '\x1e'.join('\x1f'.join(clean(str(x)) for x in s) for s in g['senses'])
        lines.append(clean(key) + '\t' + script_of(key, g) + '\t' + senses)
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print(f'{name}: {len(lines)} 个词头，{os.path.getsize(path) / 1e6:.1f} MB')


# ---------- 满汉 ----------
MNC_ONE = dict(zip('aeiouv@nkghbpsSxtdlmcjyrfwKR\'', [
    'ᠠ', 'ᡝ', 'ᡳ', 'ᠣ', 'ᡠ', 'ᡡ', 'ᡡ', 'ᠨ', 'ᡴ', 'ᡤ', 'ᡥ',
    'ᠪ', 'ᡦ', 'ᠰ', 'ᡧ', 'ᡧ', 'ᡨ', 'ᡩ', 'ᠯ', 'ᠮ', 'ᠴ', 'ᠵ',
    'ᠶ', 'ᡵ', 'ᡶ', 'ᠸ', 'ᠺ', 'ᡰ', '᠋']))
MNC_ONE.update({',': '᠈', '.': '᠉', '!': '︕', '?': '︖', '-': ' '})
MNC_TWO = {'ng': 'ᠩ', 'dz': 'ᡯ', 'ts': 'ᡮ', 'cy': 'ᡱᠶ', 'jy': 'ᡷᠶ'}


def to_manchu(s):
    out, i = '', 0
    while i < len(s):
        if s[i:i + 2] in MNC_TWO:
            out += MNC_TWO[s[i:i + 2]]; i += 2; continue
        out += MNC_ONE.get(s[i], s[i]); i += 1
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
    # 与转换结果一致的满文不必存，网页自行生成
    write('manhan.txt', groups,
          lambda k, g: '' if norm_script(g['script']) == norm_script(to_manchu(k)) else g['script'])


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
    write('menghan.txt', groups, lambda k, g: max(g['scripts'], key=len))


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
    write('manhanmeng.txt', out, lambda k, g: g['script'])


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--manhan'); ap.add_argument('--menghan'); ap.add_argument('--manhanmeng')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.manhan: manhan(a.manhan)
    if a.menghan: menghan(a.menghan)
    if a.manhanmeng: manhanmeng(a.manhanmeng)
