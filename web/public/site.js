/* Progressive enhancements only. Courses, sources and language links work without JS. */
(function () {
  'use strict';
  const zh = document.documentElement.lang.startsWith('zh');
  const tr = (en, cn) => zh ? cn : en;
  const progressKey = 'sra-public-progress-v1';
  let progress = {};
  try {
    const stored = JSON.parse(localStorage.getItem(progressKey) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) progress = stored;
  } catch (_) { /* Reading remains available when storage is restricted. */ }

  const cards = [...document.querySelectorAll('[data-lesson-card]')];
  for (const card of cards) {
    const mark = card.querySelector('.completed-label');
    if (mark) mark.hidden = !progress[card.dataset.target];
  }

  const filter = document.getElementById('lesson-filter');
  if (filter) {
    filter.closest('.filter-box').hidden = false;
    const update = () => {
      const query = filter.value.trim().toLocaleLowerCase();
      let count = 0;
      for (const card of cards) {
        card.hidden = !card.dataset.search.toLocaleLowerCase().includes(query);
        if (!card.hidden) count++;
      }
      document.querySelectorAll('[data-phase]').forEach(phase => {
        phase.hidden = ![...phase.querySelectorAll('[data-lesson-card]')].some(card => !card.hidden);
      });
      document.getElementById('filter-status').textContent = tr(`${count} of ${cards.length} lessons`, `${count} / ${cards.length} 章`);
      document.querySelector('.filter-empty').hidden = count > 0;
    };
    filter.addEventListener('input', update);
    update();
  }

  const complete = document.getElementById('mark-complete');
  if (complete) {
    complete.hidden = false;
    const status = document.querySelector('.progress-status');
    const update = () => {
      const marked = !!progress[complete.dataset.target];
      complete.setAttribute('aria-pressed', String(marked));
      complete.textContent = marked ? tr('Completed · undo', '已学 · 撤销') : tr('Mark complete', '标记为已学');
    };
    complete.addEventListener('click', () => {
      const target = complete.dataset.target;
      const wasComplete = !!progress[target];
      if (wasComplete) delete progress[target];
      else progress[target] = true;
      try {
        localStorage.setItem(progressKey, JSON.stringify(progress));
        status.textContent = wasComplete ? tr('Completion mark removed.', '已撤销学习标记。') : tr('Saved in this browser only.', '仅保存在当前浏览器。');
      } catch (_) {
        status.textContent = tr('Browser storage is unavailable. This mark lasts only until you leave the page.', '浏览器存储不可用，此标记仅在当前页面有效。');
      }
      update();
    });
    update();
  }

  document.querySelectorAll('[data-copy-code]').forEach(button => {
    const code = document.getElementById(button.dataset.copyCode);
    if (!code || !navigator.clipboard?.writeText) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      const before = button.textContent;
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = tr('Copied', '已复制');
      } catch (_) {
        button.textContent = tr('Select code to copy', '请选中代码复制');
      }
      setTimeout(() => { button.textContent = before; }, 1800);
    });
  });

  if (typeof renderMathInElement === 'function') {
    const content = document.querySelector('.lesson-content');
    if (content) renderMathInElement(content, {
      delimiters: [{left: '$$', right: '$$', display: true}, {left: '\\[', right: '\\]', display: true}, {left: '\\(', right: '\\)', display: false}],
      throwOnError: false,
      trust: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
    });
  }
})();
