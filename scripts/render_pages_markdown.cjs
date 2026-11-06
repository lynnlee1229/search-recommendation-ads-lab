/* Build-only Markdown parsing. Python applies an allowlist before writing HTML. */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({marked: require(path.join(root, 'web/vendor/marked.min.js'))});
vm.runInContext(fs.readFileSync(path.join(root, 'web/markdown.js'), 'utf8'), context);
const sources = JSON.parse(fs.readFileSync(0, 'utf8'));
if (!Array.isArray(sources) || sources.some(source => typeof source !== 'string')) throw Error('Expected Markdown strings');
process.stdout.write(JSON.stringify(sources.map(source => context.LabMarkdown.parse(source))));
