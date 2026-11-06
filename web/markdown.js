/* TeX is tokenized before Markdown; the result is sanitized before touching the DOM. */
(function (global) {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parser=new global.marked.Marked();
  parser.use({extensions:[
    {name:'labMathBlock',level:'block',start:src=>src.search(/\$\$|\\\[/),tokenizer(src){
      const match=/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])(?:\n|$)/.exec(src);
      if(match)return {type:'labMathBlock',raw:match[0],text:match[1]??match[2]};
    },renderer:token=>`<div class="math-block">$$${esc(token.text)}$$</div>`},
    {name:'labMathInline',level:'inline',start:src=>src.search(/\$|\\\(/),tokenizer(src){
      const match=/^(?:\$([^\n$]+?)\$(?!\$)|\\\(([\s\S]+?)\\\))/.exec(src);
      if(match)return {type:'labMathInline',raw:match[0],text:match[1]??match[2]};
    },renderer:token=>`<span class="math-inline">\\(${esc(token.text)}\\)</span>`}
  ]});
  const parse = source => parser.parse(source);
  function render(source) {
    return global.DOMPurify.sanitize(parse(source),{
      FORBID_TAGS:['style','iframe','form','input','button','textarea'],FORBID_ATTR:['style']
    });
  }
  global.LabMarkdown={parse,render};
})(globalThis);
