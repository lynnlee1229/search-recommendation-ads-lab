/* A non-executing notebook reader. Markdown is sanitized; outputs never run code. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const tr = (zh,en) => I18n.tr(zh,en);
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const repository='https://github.com/lynnlee1229/search-recommendation-ads-lab';
  const progressKey='soutui-lab.learning.v1';
  const target=decodeURIComponent(location.pathname.split('/').filter(Boolean).at(-1)||'');
  let lesson, generation=0;
  const sourceText = source => Array.isArray(source)?source.join(''):String(source??'');
  function readProgress(){try{const saved=JSON.parse(localStorage.getItem(progressKey)||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch(_){return {};}}
  function saveProgress(value){try{localStorage.setItem(progressKey,JSON.stringify(value));return true;}catch(_){$('reader-status').textContent=tr('浏览器未允许保存进度；仍可继续阅读。','Your browser could not save progress. You can continue reading.');return false;}}
  function updateProgress(){const done=Boolean(readProgress()[target]);$('complete-lesson').textContent=done?tr('✓ 已完成 · 点击撤销','✓ Complete · click to undo'):tr('标记本章已完成','Mark this lesson complete');$('complete-lesson').setAttribute('aria-pressed',String(done));}
  function safeMarkdown(source){return LabMarkdown.render(source);}
  function fixLinks(container) {
    container.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href');
      try { a.href=ReaderUtils.lessonLink(href,lesson,I18n.lang); } catch (_) { a.removeAttribute('href'); }
      if(a.origin!==location.origin){a.target='_blank';a.rel='noopener noreferrer';}
    });
    container.querySelectorAll('img').forEach(img=>{img.loading='lazy';img.alt=img.alt||tr('课程插图','Lesson illustration');});
  }
  function dataframeOutput(output) {
    const html=sourceText(output.data?.['text/html']||'');
    if(!ReaderUtils.isPandasTableCandidate(html))return null;
    const clean=DOMPurify.sanitize(html,{
      ALLOWED_TAGS:['table','caption','thead','tbody','tr','th','td'],
      ALLOWED_ATTR:['colspan','rowspan','scope'],
      ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,
      FORBID_TAGS:['style','script','iframe'],FORBID_ATTR:['style']
    });
    const wrapper=document.createElement('div');wrapper.innerHTML=clean;
    const table=wrapper.querySelector('table');
    if(!table||wrapper.querySelectorAll('table').length!==1)return null;
    if([...wrapper.childNodes].some(node=>node!==table&&node.textContent.trim()))return null;
    wrapper.className='table-wrap saved-dataframe';
    return wrapper;
  }
  function textOutput(output) {
    if(output.output_type==='stream')return sourceText(output.text);
    if(output.output_type==='error')return `${output.ename||'Error'}: ${output.evalue||''}\n${(output.traceback||[]).join('\n').replace(/\x1b\[[0-9;]*m/g,'')}`;
    if(output.data?.['text/plain'])return sourceText(output.data['text/plain']);
    if(output.data?.['text/markdown'])return sourceText(output.data['text/markdown']);
    return '';
  }
  function renderCells(cells) {
    const body=$('lesson-content');body.replaceChildren();let codeNumber=0;
    for(const cell of cells) {
      if(cell.cell_type==='markdown'){
        const section=document.createElement('section');section.className='markdown-cell';section.innerHTML=safeMarkdown(sourceText(cell.source));fixLinks(section);body.append(section);
      }else if(cell.cell_type==='code'){
        const section=document.createElement('section');section.className='code-cell';
        const label=document.createElement('div');label.className='cell-label';
        const name=document.createElement('span');name.textContent=`PYTHON · ${String(++codeNumber).padStart(2,'0')}`;
        const copy=document.createElement('button');copy.type='button';copy.className='copy-code';copy.textContent=tr('复制代码','Copy code');
        copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(sourceText(cell.source));copy.textContent=tr('已复制','Copied');setTimeout(()=>copy.textContent=tr('复制代码','Copy code'),1600);}catch(_){copy.textContent=tr('请选择代码复制','Select the code to copy');}});
        label.append(name,copy);section.append(label);
        const pre=document.createElement('pre'),code=document.createElement('code');code.textContent=sourceText(cell.source);pre.append(code);section.append(pre);
        const outputs=cell.outputs||[];
        if(outputs.some(output=>textOutput(output)||output.data?.['text/html']||output.data?.['image/png'])){
          const details=document.createElement('details');details.className='cell-output';details.open=true;
          const summary=document.createElement('summary');summary.textContent=tr('Notebook 保存的输出 · 本页未执行','Saved notebook output · not executed on this page');details.append(summary);
          for(const output of outputs){
            const frame=dataframeOutput(output),text=textOutput(output);
            if(frame)details.append(frame);
            else if(text){const result=document.createElement('pre');result.textContent=text;details.append(result);}
            else if(output.data?.['text/html']){const result=document.createElement('pre');result.textContent=sourceText(output.data['text/html']);details.append(result);}
            const data=sourceText(output.data?.['image/png']||'');
            if(data&&/^[A-Za-z0-9+/=\s]+$/.test(data)){
              const image=document.createElement('img');image.src='data:image/png;base64,'+data.replace(/\s/g,'');image.alt=tr('Notebook 保存的图表','Saved notebook figure');image.loading='lazy';details.append(image);
            }
          }
          section.append(details);
        }
        body.append(section);
      }else if(cell.cell_type==='raw'){
        const pre=document.createElement('pre');pre.className='raw-cell';pre.textContent=sourceText(cell.source);body.append(pre);
      }
    }
    const firstHeading=body.querySelector('.markdown-cell:first-child h1');
    if(firstHeading && firstHeading.textContent.trim()===lesson.title.trim())firstHeading.remove();
    const headings=[...body.querySelectorAll('.markdown-cell h1,.markdown-cell h2,.markdown-cell h3')];
    $('lesson-toc').innerHTML=headings.map((heading,i)=>{heading.id=`section-${i+1}`;return `<a href="#${heading.id}" class="toc-${heading.tagName.toLowerCase()}">${esc(heading.textContent)}</a>`;}).join('');
    if(typeof window.renderMathInElement==='function')window.renderMathInElement(body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}],throwOnError:false,trust:false});
    if(location.hash){const anchor=document.getElementById(location.hash.slice(1));anchor?.scrollIntoView();}
  }
  function localizedChrome() {
    $('contents-title').textContent=tr('本章目录','On this page');
    $('reader-method').innerHTML=`<span class="eyebrow">LEARN BY DOING</span><ol><li>${tr('先预测结果','Predict the result')}</li><li>${tr('只改一个变量','Change one variable')}</li><li>${tr('运行并检查输出','Run and inspect')}</li><li>${tr('解释，包括负结果','Explain, including negative results')}</li></ol>`;
    $('progress-note').textContent=tr('学习进度只保存在此浏览器。打开页面不会自动标记完成；无需登录，也不会上传你的进度。','Progress stays in this browser. Opening a lesson never marks it complete. No login is needed, and progress is not uploaded.');
    $('reset-progress').textContent=tr('重置本机学习进度','Reset this browser’s progress');
    $('reader-copyright').textContent=tr('Lab 提供独立教学实现。引用的讲义与论文仍归原作者；原始实验数据、代码和已有输出保持原貌。','The Lab provides independent teaching implementations. Referenced lectures and papers remain their authors’ work. Original data, code and saved outputs are preserved.');
    $('lesson-toc').setAttribute('aria-label',tr('本章目录','Lesson contents'));
    $('lesson-content').setAttribute('aria-label',tr('课程内容','Lesson content'));
    $('lesson-navigation').setAttribute('aria-label',tr('上一章与下一章','Previous and next lessons'));
  }
  async function loadLesson() {
    const request=++generation;localizedChrome();$('reader-status').textContent=tr('正在读取课程…','Loading the lesson…');
    try{
      const response=await fetch(`/api/lessons/${encodeURIComponent(target)}?lang=${I18n.lang}`);
      const data=await response.json();if(!response.ok)throw Error(data.detail||response.status);
      if(request!==generation)return;lesson=data;
      const domain=typeof lesson.module==='string'?lesson.module:lesson.module.id;
      const domainName=lesson.module_title||({common:tr('公用基础','Foundations'),search:tr('搜索','Search'),ads:tr('广告','Advertising'),recommendation:tr('推荐','Recommendation')}[domain]||domain);
      $('reader-breadcrumb').innerHTML=`<a href="/?lang=${I18n.lang}#common/start">Lab</a><span>/</span><a href="/?lang=${I18n.lang}#${esc(domain)}/path">${esc(domainName)}</a><span>/</span><span>${tr('章节','Lesson')} ${String(lesson.chapter).padStart(2,'0')}</span>`;
      $('lesson-kicker').textContent=`${domain.toUpperCase()} · ${tr('实验章节','NOTEBOOK LESSON')} ${String(lesson.chapter).padStart(2,'0')}`;
      $('lesson-title').textContent=lesson.title;document.title=`${lesson.title} · Learning Lab`;
      $('lesson-summary').textContent=lesson.summary||lesson.evidence||'';
      $('run-lesson').hidden=!lesson.run_url;if(lesson.run_url)$('run-lesson').href=lesson.run_url;
      $('run-lesson').textContent=tr('在 Jupyter 中运行','Run in Jupyter')+' ↗';
      $('execution-note').textContent=lesson.run_url?tr('这是只读课程。运行按钮会打开本机 Jupyter；有些代码格会训练模型，请先阅读本章预算与前提。','This is a read-only lesson. Run opens local Jupyter; some cells train models, so read the prerequisites and budget first.'):tr('当前为轻量阅读模式，无需训练或下载数据。要运行代码，请按 README 配置完整环境。','Lightweight reading mode: no training or data download is required. To run the code, set up the full environment using the README.');
      const file=lesson.file || lesson.path;
      $('lesson-file').href=lesson.source_url || lesson.github_url || (file?`${repository}/blob/main/${file.startsWith('notebooks/')?file:'notebooks/'+(I18n.lang==='en'?'en/':'')+file}`:`${repository}/tree/main/notebooks`);
      $('complete-lesson').disabled=false;updateProgress();renderCells(lesson.cells||[]);
      $('lesson-references').innerHTML=(lesson.references||[]).length?`<span class="eyebrow">GO TO THE SOURCE</span><h2>${tr('回到原始资料','Return to the original sources')}</h2><div class="reader-source-grid">${lesson.references.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener"><strong>${esc(r.title)} ↗</strong><span>${esc(r.locator||'')}</span><small>${esc([r.type,r.language].filter(Boolean).join(' · '))}</small></a>`).join('')}</div>`:'';
      $('lesson-navigation').innerHTML=[['previous',tr('上一章','Previous lesson'),'←'],['next',tr('下一章','Next lesson'),'→']].map(([key,label,arrow])=>{const item=lesson[key];return item?`<a class="lesson-${key}" href="${esc(item.read_url||`/learn/${item.target}?lang=${I18n.lang}`)}"><span>${arrow} ${label}</span><strong>${esc(item.title)}</strong></a>`:'<span></span>';}).join('');
      $('reader-status').textContent='';
    }catch(error){if(request!==generation)return;$('lesson-title').textContent=tr('这章暂时无法读取','This lesson could not be loaded');$('reader-status').innerHTML=`<p role="alert">${esc(error.message)}</p><button type="button" id="retry-lesson">${tr('重新加载','Retry')}</button> <a href="/?lang=${I18n.lang}#common/start">${tr('返回学习路线','Back to learning paths')}</a>`;$('retry-lesson').addEventListener('click',loadLesson);}
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(button)I18n.setLanguage(button.dataset.language);});
  $('complete-lesson').addEventListener('click',()=>{const done=readProgress();if(done[target])delete done[target];else done[target]=new Date().toISOString();if(saveProgress(done))updateProgress();});
  $('reset-progress').addEventListener('click',()=>{if(confirm(tr('清除这个浏览器中所有章节的完成标记？此操作不会修改 Notebook。','Clear completion marks for all lessons in this browser? This does not change any notebooks.'))){if(saveProgress({}))updateProgress();}});
  window.addEventListener('lab:language',loadLesson);
  window.addEventListener('storage',event=>{if(event.key===progressKey)updateProgress();});
  I18n.capture(document.body);loadLesson();
})();
