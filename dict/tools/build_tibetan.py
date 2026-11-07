"""把 Christian Steinert 藏文词典仓库里的词典数据整理成网页用的词库（dict/data/tibetan*）。

数据仓库：https://github.com/christiansteinert/tibetan-dictionary
用法（在本仓库最外层运行，需要 node 来读取原仓库的词典说明）：
    git clone --depth 1 https://github.com/christiansteinert/tibetan-dictionary /tmp/tibdict
    python3 dict/tools/build_tibetan.py /tmp/tibdict

生成的文件：
    dict/data/tibetan.idx.txt    检索文件，每行：威利转写 \\t （空）\\t 收此词的词典序号（逗号分隔）\\t （空）
    dict/data/tibetan/NNN.txt    释义，按检索文件的行序每 SHARD 行一份；网页只读当前这一页结果用得到的几份
    dict/data/tibetan.en.txt     英文反查：英文词 \\t 对应词头在检索文件中的行号（逗号分隔）
    js/dict/tibetan-dicts.js     各部词典的名称、语种和出处说明
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
                'SIYI.tibetanDicts = ' + json.dumps([{k: d[k] for k in ('name', 'group', 'about')} for d in dicts],
                                                   ensure_ascii=False, indent=1) + ';\n')

    print(f'{len(dicts)} 部词典，{len(keys)} 个词头，释义 {(len(keys) + SHARD - 1) // SHARD} 份，英文反查 {len(rev)} 条')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
