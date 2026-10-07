// Builds a product page into one self-contained index.html.
// Usage: node build.mjs <page-folder> [--artifact]
// --artifact also writes artifact.html: the same page without the doctype/html/head/body
// wrapper, for publishing as a claude.ai Artifact (the host adds its own wrapper).
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const page = process.argv[2];
const artifact = process.argv.includes('--artifact');
if (!page) {
  console.error('usage: node build.mjs <page-folder> [--artifact]');
  process.exit(1);
}
const dir = path.resolve(import.meta.dirname, page);

const out = await build({
  entryPoints: [path.join(dir, 'src/app.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'eof',
  write: false,
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

let html = await fs.readFile(path.join(dir, 'src/index.html'), 'utf8');
const types = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
const cache = new Map();
for (const [, file] of html.matchAll(/\{\{img:([\w.-]+)\}\}/g)) {
  if (cache.has(file)) continue;
  const buf = await fs.readFile(path.join(dir, 'img', file));
  cache.set(file, `data:${types[path.extname(file).slice(1)]};base64,${buf.toString('base64')}`);
}
const finish = (doc) => doc
  .replace(/\{\{img:([\w.-]+)\}\}/g, (_, file) => cache.get(file))
  .replace('<!--APP-->', () => `<script>${js}</script>`);

const write = async (name, doc) => {
  await fs.writeFile(path.join(dir, name), doc);
  console.log(`${page}/${name}  ${(Buffer.byteLength(doc) / 1024).toFixed(0)} KB`);
};
await write('index.html', finish(html));

if (artifact) {
  // Strip the document wrapper from the template (before scripts are inlined) and carry
  // any <body> classes over with a one-line script.
  const bare = html
    .replace(/<!doctype html>\s*/i, '')
    .replace(/<html[^>]*>\s*/i, '')
    .replace(/<\/?head>\s*/gi, '')
    .replace(/<meta charset[^>]*>\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<body([^>]*)>/i, (_, attrs) => {
      const cls = /class="([^"]*)"/.exec(attrs)?.[1];
      return cls ? `<script>document.body.classList.add(${cls.trim().split(/\s+/).map((c) => JSON.stringify(c)).join(',')})</script>` : '';
    })
    .replace(/<\/body>\s*<\/html>\s*$/i, '\n');
  await write('artifact.html', finish(bare));
}
