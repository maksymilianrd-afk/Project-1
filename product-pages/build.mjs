// Builds a product page into one self-contained index.html.
// Usage: node build.mjs <page-folder>
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const page = process.argv[2];
if (!page) {
  console.error('usage: node build.mjs <page-folder>');
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
html = html.replace(/\{\{img:([\w.-]+)\}\}/g, (_, file) => cache.get(file));
html = html.replace('<!--APP-->', () => `<script>${js}</script>`);

await fs.writeFile(path.join(dir, 'index.html'), html);
console.log(`${page}/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
