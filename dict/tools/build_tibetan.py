"""把 Christian Steinert 藏文词典仓库里的词典数据整理成网页用的词库（dict/data/tibetan*）。

数据仓库：https://github.com/christiansteinert/tibetan-dictionary
用法（在本仓库最外层运行，需要 node 来读取原仓库的词典说明）：
    git clone --depth 1 https://github.com/christiansteinert/tibetan-dictionary /tmp/tibdict
    python3 dict/tools/build_tibetan.py /tmp/tibdict

生成的文件：
    dict/data/tibetan.idx.txt    检索文件，每行：威利转写 \\t （空）\\t 收此词的词典序号（逗号分隔）\\t （空）
    dict/data/tibetan/NNN.txt    释义，按检索文件的行序每 SHARD 行一份；网页只读当前这一页结果用得到的几份
    dict/data/tibetan.en.txt     英文反查：英文词 \\t 对应词头在检索文件中的行号（逗号分隔）
    js/dict/tibetan-dicts.js     各部词典的名称、语种、出处说明，以及简称章（见下面的 ABBR 表）
各词典的版权属于原作者，见出处说明。只有页码、没有文字的扫描本词典不收。
"""
import collections
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'dict', 'data')
SHARD = 600


# 各部词典的简称章（abbr）、章下小字（sub）和中文说明（zh），按原仓库里的名称对应。
# 每组内的先后就是网页上同一词条里各词典的排列次序（常用的在前）。新增词典若不在表里，章用名称前几个字母。
ABBR = [
    # 藏英
    ('Rangjung Yeshe', 'RY', '', 'Erik Pema Kunsang《藏英佛学词典》3.0'),
    ('Hopkins 2015', 'Hop', '', 'Hopkins《藏梵英词典》2015 版'),
    ('Hopkins Definitions 2015', 'Hop', '定义', 'Hopkins 2015 版，定义'),
    ('Hopkins Divisions 2015', 'Hop', '分类', 'Hopkins 2015 版，分类'),
    ("Hopkins others' English 2015", 'Hop', '他译', 'Hopkins 2015 版，他人译法'),
    ('Hopkins Comment 1992', 'Hop', '注 1992', 'Hopkins 1992 版，注释'),
    ('Hopkins Examples 1992', 'Hop', '例句 1992', 'Hopkins 1992 版，例句'),
    ('Hopkins Synonyms 1992', 'Hop', '同义 1992', 'Hopkins 1992 版，同义词'),
    ('Hackett Definitions 2015', 'Hackett', '', 'Paul Hackett 撰写的定义'),
    ('James Valby', 'Valby', '', 'James Valby 藏英词典'),
    ('Ives Waldo', 'Waldo', '', 'Ives Waldo 词汇'),
    ('Richard Barron', 'Barron', '', 'Richard Barron 词汇'),
    ('Thomas Doctor', 'Doctor', '', 'Thomas Doctor 词汇'),
    ('Dan Martin', 'Martin', '', 'Dan Martin, Tibetan Vocabulary'),
    ('Berzin', 'Berzin', '', 'Berzin 藏梵英词汇'),
    ('Berzin Definitions', 'Berzin', '定义', 'Berzin 词汇，定义'),
    ('Tsepak Rigdzin', 'Rigdzin', '', 'Tsepak Rigdzin《藏英佛学词典》'),
    ('Jongbok Yi', 'Yi', '', 'Jongbok Yi 撰写的定义'),
    ('84000 Glossary', '84k', '', '84000 译经计划词汇表'),
    ('84000 Glossary-Definitions', '84k', '定义', '84000 词汇表，定义'),
    ('Indo-Tibetan Lexical Resource (ITLR)', 'ITLR', '', '印藏词汇资源库'),
    ('Tibetan Terminology Project: Glossary of Standardised Terms', 'TTP', '', '流亡藏人教育部标准术语表'),
    ('sgra bye brag tu rtogs byed chen mo skad bzhi shan sbyar ma (Mahāvyutpatti with added English)', 'MVy', '英', '《翻译名义大集》加英译本'),
    ("Glossary for Mipham Rinpoche's Gateway to Knowledge, Vol. 1 (Rangjung Yeshe)", 'Gateway', '', '米庞仁波切《智者入门》词汇'),
    ('Verbinator Verb Dictionary', 'Verb', '', '动词词典'),
    ('Gäng / Wetzel', 'Gäng', '', '多语佛学术语'),
    ('Chung-An Lin', 'Lin', '', '林崇安《汉藏梵英佛学名相》'),
    ('Bialek', 'Bialek', '', 'Bialek《古典藏文教程》词汇'),
    ('Heart of Tibetan Language 1', 'HTL', '1', '藏语教材词汇，第一册'),
    ('Heart of Tibetan Language 2', 'HTL', '2', '藏语教材词汇，第二册'),
    ('Heart of Tibetan Language 3', 'HTL', '3', '藏语教材词汇，第三册'),
    ('Tibetan Language School: Supplementary Vocabulary', 'TLS', '', '口语补充词汇'),
    ('Computer terms', 'IT', '', '中国藏学研究中心《信息技术藏文术语》'),
    ('Miscellaneous definitions', 'Misc', '', '杂项定义'),
    # 藏文释义
    ('bod rgya tshig mdzod chen mo', '藏汉', '', '张怡荪《藏汉大辞典》'),
    ('dung dkar tshig mdzod chen mo', '东噶', '', '东噶·洛桑赤列《东噶藏学大辞典》'),
    ('Dag yig gsar bsgrigs', '正字', '', '青海民族出版社 1979 年版正字典'),
    ('Bod rgya sangs rgyas chos gzhung gi tshig mdzod', '佛学', '', '王沂暖等《藏汉佛学词典》'),
    ('Bod rgya nang don rig pa’i tshig mdzod', '内明', '', '四川民族出版社 1993 年版佛学词典'),
    ('Brda dkrol gser gyi me long', '金镜', '', '赞拉·阿旺次仁《古藏文词语诠释·金镜》'),
    ("Li shi'i gur khang", '丁香帐', '', '觉敦·仁钦扎西《新旧词语·丁香帐》'),
    ('Chos rnam kun btus', '法数', '', '佛教名数汇编'),
    ('sGom sde tshig mdzod chen mo', '贡德', '', '贡德拉然巴大辞典'),
    ('Gangs can mkhas grub rim byon ming mdzod', '人名', '', '《雪域历代名人辞典》'),
    ('Bod yig tshig gter rgya mtsho', '词海', '', '土登彭措编，2012 年'),
    ('Sera Textbook Definitions', '色拉', '', '色拉寺教本中的定义'),
    ('Tibetan Abbreviations', '缩略', '', 'Bruno Lainé 编藏文缩略语'),
    ('84000 Tibetan Synonyms', '84k', '同义', '84000 藏文同义词'),
    # 藏梵
    ('Mahāvyutpatti', 'MVy', '', '《翻译名义大集》'),
    ('Negi', 'Negi', '', 'J.S. Negi《藏梵大辞典》'),
    ('Lokesh Chandra', 'LC', '', 'Lokesh Chandra《藏梵词典》'),
    ('Yogacharabhumi Glossary', 'YBh', '', '《瑜伽师地论》藏梵词表'),
    ('Hopkins Sanskrit 2015', 'Hop', '梵', 'Hopkins 2015 版，梵文对应词'),
    ('84000 Glossary, Sanskrit', '84k', '梵', '84000 梵文词汇'),
]
# 藏文释义组里的 Hopkins 各部与藏英组同名，另列
ABBR_TIB = {
    'Hopkins Definitions 2015': ('Hop', '定义', 'Hopkins 2015 版，藏文定义'),
    'Hopkins Divisions 2015': ('Hop', '分类', 'Hopkins 2015 版，藏文分类'),
    'Hopkins Synonyms 2015': ('Hop', '同义', 'Hopkins 2015 版，藏文同义词'),
    'Hopkins Tenses 2015': ('Hop', '时态', 'Hopkins 2015 版，动词时态'),
    'Hopkins Examples 1992': ('Hop', '例句 1992', 'Hopkins 1992 版，藏文例句'),
    'Hopkins Synonyms 1992': ('Hop', '同义 1992', 'Hopkins 1992 版，藏文同义词'),
}


def abbr_of(name, group):
    """返回（章，小字，中文说明，组内次序）"""
    if group == 'tib' and name in ABBR_TIB:
        a, s, z = ABBR_TIB[name]
        return a, s, z, 900 + list(ABBR_TIB).index(name)
    for i, (n, a, s, z) in enumerate(ABBR):
        if n == name:
            return a, s, z, i
    return re.sub(r'[^A-Za-z0-9]', '', name)[:6] or name[:4], '', '', 9999


def load_meta(repo):
    """读出原仓库 webapp/src/config/dictlist.ts 里的词典说明（名称、语种、出处）。"""
    src = open(os.path.join(repo, 'webapp/src/config/dictlist.ts'), encoding='utf-8').read()
    a = src.index('{', src.index('export const GROUPED_DICTLIST'))
    b = src.index('} as const;', a)
    js = subprocess.run(['node', '-e', 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{'
                         'process.stdout.write(JSON.stringify((0,eval)("("+s+")")))})'],
                        input=src[a:b + 1], capture_output=True, text=True, check=True).stdout
    flat = {}
    for k, v in json.loads(js).items():
        if v.get('type') == 'group':
            for k2, v2 in v['items'].items():
                flat[k2] = v2
        else:
            flat[k] = v
    return flat


def clean(s):
    return s.replace('\r', '').replace('\t', ' ').replace('\x1e', ' ').replace('\x1f', ' ').strip()


def norm_key(k):
    k = re.sub(r'\s+', ' ', k).strip().lstrip('= ')   # 个别词头前带“=”，表示参见
    return re.sub(r'[\s/]+$', '', k).strip()


def sort_fold(k):
    return re.sub(r"[^a-z' ]", '', k.lower())


def main(repo):
    meta = load_meta(repo)
    pub = os.path.join(repo, '_input/dictionaries/public')
    dicts = []
    for fn in sorted(os.listdir(pub)):
        key = fn.split('-', 1)[1]
        m = meta.get(key)
        if not m or not m.get('public', True):
            continue
        label = m.get('label', key).replace('&shy;', '').strip()
        if 'scanned dictionary' in label:
            continue          # 扫描本只有页码，没有文字
        lang = m.get('language', [])
        group = 'en' if 'en' in lang else 'skt' if 'skt' in lang else 'tib'
        about = [x.strip() for x in (m.get('about') or '').replace('&shy;', '').split('|') if x.strip()]
        dicts.append({'file': fn, 'name': label, 'group': group, 'about': about})

    # 读入全部词条，按词头归并
    groups = collections.defaultdict(list)
    for d, info in enumerate(dicts):
        with open(os.path.join(pub, info['file']), encoding='utf-8', errors='replace') as f:
            for line in f:
                line = line.rstrip('\n')
                if not line or line.startswith('#') or '|' not in line:
                    continue
                k, v = line.split('|', 1)
                k, v = norm_key(k), clean(v)
                if k and v:
                    groups[k].append((d, v))
    keys = sorted(groups, key=lambda k: (sort_fold(k), k))
    pos = {k: i for i, k in enumerate(keys)}

    # 检索文件
    with open(os.path.join(OUT, 'tibetan.idx.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(k + '\t\t' + ','.join(str(d) for d in sorted({s[0] for s in groups[k]})) + '\t' for k in keys))
    # 释义分片
    shard_dir = os.path.join(OUT, 'tibetan')
    if os.path.isdir(shard_dir):
        shutil.rmtree(shard_dir)
    os.makedirs(shard_dir)
    for n in range(0, len(keys), SHARD):
        lines = []
        for k in keys[n:n + SHARD]:
            seen, senses = set(), []
            for d, v in groups[k]:
                if (d, v) not in seen:
                    seen.add((d, v)); senses.append((d, v))
            lines.append('\x1e'.join(f'{d}\x1f{v}' for d, v in senses))
        with open(os.path.join(shard_dir, f'{n // SHARD:04d}.txt'), 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(lines))

    # 英文反查：取 public_en 里各英文词对应的藏文词头
    rev = collections.defaultdict(set)
    en_dir = os.path.join(repo, '_input/dictionaries/public_en')
    for fn in sorted(os.listdir(en_dir)):
        with open(os.path.join(en_dir, fn), encoding='utf-8', errors='replace') as f:
            for line in f:
                if line.startswith('#') or '|' not in line:
                    continue
                term, rest = line.rstrip('\n').split('|', 1)
                term = re.sub(r'\s+', ' ', term).strip().lower()
                m = re.match(r'\s*\{([^}]*)\}', rest)
                if not term or not m:
                    continue
                k = norm_key(m.group(1))
                if k in pos:
                    rev[term].add(pos[k])
    with open(os.path.join(OUT, 'tibetan.en.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(t + '\t' + ','.join(str(i) for i in sorted(ids)) for t, ids in sorted(rev.items())))

    # 词典说明
    with open(os.path.join(ROOT, 'js', 'dict', 'tibetan-dicts.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* 藏文词典各部的名称、语种（en 藏英、tib 藏文释藏文、skt 藏梵）和出处说明。\n'
                '   由 dict/tools/build_tibetan.py 从 Steinert 藏文词典仓库生成，不要手改。 */\n'
                'SIYI.tibetanDicts = ' + json.dumps([dict({k: d[k] for k in ('name', 'group', 'about')},
                                                        **dict(zip(('abbr', 'sub', 'zh', 'rank'), abbr_of(d['name'], d['group']))))
                                                   for d in dicts], ensure_ascii=False, indent=1) + ';\n')

    print(f'{len(dicts)} 部词典，{len(keys)} 个词头，释义 {(len(keys) + SHARD - 1) // SHARD} 份，英文反查 {len(rev)} 条')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
