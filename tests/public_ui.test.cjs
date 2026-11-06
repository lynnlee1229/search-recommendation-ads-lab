const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element(extra = {}) {
  return Object.assign({
    hidden: false, textContent: '', value: '', dataset: {}, attributes: {}, listeners: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
  }, extra);
}
function runtime({lang = 'en', blocked = false, saved = {}, cards = [], phases = [], filter, complete, copy = []} = {}) {
  const storage = new Map(Object.entries(saved)), status = element(), filterStatus = element(), empty = element();
  const ids = {'lesson-filter': filter, 'filter-status': filterStatus, 'mark-complete': complete};
  for (const button of copy) ids[button.dataset.copyCode] = button.code;
  const clipboard = [];
  const document = {
    documentElement: {lang},
    getElementById(id) { return ids[id] || null; },
    querySelector(selector) { return selector === '.progress-status' ? status : selector === '.filter-empty' ? empty : null; },
    querySelectorAll(selector) { return ({'[data-lesson-card]': cards, '[data-phase]': phases, '[data-copy-code]': copy})[selector] || []; },
  };
  const context = vm.createContext({document, setTimeout: () => {},
    navigator: {language: 'zh-CN', clipboard: {async writeText(text) { clipboard.push(text); }}},
    localStorage: {getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key); }, setItem(key, value) { if (blocked) throw Error('blocked'); storage.set(key, value); }},
  });
  vm.runInContext(fs.readFileSync('web/public/site.js', 'utf8'), context);
  return {document, storage, status, filterStatus, empty, clipboard};
}

test('public English pages remain English despite browser or old local-Lab preferences', () => {
  const r = runtime({saved: {'soutui-lab.language': 'zh'}});
  assert.equal(r.document.documentElement.lang, 'en');
  assert.equal(r.storage.size, 1, 'opening the reader must not create a completion mark');
  assert.doesNotThrow(() => runtime({blocked: true}));
});

test('a concept filter updates visible lessons, phases and its announced count', () => {
  const card = text => element({dataset: {search: text}, querySelector: () => element({hidden: true})});
  const cards = [card('26 BM25 lexical ranking'), card('42 TinyBERT reranking')];
  const phases = cards.map(row => element({querySelectorAll: () => [row]}));
  const box = element({hidden: true}), filter = element({closest: () => box});
  const r = runtime({cards, phases, filter});
  assert.equal(box.hidden, false);
  assert.equal(r.filterStatus.textContent, '2 of 2 lessons');
  filter.value = 'tinybert'; filter.listeners.input();
  assert.deepEqual(cards.map(row => row.hidden), [true, false]);
  assert.deepEqual(phases.map(row => row.hidden), [true, false]);
  filter.value = 'absent concept'; filter.listeners.input();
  assert.equal(r.empty.hidden, false);
  filter.value = ''; filter.listeners.input();
  assert.equal(r.filterStatus.textContent, '2 of 2 lessons');
});

test('completion is explicit, reversible and shared across language editions', () => {
  const complete = element({dataset: {target: 'common_31'}, hidden: true});
  const en = runtime({complete});
  assert.equal(en.storage.size, 0);
  complete.listeners.click();
  assert.equal(complete.attributes['aria-pressed'], 'true');
  const cnButton = element({dataset: {target: 'common_31'}});
  const zh = runtime({lang: 'zh-CN', complete: cnButton, saved: Object.fromEntries(en.storage)});
  assert.equal(cnButton.textContent, '已学 · 撤销');
  cnButton.listeners.click();
  assert.deepEqual(JSON.parse(zh.storage.get('sra-public-progress-v1')), {});
  const blockedButton = element({dataset: {target: 'common_31'}});
  const blocked = runtime({blocked: true, complete: blockedButton});
  blockedButton.listeners.click();
  assert.match(blocked.status.textContent, /storage is unavailable/);
});

test('copy uses literal displayed code and does not execute it', async () => {
  const code = element({textContent: 'print("<script>not HTML</script>")\n'});
  const button = element({dataset: {copyCode: 'code-1'}, code, hidden: true});
  const r = runtime({copy: [button]});
  assert.equal(button.hidden, false);
  await button.listeners.click();
  assert.deepEqual(r.clipboard, [code.textContent]);
  assert.equal(button.textContent, 'Copied');
});
