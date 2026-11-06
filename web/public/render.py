"""HTML presentation for the public, pre-rendered course site.

The exporter owns notebook rendering, URL rewriting and SEO metadata. All
ordinary values are escaped here; content_html/head_extra are trusted output
from that exporter, never visitor input.
"""

from html import escape
from urllib.parse import urlsplit


def h(value):
    return escape(str(value), quote=True)


class Page:
    def __init__(self, context):
        self.c = context
        self.lang = context['lang']
        self.catalog = context['catalog']
        self.home = context['home_url']
        self.repo = self.catalog['repository']
        self.lessons = {row['chapter']: row for row in self.catalog['lessons']}

    def t(self, en, zh):
        return zh if self.lang == 'zh' else en

    def current(self, value, selected, indicator='page'):
        return f' aria-current="{indicator}"' if value == selected else ''

    def module_url(self, module):
        return self.home + module['id'] + '/'

    def external(self, url, text, cls=''):
        return f'<a class="{h(cls)}" href="{h(url)}" target="_blank" rel="noopener">{h(text)} <span aria-hidden="true">↗</span></a>'

    def source(self, source):
        lang = {'en': self.t('English', '英文'), 'zh': self.t('Chinese', '中文')}.get(source.get('language'), source.get('language', ''))
        locator = source.get('locator', '')
        return f'''<article class="source-card"><div class="source-meta"><span>{h(source.get('type', self.t('Original material', '原始资料')))}</span><span>{h(lang)}</span></div><h3>{self.external(source['url'], source['title'])}</h3>{f'<p class="source-locator">{h(locator)}</p>' if locator else ''}<p>{h(source.get('scope', ''))}</p></article>'''

    def lesson_card(self, lesson):
        return f'''<article class="lesson-card" data-lesson-card data-target="{h(lesson['target'])}" data-search="{h(lesson['title'] + ' ' + lesson.get('summary', ''))}"><div class="lesson-meta"><span class="mono">{lesson['chapter']:02d}</span><span class="evidence">{h(lesson['evidence'])}</span><span class="completed-label" hidden>{self.t('Completed', '已完成')}</span></div><h4><a href="{h(lesson['read_url'])}">{h(lesson['title'])}</a></h4><p>{h(lesson.get('summary', ''))}</p><div class="lesson-card-actions"><a href="{h(lesson['read_url'])}">{self.t('Read lesson', '阅读课程')} <span aria-hidden="true">→</span></a>{self.external(lesson['source_url'], 'Notebook')}</div></article>'''

    def home_content(self):
        count = len(self.catalog['lessons'])
        sources = sum(len(module['lectures']) for module in self.catalog['modules'])
        first = self.lessons[31]['read_url']
        loops = [(self.t('Read the source', '读原文'), self.t('Trace an idea to its origin.', '找到概念的出处。')),
                 (self.t('Make a prediction', '做预测'), self.t('Write down a testable hypothesis.', '写下可检验的假设。')),
                 (self.t('Change one variable', '改一个变量'), self.t('Keep the comparison fair.', '比较相同预算与输入。')),
                 (self.t('Explain the result', '解释结果'), self.t('Keep the evidence, even when it fails.', '保留证据，也保留负结果。'))]
        loop_html = ''.join(f'<li><span class="step-number">0{i}</span><div><strong>{h(title)}</strong><p>{h(text)}</p></div></li>' for i, (title, text) in enumerate(loops, 1))
        cards = []
        path_labels = {
            'common': (self.t('Start with the shared language.', '从共同的基础开始。'), self.t('Tensors → gradients → optimization → evaluation', '张量 → 梯度 → 优化 → 评估')),
            'search': (self.t('From a query to a useful answer.', '从用户问题到有用的结果。'), self.t('Needs → queries → retrieval → relevance → ranking', '需求 → 查询 → 召回 → 相关性 → 排序')),
            'ads': (self.t('Understand the market and the model.', '理解市场，也理解模型。'), self.t('Products → prediction → auctions → delivery → feedback', '产品 → 预测 → 拍卖 → 投放 → 反馈')),
            'recommendation': (self.t('Turn behavior into better candidates.', '从行为信号到推荐候选。'), self.t('Data → retrieval → interactions → sequences → evaluation', '数据 → 召回 → 交叉 → 序列 → 评估')),
        }
        for i, module in enumerate(self.catalog['modules']):
            title, sequence = path_labels[module['id']]
            cards.append(f'''<a class="path-card" href="{h(self.module_url(module))}"><div class="path-top"><span class="mono">0{i}</span><span>{h(module['title'])}</span><span aria-hidden="true">↗</span></div><h3>{h(title)}</h3><p>{h(module['description'])}</p><div class="path-sequence">{h(sequence)}</div><div class="path-bottom"><span>{module['lesson_count']} {self.t('lessons', '章')}</span><span>{self.t('Explore the path', '查看学习路线')} →</span></div></a>''')
        foundations = self.catalog['modules'][0]
        return f'''<section class="hero" aria-labelledby="page-title"><div class="hero-copy"><p class="eyebrow">SEARCH · ADS · RECOMMENDATION</p><h1 id="page-title" tabindex="-1">{self.t('Understand the system.<br>Test every assumption.', '把算法学成<br>可以解释的系统。')}</h1><p class="hero-description">{self.t('Learn search, advertising and recommendation through original sources, short experiments, and evidence you can inspect. One shared foundation. Three connected fields.', '沿权威公开资料学习搜索、广告和推荐，在短实验中验证机制，再回到真实数据检验判断。一套基础，三个相互联系的领域。')}</p><div class="actions"><a class="button primary" href="{h(first)}">{self.t('Start your first lesson', '从第一个实验开始')} <span aria-hidden="true">→</span></a><a class="button secondary" href="#learning-paths">{self.t('Explore the paths', '查看学习路线')}</a></div><p class="small muted">{self.t('Read here, in your browser. Clone the Lab when you are ready to run experiments.', '直接在浏览器阅读。准备好动手实验后，再 clone 完整 Lab。')}</p></div><aside class="learning-loop" aria-label="{self.t('The learning loop', '学习闭环')}"><div class="loop-top"><span>{self.t('THE LEARNING LOOP', '学习闭环')}</span><span>01—04</span></div><ol>{loop_html}</ol></aside></section>
<div class="home-facts"><div><strong>{count}</strong><span>{self.t('notebook lessons', '个 Notebook 章节')}</span></div><div><strong>4</strong><span>{self.t('learning paths', '条学习路线')}</span></div><div><strong>EN / 中文</strong><span>{self.t('two reading languages', '中英文配套阅读')}</span></div><div><strong>{sources}</strong><span>{self.t('original-material entries', '份原始讲义入口')}</span></div></div>
<section id="learning-paths" class="section-block"><div class="section-heading"><div><p class="eyebrow">{self.t('CHOOSE A PATH', '选择一条路线')}</p><h2>{self.t('Learn in the order the ideas connect.', '按知识之间的联系学习。')}</h2></div><p>{self.t('New to the fundamentals? Begin with chapters 31–34.', '需要补基础？先从 31–34 章开始。')}</p></div><div class="path-grid">{''.join(cards)}</div></section>
<section class="evidence-section"><div><p class="eyebrow">{self.t('FOLLOW THE EVIDENCE', '追溯证据')}</p><h2>{self.t('Know what each result can tell you.', '知道结果能说明什么。')}</h2><p>{self.t('The curricula connect author lectures, textbooks and research to independent teaching notebooks. Every path explains its sources and boundaries. A course reference is not a claim of endorsement or a full reproduction.', '课程把作者讲义、教材和研究与独立编写的教学 Notebook 对应起来。每条路线都说明来源和边界；引用课程不代表作者背书，也不等于完整复现。')}</p><a class="text-link" href="{h(self.module_url(foundations))}#sources">{self.t('How the foundations are sourced', '查看基础课程来源')} →</a></div><div class="evidence-types"><div><h3>{self.t('Constructed mechanisms', '构造机制')}</h3><p>{self.t('Small inputs make shapes, gradients, losses and decisions visible.', '小规模输入让张量、梯度、损失和决策过程可以检查。')}</p></div><div><h3>{self.t('Real-data experiments', '真实数据实验')}</h3><p>{self.t('Public logs and benchmarks, with explicit splits, metrics and limitations.', '公开日志与基准数据，明确划分、指标和限制。')}</p></div><div><h3>{self.t('Independent simulations', '独立模拟')}</h3><p>{self.t('Explore auction and delivery behavior without calling simulated revenue real revenue.', '研究拍卖和投放机制，不将模拟收入当作真实业务收益。')}</p></div></div></section>
{self.run_locally()}
<section class="contribute-section"><div><h2>{self.t('Make the next lesson clearer.', '让下一位学习者更容易理解。')}</h2><p>{self.t('Found an unclear explanation, a broken source or a useful experiment? Share a reproducible issue or contribute a focused improvement.', '发现解释不清、来源失效，或者有更好的实验？提交可复现的问题，或贡献一个聚焦的改进。')}</p></div>{self.external(self.repo + '/blob/main/CONTRIBUTING.md', self.t('Contribute on GitHub', '在 GitHub 参与贡献'), 'button secondary')}</section>'''

    def run_locally(self):
        return f'''<section id="run-locally" class="run-section"><div><p class="eyebrow">{self.t('READ ONLINE. EXPERIMENT LOCALLY.', '在线阅读，本地实验。')}</p><h2>{self.t('Ready to change a variable?', '准备好改一个变量了吗？')}</h2><p>{self.t('This site shows the teaching text, code and saved outputs. Clone the same Lab for editable notebooks, model training and the interactive workbench.', '这里提供课程正文、代码和保存的输出。clone 同一个 Lab 后，可编辑 Notebook、训练模型并使用交互工作台。')}</p><p class="small muted">{self.t('The minimal setup installs the locked environment and notebook kernel. Real-data experiments need their separate domain preparation. The full setup is tested on Apple Silicon macOS; see the guide for platform requirements.', '最小安装仅准备锁定环境和 Notebook 内核。真实数据实验还需按领域准备数据与模型。完整环境在 Apple Silicon macOS 上验收，平台要求见安装指南。')}</p>{self.external(self.c['setup_url'], self.t('Setup guide and domain requirements', '安装指南与领域准备要求'), 'text-link')}</div><div class="clone-block"><div class="code-label">{self.t('YOUR TERMINAL', '在你的终端执行')}</div><pre><code id="clone-command">git clone https://github.com/lynnlee1229/search-recommendation-ads-lab.git
cd search-recommendation-ads-lab
./setup.sh --minimal
./lab.sh up</code></pre><button class="copy-code" type="button" data-copy-code="clone-command" hidden>{self.t('Copy commands', '复制命令')}</button><p>{self.t('Open the local URL printed by the Lab. The website never starts a training job.', '打开 Lab 输出的本机地址。浏览本网站不会启动训练。')}</p></div></section>'''

    def module_content(self):
        module = self.c['module']
        phases = []
        for i, phase in enumerate(module['phases'], 1):
            cards = ''.join(self.lesson_card(self.lessons[n]) for n in phase['chapters'])
            phases.append(f'''<section class="phase" data-phase><div class="phase-heading"><span class="phase-number">{i:02d}</span><div><h3>{h(phase['title'])}</h3><p>{h(phase['description'])}</p></div></div><div class="lesson-grid">{cards}</div></section>''')
        units = []
        for unit in module['units']:
            refs = ''.join(f'<li>{self.external(ref["url"], ref["title"])}<span>{h(ref.get("locator", ""))}</span></li>' for ref in unit['references'])
            lessons = ''.join(f'<a href="{h(self.lessons[n]["read_url"])}">{h(self.lessons[n]["title"])}</a>' for n in unit['chapters'])
            units.append(f'''<article class="source-unit"><div class="unit-heading"><span class="mono">{h(unit['id'])}</span><h3>{h(unit['title'])}</h3></div><p>{h(unit['objective'])}</p><div class="unit-lessons">{lessons}</div><ul class="unit-references">{refs}</ul><p class="unit-boundary"><strong>{self.t('Boundary', '边界')}:</strong> {h(unit['limitation'])}</p></article>''')
        lecture_rows = []
        for lecture in module['lectures']:
            langs = {'en': self.t('English', '英文'), 'zh': self.t('Chinese', '中文')}
            lecture_rows.append(f'''<li><div><strong>{self.external(lecture['url'], lecture['title'])}</strong><p>{h(lecture.get('locator', ''))} · {h(langs.get(lecture.get('language'), lecture.get('language', '')))}</p><p>{h(lecture.get('scope', ''))}</p></div></li>''')
        lectures = f'''<details class="lecture-library" id="original-materials"><summary>{self.t('Original lecture library', '原始讲义目录')} <span>{len(lecture_rows)} {self.t('entries', '份')}</span></summary><p class="small muted">{self.t('These links open the original author or publisher material, in its original language and under its own terms.', '以下链接打开作者或出版方的原始资料，保留其原始语言和使用条款。')}</p><ol>{''.join(lecture_rows)}</ol></details>''' if lecture_rows else ''
        return f'''<div class="breadcrumb"><a href="{h(self.home)}">{self.t('All paths', '全部路线')}</a><span aria-hidden="true">/</span><span>{h(module['title'])}</span></div><header class="page-intro"><p class="eyebrow">{module['lesson_count']} {self.t('LESSONS · ONE CONNECTED PATH', '章 · 一条连贯路线')}</p><h1 id="page-title" tabindex="-1">{h(module['title'])}</h1><p class="lead">{h(module['description'])}</p><p class="prerequisite"><strong>{self.t('Before you begin', '开始之前')}:</strong> {h(module['prerequisites'])}</p><div class="actions"><a class="button primary" href="{h(module['start_url'])}">{self.t('Start this path', '开始这条路线')} →</a><a class="button secondary" href="#sources">{self.t('Sources & lecture notes', '课程来源与讲义')}</a></div></header><nav class="section-nav" aria-label="{self.t('Page sections', '页面章节')}"><a href="#lessons">{self.t('Learning path', '学习路线')}</a><a href="#sources">{self.t('Sources', '资料来源')}</a>{f'<a href="#original-materials">{self.t("Original lectures", "原始讲义")}</a>' if lecture_rows else ''}<a href="{h(self.home)}#run-locally">{self.t('Run the Lab locally', '本地运行 Lab')}</a></nav>
<section id="lessons"><div class="section-heading"><div><p class="eyebrow">{self.t('THE LEARNING PATH', '学习路线')}</p><h2>{self.t('Build one idea on the last.', '让概念逐步连接。')}</h2></div><div class="filter-box" hidden><label for="lesson-filter">{self.t('Find a lesson', '查找章节')}</label><input id="lesson-filter" type="search" placeholder="{self.t('Try a concept or chapter number', '输入概念或章节编号')}" aria-controls="lesson-phases"><p id="filter-status" role="status" aria-live="polite"></p></div></div><div id="lesson-phases">{''.join(phases)}</div><p class="filter-empty" hidden>{self.t('No lessons match. Try another concept or clear the search.', '没有匹配的章节，请换个关键词或清空搜索。')}</p></section>
<section id="sources" class="sources-section"><div class="section-heading"><div><p class="eyebrow">{self.t('TRACE THE IDEAS', '追溯概念来源')}</p><h2>{self.t('Sources & lecture notes', '课程来源与讲义')}</h2></div></div><p class="section-description">{self.t('Follow the original material alongside the Lab. Source scope, original language and the boundaries of each teaching unit are explicit.', '配合 Lab 阅读原始资料。每项资料标明范围和原始语言，每个教学单元说明复现边界。')}</p><div class="source-grid">{''.join(self.source(source) for source in module['sources'])}</div><details class="source-map"><summary>{self.t('Chapter-to-source map', '章节与来源对应')} <span>{len(units)} {self.t('units', '个单元')}</span></summary>{''.join(units)}</details>{lectures}</section>'''

    def lesson_content(self):
        lesson = self.c['lesson']
        module = next(m for m in self.catalog['modules'] if m['id'] == lesson['module'])
        toc = ''.join(f'<a class="toc-level-{int(row["level"])}" href="#{h(row["id"])}">{h(row["title"])}</a>' for row in self.c.get('toc', []))
        neighbors = []
        for key, label in [('previous', self.t('Previous lesson', '上一章')), ('next', self.t('Next lesson', '下一章'))]:
            row = lesson.get(key)
            neighbors.append(f'<a class="lesson-{key}" href="{h(row["read_url"])}"><span>{label}</span><strong>{h(row["title"])}</strong></a>' if row else '<div></div>')
        refs = ''.join(self.source(source) for source in lesson.get('references', []))
        return f'''<div class="breadcrumb"><a href="{h(self.home)}">{self.t('All paths', '全部路线')}</a><span aria-hidden="true">/</span><a href="{h(self.module_url(module))}">{h(module['title'])}</a><span aria-hidden="true">/</span><span>{lesson['chapter']:02d}</span></div><header class="page-intro lesson-intro"><p class="eyebrow">{h(module['title'].upper())} / {self.t('NOTEBOOK LESSON', 'NOTEBOOK 课程')}</p><h1 id="page-title" tabindex="-1">{h(lesson['title'])}</h1><p class="lead">{h(lesson.get('summary', ''))}</p><div class="lesson-tags"><span class="evidence">{h(lesson['evidence'])}</span><span>{self.t('Read-only · saved experiment', '只读 · 已保存的实验')}</span></div><div class="actions"><a class="button primary" href="{h(self.home)}#run-locally">{self.t('Run the experiment locally', '在本地运行实验')} <span aria-hidden="true">↗</span></a><button class="button secondary" id="mark-complete" data-target="{h(lesson['target'])}" aria-pressed="false" type="button" hidden>{self.t('Mark complete', '标记为已学')}</button>{self.external(lesson['source_url'], self.t('View notebook', '查看 Notebook'), 'notebook-link')}</div><p class="reader-note">{h(lesson['output_note'])} {self.t('The code and original outputs are preserved; original-language data and annotations may remain.', '代码和原始输出保持不变；数据与历史注释保留原始语言。')}</p><p class="progress-status small" role="status" aria-live="polite"></p></header>
<div class="reader-layout"><aside class="reader-sidebar"><details open><summary>{self.t('On this page', '本章目录')}</summary><nav aria-label="{self.t('Lesson contents', '课程目录')}">{toc or f'<a href="#lesson-content">{self.t("Lesson content", "课程正文")}</a>'}<a href="#lesson-sources">{self.t('Sources', '资料来源')}</a></nav></details><div class="reader-method"><p class="eyebrow">{self.t('KEEP ONE QUESTION', '带着一个问题阅读')}</p><p>{self.t('What would change if you changed one input? Predict it before you run it.', '如果只改变一个输入，结果会怎样？运行之前，先写下预测。')}</p><a href="{h(self.module_url(module))}">{self.t('Back to the learning path', '返回学习路线')} →</a></div></aside><article class="lesson-content" id="lesson-content" aria-label="{self.t('Lesson content', '课程正文')}">{self.c['content_html']}</article></div><section id="lesson-sources" class="lesson-sources"><p class="eyebrow">{self.t('GO TO THE SOURCE', '继续阅读原文')}</p><h2>{self.t('Sources for this lesson', '本章来源')}</h2><div class="source-grid">{refs}</div></section><nav class="lesson-navigation" aria-label="{self.t('Previous and next lessons', '前后章节')}">{''.join(neighbors)}</nav><p class="progress-note small muted">{self.t('Completion marks are optional and stored only in this browser. Reading a page does not mark it complete.', '学习标记可选，仅保存在当前浏览器中。打开页面不会自动标记已学。')}</p>'''

    def not_found_content(self):
        return f'''<section class="not-found"><p class="eyebrow">404</p><h1 id="page-title" tabindex="-1">{self.t('This lesson is not here.', '没有找到这篇课程。')}</h1><p>{self.t('The learning paths will help you find the next idea.', '从学习路线中找到你要了解的概念。')}</p><a class="button primary" href="{h(self.home)}">{self.t('Explore the courses', '查看课程')} →</a></section>'''

    def document(self, kind):
        body = {'home': self.home_content, 'module': self.module_content, 'lesson': self.lesson_content, '404': self.not_found_content}[kind]()
        current_module = self.c.get('module') or {}
        if kind == 'lesson':
            current_module = {'id': self.c['lesson']['module']}
        nav = ''.join(f'<a href="{h(self.module_url(module))}"{self.current(module["id"], current_module.get("id"))}>{h(module["title"])}</a>' for module in self.catalog['modules'])
        alternates = self.c['alternates']
        switch = ''.join(f'<a href="{h(urlsplit(alternates[lang]).path)}" lang="{"zh-CN" if lang == "zh" else "en"}" hreflang="{"zh-CN" if lang == "zh" else "en"}"{self.current(lang, self.lang, "true")}>{label}</a>' for lang, label in [('en', 'EN'), ('zh', '中文')])
        base = self.c['base_path']
        return f'''<!doctype html>
<html lang="{'zh-CN' if self.lang == 'zh' else 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#182f2e"><title>{h(self.c['title'])}</title><meta name="description" content="{h(self.c['description'])}">{self.c.get('head_extra', '')}<link rel="icon" type="image/svg+xml" href="{h(base)}assets/favicon.svg"><link rel="stylesheet" href="{h(base)}assets/site.css"><link rel="stylesheet" href="{h(base)}assets/vendor/katex/katex.min.css"></head>
<body class="page-{h(kind)}" data-language="{self.lang}" data-module="{h(current_module.get('id', ''))}"><a class="skip-link" href="#page-title">{self.t('Skip to content', '跳到主要内容')}</a><header class="site-header"><div class="header-inner"><a class="site-brand" href="{h(self.home)}" aria-label="Search, Recommendation & Ads Lab"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>SEARCH · REC · ADS<strong>Learning Lab</strong></span></a><nav class="primary-nav" aria-label="{self.t('Learning paths', '学习路线')}">{nav}</nav><div class="header-actions">{self.external(self.repo, 'GitHub', 'github-link')}<nav class="language-switch" aria-label="Language / 语言">{switch}</nav></div></div></header><main class="site-main">{body}</main><footer class="site-footer"><div><a class="footer-brand" href="{h(self.home)}">SEARCH · REC · ADS LAB</a><p>{self.t('Learn the mechanisms. Inspect the evidence. Run the experiments.', '理解机制，检查证据，亲手实验。')}</p></div><nav aria-label="{self.t('Project resources', '项目资源')}"><a href="{h(self.home)}#run-locally">{self.t('Run locally', '本地运行')}</a>{self.external(self.repo, 'GitHub')}{self.external(self.repo + '/blob/main/' + ('README.zh-CN.md' if self.lang == 'zh' else 'README.md'), 'README')}{self.external(self.repo + '/blob/main/LICENSE.md', self.t('License scope', '许可范围'))}</nav><p class="footer-legal">{self.t('Independent teaching material. Original courses, datasets and third-party code retain their own terms. No account or data download is needed to read.', '独立编写的教学资料。原始课程、数据集和第三方代码保留各自条款。阅读无需账号或下载数据。')}</p></footer><script defer src="{h(base)}assets/vendor/katex/katex.min.js"></script><script defer src="{h(base)}assets/vendor/katex/contrib/auto-render.min.js"></script><script defer src="{h(base)}assets/site.js"></script></body></html>'''


def render_html(kind, context):
    return Page(context).document(kind)
