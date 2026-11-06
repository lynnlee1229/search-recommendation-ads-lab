/* Resolve links against the actual source notebook, preserving local reading paths. */
(function (global) {
  'use strict';
  function lessonLink(href, lesson, language) {
    if (!href || href.startsWith('#')) return href;
    if (href.startsWith('/notebooks?')) {
      const url=new URL(href,'http://localhost');
      const target=url.searchParams.get('target');
      if(target)return `/learn/${encodeURIComponent(target)}?lang=${language}${url.hash}`;
      return href;
    }
    // External URLs and workbench-root paths already have an explicit destination.
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href)) return href;
    const source=new URL(href,lesson.source_url);
    const file=decodeURIComponent(source.pathname.split('/').at(-1));
    const reader=lesson.notebook_links?.[file];
    if (reader && file.endsWith('.ipynb')) {
      const url=new URL(reader,'http://localhost');
      url.searchParams.set('lang',language);
      return url.pathname+url.search+source.hash;
    }
    return source.href;
  }
  // This only selects a supported output format; DOMPurify performs the sanitization.
  function isPandasTableCandidate(value) {
    const html=String(value);
    if((html.match(/<table\b/gi)||[]).length!==1)return false;
    if(!/<table\b[^>]*\bclass\s*=\s*["'][^"']*\bdataframe\b[^"']*["']/i.test(html))return false;
    if(/<(?:script|iframe|object|embed|svg|math|img|link|meta|base|form|input|textarea|button)\b/i.test(html))return false;
    if(/<[^>]+\son[a-z]+\s*=/i.test(html))return false;
    return true;
  }
  global.ReaderUtils={lessonLink,isPandasTableCandidate};
})(globalThis);
