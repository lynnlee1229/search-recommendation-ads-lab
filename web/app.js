/* Real experiment state is server-backed. Progress and language are local preferences. */
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr = (zh, en) => I18n.tr(zh, en);
const t = text => I18n.t(text);
const number = n => Number(n).toLocaleString(I18n.lang === 'en' ? 'en-US' : 'zh-CN');
const fmt = n => Number(n).toFixed(4);
const date = n => new Date(n).toISOString().slice(0,19).replace('T',' ') + ' UTC';
const table = (head, rows, className='') => `<div class="table-wrap ${className}"><table><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const repository = 'https://github.com/lynnlee1229/search-recommendation-ads-lab';
const progressKey = 'soutui-lab.learning.v1';
let learning, state, traceResult, featureResult, sampleResult, sourceCatalog=[], sourceDomain, researchResults=[], courseRequest=0;
let trainingActive=false;
let currentRoute = {module:'common',page:'start'};
function progress() { try { const saved=JSON.parse(localStorage.getItem(progressKey)||'{}'); return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{}; } catch (_) { return {}; } }
function notice(message='') { $('notice').textContent=message; }
async function api(path, options) {
  const response=await fetch(path, options);
  let body; try { body=await response.json(); } catch (_) { throw Error(tr('服务没有返回有效数据。','The service did not return valid data.')); }
  if (!response.ok) throw Error(typeof body.detail==='string' ? body.detail : JSON.stringify(body.detail || response.status));
  return body;
}
function applyRuntimeMode() {
  const preview=learning?.runtime?.can_execute===false;
  for(const id of ['search','ads','auction','trace','features','experiments']) {
    let note=$(id).querySelector('.preview-runtime-note');
    if(preview){
      if(!note){note=document.createElement('div');note.className='note preview-runtime-note';$(id).prepend(note);}
      note.innerHTML=`<strong>${tr('当前是轻量阅读模式','Lightweight reading mode')}</strong><p>${tr('实验工具需要完整 Python 环境与对应数据。先阅读课程，准备好后按 README 启动完整 Lab。','Experiment tools require the full Python environment and the corresponding data. Read the lessons first, then follow the README to start the full Lab.')}</p><a href="${repository}#quick-start" target="_blank" rel="noopener">${tr('查看准备步骤','Setup instructions')} ↗</a>`;
    }else if(note)note.remove();
  }
  if(preview)document.querySelectorAll('#search-form button,#ads-example,#ads-form button,#auction-form button,#recommend,#inspect,#samples,#train-button').forEach(button=>button.disabled=true);
}
function readUrl(item) { return `/learn/${encodeURIComponent(item.target)}?lang=${I18n.lang}`; }
function runUrl(item) { return item.run_url === null ? null : `/notebooks?target=${encodeURIComponent(item.target)}&lang=${I18n.lang}`; }
function moduleData(id=currentRoute.module) { return learning?.modules?.find(m=>m.id===id); }
function moduleTitle(id) { return moduleData(id)?.title || t(LAB_MODULES[id]?.title || id); }
function links(items) { return items.map(item=>`<a class="text-link" href="${esc(readUrl(item))}">${esc(item.title)} ↗</a>`).join(''); }
function renderRoute() {
  const previous=currentRoute;
  currentRoute=resolveRoute(location.hash);
  const config=LAB_MODULES[currentRoute.module], page=config.pages.find(p=>p[0]===currentRoute.page);
  const hash=`#${currentRoute.module}/${currentRoute.page}`;
  if (location.hash!==hash) history.replaceState(null,'',hash);
  document.querySelectorAll('#module-nav a').forEach(a=>{
    const active=a.dataset.route.split('/')[0]===currentRoute.module;
    a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  $('module-pages').innerHTML=config.pages.map(([id,label])=>`<a href="#${currentRoute.module}/${id}" data-route="${currentRoute.module}/${id}" ${id===currentRoute.page?'aria-current="page" class="active"':''}>${esc(t(label))}</a>`).join('');
  $('module-pages').setAttribute('aria-label',tr(`${moduleTitle()}模块内导航`,`${moduleTitle()} navigation`));
  $('breadcrumb').textContent=`${config.code} / ${t(page[1])}`;
  $('page-title').textContent=currentRoute.module==='common'&&currentRoute.page==='start'?tr('搜 · 广 · 推，从原理到实验','Search. Ads. Recommendations.'): `${moduleTitle()} · ${t(page[1])}`;
  $('page-desc').textContent=moduleData()?.description || t(config.description);
  document.querySelectorAll('.tab').forEach(panel=>panel.classList.toggle('active',panel.id===page[2]));
  $('research-domain-control').hidden=currentRoute.module!=='common';
  $('research-domain').value=currentRoute.module==='common'?'all':currentRoute.module;
  filterResearch(); notice();
  if(page[2]==='code') {
    if(previous.module!==currentRoute.module)$('course-query').value='';
    renderNotebookCatalog();
  }
  if(page[2]==='source')loadCode();
  if(page[2]==='course'||page[2]==='search-course'||page[2]==='ads-course')renderReferences();
  if(page[2]==='home')renderHome();
  const trainingReady=Boolean(state);
  $('recommend').disabled=!trainingReady; $('inspect').disabled=!trainingReady; $('samples').disabled=!trainingReady;
  $('train-button').disabled=!trainingReady || trainingActive || learning?.runtime?.can_execute===false;
  applyRuntimeMode();
  window.scrollTo({top:0,behavior:'auto'});
}
document.addEventListener('click',event=>{
  if(event.target.closest('.skip-link')){event.preventDefault();$('page-title').focus();return;}
  const language=event.target.closest('[data-language]');
  if(language){I18n.setLanguage(language.dataset.language);return;}
  const link=event.target.closest('a[data-route]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();const hash=`#${link.dataset.route}`;
  if(location.hash!==hash)history.pushState(null,'',hash);
  renderRoute();$('page-title').focus({preventScroll:true});
});
window.addEventListener('hashchange',renderRoute);
window.addEventListener('popstate',renderRoute);
window.addEventListener('storage',event=>{if(event.key===progressKey){renderNotebookCatalog();renderHome();}});

async function loadLearning() {
  const request=++courseRequest, lang=I18n.lang;
  try {
    const result=await api(`/api/learning?lang=${lang}`);
    if(request!==courseRequest)return;
    learning=result;
    renderRoute();
    $('catalog-status').textContent=tr(`${learning.lessons.length} 个实验章节 · 中英双语`,`${learning.lessons.length} experiment lessons · Chinese & English`);
  } catch(error) {
    if(request!==courseRequest)return;
    $('notebook-list').innerHTML=`<div class="empty" role="alert">${esc(tr('课程暂时无法读取。','The curriculum could not be loaded.'))} ${esc(error.message)} <button type="button" id="retry-learning">${tr('重试','Retry')}</button></div>`;
    $('retry-learning')?.addEventListener('click',loadLearning);
    notice(tr('课程加载失败：','Curriculum loading failed: ')+error.message);
  }
}
function renderHome() {
  const count=learning?.lessons?.length || 63;
  const finished=progress();
  const domainCopies={
    common:[tr('打好共同基础','Build the foundations'),tr('张量 → 梯度 → 优化 → 评估','Tensors → gradients → optimization → evaluation'),tr('从小数组看懂训练与评估。','See how training and evaluation work with small arrays.')],
    search:[tr('让查询找到答案','Connect queries to evidence'),tr('需求 → 查询处理 → 召回 → 排序','Needs → query processing → retrieval → ranking'),tr('理解相关性，比较 BM25、向量与 BERT。','Understand relevance; compare BM25, vectors and BERT.')],
    ads:[tr('连接价值与决策','Connect value to decisions'),tr('市场 → 候选 → 预测 → 投放反馈','Markets → candidates → prediction → feedback'),tr('从产品与拍卖出发，看懂 CTR、校准与预算。','Start with products and auctions; study CTR, calibration and budgets.')],
    recommendation:[tr('从行为到发现','Turn behavior into discovery'),tr('行为 → 召回 → 排序 → 实验','Behavior → retrieval → ranking → experiments'),tr('从 ItemCF 到双塔，再进入 XMRec 实践。','From ItemCF and two-tower retrieval to XMRec practice.')]
  };
  $('home').innerHTML=`<div class="hero"><div class="hero-copy"><span class="eyebrow">OPEN LEARNING · REPRODUCIBLE EXPERIMENTS</span><h2>${tr('把算法学成<br>可以解释的系统。','Understand the system.<br>Test every assumption.')}</h2><p>${tr('用同一套方法学习搜索、广告和推荐：沿权威公开资料建立知识地图，在短 Notebook 中验证机制，再回到真实数据检验判断。','Learn search, advertising and recommendation through one shared method: follow original sources, test mechanisms in short notebooks, then examine evidence from real data.')}</p><div class="hero-actions"><a class="button primary" href="/learn/common_31?lang=${I18n.lang}">${tr('从第一个实验开始','Start your first lesson')} <span aria-hidden="true">↗</span></a><a class="button secondary" href="#common/path" data-route="common/path">${tr('查看基础路线','Explore the foundation path')} →</a></div><p class="hero-footnote">${tr('先阅读，无需下载数据或启动训练。准备好后，在 Jupyter 中运行。','Read first, without downloading datasets or training models. Run in Jupyter when you are ready.')}</p></div><div class="learning-loop" aria-label="${tr('学习闭环','The learning loop')}"><div class="loop-top"><span>THE LEARNING LOOP</span><span>01—04</span></div>${[[tr('读原文','Read the source'),tr('找到概念的出处','Trace the idea to its origin')],[tr('做预测','Make a prediction'),tr('写下可检验的假设','State a testable hypothesis')],[tr('改一个变量','Change one variable'),tr('比较相同预算与输入','Compare equal budgets and inputs')],[tr('解释结果','Explain the result'),tr('保留错误，也保留负结果','Keep errors and negative results')]].map(([title,desc],i)=>`<div class="loop-step"><span class="loop-number">0${i+1}</span><div><strong>${title}</strong><span>${desc}</span></div><span aria-hidden="true">${i===3?'↺':'↓'}</span></div>`).join('')}</div></div>
  <div class="home-facts"><div><strong>${count}</strong><span>${tr('可阅读的实验章节','readable experiment lessons')}</span></div><div><strong>4</strong><span>${tr('相互衔接的学习模块','connected learning domains')}</span></div><div><strong>ZH / EN</strong><span>${tr('界面与原创学习内容','interface & original learning material')}</span></div><div><strong>${tr('证据可查','Traceable')}</strong><span>${tr('原文、代码与实验边界','sources, code and experiment limits')}</span></div></div>
  <div class="section-heading"><div><span class="eyebrow">CHOOSE A PATH</span><h2>${tr('先学共性，再走进一个领域','Start with what the domains share')}</h2></div><span class="muted">${tr('按知识组织，按问题学习','Organized by knowledge. Guided by questions.')}</span></div>
  <div class="path-map">${Object.keys(LAB_MODULES).map((id,i)=>{const lessons=learning?.lessons?.filter(l=>l.module===id)||[];const total=lessons.length||({common:4,search:19,ads:23,recommendation:17}[id]);const completed=lessons.filter(l=>finished[l.target]).length;const c=domainCopies[id];return `<a class="domain-path" href="#${id}/path" data-route="${id}/path"><div class="domain-path-top"><span class="path-index">0${i}</span><span>${moduleTitle(id)}</span><span aria-hidden="true">↗</span></div><h3>${c[0]}</h3><p>${c[2]}</p><div class="path-sequence">${c[1]}</div><div class="path-footer"><span>${tr(`${total} 章`,`${total} lessons`)}</span><span>${completed?tr(`已完成 ${completed} 章`,`${completed} completed`):tr('查看学习路线 →','Explore the path →')}</span></div></a>`;}).join('')}</div>
  <section class="source-promise"><div><span class="eyebrow">SOURCE → PRACTICE → EVIDENCE</span><h2>${tr('读得有依据，做得有边界','Original sources. Honest experiments.')}</h2><p>${tr('课程参考作者讲义、公开教材与原始论文；Lab 提供独立的教学实现。每章说明用的是哪一种证据，讲义版权和原始语言保持归原作者。','The curriculum references author lectures, open textbooks and original papers. The Lab provides independent teaching implementations. Every lesson identifies its evidence; original materials retain their authorship, rights and language.')}</p><div class="source-names"><a href="#search/references" data-route="search/references">${tr('搜索：王树森 · IIR · BERT','Search: Shusen Wang · IIR · BERT')}</a><a href="#ads/references" data-route="ads/references">${tr('广告：计算广告 · RTB','Ads: Computational Advertising · RTB')}</a><a href="#recommendation/references" data-route="recommendation/references">${tr('推荐：王树森 · XMRec','Recommendation: Shusen Wang · XMRec')}</a></div></div><div class="evidence-stack">${[[tr('真实数据实验','Real-data experiment'),tr('公开日志或语料；明确切分、预算和指标。','Public logs or corpora with explicit splits, budgets and metrics.')],[tr('构造机制练习','Constructed mechanism'),tr('小样本解释原理；不外推真实业务效果。','Small examples explain an idea; they do not establish business impact.')],[tr('独立模拟市场','Independent simulation'),tr('在已知假设下比较决策；收入始终标为模拟。','Compare decisions under stated assumptions; revenue remains simulated.')]].map(([title,desc])=>`<div><strong>${title}</strong><p>${desc}</p></div>`).join('')}</div></section>
  <div class="contribute-strip"><div><h2>${tr('让学习路径一起变得更好','Make the learning path better together')}</h2><p>${tr('发现解释不清、复现失败或课程缺口？带着章节与证据提出问题，也欢迎补充实验和翻译。','Found an unclear explanation, failed reproduction or missing topic? Open an issue with the lesson and evidence, or contribute an experiment or translation.')}</p></div><a class="button secondary" href="${repository}" target="_blank" rel="noopener">${tr('在 GitHub 查看与 Star','Explore & star on GitHub')} ↗</a></div>`;
}
function renderNotebookCatalog() {
  if(!learning){$('notebook-list-summary').textContent=tr('正在读取课程…','Loading lessons…');return;}
  const mod=moduleData(), query=$('course-query').value.trim().toLocaleLowerCase();
  const phases=mod?.phases || COURSE_PATHS[currentRoute.module];
  const chapters=phases.flatMap(p=>p.chapters);
  const catalog=learning.lessons.filter(l=>chapters.includes(Number(l.chapter)));
  const items=catalog.filter(l=>`${l.chapter} ${l.file} ${l.title} ${l.summary} ${l.mode} ${l.evidence}`.toLocaleLowerCase().includes(query));
  const done=progress();const completed=catalog.filter(l=>done[l.target]).length;
  $('path-intro').innerHTML=`<p>${esc(mod?.prerequisites || tr('先从公用基础31–34开始，或进入适合自己的阶段。','Start with foundations 31–34, or enter at the stage that fits your experience.'))}</p><div class="path-instructions"><span><strong>01</strong> ${tr('阅读与预测','Read & predict')}</span><span><strong>02</strong> ${tr('运行与改动','Run & change')}</span><span><strong>03</strong> ${tr('解释与记录','Explain & record')}</span></div>`;
  $('notebook-list-summary').textContent=tr(`${catalog.length} 章 · 显示 ${items.length} 章 · 已完成 ${completed} 章（本浏览器）`,`${catalog.length} lessons · ${items.length} shown · ${completed} completed (this browser)`);
  $('notebook-list').innerHTML=phases.map((phase,index)=>{
    const group=phase.chapters.flatMap(n=>items.filter(l=>Number(l.chapter)===n));if(!group.length)return '';
    return `<section class="learning-path"><div class="phase-heading"><span class="phase-index">${String(index+1).padStart(2,'0')}</span><div><h2>${esc(phase.title)}</h2><p>${esc(phase.description)}</p></div></div><div class="chapter-grid">${group.map(l=>`<article class="notebook-entry"><div class="chapter-meta"><span class="mono">${String(l.chapter).padStart(2,'0')}</span><span class="badge">${esc(l.evidence || l.mode || tr('教学实验','Teaching experiment'))}</span>${done[l.target]?`<span class="completion-mark">✓ ${tr('已完成','Completed')}</span>`:''}</div><h3><a href="${esc(readUrl(l))}">${esc(l.title)}</a></h3><p>${esc(l.summary || l.mode)}</p><div class="lesson-actions"><a class="read-link" href="${esc(readUrl(l))}">${tr('阅读课程','Read lesson')} →</a>${runUrl(l)&&learning.runtime?.can_execute!==false?`<a href="${esc(runUrl(l))}" target="_blank" rel="noopener">${tr('在 Jupyter 运行','Run in Jupyter')} ↗</a>`:`<span class="muted">${tr('阅读模式','Reading mode')}</span>`}</div></article>`).join('')}</div></section>`;
  }).join('')||`<div class="empty"><strong>${tr('没有匹配章节','No matching lessons')}</strong><p>${tr('试试算法名、章节编号，或清除筛选。','Try an algorithm, a lesson number, or clear the filter.')}</p><button id="clear-course-filter" type="button">${tr('清除筛选','Clear filter')}</button></div>`;
  $('clear-course-filter')?.addEventListener('click',()=>{$('course-query').value='';renderNotebookCatalog();$('course-query').focus();});
  $('path-runtime').textContent=learning.runtime?.can_execute===false?tr('当前为轻量阅读模式。运行实验需要完整环境；安装步骤见 README。','Lightweight reading mode. Running experiments requires the full environment; see the README.'):tr('阅读不启动内核；选择“在 Jupyter 运行”后才打开项目 Python 3.12 环境。','Reading does not start a kernel. Choose “Run in Jupyter” to open the project’s Python 3.12 environment.');
}
$('course-query').addEventListener('input',renderNotebookCatalog);
function referenceLinks(references=[]) {
  return references.map(ref=>`<a class="reference-link" href="${esc(ref.url)}" target="_blank" rel="noopener"><span>${esc(ref.title)}</span>${ref.locator?`<small>${esc(ref.locator)}</small>`:''}<span aria-hidden="true">↗</span></a>`).join('');
}
function renderReferences() {
  const id=currentRoute.module==='search'?'search-course-content':currentRoute.module==='ads'?'ads-course-content':'course-content';
  const mod=moduleData();if(!mod)return;
  $(id).innerHTML=`<div class="references-intro"><span class="eyebrow">ORIGINAL SOURCES · INDEPENDENT PRACTICE</span><h2>${tr('从原文到动手，每一步有出处','Connect every lesson to its source')}</h2><p>${esc(mod.boundary || mod.description)}</p><p class="muted">${tr('以下是原作者的资料与独立 Lab 练习之间的对应关系。中文原讲义保持中文；英文界面和教材不会改变原始来源。','These mappings connect original materials with independent Lab exercises. Chinese source lectures remain in Chinese; the English interface and lessons do not change the original sources.')}</p></div><div class="source-grid">${(mod.sources||[]).map(s=>`<article class="source-card"><div class="source-type">${esc(s.type || '')} <span>${esc(s.language || '')}</span></div><h3><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></h3><p>${esc(s.scope || '')}</p></article>`).join('')}</div><div class="section-heading"><h2>${tr('知识单元与配套实验','Learning units & companion experiments')}</h2><span class="muted">${tr('按课程知识组织','Organized by the curriculum')}</span></div><div class="reference-units">${(mod.units||[]).map(u=>{const lessons=(u.chapters||[]).flatMap(n=>learning.lessons.filter(l=>Number(l.chapter)===n));return `<section class="reference-unit"><div class="unit-main"><span class="mono unit-id">${esc(u.id)}</span><div><h3>${esc(u.title || u.topic)}</h3><p>${esc(u.objective || u.acceptance || '')}</p><div class="unit-lessons">${links(lessons)}</div><p class="unit-boundary"><strong>${esc(u.evidence || u.evidence_type || '')}</strong>${u.limitation?' · '+esc(u.limitation):''}</p></div></div><div class="unit-sources">${referenceLinks(u.references)}</div></section>`;}).join('')}</div>${mod.lectures?.length?`<details class="lecture-library"><summary>${tr('完整原始讲义入口','Original lecture library')} · ${mod.lectures.length}</summary><p class="muted">${tr('优先打开作者原文；已有本地文件时也可查看本地副本。','Open the author’s original material; local copies are also available when already downloaded.')}</p>${mod.lectures.map(l=>`<div class="lecture-item"><div><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)} ↗</a><p>${esc(l.locator || '')}${l.scope?' · '+esc(l.scope):''}</p></div>${l.local_url?`<a href="${esc(l.local_url)}" target="_blank" rel="noopener">${tr('本地讲义','Local copy')} ↗</a>`:''}</div>`).join('')}</details>`:''}`;
}
const sourceDescriptions={foundations:'Shared mathematical foundations',experiments:'Append-only experiment registry',probability:'Probability metrics and calibration',service:'Local workbench API',search:'SciFact retrieval and reranking',search_lessons:'Search teaching experiments',search_curriculum:'Query processing and search mechanisms',search_training:'TinyBERT teaching fine-tuning',ads:'Criteo response prediction',ads_teaching:'CTR teaching experiments',ads_curriculum:'Advertising products and market mechanisms',auction:'Independent auction simulator',data:'Data and causal sampling',models:'Two-tower network and loss',retrieval:'ItemCF, fusion and MMR',train:'Training loop',deep_recommendation:'Controlled recommendation experiments',xmrec_data:'XMRec official data',xmrec_memory:'XMRec ItemCF',xmrec_graph:'Sampling and LightGCN',xmrec_ranking:'LightGBM ranking',xmrec_experiment:'XMRec end-to-end experiment',xmrec_metrics:'XMRec evaluation'};
async function loadCode() {
  const requested=currentRoute.module;
  $('source-intro').textContent=tr(`这里展示${moduleTitle()}模块的源码；共享评估与记录服务收在公用模块。`,`Source for ${moduleTitle()}. Shared evaluation and recording infrastructure lives in Foundations.`);
  try {
    if(!sourceCatalog.length)sourceCatalog=(await api('/api/code')).files;
    if(requested!==currentRoute.module)return;
    const selector=$('source-module'), files=LAB_MODULES[requested].sources.flatMap(id=>sourceCatalog.filter(x=>x.id===id));
    const selected=selector.value;
    selector.innerHTML=files.map(x=>`<option value="${esc(x.id)}">${esc(x.path)} · ${esc(I18n.lang==='en'?sourceDescriptions[x.id]||x.id:x.description)}</option>`).join('');
    if(sourceDomain===requested&&files.some(x=>x.id===selected))selector.value=selected;
    sourceDomain=requested;
    if(!files.length){$('source-content').textContent=tr('暂无可查看源码。','No source files are available.');return;}
    const item=selector.value, result=await api(`/api/code/${item}`);
    if(requested!==currentRoute.module||item!==selector.value)return;
    $('source-caption').textContent=tr(`${result.path} · ${result.lines} 行 · 本页只读`,`${result.path} · ${result.lines} lines · read-only view`);
    $('source-content').innerHTML=`<ol>${result.source.split('\n').map(line=>`<li><code>${esc(line)||' '}</code></li>`).join('')}</ol>`;
    const target={search:'search_code',search_lessons:'search_lessons_code',ads:'ads_code',ads_curriculum:'ads_curriculum_code',models:'models',data:'sampling',retrieval:'retrieval',train:'training',service:'lab',xmrec_data:'xmrec_code_data',xmrec_memory:'xmrec_code_memory',xmrec_graph:'xmrec_code_graph',xmrec_ranking:'xmrec_code_ranking',xmrec_experiment:'xmrec_code_experiment',xmrec_metrics:'xmrec_code_metrics'}[item];
    $('edit-source').hidden=!target||learning?.runtime?.can_execute===false;
    if(target)$('edit-source').href=`/notebooks?target=${target}&lang=${I18n.lang}`;
  }catch(error){$('source-content').textContent=tr('源码读取失败：','Could not load source: ')+error.message;}
}
$('source-module').addEventListener('change',loadCode);
function chart(curve,field,title) {
  if(!curve?.length)return '';
  const w=660,h=210,p=42,vs=curve.map(r=>r[field]);let lo=Math.min(...vs),hi=Math.max(...vs);
  if(hi-lo<1e-8){lo-=.01;hi+=.01;}
  const x=i=>p+i/Math.max(curve.length-1,1)*(w-p-18),y=v=>h-p-(v-lo)/(hi-lo)*(h-p-22);
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><text x="${p}" y="16">${esc(title)}</text><line x1="${p}" y1="${h-p}" x2="${w-18}" y2="${h-p}" stroke="#a6bab0"/><text x="3" y="38">${hi.toFixed(3)}</text><text x="3" y="${h-p}">${lo.toFixed(3)}</text><polyline fill="none" stroke="#006e60" stroke-width="2" points="${vs.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"/>${vs.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#006e60"><title>epoch ${i+1}: ${v}</title></circle><text x="${x(i)}" y="${h-18}" text-anchor="middle">${i+1}</text>`).join('')}<text x="${w-50}" y="${h-2}">epoch</text></svg>`;
}
function metricsTable() {
  const rows=Object.entries(state.baselines.models).map(([name,r])=>[esc(name),fmt(r.metrics['recall@20']),fmt(r.metrics['ndcg@20']),fmt(r.metrics['recall@100']),fmt(r.metrics['catalog_coverage@20']),number(r.audit.evaluated_users)]);
  for(const r of state.runs){const m=r.validation.metrics;rows.push([`${esc(r.config.name)}<br><span class="mono">${esc(r.run_id)}</span>`,fmt(m['recall@20']),fmt(m['ndcg@20']),fmt(m['recall@100']),fmt(m['catalog_coverage@20']),number(r.validation.audit.evaluated_users)]);}
  return table([tr('模型 / 实验','Model / experiment'),'Recall@20','NDCG@20','Recall@100','Catalog coverage@20',tr('评估用户','Evaluated users')],rows,'metrics');
}
function drawOverview() {
  if(!state)return;
  const m=state.manifest,a=state.baselines.models.popular.audit;
  $('overview-content').innerHTML=`<div class="stats">${[[m.raw_events,tr('原始真实行为','Real logged events')],[m.cohort_users,tr('训练期选定用户','Training-period users')],[m.catalog_items,tr('训练商品词表','Training item vocabulary')],[state.runs.length,tr('已完成双塔实验','Completed two-tower runs')]].map(([v,l])=>`<div class="stat"><strong>${number(v)}</strong><span>${l}</span></div>`).join('')}</div><div class="section-head"><h2>${tr('同一口径下的验证集结果','Validation results under one protocol')}</h2><span>${tr('全词表检索 · 已看过滤 · 无采样候选','Full-vocabulary retrieval · seen-item filtering · no sampled candidates')}</span></div>${metricsTable()}<div class="columns"><div><h3>${tr('时间边界','Temporal boundaries')}</h3>${table([tr('区间','Partition'),tr('边界','Cutoff')],[[tr('训练结束','End of training'),date(m.train_end_ms)],[tr('验证结束','End of validation'),date(m.valid_end_ms)],[tr('数据结束','End of data'),date(m.end_ms)]])}<p class="muted">${tr('两次评估均使用训练截止时刻的冻结历史。验证集选模型，最终测试集留作一次验收。','Both evaluations use histories frozen at the training cutoff. Validation selects the model; the final test is reserved for acceptance.')}</p></div><div><h3>${tr('哪些目标没有进入分数？','Which targets are excluded?')}</h3>${table([tr('验证期统计','Validation statistic'),tr('数量','Count')],[[tr('可评估用户','Eligible users'),number(a.eligible_users)],[tr('实际评估用户','Evaluated users'),number(a.evaluated_users)],[tr('词表外目标','Out-of-vocabulary targets'),number(a.cold_oov_targets_excluded)],[tr('已看目标','Previously seen targets'),number(a.previously_seen_targets_excluded)]])}<p class="muted">${tr('指标仅描述所选活跃用户群的暖商品新交互，不能外推全站或冷启动。','These metrics describe new interactions with warm items for the selected active users. They do not generalize to the whole service or cold-start items.')}</p></div></div><div class="note"><strong>${tr('第一个问题：历史真的有用吗？','First question: does history help?')}</strong><p>${tr('在召回实验中固定用户和模型，对比正常输入与清空序列。用户ID向量仍然保留。','Fix the user and model in the retrieval lab. Compare normal inputs with an empty sequence. The user-ID vector remains.')}</p></div><h3>${tr('已实现与尚未接入','Implemented scope')}</h3><p>${tr('热门 / ItemCF / 双塔召回、已看过滤、RRF、MMR、样本检查已实现；粗排、精排、多目标和实时特征尚未接入。','Implemented: popularity, ItemCF and two-tower retrieval, seen-item filtering, RRF, MMR and sample inspection. Coarse/fine ranking, multi-objective models and real-time features are not integrated.')}</p><p class="muted"><a href="${esc(m.source_card)}" target="_blank" rel="noopener">Retailrocket ↗</a> · SHA-256 <span class="mono">${esc(m.archive_sha256)}</span></p>`;
}
function populate() {
  for(const id of ['trace-user','feature-user']){const old=$(id).value;$(id).innerHTML=state.users.map(u=>`<option value="${u.user_idx}">${tr('用户','User')} ${u.user_id} · ${u.distinct_items} ${tr('个商品','items')}</option>`).join('');if(old)$(id).value=old;}
  for(const id of ['trace-run','feature-run']){const old=$(id).value;$(id).innerHTML=state.runs.map(r=>`<option value="${esc(r.run_id)}">${esc(r.config.name)} · dim ${r.config.dim}</option>`).join('');$(id).value=state.runs.some(r=>r.run_id===old)?old:state.runs.at(-1)?.run_id||'';}
}
function unavailableExperiments() {
  const message=`<div class="empty"><h2>${tr('先阅读，再准备真实实验','Read first. Prepare real experiments when ready.')}</h2><p>${tr('本机尚未准备推荐数据与模型。课程与讲义仍可阅读；完整安装和领域训练步骤见 README。','Recommendation data and models are not prepared locally. Lessons and sources remain readable. See the README for full setup and domain training.')}</p><a href="${repository}#quick-start" target="_blank" rel="noopener">${tr('查看安装指南','Setup guide')} ↗</a></div>`;
  $('overview-content').innerHTML=message;$('experiment-results').innerHTML=message;
}
async function refresh() {
  try{state=await api('/api/summary');populate();drawOverview();drawExperiments();}
  catch(_){state=null;unavailableExperiments();}
  for(const id of ['recommend','inspect','samples'])$(id).disabled=!state;
  $('train-button').disabled=!state||trainingActive||learning?.runtime?.can_execute===false;
}
$('recommend').addEventListener('click',async()=>{
  const button=$('recommend');button.disabled=true;notice();
  try{traceResult=await api('/api/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_idx:Number($('trace-user').value),run_id:$('trace-run').value,channel:$('channel').value,candidate_budget:Number($('budget').value),mmr_lambda:Number($('lambda').value),history_override:$('clear-history').checked?[]:null})});drawTrace();}catch(error){notice(error.message);}finally{button.disabled=false;}
});
function drawTrace() {
  if(!traceResult)return;const r=traceResult,t=r.trace;$('trace-content').className='';
  $('trace-content').innerHTML=`<div class="flow">${[[t.catalog,tr('训练商品池','Training catalog')],[t.available_after_filter,tr('已看过滤后','After filtering')],[t.merged_pool,tr('召回候选','Retrieved candidates')],['—',tr('粗排 / 未接入','Coarse rank / absent')],['—',tr('精排 / 未接入','Fine rank / absent')],[t.returned,tr('融合 / MMR 输出','Fusion / MMR output')]].map(([v,l])=>`<div class="${v==='—'?'pending':''}"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><p class="muted">request <span class="mono">${esc(t.request_id)}</span> · ${t.latency_ms} ms · ${tr('特征截止','Feature cutoff')} ${date(t.snapshot_ms)} ${t.counterfactual?tr('· 反事实输入','· counterfactual input'):''}</p>${table([tr('位置','Rank'),tr('商品 / 类目','Item / category'),tr('来源与名次','Channel / rank'),'Two-tower cosine','ItemCF',tr('融合 / MMR','Fusion / MMR'),tr('检查','Inspect')],r.items.map(i=>[i.position,`${i.item_id}<br><span class="muted">category ${esc(i.category)}</span>`,Object.entries(i.channels).map(([c,n])=>`<span class="tag">${esc(c)} #${n}</span>`).join(''),fmt(i.scores.two_tower),fmt(i.scores.itemcf),`${fmt(i.fusion_score)} / ${fmt(i.rerank.mmr_score)}`,`<button class="detail-button" data-item="${i.item_idx}">${tr('展开','Details')}</button>`]))}<div id="item-detail"></div><details><summary>${tr('各通道原始候选','Raw candidates by channel')}</summary>${Object.entries(r.channel_candidates).map(([name,items])=>`<h3>${esc(name)}</h3>${table(['rank','item ID','item index','raw score'],items.map(i=>[i.rank,i.item_id,i.item_idx,fmt(i.score)]))}`).join('')}</details><p class="muted">${tr('RRF用1/(60+rank)融合；MMR依据候选池内归一化相关性和双塔相似度选取。不相加通道原始分数，未训练点击率排序器。','RRF fuses ranks using 1/(60+rank). MMR uses normalized relevance within the candidate pool and two-tower similarity. Raw channel scores are not added; no CTR ranker is trained.')}</p>`;
  document.querySelectorAll('.detail-button').forEach(b=>b.addEventListener('click',()=>showDetail(Number(b.dataset.item))));
}
function showDetail(id) {
  const i=traceResult.items.find(x=>x.item_idx===id);
  $('item-detail').innerHTML=`<div class="detail"><h3>${tr('商品','Item')} ${i.item_id} · index ${i.item_idx}</h3><p>${tr('双塔得分是归一化向量的点积，表示相似度而非点击概率。','The two-tower score is the dot product of normalized vectors: a similarity, not a click probability.')}</p><h4>${tr('ItemCF历史贡献','ItemCF history contributions')}</h4>${i.itemcf_evidence.length?table([tr('历史商品','History item'),tr('加权贡献','Weighted contribution')],i.itemcf_evidence.map(e=>[e.history_item_id,fmt(e.contribution)])):`<p>${tr('没有正的历史贡献，可能经其他通道或零分并列进入。','No positive history contribution; the item may come from another channel or a zero-score tie.')}</p>`}<p>MMR: ${tr('归一化相关性','normalized relevance')} ${fmt(i.rerank.relevance_normalized)}; ${tr('与已选商品最大相似度','maximum similarity to selected items')} ${fmt(i.rerank.max_similarity_to_selected)}.</p><h3>${tr('实际商品向量','Actual item vector')} (${i.vector.length})</h3><div class="vector">${i.vector.map((v,n)=>`<span title="dim ${n}">${v.toFixed(3)}</span>`).join('')}</div><p class="muted">${tr('类目仅供查看，未送入第一版双塔。','Categories are shown for inspection and are not inputs to this two-tower model.')}</p></div>`;
  $('item-detail').scrollIntoView({block:'nearest'});
}
$('inspect').addEventListener('click',async()=>{
  notice();try{featureResult=await api(`/api/users/${$('feature-user').value}/features?run_id=${encodeURIComponent($('feature-run').value)}`);drawFeatures();}catch(error){notice(error.message);}
});
function drawFeatures() {
  if(!featureResult)return;const f=featureResult;$('feature-content').className='';
  $('feature-content').innerHTML=`<div class="note"><strong>${tr('实际模型输入','Actual model inputs')}</strong><p>user index = ${f.user_idx}; ${tr('序列长度','history length')} ${f.model_inputs.history_item_indices.length}; padding = 0; masked mean pooling.</p><p class="mono">${f.model_inputs.history_item_indices.join(' → ')}</p><p class="muted">${tr('只含训练期事件。均值池化不能识别窗口内顺序。','Only training-period events are used. Mean pooling cannot distinguish order within the window.')}</p></div><div class="columns"><div><h3>${tr('最近输入商品','Recent input items')}</h3>${table(['item ID','index',tr('类目（仅查看）','Category (inspection only)')],f.history.map(i=>[i.item_id,i.item_idx,esc(i.category)]))}</div><div><h3>${tr('用户塔输出','User-tower output')}</h3><div class="vector">${f.user_vector.map(v=>`<span>${v.toFixed(3)}</span>`).join('')}</div><h3>${tr('辅助统计（非模型输入）','Auxiliary statistics (not model inputs)')}</h3><p>${f.metadata_not_model_inputs.training_event_count} ${tr('次行为','events')} / ${f.metadata_not_model_inputs.distinct_items} ${tr('个商品','items')}</p><p class="muted">${tr('特征版本','Feature version')} ${esc(f.feature_version)} · ${date(f.snapshot_ms)}</p></div></div><details open><summary>${tr('最近原始训练行为','Recent raw training events')}</summary>${table([tr('时间','Time'),tr('行为','Event'),'item ID','index'],f.events.map(e=>[date(e.timestamp),esc(e.event),e.item_id,e.item_idx]))}</details>`;
}
$('samples').addEventListener('click',async()=>{
  try{const run=$('feature-run').value;const [samples,diagnostics]=await Promise.all([api(`/api/runs/${run}/samples`),api(`/api/runs/${run}/diagnostics`)]);sampleResult={samples,diagnostics};drawSamples();}catch(error){notice(error.message);}
});
function drawSamples() {
  if(!sampleResult)return;const {samples:s,diagnostics:d}=sampleResult;
  $('sample-content').innerHTML=table([tr('用户','User'),tr('样本时间','Sample time'),tr('此前历史 (item index)','Prior history (item index)'),tr('正目标','Positive target')],s.samples.slice(0,20).map(x=>[x.user_id,date(x.event_time_ms),`<span class="mono">${x.history.join(', ')}</span>`,x.positive_item_idx]))+`<h3>${tr('8条真实样本组成的诊断批次','Diagnostic batch from 8 real samples')}</h3><p class="muted">${tr('教学重组批次，不是原训练Batch。行是用户，列是目标；对角线是正样本，×表示重复目标屏蔽。数值为softmax概率。','This teaching batch is regrouped from samples, not the original training batch. Rows are users; columns are targets. The diagonal marks positives; × masks duplicate targets. Values are softmax probabilities.')}</p><div class="table-wrap"><table class="matrix"><thead><tr><th>u / item</th>${d.targets.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${d.probabilities.map((row,i)=>`<tr><th>${d.users[i]}</th>${row.map((p,j)=>`<td class="${i===j?'diag':''}" title="logit=${d.logits[i][j]}; dL/dlogit=${d.gradients[i][j]}">${p===0?'×':p.toFixed(3)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>Cross-entropy loss = <code>${d.loss.toFixed(4)}</code>. τ=${d.temperature}; LogQ=${d.logq_correction}.</p><p class="muted">${tr('悬停单元格可查看logit与梯度。','Hover over a cell to inspect its logit and gradient.')}</p>`;
}
function drawExperiments() {
  if(!state)return;
  $('experiment-results').innerHTML=`<div class="section-head"><h2>${tr('验证集对比','Validation comparison')}</h2><span>${tr('选模型不读取测试集','Model selection does not read the test set')}</span></div>${metricsTable()}${state.runs.map(r=>`<details><summary>${esc(r.config.name)} · ${r.training_samples} ${tr('样本','samples')} · best epoch ${r.best_epoch} · ${r.elapsed_seconds}s</summary><p class="mono">${esc(JSON.stringify(r.config))}</p><div class="columns">${chart(r.curve,'loss',tr('训练 / sampled-softmax loss','Training / sampled-softmax loss'))}${chart(r.curve,'validation_ndcg@20',tr('验证 / NDCG@20','Validation / NDCG@20'))}</div><p>${tr('参数量','Parameters')} ${number(r.parameter_count)}</p><details><summary>${tr('原始实验范围说明','Original experiment scope (source language)')}</summary><p>${esc(r.reproduction_scope)}</p></details></details>`).join('')}`;
}
$('train-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=new FormData(event.target),body={};
  for(const [k,v]of form.entries())body[k]=k==='name'?v:Number(v);
  body.use_history=form.has('use_history');body.logq_correction=form.has('logq_correction');
  try{await api('/api/train',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});$('train-button').disabled=true;pollJob();}catch(error){notice(error.message);}
});
let previousJob='';
async function pollJob() {
  if(learning?.runtime?.can_execute===false)return;
  try{const j=await api('/api/job');if(j.state==='idle')return;const p=j.progress||{};
    $('job-status').textContent=`${j.state} · run ${j.run_id} · epoch ${p.epoch??0}${p.error?' · '+p.error:''}`;
    trainingActive=j.state==='running';$('train-button').disabled=trainingActive;
    if(j.state==='running')setTimeout(pollJob,3000);
    else if(previousJob!==j.run_id){previousJob=j.run_id;if(j.state==='complete'){await refresh();notice(tr('新实验已完成，模型和验证结果已保存。','The experiment finished. Its model and validation results were saved.'));}else notice(tr('训练失败，请查看对应本地日志。','Training failed. Inspect the corresponding local log.'));}
  }catch(error){notice(error.message);}
}
async function drawResearch() {
  $('research-results').textContent=tr('正在读取实验…','Loading experiments…');
  try{
    const {experiments}=await api('/api/experiments');
    const selected=experiments.filter(r=>r.state==='completed'&&!r.annotation?.superseded).reverse();
    researchResults=await Promise.all(selected.map(async run=>({run,result:await api(`/api/experiments/${encodeURIComponent(run.domain)}/${encodeURIComponent(run.run_id)}`)})));
    renderResearch();
  }catch(error){$('research-results').innerHTML=`<div class="empty"><strong>${tr('本地实验记录尚未就绪','Local experiment records are not ready')}</strong><p>${tr('完成对应领域的准备与训练后刷新；阅读课程不需要这些产物。','Prepare and train the corresponding domain, then refresh. Reading lessons does not require these artifacts.')}</p><details><summary>${tr('服务信息','Service details')}</summary><p>${esc(error.message)}</p></details></div>`;}
}
function renderResearch() {
  $('research-results').innerHTML=researchResults.map(({run,result:r})=>{
    let body='';const workshop=r.kind==='workshop';
    if(run.domain==='recommendation'){
      body=table([tr('编码器','Encoder'),tr('负采样','Sampler'),'seed','NDCG@20','Recall@20',tr('打乱历史NDCG','Shuffled-history NDCG'),tr('覆盖率','Coverage'),tr('训练秒','Train seconds')],r.rows.map(x=>[esc(x.encoder),esc(x.sampler),x.seed,fmt(x['ndcg@20']),fmt(x['recall@20']),fmt(x.shuffled['ndcg@20']),fmt(x['coverage@20']),x.seconds.toFixed(1)]));
      body+=`<p>${tr('短训练、有限样本与不同参数量，不能推断结构的普遍优劣。loss不是点击概率，也不跨采样策略比较绝对值。','Short training, limited samples and different parameter counts do not establish a universally better architecture. Loss is not a click probability; its absolute value is not comparable across sampling policies.')}</p>`;
    }
    if(run.domain==='search'&&!workshop){
      body=table([tr('方法','Method'),'NDCG@10','MRR@10','Recall@10','Recall@100','P50 ms','P95 ms'],r.rows.map(x=>[esc(x.method),fmt(x['ndcg@10']),fmt(x['mrr@10']),fmt(x['recall@10']),fmt(x['recall@100']),x.latency_p50_ms.toFixed(1),x.latency_p95_ms.toFixed(1)]));
      body+=`<p>${tr('重排候选Recall@20','Reranker candidate Recall@20')}: ${fmt(r['rerank_candidate_recall@20'])}. ${tr('未判断文档按不相关计分。延迟包含编码与重排，不含离线建索引。','Unjudged documents are scored as nonrelevant. Latency includes query encoding and reranking, not offline indexing.')}</p>`;
      body+=table([tr('失败查询ID','Failure query ID'),'BM25 NDCG','TinyBERT NDCG'],r.failures.slice(0,5).map(x=>[esc(x.qid),fmt(x.metrics.bm25['ndcg@10']),fmt(x.metrics.tinybert_rerank['ndcg@10'])]));
    }
    if(run.domain==='search'&&workshop){
      body=table([tr('教学方法','Teaching method'),'select NDCG@10','select MRR@10','select Recall@10',tr('维度','Dimensions'),tr('拟合秒','Fit seconds')],r.rows.map(x=>[esc(x.method),fmt(x.select['ndcg@10']),fmt(x.select['mrr@10']),fmt(x.select['recall@10']),x.features??'—',Number.isFinite(x.fit_seconds)?x.fit_seconds.toFixed(3):'—']));
      body+=`<p>${tr('遵循记录中的query分组与训练预算，仅报告select，不替换正式服务。','Uses the query groups and training budget in the record. Only select scores are reported; the formal service is unchanged.')}</p>`;
    }
    if(run.domain==='ads'&&workshop){
      body=table([tr('教学方法','Teaching method'),'select AUC','select log loss',tr('字段 / 特征','Fields / features'),tr('参数量','Parameters'),tr('拟合秒','Fit seconds')],r.rows.map(x=>[esc(x.method),fmt(x.select.auc),fmt(x.select.logloss),x.features,x.parameters??'—',x.fit_seconds.toFixed(2)]));
      body+=`<p>${tr('小前缀教学训练，仅报告select；不替换200k正式实验，不混比audit。','Small-prefix teaching runs report select scores only. They do not replace the formal 200k experiment or mix select with audit scores.')}</p>`;
    }
    if(run.domain==='ads'&&!workshop){
      body=table([tr('方法','Method'),'audit AUC','log loss','Brier','ECE (10 bins)',tr('拟合秒','Fit seconds')],r.rows.map(x=>[esc(x.method),fmt(x.audit.auc),fmt(x.audit.logloss),fmt(x.audit.brier),fmt(x.audit.ece),x.fit_seconds.toFixed(2)]));
      body+=`<p>${tr('树家族按select logloss选定','Tree family selected by select log loss')}: ${esc(r.selected_base)}. ${tr('校准独立拟合，audit不参与选型。公开正负抽样比例未知，概率不是线上CTR。','Calibration is fitted separately; audit does not select models. The positive/negative sampling ratio is unknown, so probabilities are not online CTR.')}</p>`;
      body+=table([tr('审计分段','Audit segment'),tr('曝光数','Impressions'),tr('点击率','Click rate'),'raw log loss','sigmoid log loss'],r.segments.map(x=>[esc(x.segment),x.raw.n,fmt(x.raw.click_rate),fmt(x.raw.logloss),fmt(x.sigmoid.logloss)]));
      body+=`<p>${tr('以下为独立模拟市场，每广告主预算60；收入、价值与货币均为模拟。','The following is an independent simulated market with budget 60 per advertiser. All revenue, value and money are simulated.')}</p>`;
      body+=table([tr('模拟策略','Simulated strategy'),'seed',tr('模拟收入','Simulated revenue'),tr('期望点击价值','Expected click value'),tr('期望盈余','Expected surplus'),tr('预算约束','Budget constraint')],r.simulations.map(x=>[esc(x.name),x.seed,x.spend.toFixed(2),x.expected_click_value.toFixed(2),x.expected_advertiser_surplus.toFixed(2),x.budget_ok?tr('通过','Pass'):tr('失败','Fail')]));
    }
    return `<details data-domain="${esc(run.domain)}"><summary>${moduleTitle(run.domain)} · ${workshop?tr('教学 select','Teaching select'):tr('正式实验','Formal experiment')} · ${esc(run.run_id)}</summary>${body}${r.scope?`<details><summary>${tr('原始实验说明','Original run note (source language)')}</summary><p>${esc(r.scope)}</p></details>`:''}<p><a href="/api/experiments/${encodeURIComponent(run.domain)}/${encodeURIComponent(run.run_id)}" target="_blank" rel="noopener">${tr('完整实验记录 JSON','Full experiment record JSON')} ↗</a></p></details>`;
  }).join('')+`<p id="research-empty" class="empty" hidden>${tr('当前领域暂无完成实验；运行对应项目命令后刷新。','No completed experiments in this domain. Run the corresponding project command, then refresh.')}</p>`;
  filterResearch();
}
function filterResearch() {
  const domain=$('research-domain').value;let visible=0;
  document.querySelectorAll('#research-results > details').forEach(p=>{p.hidden=domain!=='all'&&p.dataset.domain!==domain;if(!p.hidden)visible++;});
  if($('research-empty'))$('research-empty').hidden=visible>0;
}
$('research-domain').addEventListener('change',filterResearch);
$('research-refresh').addEventListener('click',drawResearch);
let searchResult, adsPrediction, auctionResult;
function drawSearch() {
  if(!searchResult)return;const r=searchResult;
  $('search-output').innerHTML=`<p>${esc(r.method)} · ${r.latency_ms.toFixed(1)} ms · ${tr('分数用于排序，不表示声明成立概率。','Scores rank documents; they do not estimate the probability that a claim is true.')}</p>`+r.items.map(x=>`<details><summary>${esc(x.document_id)} · ${esc(x.title)}</summary><p>${esc(x.text)}</p><p>score: ${fmt(x.score)}</p></details>`).join('');
}
$('search-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.submitter;button.disabled=true;$('search-output').textContent=tr('正在检索；首次请求会加载本机模型…','Retrieving; the first request loads the local model…');
  try{searchResult=await api('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:$('search-query').value,method:$('search-method').value,limit:5})});drawSearch();}catch(error){$('search-output').textContent=tr('检索失败，请先准备搜索数据与模型：','Retrieval failed. Prepare the search data and model first: ')+error.message;}finally{button.disabled=false;}
});
$('ads-example').addEventListener('click',async()=>{try{$('ads-input').value=JSON.stringify(await api('/api/ads/example'),null,2);}catch(error){$('ads-output').textContent=tr('样本读取失败：','Could not load a sample: ')+error.message;}});
function drawAdsPrediction(){if(!adsPrediction)return;const r=adsPrediction;$('ads-output').innerHTML=table([tr('基模型','Base model'),tr('原始概率','Raw probability'),'sigmoid','isotonic'],[[esc(r.base),fmt(r.raw),fmt(r.sigmoid),fmt(r.isotonic)]])+`<p>${tr('仅针对公开样本分布。匿名特征含义未知，修改不表示因果效果。','Probabilities apply only to the public sample distribution. Anonymous feature meanings are unknown; edits do not estimate causal effects.')}</p>`;}
$('ads-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;$('ads-output').textContent=tr('正在计算…','Computing…');try{const input=JSON.parse($('ads-input').value);adsPrediction=await api('/api/ads/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});drawAdsPrediction();}catch(error){$('ads-output').textContent=tr('计算失败，检查输入与本机模型：','Computation failed. Check the input and local model: ')+error.message;}finally{button.disabled=false;}});
function drawAuction(){if(!auctionResult)return;const r=auctionResult;$('auction-output').innerHTML=table([tr('模拟收入','Simulated revenue'),tr('期望点击价值','Expected click value'),tr('模拟点击','Simulated clicks'),tr('预算约束','Budget constraint')],[[r.spend.toFixed(2),r.expected_click_value.toFixed(2),r.clicks,r.budget_ok?tr('通过','Pass'):tr('失败','Fail')]])+table([tr('模拟广告主','Simulated advertiser'),tr('花费','Spend'),tr('赢得曝光','Won impressions'),tr('点击','Clicks')],r.advertisers.map((a,i)=>[i+1,a.spend.toFixed(2),a.wins,a.clicks]));}
$('auction-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;$('auction-output').textContent=tr('正在计算…','Computing…');try{auctionResult=await api('/api/ads/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:$('auction-strategy').value,budget:Number($('auction-budget').value),multiplier:Number($('auction-multiplier').value),paced:$('auction-paced').checked,seed:42})});drawAuction();}catch(error){$('auction-output').textContent=tr('模拟失败：','Simulation failed: ')+error.message;}finally{button.disabled=false;}});
function updateLanguageLinks(){document.querySelectorAll('a[data-lesson-target]').forEach(a=>a.href=`/learn/${encodeURIComponent(a.dataset.lessonTarget)}?lang=${I18n.lang}`);}
window.addEventListener('lab:language',()=>{
  learning=null;sourceDomain=null;notice();I18n.apply();renderRoute();loadLearning();updateLanguageLinks();
  if(state){populate();drawOverview();drawExperiments();}else unavailableExperiments();
  drawTrace();drawFeatures();drawSamples();drawSearch();drawAdsPrediction();drawAuction();renderResearch();
});
document.querySelectorAll('#search-output,#ads-output,#auction-output').forEach(x=>{x.setAttribute('role','status');x.setAttribute('aria-live','polite');});
I18n.capture(document.body);
if(I18n.lang==='en')document.querySelector('[name=name]').value='My history-length experiment';
updateLanguageLinks();renderRoute();
loadLearning();refresh().then(()=>{if(state)pollJob();});drawResearch();
