"""Read-only bilingual teaching catalog. Deliberately standard-library only.

Both the full workbench and the zero-install reader use this module. Reading a
course must never initialize a model, download data, or launch a kernel.
"""

from copy import deepcopy
import json
from pathlib import Path
from urllib.parse import quote, urlencode

from .paths import ROOT
from .notebook import TARGETS


def read_document(name):
    return json.loads((ROOT / 'docs' / name).read_text(encoding='utf-8'))


def language(value='zh'):
    if value not in ('zh', 'en'):
        raise ValueError('Choose lang=zh or lang=en')
    return value


def localize(value, lang):
    if isinstance(value, dict):
        if set(value) == {'zh', 'en'}:
            return value[lang]
        return {key: localize(item, lang) for key, item in value.items()}
    if isinstance(value, list):
        return [localize(item, lang) for item in value]
    return value


def notebook_path(target, lang='zh'):
    language(lang)
    relative = TARGETS.get(target)
    if not relative:
        raise KeyError('Unknown lesson')
    path = Path(relative)
    if path.parent != Path('notebooks') or path.suffix != '.ipynb':
        raise KeyError('Unknown lesson')
    return ROOT / ('notebooks/en' if lang == 'en' else 'notebooks') / path.name


def _evidence(chapter, lang):
    if chapter in (31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 6):
        pair = ('构造机制', 'Constructed mechanism')
    elif chapter in (5, 23, 24) or chapter >= 47 and chapter != 55:
        pair = ('构造机制 / 模拟市场', 'Constructed mechanism / simulation')
    elif chapter in (3, 9, 10, 18, 21):
        pair = ('真实数据 + 机制 / 模拟', 'Real data + mechanism / simulation')
    elif chapter == 0:
        pair = ('推荐课程导览', 'Recommendation course map')
    else:
        pair = ('真实数据实验', 'Real-data experiment')
    return pair[lang == 'en']


def _runtime(mode):
    return {'mode': mode, 'can_execute': mode == 'full'}


def catalog(lang='zh', mode='full'):
    language(lang)
    content = localize(read_document('learning.json'), lang)
    curriculum = read_document('curriculum.json')
    original_meta = {x['file']: x for x in curriculum['notebook_chapters']}
    en_file = ROOT / 'docs/notebooks.en.json'
    english_meta = {x['file']: x for x in json.loads(en_file.read_text(encoding='utf-8'))['notebooks']} if en_file.exists() else {}
    sources = {x['id']: x for x in content['sources']}
    chapter_modules = {chapter: m['id'] for m in content['modules'] for phase in m['phases'] for chapter in phase['chapters']}
    lessons = []
    for target, relative in TARGETS.items():
        path = Path(relative)
        if path.parent != Path('notebooks') or path.suffix != '.ipynb':
            continue
        n = int(path.name[:2])
        meta = (english_meta if lang == 'en' else original_meta).get(path.name, {})
        defaults = {'00': ('课程导航', 'Course map'), '01': ('数据、特征与 ItemCF', 'Data, features and ItemCF'), '02': ('双塔与梯度实操', 'Two towers and gradients')}
        title = meta.get('title', defaults.get(path.name[:2], (path.stem, path.stem))[lang == 'en'])
        # Translation metadata may contain the numeric chapter prefix already.
        if not title.startswith(path.name[:2]):
            title = f'{n:02d} · {title}'
        lessons.append(dict(
            chapter=n, target=target, file=path.name, module=chapter_modules[n], title=title,
            summary=meta.get('summary', meta.get('mode', '')),
            mode=meta.get('mode', _evidence(n, lang)), evidence=_evidence(n, lang),
            available=notebook_path(target, lang).is_file(),
            read_url=f'/learn/{quote(target)}?{urlencode({"lang": lang})}',
            run_url=f'/notebooks?{urlencode({"target": target, "lang": lang})}' if mode == 'full' else None,
            source_url=f'{content["repository"]}/blob/main/notebooks/' + ('en/' if lang == 'en' else '') + path.name,
        ))
    lessons.sort(key=lambda x: x['chapter'])
    lesson_by_chapter = {x['chapter']: x for x in lessons}
    for module in content['modules']:
        module['sources'] = [sources[sid] for sid in module.pop('source_ids')]
        for unit in module['units']:
            unit['references'] = [{**sources[r['source_id']], **r} for r in unit['references']]
        for lecture in module['lectures']:
            lecture.update(type=sources[lecture['source_id']]['type'], language=sources[lecture['source_id']]['language'])
            local = ROOT / curriculum['local_source'] / lecture.get('file', '__unavailable__')
            lecture['local_url'] = '/api/lectures/' + quote(lecture['file']) if mode == 'full' and lecture.get('file') and local.is_file() else None
        module['lesson_count'] = sum(x['module'] == module['id'] for x in lessons)
        first = module['phases'][0]['chapters'][0]
        module['start_url'] = lesson_by_chapter[first]['read_url']
    return {**content, 'lang': lang, 'runtime': _runtime(mode), 'lessons': lessons}


def lesson(target, lang='zh', mode='full'):
    path = notebook_path(target, lang)
    if not path.is_file():
        raise KeyError('Lesson translation is not available')
    book = json.loads(path.read_text(encoding='utf-8'))
    content = catalog(lang, mode)
    row = next(x for x in content['lessons'] if x['target'] == target)
    module = next(x for x in content['modules'] if x['id'] == row['module'])
    order = [n for phase in module['phases'] for n in phase['chapters']]
    index = order.index(row['chapter'])
    def neighbor(offset):
        at = index + offset
        if not 0 <= at < len(order):
            return None
        other = next(x for x in content['lessons'] if x['chapter'] == order[at])
        return {k: other[k] for k in ('title', 'target', 'read_url')}
    refs, seen = [], set()
    for unit in module['units']:
        if row['chapter'] in unit['chapters']:
            for ref in unit['references']:
                key = ref['url']
                if key not in seen:
                    refs.append(ref)
                    seen.add(key)
    for ref in module['lectures']:
        if row['chapter'] in ref['chapters']:
            key = ref['url']
            if key not in seen:
                refs.append(ref)
                seen.add(key)
    if not refs:
        for source in module['sources']:
            refs.append({**source, 'locator': '领域背景资料；具体复现边界见本章正文。' if lang == 'zh' else 'Domain background; see this lesson for its precise reproduction boundaries.'})
    cells = []
    for original in book['cells']:
        cell = {key: deepcopy(original[key]) for key in ('cell_type', 'source', 'outputs', 'execution_count') if key in original}
        cell['source'] = ''.join(cell['source']) if isinstance(cell['source'], list) else cell['source']
        cells.append(cell)
    return {**row, 'lang': lang, 'runtime': _runtime(mode), 'module_title': module['title'],
            'cells': cells, 'previous': neighbor(-1), 'next': neighbor(1), 'references': refs,
            'notebook_links': {x['file']: x['read_url'] for x in content['lessons']},
            'prerequisites': module['prerequisites'], 'units': [u for u in module['units'] if row['chapter'] in u['chapters']],
            'output_note': '已有输出来自保存的教学实验，并非打开页面时重新执行。' if lang == 'zh' else 'Saved outputs come from recorded teaching runs; opening this page does not rerun an experiment.'}
