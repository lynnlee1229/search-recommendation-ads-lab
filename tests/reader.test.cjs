const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({URL});
vm.runInContext(fs.readFileSync('web/reader-utils.js','utf8'),context);
const {lessonLink,isPandasTableCandidate}=context.ReaderUtils;
const source='https://github.com/lynnlee1229/search-recommendation-ads-lab/blob/main/notebooks/';
const english={source_url:source+'en/25_Search_Task_Qrels.ipynb',notebook_links:{'26_Search_BM25.ipynb':'/learn/search_bm25?lang=en'}};
test('bare and dot-relative notebook links use the local reader in the current language',()=>{
  assert.equal(lessonLink('26_Search_BM25.ipynb',english,'en'),'/learn/search_bm25?lang=en');
  assert.equal(lessonLink('./26_Search_BM25.ipynb',english,'zh'),'/learn/search_bm25?lang=zh');
  assert.equal(lessonLink('../26_Search_BM25.ipynb#section-2',english,'en'),'/learn/search_bm25?lang=en#section-2');
});
test('documentation and source links resolve from the actual notebook directory',()=>{
  assert.equal(lessonLink('../../docs/XMREC_REPRODUCTION.md',english,'en'),source.replace('notebooks/','')+'docs/XMREC_REPRODUCTION.md');
  assert.equal(lessonLink('../../reclab/search.py',english,'en'),source.replace('notebooks/','')+'reclab/search.py');
  const chinese={source_url:source+'25_Search_Task_Qrels.ipynb'};
  assert.equal(lessonLink('../docs/SEARCH_COURSE.md',chinese,'zh'),source.replace('notebooks/','')+'docs/SEARCH_COURSE.md');
  assert.equal(lessonLink('Unmapped.ipynb',english,'en'),source+'en/Unmapped.ipynb');
});
test('external original sources and page anchors are not redirected',()=>{
  assert.equal(lessonLink('https://example.org/26_Search_BM25.ipynb',english,'en'),'https://example.org/26_Search_BM25.ipynb');
  assert.equal(lessonLink('#section-3',english,'en'),'#section-3');
});
test('only one identifiable pandas table is eligible for sanitized rich output',()=>{
  const safe='<div><style scoped>.dataframe td {text-align:right}</style><table class="dataframe"><thead><tr><th>model</th><th>score</th></tr></thead><tbody><tr><td>BM25</td><td>0.7</td></tr></tbody></table></div>';
  assert.ok(isPandasTableCandidate(safe));
  assert.ok(!isPandasTableCandidate('<p>ordinary HTML output</p>'));
  assert.ok(!isPandasTableCandidate('<table><tr><td>Unidentified</td></tr></table>'));
  assert.ok(!isPandasTableCandidate(safe+safe));
  for(const unsafe of [safe+'<script>alert(1)</script>',safe.replace('<td>BM25','<td onclick="alert(1)">BM25'),safe+'<iframe src="about:blank"></iframe>',safe+'<img src=x onerror=alert(1)>'])assert.ok(!isPandasTableCandidate(unsafe));
});
