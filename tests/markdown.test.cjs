const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({marked:require('../web/vendor/marked.min.js')});
vm.runInContext(fs.readFileSync('web/markdown.js','utf8'),context);
const parse=context.LabMarkdown.parse;
test('TeX backslashes, subscripts and inequality signs survive Markdown for KaTeX',()=>{
  const text=String.raw`For $x_i < y_j$ and \(\nabla_\theta L\), use:

\[
\sum_i x_i^2
\]
`;
  const html=parse(text);
  assert.match(html,/class="math-inline">\\\(x_i &lt; y_j\\\)/);
  assert.ok(html.includes(String.raw`\(\nabla_\theta L\)`));
  assert.ok(html.includes(String.raw`$$
\sum_i x_i^2
$$`));
  assert.ok(!html.includes('<em>'));
});
test('code fences and inline code stay code, including dollar delimiters',()=>{
  const html=parse('```python\nprint("$x_i$")\n```\n\n`$literal$`');
  assert.ok(html.includes('class="language-python"'));
  assert.ok(html.includes('<code>$literal$</code>'));
  assert.ok(!html.includes('math-inline'));
});
test('math tokenization escapes HTML before the sanitizer runs',()=>{
  const html=parse('$<img src=x onerror=alert(1)>$');
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img'));
});
