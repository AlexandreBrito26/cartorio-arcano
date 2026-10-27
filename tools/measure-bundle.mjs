// Uso: npm run build && node tools/measure-bundle.mjs
// Lista cada JS de dist/assets com tamanho bruto e gzip, e marca o que o HTML carrega no primeiro paint.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const dir = 'dist/assets';
const html = readFileSync('dist/index.html', 'utf8');
const rows = readdirSync(dir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => {
    const buf = readFileSync(`${dir}/${f}`);
    return { f, raw: statSync(`${dir}/${f}`).size, gz: gzipSync(buf, { level: 9 }).length, initial: html.includes(f) };
  })
  .sort((a, b) => b.gz - a.gz);

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' KB';
let initial = 0;
for (const r of rows) {
  if (r.initial) initial += r.gz;
  console.log(`${r.initial ? '*' : ' '} ${r.f.padEnd(40)} raw ${kb(r.raw)}  gzip ${kb(r.gz)}`);
}
console.log(`\n* = carregado no primeiro paint. Total gzip inicial: ${(initial / 1024).toFixed(1)} KB (meta: < 300 KB)`);
